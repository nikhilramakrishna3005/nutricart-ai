import type { ChatPreferencesPayload, ChatRequestPayload, ChatResponse } from "@/types";

import { useNutriStore } from "@/lib/store/useNutriStore";
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

/** Shape `currentState` for the next turn from the last structured response. */
export function currentStateFromChatResponse(res: ChatResponse | null): Record<string, unknown> {
  if (!res) return {};
  return {
    intent: res.intent,
    stores: res.stores,
    products: res.products,
    basket: res.basket,
    mealPlan: res.mealPlan,
    nutritionSummary: res.nutritionSummary,
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
