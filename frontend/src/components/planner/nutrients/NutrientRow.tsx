import { cn } from "@/lib/utils";

export interface NutrientRowProps {
  name: string;
  /** e.g. "62 g / 90 g" */
  summary: string;
  percent: number;
  /** Progress + accent dot color. */
  color: string;
  /** Softer row treatment for attention items (sodium, sugar, etc.). */
  variant?: "default" | "warning";
}

/**
 * Single nutrient line with summary and a thin progress track.
 */
export function NutrientRow({ name, summary, percent, color, variant = "default" }: NutrientRowProps) {
  const pct = Math.min(100, Math.max(0, percent));
  const isWarning = variant === "warning";

  return (
    <div
      className={cn(
        "rounded-xl border border-[#2A3A50] bg-[#131C2A] px-3 py-2.5 sm:px-4",
        isWarning && "border-[#EA580C]/40 bg-[#131C2A]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="mt-1 size-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug tracking-tight text-[#EEF2F7]">{name}</p>
            <p className="mt-0.5 text-xs font-normal tabular-nums leading-normal text-[#5E7590]">{summary}</p>
          </div>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums tracking-tight text-[#EEF2F7]">{pct}%</span>
      </div>
      <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-[#1D2D40]">
        <div
          className="h-1 rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
