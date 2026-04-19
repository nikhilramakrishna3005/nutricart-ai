import { UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";

/** Per-meal macro bars as % of daily targets (0–100). */
export interface MealMacros {
  protein: number;
  carbs: number;
  fibre: number;
}

export interface MealCardProps {
  title: string;
  /** Displayed as `{calories} kcal`. */
  calories: number;
  macros: MealMacros;
  logged: boolean;
  /** Shown under the title row when `logged` is false. */
  notLoggedMessage?: string;
  /** Optional one-line detail when `logged` (e.g. food log action). */
  caption?: string;
  className?: string;
}

const iconBoxClass =
  "flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#2A3A50] bg-[#1A2333] text-[#EEF2F7] sm:size-9";

const MACRO_COLORS = {
  protein: "#4ADE80",
  carbs: "#F59E0B",
  fibre: "#38BDF8",
} as const;

function MiniMacroBar({
  label,
  shortLabel,
  value,
  color,
}: {
  label: string;
  shortLabel: string;
  value: number;
  color: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-[2.85rem] shrink-0 text-[9px] font-semibold leading-tight tracking-label-caps text-[#5E7590] sm:w-[3.1rem] sm:text-[10px]"
        title={label}
      >
        {shortLabel}
      </span>
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#1D2D40] sm:h-2.5">
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/**
 * Compact meal summary with optional “not logged” state.
 */
export function MealCard({
  title,
  calories,
  macros,
  logged,
  notLoggedMessage = "Dinner not logged",
  caption,
  className,
}: MealCardProps) {
  return (
    <article
      className={cn(
        "flex items-stretch gap-3 rounded-2xl border border-[#2A3A50] bg-[#131C2A] px-3 py-3 sm:gap-4 sm:px-4 sm:py-3.5",
        !logged && "opacity-45",
        className,
      )}
    >
      <div className={iconBoxClass} aria-hidden>
        <UtensilsCrossed className="size-4 sm:size-[18px]" strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold leading-snug tracking-tight text-[#EEF2F7] sm:text-[15px]">{title}</h3>
        <p className="mt-0.5 text-xs font-normal tabular-nums leading-normal text-[#5E7590] sm:text-[13px]">
          {calories} kcal
        </p>
        {logged && caption ? (
          <p className="mt-1 text-[11px] font-medium leading-snug tracking-tight text-[#5E7590] sm:text-xs">{caption}</p>
        ) : null}
        {!logged ? (
          <p className="mt-1 text-[11px] font-medium leading-snug tracking-tight text-[#5E7590] sm:text-xs">
            {notLoggedMessage}
          </p>
        ) : null}
      </div>

      <div
        className="flex min-h-[4.75rem] min-w-[7.75rem] max-w-[11rem] flex-1 basis-[min(42%,10.5rem)] flex-col justify-center gap-2 rounded-xl border border-[#2A3A50]/70 bg-[#0D1117]/45 px-2.5 py-2.5 sm:min-h-[5.25rem] sm:min-w-[9rem] sm:max-w-[12rem] sm:basis-[min(44%,11rem)] sm:px-3 sm:py-3"
        aria-label="Meal macro breakdown vs daily targets"
      >
        <MiniMacroBar label="Protein" shortLabel="Pro" value={macros.protein} color={MACRO_COLORS.protein} />
        <MiniMacroBar label="Carbs" shortLabel="Carb" value={macros.carbs} color={MACRO_COLORS.carbs} />
        <MiniMacroBar label="Fibre" shortLabel="Fib" value={macros.fibre} color={MACRO_COLORS.fibre} />
      </div>
    </article>
  );
}
