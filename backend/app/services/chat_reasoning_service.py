"""Gemini-backed chat reasoning: intent, UI copy, and optional ``tool_calls``."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.models.chat_reasoning_schemas import GeminiChatReasoning
from app.models.chat_schemas import ChatIntent, ChatRequest
from app.services.gemini_service import generate_structured_response

_reasoning_log = logging.getLogger(__name__)


def keyword_fallback_chat_intent(message: str) -> ChatIntent:
    """
    Rule-based intent when Gemini is unavailable or returns invalid JSON.

    Greets and vague help must **not** default to ``plan_groceries``.
    """
    m = (message or "").strip().lower()
    if not m:
        return "general_help"

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

    if re.search(
        r"\b(what can you do|what do you do|how does this work|how do you work|capabilities|"
        r"tell me about (this|nutricart)|who are you|what is nutricart)\b",
        m,
    ) or re.match(r"^\s*help\s*$", m):
        return "general_help"

    if re.match(r"^\s*good\s+(morning|afternoon|evening)\b", m) and not re.search(
        r"\b(plan|shop|buy|grocery|meal|log|store|cart|recipe)\b",
        m,
    ):
        return "greeting"
    if re.match(r"^\s*(hi|hello|hey|howdy|hiya)\b", m) and len(m.split()) <= 8:
        if not re.search(r"\b(plan|shop|buy|grocery|meal|log|store|cart|recipe|budget)\b", m):
            return "greeting"

    return "general_help"


def _compact_session_state(state: dict[str, Any]) -> dict[str, Any]:
    """Trim heavy lists so prompts stay bounded; backend remains source of truth."""
    out = json.loads(json.dumps(state or {}, default=str))
    hist = out.get("chatHistory")
    if isinstance(hist, list) and len(hist) > 10:
        out["chatHistory"] = hist[-10:]
    return out


CHAT_REASONING_SYSTEM_PROMPT = """
You are the reasoning layer for a grocery + nutrition planner (single user, demo).
Output ONLY JSON matching the provided schema. No markdown, no code fences.

Classify the user's LATEST message into exactly one intent:
- greeting: hi/hello/thanks-only; set greeting_type when helpful (generic | hello | welcome_back | thanks | other)
- general_help: how the app works, what NutriCart can do, vague "help" without a concrete plan/food ask
- plan_groceries: new grocery trip, shopping list, stores, basket, budget shop
- refine_plan: change an existing plan (cheaper, swap items, one store, macros/diet tweaks)
- generate_meals: meal ideas, recipes, what to cook from current groceries
- log_food: user ate / logging food or drink
- explain_nutrition: why this plan, nutrition breakdown, what to change (informational "why")
- unsupported: off-topic, unsafe, or cannot be handled here

Fields:
- intent: one of the intents above (exact string).
- message: ONE short sentence for the primary chat bubble (<= 120 characters). Friendly, specific.
- explanation: ONE short supporting line (<= 160 characters). Non-technical, no JSON inside.
- tool_calls: array of {"name": "<snake_case tool>", "arguments": { ... }}. Use [] when no tools are needed.
  Allowed tool names (exact): get_nearby_stores, compare_store_products, build_grocery_plan,
  generate_meal_plan, log_food_entry, explain_nutrition_gap.
  The backend executes these in order and merges results; only use tools that match the user's ask.
  Example arguments: get_nearby_stores: {"zipCode": "<from preferences if unsure>", "radiusMiles": 5, "query": "target"}; compare_store_products: {"storeIds": ["..."], "intentKeywords": "pasta budget", "dietType": "<from preferences>", "riskyFoods": [], "budget": "<from preferences>", "cuisinePreference": "<from preferences>"}; build_grocery_plan: {"message": "<user ask>"}; generate_meal_plan: {"message": "<user ask>"}; log_food_entry: {"message": "<user text>", "mealSlot": "lunch", "foods": ["biryani"]}; explain_nutrition_gap: {"message": "<user ask>"}.
- meal_slot: ONLY for intent log_food — breakfast | lunch | dinner when implied; else null.
- foods: ONLY for intent log_food — food/dish names (max ~6). Otherwise [].
- greeting_type: ONLY for intent greeting — otherwise null.
- planner_action: optional hint for the app: none | create_plan | refine_plan | generate_meals | log_meal | explain_nutrition; use null when unsure.

log_food examples:
- "I ate oatmeal for breakfast" → meal_slot breakfast, foods ["oatmeal"]
- "For lunch I had biriyani" → meal_slot lunch, foods ["biryani"] or ["biriyani"]
- "Dinner was pasta and yogurt" → meal_slot dinner, foods ["pasta","yogurt"]

If ambiguous between refine_plan and explain_nutrition: use explain_nutrition for "why" / breakdown questions; refine_plan when they ask to change the plan.

Do not invent store names, prices, or nutrition numbers. Do not claim actions were completed beyond classification.
""".strip()


def _reasoning_user_prompt(req: ChatRequest) -> str:
    prefs = req.preferences.model_dump(mode="json", by_alias=True)
    session = _compact_session_state(dict(req.current_state or {}))
    user_msg = (req.message or "").strip()
    payload = {
        "user_message": user_msg,
        "saved_preferences": prefs,
        "current_session_state": session,
    }
    return json.dumps(payload, indent=2, ensure_ascii=False)


def infer_chat_reasoning(req: ChatRequest) -> GeminiChatReasoning | None:
    """
    Call Gemini for structured intent + copy. Returns ``None`` if the call fails or
    validation fails (caller should use rule-based routing).

    ``tool_calls`` are executed by :mod:`app.services.tool_router` when valid; on any
    failure the chat layer falls back to keyword routing without tools. For ``log_food``,
    ``meal_slot`` and ``foods`` are consumed by :func:`app.services.food_log_service.log_food_chat`
    (and ``log_food_entry``) so the backend can place My Day slots and match nutrition without
    Gemini writing session state.
    """
    try:
        raw = generate_structured_response(
            CHAT_REASONING_SYSTEM_PROMPT,
            _reasoning_user_prompt(req),
            schema=GeminiChatReasoning,
            temperature=0.12,
        )
        return GeminiChatReasoning.model_validate(raw)
    except Exception:
        _reasoning_log.exception("Gemini reasoning failed; using keyword fallback for this turn")
        return None
