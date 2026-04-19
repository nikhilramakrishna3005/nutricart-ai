import type {
  ChatRequestPayload,
  ChatResponse,
  FoodLogRequest,
  FoodLogResponse,
  PersistedSessionState,
  PlanRefineRequest,
  PlanRequest,
  PlanResponse,
  Store,
} from "@/types";

/** Base URL for the FastAPI backend (override in `.env.local`). */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getHealth(): Promise<{ status: string }> {
  return jsonFetch("/health");
}

export async function getStores(zip: string): Promise<{ stores: Store[] }> {
  const q = new URLSearchParams({ zip });
  return jsonFetch(`/stores?${q.toString()}`);
}

export async function createPlan(filters: PlanRequest): Promise<PlanResponse> {
  return jsonFetch("/plan", {
    method: "POST",
    body: JSON.stringify(filters),
  });
}

export async function refinePlan(body: PlanRefineRequest): Promise<PlanResponse> {
  return jsonFetch("/plan/refine", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function logFood(body: FoodLogRequest): Promise<FoodLogResponse> {
  return jsonFetch("/food/log", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function sendChat(body: ChatRequestPayload): Promise<ChatResponse> {
  return jsonFetch("/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getSession(): Promise<PersistedSessionState> {
  return jsonFetch("/session");
}

export async function patchSettings(body: {
  section: string;
  data: Record<string, string | number | boolean>;
}): Promise<PersistedSessionState> {
  return jsonFetch("/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
