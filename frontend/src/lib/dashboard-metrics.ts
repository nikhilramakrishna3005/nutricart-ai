import type { SettingsRowValuesMap } from "@/data/settingsFormSchema";
import {
  buildMicronutrientPlannerRows,
  calculateCaloriePercent,
  calculateDayTotalsFromNutrition,
  calculateMacroPercent,
  calculateMicronutrientCompletion,
  calculateOverallNutritionScore,
  resolveMacroTargets,
  type MacroTargets,
} from "@/lib/nutrition-calculations";
import type { MyDaySlot, NutritionSummary } from "@/types";

export type DashboardMacroRing = {
  key: "protein" | "fibre" | "carbs";
  label: string;
  percentage: number;
  color: string;
};

export type DashboardMicroRow = {
  key: string;
  name: string;
  pct: number;
  color: string;
  status: "Low" | "Moderate" | "Good";
};

export type DashboardMetrics = {
  targets: MacroTargets;
  totals: ReturnType<typeof calculateDayTotalsFromNutrition>;
  proteinPercent: number;
  carbsPercent: number;
  fibrePercent: number;
  caloriesPercent: number;
  macroRings: DashboardMacroRing[];
  calorieProgress: number;
  calorieLine: string;
  otherNutrientsLine: string;
  otherNutrientsProgress: number;
  micronutrientCompletionPercent: number;
  trackedMicrosAchieved: number;
  totalMicrosTracked: number;
  microRows: DashboardMicroRow[];
  /**
   * Single source for today’s overall nutrition score (0–100): planner badge, nutrient breakdown ring,
   * and any “today you’re at X%” copy. Computed only via {@link calculateOverallNutritionScore} in
   * `nutrition-calculations.ts` from the same inputs as the rest of this snapshot.
   */
  overallNutritionPercentToday: number;
  currentDayStreak: number;
  streakTitle: string;
  streakSubtitleText: string;
  weekFlameOn: boolean[];
  macroBalancePct: number;
  /** Alias for profile "Peak Micronutrient" ring. */
  micronutrientPeakPct: number;
};

const RING_COLORS = {
  protein: "#4ADE80",
  fibre: "#38BDF8",
  carbs: "#F59E0B",
} as const;

const MICRO_COLORS = ["#60A5FA", "#34D399", "#A3E635", "#F472B6", "#FBBF24", "#A78BFA", "#22D3EE", "#FB7185", "#C4B5FD"];

function buildMicroRows(nutritionSummary: NutritionSummary | null): DashboardMicroRow[] {
  const plannerRows = buildMicronutrientPlannerRows(nutritionSummary?.micronutrient_totals);
  return plannerRows.map((row, idx) => ({
    key: row.id,
    name: row.label,
    pct: row.pct,
    color: MICRO_COLORS[idx % MICRO_COLORS.length],
    status: row.status,
  }));
}

export type MyDayState = {
  breakfast: MyDaySlot | null;
  lunch: MyDaySlot | null;
  dinner: MyDaySlot | null;
};

export type DashboardMetricsCore = Omit<
  DashboardMetrics,
  "currentDayStreak" | "streakTitle" | "streakSubtitleText" | "weekFlameOn"
>;

/**
 * Planner/profile metrics without streak (streak is merged in {@link useDashboardMetrics} so SSR and
 * the first client paint stay identical — streak persistence uses `localStorage` after mount only).
 */
export function buildDashboardMetricsCore(
  nutritionSummary: NutritionSummary | null,
  settings: SettingsRowValuesMap,
): DashboardMetricsCore {
  const targets = resolveMacroTargets(settings);
  const totals = calculateDayTotalsFromNutrition(nutritionSummary);
  const proteinPercent = calculateMacroPercent(totals.totalProteinToday, targets.proteinTarget);
  const carbsPercent = calculateMacroPercent(totals.totalCarbsToday, targets.carbsTarget);
  const fibrePercent = calculateMacroPercent(totals.totalFibreToday, targets.fibreTarget);
  const caloriesPercent = calculateCaloriePercent(totals.totalCaloriesToday, targets.calorieTarget);

  const micro = calculateMicronutrientCompletion(nutritionSummary?.micronutrient_totals);

  const overallNutritionPercentToday = calculateOverallNutritionScore({
    caloriesPercent,
    proteinPercent,
    carbsPercent,
    fibrePercent,
    micronutrientCompletionPercent: micro.micronutrientCompletionPercent,
  });

  const macroRings: DashboardMacroRing[] = [
    { key: "protein", label: "Protein", percentage: proteinPercent, color: RING_COLORS.protein },
    { key: "fibre", label: "Fibre", percentage: fibrePercent, color: RING_COLORS.fibre },
    { key: "carbs", label: "Carbs", percentage: carbsPercent, color: RING_COLORS.carbs },
  ];

  const calorieProgress = caloriesPercent;
  const calorieLine = `${totals.totalCaloriesToday} / ${targets.calorieTarget} kcal`;
  const otherNutrientsLine = `${micro.achievedCount} / ${micro.totalTracked} tracked`;
  const otherNutrientsProgress =
    micro.totalTracked > 0 ? Math.min(100, Math.round((micro.achievedCount / micro.totalTracked) * 100)) : 0;

  const microRows = buildMicroRows(nutritionSummary);

  const macroBalancePct = Math.round((proteinPercent + carbsPercent + fibrePercent) / 3);

  return {
    targets,
    totals,
    proteinPercent,
    carbsPercent,
    fibrePercent,
    caloriesPercent,
    macroRings,
    calorieProgress: Number.isFinite(calorieProgress) ? Math.min(100, Math.max(0, calorieProgress)) : 0,
    calorieLine,
    otherNutrientsLine,
    otherNutrientsProgress,
    micronutrientCompletionPercent: micro.micronutrientCompletionPercent,
    trackedMicrosAchieved: micro.achievedCount,
    totalMicrosTracked: micro.totalTracked,
    microRows,
    overallNutritionPercentToday,
    macroBalancePct,
    micronutrientPeakPct: micro.micronutrientCompletionPercent,
  };
}
