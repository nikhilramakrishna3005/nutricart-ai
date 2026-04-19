"use client";

import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Ask about groceries, meals, or logging food…",
  className,
}: ChatInputProps) {
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-xl border border-[#2A3A50] bg-[#101820] p-2 pl-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        disabled={disabled}
        rows={1}
        placeholder={placeholder}
        className={cn(
          "max-h-32 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-sm text-[#EEF2F7] placeholder:text-[#5E7590] focus:outline-none",
          "disabled:opacity-50",
        )}
      />
      <button
        type="button"
        disabled={!canSend}
        onClick={onSend}
        aria-label="Send message"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#4ADE80] text-[#0D1117] transition-opacity",
          "hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131C2A]",
          "disabled:cursor-not-allowed disabled:opacity-35",
        )}
      >
        <ArrowUp className="size-5" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}
