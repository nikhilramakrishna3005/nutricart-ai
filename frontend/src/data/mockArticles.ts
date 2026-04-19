export type ArticleCategoryTone = "nutrition" | "wellness" | "recipe" | "gut" | "sleep";

export interface Article {
  id: string;
  categoryLabel: string;
  categoryTone: ArticleCategoryTone;
  title: string;
  summary: string;
  author: string;
  readTimeMinutes: number;
  rating: number;
  ratingCount: number;
}

export const MOCK_ARTICLES: Article[] = [
  {
    id: "fibre-matters",
    categoryLabel: "Nutrition",
    categoryTone: "nutrition",
    title: "Why fibre matters more than you think",
    summary:
      "Fibre feeds your gut, steadies energy, and changes how you absorb nutrients — not just “regularity.”",
    author: "Dr. Priya Nair",
    readTimeMinutes: 6,
    rating: 4.7,
    ratingCount: 2410,
  },
  {
    id: "protein-timing-myth",
    categoryLabel: "Wellness",
    categoryTone: "wellness",
    title: "The protein timing myth — debunked",
    summary:
      "Total daily protein usually beats perfect post-workout windows. Here is when timing still matters.",
    author: "Jordan Lee",
    readTimeMinutes: 5,
    rating: 4.3,
    ratingCount: 890,
  },
  {
    id: "high-protein-meals",
    categoryLabel: "Recipe",
    categoryTone: "recipe",
    title: "5 high-protein meals under 500 kcal",
    summary:
      "Simple builds with pantry staples: flavour, volume, and macros you can repeat all week.",
    author: "Maya Chen",
    readTimeMinutes: 8,
    rating: 4.6,
    ratingCount: 1520,
  },
  {
    id: "probiotics-prebiotics",
    categoryLabel: "Gut Health",
    categoryTone: "gut",
    title: "Probiotics vs prebiotics — what's the difference?",
    summary:
      "One adds live cultures; the other feeds what is already there. A clear mental model for shopping.",
    author: "Dr. Priya Nair",
    readTimeMinutes: 7,
    rating: 4.8,
    ratingCount: 3200,
  },
  {
    id: "sleep-nutrition",
    categoryLabel: "Sleep & Diet",
    categoryTone: "sleep",
    title: "How poor sleep destroys your nutrition goals",
    summary:
      "Hunger hormones, cravings, and decision fatigue stack up fast — and the fixes are smaller than you think.",
    author: "Jordan Lee",
    readTimeMinutes: 6,
    rating: 4.5,
    ratingCount: 1120,
  },
];
