"use client";

import type { LucideIcon } from "lucide-react";
import { Flame, ListChecks } from "lucide-react";

import { DailyMomentumCard } from "@/components/planner/DailyMomentumCard";
import { useDashboardMetrics } from "@/lib/useDashboardMetrics";
import { cn } from "@/lib/utils";

const CARD =
  "flex w-full flex-col rounded-[20px] bg-[#131C2A] px-4 py-5 sm:px-6 sm:py-6 lg:h-full lg:min-h-0";

const iconBoxClass =
  "flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#2A3A50] bg-[#1A2333] text-[#EEF2F7]";

interface TargetRowProps {
  icon: LucideIcon;
  label: string;
  valueLine: string;
  progress: number;
  color: string;
}

function TargetRow({ icon: Icon, label, valueLine, progress, color }: TargetRowProps) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <div className="flex gap-3">
      <div className={iconBoxClass} aria-hidden>
        <Icon className="size-[18px]" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-[#EEF2F7]">{label}</span>
          <span className="shrink-0 text-right text-sm font-normal tabular-nums text-[#EEF2F7]">{valueLine}</span>
        </div>
        <div
          className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#1D2D40]"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Daily calorie + nutrient tracking summary with linear progress and a premium streak block below.
 */
export function DailyTargetsCard({ className }: { className?: string }) {
  const m = useDashboardMetrics();

  const calProgress = m.calorieProgress;
  const otherProgress = m.otherNutrientsProgress;
  const calorieLine = m.calorieLine;
  const otherLine = m.otherNutrientsLine;

  return (
    <section className={cn(CARD, className)} aria-labelledby="daily-targets-heading">
      <h2
        id="daily-targets-heading"
        className="shrink-0 text-[11px] font-bold uppercase tracking-section-caps text-[#5E7590]"
      >
        Daily targets
      </h2>

      <div className="mt-5 shrink-0 space-y-5">
        <TargetRow
          icon={Flame}
          label="Calories"
          valueLine={calorieLine}
          progress={calProgress}
          color="#F59E0B"
        />
        <TargetRow
          icon={ListChecks}
          label="Other Nutrients"
          valueLine={otherLine}
          progress={otherProgress}
          color="#A78BFA"
        />
      </div>

      <div className="mt-5 h-px w-full shrink-0 bg-[#2A3A50] lg:mt-6" role="presentation" />

      <DailyMomentumCard
        className="mt-5 min-h-0 flex-1 lg:mt-6"
        streakTitle={m.streakTitle}
        streakSubtitle={m.streakSubtitleText}
        weekFlameOn={m.weekFlameOn}
      />
    </section>
  );
}
