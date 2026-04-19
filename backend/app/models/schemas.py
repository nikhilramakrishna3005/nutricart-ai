"""Request/response models shared across routes (keep aligned with frontend types)."""

from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator


class PlannerFilters(BaseModel):
    budget_usd: float = Field(..., ge=0)
    grocery_days: int = Field(..., ge=1, le=30)
    diet: Literal["vegetarian", "non_veg", "either"]
    risky_foods: list[str] = Field(default_factory=list)
    cuisine: str
    zip_code: str


class Store(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    distance_miles: float
    is_open: bool
    address: str = ""
    opens_at: str | None = None
    zip_code: str | None = None
    last_updated: str | None = None
    #: Populated when the row comes from OSM live lookup vs mock fixtures.
    source: Literal["live", "mock"] | None = None


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    store_id: str
    price_usd: float
    in_stock: bool
    category: str
    #: ``live`` when pricing/SKU rows come from a real retailer feed; ``mock`` for fixtures / hybrid catalog.
    source: Literal["live", "mock"] | None = None
    diet_type: str | None = None
    risky_tags: list[str] = Field(default_factory=list)
    nutrition_tags: list[str] = Field(default_factory=list)
    calories: int | None = None
    protein_g: float | None = None
    fiber_g: float | None = None
    carbs_g: float | None = None


class BasketItem(BaseModel):
    product_id: str
    name: str
    quantity: int
    line_total_usd: float


class GroceryBasket(BaseModel):
    items: list[BasketItem]
    subtotal_usd: float


class MealPlan(BaseModel):
    id: str
    title: str
    meals: list[str]
    notes: str | None = None


class PlanResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    assistant_summary: str
    #: Up to four nearby options (open-first ranking); same as ``candidate_stores`` when populated.
    stores: list[Store]
    candidate_stores: list[Store] = Field(
        default_factory=list,
        serialization_alias="candidateStores",
        description="Nearby retailer options shown in chat (max four).",
    )
    selected_store: Store | None = Field(default=None, serialization_alias="selectedStore")
    store_pick_reason: str = Field(default="", serialization_alias="storePickReason")
    recommended_products: list[Product]
    basket: GroceryBasket
    meal_plans: list[MealPlan]

    @model_validator(mode="after")
    def _backfill_store_fields(self) -> Self:
        """Older sessions only had ``stores``; keep ``candidate_stores`` in sync."""
        if self.candidate_stores:
            return self
        if self.stores:
            return self.model_copy(update={"candidate_stores": list(self.stores)})
        return self


PlanRequest = PlannerFilters


class PlanRefineRequest(BaseModel):
    message: str
    filters: PlannerFilters
    previous: PlanResponse | None = None


class FoodLogRequest(BaseModel):
    message: str


class NutritionSummary(BaseModel):
    score: int
    calories_today: int
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    highlights: list[str]
    #: Cumulative micronutrients from matched mock nutrition rows (mg/mcg keys), food-log path only.
    micronutrient_totals: dict[str, float] = Field(default_factory=dict)


class FoodLogResponse(BaseModel):
    parsed_items: list[str]
    nutrition: NutritionSummary
