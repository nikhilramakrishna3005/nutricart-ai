"""
Nearby-store resolution for ``get_nearby_stores`` / ``GET /stores``.

1. **Live** — OpenStreetMap via Nominatim (ZIP geocoding) + Overpass (nearby grocery POIs),
   unless ``NUTRICART_STORE_SOURCE=mock`` is set.
2. **Mock** — deterministic fixtures from ``data.mock_stores`` when live fails, returns
   nothing useful, or when forced.

Set ``NUTRICART_STORE_SOURCE=mock`` to skip HTTP (tests / offline demos).
"""

from __future__ import annotations

import logging
import os
import re
from dataclasses import dataclass
from typing import Any, Protocol

from data.mock_stores import MOCK_STORES

from app.models.nearby_stores import NearbyStoreCandidate, SourceType
from app.services.live_store_providers.osm_live_stores import (
    fetch_nearby_grocery_osm,
    geocode_us_zip_nominatim,
)

logger = logging.getLogger(__name__)


def _ordered_mock_rows(zip_code: str) -> list[dict[str, Any]]:
    """Same ranking rules as legacy mock ordering, on raw fixture rows."""
    z = (zip_code or "").strip()
    rows = list(MOCK_STORES)
    if not z:
        return sorted(rows, key=lambda r: float(r.get("distance", 0)))
    same = [r for r in rows if str(r.get("zipCode", "")).strip() == z]
    if same:
        return sorted(same, key=lambda r: float(r.get("distance", 0)))
    prefix = z[:3]
    nearby = [r for r in rows if str(r.get("zipCode") or "").startswith(prefix)]
    pool = nearby if nearby else rows
    return sorted(pool, key=lambda r: float(r.get("distance", 0)))


def _row_to_candidate(row: dict[str, Any], source_type: SourceType) -> NearbyStoreCandidate:
    return NearbyStoreCandidate(
        id=str(row["id"]),
        name=str(row["name"]),
        distance_miles=float(row.get("distance", 0)),
        address=str(row.get("address") or "").strip(),
        is_open=bool(row.get("isOpen", False)),
        opens_at=row.get("opensAt"),
        zip_code=row.get("zipCode"),
        last_updated=row.get("lastUpdated"),
        source_type=source_type,
        notes=row.get("toolNotes"),
    )


def _matches_query(row: dict[str, Any], q: str) -> bool:
    if not q:
        return True
    blob = " ".join(
        str(x).lower()
        for x in (
            row.get("name"),
            row.get("address"),
            row.get("zipCode"),
            row.get("toolNotes"),
        )
        if x
    )
    return q.lower() in blob


@dataclass(frozen=True)
class NearbyStoresToolResult:
    resolver_source: SourceType
    zip_code: str
    radius_miles_requested: float | None
    radius_miles_effective: float | None
    query: str | None
    notes: str | None
    candidates: tuple[NearbyStoreCandidate, ...]


class StoreLookupSource(Protocol):
    """Implement ``lookup`` for a provider (fixtures or HTTP)."""

    def lookup(
        self,
        zip_code: str,
        *,
        radius_miles: float | None,
        query: str | None,
        limit: int,
    ) -> NearbyStoresToolResult:
        ...


class MockStoreLookupSource:
    """Deterministic fixture-backed lookup (safe for demos and tests)."""

    def lookup(
        self,
        zip_code: str,
        *,
        radius_miles: float | None,
        query: str | None,
        limit: int,
    ) -> NearbyStoresToolResult:
        z = (zip_code or "").strip()
        ordered = _ordered_mock_rows(z)
        q = (query or "").strip() or None
        if q:
            ordered = [r for r in ordered if _matches_query(r, q)]

        after_query = list(ordered)

        radius_requested: float | None = None
        if radius_miles is not None:
            try:
                radius_requested = float(radius_miles)
            except (TypeError, ValueError):
                radius_requested = None

        radius_eff: float | None = None
        radius_note: str | None = None
        if radius_requested is not None and radius_requested > 0:
            radius_eff = min(radius_requested, 50.0)
            filtered = [r for r in after_query if float(r.get("distance", 0)) <= radius_eff]
            if not filtered and after_query:
                radius_note = (
                    f"No mock stores within {radius_eff:.1f} mi; showing closest ranked results instead."
                )
                ordered = after_query[: max(1, min(limit, 24))]
            else:
                ordered = filtered
        else:
            ordered = after_query

        capped = ordered[: max(1, min(limit, 24))]
        candidates = tuple(_row_to_candidate(r, "mock") for r in capped)

        if q and not candidates:
            notes = f"No mock stores matched query {q!r} for ZIP {z or '(any)'!r}."
        elif not candidates:
            notes = "No mock store fixtures matched these filters."
        else:
            notes = radius_note

        return NearbyStoresToolResult(
            resolver_source="mock",
            zip_code=z,
            radius_miles_requested=radius_requested,
            radius_miles_effective=radius_eff,
            query=q,
            notes=notes,
            candidates=candidates,
        )


class OsmLiveStoreLookupSource:
    """Nominatim + Overpass (OpenStreetMap) nearby grocery search."""

    def lookup(
        self,
        zip_code: str,
        *,
        radius_miles: float | None,
        query: str | None,
        limit: int,
    ) -> NearbyStoresToolResult:
        z = (zip_code or "").strip()
        q = (query or "").strip() or None

        radius_requested: float | None = None
        if radius_miles is not None:
            try:
                radius_requested = float(radius_miles)
            except (TypeError, ValueError):
                radius_requested = None
        radius_eff = radius_requested if radius_requested and radius_requested > 0 else None
        if radius_eff is not None:
            radius_eff = min(radius_eff, 50.0)

        coords = geocode_us_zip_nominatim(z)
        if coords is None:
            return NearbyStoresToolResult(
                resolver_source="live",
                zip_code=z,
                radius_miles_requested=radius_requested,
                radius_miles_effective=radius_eff,
                query=q,
                notes="Nominatim did not resolve this US ZIP to coordinates.",
                candidates=(),
            )

        lat, lng = coords
        candidates, place_note = fetch_nearby_grocery_osm(
            z,
            lat=lat,
            lng=lng,
            radius_miles=radius_eff,
            query=q,
            limit=limit,
        )
        return NearbyStoresToolResult(
            resolver_source="live",
            zip_code=z,
            radius_miles_requested=radius_requested,
            radius_miles_effective=radius_eff,
            query=q,
            notes=place_note,
            candidates=candidates,
        )


def get_store_lookup_source() -> StoreLookupSource:
    """Legacy hook; ``run_nearby_stores_lookup`` orchestrates live + mock directly."""
    return MockStoreLookupSource()


def run_nearby_stores_lookup(
    zip_code: str | None,
    *,
    limit: int = 12,
    radius_miles: float | None = None,
    query: str | None = None,
) -> NearbyStoresToolResult:
    """
    Try live OSM lookup (Nominatim + Overpass); on failure or empty results, use mock fixtures.

    Set ``NUTRICART_STORE_SOURCE=mock`` to force fixtures only.
    """
    z = (zip_code or "").strip()
    q_norm = re.sub(r"\s+", " ", (query or "").strip()) or None
    force_mock = (os.getenv("NUTRICART_STORE_SOURCE") or "").strip().lower() == "mock"

    live_notes: list[str] = []

    if not force_mock:
        try:
            live = OsmLiveStoreLookupSource()
            live_res = live.lookup(z, radius_miles=radius_miles, query=q_norm, limit=limit)
            if live_res.candidates:
                logger.info("store source: live")
                logger.info(
                    "nearby stores (OSM): zip=%s count=%d radius=%s query=%r",
                    z or "(none)",
                    len(live_res.candidates),
                    live_res.radius_miles_effective,
                    q_norm,
                )
                return live_res
            live_notes.append(live_res.notes or "Live OSM provider returned zero candidates.")
            logger.warning(
                "nearby stores: live returned 0 rows zip=%s notes=%s",
                z,
                live_res.notes,
            )
        except Exception as exc:
            live_notes.append(f"Live lookup error: {exc}")
            logger.warning("nearby stores: live lookup raised zip=%s err=%s", z, exc)
    else:
        logger.info("nearby stores: fixtures-only mode (NUTRICART_STORE_SOURCE=mock) zip=%s", z or "(none)")

    mock_src = MockStoreLookupSource()
    mock_res = mock_src.lookup(z, radius_miles=radius_miles, query=q_norm, limit=limit)
    merged = " | ".join(x for x in ("; ".join(live_notes) if live_notes else None, mock_res.notes) if x)
    if force_mock:
        logger.info("store source: mock")
        logger.info(
            "nearby stores (fixtures-only): zip=%s count=%d",
            z or "(none)",
            len(mock_res.candidates),
        )
    else:
        logger.info("store source: mock fallback")
        logger.info(
            "nearby stores (mock fallback): zip=%s count=%d",
            z or "(none)",
            len(mock_res.candidates),
        )
    return NearbyStoresToolResult(
        resolver_source="mock",
        zip_code=mock_res.zip_code,
        radius_miles_requested=mock_res.radius_miles_requested,
        radius_miles_effective=mock_res.radius_miles_effective,
        query=mock_res.query,
        notes=merged or mock_res.notes,
        candidates=mock_res.candidates,
    )
