import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AppTopBarLayout = "three-column" | "stack";

export interface AppTopBarProps {
  /** `three-column`: left / center / right. `stack`: full-width block (e.g. settings title). */
  layout?: AppTopBarLayout;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
  borderClassName?: string;
}

/**
 * Top chrome aligned to {@link import("@/components/shared/PageFrame")} — no horizontal padding here.
 */
export function AppTopBar({
  layout = "three-column",
  left,
  center,
  right,
  className,
  borderClassName = "border-[#2A3A50]",
}: AppTopBarProps) {
  if (layout === "stack") {
    return (
      <header
        className={cn(
          "shrink-0 border-b bg-[#0D1117] py-5",
          borderClassName,
          className,
        )}
      >
        <div className="w-full min-w-0">{center}</div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "shrink-0 border-b bg-[#0D1117] py-2.5",
        borderClassName,
        className,
      )}
    >
      <div className="grid w-full min-w-0 grid-cols-[auto_1fr_auto] items-center gap-2">
        <div className="flex min-h-10 items-center justify-start">
          {left ?? <span className="size-10 shrink-0" aria-hidden />}
        </div>
        <div className="flex min-h-10 min-w-0 items-center justify-center px-1">{center}</div>
        <div className="flex min-h-10 items-center justify-end">
          {right ?? <span className="size-10 shrink-0" aria-hidden />}
        </div>
      </div>
    </header>
  );
}
