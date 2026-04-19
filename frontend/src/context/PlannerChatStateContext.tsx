"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { sendChat } from "@/lib/api";
import { normalizeNutritionSummaryApi } from "@/lib/normalizeNutritionSummary";
import { useNutriStore } from "@/lib/store/useNutriStore";
import type {
  ChatResponse,
  FoodLogUpdate,
  NutritionSummary,
  PlannerFilters,
  PlanResponse,
} from "@/types";

const DEFAULT_FILTERS: PlannerFilters = {
  budget_usd: 60,
  grocery_days: 5,
  diet: "either",
  risky_foods: [],
  cuisine: "american",
  zip_code: "94103",
};

function filtersToPreferences(f: PlannerFilters) {
  return {
    budget: f.budget_usd,
    days: f.grocery_days,
    dietType: f.diet,
    riskyFoods: f.risky_foods,
    cuisinePreference: f.cuisine,
    zipCode: f.zip_code,
  };
}

function buildCurrentState(
  plan: PlanResponse | null,
  nutrition: NutritionSummary | null,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (nutrition) out.nutritionSummary = nutrition;
  if (!plan) return out;
  return {
    ...out,
    assistant_summary: plan.assistant_summary,
    stores: plan.stores,
    candidate_stores: plan.candidate_stores ?? plan.stores,
    selected_store: plan.selected_store ?? null,
    store_pick_reason: plan.store_pick_reason ?? "",
    recommended_products: plan.recommended_products,
    products: plan.recommended_products,
    basket: plan.basket,
    meal_plans: plan.meal_plans,
    mealPlan: plan.meal_plans,
  };
}

function chatResponseToPlan(res: ChatResponse): PlanResponse {
  const candidates = res.candidateStores ?? res.stores;
  return {
    assistant_summary: res.message,
    stores: res.stores,
    candidate_stores: candidates,
    selected_store: res.selectedStore ?? null,
    store_pick_reason: res.storePickReason ?? "",
    recommended_products: res.products,
    basket: res.basket,
    meal_plans: res.mealPlan,
  };
}

const CONVERSATION_ONLY_INTENTS = new Set(["greeting", "general_help", "unsupported"]);

export type PlannerChatContextValue = {
  filters: PlannerFilters;
  setFilters: Dispatch<SetStateAction<PlannerFilters>>;
  plan: PlanResponse | null;
  nutritionSummary: NutritionSummary | null;
  dailyInsight: string;
  explanation: string;
  foodLogUpdates: FoodLogUpdate[];
  chatSending: boolean;
  chatError: string | null;
  /** Calls POST `/chat`, updates dashboard fields from the structured response. */
  sendChatMessage: (text: string) => Promise<{ assistantText: string }>;
};

/** Null outside `PlannerChatStateProvider` — dashboard cards use optional reads. */
export const PlannerChatContext = createContext<PlannerChatContextValue | null>(null);

export function PlannerChatStateProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<PlannerFilters>(DEFAULT_FILTERS);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [nutritionSummary, setNutritionSummary] = useState<NutritionSummary | null>(null);
  const [dailyInsight, setDailyInsight] = useState("");
  const [explanation, setExplanation] = useState("");
  const [foodLogUpdates, setFoodLogUpdates] = useState<FoodLogUpdate[]>([]);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const sendChatMessage = useCallback(
    async (text: string) => {
      setChatSending(true);
      setChatError(null);
      try {
        const nutri = useNutriStore.getState();
        const effectiveNutrition =
          nutritionSummary ??
          normalizeNutritionSummaryApi(nutri.nutritionSummary) ??
          nutri.nutritionSummary;
        const res = await sendChat({
          message: text,
          preferences: filtersToPreferences(filters),
          currentState: {
            ...buildCurrentState(plan, effectiveNutrition),
            myDay: nutri.myDay,
          },
        });
        useNutriStore.getState().applyChatResponse(res);
        if (!CONVERSATION_ONLY_INTENTS.has(res.intent)) {
          setPlan(chatResponseToPlan(res));
          // Keep in sync with the store merge (normalized top-level + session nutrition, myDay).
          setNutritionSummary(useNutriStore.getState().nutritionSummary ?? null);
          setDailyInsight(res.dailyInsight ?? "");
          setExplanation(res.explanation ?? "");
          setFoodLogUpdates(res.foodLogUpdates ?? []);
        }
        if (process.env.NODE_ENV === "development" && res.intent === "log_food") {
          console.info("[nutricart:log_food] plannerChat pipeline", {
            storeCalories: useNutriStore.getState().nutritionSummary?.calories_today,
            myDay: useNutriStore.getState().myDay,
          });
        }
        const assistantText = res.message?.trim() || `Updated (${res.intent}).`;
        return { assistantText };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed";
        setChatError(msg);
        return {
          assistantText: `Couldn’t reach the planner API. ${msg.slice(0, 140)}`,
        };
      } finally {
        setChatSending(false);
      }
    },
    [filters, plan, nutritionSummary],
  );

  const value = useMemo<PlannerChatContextValue>(
    () => ({
      filters,
      setFilters,
      plan,
      nutritionSummary,
      dailyInsight,
      explanation,
      foodLogUpdates,
      chatSending,
      chatError,
      sendChatMessage,
    }),
    [
      filters,
      plan,
      nutritionSummary,
      dailyInsight,
      explanation,
      foodLogUpdates,
      chatSending,
      chatError,
      sendChatMessage,
    ],
  );

  return <PlannerChatContext.Provider value={value}>{children}</PlannerChatContext.Provider>;
}

export function usePlannerChatOptional() {
  return useContext(PlannerChatContext);
}

export function usePlannerChat() {
  const ctx = usePlannerChatOptional();
  if (!ctx) {
    throw new Error("usePlannerChat must be used within PlannerChatStateProvider");
  }
  return ctx;
}
