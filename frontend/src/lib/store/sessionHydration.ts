import type { ChatResponse, PersistedSessionState } from "@/types";

const EMPTY_NUTRITION: ChatResponse["nutritionSummary"] = {
  score: 55,
  calories_today: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  highlights: [],
  micronutrient_totals: {},
};

export function sessionHasPersistedPlannerData(session: PersistedSessionState): boolean {
  const md = session.myDay;
  const anyMyDayLogged =
    Boolean(md?.breakfast?.logged) || Boolean(md?.lunch?.logged) || Boolean(md?.dinner?.logged);
  const hasInsight =
    Boolean((session.dailyInsight ?? "").trim()) || Boolean((session.explanation ?? "").trim());
  return (
    (session.stores?.length ?? 0) > 0 ||
    (session.products?.length ?? 0) > 0 ||
    (session.basket?.items?.length ?? 0) > 0 ||
    (session.mealPlan?.length ?? 0) > 0 ||
    session.nutritionSummary != null ||
    (session.foodLogUpdates?.length ?? 0) > 0 ||
    anyMyDayLogged ||
    hasInsight ||
    (session.chatHistory?.length ?? 0) > 0
  );
}

function conversationOnlyIntent(intent: string | undefined): boolean {
  return intent === "greeting" || intent === "general_help" || intent === "unsupported";
}

function inferPersistedChatIntent(session: PersistedSessionState): string {
  const raw = (session.intent ?? "").trim();
  if (raw) return raw;
  const hasPlanner =
    (session.stores?.length ?? 0) > 0 ||
    (session.products?.length ?? 0) > 0 ||
    (session.basket?.items?.length ?? 0) > 0 ||
    (session.mealPlan?.length ?? 0) > 0;
  return hasPlanner ? "plan_groceries" : "general_help";
}

/** Rebuild a `ChatResponse` shape from GET /session for `lastChatResponse` / payloads. */
export function chatResponseFromPersistedSession(session: PersistedSessionState): ChatResponse {
  const intent = inferPersistedChatIntent(session);
  const convOnly = conversationOnlyIntent(intent);
  const stores = convOnly ? [] : (session.stores ?? []);
  const candidates = convOnly ? [] : (session.candidateStores ?? session.stores ?? []);
  return {
    intent,
    message: session.assistantSummary || "",
    stores,
    candidateStores: candidates,
    selectedStore: convOnly ? undefined : (session.selectedStore ?? undefined),
    storePickReason: convOnly ? undefined : (session.storePickReason ?? undefined),
    products: convOnly ? [] : (session.products ?? []),
    basket: convOnly ? { items: [], subtotal_usd: 0 } : (session.basket ?? { items: [], subtotal_usd: 0 }),
    mealPlan: convOnly ? [] : (session.mealPlan ?? []),
    nutritionSummary: convOnly ? EMPTY_NUTRITION : (session.nutritionSummary ?? EMPTY_NUTRITION),
    foodLogUpdates: convOnly ? [] : (session.foodLogUpdates ?? []),
    dailyInsight: convOnly ? "" : (session.dailyInsight ?? ""),
    explanation: session.explanation ?? "",
    session,
  };
}

export interface HydratedChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

/** Map persisted `chatHistory` to UI rows (order preserved; stable ids by index). */
export function chatMessagesFromHistory(hist: Array<Record<string, unknown>> | undefined): HydratedChatMessage[] {
  const list = hist ?? [];
  const out: HydratedChatMessage[] = [];
  for (let i = 0; i < list.length; i++) {
    const raw = list[i];
    if (!raw || typeof raw !== "object") continue;
    const role = (raw as { role?: string }).role;
    if (role === "user") {
      out.push({
        id: `hist-${i}-u`,
        role: "user",
        text: String((raw as { content?: string }).content ?? ""),
      });
    } else if (role === "assistant") {
      out.push({
        id: `hist-${i}-a`,
        role: "assistant",
        text: String((raw as { message?: string }).message ?? ""),
      });
    }
  }
  return out;
}

export function chatMessagesFromSession(session: PersistedSessionState): HydratedChatMessage[] {
  return chatMessagesFromHistory(session.chatHistory);
}

export function lastUserMessageFromSessionHistory(session: PersistedSessionState): string {
  const hist = session.chatHistory ?? [];
  let last = "";
  for (const entry of hist) {
    if (entry && typeof entry === "object" && (entry as { role?: string }).role === "user") {
      const c = (entry as { content?: string }).content;
      if (typeof c === "string" && c.trim()) last = c.trim();
    }
  }
  return last;
}
