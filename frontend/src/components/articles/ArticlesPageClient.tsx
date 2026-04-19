"use client";

import { useCallback, useState } from "react";

import { ArticleCard } from "@/components/articles/ArticleCard";
import { ArticleReadModal } from "@/components/articles/ArticleReadModal";
import { ArticlesHeader } from "@/components/articles/ArticlesHeader";
import { ArticlesSearchBar } from "@/components/articles/ArticlesSearchBar";
import { PageFrame } from "@/components/shared/PageFrame";
import type { Article } from "@/data/mockArticles";
import { MOCK_ARTICLES } from "@/data/mockArticles";
import { PAGE_SCROLL_BOTTOM_PAD, PAGE_SECTION_TOP } from "@/lib/app-shell";
import { cn } from "@/lib/utils";

export function ArticlesPageClient() {
  const [selected, setSelected] = useState<Article | null>(null);

  const closeModal = useCallback(() => setSelected(null), []);

  return (
    <>
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
              <ArticleCard key={article.id} article={article} onRead={() => setSelected(article)} />
            ))}
          </div>
        </PageFrame>
      </main>
      <ArticleReadModal open={selected !== null} article={selected} onClose={closeModal} />
    </>
  );
}
