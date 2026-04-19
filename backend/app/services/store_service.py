"""Store listing, nearby lookup (OSM live + mock fallback), and product compare."""

from __future__ import annotations

import logging
from typing import Any

from data.mock_stores import MOCK_STORES

from app.models.schemas import Store
from app.services.product_compare_service import run_compare_store_products
from app.services.store_lookup import NearbyStoresToolResult, run_nearby_stores_lookup

logger = logging.getLogger(__name__)

# Shared default cap for ``GET /stores``, chat ``get_nearby_stores``, and planner store lists.
DEFAULT_NEARBY_STORE_LIMIT = 24


def _mock_row_to_store(row: dict) -> Store:
    return Store(
        id=row["id"],
        name=row["name"],
        distance_miles=float(row["distance"]),
        is_open=bool(row["isOpen"]),
        address=str(row.get("address") or ""),
        opens_at=row.get("opensAt"),
        zip_code=row.get("zipCode"),
        last_updated=row.get("lastUpdated"),
        source="mock",
    )


def get_store_by_id(store_id: str) -> Store | None:
    """Resolve a fixture row by id (used when narrowing plans to one retailer)."""
    for r in MOCK_STORES:
        if r["id"] == store_id:
            return _mock_row_to_store(r)
    return None


def fetch_normalized_nearby_stores(
    zip_code: str | None,
    *,
    limit: int = DEFAULT_NEARBY_STORE_LIMIT,
    radius_miles: float | None = None,
    query: str | None = None,
) -> tuple[list[Store], NearbyStoresToolResult]:
    """
    Single path for live + mock nearby stores used by ``GET /stores``, chat tools, and planner.

    Each :class:`~app.models.schemas.Store` includes ``source``, ``address``, and ``distance_miles``.
    ``run_nearby_stores_lookup`` already logs ``store source: live`` / ``store source: mock fallback``;
    this layer logs the normalized client payload for traceability.
    """
    result = run_nearby_stores_lookup(
        zip_code,
        limit=limit,
        radius_miles=radius_miles,
        query=query,
    )
    stores = [c.to_store() for c in result.candidates]
    logger.info(
        "stores_lookup_client: resolver_source=%s zip=%s store_count=%d (shared /stores + chat + planner)",
        result.resolver_source,
        result.zip_code or "(none)",
        len(stores),
    )
    return stores, result


def list_stores_near_zip(zip_code: str) -> list[Store]:
    """
    Nearby stores for ``GET /stores`` — delegates to :func:`fetch_normalized_nearby_stores`.
    """
    stores, _ = fetch_normalized_nearby_stores(zip_code, limit=DEFAULT_NEARBY_STORE_LIMIT)
    return stores


def get_nearby_stores(
    zip_code: str | None = None,
    *,
    limit: int = DEFAULT_NEARBY_STORE_LIMIT,
    radius_miles: float | None = None,
    query: str | None = None,
) -> dict[str, Any]:
    """
    Chat / tool entry for ranked store candidates — same pipeline as :func:`list_stores_near_zip`.

    ``NUTRICART_STORE_SOURCE=mock`` forces fixtures only.
    """
    stores, result = fetch_normalized_nearby_stores(
        zip_code,
        limit=limit,
        radius_miles=radius_miles,
        query=query,
    )
    candidates = list(result.candidates)
    return {
        "tool": "get_nearby_stores",
        "sourceType": result.resolver_source,
        "zipCode": result.zip_code,
        "radiusMilesRequested": result.radius_miles_requested,
        "radiusMilesEffective": result.radius_miles_effective,
        "query": result.query,
        "notes": result.notes,
        "count": len(candidates),
        "candidates": [c.model_dump(mode="json", by_alias=True) for c in candidates],
        "stores": [s.model_dump(mode="json") for s in stores],
    }


def compare_store_products(
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
    """
    Tool / router entry: compare catalog SKUs across stores (mock fixtures and/or
    hybrid clone rows for live Places ids) with optional intent / diet / risk /
    budget / cuisine filters.

    Delegates to :func:`app.services.product_compare_service.run_compare_store_products`.
    """
    return run_compare_store_products(
        store_ids,
        intent_keywords=intent_keywords,
        category_hint=category_hint,
        diet_type=diet_type,
        risky_foods=risky_foods,
        budget_usd=budget_usd,
        cuisine_preference=cuisine_preference,
        max_products_per_store=max_products_per_store,
        user_zip_code=user_zip_code,
    )
