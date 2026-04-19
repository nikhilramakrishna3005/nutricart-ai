"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { usePlannerChat } from "@/context/PlannerChatStateContext";
import { cn } from "@/lib/utils";

const LOADING_TEXT = "Updating your plan…";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface ChatPanelProps {
  className?: string;
}

/**
 * Thin chat layer: sends user text to POST `/chat`; structured response updates planner state.
 */
export function ChatPanel({ className }: ChatPanelProps) {
  const { sendChatMessage, chatSending, chatError } = usePlannerChat();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Ask to plan groceries, tweak meals, or log food — the dashboard updates from the reply.",
    },
  ]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || chatSending) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text: trimmed };
    const loadingId = crypto.randomUUID();
    const loadingMsg: ChatMessage = { id: loadingId, role: "assistant", text: LOADING_TEXT };

    setMessages((m) => [...m, userMsg, loadingMsg]);
    setInput("");

    const { assistantText } = await sendChatMessage(trimmed);
    const short =
      assistantText.length > 280 ? `${assistantText.slice(0, 277).trimEnd()}…` : assistantText;

    setMessages((m) =>
      m.map((row) => (row.id === loadingId ? { ...row, text: short } : row)),
    );
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Chat</CardTitle>
        <CardDescription>Messages go to the planner API and refresh the cards above.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {chatError ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {chatError.length > 160 ? `${chatError.slice(0, 157)}…` : chatError}
          </p>
        ) : null}
        <ScrollArea className="h-48 rounded-md border p-3">
          <ul className="space-y-2 text-sm">
            {messages.map((m) => (
              <li
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-6 rounded-lg bg-secondary px-3 py-2"
                    : "mr-6 text-muted-foreground"
                }
              >
                {m.text}
              </li>
            ))}
          </ul>
        </ScrollArea>
        <Textarea
          placeholder='e.g. "Pasta dinner under $20" or "I had oatmeal and coffee"'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={chatSending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button type="button" onClick={() => void send()} disabled={chatSending || !input.trim()}>
          {chatSending ? "Sending…" : "Send"}
        </Button>
      </CardContent>
    </Card>
  );
}
