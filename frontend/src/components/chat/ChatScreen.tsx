"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { buildChatResultSummary } from "@/components/chat/chatResultSummary";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { PreferencesModal } from "@/components/chat/PreferencesModal";
import { ResultSummaryPanel } from "@/components/chat/ResultSummaryPanel";
import { buildStandaloneChatPayload } from "@/components/chat/standaloneChatRequest";
import { getSession, sendChat } from "@/lib/api";
import {
  chatMessagesFromHistory,
  chatResponseFromPersistedSession,
  lastUserMessageFromSessionHistory,
  sessionHasPersistedPlannerData,
} from "@/lib/store/sessionHydration";
import { useNutriStore } from "@/lib/store/useNutriStore";
import { cn } from "@/lib/utils";
import type { ChatResponse } from "@/types";

type Role = "user" | "assistant";

interface Msg {
  id: string;
  role: Role;
  text: string;
  structured?: ChatResponse;
  userQuery?: string;
}

const LOADING_TEXT = "Thinking…";

const INTRO_MESSAGES: Msg[] = [
  {
    id: "intro-1",
    role: "assistant",
    text: "Hi — I’m NutriCart AI. Ask for grocery lists, meal ideas, food logging, or explanations in plain language.",
  },
  {
    id: "intro-2",
    role: "assistant",
    text: "Use Filters in the header for budget, diet, and location. Messages update your planner dashboard.",
  },
];

function historyRowsToMsgs(rows: ReturnType<typeof chatMessagesFromHistory>): Msg[] {
  return rows.map((m) => ({ id: m.id, role: m.role, text: m.text }));
}

/** Rich assistant bubble for the latest turn when `lastChatResponse.message` matches the saved line. */
function attachLastAssistantStructured(msgs: Msg[], res: ChatResponse | null): Msg[] {
  if (!res || msgs.length === 0) return msgs;
  const last = msgs[msgs.length - 1];
  if (last.role !== "assistant") return msgs;
  const a = last.text.trim();
  const b = (res.message || "").trim();
  if (a !== b) return msgs;
  const prevUser =
    msgs.length >= 2 && msgs[msgs.length - 2]?.role === "user" ? msgs[msgs.length - 2].text : "";
  const next = msgs.slice();
  next[next.length - 1] = { ...last, structured: res, userQuery: prevUser };
  return next;
}

function friendlyFetchError(err: unknown): string {
  const raw = err instanceof Error ? err.message : "Request failed";
  const short = raw.length > 220 ? `${raw.slice(0, 217)}…` : raw;
  return `Something went wrong: ${short}`;
}

export function ChatScreen() {
  const chatHistory = useNutriStore((s) => s.chatHistory);
  const [draft, setDraft] = useState("");
  const [lastChatResponse, setLastChatResponse] = useState<ChatResponse | null>(null);
  const [lastSubmittedUser, setLastSubmittedUser] = useState("");
  const [sending, setSending] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [pendingTurn, setPendingTurn] = useState<{
    loadingId: string;
    userText: string;
  } | null>(null);
  const [sendFailure, setSendFailure] = useState<{
    id: string;
    userText: string;
    errorText: string;
  } | null>(null);
  const inFlightRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const applyChatResponse = useNutriStore((s) => s.applyChatResponse);
  const hydrateFromPersistedSession = useNutriStore((s) => s.hydrateFromPersistedSession);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await getSession();
        if (cancelled) return;
        hydrateFromPersistedSession(session);
        if (sessionHasPersistedPlannerData(session)) {
          setLastChatResponse(chatResponseFromPersistedSession(session));
          setLastSubmittedUser(lastUserMessageFromSessionHistory(session));
        }
      } catch {
        /* offline / API down — keep store as-is */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateFromPersistedSession]);

  const displayMessages = useMemo(() => {
    const fromServer = historyRowsToMsgs(chatMessagesFromHistory(chatHistory));
    const withStruct =
      fromServer.length > 0 ? attachLastAssistantStructured(fromServer, lastChatResponse) : fromServer;

    if (pendingTurn) {
      return [
        ...withStruct,
        {
          id: `pending-u-${pendingTurn.loadingId}`,
          role: "user" as const,
          text: pendingTurn.userText,
        },
        { id: pendingTurn.loadingId, role: "assistant" as const, text: LOADING_TEXT },
      ];
    }

    if (sendFailure) {
      const failTail: Msg[] = [
        { id: `fail-u-${sendFailure.id}`, role: "user", text: sendFailure.userText },
        { id: `fail-a-${sendFailure.id}`, role: "assistant", text: sendFailure.errorText },
      ];
      return fromServer.length > 0 ? [...withStruct, ...failTail] : failTail;
    }

    if (fromServer.length === 0) {
      return INTRO_MESSAGES;
    }

    return withStruct;
  }, [chatHistory, lastChatResponse, pendingTurn, sendFailure]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [displayMessages]);

  const summaryView = useMemo(
    () => buildChatResultSummary(lastChatResponse, lastSubmittedUser),
    [lastChatResponse, lastSubmittedUser],
  );

  const explanationForPanel = lastChatResponse?.explanation?.trim() || null;

  const submitUserText = useCallback(
    async (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed || inFlightRef.current) return;
      inFlightRef.current = true;
      setSendFailure(null);
      setLastSubmittedUser(trimmed);

      const loadingId = crypto.randomUUID();
      setPendingTurn({ loadingId, userText: trimmed });
      setSending(true);

      try {
        const payload = buildStandaloneChatPayload(trimmed, lastChatResponse);
        const res = await sendChat(payload);
        setLastChatResponse(res);
        applyChatResponse(res);
        setPendingTurn(null);
      } catch (e) {
        setPendingTurn(null);
        setSendFailure({
          id: crypto.randomUUID(),
          userText: trimmed,
          errorText: friendlyFetchError(e),
        });
      } finally {
        inFlightRef.current = false;
        setSending(false);
      }
    },
    [lastChatResponse, applyChatResponse],
  );

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void submitUserText(text);
  }, [draft, submitUserText]);

  const workspaceClass = "mx-auto w-full max-w-[min(100%,1024px)] min-w-0";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className={cn(workspaceClass, "flex min-h-0 flex-1 flex-col")}>
        <ChatHeader className="shrink-0" onOpenPreferences={() => setPrefsOpen(true)} />

        <div className="mt-2 shrink-0">
          <ResultSummaryPanel view={summaryView} explanation={explanationForPanel} />
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            ref={scrollRef}
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden py-1 pr-0.5"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {displayMessages.map((m) => (
              <ChatMessage
                key={m.id}
                role={m.role}
                structured={m.structured}
                userQuery={m.userQuery}
              >
                {m.text}
              </ChatMessage>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#1A2333] bg-[#0D1117] shadow-[0_-8px_24px_rgba(0,0,0,0.45)]">
        <div className={cn(workspaceClass, "px-0 pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] pt-2")}>
          <ChatInput value={draft} onChange={setDraft} onSend={handleSend} disabled={sending} />
        </div>
      </div>

      <PreferencesModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </div>
  );
}
