import type { ArticleCategoryTone } from "@/data/mockArticles";

export const articleCategoryToneStyles: Record<
  ArticleCategoryTone,
  { label: string; pill: string }
> = {
  nutrition: { label: "text-[#4ade80]", pill: "bg-[#1a3a1a]" },
  gut: { label: "text-[#4ade80]", pill: "bg-[#1a3a1a]" },
  wellness: { label: "text-[#38bdf8]", pill: "bg-[#0d2a3a]" },
  sleep: { label: "text-[#38bdf8]", pill: "bg-[#0d2a3a]" },
  recipe: { label: "text-[#fb923c]", pill: "bg-[#2a1a0a]" },
};
