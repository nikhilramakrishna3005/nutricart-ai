"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const btnClass =
  "flex size-9 shrink-0 items-center justify-center rounded-full border border-[#2A3A50] bg-[#1A2333] text-[#EEF2F7] transition-colors hover:bg-[#232d42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A3A50] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117] disabled:opacity-40";

function labelForOffset(offset: number): string {
  if (offset === 0) return "Today";
  if (offset === -1) return "Yesterday";
  if (offset === 1) return "Tomorrow";

  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + offset);
  return base.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Step through calendar days relative to “today” using a signed offset.
 */
export function DayNavigator() {
  const [offset, setOffset] = useState(0);
  const label = useMemo(() => labelForOffset(offset), [offset]);

  return (
    <div className="flex min-w-0 max-w-full items-center justify-center gap-1.5">
      <button
        type="button"
        className={btnClass}
        aria-label="Previous day"
        onClick={() => setOffset((o) => o - 1)}
      >
        <ChevronLeft className="size-4" strokeWidth={2} />
      </button>
      <span className="min-w-[6.5rem] truncate text-center text-sm font-semibold tabular-nums tracking-tight text-[#EEF2F7]">
        {label}
      </span>
      <button
        type="button"
        className={btnClass}
        aria-label="Next day"
        onClick={() => setOffset((o) => o + 1)}
      >
        <ChevronRight className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
