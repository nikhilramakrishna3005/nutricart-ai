"use client";

import { Star, StarHalf } from "lucide-react";

import { articleCategoryToneStyles } from "@/components/articles/articleCategoryTone";
import type { Article } from "@/data/mockArticles";
import { cn } from "@/lib/utils";

function formatRatingCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    const s = k >= 10 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, "");
    return `${s}K`;
  }
  return String(n);
}

function CardRatingBlock({ rating, ratingCount }: { rating: number; ratingCount: number }) {
  const clamped = Math.min(5, Math.max(0, rating));
  const full = Math.floor(clamped);
  const dec = clamped - full;
  const showHalf = dec >= 0.3 && full < 5;
  const emptyStart = full + (showHalf ? 1 : 0);
  const emptyCount = 5 - emptyStart;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-lg font-bold tabular-nums tracking-tight text-[#EEF2F7] sm:text-xl">
        {clamped.toFixed(1)}
      </span>
      <div className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: full }).map((_, i) => (
          <Star
            key={`f-${i}`}
            className="size-4 fill-[#fb923c] text-[#fb923c] sm:size-[18px]"
            strokeWidth={0}
          />
        ))}
        {showHalf ? (
          <StarHalf
            className="size-4 fill-[#fb923c] text-[#fb923c] opacity-40 sm:size-[18px]"
            strokeWidth={0}
          />
        ) : null}
        {Array.from({ length: emptyCount }).map((_, i) => (
          <Star
            key={`e-${i}`}
            className="size-4 fill-[#fb923c] text-[#fb923c] opacity-[0.15] sm:size-[18px]"
            strokeWidth={0}
          />
        ))}
      </div>
      <span className="text-sm font-medium uppercase tracking-wide text-[#5E7590]">
        {formatRatingCount(ratingCount)}
      </span>
    </div>
  );
}

export function ArticleCard({ article, onRead }: { article: Article; onRead: () => void }) {
  const styles = articleCategoryToneStyles[article.categoryTone];

  return (
    <article
      className="rounded-2xl border border-[#252525] bg-[#181818] p-4 font-sans sm:p-5"
      style={{ borderWidth: "0.5px" }}
    >
      <div className="flex min-w-0 gap-3">
        <div className="min-w-0 flex-[0.68]">
          <span
            className={cn(
              "inline-block rounded-full px-3 py-1 text-sm font-semibold uppercase tracking-section-caps",
              styles.label,
              styles.pill,
            )}
          >
            {article.categoryLabel}
          </span>
          <h2 className="mb-2 mt-3 text-lg font-bold leading-snug tracking-tight text-[#EEF2F7] sm:text-xl">
            {article.title}
          </h2>
          <p className="mb-3 line-clamp-3 text-base font-normal leading-relaxed text-[#5E7590] sm:text-[17px]">
            {article.summary}
          </p>
          <div className="flex items-center justify-between gap-2 text-sm sm:text-[15px]">
            <span className="min-w-0 truncate font-normal text-[#5E7590]">
              {article.author} · {article.readTimeMinutes} min
            </span>
            <button
              type="button"
              onClick={onRead}
              className="shrink-0 rounded-md px-1 py-0.5 font-semibold text-[#4ADE80] transition-colors hover:bg-[#4ADE80]/10 hover:text-[#6EE7A0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80]/40"
            >
              Read →
            </button>
          </div>
        </div>

        <div
          className="w-px shrink-0 self-stretch bg-[#2a2a2a]"
          style={{ width: "0.5px" }}
          aria-hidden
        />

        <div className="flex min-w-0 flex-[0.32] items-center justify-center">
          <CardRatingBlock rating={article.rating} ratingCount={article.ratingCount} />
        </div>
      </div>
    </article>
  );
}
