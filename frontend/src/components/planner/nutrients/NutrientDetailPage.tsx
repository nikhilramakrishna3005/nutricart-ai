import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { LargeProgressRing } from "@/components/planner/nutrients/LargeProgressRing";
import { NutrientRow } from "@/components/planner/nutrients/NutrientRow";
import { NutrientSection } from "@/components/planner/nutrients/NutrientSection";

import { PAGE_SCROLL_BOTTOM_PAD } from "@/lib/app-shell";
import { cn } from "@/lib/utils";

const SCROLL_PAD = cn("pt-2", PAGE_SCROLL_BOTTOM_PAD);

/**
 * Full-screen nutrient drill-in: macros + micros with shared dark system.
 */
export function NutrientDetailPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#2A3A50] bg-[#0D1117] py-3">
        <Link
          href="/planner"
          className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight text-[#5E7590] transition-colors hover:text-[#EEF2F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117] rounded-md"
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
            Today you&apos;re at <span className="font-semibold text-[#EEF2F7]">68%</span> of your daily
            targets. Overall completion (rolling 7-day):{" "}
            <span className="font-semibold text-[#EEF2F7]">72%</span>.
          </p>
        </div>

        <LargeProgressRing percentage={68} />

        <NutrientSection
          sectionId="nutrient-macros"
          title="Macronutrients"
          description="Primary energy and structure — progress vs. today’s goals."
        >
          <NutrientRow name="Protein" summary="62 g / 90 g" percent={69} color="#4ADE80" />
          <NutrientRow name="Carbohydrates" summary="180 g / 240 g" percent={75} color="#38BDF8" />
          <NutrientRow name="Fat" summary="48 g / 70 g" percent={69} color="#F59E0B" />
          <NutrientRow name="Fiber" summary="18 g / 30 g" percent={60} color="#A78BFA" />
        </NutrientSection>

        <NutrientSection
          sectionId="nutrient-micros"
          title="Micronutrients"
          description="Vitamins & minerals — color flags highlight watch-list items."
        >
          <NutrientRow name="Vitamin D" summary="12 µg / 20 µg" percent={60} color="#38BDF8" />
          <NutrientRow name="Iron" summary="9 mg / 18 mg" percent={50} color="#A78BFA" />
          <NutrientRow name="Magnesium" summary="280 mg / 400 mg" percent={70} color="#4ADE80" />
          <NutrientRow
            name="Sodium"
            summary="2,400 mg / 2,300 mg limit"
            percent={92}
            color="#F97316"
            variant="warning"
          />
          <NutrientRow
            name="Added sugar"
            summary="36 g / 25 g limit"
            percent={88}
            color="#EF4444"
            variant="warning"
          />
        </NutrientSection>
      </main>
    </div>
  );
}
