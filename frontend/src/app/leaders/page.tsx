import { AchievementsSection } from "@/components/leaders/AchievementsSection";
import { CommunitySection } from "@/components/leaders/CommunitySection";
import { LeadersFooterNav } from "@/components/leaders/LeadersFooterNav";
import { LeadersHeader } from "@/components/leaders/LeadersHeader";
import { RecommendationsSection } from "@/components/leaders/RecommendationsSection";
import { StatsGrid } from "@/components/leaders/StatsGrid";
import { AppShell } from "@/components/shared/AppShell";
import { PageFrame } from "@/components/shared/PageFrame";
import { PAGE_SCROLL_BOTTOM_PAD, PAGE_SECTION_TOP } from "@/lib/app-shell";
import { PLANNER_FRAME_MAX } from "@/lib/planner-layout";
import { cn } from "@/lib/utils";

export default function LeadersPage() {
  return (
    <AppShell variant="mobile" innerMaxClassName={PLANNER_FRAME_MAX}>
      <main className="flex min-h-0 flex-1 flex-col bg-[#0D1117] font-sans text-[#EEF2F7]">
        <PageFrame className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <LeadersHeader />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className={cn(
                "min-h-0 flex-1 space-y-8 overflow-y-auto overflow-x-hidden",
                PAGE_SECTION_TOP,
                PAGE_SCROLL_BOTTOM_PAD,
              )}
            >
              <StatsGrid />
              <AchievementsSection />
              <CommunitySection />
              <RecommendationsSection />
            </div>
          </div>
        </PageFrame>
      </main>
      <LeadersFooterNav />
    </AppShell>
  );
}
