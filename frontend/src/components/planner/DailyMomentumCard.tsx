"use client";

import { FlameAnimation } from "@/components/ui/FlameAnimation";
import { NutriFlameShape } from "@/components/ui/NutriFlameShape";
import { cn } from "@/lib/utils";

const WEEK_LABELS = ["M", "T", "W", "Th", "F", "Sa", "Su"] as const;

function WeeklyFlameRow({ weekFlameOn }: { weekFlameOn: boolean[] }) {
  return (
    <div className="mt-5 w-full">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5E7590]">This week</p>
      <div className="flex justify-between gap-0.5 sm:gap-1">
        {WEEK_LABELS.map((label, i) => {
          const on = Boolean(weekFlameOn[i]);
          return (
            <div key={`${label}-${i}`} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-full max-w-[2.25rem] items-center justify-center rounded-lg border transition-colors sm:h-9 sm:max-w-none",
                  on
                    ? "border-[#EA580C]/45 bg-gradient-to-b from-[#431407]/80 to-[#1a0a06]/60 shadow-[0_0_14px_rgba(234,88,12,0.22)]"
                    : "border-[#2A3A50]/70 bg-[#0D1117]/80",
                )}
              >
                <NutriFlameShape
                  className={cn(
                    "size-[1.05rem] sm:size-[1.15rem]",
                    on
                      ? "text-[#fb923c] drop-shadow-[0_0_6px_rgba(251,146,60,0.45)]"
                      : "text-[#2A3A50]",
                  )}
                  fill={on ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={on ? 2 : 1.5}
                />
              </div>
              <span className="text-[10px] font-semibold tabular-nums text-[#5E7590] sm:text-[11px]">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DailyMomentumCardProps {
  className?: string;
  streakTitle: string;
  streakSubtitle: string;
  weekFlameOn: boolean[];
}

/**
 * Premium streak / momentum block for the lower Daily Targets area.
 */
export function DailyMomentumCard({
  className,
  streakTitle,
  streakSubtitle,
  weekFlameOn,
}: DailyMomentumCardProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-[#2A3A50]/60 bg-gradient-to-b from-[#0f1620]/98 via-[#0c1118]/95 to-[#0a0e14]/98 px-4 py-6 sm:px-5 sm:py-7",
        "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col",
        className,
      )}
      aria-label="Daily momentum and streak"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#EA580C]/25 to-transparent" />

      <div className="relative flex flex-1 flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center sm:gap-8 lg:min-h-0 lg:justify-center">
        <div className="relative flex h-[136px] w-[132px] shrink-0 items-center justify-center overflow-visible border-none bg-transparent shadow-none sm:h-[148px] sm:w-[140px]">
          <FlameAnimation className={cn("translate-y-[10px]", "sm:pl-1")} />
        </div>

        <div className="flex w-full min-w-0 max-w-md flex-1 flex-col items-center text-center sm:items-start sm:text-left">
          <p className="text-lg font-bold tracking-tight text-[#EEF2F7] sm:text-xl">{streakTitle}</p>
          <p className="mt-1.5 max-w-sm text-sm leading-snug text-[#9DB0C4] sm:text-[15px]">{streakSubtitle}</p>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#5E7590] sm:text-[13px]">
            Log one more healthy meal today to keep the streak alive
          </p>

          <WeeklyFlameRow weekFlameOn={weekFlameOn} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-8 bottom-3 h-px bg-gradient-to-r from-transparent via-[#4ADE80]/12 to-transparent" />
    </div>
  );
}
