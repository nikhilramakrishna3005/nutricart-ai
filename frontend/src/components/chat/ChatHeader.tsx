import { SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  className?: string;
  onOpenPreferences?: () => void;
}

export function ChatHeader({ className, onOpenPreferences }: ChatHeaderProps) {
  return (
    <header className={cn("shrink-0 border-b border-[#1A2333] pb-3 pt-1", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-[#EEF2F7] sm:text-xl">AI Chat</h1>
          <p className="mt-0.5 text-xs leading-snug text-[#5E7590] sm:text-[13px]">
            Grocery plans, meals, and food logging — synced with your planner.
          </p>
        </div>
        {onOpenPreferences ? (
          <button
            type="button"
            onClick={onOpenPreferences}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-[#2A3A50] bg-[#1A2333] px-3.5 py-2 text-xs font-semibold text-[#EEF2F7] shadow-sm transition-colors hover:bg-[#232d42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/40 sm:px-4"
          >
            <SlidersHorizontal className="size-4" strokeWidth={2} aria-hidden />
            Filters
          </button>
        ) : null}
      </div>
    </header>
  );
}
