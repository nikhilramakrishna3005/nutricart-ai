"use client";

import { useEffect, useMemo, useState } from "react";

import { buildDashboardMetricsCore, type DashboardMetrics } from "@/lib/dashboard-metrics";
import {
  buildDashboardStreakSliceFromPersistence,
  buildStableStreakBeforeHydration,
} from "@/lib/meal-log-streak";
import { usePlannerNutriBridge } from "@/lib/store/usePlannerNutriBridge";
import { useNutriStore } from "@/lib/store/useNutriStore";

export type { DashboardMacroRing, DashboardMicroRow, DashboardMetrics, DashboardMetricsCore } from "@/lib/dashboard-metrics";

export function useDashboardMetrics(): DashboardMetrics {
  const { nutritionSummary } = usePlannerNutriBridge();
  const settings = useNutriStore((s) => s.settings);
  const myDay = useNutriStore((s) => s.myDay);

  const [streakHydrated, setStreakHydrated] = useState(false);
  useEffect(() => {
    setStreakHydrated(true);
  }, []);

  const core = useMemo(
    () => buildDashboardMetricsCore(nutritionSummary, settings),
    [nutritionSummary, settings],
  );

  const streakSlice = useMemo(() => {
    if (!streakHydrated) {
      return buildStableStreakBeforeHydration(myDay, nutritionSummary);
    }
    return buildDashboardStreakSliceFromPersistence(myDay, nutritionSummary);
  }, [streakHydrated, myDay, nutritionSummary]);

  return { ...core, ...streakSlice };
}
