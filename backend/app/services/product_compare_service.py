"""
Product comparison for ``compare_store_products``.

* **Mock** — deterministic ``MOCK_PRODUCTS`` rows keyed by mock ``storeId`` values.
* **Hybrid** — live / Places ``store_id`` values (unknown to mock fixtures) resolve to the
  best-matching mock retailer's SKU list (cloned rows, ``source`` = ``mock``), using
  ``run_nearby_stores_lookup`` for store labels when a ZIP is available.

Set ``NUTRICART_PRODUCT_SOURCE=mock`` to disable hybrid expansion (fixture store ids only).
"""

from __future__ import annotations

import copy
import logging
import os
import re
from typing import Any, Literal

from data.mock_stores import MOCK_STORES
from data.mock_products import MOCK_PRODUCTS

from app.models.schemas import Product

logger = logging.getLogger(__name__)

CompareResolverMode = Literal["mock", "hybrid", "live"]
SkuSource = Literal["live", "mock"]


def _force_fixture_catalog_only() -> bool:
    return (os.getenv("NUTRICART_PRODUCT_SOURCE") or "").strip().lower() == "mock"


def _tokens(text: str) -> list[str]:
    return [t for t in re.findall(r"[a-z0-9]+", text.lower()) if len(t) >= 2]


def _best_mock_store_id_for_label(label: str) -> str:
    """Pick the mock ``storeId`` whose name tokens overlap the live label the most."""
    head = (label or "").split("—")[0].strip()
    toks = set(_tokens(head))
    best = str(MOCK_STORES[0]["id"])
    best_score = -1
    for row in MOCK_STORES:
        nm = str(row.get("name", "")).split("—")[0].strip()
        rt = set(_tokens(nm))
        score = len(toks & rt) if toks else 0
        if not toks:
            hl, nl = head.lower(), nm.lower()
            if "target" in hl and "target" in nl:
                score = 2
            elif "walmart" in hl and "walmart" in nl:
                score = 2
            elif "trader" in hl and "trader" in nl:
                score = 2
            elif "safeway" in hl and "safeway" in nl:
                score = 2
        if score > best_score:
            best_score = score
            best = str(row["id"])
    return best


def _store_labels_for_zip(zip_code: str) -> dict[str, str]:
    from app.services.store_lookup import run_nearby_stores_lookup

    z = (zip_code or "").strip()
    if not z:
        return {}
    try:
        res = run_nearby_stores_lookup(z, limit=60)
        return {c.id: c.name for c in res.candidates}
    except Exception as exc:
        logger.warning("product_compare: run_nearby_stores_lookup failed zip=%s: %s", z, exc)
        return {}


def _build_catalog_rows(
    ordered: list[str],
    *,
    labels_map: dict[str, str],
    force_fixture_only: bool,
) -> tuple[list[dict[str, Any]], CompareResolverMode, set[str]]:
    """
    Build a unified MOCK_PRODUCTS-derived row list covering every ``store_id`` in ``ordered``.

    Fixture ids (known to ``get_store_by_id``) use native mock rows. Unknown ids clone the
    best-matching mock retailer's catalog and re-key ``storeId`` / ``id`` for the live id.
    """
    from app.services.store_service import get_store_by_id

    fixture_set = {sid for sid in ordered if get_store_by_id(sid) is not None}
    unknown = [sid for sid in ordered if sid not in fixture_set]

    rows: list[dict[str, Any]] = []
    for r in MOCK_PRODUCTS:
        sid = str(r.get("storeId", ""))
        if sid in fixture_set:
            rows.append(copy.deepcopy(r))

    hybrid_used = False
    hybrid_store_ids: set[str] = set()
    if unknown and not force_fixture_only:
        hybrid_used = True
        hybrid_store_ids = set(unknown)
        for sid in unknown:
            label = labels_map.get(sid)
            if not label:
                logger.info(
                    "product_compare hybrid: no label in zip lookup for store_id=%s — using generic name match",
                    sid,
                )
            tmpl = _best_mock_store_id_for_label(label or "grocery store")
            n = 0
            sid_suffix = re.sub(r"[^\w]+", "_", sid).strip("_")[:48] or "live"
            for r in MOCK_PRODUCTS:
                if str(r.get("storeId", "")) != tmpl:
                    continue
                base = copy.deepcopy(r)
                pid = str(base["id"])
                base["id"] = f"{pid}__{sid_suffix}"
                base["storeId"] = sid
                rows.append(base)
                n += 1
            logger.info(
                "product_compare hybrid: store_id=%s template_mock_store=%s cloned_skus=%s",
                sid,
                tmpl,
                n,
            )
    elif unknown and force_fixture_only:
        logger.warning(
            "product_compare: NUTRICART_PRODUCT_SOURCE=mock — skipping unknown store ids %s",
            unknown,
        )

    mode: CompareResolverMode = "hybrid" if hybrid_used else "mock"
    logger.info(
        "product_compare: catalog_rows=%s resolver_mode=%s fixture_stores=%s hybrid_targets=%s",
        len(rows),
        mode,
        sorted(fixture_set),
        unknown if hybrid_used else [],
    )
    return rows, mode, hybrid_store_ids


def _row_to_product(row: dict[str, Any], *, sku_source: SkuSource = "mock") -> Product:
    return Product(
        id=str(row["id"]),
        name=str(row["name"]),
        store_id=str(row["storeId"]),
        price_usd=float(row.get("price", 0)),
        in_stock=bool(row.get("available", True)),
        category=str(row.get("category", "")),
        source=sku_source,
        diet_type=row.get("dietType"),
        risky_tags=list(row.get("riskyTags") or []),
        nutrition_tags=list(row.get("nutritionTags") or []),
        calories=row.get("calories"),
        protein_g=float(row["protein"]) if row.get("protein") is not None else None,
        fiber_g=float(row["fiber"]) if row.get("fiber") is not None else None,
        carbs_g=float(row["carbs"]) if row.get("carbs") is not None else None,
    )


def _product_dict(row: dict[str, Any], *, sku_source: SkuSource, resolver_tag: str) -> dict[str, Any]:
    pd = _row_to_product(row, sku_source=sku_source).model_dump(mode="json")
    pd["source"] = sku_source
    pd["source_type"] = resolver_tag
    return pd


def _vegetarian_pref(diet_type: str | None) -> bool:
    if not diet_type:
        return False
    d = diet_type.lower()
    return "veg" in d and "non" not in d and "omni" not in d


def _risk_blocks_row(row: dict[str, Any], risky_foods: list[str]) -> bool:
    tags = [str(t).lower() for t in (row.get("riskyTags") or [])]
    for rf in risky_foods:
        r = str(rf).lower().strip()
        if not r:
            continue
        for t in tags:
            if r in t or t in r:
                return True
    return False


def _row_matches_intent(row: dict[str, Any], tokens: list[str]) -> bool:
    if not tokens:
        return True
    blob = " ".join(
        [
            str(row.get("name", "")).lower(),
            str(row.get("category", "")).lower(),
            " ".join(str(x).lower() for x in (row.get("nutritionTags") or [])),
        ]
    )
    return any(tok in blob for tok in tokens)


def _row_matches_cuisine(row: dict[str, Any], cuisine: str | None) -> bool:
    if not (cuisine or "").strip():
        return True
    tokens = _tokens(cuisine)
    if not tokens:
        return True
    return _row_matches_intent(row, tokens)


def _filter_rows(
    rows: list[dict[str, Any]],
    *,
    intent_keywords: str | None,
    category_hint: str | None,
    diet_type: str | None,
    risky_foods: list[str] | None,
    cuisine_preference: str | None,
) -> list[dict[str, Any]]:
    risky = [str(x) for x in (risky_foods or []) if str(x).strip()]
    veg = _vegetarian_pref(diet_type)
    hint = " ".join(x for x in (intent_keywords or "", category_hint or "") if x).strip()
    tokens = _tokens(hint)

    out: list[dict[str, Any]] = []
    for row in rows:
        if not bool(row.get("available", True)):
            continue
        if veg and str(row.get("dietType", "")).lower() == "nonveg":
            continue
        if _risk_blocks_row(row, risky):
            continue
        if not _row_matches_cuisine(row, cuisine_preference):
            continue
        if not _row_matches_intent(row, tokens):
            continue
        out.append(row)
    return out


def _substitutes_for(
    pool: list[dict[str, Any]],
    row: dict[str, Any],
    *,
    hybrid_store_ids: set[str],
    sku_source: SkuSource,
    max_alt: int = 1,
) -> list[dict[str, Any]]:
    """Same category, different id, lower price when possible (demo)."""
    cid = str(row.get("id"))
    cat = str(row.get("category", "")).lower()
    price = float(row.get("price", 0))
    sid = str(row.get("storeId", ""))
    alts: list[dict[str, Any]] = []
    for other in pool:
        if str(other.get("id")) == cid:
            continue
        if str(other.get("category", "")).lower() != cat:
            continue
        op = float(other.get("price", 0))
        if op < price or (op <= price * 1.05 and str(other.get("storeId")) != sid):
            o_sid = str(other.get("storeId", ""))
            row_tag = "hybrid" if o_sid in hybrid_store_ids else "mock"
            alt_p = _product_dict(other, sku_source=sku_source, resolver_tag=row_tag)
            alts.append(
                {
                    "for_product_id": cid,
                    "reason": "lower_unit_price" if op < price else "similar_price_other_store",
                    "product": alt_p,
                }
            )
        if len(alts) >= max_alt:
            break
    return alts


def _greedy_basket(
    pool: list[dict[str, Any]],
    budget_usd: float | None,
    *,
    basket_source_type: str,
) -> dict[str, Any] | None:
    if not pool:
        return None
    cap = float(budget_usd) * 0.42 if budget_usd and budget_usd > 0 else 32.0
    cap = min(max(cap, 8.0), 85.0)
    sorted_rows = sorted(pool, key=lambda r: float(r.get("price", 999)))
    items: list[dict[str, Any]] = []
    seen_cat: set[str] = set()
    sub = 0.0
    for row in sorted_rows:
        cat = str(row.get("category", "misc")).lower()
        if cat in seen_cat and len(items) >= 4:
            continue
        p = float(row.get("price", 0))
        if sub + p > cap:
            continue
        pr = _row_to_product(row, sku_source="mock")
        d = pr.model_dump(mode="json")
        d["source"] = "mock"
        d["source_type"] = basket_source_type
        items.append(
            {
                "product_id": d["id"],
                "name": d["name"],
                "quantity": 1,
                "line_total_usd": round(p, 2),
            }
        )
        seen_cat.add(cat)
        sub += p
        if len(items) >= 7:
            break
    if not items:
        return None
    return {
        "id": "demo_best_value_mix",
        "label": "Best-value basket (demo heuristic)",
        "subtotal_usd": round(sub, 2),
        "items": items,
        "source_type": basket_source_type,
        "notes": "Picks low unit prices across categories; not an optimized MILP — swap for live pricing later.",
    }


def run_compare_store_products(
    store_ids: list[str],
    *,
    intent_keywords: str | None = None,
    category_hint: str | None = None,
    diet_type: str | None = None,
    risky_foods: list[str] | None = None,
    budget_usd: float | None = None,
    cuisine_preference: str | None = None,
    max_products_per_store: int = 14,
    user_zip_code: str | None = None,
) -> dict[str, Any]:
    ordered: list[str] = []
    for x in store_ids:
        s = str(x).strip()
        if s and s not in ordered:
            ordered.append(s)
    if not ordered:
        return {
            "tool": "compare_store_products",
            "sourceType": "mock",
            "storeIds": [],
            "productsByStore": [],
            "substitutes": [],
            "basketCandidates": [],
            "comparisonSummary": "No store ids provided.",
            "summary": "No store ids provided.",
            "per_store": {},
        }

    force_fixture = _force_fixture_catalog_only()
    labels_map = _store_labels_for_zip(user_zip_code or "")
    base_rows, resolver_mode, hybrid_store_ids = _build_catalog_rows(
        ordered, labels_map=labels_map, force_fixture_only=force_fixture
    )
    id_set = set(ordered)

    filtered = _filter_rows(
        base_rows,
        intent_keywords=intent_keywords,
        category_hint=category_hint,
        diet_type=diet_type,
        risky_foods=risky_foods,
        cuisine_preference=cuisine_preference,
    )
    if not filtered and base_rows:
        filtered = _filter_rows(
            base_rows,
            intent_keywords=None,
            category_hint=None,
            diet_type=diet_type,
            risky_foods=risky_foods,
            cuisine_preference=cuisine_preference,
        )
    if not filtered and base_rows:
        risky = [str(x) for x in (risky_foods or []) if str(x).strip()]
        veg = _vegetarian_pref(diet_type)
        filtered = [
            r
            for r in base_rows
            if bool(r.get("available", True))
            and (not veg or str(r.get("dietType", "")).lower() != "nonveg")
            and not _risk_blocks_row(r, risky)
        ]

    by_store: dict[str, list[dict[str, Any]]] = {sid: [] for sid in id_set}
    for r in filtered:
        sid = str(r.get("storeId", ""))
        if sid in by_store:
            by_store[sid].append(r)

    from app.services.store_service import get_store_by_id

    products_by_store: list[dict[str, Any]] = []
    per_store: dict[str, Any] = {}
    lines: list[str] = []

    for sid in ordered:
        rows = sorted(by_store.get(sid, []), key=lambda x: float(x.get("price", 0)))[:max_products_per_store]
        prices = [float(x["price"]) for x in rows if x.get("price") is not None]
        avg = round(sum(prices) / len(prices), 2) if prices else 0.0
        st = get_store_by_id(sid)
        if st:
            label = st.name.split("—")[0].strip()[:56]
            store_name = st.name
        else:
            store_name = labels_map.get(sid, sid)
            label = store_name.split("—")[0].strip()[:56] if store_name else sid
        prods: list[dict[str, Any]] = []
        for r in rows:
            r_sid = str(r.get("storeId", ""))
            row_tag = "hybrid" if r_sid in hybrid_store_ids else "mock"
            prods.append(_product_dict(r, sku_source="mock", resolver_tag=row_tag))
        products_by_store.append(
            {
                "store_id": sid,
                "store_name": store_name,
                "avg_price_usd": avg,
                "product_count": len(rows),
                "products": prods,
            }
        )
        sample = ", ".join(str(x.get("name", "")) for x in rows[:4])
        lines.append(f"{label}: {len(rows)} SKUs, ~${avg} avg — {sample or 'n/a'}")
        per_store[sid] = {
            "label": label,
            "avg_price_usd": avg,
            "sku_count": len(rows),
            "sample_product_names": [x.get("name") for x in rows[:6]],
        }

    pool = [r for r in filtered if str(r.get("storeId", "")) in id_set]
    substitutes: list[dict[str, Any]] = []
    seen_sub_for: set[str] = set()
    for row in sorted(pool, key=lambda x: float(x.get("price", 0)))[:12]:
        cid = str(row.get("id"))
        if cid in seen_sub_for:
            continue
        for alt in _substitutes_for(pool, row, hybrid_store_ids=hybrid_store_ids, sku_source="mock", max_alt=1):
            substitutes.append(alt)
            seen_sub_for.add(cid)
            break
        if len(substitutes) >= 8:
            break

    basket_candidates: list[dict[str, Any]] = []
    b = _greedy_basket(pool, budget_usd, basket_source_type=resolver_mode)
    if b:
        basket_candidates.append(b)

    summary = " | ".join(lines)[:900]
    if not pool:
        comparison = "No in-stock products matched these stores under the current filters (demo catalog)."
    else:
        comparison = summary

    top_source: CompareResolverMode = resolver_mode
    logger.info(
        "product_compare: done sourceType=%s stores=%s sku_rows=%s filtered=%s",
        top_source,
        len(ordered),
        len(base_rows),
        len(filtered),
    )

    return {
        "tool": "compare_store_products",
        "sourceType": top_source,
        "storeIds": ordered,
        "intentKeywords": (intent_keywords or "").strip() or None,
        "dietType": diet_type,
        "riskyFoods": risky_foods or [],
        "budgetUsd": budget_usd,
        "cuisinePreference": cuisine_preference,
        "productsByStore": products_by_store,
        "substitutes": substitutes[:12],
        "basketCandidates": basket_candidates,
        "comparisonSummary": comparison,
        "summary": summary,
        "per_store": per_store,
    }
