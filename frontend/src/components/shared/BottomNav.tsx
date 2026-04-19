"use client";

import { usePathname } from "next/navigation";

import { AppShellFooter } from "@/components/shared/AppShellFooter";
import { activeNavIdFromPath, BottomNavBar } from "@/components/shared/BottomNavBar";
import { PLANNER_FRAME_MAX } from "@/lib/planner-layout";
import type { AppShellVariant } from "@/lib/app-shell";

function footerShellVariant(pathname: string | null): AppShellVariant {
  if (pathname?.startsWith("/planner")) return "dashboard";
  return "mobile";
}

export interface BottomNavProps {
  className?: string;
}

/**
 * Fixed five-tab bar with a raised center AI Chat action (shared {@link BottomNavBar}).
 */
export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();
  const activeId = activeNavIdFromPath(pathname);
  const shellFooterVariant = footerShellVariant(pathname);

  return (
    <AppShellFooter
      variant={shellFooterVariant}
      className={className}
      frameMaxClassName={PLANNER_FRAME_MAX}
    >
      <BottomNavBar activeId={activeId} />
    </AppShellFooter>
  );
}
