import { CircularProgress } from "@/components/shared/CircularProgress";
import { cn } from "@/lib/utils";

interface LargeProgressRingProps {
  percentage: number;
  /** Arc color (defaults to brand green). */
  color?: string;
  className?: string;
}

/**
 * Hero-sized ring for nutrient breakdown (WHOOP-style focal metric).
 */
export function LargeProgressRing({
  percentage,
  color = "#4ADE80",
  className,
}: LargeProgressRingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <CircularProgress percentage={percentage} color={color} size={176} strokeWidth={14} />
    </div>
  );
}
