import { ArticlesFooterNav } from "@/components/articles/ArticlesFooterNav";
import { ArticlesPageClient } from "@/components/articles/ArticlesPageClient";
import { AppShell } from "@/components/shared/AppShell";
import { PLANNER_FRAME_MAX } from "@/lib/planner-layout";

export default function ArticlesPage() {
  return (
    <AppShell variant="mobile" innerMaxClassName={PLANNER_FRAME_MAX} innerClassName="bg-[#111111]">
      <ArticlesPageClient />
      <ArticlesFooterNav />
    </AppShell>
  );
}
