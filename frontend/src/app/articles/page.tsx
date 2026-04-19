import { ArticleCard } from "@/components/articles/ArticleCard";
import { ArticlesFooterNav } from "@/components/articles/ArticlesFooterNav";
import { ArticlesHeader } from "@/components/articles/ArticlesHeader";
import { ArticlesSearchBar } from "@/components/articles/ArticlesSearchBar";
import { AppShell } from "@/components/shared/AppShell";
import { PageFrame } from "@/components/shared/PageFrame";
import { MOCK_ARTICLES } from "@/data/mockArticles";
import { PAGE_SCROLL_BOTTOM_PAD, PAGE_SECTION_TOP } from "@/lib/app-shell";
import { PLANNER_FRAME_MAX } from "@/lib/planner-layout";
import { cn } from "@/lib/utils";

export default function ArticlesPage() {
  return (
    <AppShell variant="mobile" innerMaxClassName={PLANNER_FRAME_MAX} innerClassName="bg-[#111111]">
      <main className="flex min-h-0 flex-1 flex-col font-sans text-white">
        <PageFrame className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ArticlesHeader />
          <ArticlesSearchBar />
          <div
            className={cn(
              "min-h-0 flex-1 space-y-[10px] overflow-y-auto overflow-x-hidden",
              PAGE_SECTION_TOP,
              PAGE_SCROLL_BOTTOM_PAD,
            )}
          >
            {MOCK_ARTICLES.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </PageFrame>
      </main>
      <ArticlesFooterNav />
    </AppShell>
  );
}
