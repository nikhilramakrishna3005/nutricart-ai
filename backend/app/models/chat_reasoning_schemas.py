"""Strict structured JSON from Gemini for `/chat` reasoning (validated before use)."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.chat_schemas import ChatIntent

ReasoningIntentLiteral = Literal[
    "greeting",
    "general_help",
    "plan_groceries",
    "refine_plan",
    "generate_meals",
    "log_food",
    "explain_nutrition",
    "unsupported",
]

# Backward-compatible alias (same union as ``ReasoningIntentLiteral``).
ChatIntentLiteral = ReasoningIntentLiteral

GreetingTypeLiteral = Literal["generic", "hello", "welcome_back", "thanks", "other"]

PlannerActionLiteral = Literal[
    "none",
    "create_plan",
    "refine_plan",
    "generate_meals",
    "log_meal",
    "explain_nutrition",
]


def reasoning_intent_to_chat_intent(intent: ReasoningIntentLiteral) -> ChatIntent:
    """Map Gemini reasoning intents to persisted/API :class:`~app.models.chat_schemas.ChatIntent`."""
    mapping: dict[ReasoningIntentLiteral, ChatIntent] = {
        "greeting": "greeting",
        "general_help": "general_help",
        "unsupported": "unsupported",
        "plan_groceries": "plan_groceries",
        "refine_plan": "refine_plan",
        "generate_meals": "generate_meals",
        "log_food": "log_food",
        "explain_nutrition": "explain_plan",
    }
    return mapping[intent]


class ChatToolCall(BaseModel):
    """One tool invocation suggested by Gemini; the backend validates and executes."""

    model_config = ConfigDict(extra="ignore")

    name: str = Field(..., min_length=1, max_length=64, description="Snake_case tool name from the allowlist.")
    arguments: dict[str, Any] = Field(default_factory=dict, description="JSON-serializable tool arguments.")

    @field_validator("name", mode="before")
    @classmethod
    def _strip_name(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip()
        return v

    @model_validator(mode="before")
    @classmethod
    def _coerce_args(cls, data: Any) -> Any:
        if isinstance(data, dict) and data.get("arguments") is None:
            data["arguments"] = {}
        return data


class GeminiChatReasoning(BaseModel):
    """
    Strict JSON shape returned by Gemini for routing, UI copy, and optional tools.

    ``intent`` uses the extended reasoning vocabulary; use
    :func:`reasoning_intent_to_chat_intent` before persisting or dispatching handlers.
    """

    model_config = ConfigDict(extra="ignore")

    intent: ReasoningIntentLiteral
    message: str = Field(..., min_length=1, max_length=400)
    explanation: str = Field(default="", max_length=600)
    tool_calls: list[ChatToolCall] = Field(default_factory=list, max_length=12)
    meal_slot: Literal["breakfast", "lunch", "dinner"] | None = None
    foods: list[str] = Field(default_factory=list, max_length=24)
    greeting_type: GreetingTypeLiteral | None = None
    planner_action: PlannerActionLiteral | None = None

    @field_validator("message", "explanation", mode="before")
    @classmethod
    def _strip_text(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("foods", mode="before")
    @classmethod
    def _normalize_foods(cls, v: Any) -> Any:
        if v is None:
            return []
        if not isinstance(v, list):
            return []
        out: list[str] = []
        for x in v:
            if x is None:
                continue
            s = str(x).strip()
            if s:
                out.append(s[:120])
        return out[:24]

    @model_validator(mode="before")
    @classmethod
    def _coerce_null_collections(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if data.get("tool_calls") is None:
                data["tool_calls"] = []
            if data.get("foods") is None:
                data["foods"] = []
        return data

    @model_validator(mode="after")
    def _sanitize_cross_fields(self) -> GeminiChatReasoning:
        """Drop slot/foods/greeting fields when intent does not apply (noisy model output)."""
        updates: dict[str, Any] = {}
        if self.intent != "log_food":
            if self.meal_slot is not None:
                updates["meal_slot"] = None
            if self.foods:
                updates["foods"] = []
        if self.intent != "greeting" and self.greeting_type is not None:
            updates["greeting_type"] = None
        if updates:
            return self.model_copy(update=updates)
        return self
