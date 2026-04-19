"""
`/chat` orchestration pipeline (single-user MVP).

Steps (backend remains source of truth; Gemini never writes session):

1. **Load** persisted session from disk.
2. **Merge** request ``currentState`` with that snapshot so the model and handlers
   see the same hydrated planner view.
3. **Reason** — call Gemini for structured JSON validated as
   :class:`~app.models.chat_reasoning_schemas.GeminiChatReasoning`, or fall back to
   keyword classification in :mod:`app.services.chat_reasoning_service`.
4. **Execute** validated ``tool_calls`` via :mod:`app.services.tool_router`, or run the
   intent-specific handler that builds plan/nutrition/log patches from server rules.
   Greeting / help intents skip planner generation entirely.
5. **Assemble** the :class:`~app.models.chat_schemas.ChatResponse` (stores, products,
   basket, meal plan, nutrition, food log lines, daily insight, explanation). ``myDay``
   is carried in the persisted ``session`` payload after step 6 (see ``session.myDay``).
6. **Persist** chat turn + planner snapshot + ``myDay`` updates via
   :func:`app.services.state_service.persist_after_chat` (only the backend mutates
   ``session_state.json``).
7. **Return** the same response shape as before, with ``session`` set to the merged
   saved state for frontend hydration.
"""

from __future__ import annotations

import logging
from typing import Any, Literal

from app.models.chat_reasoning_schemas import GeminiChatReasoning, reasoning_intent_to_chat_intent
from app.models.chat_schemas import ChatIntent, ChatRequest, ChatResponse
from app.services.chat_reasoning_service import infer_chat_reasoning
from app.services.state_service import (
    load_state,
    merge_request_with_persisted_session,
    persist_after_chat,
)
from app.services.tool_router import try_execute_tool_calls

logger = logging.getLogger(__name__)

_PLANNER_INTENTS: frozenset[ChatIntent] = frozenset(
    {
        "plan_groceries",
        "refine_plan",
        "generate_meals",
        "log_food",
        "explain_plan",
    }
)


def _normalize_message(req: ChatRequest) -> ChatRequest:
    msg = (req.message or "").strip()
    if msg == req.message:
        return req
    return req.model_copy(update={"message": msg})


def _apply_gemini_ui_overlay(response: ChatResponse, reasoning: GeminiChatReasoning) -> ChatResponse:
    from app.services.chat_service import _short_ui_line

    ui_msg = _short_ui_line(reasoning.message, 120)
    ui_expl = _short_ui_line(reasoning.explanation, 180)
    patch: dict[str, Any] = {}
    if ui_msg:
        patch["message"] = ui_msg
    if ui_expl:
        patch["explanation"] = ui_expl
    if not patch:
        return response
    return response.model_copy(update=patch)


def _execute_backend_actions(
    req: ChatRequest,
    reasoning: GeminiChatReasoning | None,
    intent: ChatIntent,
) -> ChatResponse:
    """Step 4–5: tools first (when Gemini supplied calls), else intent handler."""
    from app.services.chat_service import (
        _INTENT_HANDLERS,
        _chat_fallback_response,
        conversation_only_chat_response,
        handle_log_food,
        handle_plan_groceries,
    )

    if intent not in _PLANNER_INTENTS:
        logger.info("chat pipeline: planner generation skipped (intent=%s)", intent)
        return conversation_only_chat_response(intent, reasoning)

    tool_response: ChatResponse | None = None
    if reasoning is not None and reasoning.tool_calls:
        tool_response = try_execute_tool_calls(req, reasoning.tool_calls, intent)

    if tool_response is not None:
        assert reasoning is not None
        return tool_response.model_copy(update={"intent": reasoning_intent_to_chat_intent(reasoning.intent)})

    try:
        if intent == "log_food":
            gr = reasoning if reasoning is not None and reasoning.intent == "log_food" else None
            return handle_log_food(req, gemini_reasoning=gr)
        handler = _INTENT_HANDLERS.get(intent, handle_plan_groceries)
        return handler(req)
    except Exception:
        return _chat_fallback_response(req, intent)


def run_chat_pipeline(req: ChatRequest) -> ChatResponse:
    """
    Run the full `/chat` pipeline and return a :class:`~app.models.chat_schemas.ChatResponse`
    with ``session`` populated from disk after persistence.
    """
    from app.services.chat_service import detect_intent

    req = _normalize_message(req)
    logger.info("chat pipeline: incoming message=%r", req.message)

    # 1–2: load + merge (backend-owned snapshot; Gemini only receives a read-only view).
    snapshot = load_state()
    req = merge_request_with_persisted_session(req, snapshot)

    # 3: Gemini structured reasoning (validated Pydantic schema).
    reasoning = infer_chat_reasoning(req)
    reasoning_source: Literal["gemini", "fallback_keyword"] = "gemini" if reasoning is not None else "fallback_keyword"
    intent: ChatIntent = (
        reasoning_intent_to_chat_intent(reasoning.intent)
        if reasoning is not None
        else detect_intent(req.message)
    )
    logger.info(
        "chat pipeline: detected_intent=%s reasoning_source=%s",
        intent,
        reasoning_source,
    )
    if intent == "log_food":
        cs = req.current_state or {}
        ns = cs.get("nutritionSummary") or cs.get("nutrition_summary")
        md = cs.get("myDay") or {}
        logger.info(
            "chat pipeline: log_food request currentState keys=%s prior_cal=%s my_day_filled=%s",
            sorted(cs.keys())[:20],
            (ns or {}).get("calories_today") if isinstance(ns, dict) else None,
            {k: bool(md.get(k)) for k in ("breakfast", "lunch", "dinner")} if isinstance(md, dict) else None,
        )

    # 4–5: execute tools or handlers; build planner-shaped response.
    response = _execute_backend_actions(req, reasoning, intent)
    if reasoning is not None:
        response = _apply_gemini_ui_overlay(response, reasoning)

    # 6–7: persist then attach canonical session (includes myDay, chatHistory, settings, …).
    full_session = persist_after_chat(req.message, response, base=snapshot)
    return response.model_copy(update={"session": full_session})
