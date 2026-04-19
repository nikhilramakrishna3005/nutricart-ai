from fastapi import APIRouter

from app.models.chat_schemas import ChatRequest, ChatResponse
from app.services.chat_service import process_chat

router = APIRouter()


@router.post("/chat", response_model=ChatResponse, response_model_by_alias=True)
def chat(body: ChatRequest) -> ChatResponse:
    """
    Planner dashboard chat: runs :func:`app.services.chat_pipeline.run_chat_pipeline`
    (load session → Gemini reasoning when configured → tool/handler execution → persist →
    ``ChatResponse`` with ``session`` snapshot, including ``myDay``).
    """
    return process_chat(body)
