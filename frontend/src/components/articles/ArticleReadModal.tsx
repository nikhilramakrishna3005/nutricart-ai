"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { articleCategoryToneStyles } from "@/components/articles/articleCategoryTone";
import type { Article } from "@/data/mockArticles";
import { cn } from "@/lib/utils";

export interface ArticleReadModalProps {
  open: boolean;
  article: Article | null;
  onClose: () => void;
}

export function ArticleReadModal({ open, article, onClose }: ArticleReadModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && closeRef.current) {
      closeRef.current.focus();
    }
  }, [open, article?.id]);

  if (!open || !article) return null;

  const styles = articleCategoryToneStyles[article.categoryTone];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px] transition-opacity"
        aria-label="Close article"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 max-h-[min(85vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#252525] bg-[#181818] p-5 shadow-2xl sm:p-6",
        )}
        style={{ borderWidth: "0.5px" }}
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-section-caps sm:text-sm",
              styles.label,
              styles.pill,
            )}
          >
            {article.categoryLabel}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-[#2a2a2a] bg-[#141414] p-2 text-[#EEF2F7] transition-colors hover:bg-[#222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80]/35"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <h2
          id={titleId}
          className="mt-4 text-xl font-bold leading-snug tracking-tight text-[#EEF2F7] sm:text-2xl"
        >
          {article.title}
        </h2>
        <p className="mt-2 text-sm text-[#5E7590] sm:text-[15px]">
          {article.author} · {article.readTimeMinutes} min read
        </p>

        <div className="mt-6 space-y-4 border-t border-[#2a2a2a] pt-6">
          {article.summaryParagraphs.map((paragraph, i) => (
            <p
              key={i}
              className="text-[15px] leading-relaxed text-[#B8C5D6] sm:text-base sm:leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
