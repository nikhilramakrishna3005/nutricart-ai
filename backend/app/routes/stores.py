from fastapi import APIRouter, Query

from app.models.schemas import Store
from app.services.store_service import list_stores_near_zip

router = APIRouter()


@router.get("", response_model=dict)
def get_stores(zip: str = Query(..., description="User zip / postal code (OSM live or mock)")) -> dict:
    """Return nearby stores for a zip (live OSM when available, else mock fixtures)."""
    stores: list[Store] = list_stores_near_zip(zip)
    return {"stores": stores}
