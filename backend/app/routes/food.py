from fastapi import APIRouter

from app.models.schemas import FoodLogRequest, FoodLogResponse
from app.services.food_log_service import log_food_intake

router = APIRouter()


@router.post("/log", response_model=FoodLogResponse)
def log_food(body: FoodLogRequest) -> FoodLogResponse:
    """Parse a casual meal description and return mock nutrition deltas."""
    return log_food_intake(body)
