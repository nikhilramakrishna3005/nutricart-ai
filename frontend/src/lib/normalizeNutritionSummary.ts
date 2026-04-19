import type { NutritionSummary } from "@/types";

function num(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

/**
 * Coerce POST `/chat` / GET `/session` nutrition payloads into the canonical TS shape.
 * Handles snake_case (Python default) and occasional camelCase keys.
 */
export function normalizeNutritionSummaryApi(raw: unknown): NutritionSummary | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const micro = o.micronutrient_totals ?? o.micronutrientTotals;
  const microObj =
    micro && typeof micro === "object" ? (micro as Record<string, number>) : undefined;

  return {
    score: Math.round(num(o.score, 0)),
    calories_today: Math.round(num(o.calories_today ?? o.caloriesToday, 0)),
    protein_g: num(o.protein_g ?? o.proteinG, 0),
    carbs_g: num(o.carbs_g ?? o.carbsG, 0),
    fat_g: num(o.fat_g ?? o.fatG, 0),
    fiber_g: num(o.fiber_g ?? o.fiberG ?? o.fibre_g ?? o.fibreG, 0),
    highlights: Array.isArray(o.highlights) ? (o.highlights as string[]) : [],
    micronutrient_totals: microObj ?? {},
  };
}
