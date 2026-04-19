"""Rule-based food logging: parse chat text, match `MOCK_FOOD_NUTRITION`, roll up macros (no NLP libs)."""

from __future__ import annotations

import re
from typing import Any, NamedTuple

from data.mock_food_nutrition import MOCK_FOOD_NUTRITION

from app.models.schemas import FoodLogRequest, FoodLogResponse, NutritionSummary

# Short spoken fragments → canonical table keys (deterministic).
_FRAGMENT_ALIASES: dict[str, str] = {
    "yogurt": "greek yogurt",
    "greek yogurt": "greek yogurt",
    "chicken": "chicken breast",
    "oats": "oatmeal",
    "oat": "oatmeal",
    "oatmeal": "oatmeal",
    "rice": "white rice",
    "bananas": "banana",
    "berries": "blueberries",
    "pb": "peanut butter",
    "peanut butter": "peanut butter",
}

MEAL_SLOTS = ("breakfast", "lunch", "dinner")


def infer_explicit_meal_slot(message: str) -> str | None:
    """Detect breakfast / lunch / dinner from the raw user message (word boundaries)."""
    m = message.lower()
    if re.search(r"\bbreakfast\b", m):
        return "breakfast"
    if re.search(r"\blunch\b", m):
        return "lunch"
    if re.search(r"\bdinner\b", m):
        return "dinner"
    return None


def _meal_slot_value_empty(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip() == ""
    if isinstance(value, dict):
        if not value:
            return True
        return not value.get("logged")
    return True


def pick_default_meal_slot(my_day: dict[str, Any]) -> str:
    """First empty breakfast → lunch → dinner; if all filled, overwrite breakfast."""
    for key in MEAL_SLOTS:
        if _meal_slot_value_empty(my_day.get(key)):
            return key
    return "breakfast"


class FoodLogChatBundle(NamedTuple):
    """Rich result for `/chat` `log_food` (labels + copy + merged nutrition + My Day slot)."""

    nutrition: NutritionSummary
    update_labels: list[str]
    parsed_fragments: list[str]
    headline: str
    daily_insight: str
    explanation: str
    meal_slot: str
    entry_calories: int
    entry_title: str
    entry_macros_summary: str


def _parse_food_items(message: str) -> list[str]:
    """
    Strip common logging phrases, meal slot words, then split on connectors.

    Handles: "I had pasta and yogurt", "I ate oats and banana for breakfast",
    "Log chicken and rice for lunch".
    """
    raw = message.strip().lower()
    raw = re.sub(r"^\s*log\s+", "", raw)
    raw = re.sub(r"^\s*(i|we)\s+(had|ate|have eaten)\s+", "", raw)
    raw = re.sub(r"^\s*(had|ate)\s+", "", raw)
    raw = re.sub(r"\s*\bfor (breakfast|lunch|dinner|brunch|a snack|snack)\b.*$", "", raw)
    raw = re.sub(r"\s*\b(this morning|tonight)\b", "", raw)
    raw = re.sub(r"\b(some|a few|little bit of|bit of|just)\b", " ", raw)
    raw = re.sub(r"\s+", " ", raw).strip()

    parts = re.split(r"\s*(?:,|;|\band\b|\bwith\b)\s*", raw)
    filler = re.compile(r"^(a|an|the|my|our|another|extra)\s+")

    out: list[str] = []
    for p in parts:
        p = filler.sub("", p.strip()).strip()
        if len(p) >= 2:
            out.append(p[:56])
    return out[:8] if out else [message.strip()[:56]]


def _lookup_nutrition_row(fragment: str) -> dict[str, Any] | None:
    """Longest-name-first fuzzy match on `MOCK_FOOD_NUTRITION`."""
    low = fragment.lower().strip()
    if not low:
        return None
    hinted = _FRAGMENT_ALIASES.get(low, low)
    for candidate in (hinted, low):
        for row in sorted(MOCK_FOOD_NUTRITION, key=lambda r: -len(str(r["name"]))):
            name = str(row["name"]).lower()
            if name in candidate or candidate in name:
                return row
            for token in name.split():
                if len(token) > 2 and token in candidate.split():
                    return row
    return None


def _fat_from_macros(cal: float, protein: float, carbs: float, fiber: float) -> float:
    accounted = 4 * protein + 4 * carbs + 2 * fiber
    remainder = max(0.0, cal - accounted)
    return round(min(cal * 0.45 / 9, remainder / 9), 1)


def _heuristic_macros(n_chunks: int) -> tuple[int, float, float, float, float]:
    """Fallback when nothing hits the mock table."""
    cal = 120 * max(1, n_chunks)
    protein = 6.0 * max(1, n_chunks)
    carbs = 18.0 * max(1, n_chunks)
    fiber = 2.0 * max(1, n_chunks)
    fat = _fat_from_macros(float(cal), protein, carbs, fiber)
    return cal, protein, carbs, fiber, fat


def _merge_micronutrients(rows: list[dict[str, Any]]) -> dict[str, float]:
    merged: dict[str, float] = {}
    for row in rows:
        micro = row.get("micronutrients") or {}
        for k, v in micro.items():
            try:
                merged[k] = merged.get(k, 0.0) + float(v)
            except (TypeError, ValueError):
                continue
    return merged


def _micro_lines(merged: dict[str, float], limit: int = 2) -> list[str]:
    if not merged:
        return []
    top = sorted(merged.items(), key=lambda kv: -kv[1])[:limit]
    return [f"{k.replace('_', ' ').title()} shifted with what you logged." for k, _ in top]


def _score_from_totals(cal: int, protein: float, fiber: float, carbs: float) -> int:
    s = 58
    s += min(18, int(protein / 2))
    s += min(12, int(fiber * 1.2))
    s -= min(12, max(0, carbs - 220) // 30)
    s += min(8, max(0, 2000 - cal) // 400)
    return max(52, min(98, s))


def _log_food_compute(
    message: str,
    prior: NutritionSummary | None,
    my_day: dict[str, Any] | None,
) -> FoodLogChatBundle:
    frags = _parse_food_items(message)
    rows: list[dict[str, Any]] = []
    labels: list[str] = []
    for frag in frags:
        row = _lookup_nutrition_row(frag)
        if row:
            rows.append(row)
            labels.append(str(row["name"]))
        else:
            labels.append(f"{frag.strip().title()} (estimated)")

    micro: dict[str, float] = {}
    if rows:
        dcal = sum(int(r["calories"]) for r in rows)
        dp = sum(float(r["protein"]) for r in rows)
        dfib = sum(float(r["fiber"]) for r in rows)
        dcarbs = sum(float(r["carbs"]) for r in rows)
        dfat = sum(
            _fat_from_macros(float(r["calories"]), float(r["protein"]), float(r["carbs"]), float(r["fiber"]))
            for r in rows
        )
        micro = _merge_micronutrients(rows)
        micro_lines = _micro_lines(micro, 2)
        highlights = [
            f"We linked {len(rows)} of your foods to our nutrition reference.",
            *micro_lines,
        ]
        if len(highlights) < 3:
            highlights.append("Carb and protein totals updated with this entry.")
    else:
        hcal, hp, hcarbs, hfib, hfat = _heuristic_macros(len(frags))
        dcal, dp, dcarbs, dfib, dfat = int(hcal), hp, hcarbs, hfib, hfat
        highlights = [
            "We used light estimates for those phrases.",
            "Try common names like oatmeal, banana, or chicken breast for tighter matches.",
        ]

    if prior:
        tcal = int(prior.calories_today) + int(dcal)
        tp = round(float(prior.protein_g) + dp, 1)
        tc = round(float(prior.carbs_g) + dcarbs, 1)
        tfib = round(float(prior.fiber_g) + dfib, 1)
        tfat = round(float(prior.fat_g) + dfat, 1)
        lead = f"Added to what you already logged today. About {tcal} kilocalories so far."
        highlights = [lead, *_micro_lines(micro, 2)]
        if len(highlights) < 3:
            highlights.append(f"This entry added about {int(dcal)} kilocalories.")
        highlights = highlights[:3]
    else:
        tcal, tp, tc, tfib, tfat = int(dcal), round(dp, 1), round(dcarbs, 1), round(dfib, 1), round(dfat, 1)

    score = _score_from_totals(tcal, tp, tfib, tc)

    if len(frags) == 1:
        headline = "Logged your meal."
    else:
        headline = "Logged those items."
    headline = f"{headline}\nAbout {tcal} kilocalories toward today's total."
    if prior:
        headline += "\nMerged with what you already logged today."

    if tp >= 90:
        daily = "Protein is strong for today. Add fruit or vegetables with your next meal."
    elif tfib < 18:
        daily = "Fibre still has room. Beans, oats, or fruit later will round things out."
    else:
        daily = "Solid balance for today. Repeat this pattern tomorrow if it felt easy."

    expl = (
        "We split your message into foods, matched what we could, and summed calories and macros. "
        "Numbers are estimates until you adjust serving sizes."
    )

    nutrition = NutritionSummary(
        score=score,
        calories_today=tcal,
        protein_g=tp,
        carbs_g=tc,
        fat_g=tfat,
        fiber_g=tfib,
        highlights=highlights[:3],
    )

    explicit = infer_explicit_meal_slot(message)
    default_slot = pick_default_meal_slot(my_day or {})
    meal_slot = explicit or default_slot

    clean_labels = [re.sub(r"\s+\(estimated\)\s*$", "", x, flags=re.I) for x in labels]
    entry_title = ", ".join(clean_labels) if clean_labels else "Logged items"
    entry_macros_summary = f"{dp:.0f}g protein · {dcarbs:.0f}g carbs · {dfib:.0f}g fibre"

    return FoodLogChatBundle(
        nutrition=nutrition,
        update_labels=labels,
        parsed_fragments=frags,
        headline=headline,
        daily_insight=daily,
        explanation=expl,
        meal_slot=meal_slot,
        entry_calories=int(dcal),
        entry_title=entry_title,
        entry_macros_summary=entry_macros_summary,
    )


def log_food_chat(
    message: str,
    prior: NutritionSummary | None,
    my_day: dict[str, Any] | None = None,
) -> FoodLogChatBundle:
    """Chat `log_food` path with optional merge onto `nutritionSummary` from `currentState`."""
    return _log_food_compute(message, prior, my_day)


def log_food_intake(body: FoodLogRequest) -> FoodLogResponse:
    """HTTP `/food/log` — no prior-day merge (stateless)."""
    bundle = _log_food_compute(body.message, prior=None, my_day=None)
    return FoodLogResponse(parsed_items=bundle.parsed_fragments, nutrition=bundle.nutrition)
