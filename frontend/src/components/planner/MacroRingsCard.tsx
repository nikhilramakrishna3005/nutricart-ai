"use client";

import { CircularProgress } from "@/components/shared/CircularProgress";
import { useDashboardMetrics } from "@/lib/useDashboardMetrics";
import { cn } from "@/lib/utils";

const RING_SIZE = 80;
const STAGGER_MS = 90;

interface MacroRingsCardProps {
  className?: string;
}

/**
 * Card row of macro progress rings (reuses {@link CircularProgress}).
 */
export function MacroRingsCard({ className }: MacroRingsCardProps) {
  const { macroRings: macros } = useDashboardMetrics();

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-[20px] bg-[#131C2A] px-3 py-3 sm:px-5 sm:py-3.5",
        className,
      )}
    >
      <div className="flex w-full flex-1 items-start justify-evenly gap-2 sm:gap-4 lg:gap-6">
        {macros.map((macro, index) => (
          <div
            key={macro.key}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2"
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
