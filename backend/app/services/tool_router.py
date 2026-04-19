"""Execute Gemini ``tool_calls`` against mock-compatible backend tools.

Combines outputs into a :class:`~app.models.chat_schemas.ChatResponse`. Session
persistence stays in :func:`app.services.state_service.persist_after_chat`.
"""

from __future__ import annotations

import re
from typing import Any

from app.models.chat_reasoning_schemas import ChatToolCall
from app.models.chat_schemas import ChatIntent, ChatRequest, ChatResponse, FoodLogUpdate
from app.models.schemas import NutritionSummary, PlanResponse, Store


ALLOWED_TOOLS: frozenset[str] = frozenset(
    {
        "get_nearby_stores",
        "compare_store_products",
        "build_grocery_plan",
        "generate_meal_plan",
        "log_food_entry",
        "explain_nutrition_gap",
    }
)

FULL_PLAN_TOOLS: frozenset[str] = frozenset(
    {"build_grocery_plan", "generate_meal_plan", "log_food_entry", "explain_nutrition_gap"}
)


def _plan_response_from_chat(resp: ChatResponse) -> PlanResponse:
    cand = list(resp.candidate_stores or resp.stores)
    return PlanResponse(
        assistant_summary=resp.message,
        stores=resp.stores,
        candidate_stores=cand,
        selected_store=resp.selected_store,
        store_pick_reason=resp.store_pick_reason or "",
        recommended_products=resp.products,
        basket=resp.basket,
        meal_plans=resp.meal_plan,
    )


def _normalize_tool_name(name: str) -> str:
    s = (name or "").strip()
    s = re.sub(r"[\s\-]+", "_", s)
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s)
    return s.lower()


def _baseline_chat_response(req: ChatRequest, intent_hint: ChatIntent) -> ChatResponse:
    """Lazy import avoids circular dependency with ``chat_service``."""
    from app.services.chat_service import (
        CHAT_EXPLANATION,
        CHAT_MESSAGE,
        _from_plan_response,
        _nutrition_from_chat_state,
        _planner_filters,
        plan_with_chat_summary,
    )
    from app.services.plan_service import build_plan, nutrition_summary_for_plan, plan_from_chat_state

    filters = _planner_filters(req.preferences)
    plan_raw = plan_from_chat_state(req.current_state) or build_plan(filters)
    nutrition = _nutrition_from_chat_state(req.current_state) or nutrition_summary_for_plan(
        plan_raw, filters.grocery_days
    )
    msg = CHAT_MESSAGE.get(intent_hint, CHAT_MESSAGE["plan_groceries"])
    if intent_hint == "plan_groceries" and (plan_raw.assistant_summary or "").strip():
        msg = plan_raw.assistant_summary.strip()
    if intent_hint == "refine_plan":
        from app.services.chat_ui_copy import chat_explanation_for_refine

        expl = chat_explanation_for_refine(req.message)
    else:
        expl = CHAT_EXPLANATION.get(intent_hint, CHAT_EXPLANATION["plan_groceries"])
    plan = plan_with_chat_summary(plan_raw, msg)
    return _from_plan_response(
        intent_hint,
        msg,
        plan,
        nutrition_summary=nutrition,
        daily_insight="",
        explanation=expl,
    )


def _response_from_plan_tool(
    intent: ChatIntent,
    data: dict[str, Any],
    *,
    default_message: str,
    default_explanation: str,
) -> ChatResponse:
    from app.services.chat_service import _from_plan_response, plan_with_chat_summary

    plan = PlanResponse.model_validate(data["plan"])
    nutrition = NutritionSummary.model_validate(data["nutrition_summary"])
    headline = str(data.get("headline") or plan.assistant_summary or default_message)
    msg = headline[:400] if headline else default_message
    plan2 = plan_with_chat_summary(plan, msg)
    expl = str(data.get("explanation") or default_explanation)
    daily = str(data.get("daily_insight") or "")
    return _from_plan_response(
        intent,
        msg,
        plan2,
        nutrition_summary=nutrition,
        daily_insight=daily,
        explanation=expl,
    )


def _response_from_log_tool(
    data: dict[str, Any],
    plan_raw: PlanResponse,
    *,
    default_explanation: str,
) -> ChatResponse:
    from app.services.chat_ui_copy import log_meal_slot_confirmation
    from app.services.chat_service import _from_plan_response, plan_with_chat_summary

    nutrition = NutritionSummary.model_validate(data["nutrition"])
    labels = data.get("update_labels") or []
    updates = [FoodLogUpdate(item=str(x), action="logged") for x in labels if str(x).strip()]
    slot = str(data.get("meal_slot") or "breakfast")
    msg = log_meal_slot_confirmation(slot)
    plan = plan_with_chat_summary(plan_raw, msg)
    expl = str(data.get("explanation") or default_explanation)
    patch = data.get("log_meal_session_patch")
    if not isinstance(patch, dict):
        patch = None
    return _from_plan_response(
        "log_food",
        msg,
        plan,
        nutrition_summary=nutrition,
        food_log_updates=updates,
        daily_insight=str(data.get("daily_insight") or ""),
        explanation=expl,
        log_meal_session_patch=patch,
    )


def _response_from_explain_tool(
    data: dict[str, Any],
    plan_raw: PlanResponse,
    nutrition: NutritionSummary,
) -> ChatResponse:
    from app.services.chat_service import _from_plan_response, plan_with_chat_summary

    msg = str(data.get("message") or "").strip() or "Here's why I recommended this."
    plan = plan_with_chat_summary(plan_raw, msg)
    expl = str(data.get("explanation") or "")
    daily = str(data.get("daily_insight") or "")
    return _from_plan_response(
        "explain_plan",
        msg,
        plan,
        nutrition_summary=nutrition,
        explanation=expl,
        daily_insight=daily,
    )


def try_execute_tool_calls(
    req: ChatRequest,
    tool_calls: list[ChatToolCall],
    intent_hint: ChatIntent,
) -> ChatResponse | None:
    """
    Run validated tool names in order, merge patch tools, and return a
    ``ChatResponse`` when at least one tool executed. Returns ``None`` if there is
    nothing to run (unknown names only, or empty list).
    """
    from app.services.chat_service import (
        CHAT_EXPLANATION,
        CHAT_MESSAGE,
        _nutrition_from_chat_state,
        _planner_filters,
    )
    from app.services.food_log_service import log_food_entry
    from app.services.plan_service import (
        build_plan,
        nutrition_summary_for_plan,
        plan_from_chat_state,
        tool_build_grocery_plan,
        tool_explain_nutrition_gap,
        tool_generate_meal_plan,
    )
    from app.services.store_service import (
        DEFAULT_NEARBY_STORE_LIMIT,
        compare_store_products,
        get_nearby_stores,
    )

    normalized: list[tuple[str, dict[str, Any]]] = []
    for tc in tool_calls:
        key = _normalize_tool_name(tc.name)
        if key in ALLOWED_TOOLS:
            args = tc.arguments if isinstance(tc.arguments, dict) else {}
            normalized.append((key, args))

    if not normalized:
        return None

    filters = _planner_filters(req.preferences)
    base_plan = plan_from_chat_state(req.current_state) or build_plan(filters)
    base_nutrition = nutrition_summary_for_plan(base_plan, filters.grocery_days)
    working_plan: PlanResponse = base_plan

    has_full = any(name in FULL_PLAN_TOOLS for name, _ in normalized)
    response: ChatResponse | None = None
    if not has_full:
        response = _baseline_chat_response(req, intent_hint)

    insight_extras: list[str] = []

    for name, args in normalized:
        if name == "get_nearby_stores":
            z = str(args.get("zip_code") or args.get("zipCode") or req.preferences.zip_code or "")
            lim = int(args.get("limit", DEFAULT_NEARBY_STORE_LIMIT))
            raw_radius = args.get("radius_miles") or args.get("radiusMiles") or args.get("radius")
            radius_miles: float | None = None
            if isinstance(raw_radius, (int, float)):
                radius_miles = float(raw_radius)
            elif isinstance(raw_radius, str) and raw_radius.strip():
                try:
                    radius_miles = float(raw_radius.strip())
                except ValueError:
                    radius_miles = None
            q_raw = args.get("query")
            query = str(q_raw).strip() if q_raw is not None else None
            data = get_nearby_stores(
                z,
                limit=lim,
                radius_miles=radius_miles,
                query=query or None,
            )
            stores = [Store.model_validate(s) for s in data.get("stores") or []]
            if response is None:
                response = _baseline_chat_response(req, intent_hint)
            response = response.model_copy(update={"stores": stores})
            continue

        if name == "compare_store_products":
            raw_ids = args.get("store_ids") or args.get("storeIds") or []
            if not isinstance(raw_ids, list):
                raw_ids = []
            prefs = req.preferences
            intent_kw = (
                args.get("intentKeywords")
                or args.get("intent")
                or args.get("keywords")
                or args.get("userIntent")
            )
            intent_str = str(intent_kw).strip() if intent_kw is not None else ""
            cat = args.get("category") or args.get("category_hint")
            diet = args.get("dietType") or args.get("diet_type") or prefs.diet_type
            risky = args.get("riskyFoods") or args.get("risky_foods")
            if risky is None:
                risky_list: list[str] = list(prefs.risky_foods)
            elif isinstance(risky, list):
                risky_list = [str(x) for x in risky]
            else:
                risky_list = [str(risky)]
            raw_budget = args.get("budgetUsd") or args.get("budget_usd") or args.get("budget")
            if raw_budget is None:
                budget_f = float(prefs.budget)
            else:
                try:
                    budget_f = float(raw_budget)
                except (TypeError, ValueError):
                    budget_f = float(prefs.budget)
            cuisine = args.get("cuisinePreference") or args.get("cuisine_preference") or prefs.cuisine_preference
            max_pp = args.get("maxProductsPerStore") or args.get("max_products_per_store") or 14
            try:
                max_pp_i = int(max_pp)
            except (TypeError, ValueError):
                max_pp_i = 14
            zip_for_compare = str(
                args.get("zip_code")
                or args.get("zipCode")
                or args.get("user_zip_code")
                or prefs.zip_code
                or ""
            ).strip()
            data = compare_store_products(
                [str(x) for x in raw_ids],
                intent_keywords=intent_str or None,
                category_hint=str(cat).strip() if cat is not None and str(cat).strip() else None,
                diet_type=str(diet) if diet else None,
                risky_foods=risky_list,
                budget_usd=budget_f,
                cuisine_preference=str(cuisine) if cuisine else None,
                max_products_per_store=max(4, min(max_pp_i, 40)),
                user_zip_code=zip_for_compare or None,
            )
            summary = str(data.get("comparisonSummary") or data.get("summary") or "").strip()
            if summary:
                insight_extras.append(summary)
            continue

        if name == "build_grocery_plan":
            msg_arg = str(args.get("message") or req.message or "")
            payload = tool_build_grocery_plan(filters, msg_arg)
            response = _response_from_plan_tool(
                "plan_groceries",
                payload,
                default_message=CHAT_MESSAGE["plan_groceries"],
                default_explanation=CHAT_EXPLANATION["plan_groceries"],
            )
            working_plan = _plan_response_from_chat(response)
            continue

        if name == "generate_meal_plan":
            msg_arg = str(args.get("message") or req.message or "")
            payload = tool_generate_meal_plan(working_plan, filters, msg_arg)
            response = _response_from_plan_tool(
                "generate_meals",
                payload,
                default_message=CHAT_MESSAGE["generate_meals"],
                default_explanation=CHAT_EXPLANATION["generate_meals"],
            )
            working_plan = _plan_response_from_chat(response)
            continue

        if name == "log_food_entry":
            raw_my = (req.current_state or {}).get("myDay") or {}
            my_day_slots = {
                "breakfast": raw_my.get("breakfast"),
                "lunch": raw_my.get("lunch"),
                "dinner": raw_my.get("dinner"),
            }
            foods = args.get("foods")
            if foods is not None and not isinstance(foods, list):
                foods = None

            prior = _nutrition_from_chat_state(req.current_state)
            ms = args.get("mealSlot") or args.get("meal_slot")
            meal_slot_hint = str(ms).strip() if ms is not None and str(ms).strip() else None
            payload = log_food_entry(
                message=str(args.get("message") or req.message or ""),
                prior=prior,
                my_day=my_day_slots,
                foods=[str(x) for x in foods] if foods else None,
                meal_slot=meal_slot_hint,
            )
            plan_raw = plan_from_chat_state(req.current_state) or build_plan(filters)
            response = _response_from_log_tool(
                payload,
                plan_raw,
                default_explanation=CHAT_EXPLANATION["log_food"],
            )
            continue

        if name == "explain_nutrition_gap":
            plan_src = working_plan
            msg_arg = str(args.get("message") or req.message or "")

            nut = _nutrition_from_chat_state(req.current_state) or base_nutrition
            payload = tool_explain_nutrition_gap(msg_arg, plan_src, filters, nut)
            response = _response_from_explain_tool(payload, plan_src, nut)
            continue

    if response is None:
        return None

    if insight_extras:
        extra = " ".join(insight_extras).strip()
        if extra:
            cur = (response.daily_insight or "").strip()
            merged = f"{cur} {extra}".strip() if cur else extra
            cap = 900
            if len(merged) > cap:
                merged = f"{merged[: cap - 1]}…"
            response = response.model_copy(update={"daily_insight": merged})

    return response
