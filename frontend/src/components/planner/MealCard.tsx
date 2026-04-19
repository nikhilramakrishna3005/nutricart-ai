import { UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";

/** Macro fill levels for the mini bars (0–100). */
export interface MealMacros {
  p: number;
  f: number;
  c: number;
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
  "flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#2A3A50] bg-[#1A2333] text-[#EEF2F7]";

const MACRO_COLORS = {
  p: "#4ADE80",
  f: "#F59E0B",
  c: "#38BDF8",
} as const;

function MiniMacroBar({
  label,
  value,
  color,
}: {
  label: "P" | "F" | "C";
  value: number;
  color: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 shrink-0 text-center text-[9px] font-semibold leading-none tracking-label-caps text-[#5E7590]">
        {label}
      </span>
      <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-[#1D2D40]">
        <div
          className="h-1 rounded-full transition-[width] duration-300 ease-out"
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
        "flex items-center gap-3 rounded-2xl border border-[#2A3A50] bg-[#131C2A] px-3 py-2.5",
        !logged && "opacity-45",
        className,
      )}
    >
      <div className={iconBoxClass} aria-hidden>
        <UtensilsCrossed className="size-4" strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold leading-snug tracking-tight text-[#EEF2F7]">{title}</h3>
        <p className="mt-0.5 text-xs font-normal tabular-nums leading-normal text-[#5E7590]">{calories} kcal</p>
        {logged && caption ? (
          <p className="mt-1 text-[11px] font-medium leading-snug tracking-tight text-[#5E7590]">{caption}</p>
        ) : null}
        {!logged ? (
          <p className="mt-1 text-[11px] font-medium leading-snug tracking-tight text-[#5E7590]">{notLoggedMessage}</p>
        ) : null}
      </div>

      <div className="flex w-[76px] shrink-0 flex-col gap-1">
        <MiniMacroBar label="P" value={macros.p} color={MACRO_COLORS.p} />
        <MiniMacroBar label="F" value={macros.f} color={MACRO_COLORS.f} />
        <MiniMacroBar label="C" value={macros.c} color={MACRO_COLORS.c} />
      </div>
    </article>
  );
}
