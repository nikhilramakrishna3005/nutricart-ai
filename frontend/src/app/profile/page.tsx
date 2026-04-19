import type { Metadata } from "next";

import { ProfilePageContent } from "@/components/profile/ProfilePageContent";
import { AppShell } from "@/components/shared/AppShell";
import { BottomNav } from "@/components/shared/BottomNav";
import { PageFrame } from "@/components/shared/PageFrame";
import { PAGE_SCROLL_BOTTOM_PAD } from "@/lib/app-shell";
import { PLANNER_FRAME_MAX } from "@/lib/planner-layout";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Profile | NutriCart AI",
  description: "Your NutriCart AI progress, streaks, and nutrition highlights.",
};

export default function ProfilePage() {
  return (
    <AppShell variant="mobile" innerMaxClassName={PLANNER_FRAME_MAX} innerClassName="flex min-h-screen flex-col">
      <PageFrame className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", PAGE_SCROLL_BOTTOM_PAD)}>
        <ProfilePageContent />
      </PageFrame>
      <BottomNav />
    </AppShell>
  );
}
