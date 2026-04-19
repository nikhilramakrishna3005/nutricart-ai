import type { ReactNode } from "react";

import { APP_FRAME_GUTTER } from "@/lib/app-shell";
import { cn } from "@/lib/utils";

export interface PageFrameProps {
  children: ReactNode;
  className?: string;
  /** When false, skip horizontal gutter (rare nested use). Default true. */
  gutter?: boolean;
}

/**
 * Single outer content frame for tab routes + planner: centers within the shell, applies
 * {@link APP_FRAME_GUTTER}, and aligns with {@link import("@/components/shared/AppTopBar")} and the footer.
 */
export function PageFrame({ children, className, gutter = true }: PageFrameProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full min-w-0 max-w-full flex-col",
        gutter && APP_FRAME_GUTTER,
        className,
      )}
    >
      {children}
    </div>
  );
}
