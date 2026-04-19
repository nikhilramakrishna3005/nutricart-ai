import type { NutritionSummary } from "@/types";
import type { SettingsRowValuesMap } from "@/data/settingsFormSchema";

/** A micronutrient counts as "achieved" for X/Y tracked when logged/target >= this ratio (60%). */
export const MICRONUTRIENT_ACHIEVEMENT_THRESHOLD = 0.6;

/**
 * Overall daily nutrition score (0–100), planner badge + profile alignment.
 *
 * Weighted blend of macro progress toward targets, calories, and micronutrient completion.
 * Each input percent is already clamped 0–100 where applicable.
 *
 * Formula:
 *   overall = round(
 *     0.25 * caloriesPercent +
 *     0.20 * proteinPercent +
 *     0.15 * carbsPercent +
 *     0.20 * fibrePercent +
 *     0.20 * micronutrientCompletionPercent
 *   )
 * Then clamp to [0, 100].
 */
export const OVERALL_SCORE_WEIGHTS = {
  calories: 0.25,
  protein: 0.2,
  carbs: 0.15,
  fibre: 0.2,
  microCompletion: 0.2,
} as const;

export type MacroTargets = {
  proteinTarget: number;
  carbsTarget: number;
  fibreTarget: number;
  fatTarget: number;
  calorieTarget: number;
};

export type CanonicalMicroDef = {
  id: string;
  label: string;
  /** Daily reference intake in the same unit as summed mock data (mg or mcg). */
  rdi: number;
  /** Backend / mock_food_nutrition keys that roll into this nutrient. */
  sourceKeys: string[];
};

/** Core micronutrients we track consistently across dashboard + daily targets. */
export const CANONICAL_MICROS: CanonicalMicroDef[] = [
  { id: "iron", label: "Iron", rdi: 15, sourceKeys: ["iron_mg"] },
  { id: "calcium", label: "Calcium", rdi: 1000, sourceKeys: ["calcium_mg"] },
  { id: "vitamin_c", label: "Vitamin C", rdi: 90, sourceKeys: ["vitamin_c_mg"] },
  { id: "vitamin_d", label: "Vitamin D", rdi: 20, sourceKeys: ["vitamin_d_mcg"] },
  { id: "potassium", label: "Potassium", rdi: 3400, sourceKeys: ["potassium_mg"] },
  { id: "magnesium", label: "Magnesium", rdi: 400, sourceKeys: ["magnesium_mg"] },
  { id: "b12", label: "Vitamin B12", rdi: 2.4, sourceKeys: ["vitamin_b12_mcg"] },
  { id: "folate", label: "Folate", rdi: 400, sourceKeys: ["folate_mcg"] },
  { id: "zinc", label: "Zinc", rdi: 11, sourceKeys: ["zinc_mg"] },
];

export function calculateMacroPercent(current: number, target: number): number {
  const t = Number(target);
  const c = Number(current);
  if (!Number.isFinite(t) || t <= 0) return 0;
  if (!Number.isFinite(c) || c <= 0) return 0;
  return Math.min(100, Math.round((c / t) * 100));
}

/** Safe calorie progress as percent toward target (0–100). */
export function calculateCaloriePercent(calories: number, calorieTarget: number): number {
  return calculateMacroPercent(calories, calorieTarget);
}

function num(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

/**
 * Daily macro + calorie targets from settings (macros row) with stable defaults.
 * Calorie target is derived from macro goals (Atwater) clamped to a sensible band when not explicit in settings.
 */
export function resolveMacroTargets(settings: SettingsRowValuesMap): MacroTargets {
  const macros = settings.macros ?? {};
  const proteinTarget = Math.max(1, num(macros.proteinGoal, 120));
  const carbsTarget = Math.max(1, num(macros.carbGoal, 220));
  const fatTarget = Math.max(1, num(macros.fatGoal, 65));
  const micros = settings.micros ?? {};
  const fibreFocus = Boolean(micros.fibreFocus);
  const fibreTarget = fibreFocus ? 30 : 25;

  const fromMacros = Math.round(proteinTarget * 4 + carbsTarget * 4 + fatTarget * 9);
  const calorieTarget = Math.min(3400, Math.max(1400, fromMacros + 200));

  return {
    proteinTarget,
    carbsTarget,
    fibreTarget,
    fatTarget,
    calorieTarget,
  };
}

function normalizeMicroKey(k: string): string {
  return k.trim().toLowerCase();
}

/** Flatten API totals keyed like mock_food_nutrition into lowercase map. */
export function normalizeMicronutrientTotals(raw: Record<string, number> | undefined | null): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    const nk = normalizeMicroKey(k);
    const n = Number(v);
    if (!nk || !Number.isFinite(n)) continue;
    out[nk] = (out[nk] ?? 0) + n;
  }
  return out;
}

export function sumAmountForMicro(def: CanonicalMicroDef, normalizedTotals: Record<string, number>): number {
  let sum = 0;
  for (const key of def.sourceKeys) {
    sum += normalizedTotals[normalizeMicroKey(key)] ?? 0;
  }
  return sum;
}

/** Micronutrient Health row status vs % of RDI (not the 60% “tracked” threshold). */
export type MicroDisplayStatus = "Low" | "Moderate" | "Good";

export function microDisplayStatusFromPct(pct: number): MicroDisplayStatus {
  const p = Number(pct);
  if (!Number.isFinite(p) || p < 40) return "Low";
  if (p < 80) return "Moderate";
  return "Good";
}

export type MicronutrientPlannerRow = {
  id: string;
  label: string;
  pct: number;
  status: MicroDisplayStatus;
};

/** All canonical micronutrients in stable order for planner Micronutrient Health. */
export function buildMicronutrientPlannerRows(
  micronutrientTotals: Record<string, number> | undefined | null,
): MicronutrientPlannerRow[] {
  const norm = normalizeMicronutrientTotals(micronutrientTotals);
  return CANONICAL_MICROS.map((def) => {
    const amount = sumAmountForMicro(def, norm);
    const pct = def.rdi > 0 ? Math.min(100, Math.round((amount / def.rdi) * 100)) : 0;
    return { id: def.id, label: def.label, pct, status: microDisplayStatusFromPct(pct) };
  });
}

const MICRO_GAP_FOOD_HINTS: Record<string, string> = {
  iron: "leafy greens, beans, lentils, or fortified cereals",
  calcium: "yogurt, milk, tofu with calcium, or fortified plant milks",
  vitamin_c: "citrus, bell peppers, strawberries, or broccoli",
  vitamin_d: "fatty fish, eggs, fortified dairy, or sensible sun exposure",
  potassium: "bananas, potatoes, beans, or spinach",
  magnesium: "nuts, seeds, whole grains, or dark leafy greens",
  b12: "fish, eggs, dairy, or fortified nutritional yeast",
  folate: "lentils, leafy greens, citrus, or fortified grains",
  zinc: "pumpkin seeds, lean meat, chickpeas, or cashews",
};

/**
 * Copy for “Suggested fix” — only micronutrient gaps (lowest %RDI first), no calorie/macro advice.
 */
export function buildMicronutrientGapSuggestion(
  rows: ReadonlyArray<{ id: string; label: string; pct: number }>,
): string {
  const weak = [...rows].filter((r) => r.pct < 70).sort((a, b) => a.pct - b.pct).slice(0, 2);
  if (weak.length === 0) {
    return "Micronutrient coverage looks solid for today — keep rotating colorful produce, whole grains, and lean proteins.";
  }
  const names = weak.map((w) => w.label).join(" and ");
  const foods = weak.map((w) => MICRO_GAP_FOOD_HINTS[w.id] ?? "whole-food sources").join("; ");
  return `Today's intake is lowest for ${names} — prioritize ${foods}.`;
}

export type MicroCompletionResult = {
  /** Count of canonical micros with (amount/rdi) >= MICRONUTRIENT_ACHIEVEMENT_THRESHOLD. */
  achievedCount: number;
  /** Denominator: canonical list length (9). */
  totalTracked: number;
  /** Mean of min(100, amount/rdi*100) across all canonical micros. */
  micronutrientCompletionPercent: number;
  /** Per-nutrient ratio 0..1 for diagnostics / sorting. */
  ratios: Record<string, number>;
};

export function calculateMicronutrientCompletion(
  micronutrientTotals: Record<string, number> | undefined | null,
): MicroCompletionResult {
  const norm = normalizeMicronutrientTotals(micronutrientTotals ?? undefined);
  const ratios: Record<string, number> = {};
  let sumPct = 0;
  let achieved = 0;
  const n = CANONICAL_MICROS.length;

  for (const def of CANONICAL_MICROS) {
    const amount = sumAmountForMicro(def, norm);
    const ratio = def.rdi > 0 ? amount / def.rdi : 0;
    ratios[def.id] = ratio;
    const pct = Math.min(100, Math.round(ratio * 100));
    sumPct += pct;
    if (ratio >= MICRONUTRIENT_ACHIEVEMENT_THRESHOLD) achieved += 1;
  }

  return {
    achievedCount: achieved,
    totalTracked: n,
    micronutrientCompletionPercent: n > 0 ? Math.round(sumPct / n) : 0,
    ratios,
  };
}

/** Explicit name for dashboard "tracked micros" helpers. */
export const calculateTrackedMicronutrients = calculateMicronutrientCompletion;

export type DayMacroTotals = {
  totalCaloriesToday: number;
  totalProteinToday: number;
  totalCarbsToday: number;
  totalFibreToday: number;
  totalFatToday: number;
};

/** Today's rolled-up macros from persisted nutrition summary (food log + session). */
export function calculateDayTotalsFromNutrition(n: NutritionSummary | null | undefined): DayMacroTotals {
  if (!n) {
    return {
      totalCaloriesToday: 0,
      totalProteinToday: 0,
      totalCarbsToday: 0,
      totalFibreToday: 0,
      totalFatToday: 0,
    };
  }
  return {
    totalCaloriesToday: Math.max(0, Math.round(Number(n.calories_today) || 0)),
    totalProteinToday: Math.max(0, Number(n.protein_g) || 0),
    totalCarbsToday: Math.max(0, Number(n.carbs_g) || 0),
    totalFibreToday: Math.max(0, Number(n.fiber_g) || 0),
    totalFatToday: Math.max(0, Number(n.fat_g) || 0),
  };
}

/** Session macros are already rolled up on `NutritionSummary` from the food-log pipeline. */
export const calculateDayTotalsFromMeals = calculateDayTotalsFromNutrition;

/**
 * Weighted “overall nutrition today” score (0–100). The UI must surface this **only** via
 * `buildDashboardMetricsCore` → `overallNutritionPercentToday` (planner badge, nutrient breakdown ring, copy)
 * so all surfaces stay identical.
 */
export function calculateOverallNutritionScore(input: {
  caloriesPercent: number;
  proteinPercent: number;
  carbsPercent: number;
  fibrePercent: number;
  micronutrientCompletionPercent: number;
}): number {
  const w = OVERALL_SCORE_WEIGHTS;
  const raw =
    w.calories * clampPct(input.caloriesPercent) +
    w.protein * clampPct(input.proteinPercent) +
    w.carbs * clampPct(input.carbsPercent) +
    w.fibre * clampPct(input.fibrePercent) +
    w.microCompletion * clampPct(input.micronutrientCompletionPercent);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
