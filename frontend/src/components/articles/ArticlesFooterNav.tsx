"use client";

import { usePathname } from "next/navigation";

import { activeNavIdFromPath, BottomNavBar } from "@/components/shared/BottomNavBar";
import { AppShellFooter } from "@/components/shared/AppShellFooter";
import { PLANNER_FRAME_MAX } from "@/lib/planner-layout";

/**
 * Articles-page footer: matches main app {@link BottomNavBar}; Articles active on /articles.
 */
export function ArticlesFooterNav() {
  const pathname = usePathname();

  return (
    <AppShellFooter variant="mobile" frameMaxClassName={PLANNER_FRAME_MAX}>
      <BottomNavBar activeId={activeNavIdFromPath(pathname)} />
    </AppShellFooter>
  );
}
