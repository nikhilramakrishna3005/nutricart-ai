from fastapi import APIRouter

from app.models.chat_schemas import ChatRequest, ChatResponse
from app.services.chat_service import process_chat

router = APIRouter()


@router.post("/chat", response_model=ChatResponse, response_model_by_alias=True)
def chat(body: ChatRequest) -> ChatResponse:
    """
    Planner dashboard chat: loads `session_state.json`, merges `currentState`, runs the intent
    handler, persists, and returns `ChatResponse` including a `session` snapshot for hydration.
    """
    return process_chat(body)
