export type ArticleCategoryTone = "nutrition" | "wellness" | "recipe" | "gut" | "sleep";

export interface Article {
  id: string;
  categoryLabel: string;
  categoryTone: ArticleCategoryTone;
  title: string;
  summary: string;
  /** Exactly three short paragraphs for the read modal. */
  summaryParagraphs: readonly [string, string, string];
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
    summaryParagraphs: [
      "Soluble fibre steadies how glucose hits your blood; insoluble fibre adds bulk for predictable transit. Together they shape fullness and comfort, not just “regularity.”",
      "Microbes ferment many fibres into short-chain fatty acids that support your gut lining — so fibre is partly about feeding the ecosystem you already have.",
      "Spread vegetables, legumes, whole grains, and nuts across meals, and ramp intake slowly with water so your digestion adapts comfortably.",
    ] as const,
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
    summaryParagraphs: [
      "For consistent trainers, total daily protein usually beats chasing a tight post-workout “window” — repair happens across many hours, not one rush.",
      "Timing still matters if meals are very spaced out or you train fasted; protein soon after can ease recovery and take the edge off late-day cravings.",
      "Anchor protein at breakfast and dinner, add a balanced lunch, and you will land in a strong range without clock-watching.",
    ] as const,
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
    summaryParagraphs: [
      "Pair lean protein with fibre and water-rich veg so you feel full without oversized portions of dense carbs or fats.",
      "Templates like yogurt bowls, lentil skillets, tuna or tofu salads, and egg wraps stay under 500 kcal when you watch oils and creamy sauces.",
      "Batch one protein and one grain or legume, then rotate sauces and vegetables through the week for variety with steady macros.",
    ] as const,
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
    summaryParagraphs: [
      "Probiotics add live cultures via foods like yogurt or kefir, or via supplements — whether they persist depends on strain, dose, and what else you eat.",
      "Prebiotics are fibres your microbes digest for you — onions, garlic, oats — feeding the community already inside you.",
      "Labels with named strains help for probiotics; whole-food variety covers prebiotics. Combining both over time usually beats either in isolation.",
    ] as const,
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
    summaryParagraphs: [
      "Short sleep nudges hunger hormones so convenient, calorie-dense foods look more rewarding — that is biology, not a character flaw.",
      "A couple of rough nights can blunt how full you feel and make training harder, nudging portions and snacks upward almost invisibly.",
      "Dim light before bed, a steady wind-down, slightly earlier sleep, and protein-forward breakfast often improve both rest and next-day appetite control.",
    ] as const,
    author: "Jordan Lee",
    readTimeMinutes: 6,
    rating: 4.5,
    ratingCount: 1120,
  },
];
