"""Keyword-based chat orchestration (no LLM). Delegates to existing mock plan/food services where useful."""

from __future__ import annotations

import logging
import re
from collections.abc import Callable
from typing import Any, Literal

from app.models.chat_reasoning_schemas import GeminiChatReasoning
from app.models.chat_schemas import (
    ChatIntent,
    ChatPreferences,
    ChatRequest,
    ChatResponse,
    FoodLogUpdate,
)
from app.models.schemas import (
    GroceryBasket,
    NutritionSummary,
    PlannerFilters,
    PlanResponse,
)
from app.services.chat_ui_copy import (
    CHAT_EXPLANATION,
    CHAT_MESSAGE,
    chat_explanation_for_refine,
    log_meal_slot_confirmation,
    plan_with_chat_summary,
)
from app.services.food_log_service import log_food_chat
from app.services.explain_plan_service import build_explain_plan_bundle
from app.services.plan_service import (
    build_plan,
    execute_generate_meals,
    execute_plan_groceries,
    execute_refine_plan_chat,
    nutrition_summary_for_plan,
    plan_from_chat_state,
)

logger = logging.getLogger(__name__)


def detect_intent(message: str) -> ChatIntent:
    """Keyword router when Gemini reasoning is unavailable (delegates to reasoning service)."""
    from app.services.chat_reasoning_service import keyword_fallback_chat_intent

    return keyword_fallback_chat_intent(message)


def conversation_only_chat_response(
    intent: ChatIntent,
    reasoning: GeminiChatReasoning | None,
) -> ChatResponse:
    """
    Short assistant turn with no planner snapshot (no stores, products, basket, or meals).

    Used for ``greeting``, ``general_help``, and ``unsupported`` intents.
    """
    if intent not in ("greeting", "general_help", "unsupported"):
        raise ValueError(f"conversation_only_chat_response does not support intent={intent!r}")
    if reasoning is not None:
        msg = (reasoning.message or "").strip() or CHAT_MESSAGE[intent]
        expl = (reasoning.explanation or "").strip() or CHAT_EXPLANATION.get(intent, "")
    else:
        msg = CHAT_MESSAGE[intent]
        expl = CHAT_EXPLANATION.get(intent, "")
    return ChatResponse(
        intent=intent,
        message=msg,
        stores=[],
        candidate_stores=[],
        selected_store=None,
        store_pick_reason="",
        products=[],
        basket=GroceryBasket(items=[], subtotal_usd=0.0),
        meal_plan=[],
        nutrition_summary=_empty_nutrition(),
        food_log_updates=[],
        daily_insight="",
        explanation=expl,
    )


def _diet_from_string(diet_type: str) -> Literal["vegetarian", "non_veg", "either"]:
    d = diet_type.lower()
    if "non" in d or "meat" in d or "omni" in d:
        return "non_veg"
    if "veg" in d:
        return "vegetarian"
    return "either"


def _planner_filters(prefs: ChatPreferences) -> PlannerFilters:
    return PlannerFilters(
        budget_usd=prefs.budget,
        grocery_days=prefs.days,
        diet=_diet_from_string(prefs.diet_type),
        risky_foods=prefs.risky_foods,
        cuisine=prefs.cuisine_preference,
        zip_code=prefs.zip_code,
    )


def _nutrition_from_chat_state(state: dict[str, Any]) -> NutritionSummary | None:
    if not state:
        return None
    raw = state.get("nutritionSummary") or state.get("nutrition_summary")
    if not raw:
        return None
    try:
        return NutritionSummary.model_validate(raw)
    except Exception:
        return None


def _empty_nutrition() -> NutritionSummary:
    return NutritionSummary(
        score=0,
        calories_today=0,
        protein_g=0.0,
        carbs_g=0.0,
        fat_g=0.0,
        fiber_g=0.0,
        highlights=[],
        micronutrient_totals={},
    )


def _from_plan_response(
    intent: ChatIntent,
    text: str,
    plan: PlanResponse,
    *,
    nutrition_summary: Any | None = None,
    food_log_updates: list[FoodLogUpdate] | None = None,
    daily_insight: str = "",
    explanation: str = "",
    log_meal_session_patch: dict[str, Any] | None = None,
) -> ChatResponse:
    cand = list(plan.candidate_stores or plan.stores)
    return ChatResponse(
        intent=intent,
        message=text,
        stores=plan.stores,
        candidate_stores=cand,
        selected_store=plan.selected_store,
        store_pick_reason=plan.store_pick_reason or "",
        products=plan.recommended_products,
        basket=plan.basket,
        meal_plan=plan.meal_plans,
        nutrition_summary=nutrition_summary or _empty_nutrition(),
        food_log_updates=food_log_updates or [],
        daily_insight=daily_insight
        or "Protein looks steady. Add vegetables or fruit with your next meal.",
        explanation=explanation,
        log_meal_session_patch=log_meal_session_patch,
    )


def handle_plan_groceries(req: ChatRequest) -> ChatResponse:
    filters = _planner_filters(req.preferences)
    result = execute_plan_groceries(filters, req.message)
    msg = (result.headline or result.plan.assistant_summary or CHAT_MESSAGE["plan_groceries"]).strip()
    expl = (result.explanation or CHAT_EXPLANATION["plan_groceries"]).strip()
    plan = plan_with_chat_summary(result.plan, msg)
    return _from_plan_response(
        "plan_groceries",
        msg,
        plan,
        nutrition_summary=result.nutrition_summary,
        daily_insight=result.daily_insight,
        explanation=expl,
    )


def handle_refine_plan(req: ChatRequest) -> ChatResponse:
    filters = _planner_filters(req.preferences)
    previous = plan_from_chat_state(req.current_state) or build_plan(filters)
    result = execute_refine_plan_chat(previous, filters, req.message)
    msg = (result.headline or result.plan.assistant_summary or CHAT_MESSAGE["refine_plan"]).strip()
    expl = (result.explanation or chat_explanation_for_refine(req.message)).strip()
    plan = plan_with_chat_summary(result.plan, msg)
    return _from_plan_response(
        "refine_plan",
        msg,
        plan,
        nutrition_summary=result.nutrition_summary,
        daily_insight=result.daily_insight,
        explanation=expl,
    )


def handle_generate_meals(req: ChatRequest) -> ChatResponse:
    filters = _planner_filters(req.preferences)
    base = plan_from_chat_state(req.current_state) or build_plan(filters)
    result = execute_generate_meals(base, filters, req.message)
    msg = CHAT_MESSAGE["generate_meals"]
    expl = CHAT_EXPLANATION["generate_meals"]
    plan = plan_with_chat_summary(result.plan, msg)
    return _from_plan_response(
        "generate_meals",
        msg,
        plan,
        nutrition_summary=result.nutrition_summary,
        daily_insight=result.daily_insight,
        explanation=expl,
    )


def handle_log_food(
    req: ChatRequest,
    *,
    gemini_reasoning: GeminiChatReasoning | None = None,
) -> ChatResponse:
    """
    Log foods to My Day using mock nutrition lookup. When ``gemini_reasoning`` is set
    (and reflects a ``log_food`` turn from the model), ``meal_slot`` and ``foods`` from
    that payload improve slot detection and parsing; the backend still owns nutrition math.
    """
    prior = _nutrition_from_chat_state(req.current_state)
    raw_my = (req.current_state or {}).get("myDay") or {}
    my_day_slots = {
        "breakfast": raw_my.get("breakfast"),
        "lunch": raw_my.get("lunch"),
        "dinner": raw_my.get("dinner"),
    }
    logger.info(
        "handle_log_food: prior_cal=%s my_day_slots=%s",
        getattr(prior, "calories_today", None) if prior else None,
        {k: bool(v) for k, v in my_day_slots.items()},
    )
    use_gr = gemini_reasoning is not None and gemini_reasoning.intent == "log_food"
    bundle = log_food_chat(
        req.message,
        prior,
        my_day_slots,
        structured_meal_slot=gemini_reasoning.meal_slot if use_gr else None,
        structured_foods=list(gemini_reasoning.foods) if use_gr and gemini_reasoning.foods else None,
    )
    filters = _planner_filters(req.preferences)
    plan_raw = plan_from_chat_state(req.current_state) or build_plan(filters)
    updates = [FoodLogUpdate(item=label, action="logged") for label in bundle.update_labels]
    msg = log_meal_slot_confirmation(bundle.meal_slot)
    expl = CHAT_EXPLANATION["log_food"]
    plan = plan_with_chat_summary(plan_raw, msg)
    meal_patch = {
        "meal_slot": bundle.meal_slot,
        "slot": {
            "title": bundle.entry_title,
            "calories": bundle.entry_calories,
            "macrosSummary": bundle.entry_macros_summary,
            "logged": True,
        },
    }
    logger.info(
        "handle_log_food: merged_cal=%s patch_slot=%s",
        bundle.nutrition.calories_today,
        bundle.meal_slot,
    )
    return _from_plan_response(
        "log_food",
        msg,
        plan,
        nutrition_summary=bundle.nutrition,
        food_log_updates=updates,
        daily_insight=bundle.daily_insight,
        explanation=expl,
        log_meal_session_patch=meal_patch,
    )


def handle_explain_plan(req: ChatRequest) -> ChatResponse:
    filters = _planner_filters(req.preferences)
    plan_raw = plan_from_chat_state(req.current_state) or build_plan(filters)
    nutrition = _nutrition_from_chat_state(req.current_state) or nutrition_summary_for_plan(
        plan_raw, filters.grocery_days
    )
    bundle = build_explain_plan_bundle(req.message, plan_raw, filters, nutrition)
    msg = CHAT_MESSAGE["explain_plan"]
    expl = CHAT_EXPLANATION["explain_plan"]
    plan = plan_with_chat_summary(plan_raw, msg)
    daily = bundle.daily_insight or "Ask about a store, your nutrition, or what to change next."
    return _from_plan_response(
        "explain_plan",
        msg,
        plan,
        nutrition_summary=nutrition,
        explanation=expl,
        daily_insight=daily,
    )


_INTENT_HANDLERS: dict[ChatIntent, Callable[[ChatRequest], ChatResponse]] = {
    "plan_groceries": handle_plan_groceries,
    "refine_plan": handle_refine_plan,
    "generate_meals": handle_generate_meals,
    "log_food": handle_log_food,
    "explain_plan": handle_explain_plan,
}


def _chat_fallback_response(req: ChatRequest, intent: ChatIntent) -> ChatResponse:
    """Stable full schema when a handler fails (demo / hackathon safe)."""
    if intent in ("greeting", "general_help", "unsupported"):
        return conversation_only_chat_response(intent, None)
    filters = _planner_filters(req.preferences)
    try:
        plan_raw = plan_from_chat_state(req.current_state) or build_plan(filters)
        nutrition = nutrition_summary_for_plan(plan_raw, filters.grocery_days)
    except Exception:
        plan_raw = build_plan(filters)
        nutrition = nutrition_summary_for_plan(plan_raw, filters.grocery_days)
    msg = "Something went wrong. Here is a fresh plan you can use right away."
    expl = "Try your request again in a moment."
    plan = plan_with_chat_summary(plan_raw, msg)
    return _from_plan_response(
        intent,
        msg,
        plan,
        nutrition_summary=nutrition,
        food_log_updates=[],
        daily_insight="Try asking for a grocery plan, meal ideas from your basket, or to log what you ate.",
        explanation=expl,
    )


def _short_ui_line(text: str, max_len: int) -> str:
    t = (text or "").strip()
    if len(t) <= max_len:
        return t
    if max_len <= 1:
        return "…"
    return f"{t[: max_len - 1].rstrip()}…"


def process_chat(req: ChatRequest) -> ChatResponse:
    """
    Public entry for ``POST /chat``. Delegates to :func:`app.services.chat_pipeline.run_chat_pipeline`
    (load session → Gemini reasoning → tool/handler execution → persist → return).
    """
    from app.services.chat_pipeline import run_chat_pipeline

    return run_chat_pipeline(req)
