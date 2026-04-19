"use client";

import { useMemo } from "react";

import { usePlannerChatOptional } from "@/context/PlannerChatStateContext";
import { useNutriStore } from "@/lib/store/useNutriStore";
import type { FoodLogUpdate, GroceryBasket, MealPlan, NutritionSummary, Product, Store } from "@/types";

export type PlannerNutriMerged = {
  stores: Store[];
  products: Product[];
  basket: GroceryBasket | null;
  meals: MealPlan[];
  nutritionSummary: NutritionSummary | null;
  dailyInsight: string;
  explanation: string;
  foodLogUpdates: FoodLogUpdate[];
};

/**
 * Dashboard data: prefer global `/chat` snapshot when present, else planner context (legacy).
 */
export function usePlannerNutriBridge(): PlannerNutriMerged {
  const hasSnapshot = useNutriStore((s) => s.hasSnapshot);
  const storesZ = useNutriStore((s) => s.stores);
  const productsZ = useNutriStore((s) => s.products);
  const basketZ = useNutriStore((s) => s.basket);
  const mealsZ = useNutriStore((s) => s.meals);
  const nutritionZ = useNutriStore((s) => s.nutritionSummary);
  const insightZ = useNutriStore((s) => s.dailyInsight);
  const explanationZ = useNutriStore((s) => s.explanation);
  const foodLogZ = useNutriStore((s) => s.foodLogUpdates);

  const ctx = usePlannerChatOptional();
  const plan = ctx?.plan ?? null;

  return useMemo(() => {
    if (hasSnapshot) {
      return {
        stores: storesZ,
        products: productsZ,
        basket: basketZ.items.length ? basketZ : null,
        meals: mealsZ,
        nutritionSummary: nutritionZ,
        dailyInsight: insightZ,
        explanation: explanationZ,
        foodLogUpdates: foodLogZ,
      };
    }
    return {
      stores: plan?.stores ?? [],
      products: plan?.recommended_products ?? [],
      basket: plan?.basket ?? null,
      meals: plan?.meal_plans ?? [],
      nutritionSummary: ctx?.nutritionSummary ?? null,
      dailyInsight: ctx?.dailyInsight ?? "",
      explanation: ctx?.explanation ?? "",
      foodLogUpdates: ctx?.foodLogUpdates ?? [],
    };
  }, [
    hasSnapshot,
    storesZ,
    productsZ,
    basketZ,
    mealsZ,
    nutritionZ,
    insightZ,
    explanationZ,
    foodLogZ,
    ctx,
    plan,
  ]);
}
