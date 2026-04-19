import type { ChatPreferencesPayload, ChatRequestPayload, ChatResponse } from "@/types";

import { normalizeNutritionSummaryApi } from "@/lib/normalizeNutritionSummary";
import { mergeMyDayFromSession, useNutriStore } from "@/lib/store/useNutriStore";
import type { PlannerFilters } from "@/types";

export function plannerFiltersToChatPreferences(f: PlannerFilters): ChatPreferencesPayload {
  return {
    budget: f.budget_usd,
    days: f.grocery_days,
    dietType: f.diet,
    riskyFoods: f.risky_foods,
    cuisinePreference: f.cuisine,
    zipCode: f.zip_code,
  };
}

const CONVERSATION_ONLY_INTENTS = new Set(["greeting", "general_help", "unsupported"]);

/** Shape `currentState` for the next turn from the last structured response. */
export function currentStateFromChatResponse(res: ChatResponse | null): Record<string, unknown> {
  if (!res) return {};
  // Let the backend merge re-use the persisted planner snapshot (sending empty keys would wipe it).
  if (CONVERSATION_ONLY_INTENTS.has(res.intent)) return {};
  const nz = useNutriStore.getState();
  const nut =
    normalizeNutritionSummaryApi(res.nutritionSummary) ??
    normalizeNutritionSummaryApi(res.session?.nutritionSummary) ??
    nz.nutritionSummary;
  const myDay = mergeMyDayFromSession(nz.myDay, res.session?.myDay);
  return {
    intent: res.intent,
    stores: res.stores,
    candidateStores: res.candidateStores ?? res.stores,
    selectedStore: res.selectedStore,
    storePickReason: res.storePickReason,
    products: res.products,
    basket: res.basket,
    mealPlan: res.mealPlan,
    nutritionSummary: nut,
    myDay,
    foodLogUpdates: res.foodLogUpdates,
    dailyInsight: res.dailyInsight,
    explanation: res.explanation,
  };
}

export function buildStandaloneChatPayload(
  message: string,
  lastResponse: ChatResponse | null,
): ChatRequestPayload {
  const preferences = useNutriStore.getState().preferences;
  return {
    message,
    preferences: plannerFiltersToChatPreferences(preferences),
    currentState: currentStateFromChatResponse(lastResponse),
  };
}
