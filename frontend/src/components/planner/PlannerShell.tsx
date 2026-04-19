import { PageFrame } from "@/components/shared/PageFrame";
import { cn } from "@/lib/utils";

interface PlannerShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Planner column: fills the dashboard shell and applies the shared {@link PageFrame} gutter.
 */
export function PlannerShell({ children, className }: PlannerShellProps) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0D1117]", className)}>
      <PageFrame className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</PageFrame>
    </div>
  );
}
