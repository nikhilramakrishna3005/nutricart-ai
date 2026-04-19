"use client";

import { useMemo } from "react";

import { CircularProgress } from "@/components/shared/CircularProgress";
import { usePlannerNutriBridge } from "@/lib/store/usePlannerNutriBridge";
import { cn } from "@/lib/utils";

const DEFAULT_MACROS = [
  { key: "protein", label: "Protein", percentage: 62, color: "#4ADE80" },
  { key: "fibre", label: "Fibre", percentage: 50, color: "#38BDF8" },
  { key: "carbs", label: "Carbs", percentage: 75, color: "#F59E0B" },
] as const;

const RING_SIZE = 88;
const STAGGER_MS = 90;

/** Rough daily targets for ring fill (grams). */
const GOALS = { protein: 80, fiber: 30, carbs: 250 } as const;

interface MacroRingsCardProps {
  className?: string;
}

/**
 * Card row of macro progress rings (reuses {@link CircularProgress}).
 */
export function MacroRingsCard({ className }: MacroRingsCardProps) {
  const { nutritionSummary: nutrition } = usePlannerNutriBridge();

  const macros = useMemo(() => {
    if (!nutrition) return DEFAULT_MACROS;
    const pPct = Math.min(100, Math.round((nutrition.protein_g / GOALS.protein) * 100));
    const fPct = Math.min(100, Math.round((nutrition.fiber_g / GOALS.fiber) * 100));
    const cPct = Math.min(100, Math.round((nutrition.carbs_g / GOALS.carbs) * 100));
    return [
      { key: "protein" as const, label: "Protein", percentage: pPct, color: "#4ADE80" },
      { key: "fibre" as const, label: "Fibre", percentage: fPct, color: "#38BDF8" },
      { key: "carbs" as const, label: "Carbs", percentage: cPct, color: "#F59E0B" },
    ];
  }, [nutrition]);

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-[20px] bg-[#131C2A] px-3 py-6 sm:px-5 sm:py-6",
        className,
      )}
    >
      <div className="flex w-full flex-1 items-start justify-evenly gap-2 sm:gap-4 lg:gap-6">
        {macros.map((macro, index) => (
          <div
            key={macro.key}
            className="flex min-w-0 flex-1 flex-col items-center gap-2.5"
          >
            <CircularProgress
              percentage={macro.percentage}
              color={macro.color}
              size={RING_SIZE}
              animationDelayMs={index * STAGGER_MS}
            />
            <span className="text-center text-[10px] font-semibold uppercase leading-none tracking-label-caps text-[#5E7590]">
              {macro.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
