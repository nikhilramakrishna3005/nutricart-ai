"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useUserProfileOptional } from "@/context/UserProfileContext";
import { AppTopBar } from "@/components/shared/AppTopBar";

const profileBtnClass =
  "flex size-10 shrink-0 items-center justify-center rounded-full border border-[#2A3A50] bg-[#1A2333] text-[#EEF2F7] transition-colors hover:bg-[#232d42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A3A50] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117]";

const dayBtnClass =
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

function NutrientRingLink({ percent }: { percent: number }) {
  const p = Math.min(100, Math.max(0, percent));
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (1 - p / 100);

  return (
    <Link
      href="/planner/nutrients"
      className="relative block size-11 shrink-0 -rotate-90 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117]"
      aria-label={`Open nutrient breakdown, score ${Math.round(p)}%`}
    >
      <svg width="44" height="44" viewBox="0 0 44 44" className="block">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#1D2D40"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#4ADE80"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dash}
        />
      </svg>
      <span className="pointer-events-none absolute inset-0 flex rotate-90 items-center justify-center text-sm font-bold tabular-nums leading-none tracking-tight text-[#4ADE80]">
        {Math.round(p)}%
      </span>
    </Link>
  );
}

export function LeadersHeader() {
  const [offset, setOffset] = useState(0);
  const label = useMemo(() => labelForOffset(offset), [offset]);
  const { initials } = useUserProfileOptional();

  return (
    <AppTopBar
      left={
        <Link href="/profile" className={profileBtnClass} aria-label="Open profile">
          <span className="text-[11px] font-bold tracking-tight text-[#EEF2F7]">{initials}</span>
        </Link>
      }
      center={
        <div className="flex min-w-0 max-w-full items-center justify-center gap-1.5">
          <button
            type="button"
            className={dayBtnClass}
            aria-label="Previous day"
            onClick={() => setOffset((o) => o - 1)}
          >
            <ChevronLeft className="size-4" strokeWidth={2} />
          </button>
          <span className="min-w-[6.5rem] truncate text-center text-sm font-semibold tabular-nums tracking-tight text-[#EEF2F7] sm:text-base">
            {label}
          </span>
          <button
            type="button"
            className={dayBtnClass}
            aria-label="Next day"
            onClick={() => setOffset((o) => o + 1)}
          >
            <ChevronRight className="size-4" strokeWidth={2} />
          </button>
        </div>
      }
      right={<NutrientRingLink percent={65} />}
    />
  );
}
