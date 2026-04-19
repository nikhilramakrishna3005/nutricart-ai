import { cn } from "@/lib/utils";

import { APP_SHELL_MAX_UNIFIED, type AppShellVariant } from "@/lib/app-shell";

export type { AppShellVariant };

interface AppShellProps {
  children: React.ReactNode;
  variant?: AppShellVariant;
  className?: string;
  innerClassName?: string;
  /**
   * Overrides inner column max-width. Planner passes {@link import("@/lib/planner-layout").PLANNER_FRAME_MAX}
   * to align with {@link import("@/components/shared/SiteHeader")}.
   */
  innerMaxClassName?: string;
}

const shellInnerBase =
  "relative flex min-h-screen w-full min-w-0 flex-col bg-[#0D1117] supports-[min-height:100dvh]:min-h-[100dvh]";

/**
 * Full-viewport dark backdrop + centered column. Default max width {@link APP_SHELL_MAX_UNIFIED}.
 * No horizontal padding here — use {@link import("@/components/shared/PageFrame")} inside routes.
 */
export function AppShell({
  children,
  className,
  innerClassName,
  innerMaxClassName,
}: AppShellProps) {
  const maxInner = innerMaxClassName ?? APP_SHELL_MAX_UNIFIED;

  return (
    <div
      className={cn(
        "flex min-h-screen w-full justify-center bg-[#0D1117] supports-[min-height:100dvh]:min-h-[100dvh]",
        className,
      )}
    >
      <div className={cn(shellInnerBase, maxInner, innerClassName)}>{children}</div>
    </div>
  );
}
