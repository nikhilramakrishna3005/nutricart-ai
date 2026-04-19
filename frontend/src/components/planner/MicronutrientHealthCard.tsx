"use client";

import { useMemo } from "react";

import { usePlannerNutriBridge } from "@/lib/store/usePlannerNutriBridge";
import { cn } from "@/lib/utils";
import type { NutritionSummary } from "@/types";

type Status = "Low" | "Moderate";

type Row = { key: string; name: string; pct: number; color: string; status: Status };

const DEMO_ROWS: Row[] = [
  { key: "iron", name: "Iron", pct: 40, color: "#60A5FA", status: "Low" },
  { key: "vitamin_d", name: "Vitamin D", pct: 30, color: "#34D399", status: "Low" },
  { key: "calcium", name: "Calcium", pct: 55, color: "#A3E635", status: "Moderate" },
];

/** Aligns with {@link MacroRingsCard} daily rough targets (grams). */
const GOALS = { protein: 80, fiber: 30, carbs: 250 } as const;

function rowsFromNutrition(n: NutritionSummary): Row[] {
  const fiberPct = Math.min(100, Math.round((n.fiber_g / GOALS.fiber) * 100));
  const proteinPct = Math.min(100, Math.round((n.protein_g / GOALS.protein) * 100));
  const carbPct = Math.min(100, Math.round((n.carbs_g / GOALS.carbs) * 100));
  const statusFor = (pct: number): Status => (pct < 48 ? "Low" : "Moderate");
  return [
    {
      key: "fibre_live",
      name: "Fibre",
      pct: fiberPct,
      color: "#38BDF8",
      status: statusFor(fiberPct),
    },
    {
      key: "protein_live",
      name: "Protein",
      pct: proteinPct,
      color: "#4ADE80",
      status: statusFor(proteinPct),
    },
    {
      key: "carbs_live",
      name: "Carbs",
      pct: carbPct,
      color: "#F59E0B",
      status: statusFor(carbPct),
    },
  ];
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "Low") {
    return (
      <span className="shrink-0 rounded-md border border-[#EA580C]/50 bg-[#EA580C]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-label-caps text-[#FB923C]">
        Low
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-md border border-[#4ADE80]/35 bg-[#4ADE80]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-label-caps text-[#86EFAC]">
      Moderate
    </span>
  );
}

interface MicronutrientHealthCardProps {
  className?: string;
}

/**
 * Nutrient balance rows: live data from `/chat` via {@link usePlannerNutriBridge}, else demo rows.
 */
export function MicronutrientHealthCard({ className }: MicronutrientHealthCardProps) {
  const { nutritionSummary } = usePlannerNutriBridge();

  const rows = useMemo(
    () => (nutritionSummary ? rowsFromNutrition(nutritionSummary) : DEMO_ROWS),
    [nutritionSummary],
  );

  const suggested =
    nutritionSummary?.highlights?.[0]?.trim() ??
    "Add spinach, eggs, or milk to improve iron, vitamin D, and calcium intake.";

  return (
    <section
      className={cn(
        "w-full rounded-[20px] border border-[#2A3A50] bg-[#131C2A] p-4 sm:p-5",
        className,
      )}
      aria-labelledby="micro-health-title"
    >
      <div className="mb-4">
        <h2
          id="micro-health-title"
          className="text-base font-bold tracking-tight text-[#EEF2F7] sm:text-[17px]"
        >
          Micronutrient Health
        </h2>
        <p className="mt-0.5 text-xs font-medium tracking-tight text-[#5E7590] sm:text-sm">
          Key gaps to improve today
        </p>
      </div>

      <ul className="space-y-4">
        {rows.map((row) => (
          <li key={row.key}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold tracking-tight text-[#EEF2F7]">{row.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tabular-nums text-[#EEF2F7]">{row.pct}%</span>
                <StatusBadge status={row.status} />
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1D2D40]">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${row.pct}%`, backgroundColor: row.color }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-xl border border-[#2A3A50] bg-[#1A2333] p-3.5 sm:p-4">
        <p className="text-[11px] font-bold uppercase tracking-section-caps text-[#5E7590]">
          Suggested fix
        </p>
        <p className="mt-2 text-sm font-normal leading-relaxed text-[#EEF2F7]">{suggested}</p>
      </div>
    </section>
  );
}
