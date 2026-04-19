"""
OpenStreetMap live store provider (Nominatim + Overpass).

Free, no API keys. Suitable for demos; respect Nominatim usage limits and set
``NUTRICART_APP_CONTACT_EMAIL`` in the User-Agent when possible.
"""

from __future__ import annotations

import json
import logging
import math
import os
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

try:
    import certifi

    _SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
except Exception:  # pragma: no cover
    _SSL_CONTEXT = ssl.create_default_context()

from app.models.nearby_stores import NearbyStoreCandidate

logger = logging.getLogger(__name__)

_NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search"
_OVERPASS_URLS: tuple[str, ...] = (
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
)

_NOMINATIM_MIN_INTERVAL_S = 1.1
_last_nominatim_ts: float = 0.0

_DEFAULT_HTTP_TIMEOUT_S = 15.0
_DEFAULT_OVERPASS_TIMEOUT_S = 22.0


def _nominatim_user_agent() -> str:
    contact = (os.getenv("NUTRICART_APP_CONTACT_EMAIL") or "").strip()
    base = "NutriCart-AI/1.0 (+https://github.com/nutricart-ai/nutricart-ai)"
    return f"{base}; contact={contact}" if contact else base


def _haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 3958.7613
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1 - a)))
    return r * c


def _respect_nominatim_interval() -> None:
    global _last_nominatim_ts
    now = time.monotonic()
    wait = _NOMINATIM_MIN_INTERVAL_S - (now - _last_nominatim_ts)
    if wait > 0:
        time.sleep(wait)
    _last_nominatim_ts = time.monotonic()


def _http_get_json(
    url: str,
    params: dict[str, str],
    *,
    timeout_s: float = _DEFAULT_HTTP_TIMEOUT_S,
) -> Any:
    q = urllib.parse.urlencode(params)
    full = f"{url}?{q}"
    req = urllib.request.Request(
        full,
        headers={"User-Agent": _nominatim_user_agent(), "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout_s, context=_SSL_CONTEXT) as resp:
        raw = resp.read().decode("utf-8")
    return json.loads(raw)


def _http_post_overpass(query: str, *, timeout_s: float = _DEFAULT_OVERPASS_TIMEOUT_S) -> dict[str, Any]:
    body = urllib.parse.urlencode({"data": query}).encode("utf-8")
    last_exc: Exception | None = None
    for url in _OVERPASS_URLS:
        req = urllib.request.Request(
            url,
            data=body,
            method="POST",
            headers={
                "User-Agent": _nominatim_user_agent(),
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout_s, context=_SSL_CONTEXT) as resp:
                raw = resp.read().decode("utf-8")
            return json.loads(raw)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
            last_exc = exc
            logger.warning("Overpass request failed endpoint=%s: %s", url, exc)
            continue
    assert last_exc is not None
    raise last_exc


def _normalize_us_zip(zip_code: str) -> str:
    z = re.sub(r"\s+", "", (zip_code or "").strip())
    if re.match(r"^\d{5}-\d{4}$", z):
        return z[:5]
    return z


def geocode_us_zip(zip_code: str) -> tuple[float, float] | None:
    """
    Geocode a US 5-digit ZIP (or ZIP+4) to ``(latitude, longitude)`` via Nominatim.

    Returns ``None`` on invalid input, HTTP errors, timeouts, or empty results.
    """
    try:
        z = _normalize_us_zip(zip_code)
        if not z or not re.match(r"^\d{5}$", z):
            return None
        _respect_nominatim_interval()
        params = {
            "postalcode": z,
            "countrycodes": "us",
            "format": "json",
            "limit": "1",
            "addressdetails": "0",
        }
        try:
            data = _http_get_json(_NOMINATIM_SEARCH, params)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
            logger.warning("Nominatim geocode failed zip=%s: %s", z, exc)
            return None
        if not isinstance(data, list) or not data:
            logger.warning("Nominatim geocode empty zip=%s", z)
            return None
        row = data[0]
        lat = float(row["lat"])
        lon = float(row["lon"])
        return lat, lon
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        logger.warning("Nominatim geocode parse error zip=%r: %s", zip_code, exc)
        return None
    except Exception as exc:  # pragma: no cover — defensive for demos
        logger.warning("Nominatim geocode unexpected error zip=%r: %s", zip_code, exc)
        return None


def _tags_address(tags: dict[str, Any]) -> str:
    parts: list[str] = []
    hn = tags.get("addr:housenumber")
    st = tags.get("addr:street")
    if hn or st:
        parts.append(" ".join(x for x in (str(hn or "").strip(), str(st or "").strip()) if x).strip())
    city = tags.get("addr:city") or tags.get("addr:town") or tags.get("addr:village")
    state = tags.get("addr:state")
    pc = tags.get("addr:postcode")
    tail = ", ".join(x for x in (str(city or "").strip(), str(state or "").strip(), str(pc or "").strip()) if x)
    if tail:
        parts.append(tail)
    return ", ".join(p for p in parts if p).strip()


def _element_lat_lon(el: dict[str, Any]) -> tuple[float, float] | None:
    if el.get("type") == "node":
        try:
            return float(el["lat"]), float(el["lon"])
        except (KeyError, TypeError, ValueError):
            return None
    center = el.get("center")
    if isinstance(center, dict):
        try:
            return float(center["lat"]), float(center["lon"])
        except (KeyError, TypeError, ValueError):
            return None
    return None


def _overpass_grocery_query(lat: float, lon: float, radius_m: int) -> str:
    r = radius_m
    return f"""[out:json][timeout:15];
(
  node["shop"="supermarket"](around:{r},{lat},{lon});
  way["shop"="supermarket"](around:{r},{lat},{lon});
  node["shop"="convenience"](around:{r},{lat},{lon});
  way["shop"="convenience"](around:{r},{lat},{lon});
  node["shop"="greengrocer"](around:{r},{lat},{lon});
  way["shop"="greengrocer"](around:{r},{lat},{lon});
  node["shop"="grocery"](around:{r},{lat},{lon});
  way["shop"="grocery"](around:{r},{lat},{lon});
  node["shop"="health_food"](around:{r},{lat},{lon});
  way["shop"="health_food"](around:{r},{lat},{lon});
  node["amenity"="supermarket"](around:{r},{lat},{lon});
  way["amenity"="supermarket"](around:{r},{lat},{lon});
);
out center;
"""


def normalize_osm_element_to_candidate(
    el: dict[str, Any],
    *,
    origin_lat: float,
    origin_lng: float,
    max_distance_miles: float,
    zip_display: str,
    name_query: str | None,
) -> NearbyStoreCandidate | None:
    """
    Map one Overpass element to a :class:`~app.models.nearby_stores.NearbyStoreCandidate`.

    ``is_open`` is ``False`` when opening hours cannot be determined from OSM here.
    ``source_type`` is always ``\"live\"`` for successful mappings.
    """
    try:
        et = str(el.get("type") or "")
        eid = el.get("id")
        if et not in ("node", "way") or eid is None:
            return None
        tags = el.get("tags") if isinstance(el.get("tags"), dict) else {}
        if str(tags.get("amenity", "")).lower() == "fuel":
            return None
        name = str(tags.get("name") or tags.get("brand") or tags.get("operator") or "").strip()
        if not name:
            name = "Grocery store"
        q_filter = (name_query or "").strip().lower()
        if q_filter:
            blob = f"{name} {tags.get('brand', '')} {tags.get('operator', '')}".lower()
            if q_filter not in blob:
                return None
        coords = _element_lat_lon(el)
        if coords is None:
            return None
        plat, plng = coords
        dist = _haversine_miles(origin_lat, origin_lng, plat, plng)
        if dist > max_distance_miles + 0.35:
            return None
        oid = f"osm_{et}_{int(eid)}"
        addr = _tags_address(tags)
        return NearbyStoreCandidate(
            id=oid,
            name=name,
            distance_miles=round(dist, 2),
            address=addr,
            is_open=False,
            opens_at=None,
            zip_code=zip_display or None,
            last_updated=None,
            source_type="live",
            notes=None,
        )
    except Exception as exc:
        logger.debug("Skipping OSM element id=%s: %s", el.get("id"), exc)
        return None


def search_nearby_grocery_places(
    zip_code: str,
    *,
    lat: float,
    lng: float,
    radius_miles: float | None,
    query: str | None,
    limit: int,
) -> tuple[tuple[NearbyStoreCandidate, ...], str | None]:
    """
    Search Overpass for supermarket-class POIs near ``(lat, lng)``.

    Returns ``(candidates, note)``. On transport/parse failures, returns ``()`` and a short note.
    """
    try:
        miles = float(radius_miles) if radius_miles is not None and float(radius_miles) > 0 else 5.0
        miles = min(miles, 50.0)
        radius_m = int(miles * 1609.34)
        cap = max(1, min(int(limit), 40))
        z_display = _normalize_us_zip(zip_code)

        overpass_q = _overpass_grocery_query(lat, lng, radius_m)
        try:
            data = _http_post_overpass(overpass_q)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
            logger.warning("Overpass grocery query failed zip=%s: %s", z_display, exc)
            return (), f"Overpass request failed: {exc}"

        elements = list(data.get("elements") or [])
        out: list[NearbyStoreCandidate] = []
        seen_ids: set[str] = set()
        for el in elements:
            if not isinstance(el, dict):
                continue
            c = normalize_osm_element_to_candidate(
                el,
                origin_lat=lat,
                origin_lng=lng,
                max_distance_miles=miles,
                zip_display=z_display,
                name_query=query,
            )
            if c is None or c.id in seen_ids:
                continue
            seen_ids.add(c.id)
            out.append(c)

        out.sort(key=lambda x: x.distance_miles)
        trimmed = out[:cap]
        note = None if trimmed else "OpenStreetMap returned no supermarket-class POIs in this radius."
        return tuple(trimmed), note
    except Exception as exc:
        logger.warning("search_nearby_grocery_places failed zip=%r: %s", zip_code, exc)
        return (), f"Live grocery search failed: {exc}"


# Backwards-compatible names used by ``store_lookup``.
geocode_us_zip_nominatim = geocode_us_zip


def fetch_nearby_grocery_osm(
    zip_code: str,
    *,
    lat: float,
    lng: float,
    radius_miles: float | None,
    query: str | None,
    limit: int,
) -> tuple[tuple[NearbyStoreCandidate, ...], str | None]:
    """Alias for :func:`search_nearby_grocery_places` (same signature)."""
    return search_nearby_grocery_places(
        zip_code,
        lat=lat,
        lng=lng,
        radius_miles=radius_miles,
        query=query,
        limit=limit,
    )
