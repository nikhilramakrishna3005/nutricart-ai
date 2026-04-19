"""Load and filter mock store fixtures."""

from functools import lru_cache

from data.mock_stores import MOCK_STORES

from app.models.schemas import Store


def _mock_row_to_store(row: dict) -> Store:
    return Store(
        id=row["id"],
        name=row["name"],
        distance_miles=float(row["distance"]),
        is_open=bool(row["isOpen"]),
        opens_at=row.get("opensAt"),
        zip_code=row.get("zipCode"),
        last_updated=row.get("lastUpdated"),
    )


@lru_cache
def _all_stores() -> tuple[Store, ...]:
    return tuple(_mock_row_to_store(r) for r in MOCK_STORES)


def get_store_by_id(store_id: str) -> Store | None:
    """Resolve a fixture row by id (used when narrowing plans to one retailer)."""
    for r in MOCK_STORES:
        if r["id"] == store_id:
            return _mock_row_to_store(r)
    return None


def list_stores_near_zip(zip_code: str) -> list[Store]:
    """
    Demo geocoding: prefer stores in the same ZIP; otherwise sort by distance.

    Replace with a real location + hours provider in production.
    """
    z = (zip_code or "").strip()
    rows = list(_all_stores())
    if not z:
        return sorted(rows, key=lambda s: s.distance_miles)

    same_zip = [s for s in rows if s.zip_code == z]
    if same_zip:
        return sorted(same_zip, key=lambda s: s.distance_miles)

    prefix = z[:3]
    nearby = [s for s in rows if (s.zip_code or "").startswith(prefix)]
    pool = nearby if nearby else rows
    return sorted(pool, key=lambda s: s.distance_miles)
