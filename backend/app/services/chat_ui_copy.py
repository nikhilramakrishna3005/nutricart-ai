"""User-facing `message` / `explanation` lines for `/chat` (structured assistant UX, no debug tone)."""

from __future__ import annotations

from app.models.chat_schemas import ChatIntent
from app.models.schemas import PlanResponse
from app.services.plan_service import RefinementKind, _detect_refinement

# --- Primary line shown in the assistant summary slot (clean, product-style) ---
CHAT_MESSAGE: dict[ChatIntent, str] = {
    "plan_groceries": "I found a grocery plan that fits your budget.",
    "refine_plan": "I adjusted your grocery plan based on your request.",
    "generate_meals": "I created a meal plan from your groceries.",
    "log_food": "Your meal has been logged.",
    "explain_plan": "Here's why I recommended this.",
}

# --- Supporting line (paired with structured blocks; not debug output) ---
CHAT_EXPLANATION: dict[ChatIntent, str] = {
    "plan_groceries": "These picks balance cost, protein, and fibre.",
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
