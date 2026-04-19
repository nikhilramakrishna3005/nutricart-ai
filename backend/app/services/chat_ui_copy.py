"""User-facing `message` / `explanation` lines for `/chat` (structured assistant UX, no debug tone)."""

from __future__ import annotations

from app.models.chat_schemas import ChatIntent
from app.models.schemas import PlanResponse
from app.services.plan_service import RefinementKind, _detect_refinement

# --- Primary line shown in the assistant summary slot (clean, product-style) ---
CHAT_MESSAGE: dict[ChatIntent, str] = {
    "greeting": "Hi — I’m NutriCart AI. I can help with groceries, meals, food logging, and nutrition questions.",
    "general_help": "I can build grocery plans, suggest meals from your cart, log what you ate, and explain nutrition tradeoffs.",
    "unsupported": "I’m focused on groceries and nutrition for this demo — try asking for a shopping plan or meal ideas.",
    "plan_groceries": "Here is a grocery plan tailored to your filters and ZIP.",
    "refine_plan": "I adjusted your grocery plan based on your request.",
    "generate_meals": "I created a meal plan from your groceries.",
    "log_food": "Your meal has been logged.",
    "explain_plan": "Here's why I recommended this.",
}

# --- Supporting line (paired with structured blocks; not debug output) ---
CHAT_EXPLANATION: dict[ChatIntent, str] = {
    "greeting": "Use the chat box to ask for a plan, refine your cart, or log a meal.",
    "general_help": "Set filters (budget, diet, zip) in the planner, then ask in natural language.",
    "unsupported": "Ask for groceries, meal ideas from your basket, food logging, or a nutrition explanation.",
    "plan_groceries": "Up to four nearby stores are ranked open-first; the basket uses one selected store with representative items for budgeting.",
    "refine_plan": "Tell me what to change — cheaper, one store, higher protein, and more.",
    "generate_meals": "These meals use the items already in your basket.",
    "log_food": "This improves fibre and carb progress for today.",
    "explain_plan": "It balances affordability, nutrition, and your preferences.",
}

_REFINE_EXPLANATION: dict[RefinementKind, str] = {
    "cheaper": "This version spends less while keeping the foods you rely on.",
    "avoid_dairy": "This version avoids dairy and uses simple swaps where it helps.",
    "more_protein": "This version adds protein where it still fits your budget.",
    "one_store": "This version keeps everything at one store for easier pickup.",
    "veg_alternatives": "This version leans more vegetarian and stays budget-friendly.",
    "reduce_carbs": "This version trims carbs on the heavier items.",
    "none": "This version reflects what you asked for and stays within your budget.",
}


def log_meal_slot_confirmation(slot: str) -> str:
    """Short assistant line after logging (matches resolved My Day slot)."""
    return {
        "breakfast": "Breakfast logged.",
        "lunch": "Lunch logged.",
        "dinner": "Dinner logged.",
    }.get(slot, "Meal logged.")


def chat_explanation_for_refine(user_message: str) -> str:
    kind = _detect_refinement(user_message)
    return _REFINE_EXPLANATION[kind]


def plan_with_chat_summary(plan: PlanResponse, assistant_summary: str) -> PlanResponse:
    """Keep structured plan data; align `assistant_summary` with the chat bubble text."""
    if plan.assistant_summary == assistant_summary:
        return plan
    return plan.model_copy(update={"assistant_summary": assistant_summary})
