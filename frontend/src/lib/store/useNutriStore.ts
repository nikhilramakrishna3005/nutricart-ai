import { create } from "zustand";

import type {
  ChatResponse,
  FoodLogUpdate,
  GroceryBasket,
  MealPlan,
  MyDaySlot,
  NutritionSummary,
  PersistedSessionState,
  PlannerFilters,
  Product,
  Store,
} from "@/types";

import {
  cloneSettingsRowDefaults,
  mergeSessionSettingsIntoDefaults,
  type SessionSettingsBlob,
  type SettingsRowValuesMap,
} from "@/data/settingsFormSchema";
import { normalizeNutritionSummaryApi } from "@/lib/normalizeNutritionSummary";
import { sessionHasPersistedPlannerData } from "@/lib/store/sessionHydration";

const CONVERSATION_ONLY_INTENTS = new Set(["greeting", "general_help", "unsupported"]);

const EMPTY_BASKET: GroceryBasket = { items: [], subtotal_usd: 0 };

const EMPTY_MY_DAY = {
  breakfast: null as MyDaySlot | null,
  lunch: null as MyDaySlot | null,
  dinner: null as MyDaySlot | null,
};

/** Default filters (aligned with prior standalone chat demo). */
export const DEFAULT_NUTRI_PREFERENCES: PlannerFilters = {
  budget_usd: 60,
  grocery_days: 5,
  diet: "either",
  risky_foods: [],
  cuisine: "american",
  zip_code: "94103",
};

/** Full planner-shaped payload (e.g. from `/chat` or `/plan`). */
export interface SetPlanInput {
  stores: Store[];
  products: Product[];
  basket: GroceryBasket;
  meals: MealPlan[];
  nutritionSummary: NutritionSummary | null;
}

export interface UpdateMealsInput {
  meals: MealPlan[];
}

export interface LogFoodInput {
  nutritionSummary: NutritionSummary;
}

export interface NutriStoreState {
  /** True when session or chat has restored planner-relevant data. */
  hasSnapshot: boolean;
  preferences: PlannerFilters;
  stores: Store[];
  products: Product[];
  basket: GroceryBasket;
  meals: MealPlan[];
  nutritionSummary: NutritionSummary | null;
  dailyInsight: string;
  explanation: string;
  foodLogUpdates: FoodLogUpdate[];
  /** Breakfast / lunch / dinner slots from persisted session (`log_food`). */
  myDay: {
    breakfast: MyDaySlot | null;
    lunch: MyDaySlot | null;
    dinner: MyDaySlot | null;
  };
  /** Server-backed chat transcript (`GET /session` + each `POST /chat` `session`). */
  chatHistory: PersistedSessionState["chatHistory"];
  /** `/settings` + `session.settings` (merged with defaults on hydrate). */
  settings: SettingsRowValuesMap;
  setPreferences: (prefs: PlannerFilters) => void;
  setPlan: (data: SetPlanInput) => void;
  updateMeals: (data: UpdateMealsInput) => void;
  logFood: (data: LogFoodInput) => void;
  /** Apply a `/chat` response to the shared dashboard snapshot. */
  applyChatResponse: (res: ChatResponse) => void;
  /** Restore store from GET /session (page refresh). */
  hydrateFromPersistedSession: (session: PersistedSessionState) => void;
}

type MyDaySlice = NutriStoreState["myDay"];

export function mergeMyDayFromSession(prev: MyDaySlice, incoming: PersistedSessionState["myDay"] | null | undefined): MyDaySlice {
  if (!incoming || typeof incoming !== "object") return prev;
  return {
    breakfast: (incoming.breakfast !== undefined ? incoming.breakfast : prev.breakfast) ?? null,
    lunch: (incoming.lunch !== undefined ? incoming.lunch : prev.lunch) ?? null,
    dinner: (incoming.dinner !== undefined ? incoming.dinner : prev.dinner) ?? null,
  };
}

export const useNutriStore = create<NutriStoreState>((set) => ({
  hasSnapshot: false,
  preferences: { ...DEFAULT_NUTRI_PREFERENCES },
  stores: [],
  products: [],
  basket: EMPTY_BASKET,
  meals: [],
  nutritionSummary: null,
  dailyInsight: "",
  explanation: "",
  foodLogUpdates: [],
  myDay: { ...EMPTY_MY_DAY },
  chatHistory: [],
  settings: cloneSettingsRowDefaults(),

  setPreferences: (prefs) => set({ preferences: prefs }),

  setPlan: (data) =>
    set({
      hasSnapshot: true,
      stores: data.stores,
      products: data.products,
      basket: data.basket,
      meals: data.meals,
      nutritionSummary: data.nutritionSummary,
    }),

  updateMeals: (data) => set({ meals: data.meals, hasSnapshot: true }),

  logFood: (data) =>
    set({
      hasSnapshot: true,
      nutritionSummary: data.nutritionSummary,
    }),

  /**
   * Single sink for POST `/chat` — drives `/planner` via {@link usePlannerNutriBridge}.
   * Grocery / refine / meals / explain: full structured payload; log_food: nutrition + log lines + insight on top of plan fields from the API.
   */
  applyChatResponse: (res) =>
    set((s) => {
      const convOnly = CONVERSATION_ONLY_INTENTS.has(res.intent);
      const normalizedNutrition =
        normalizeNutritionSummaryApi(res.nutritionSummary) ??
        normalizeNutritionSummaryApi(res.session?.nutritionSummary) ??
        null;
      const mergedMyDay = mergeMyDayFromSession(s.myDay, res.session?.myDay);
      const sessionPatch = {
        myDay: mergedMyDay,
        chatHistory: res.session?.chatHistory ?? s.chatHistory,
        settings: res.session
          ? mergeSessionSettingsIntoDefaults(res.session.settings as SessionSettingsBlob | undefined)
          : s.settings,
      };
      if (process.env.NODE_ENV === "development" && res.intent === "log_food") {
        // Temporary pipeline trace (remove when stable).
        console.info("[nutricart:log_food] applyChatResponse", {
          calories: normalizedNutrition?.calories_today,
          protein: normalizedNutrition?.protein_g,
          carbs: normalizedNutrition?.carbs_g,
          fiber: normalizedNutrition?.fiber_g,
          score: normalizedNutrition?.score,
          microKeys: normalizedNutrition?.micronutrient_totals
            ? Object.keys(normalizedNutrition.micronutrient_totals).slice(0, 8)
            : [],
          myDay: mergedMyDay,
        });
      }
      if (convOnly) {
        return { ...s, ...sessionPatch };
      }
      return {
        ...s,
        ...sessionPatch,
        hasSnapshot: true,
        stores: res.stores ?? [],
        products: res.products ?? [],
        basket: res.basket ?? EMPTY_BASKET,
        meals: res.mealPlan ?? [],
        nutritionSummary: normalizedNutrition ?? s.nutritionSummary ?? null,
        dailyInsight: res.dailyInsight ?? "",
        explanation: res.explanation ?? "",
        foodLogUpdates: res.foodLogUpdates ?? [],
      };
    }),

  hydrateFromPersistedSession: (session) => {
    const has = sessionHasPersistedPlannerData(session);
    const md = session.myDay ?? EMPTY_MY_DAY;
    const ns = normalizeNutritionSummaryApi(session.nutritionSummary);
    set({
      hasSnapshot: has,
      stores: session.stores ?? [],
      products: session.products ?? [],
      basket: session.basket ?? EMPTY_BASKET,
      meals: session.mealPlan ?? [],
      nutritionSummary: ns,
      dailyInsight: session.dailyInsight ?? "",
      explanation: session.explanation ?? "",
      foodLogUpdates: session.foodLogUpdates ?? [],
      myDay: {
        breakfast: md.breakfast ?? null,
        lunch: md.lunch ?? null,
        dinner: md.dinner ?? null,
      },
      chatHistory: session.chatHistory ?? [],
      settings: mergeSessionSettingsIntoDefaults(session.settings as SessionSettingsBlob | undefined),
    });
  },
}));
