import type { ChatResponse, PersistedSessionState } from "@/types";

const EMPTY_NUTRITION: ChatResponse["nutritionSummary"] = {
  score: 55,
  calories_today: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  highlights: [],
};

export function sessionHasPersistedPlannerData(session: PersistedSessionState): boolean {
  const md = session.myDay;
  const anyMyDayLogged =
    Boolean(md?.breakfast?.logged) || Boolean(md?.lunch?.logged) || Boolean(md?.dinner?.logged);
  return (
    (session.stores?.length ?? 0) > 0 ||
    (session.products?.length ?? 0) > 0 ||
    (session.basket?.items?.length ?? 0) > 0 ||
    (session.mealPlan?.length ?? 0) > 0 ||
    session.nutritionSummary != null ||
    (session.foodLogUpdates?.length ?? 0) > 0 ||
    anyMyDayLogged ||
    (session.chatHistory?.length ?? 0) > 0
  );
}

/** Rebuild a `ChatResponse` shape from GET /session for `lastChatResponse` / payloads. */
export function chatResponseFromPersistedSession(session: PersistedSessionState): ChatResponse {
  return {
    intent: session.intent || "plan_groceries",
    message: session.assistantSummary || "",
    stores: session.stores ?? [],
    products: session.products ?? [],
    basket: session.basket ?? { items: [], subtotal_usd: 0 },
    mealPlan: session.mealPlan ?? [],
    nutritionSummary: session.nutritionSummary ?? EMPTY_NUTRITION,
    foodLogUpdates: session.foodLogUpdates ?? [],
    dailyInsight: session.dailyInsight ?? "",
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
