"use client";

import { Sparkles } from "lucide-react";

import { usePlannerNutriBridge } from "@/lib/store/usePlannerNutriBridge";
import { cn } from "@/lib/utils";

interface DailyInsightCardProps {
  className?: string;
}

const FALLBACK_HEADLINE = "You're doing well on protein, but fibre is low.";
const FALLBACK_SUB = "Add leafy greens to improve balance.";

function truncate(s: string, max: number) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

/**
 * AI-style nutrition snapshot; uses `/chat` `dailyInsight` / `explanation` when available.
 */
export function DailyInsightCard({ className }: DailyInsightCardProps) {
  const { dailyInsight, explanation: explFromBridge } = usePlannerNutriBridge();
  const insight = dailyInsight?.trim();
  const explanation = explFromBridge?.trim();

  const headline = insight || FALLBACK_HEADLINE;
  const sub =
    explanation && explanation !== insight ? truncate(explanation, 160) : FALLBACK_SUB;

  return (
    <aside
      className={cn(
        "relative w-full overflow-hidden rounded-[20px] border border-[#2A3A50] bg-[#131C2A] px-5 py-5 sm:px-5 sm:py-5",
        className,
      )}
      aria-label="Daily insight"
    >
      <div
        className="pointer-events-none absolute bottom-3 left-0 top-3 w-[3px] rounded-full bg-[#4ADE80] shadow-[0_0_18px_3px_rgba(74,222,128,0.28)]"
        aria-hidden
      />

      <div className="relative pl-4 sm:pl-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 shrink-0 text-[#4ADE80]" strokeWidth={2} aria-hidden />
          <p className="text-[11px] font-bold uppercase tracking-section-caps text-[#5E7590]">
            Daily insight
          </p>
        </div>

        <p className="mt-3 text-base font-bold leading-snug tracking-tight text-[#EEF2F7] sm:text-[17px]">
          {headline}
        </p>
        <p className="mt-2 text-sm font-normal leading-relaxed text-[#5E7590]">{sub}</p>
      </div>
    </aside>
  );
}
