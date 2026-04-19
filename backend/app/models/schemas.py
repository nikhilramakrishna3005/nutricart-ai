"""Request/response models shared across routes (keep aligned with frontend types)."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


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
    opens_at: str | None = None
    zip_code: str | None = None
    last_updated: str | None = None


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    store_id: str
    price_usd: float
    in_stock: bool
    category: str
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
    assistant_summary: str
    stores: list[Store]
    recommended_products: list[Product]
    basket: GroceryBasket
    meal_plans: list[MealPlan]


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


class FoodLogResponse(BaseModel):
    parsed_items: list[str]
    nutrition: NutritionSummary
