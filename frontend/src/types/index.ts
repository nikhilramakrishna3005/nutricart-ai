/** Shared API + UI types (keep in sync with backend Pydantic models). */

export type DietPreference = "vegetarian" | "non_veg" | "either";

export interface PlannerFilters {
  budget_usd: number;
  grocery_days: number;
  diet: DietPreference;
  risky_foods: string[];
  cuisine: string;
  zip_code: string;
}

export interface Store {
  id: string;
  name: string;
  distance_miles: number;
  is_open: boolean;
  opens_at?: string | null;
}

export interface Product {
  id: string;
  name: string;
  store_id: string;
  price_usd: number;
  in_stock: boolean;
  category: string;
}

export interface BasketItem {
  product_id: string;
  name: string;
  quantity: number;
  line_total_usd: number;
}

export interface GroceryBasket {
  items: BasketItem[];
  subtotal_usd: number;
}

export interface MealPlan {
  id: string;
  title: string;
  meals: string[];
  notes?: string;
}

export interface PlanResponse {
  assistant_summary: string;
  stores: Store[];
  recommended_products: Product[];
  basket: GroceryBasket;
  meal_plans: MealPlan[];
}

export type PlanRequest = PlannerFilters;

export interface PlanRefineRequest {
  message: string;
  filters: PlannerFilters;
  previous?: PlanResponse;
}

export interface FoodLogRequest {
  message: string;
}

export interface NutritionSummary {
  score: number;
  calories_today: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  highlights: string[];
}

export interface FoodLogResponse {
  parsed_items: string[];
  nutrition: NutritionSummary;
}

/** `/chat` food log line item (camelCase from API). */
export interface FoodLogUpdate {
  item: string;
  action: string;
}

/** One logged meal slot from backend session file. */
export interface MyDaySlot {
  title: string;
  calories: number;
  macrosSummary: string;
  logged: boolean;
}

/** Section id (settings row) -> saved field values. Mirrors `session_state.json` `settings`. */
export type PersistedSettingsState = Record<string, Record<string, string | number | boolean>>;

/** Saved session snapshot (file-backed, single-user MVP). */
export interface PersistedSessionState {
  chatHistory: Array<Record<string, unknown>>;
  stores: Store[];
  products: Product[];
  basket: GroceryBasket;
  mealPlan: MealPlan[];
  nutritionSummary: NutritionSummary | null;
  dailyInsight: string;
  explanation: string;
  intent: string;
  assistantSummary: string;
  foodLogUpdates: FoodLogUpdate[];
  myDay: {
    breakfast: MyDaySlot | null;
    lunch: MyDaySlot | null;
    dinner: MyDaySlot | null;
  };
  /** App settings modals (`PATCH /settings`). */
  settings?: PersistedSettingsState;
}

/** POST `/chat` response (FastAPI `response_model_by_alias=True`). */
export interface ChatResponse {
  intent: string;
  message: string;
  stores: Store[];
  products: Product[];
  basket: GroceryBasket;
  mealPlan: MealPlan[];
  nutritionSummary: NutritionSummary;
  foodLogUpdates: FoodLogUpdate[];
  dailyInsight: string;
  explanation: string;
  /** Full session after this turn (same shape as GET /session). */
  session: PersistedSessionState;
}

/** POST `/chat` body — preferences use camelCase for the backend. */
export interface ChatPreferencesPayload {
  budget: number;
  days: number;
  dietType: string;
  riskyFoods: string[];
  cuisinePreference: string;
  zipCode: string;
}

export interface ChatRequestPayload {
  message: string;
  preferences: ChatPreferencesPayload;
  currentState: Record<string, unknown>;
}
