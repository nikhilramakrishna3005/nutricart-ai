import { cn } from "@/lib/utils";

export interface ProfileMetricCardProps {
  label: string;
  value: string;
  className?: string;
}

/**
 * Compact highlight tile — strong number, quiet label (WHOOP-style density).
 */
export function ProfileMetricCard({ label, value, className }: ProfileMetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#2A3A50] bg-[#131C2A] px-3 py-3 shadow-sm sm:px-4 sm:py-3.5",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5E7590]">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-[#EEF2F7] sm:text-[26px]">
        {value}
      </p>
    </div>
  );
}
