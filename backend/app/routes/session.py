from fastapi import APIRouter

from app.services.state_service import load_state

router = APIRouter()


@router.get("/session")
def get_session() -> dict:
    """Return full persisted session for frontend hydration (single-user MVP)."""
    return load_state()
