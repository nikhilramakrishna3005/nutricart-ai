"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";

import { LargeProgressRing } from "@/components/planner/nutrients/LargeProgressRing";
import { NutrientRow } from "@/components/planner/nutrients/NutrientRow";
import { NutrientSection } from "@/components/planner/nutrients/NutrientSection";
import { getSession } from "@/lib/api";
import { PAGE_SCROLL_BOTTOM_PAD } from "@/lib/app-shell";
import { calculateMacroPercent } from "@/lib/nutrition-calculations";
import { useNutriStore } from "@/lib/store/useNutriStore";
import { useDashboardMetrics } from "@/lib/useDashboardMetrics";
import { cn } from "@/lib/utils";

const SCROLL_PAD = cn("pt-2", PAGE_SCROLL_BOTTOM_PAD);

function fmtG(n: number): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  const r = Math.round(x * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/**
 * Full-screen nutrient drill-in: uses {@link useDashboardMetrics} so the hero ring and summary % match
 * the planner top-right badge (`overallNutritionPercentToday` / `calculateOverallNutritionScore`).
 */
export function NutrientDetailPage() {
  const hydrateFromPersistedSession = useNutriStore((s) => s.hydrateFromPersistedSession);
  const dash = useDashboardMetrics();
  const { overallNutritionPercentToday, targets, totals, proteinPercent, carbsPercent, fibrePercent, microRows } =
    dash;

  const fatPercent = calculateMacroPercent(totals.totalFatToday, targets.fatTarget);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await getSession();
        if (!cancelled) hydrateFromPersistedSession(session);
      } catch {
        /* keep store as-is */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateFromPersistedSession]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#2A3A50] bg-[#0D1117] py-3">
        <Link
          href="/planner"
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold tracking-tight text-[#5E7590] transition-colors hover:text-[#EEF2F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117]"
        >
          <ChevronLeft className="size-4 shrink-0" strokeWidth={2} />
          Back
        </Link>
      </header>

      <main
        className={`flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto overflow-x-hidden ${SCROLL_PAD}`}
        aria-label="Nutrient breakdown"
      >
        <div className="space-y-2 pt-2">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight-head text-[#EEF2F7] sm:text-[26px]">
            Nutrient Breakdown
          </h1>
          <p className="max-w-2xl text-sm font-normal leading-relaxed text-[#5E7590] sm:text-[15px]">
            Today you&apos;re at{" "}
            <span className="font-semibold tabular-nums text-[#EEF2F7]">{overallNutritionPercentToday}%</span> of
            your daily nutrition targets — the same overall score shown on the planner.
          </p>
        </div>

        <LargeProgressRing percentage={overallNutritionPercentToday} />

        <NutrientSection
          sectionId="nutrient-macros"
          title="Macronutrients"
          description="Primary energy and structure — progress vs. today’s goals."
        >
          <NutrientRow
            name="Protein"
            summary={`${fmtG(totals.totalProteinToday)} g / ${fmtG(targets.proteinTarget)} g`}
            percent={proteinPercent}
            color="#4ADE80"
          />
          <NutrientRow
            name="Carbohydrates"
            summary={`${fmtG(totals.totalCarbsToday)} g / ${fmtG(targets.carbsTarget)} g`}
            percent={carbsPercent}
            color="#F59E0B"
          />
          <NutrientRow
            name="Fat"
            summary={`${fmtG(totals.totalFatToday)} g / ${fmtG(targets.fatTarget)} g`}
            percent={fatPercent}
            color="#FB923C"
          />
          <NutrientRow
            name="Fiber"
            summary={`${fmtG(totals.totalFibreToday)} g / ${fmtG(targets.fibreTarget)} g`}
            percent={fibrePercent}
            color="#38BDF8"
          />
        </NutrientSection>

        <NutrientSection
          sectionId="nutrient-micros"
          title="Micronutrients"
          description="Vitamins & minerals — % of daily reference from your logged foods."
        >
          {microRows.map((row) => (
            <NutrientRow key={row.key} name={row.name} summary={`${row.pct}% of daily target`} percent={row.pct} color={row.color} />
          ))}
        </NutrientSection>
      </main>
    </div>
  );
}
