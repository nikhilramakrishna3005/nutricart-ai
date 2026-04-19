import type { ChatResponse } from "@/types";

const INTENT_LABELS: Record<string, string> = {
  plan_groceries: "Planning groceries",
  refine_plan: "Refining plan",
  generate_meals: "Generating meals",
  log_food: "Logging food",
  explain_plan: "Explaining plan",
};

const PLAN_HEADLINES: Record<string, string> = {
  plan_groceries: "Grocery plan ready",
  refine_plan: "Plan updated",
  generate_meals: "Meal ideas ready",
  explain_plan: "Insight ready",
};

export type ChatResultSummaryVariant = "idle" | "plan" | "action";

export interface ChatResultSummaryView {
  variant: ChatResultSummaryVariant;
  cardTitle: string;
  intentLine: string;
  headline: string;
  storeCount: number | null;
  productCount: number | null;
  mealCount: number | null;
  showCounts: boolean;
  /** Shown under headline for `log_food` instead of counts. */
  progressLine?: string;
}

/** First line / short slice for the assistant bubble only. */
export function assistantBubbleText(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const first = t.split(/\n+/)[0]?.trim() ?? t;
  return first.length > 200 ? `${first.slice(0, 197)}…` : first;
}

/** Title for food-log assistant cards (matches summary panel behavior). */
export function mealLoggedHeadline(userMessage: string): string {
  const m = userMessage.toLowerCase();
  if (/\bfor\s+breakfast\b|\bbreakfast\b/.test(m)) return "Breakfast logged";
  if (/\bfor\s+lunch\b|\blunch\b/.test(m)) return "Lunch logged";
  if (/\bfor\s+dinner\b|\bdinner\b/.test(m)) return "Dinner logged";
  if (/\bfor\s+(a\s+)?snack\b|\bsnack\b/.test(m)) return "Snack logged";
  return "Food logged";
}

export function buildChatResultSummary(
  res: ChatResponse | null,
  lastUserMessage: string,
): ChatResultSummaryView {
  if (!res) {
    return {
      variant: "idle",
      cardTitle: "Latest Plan",
      intentLine: "—",
      headline: "Your last structured result will show here after you send a message.",
      storeCount: null,
      productCount: null,
      mealCount: null,
      showCounts: false,
    };
  }

  const intent = res.intent;
  const intentLine = INTENT_LABELS[intent] ?? intent.replace(/_/g, " ");

  if (intent === "greeting" || intent === "general_help" || intent === "unsupported") {
    return {
      variant: "idle",
      cardTitle: "Chat",
      intentLine: intent === "greeting" ? "Hello" : intent === "unsupported" ? "Not supported" : "Help",
      headline: assistantBubbleText(res.message) || "How can I help?",
      storeCount: null,
      productCount: null,
      mealCount: null,
      showCounts: false,
    };
  }

  if (intent === "log_food") {
    const ns = res.nutritionSummary;
    const progressLine = `Updated nutrition · score ${ns.score} · ~${ns.calories_today} kcal today`;
    return {
      variant: "action",
      cardTitle: "Latest Action",
      intentLine,
      headline: mealLoggedHeadline(lastUserMessage),
      storeCount: null,
      productCount: null,
      mealCount: null,
      showCounts: false,
      progressLine,
    };
  }

  const headline = PLAN_HEADLINES[intent] ?? "Plan ready";

  return {
    variant: "plan",
    cardTitle: "Latest Plan",
    intentLine,
    headline,
    storeCount: (res.candidateStores ?? res.stores)?.length ?? 0,
    productCount: res.products?.length ?? 0,
    mealCount: res.mealPlan?.length ?? 0,
    showCounts: true,
  };
}
