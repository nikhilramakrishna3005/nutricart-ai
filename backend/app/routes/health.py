from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    """Liveness probe for demos and deploy scripts."""
    return {"status": "ok"}
