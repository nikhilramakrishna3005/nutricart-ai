"use client";

import Link from "next/link";

import { useDashboardMetrics } from "@/lib/useDashboardMetrics";
import { cn } from "@/lib/utils";

interface NutrientBadgeProps {
  href?: string;
}

/**
 * Top-right score badge — opens the nutrient breakdown route.
 * Label is derived from today's overall nutrition score (see useDashboardMetrics).
 */
export function NutrientBadge({ href = "/planner/nutrients" }: NutrientBadgeProps) {
  const { overallNutritionPercentToday } = useDashboardMetrics();
  const label = `${overallNutritionPercentToday}%`;

  return (
    <Link
      href={href}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full border border-[#2A3A50] bg-[#1A2333] text-[11px] font-bold leading-none tracking-tight text-[#EEF2F7]",
        "transition-colors hover:border-[#4ADE80]/40 hover:bg-[#1c2638] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117]",
      )}
      aria-label={`Open nutrient breakdown, score ${label}`}
    >
      {label}
    </Link>
  );
}
