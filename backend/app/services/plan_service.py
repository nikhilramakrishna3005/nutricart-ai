"""Mock planning pipeline: filter catalog, assemble basket, attach meal ideas."""

from __future__ import annotations

import re
from typing import Literal, NamedTuple

from data.mock_meals import MOCK_MEALS
from data.mock_products import MOCK_PRODUCTS

from app.models.schemas import (
    BasketItem,
    GroceryBasket,
    MealPlan,
    NutritionSummary,
    PlanRefineRequest,
    PlanRequest,
    PlanResponse,
    Product,
    Store,
)
from app.services.store_service import get_store_by_id, list_stores_near_zip


def _product_from_row(row: dict) -> Product:
    return Product(
        id=row["id"],
        name=row["name"],
        store_id=row["storeId"],
        price_usd=float(row["price"]),
        in_stock=bool(row["available"]),
        category=row["category"],
        diet_type=row.get("dietType"),
        risky_tags=list(row.get("riskyTags") or []),
        nutrition_tags=list(row.get("nutritionTags") or []),
        calories=row.get("calories"),
        protein_g=float(row["protein"]) if row.get("protein") is not None else None,
        fiber_g=float(row["fiber"]) if row.get("fiber") is not None else None,
        carbs_g=float(row["carbs"]) if row.get("carbs") is not None else None,
    )


def _catalog() -> list[Product]:
    return [_product_from_row(r) for r in MOCK_PRODUCTS]


def _risk_overlap(user_risks: list[str], tags: list[str]) -> bool:
    risks = {r.lower().strip() for r in user_risks if r.strip()}
    tset = {t.lower() for t in tags}
    for r in risks:
        if r in tset:
            return True
        for t in tset:
            if r in t or t in r:
                return True
    return False


def _filter_products(
    req: PlanRequest,
    extra_keywords: list[str] | None = None,
    *,
    only_in_stock: bool = True,
) -> list[Product]:
    products = _catalog()
    if only_in_stock:
        products = [p for p in products if p.in_stock]
    if req.diet == "vegetarian":
        products = [p for p in products if (p.diet_type or "both") in ("veg", "both")]
    keywords = [k.lower() for k in (extra_keywords or []) if k]
    if keywords:
        products = [
            p
            for p in products
            if any(
                k in p.name.lower()
                or k in p.category.lower()
                or any(k in t.lower() for t in p.nutrition_tags)
                for k in keywords
            )
        ] or products
    for bad in req.risky_foods:
        products = [
            p
            for p in products
            if bad.lower() not in p.name.lower() and not _risk_overlap([bad], p.risky_tags)
        ]
    return products


def _rank_stores_open_first(stores: list[Store]) -> list[Store]:
    return sorted(stores, key=lambda s: (not s.is_open, s.distance_miles))


def _grocery_message_hints(message: str) -> tuple[list[str], frozenset[str]]:
    """
    Deterministic hints from free text: extra product keywords + sort flags.
    Structured `req.diet` still wins for hard diet filtering.
    """
    m = message.lower()
    kw: list[str] = []
    flags: set[str] = set()

    if re.search(r"\bpasta\b|spaghetti|penne|marinara|noodle", m):
        kw.extend(["pasta", "marinara", "penne", "spaghetti", "sauce"])
        flags.add("pasta")
    if re.search(r"vegetarian|veggie|meatless|plant[- ]based|no meat", m):
        kw.extend(["tofu", "spinach", "lentil", "beans"])
        flags.add("vegetarian_msg")
    if re.search(r"\bdinner\b|supper|evening meal", m):
        kw.extend(["chicken", "salmon", "pasta", "rice"])
        flags.add("dinner")
    if re.search(r"high[- ]protein|protein[- ]rich|gains|lifting|gym", m):
        kw.extend(["yogurt", "chicken", "eggs", "tofu", "cottage", "protein"])
        flags.add("high_protein")
    if re.search(r"budget|cheap|affordable|stretch|save money|low cost", m):
        flags.add("budget")
    if re.search(r"\bindian\b|masala|tikka|curry|dal|naan|samosa", m):
        kw.extend(["masala", "dal", "naan", "tikka", "curry", "indian"])
        flags.add("indian")

    seen: set[str] = set()
    deduped: list[str] = []
    for k in kw:
        k2 = k.lower().strip()
        if k2 and k2 not in seen:
            seen.add(k2)
            deduped.append(k2)
    return deduped, frozenset(flags)


def _product_text_blob(p: Product) -> str:
    parts = [p.name, p.category, " ".join(p.nutrition_tags)]
    return " ".join(parts).lower()


def _keyword_hit_score(p: Product, keywords: list[str]) -> int:
    blob = _product_text_blob(p)
    return sum(1 for k in keywords if k and k in blob)


def _sort_products_for_basket(products: list[Product], keywords: list[str], flags: frozenset[str]) -> list[Product]:
    def key_budget(p: Product) -> tuple:
        hits = _keyword_hit_score(p, keywords)
        return (-hits, p.price_usd, p.name)

    def key_protein(p: Product) -> tuple:
        hits = _keyword_hit_score(p, keywords)
        pr = p.protein_g or 0.0
        return (-hits, -pr, p.price_usd)

    def key_default(p: Product) -> tuple:
        hits = _keyword_hit_score(p, keywords)
        return (-hits, -p.price_usd)

    if "budget" in flags:
        return sorted(products, key=key_budget)
    if "high_protein" in flags:
        return sorted(products, key=key_protein)
    return sorted(products, key=key_default)


def _pick_basket(products: list[Product], budget: float) -> GroceryBasket:
    items: list[BasketItem] = []
    total = 0.0
    for p in products:
        line = round(p.price_usd * 1, 2)
        if total + line > budget:
            continue
        items.append(
            BasketItem(
                product_id=p.id,
                name=p.name,
                quantity=1,
                line_total_usd=line,
            )
        )
        total += line
        if total >= budget * 0.85:
            break
    if not items and products:
        p = products[0]
        items.append(
            BasketItem(product_id=p.id, name=p.name, quantity=1, line_total_usd=p.price_usd)
        )
        total = p.price_usd
    return GroceryBasket(items=items, subtotal_usd=round(total, 2))


def _meal_matches_cuisine(template: dict, cuisine: str) -> bool:
    c = cuisine.lower()
    pref = str(template.get("cuisinePreference", "")).lower()
    if not pref:
        return False
    if pref in c or c in pref:
        return True
    return any(tok and tok in c for tok in pref.replace("-", " ").split())


def _meal_ok_for_diet(
    template: dict, diet: Literal["vegetarian", "non_veg", "either"]
) -> bool:
    dt = str(template.get("dietType", "both")).lower()
    if diet == "vegetarian":
        return dt in ("veg", "both")
    return True


def _meal_plans_from_basket(
    cuisine: str,
    basket: GroceryBasket,
    diet: Literal["vegetarian", "non_veg", "either"],
    *,
    max_plans: int = 3,
    min_plans: int = 2,
) -> list[MealPlan]:
    names = ", ".join(i.name for i in basket.items[:5]) or "your staples"
    matched = [m for m in MOCK_MEALS if _meal_matches_cuisine(m, cuisine) and _meal_ok_for_diet(m, diet)]
    if not matched:
        matched = [m for m in MOCK_MEALS if _meal_ok_for_diet(m, diet)]
    if not matched:
        matched = list(MOCK_MEALS)

    def _one(m: dict) -> MealPlan:
        ing = ", ".join(m.get("ingredients", [])[:6])
        cuisine = str(m.get("cuisinePreference", "") or "").strip()
        notes = f"Inspired by {cuisine} flavors." if cuisine else "Balanced for your current basket."
        return MealPlan(
            id=str(m["id"]),
            title=str(m["title"]),
            meals=[
                str(m.get("summary", "")),
                f"Uses your picks: {names}.",
                f"Pantry anchors: {ing}.",
            ],
            notes=notes,
        )

    seen: set[str] = set()
    candidates: list[dict] = []
    for m in matched:
        mid = str(m["id"])
        if mid not in seen:
            seen.add(mid)
            candidates.append(m)
    for m in MOCK_MEALS:
        mid = str(m["id"])
        if mid not in seen:
            seen.add(mid)
            candidates.append(m)

    take = max(min_plans, min(max_plans, len(candidates)))
    return [_one(m) for m in candidates[:take]]


def _fat_from_macros(cal: float, protein: float, carbs: float, fiber: float) -> float:
    accounted = 4 * protein + 4 * carbs + 2 * fiber
    remainder = max(0.0, cal - accounted)
    return round(min(cal * 0.4 / 9.0, remainder / 9.0), 1)


def _nutrition_from_basket(
    basket: GroceryBasket,
    by_id: dict[str, Product],
    days: int,
) -> NutritionSummary:
    if not basket.items:
        return NutritionSummary(
            score=55,
            calories_today=0,
            protein_g=0.0,
            carbs_g=0.0,
            fat_g=0.0,
            fiber_g=0.0,
            highlights=[
                "Nothing in stock matched those filters.",
                "Try a slightly higher budget or fewer exclusions, then ask again.",
            ],
        )

    d = max(1, days)
    tot_cal = tot_p = tot_c = tot_fib = 0.0
    for bi in basket.items:
        p = by_id.get(bi.product_id)
        if not p:
            continue
        q = bi.quantity
        tot_cal += float((p.calories or 0) * q)
        tot_p += float((p.protein_g or 0.0) * q)
        tot_c += float((p.carbs_g or 0.0) * q)
        tot_fib += float((p.fiber_g or 0.0) * q)

    daily_cal = int(round(tot_cal / d))
    daily_p = round(tot_p / d, 1)
    daily_c = round(tot_c / d, 1)
    daily_fib = round(tot_fib / d, 1)
    daily_fat = _fat_from_macros(float(daily_cal), daily_p, daily_c, daily_fib)

    score = int(max(55, min(95, 62 + daily_p + daily_fib * 2 + min(12, len(basket.items)))))

    hl: list[str] = []
    if daily_fib < 12:
        hl.append("Fibre is on the light side—add beans, oats, or greens when you shop.")
    elif daily_p < 45:
        hl.append("Protein is moderate—yogurt, tofu, or eggs would strengthen the week.")
    else:
        hl.append("Protein and carbs look balanced for easy home cooking.")

    if len(basket.items) >= 4:
        hl.append(f"{len(basket.items)} items in your basket leave room to swap without blowing the budget.")

    return NutritionSummary(
        score=score,
        calories_today=daily_cal,
        protein_g=daily_p,
        carbs_g=daily_c,
        fat_g=daily_fat,
        fiber_g=daily_fib,
        highlights=hl[:2],
    )


def nutrition_summary_for_plan(plan: PlanResponse, grocery_days: int) -> NutritionSummary:
    """Public helper: label rollup for a basket spread across `grocery_days` (used by explain/log UI)."""
    by_id = {p.id: p for p in _catalog()}
    return _nutrition_from_basket(plan.basket, by_id, max(1, grocery_days))


def _plan_groceries_headline(
    req: PlanRequest,
    basket: GroceryBasket,
    _flags: frozenset[str],
    _hint_keywords: list[str],
    stores: list[Store],
) -> str:
    days = req.grocery_days
    cap = req.budget_usd
    n = len(basket.items)
    sub = basket.subtotal_usd
    first = stores[0] if stores else None
    top = first.name.split("—")[0].strip() if first else "A nearby store"

    if n == 0:
        return (
            "I could not fill a basket with those filters.\n"
            "Try raising the budget slightly, relaxing diet, or choosing another store."
        )

    line1 = f"I found a grocery plan for the next {days} days within about ${cap:.0f}."
    line2 = f"Best match: {top}, with {n} core items in your basket."
    if sub < cap * 0.82:
        line3 = "Spend stays conservative, with room for produce or snacks."
    elif sub > cap * 0.92:
        line3 = "Spend sits near your cap; small swaps help if you add more."
    else:
        line3 = "This basket keeps cost sensible while covering the week."
    return f"{line1}\n{line2}\n{line3}"


def _plan_groceries_explanation() -> str:
    return (
        "Stores are ordered with open locations first, then distance. "
        "Items respect your diet and exclusions; your message steers what we emphasize."
    )


def _daily_insight_from_plan(
    nutrition: NutritionSummary,
    basket: GroceryBasket,
    req: PlanRequest,
) -> str:
    if not basket.items:
        return "The basket is empty. Loosen one filter or raise the budget slightly."
    if nutrition.fiber_g < 12:
        return "Fibre is the softer signal here. Add spinach, beans, or oats on your next shop."
    if nutrition.protein_g < 45:
        return "Protein is light for active days. Eggs, yogurt, or tofu would lift it."
    if basket.subtotal_usd < req.budget_usd * 0.55:
        return "You have budget left for a mid-week produce run or one extra protein."
    return "Macros look workable for simple dinners through the week."


class PlanGroceriesResult(NamedTuple):
    plan: PlanResponse
    nutrition_summary: NutritionSummary
    daily_insight: str
    explanation: str
    headline: str


def execute_plan_groceries(req: PlanRequest, message: str) -> PlanGroceriesResult:
    """Full `plan_groceries` path: stores, filters, basket, meals, nutrition, short copy."""
    hint_keywords, flags = _grocery_message_hints(message)
    merged_keywords = hint_keywords

    stores = _rank_stores_open_first(list_stores_near_zip(req.zip_code))
    pool = _filter_products(req, extra_keywords=merged_keywords or None, only_in_stock=True)
    if not pool:
        pool = _filter_products(req, extra_keywords=None, only_in_stock=True)

    ranked = _sort_products_for_basket(pool, hint_keywords, flags)
    basket = _pick_basket(ranked, req.budget_usd)

    in_basket_ids = {i.product_id for i in basket.items}
    recommended: list[Product] = []
    for p in ranked:
        if p.id in in_basket_ids:
            recommended.append(p)
    for p in ranked:
        if p.id not in in_basket_ids and len(recommended) < 12:
            recommended.append(p)

    meal_plans = _meal_plans_from_basket(req.cuisine, basket, req.diet, max_plans=3, min_plans=2)

    by_id = {p.id: p for p in _catalog()}
    nutrition = _nutrition_from_basket(basket, by_id, req.grocery_days)
    headline = _plan_groceries_headline(req, basket, flags, hint_keywords, stores)
    daily_insight = _daily_insight_from_plan(nutrition, basket, req)
    explanation = _plan_groceries_explanation()

    plan = PlanResponse(
        assistant_summary=headline,
        stores=stores,
        recommended_products=recommended,
        basket=basket,
        meal_plans=meal_plans,
    )
    return PlanGroceriesResult(
        plan=plan,
        nutrition_summary=nutrition,
        daily_insight=daily_insight,
        explanation=explanation,
        headline=headline,
    )


def _meal_plans(
    cuisine: str,
    basket: GroceryBasket,
    diet: Literal["vegetarian", "non_veg", "either"],
) -> list[MealPlan]:
    return _meal_plans_from_basket(cuisine, basket, diet, max_plans=3, min_plans=2)


RefinementKind = Literal[
    "cheaper",
    "avoid_dairy",
    "more_protein",
    "one_store",
    "veg_alternatives",
    "reduce_carbs",
    "none",
]


def normalize_plan_state(raw: dict) -> dict:
    """Map Chat / JSON camelCase keys onto `PlanResponse` snake_case fields."""
    if not raw:
        return {}
    d = dict(raw)
    if "meal_plans" not in d and "mealPlan" in d:
        d["meal_plans"] = d.get("mealPlan") or []
    if "recommended_products" not in d and "products" in d:
        d["recommended_products"] = d.get("products") or []
    return d


def plan_from_chat_state(raw: dict) -> PlanResponse | None:
    try:
        return PlanResponse.model_validate(normalize_plan_state(raw))
    except Exception:
        return None


def _detect_refinement(message: str) -> RefinementKind:
    m = message.lower()
    if re.search(r"\b(one store|single store|only one store|same store|from one store)\b", m):
        return "one_store"
    if re.search(r"\b(no dairy|avoid dairy|dairy[- ]free|without dairy|lactose[- ]free)\b", m):
        return "avoid_dairy"
    if re.search(
        r"\b(vegetarian alternative|veg alternative|meatless alternative|replace meat|show vegetarian)\b",
        m,
    ):
        return "veg_alternatives"
    if re.search(r"\b(fewer carbs|less carbs|lower carbs|reduce carbs?|low carb)\b", m):
        return "reduce_carbs"
    if re.search(r"\b(cheaper|less expensive|lower cost|save money|cut cost)\b", m):
        return "cheaper"
    if re.search(r"\b(more protein|extra protein|higher protein|boost protein)\b", m):
        return "more_protein"
    return "none"


def _is_dairy(p: Product) -> bool:
    tags = {t.lower() for t in p.risky_tags}
    if "dairy" in tags or "milk" in tags:
        return True
    n = p.name.lower()
    return any(
        w in n
        for w in (
            "yogurt",
            "milk",
            "cheese",
            "cottage",
            "butter",
            "cream",
            "ricotta",
            "mozzarella",
        )
    )


def _is_meat_or_egg(p: Product) -> bool:
    if (p.diet_type or "").lower() == "nonveg":
        return True
    n = p.name.lower()
    return any(w in n for w in ("chicken", "salmon", "egg", "beef", "turkey", "fish"))


def _carb_score(p: Product) -> float:
    return float(p.carbs_g or 0.0)


def _product_index(pre: PlanResponse) -> dict[str, Product]:
    m: dict[str, Product] = {p.id: p for p in pre.recommended_products}
    for p in _catalog():
        m[p.id] = p
    return m


def _chosen_from_basket(pre: PlanResponse) -> list[Product]:
    idx = _product_index(pre)
    return [idx[bi.product_id] for bi in pre.basket.items if bi.product_id in idx]


def _dedupe_products(seq: list[Product]) -> list[Product]:
    seen: set[str] = set()
    out: list[Product] = []
    for p in seq:
        if p.id not in seen:
            seen.add(p.id)
            out.append(p)
    return out


def _clip_to_budget_products(products: list[Product], budget: float) -> list[Product]:
    items = list(products)
    while items:
        total = sum(p.price_usd for p in items)
        if total <= budget:
            return items
        drop = max(items, key=lambda p: p.price_usd)
        items.remove(drop)
    return items


def _basket_from_product_list(products: list[Product]) -> GroceryBasket:
    items: list[BasketItem] = []
    total = 0.0
    for p in products:
        line = round(p.price_usd, 2)
        items.append(BasketItem(product_id=p.id, name=p.name, quantity=1, line_total_usd=line))
        total += line
    return GroceryBasket(items=items, subtotal_usd=round(total, 2))


def _pool(req: PlanRequest, *, dairy_ok: bool = True) -> list[Product]:
    pool = _filter_products(req, only_in_stock=True)
    if not dairy_ok:
        pool = [x for x in pool if not _is_dairy(x)]
    return pool


def _veg_substitute_pool(req: PlanRequest) -> list[Product]:
    """In-stock veg/`both` SKUs respecting allergy tags (ignores omnivore diet flag)."""
    out: list[Product] = []
    for p in _catalog():
        if not p.in_stock:
            continue
        if (p.diet_type or "both") not in ("veg", "both"):
            continue
        bad_hit = False
        for bad in req.risky_foods:
            if bad.lower() in p.name.lower() or _risk_overlap([bad], p.risky_tags):
                bad_hit = True
                break
        if not bad_hit:
            out.append(p)
    return out


def _apply_refinement(kind: RefinementKind, chosen: list[Product], req: PlanRequest) -> list[Product]:
    chosen = _dedupe_products(chosen)
    if not chosen or kind == "none":
        return chosen

    if kind == "cheaper":
        pool = _pool(req)
        used: set[str] = set()
        out: list[Product] = []
        for p in chosen:
            cands = [x for x in pool if x.id not in used and x.price_usd + 1e-6 < p.price_usd]
            pick = min(cands, key=lambda x: (x.price_usd, x.name)) if cands else p
            out.append(pick)
            used.add(pick.id)
        return out

    if kind == "avoid_dairy":
        pool = _pool(req, dairy_ok=False)
        used: set[str] = set()
        out: list[Product] = []
        for p in chosen:
            if _is_dairy(p):
                cands = [x for x in pool if x.id not in used]
                pick = min(cands, key=lambda x: (x.price_usd, x.name)) if cands else p
                out.append(pick)
                used.add(pick.id)
            else:
                out.append(p)
                used.add(p.id)
        return out

    if kind == "more_protein":
        pool = _pool(req)
        out = list(chosen)
        used = {p.id for p in out}
        weak_i = min(range(len(out)), key=lambda i: out[i].protein_g or 0.0)
        wp = out[weak_i]
        pick: Product | None = None
        for cand in sorted(pool, key=lambda x: -(x.protein_g or 0.0)):
            if cand.id in used:
                continue
            if (cand.protein_g or 0.0) <= (wp.protein_g or 0.0):
                continue
            if cand.price_usd <= wp.price_usd + 5.0:
                pick = cand
                break
        if pick:
            out[weak_i] = pick
        return out

    if kind == "one_store":
        pool = _pool(req)
        counts: dict[str, int] = {}
        for p in chosen:
            counts[p.store_id] = counts.get(p.store_id, 0) + 1
        win = sorted(counts.keys(), key=lambda sid: (-counts[sid], sid))[0]
        out = [p for p in chosen if p.store_id == win]
        used = {p.id for p in out}
        local = [p for p in pool if p.store_id == win and p.id not in used]
        target = max(3, min(len(chosen), len(out) + 5))
        for p in sorted(local, key=lambda x: x.price_usd):
            if len(out) >= target:
                break
            out.append(p)
            used.add(p.id)
        if not out:
            fallback = [p for p in pool if p.store_id == win]
            out = sorted(fallback, key=lambda x: x.price_usd)[: max(3, min(4, len(fallback)))]
        return out

    if kind == "veg_alternatives":
        vpool = _veg_substitute_pool(req)
        used: set[str] = set()
        out: list[Product] = []
        for p in chosen:
            if _is_meat_or_egg(p) or (p.diet_type or "").lower() == "nonveg":
                cands = [
                    x
                    for x in sorted(vpool, key=lambda z: (-(z.protein_g or 0.0), z.price_usd))
                    if x.id not in used
                ]
                pick = next((x for x in cands if x.price_usd <= p.price_usd + 4.0), cands[0] if cands else p)
                out.append(pick)
                used.add(pick.id)
            else:
                out.append(p)
                used.add(p.id)
        return out

    if kind == "reduce_carbs":
        pool = _pool(req)
        out = list(chosen)
        used = {p.id for p in out}
        hi = max(range(len(out)), key=lambda i: _carb_score(out[i]))
        hp = out[hi]
        cands = [x for x in pool if x.id not in used and _carb_score(x) < _carb_score(hp) - 1e-6]
        if cands:
            pick = min(cands, key=lambda z: (_carb_score(z), z.price_usd))
            out[hi] = pick
        return out

    return chosen


def _stores_after_refinement(kind: RefinementKind, chosen: list[Product], req: PlanRequest) -> list[Store]:
    if kind != "one_store" or not chosen:
        return _rank_stores_open_first(list_stores_near_zip(req.zip_code))
    ctr: dict[str, int] = {}
    for p in chosen:
        ctr[p.store_id] = ctr.get(p.store_id, 0) + 1
    sid = sorted(ctr.keys(), key=lambda k: (-ctr[k], k))[0]
    s = get_store_by_id(sid)
    if s:
        return [s]
    ranked = _rank_stores_open_first(list_stores_near_zip(req.zip_code))
    return [x for x in ranked if x.id == sid] or ranked[:1]


def _refinement_explanation(kind: RefinementKind) -> str:
    return {
        "cheaper": "I swapped pricier lines for better-value picks that still fit your budget.",
        "avoid_dairy": "I removed dairy-heavy items and filled gaps with non-dairy alternatives.",
        "more_protein": "I nudged protein up by trading one line for a higher-protein option.",
        "one_store": "I limited the basket to one retailer so pickup stays simple.",
        "veg_alternatives": "I replaced meat-forward lines with tofu, lentils, and greens where it fit.",
        "reduce_carbs": "I trimmed the highest-carb item and swapped in a lighter option.",
        "none": "I kept your basket and refreshed meals and nutrition around it.",
    }[kind]


def execute_refine_plan_chat(pre: PlanResponse, req: PlanRequest, message: str) -> PlanGroceriesResult:
    """Deterministic follow-up edits on an existing plan (chat `refine_plan` intent)."""
    kind = _detect_refinement(message)
    chosen = _chosen_from_basket(pre)
    if not chosen:
        return execute_plan_groceries(req, message)

    refined = _apply_refinement(kind, chosen, req)
    refined = _dedupe_products(refined)
    refined = _clip_to_budget_products(refined, req.budget_usd)
    if not refined:
        refined = _dedupe_products(chosen[:1])
        refined = _clip_to_budget_products(refined, req.budget_usd)

    basket = _basket_from_product_list(refined)
    stores_out = _stores_after_refinement(kind, refined, req)

    diet_for_meals: Literal["vegetarian", "non_veg", "either"] = (
        "vegetarian" if kind == "veg_alternatives" else req.diet
    )
    meal_plans = _meal_plans_from_basket(req.cuisine, basket, diet_for_meals, max_plans=3, min_plans=2)

    by_id = {p.id: p for p in _catalog()}
    nutrition = _nutrition_from_basket(basket, by_id, req.grocery_days)

    pool = _filter_products(req, only_in_stock=True)
    recommended: list[Product] = []
    seen: set[str] = set()
    for p in refined:
        recommended.append(p)
        seen.add(p.id)
    for p in pool:
        if len(recommended) >= 12:
            break
        if p.id not in seen:
            recommended.append(p)
            seen.add(p.id)

    refine_headlines: dict[RefinementKind, str] = {
        "cheaper": "I updated the plan to bring the total down.",
        "avoid_dairy": "I updated the plan to remove dairy.",
        "more_protein": "I updated the plan to add protein.",
        "one_store": "I updated the plan to shop from one store.",
        "veg_alternatives": "I updated the plan to make it vegetarian-friendly.",
        "reduce_carbs": "I updated the plan to lower carbs.",
        "none": "I refreshed meals around your current basket.",
    }
    headline = refine_headlines.get(kind, refine_headlines["none"])
    headline = f"{headline}\nAbout ${basket.subtotal_usd:.0f} total across {len(basket.items)} items."
    daily = _daily_insight_from_plan(nutrition, basket, req)
    expl = _refinement_explanation(kind)

    plan = PlanResponse(
        assistant_summary=headline,
        stores=stores_out,
        recommended_products=recommended,
        basket=basket,
        meal_plans=meal_plans,
    )
    return PlanGroceriesResult(
        plan=plan,
        nutrition_summary=nutrition,
        daily_insight=daily,
        explanation=expl,
        headline=headline,
    )


def _basket_grocery_blob(pre: PlanResponse) -> str:
    idx = _product_index(pre)
    chunks: list[str] = []
    for bi in pre.basket.items:
        p = idx.get(bi.product_id)
        if not p:
            continue
        chunks.append(p.name.lower())
        chunks.extend(t.lower() for t in p.nutrition_tags)
        chunks.append(p.category.lower())
    for p in pre.recommended_products[:10]:
        chunks.append(p.name.lower())
    return " ".join(chunks)


def _meal_gen_flags(message: str) -> frozenset[str]:
    m = message.lower()
    flags: set[str] = set()
    if re.search(r"\b(?:two|2)[- ]day\b", m) or "2-day" in m:
        flags.add("two_day")
    if re.search(r"\b(?:three|3)[- ]day\b", m) or "3-day" in m:
        flags.add("three_day")
    if re.search(r"\b[4-7][- ]day\b", m):
        flags.add("multi_day")
    if re.search(r"\b(dinner ideas|ideas for dinner|dinner plan)\b", m) or ("dinner" in m and "idea" in m):
        flags.add("dinner")
    if re.search(r"\b(high[- ]protein|more protein)\b", m):
        flags.add("high_protein")
    if re.search(r"\b(budget|cheap|affordable)\b.*\bmeal\b|\bmeal\b.*\b(budget|cheap|affordable)\b", m):
        flags.add("budget_meals")
    if re.search(
        r"\b(plan meals|with these groceries|from (this|my) cart|from (this|my) basket|using (these|my) groceries)\b",
        m,
    ):
        flags.add("from_cart")
    return frozenset(flags)


def _meal_window_days(message: str, default_days: int) -> int:
    m = message.lower()
    if re.search(r"\b(?:two|2)[- ]day\b", m) or "2-day" in m:
        return 2
    if re.search(r"\b(?:three|3)[- ]day\b", m) or "3-day" in m:
        return 3
    mm = re.search(r"\b([4-7])[- ]day\b", m)
    if mm:
        return int(mm.group(1))
    return max(1, min(14, default_days))


def _ingredient_match_score(template: dict, blob: str) -> tuple[int, int]:
    hits = 0
    toks = 0
    for ing in template.get("ingredients", []):
        for token in re.split(r"\W+", str(ing).lower()):
            if len(token) < 3:
                continue
            toks += 1
            if token in blob:
                hits += 1
    return hits, max(1, toks)


def _template_budget_friendly(template: dict) -> bool:
    t = (str(template.get("title", "")) + " " + str(template.get("id", ""))).lower()
    return "budget" in t or "stretch" in t


def _template_high_protein_hint(template: dict) -> bool:
    blob = (str(template.get("title", "")) + " " + str(template.get("summary", ""))).lower()
    if "protein" in blob:
        return True
    keys = ("chicken", "salmon", "yogurt", "tofu", "cottage", "egg", "lentil", "dal", "beef")
    return any(k in blob for k in keys)


def _template_is_breakfasty(template: dict) -> bool:
    t = (str(template.get("title", "")) + " " + str(template.get("summary", ""))).lower()
    return "breakfast" in t


def _score_meal_template(
    template: dict,
    req: PlanRequest,
    blob: str,
    flags: frozenset[str],
) -> float:
    hits, toks = _ingredient_match_score(template, blob)
    score = hits * 4.0 + (hits / toks) * 6.0
    if _meal_matches_cuisine(template, req.cuisine):
        score += 8.0
    if _template_budget_friendly(template) and (req.budget_usd <= 48 or "budget_meals" in flags):
        score += 5.0
    if "high_protein" in flags and _template_high_protein_hint(template):
        score += 6.0
    elif "high_protein" in flags:
        score -= 2.0
    if "dinner" in flags and _template_is_breakfasty(template):
        score -= 10.0
    if "dinner" in flags and not _template_is_breakfasty(template):
        score += 2.0
    if "from_cart" in flags and hits == 0:
        score -= 4.0
    return score


def _pick_meal_templates_for_generation(
    message: str,
    req: PlanRequest,
    blob: str,
) -> list[dict]:
    flags = _meal_gen_flags(message)
    viable = [m for m in MOCK_MEALS if _meal_ok_for_diet(m, req.diet)]
    if not viable:
        viable = list(MOCK_MEALS)
    scored = [(_score_meal_template(m, req, blob, flags), m) for m in viable]
    scored.sort(key=lambda x: x[0], reverse=True)
    top = [m for _, m in scored[:3]]
    seen_ids = {str(m["id"]) for m in top}
    if len(top) < 2:
        for m in viable:
            mid = str(m["id"])
            if mid not in seen_ids:
                top.append(m)
                seen_ids.add(mid)
            if len(top) >= 2:
                break
    return top[:3]


def execute_generate_meals(pre: PlanResponse, req: PlanRequest, message: str) -> PlanGroceriesResult:
    """Chat `generate_meals`: 2–3 templates anchored to the current basket + preferences."""
    flags = _meal_gen_flags(message)
    days = _meal_window_days(message, req.grocery_days)
    blob = _basket_grocery_blob(pre)
    idx = _product_index(pre)
    names_short = ", ".join(
            idx[bi.product_id].name for bi in pre.basket.items[:4] if bi.product_id in idx
        ) or "your staples"

    templates = _pick_meal_templates_for_generation(message, req, blob)
    meal_plans: list[MealPlan] = []
    for m in templates:
        summary = str(m.get("summary", "")) or ""
        sum_short = summary[:100] + ("…" if len(summary) > 100 else "")
        meal_plans.append(
            MealPlan(
                id=str(m["id"]),
                title=str(m["title"]),
                meals=[
                    sum_short,
                    f"Anchored to what you already bought: {names_short}.",
                ],
                notes=f"Meal ideas cover the next {days} days.",
            )
        )

    by_id = {p.id: p for p in _catalog()}
    nutrition = _nutrition_from_basket(pre.basket, by_id, days)
    h1 = f"About {round(nutrition.protein_g)} grams of protein per day on average."
    h2 = "Estimates come from your basket mix, not exact portions."
    if "high_protein" in flags:
        h1 = f"Protein-forward: about {round(nutrition.protein_g)} grams of protein per day from this basket."
    nutrition = nutrition.model_copy(update={"highlights": [h1, h2]})

    n_meals = len(meal_plans)
    headline = f"I turned your basket into {n_meals} simple meal ideas for the next {days} days."
    if "dinner" in flags:
        headline += "\nEvening meals are the focus."

    if "high_protein" in flags:
        daily = "Put the heavier protein at lunch so dinner stays lighter."
    elif "dinner" in flags:
        daily = "Cook once and stretch it. Add a quick vegetable side on the second night."
    elif nutrition.fiber_g < 12:
        daily = "Fibre has some room. Tuck beans or spinach into one of these plates."
    else:
        daily = "Solid base. Repeat one protein prep mid-week to save time."

    expl = "Each idea leans on ingredients already in your basket. Adjust portions to taste."

    plan = PlanResponse(
        assistant_summary=headline,
        stores=pre.stores,
        recommended_products=pre.recommended_products,
        basket=pre.basket,
        meal_plans=meal_plans,
    )
    return PlanGroceriesResult(
        plan=plan,
        nutrition_summary=nutrition,
        daily_insight=daily,
        explanation=expl,
        headline=headline,
    )


def build_plan(req: PlanRequest) -> PlanResponse:
    stores = _rank_stores_open_first(list_stores_near_zip(req.zip_code))
    picks = _filter_products(req, only_in_stock=True)[:8]
    basket = _pick_basket(picks, req.budget_usd)
    summary = (
        f"I sketched a {req.grocery_days}-day starter plan near you "
        f"with your {req.diet} settings and about ${req.budget_usd:.0f} to spend."
    )
    return PlanResponse(
        assistant_summary=summary,
        stores=stores,
        recommended_products=picks,
        basket=basket,
        meal_plans=_meal_plans(req.cuisine, basket, req.diet),
    )


def refine_plan(body: PlanRefineRequest) -> PlanResponse:
    """HTTP `/plan/refine` — same deterministic refinements as chat."""
    base = body.previous or build_plan(body.filters)
    return execute_refine_plan_chat(base, body.filters, body.message).plan
