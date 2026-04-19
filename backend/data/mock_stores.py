"""
Nearby grocery fixtures for demo zip codes (SF Bay–style).

Each row uses demo-friendly fields; `store_service` maps onto API `Store` models.
"""

from typing import Any

MOCK_STORES: list[dict[str, Any]] = [
    {
        "id": "store_walmart_ocean",
        "name": "Walmart Neighborhood Market — Ocean Ave",
        "distance": 1.1,
        "isOpen": True,
        "zipCode": "94112",
        "lastUpdated": "2026-04-18T08:15:00Z",
        "opensAt": None,
    },
    {
        "id": "store_target_mission",
        "name": "Target — Mission Street",
        "distance": 0.7,
        "isOpen": True,
        "zipCode": "94103",
        "lastUpdated": "2026-04-18T07:45:00Z",
        "opensAt": None,
    },
    {
        "id": "store_trader_joes_castro",
        "name": "Trader Joe's — Castro",
        "distance": 1.4,
        "isOpen": True,
        "zipCode": "94114",
        "lastUpdated": "2026-04-18T09:00:00Z",
        "opensAt": None,
    },
    {
        "id": "store_safeway_noriega",
        "name": "Safeway — Noriega",
        "distance": 2.0,
        "isOpen": False,
        "zipCode": "94122",
        "lastUpdated": "2026-04-17T22:30:00Z",
        "opensAt": "06:00 tomorrow",
    },
]
