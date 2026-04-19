import { cn } from "@/lib/utils";

import { APP_FRAME_GUTTER, APP_SHELL_MAX_UNIFIED, type AppShellVariant } from "@/lib/app-shell";

interface AppShellFooterProps {
  children: React.ReactNode;
  className?: string;
  /** Ignored; kept for route footers that pass `dashboard` / `mobile`. */
  variant?: AppShellVariant;
  /**
   * Overrides footer column max-width (planner: match {@link import("@/lib/planner-layout").PLANNER_FRAME_MAX}).
   */
  frameMaxClassName?: string;
}

/**
 * Fixed footer: centered max width + {@link APP_FRAME_GUTTER}, aligned with {@link import("@/components/shared/PageFrame")}.
 */
export function AppShellFooter({ children, className, frameMaxClassName }: AppShellFooterProps) {
  const maxInner = frameMaxClassName ?? APP_SHELL_MAX_UNIFIED;

  return (
    <div className={cn("pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex justify-center", className)}>
      <div className={cn("pointer-events-auto w-full", maxInner, APP_FRAME_GUTTER)}>{children}</div>
    </div>
  );
}
