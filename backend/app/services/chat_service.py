"""Keyword-based chat orchestration (no LLM). Delegates to existing mock plan/food services where useful."""

from __future__ import annotations

import re
from collections.abc import Callable
from typing import Any, Literal

from app.models.chat_schemas import (
    ChatIntent,
    ChatPreferences,
    ChatRequest,
    ChatResponse,
    FoodLogUpdate,
)
from app.models.schemas import (
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
from app.services.state_service import (
    load_state,
    merge_request_with_persisted_session,
    persist_after_chat,
)


def detect_intent(message: str) -> ChatIntent:
    """Very small keyword router; first match wins (order = specificity)."""
    m = message.lower()

    if re.search(r"\b(ate|eaten|logged|food log|i had|had a|i ate)\b", m) or re.match(r"^\s*log\b", m):
        return "log_food"
    if re.search(r"\b(why|explain|breakdown|reason)\b", m) or re.search(
        r"\b(what should i change|what to change|why is|why are|why did|nutrition breakdown)\b",
        m,
    ):
        return "explain_plan"
    if re.search(
        r"\b(recipe|recipes|cook|cooking|meal idea|ideas for meals|meal plan|"
        r"(?:two|2)[- ]day|(?:three|3)[- ]day|[4-7][- ]day|"
        r"dinner ideas|lunch ideas|breakfast ideas|ideas for dinner|"
        r"high[- ]protein(?: meals?)?|high protein\b|"
        r"plan meals|with these groceries|from (this|my) cart|using (these|my) groceries)\b",
        m,
    ):
        return "generate_meals"
    if re.search(
        r"\b(refine|swap|replace|instead|change|adjust|cheaper|less expensive|budget tighter|"
        r"reduce carbs?|low carb|avoid dairy|dairy[- ]free|one store|single store|"
        r"more protein|higher protein|vegetarian alternative|meatless alternative|replace meat)\b",
        m,
    ):
        return "refine_plan"
    if re.search(
        r"\b(grocery|groceries|shop|shopping|cart|basket|store|plan|budget|buy)\b",
        m,
    ):
        return "plan_groceries"
    return "plan_groceries"


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
    return ChatResponse(
        intent=intent,
        message=text,
        stores=plan.stores,
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
    msg = CHAT_MESSAGE["plan_groceries"]
    expl = CHAT_EXPLANATION["plan_groceries"]
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
    msg = CHAT_MESSAGE["refine_plan"]
    expl = chat_explanation_for_refine(req.message)
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


def handle_log_food(req: ChatRequest) -> ChatResponse:
    prior = _nutrition_from_chat_state(req.current_state)
    raw_my = (req.current_state or {}).get("myDay") or {}
    my_day_slots = {
        "breakfast": raw_my.get("breakfast"),
        "lunch": raw_my.get("lunch"),
        "dinner": raw_my.get("dinner"),
    }
    bundle = log_food_chat(req.message, prior, my_day_slots)
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


def process_chat(req: ChatRequest) -> ChatResponse:
    """
    Dispatch by `detect_intent` to the matching handler. Normalizes empty text;
    wraps handlers so the client always gets a valid `ChatResponse`.

    Loads `data/session_state.json` into `current_state` before handling, then
    persists the snapshot after each response (single-user MVP).
    """
    msg = (req.message or "").strip()
    if not msg:
        msg = "plan groceries"
    if msg != req.message:
        req = req.model_copy(update={"message": msg})

    snapshot = load_state()
    req = merge_request_with_persisted_session(req, snapshot)

    intent = detect_intent(req.message)
    handler = _INTENT_HANDLERS.get(intent, handle_plan_groceries)
    try:
        response = handler(req)
    except Exception:
        response = _chat_fallback_response(req, intent)
    full_session = persist_after_chat(req.message, response, base=snapshot)
    return response.model_copy(update={"session": full_session})
