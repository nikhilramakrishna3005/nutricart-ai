from fastapi import APIRouter

from app.models.schemas import PlanRefineRequest, PlanRequest, PlanResponse
from app.services.plan_service import build_plan, refine_plan

router = APIRouter()


@router.post("/plan", response_model=PlanResponse)
def create_plan(body: PlanRequest) -> PlanResponse:
    """Generate a mock grocery plan from structured filters."""
    return build_plan(body)


@router.post("/plan/refine", response_model=PlanResponse)
def refine_plan_endpoint(body: PlanRefineRequest) -> PlanResponse:
    """Adjust an existing plan using a free-text chat message (placeholder logic)."""
    return refine_plan(body)
