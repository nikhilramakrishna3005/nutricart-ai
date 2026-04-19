import { AssistantStructuredMessage } from "@/components/chat/AssistantStructuredMessage";
import { cn } from "@/lib/utils";
import type { ChatResponse } from "@/types";

export type ChatMessageRole = "user" | "assistant";

export interface ChatMessageProps {
  role: ChatMessageRole;
  children: string;
  className?: string;
  /** When set on an assistant message, renders structured plan / log / explain layout. */
  structured?: ChatResponse | null;
  /** User text for the same turn (e.g. meal-log titles). */
  userQuery?: string;
}

export function ChatMessage({ role, children, className, structured, userQuery }: ChatMessageProps) {
  const isUser = role === "user";
  const richAssistant = role === "assistant" && structured;

  return (
    <div
      className={cn(
        "flex w-full min-w-0",
        isUser ? "justify-end" : "justify-start",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm sm:px-4 sm:py-3 sm:text-[15px]",
          isUser &&
            "max-w-[min(100%,26.25rem)] rounded-tr-md border border-[#4ADE80]/25 bg-[#14231A] text-[#EEF2F7]",
          !isUser &&
            !richAssistant &&
            "max-w-[min(100%,35rem)] rounded-tl-md border border-[#2A3A50] bg-[#131C2A] text-[#E5E9F0]",
          richAssistant &&
            "max-w-[min(100%,45rem)] rounded-tl-md border border-[#2A3A50] bg-[#131C2A] py-3 text-[#E5E9F0] sm:px-5 sm:py-4",
        )}
      >
        {richAssistant ? (
          <AssistantStructuredMessage response={structured} userQuery={userQuery} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
