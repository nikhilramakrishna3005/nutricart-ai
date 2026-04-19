"""Deterministic answers for `explain_plan` — short copy from plan + nutrition signals."""

from __future__ import annotations

import re
from typing import Literal, NamedTuple

from app.models.schemas import NutritionSummary, PlanRequest, PlanResponse

ExplainFocus = Literal["store", "nutrient", "improve", "plan", "general"]


class ExplainPlanBundle(NamedTuple):
    message: str
    explanation: str
    daily_insight: str


def detect_explain_focus(message: str) -> ExplainFocus:
    m = message.lower()
    if re.search(
        r"\b(fiber|fibre|protein|carbs?)\b.*\blow\b|\bwhy\b.*\b(fiber|fibre|protein|carbs?)\b",
        m,
    ):
        return "nutrient"
    if re.search(
        r"\bwhy\b.*\b(store|retailer|shop)\b|\b(store|retailer)\b.*\bwhy\b|\bwhich store\b|\bthis store\b",
        m,
    ):
        return "store"
    if re.search(r"\b(what should i change|what to change|how (can|should) i improve|what to improve)\b", m):
        return "improve"
    if re.search(r"\b(why (did you|this)|why these|why pick|recommendation|why this plan|why the basket)\b", m):
        return "plan"
    if re.search(r"\b(fiber|fibre|protein|carbs?)\b", m):
        return "nutrient"
    if re.search(r"\b(store|retailer|walmart|target|safeway|trader)\b", m):
        return "store"
    return "general"


def build_explain_plan_bundle(
    message: str,
    plan: PlanResponse,
    filters: PlanRequest,
    nutrition: NutritionSummary,
) -> ExplainPlanBundle:
    focus = detect_explain_focus(message)
    stores = plan.stores
    first = stores[0] if stores else None
    basket = plan.basket
    ratio = (basket.subtotal_usd / filters.budget_usd) if filters.budget_usd else 0.0
    store_short = first.name.split("—")[0].strip()[:42] if first else "your top store"

    if focus == "store" and first:
        expl = (
            f"We list {store_short} first because it is open when others may not be, "
            f"and it is among the closest options in your area. This is not a sponsorship—just a good fit for this trip."
        )
        msg = f"{store_short} is first for opening hours and distance on this plan."
        daily = "If that store is closed when you arrive, use the next one on the list without changing your filters."
    elif focus == "nutrient":
        mlow = message.lower()
        if "fiber" in mlow or "fibre" in mlow:
            if nutrition.fiber_g < 12:
                expl = (
                    "Fibre reads low because this basket leans on proteins, grains, and sauces, "
                    "with fewer leafy greens or legumes in the mix."
                )
            else:
                expl = (
                    "Fibre is in a good range for this basket. Add vegetables only if you want more volume."
                )
        elif "protein" in mlow:
            if nutrition.protein_g < 45:
                expl = (
                    "Protein is modest compared with a training-day target. Your picks lean on pantry staples "
                    "without a second anchor like yogurt or chicken."
                )
            else:
                expl = "Protein is solid for this cart. You are not under-fuelled on this plan."
        elif "carb" in mlow:
            if nutrition.carbs_g > 200:
                expl = (
                    "Carbs run higher because rice, pasta, and bread-style items stacked under your budget cap."
                )
            else:
                expl = "Carbs look moderate here. Nothing forces a drastic cut."
        else:
            expl = "We only reflect what is in this basket. Use these notes as guidance, not a diagnosis."
        msg = "Here is a clear read on nutrition for this basket."
        daily = "One swap—beans, frozen vegetables, or fruit—usually lifts fibre more than changing stores."
    elif focus == "improve":
        tips: list[str] = []
        if ratio < 0.72:
            tips.append(
                f"You are using about {int(ratio * 100)} percent of your budget—room for produce or a second protein."
            )
        if nutrition.fiber_g < 12:
            tips.append("Add one high-fibre item next trip: beans, oats, or leafy greens.")
        if filters.risky_foods:
            tips.append(
                "Allergy settings trimmed some items. Widening one safe preference can unlock more variety."
            )
        if not tips:
            tips.append("Rotate cuisine next time so meals do not feel repetitive.")
        expl = " ".join(tips[:2])
        msg = "Small wins: pick one change before rewriting the whole cart."
        daily = "Single swaps stick better than a full redo."
    elif focus == "plan":
        expl = (
            f"We only add in-stock items, respect your {filters.diet} setting and exclusions, "
            f"then build toward about ${filters.budget_usd:.0f}. Cuisine guides variety—not a perfect match on every line."
        )
        msg = "This basket follows your filters and budget, then fills practical gaps."
        daily = "If anything feels tight, adjust budget or filters and ask for an updated grocery plan."
    else:
        expl = (
            f"We start with {store_short}, honor your diet and exclusions, "
            f"then fill the basket toward ${filters.budget_usd:.0f} without odd one-off items."
        )
        msg = "Quick snapshot: stores, filters, then value under your cap."
        daily = "Ask about a store, your macros, or small swaps when you are ready."

    expl = _clip(expl, 320)
    msg = _clip(msg, 200)
    daily = _clip(daily, 160)
    return ExplainPlanBundle(message=msg, explanation=expl, daily_insight=daily)


def _clip(text: str, max_len: int) -> str:
    text = text.strip()
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rstrip() + "…"
