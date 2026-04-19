"""
Google Geocoding + Places Nearby Search (optional / legacy).

The default nearby-store pipeline uses :mod:`app.services.live_store_providers.osm_live_stores` instead.
This module is retained for experiments or a future opt-in provider.
"""

from __future__ import annotations

import json
import logging
import math
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from app.models.nearby_stores import NearbyStoreCandidate

logger = logging.getLogger(__name__)

_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
_NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"


def _maps_api_key() -> str:
    return (os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("GOOGLE_PLACES_API_KEY") or "").strip()


def maps_api_key_configured() -> bool:
    """True when a Google Maps / Places web API key is present for live store search."""
    return bool(_maps_api_key())


def _haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 3958.7613  # Earth radius in miles
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1 - a)))
    return r * c


def _http_get_json(url: str, params: dict[str, str], *, timeout_s: float = 12.0) -> dict[str, Any]:
    q = urllib.parse.urlencode(params)
    full = f"{url}?{q}"
    req = urllib.request.Request(full, headers={"User-Agent": "NutriCart-AI/1.0"})
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        raw = resp.read().decode("utf-8")
    return json.loads(raw)


def geocode_us_zip(zip_code: str) -> tuple[float, float] | None:
    """Return (lat, lng) centroid for a US ZIP / postal code, or None."""
    z = (zip_code or "").strip()
    if not z:
        return None
    key = _maps_api_key()
    if not key:
        return None
    params = {
        "components": f"country:US|postal_code:{urllib.parse.quote(z)}",
        "key": key,
    }
    try:
        data = _http_get_json(_GEOCODE_URL, params)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
        logger.warning("Google Geocoding failed for zip=%s: %s", z, exc)
        return None
    status = str(data.get("status") or "")
    if status != "OK" or not data.get("results"):
        logger.warning("Google Geocoding non-OK for zip=%s status=%s", z, status)
        return None
    loc = (data["results"][0].get("geometry") or {}).get("location") or {}
    lat, lng = loc.get("lat"), loc.get("lng")
    if lat is None or lng is None:
        return None
    return float(lat), float(lng)


def fetch_nearby_grocery_places(
    zip_code: str,
    *,
    lat: float,
    lng: float,
    radius_miles: float | None,
    query: str | None,
    limit: int,
) -> tuple[tuple[NearbyStoreCandidate, ...], str | None]:
    """
    Call Places Nearby Search (supermarket + grocery).

    Returns candidates with ``source_type`` ``live`` and optional error / status note.
    """
    key = _maps_api_key()
    if not key:
        return (), "No GOOGLE_MAPS_API_KEY configured."

    miles = float(radius_miles) if radius_miles is not None and float(radius_miles) > 0 else 5.0
    miles = min(miles, 50.0)
    radius_m = int(miles * 1609.34)
    cap = max(1, min(int(limit), 20))

    params: dict[str, str] = {
        "location": f"{lat},{lng}",
        "radius": str(radius_m),
        "type": "grocery_or_supermarket",
        "key": key,
    }
    q = (query or "").strip()
    if q:
        params["keyword"] = q

    try:
        data = _http_get_json(_NEARBY_URL, params)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
        logger.warning("Google Places Nearby failed for zip=%s: %s", zip_code, exc)
        return (), f"Places request failed: {exc}"

    status = str(data.get("status") or "")
    if status not in ("OK", "ZERO_RESULTS"):
        msg = data.get("error_message") or status
        logger.warning("Google Places Nearby non-OK zip=%s status=%s msg=%s", zip_code, status, msg)
        return (), f"Places status {status}: {msg}"

    rows = list(data.get("results") or [])
    out: list[NearbyStoreCandidate] = []
    for r in rows[:cap]:
        loc = (r.get("geometry") or {}).get("location") or {}
        plat, plng = loc.get("lat"), loc.get("lng")
        if plat is None or plng is None:
            continue
        dist = _haversine_miles(lat, lng, float(plat), float(plng))
        if dist > miles + 0.25:
            continue
        pid = str(r.get("place_id") or "").strip()
        if not pid:
            continue
        name = str(r.get("name") or "Store").strip()
        address = str(r.get("vicinity") or r.get("formatted_address") or "").strip()
        oh = r.get("opening_hours")
        is_open = False
        if isinstance(oh, dict) and "open_now" in oh:
            is_open = bool(oh.get("open_now"))

        out.append(
            NearbyStoreCandidate(
                id=f"place_{pid}",
                name=name,
                distance_miles=round(dist, 2),
                address=address,
                is_open=is_open,
                opens_at=None,
                zip_code=zip_code.strip() or None,
                last_updated=None,
                source_type="live",
                notes=None,
            )
        )

    out.sort(key=lambda c: c.distance_miles)
    note = None if out else "Places returned no grocery/supermarket results for this area."
    return tuple(out), note
