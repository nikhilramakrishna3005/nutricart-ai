"""Chat API request/response models for the planner dashboard (mock / rule-based MVP)."""

from typing import Any, Literal, Self

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, model_validator

from app.models.schemas import GroceryBasket, MealPlan, NutritionSummary, Product, Store

ChatIntent = Literal[
    "greeting",
    "general_help",
    "unsupported",
    "plan_groceries",
    "refine_plan",
    "generate_meals",
    "log_food",
    "explain_plan",
]


class ChatPreferences(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    budget: float = Field(..., ge=0, description="Weekly or trip budget in USD")
    days: int = Field(..., ge=1, le=30)
    diet_type: str = Field(
        ...,
        validation_alias=AliasChoices("dietType", "diet_type"),
        serialization_alias="dietType",
    )
    risky_foods: list[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("riskyFoods", "risky_foods"),
        serialization_alias="riskyFoods",
    )
    cuisine_preference: str = Field(
        ...,
        validation_alias=AliasChoices("cuisinePreference", "cuisine_preference"),
        serialization_alias="cuisinePreference",
    )
    zip_code: str = Field(
        ...,
        validation_alias=AliasChoices("zipCode", "zip_code"),
        serialization_alias="zipCode",
    )


class ChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    message: str
    preferences: ChatPreferences
    current_state: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("currentState", "current_state"),
        serialization_alias="currentState",
    )


class FoodLogUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    item: str
    action: str = "logged"


class ChatResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    intent: str
    message: str
    stores: list[Store]
    candidate_stores: list[Store] = Field(
        default_factory=list,
        serialization_alias="candidateStores",
    )
    selected_store: Store | None = Field(default=None, serialization_alias="selectedStore")
    store_pick_reason: str = Field(default="", serialization_alias="storePickReason")
    products: list[Product]
    basket: GroceryBasket
    meal_plan: list[MealPlan] = Field(serialization_alias="mealPlan")
    nutrition_summary: NutritionSummary = Field(serialization_alias="nutritionSummary")
    food_log_updates: list[FoodLogUpdate] = Field(serialization_alias="foodLogUpdates")
    daily_insight: str = Field(serialization_alias="dailyInsight")
    explanation: str
    session: dict[str, Any] = Field(
        default_factory=dict,
        serialization_alias="session",
        description="Full persisted session after this turn (client hydration: stores, products, basket, mealPlan, nutritionSummary, myDay, chatHistory, …).",
    )
    #: Internal only — My Day slot payload for `log_food` (omitted from JSON).
    log_meal_session_patch: dict[str, Any] | None = Field(default=None, exclude=True)

    @model_validator(mode="after")
    def _backfill_candidate_stores(self) -> Self:
        if self.candidate_stores:
            return self
        if self.stores:
            return self.model_copy(update={"candidate_stores": list(self.stores)})
        return self
