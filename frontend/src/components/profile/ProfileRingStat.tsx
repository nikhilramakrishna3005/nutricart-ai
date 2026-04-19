"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export interface ProfileRingStatProps {
  label: string;
  valuePct: number;
  className?: string;
}

function clampPct(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/**
 * Circular progress ring with centered percentage — data-forward, minimal chrome.
 */
export function ProfileRingStat({ label, valuePct, className }: ProfileRingStatProps) {
  const pct = clampPct(valuePct);
  const gradId = useId().replace(/:/g, "");
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-[#2A3A50] bg-[#131C2A] px-3 py-4 shadow-sm",
        className,
      )}
    >
      <div className="relative size-[104px]">
        <svg className="size-full -rotate-90" viewBox="0 0 88 88" aria-hidden>
          <circle
            cx="44"
            cy="44"
            r="36"
            fill="none"
            stroke="#1D2D40"
            strokeWidth="8"
          />
          <circle
            cx="44"
            cy="44"
            r="36"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold tabular-nums text-[#EEF2F7]">{pct}%</span>
        </div>
      </div>
      <p className="mt-3 min-h-[2.5rem] text-center text-[10px] font-semibold leading-snug text-[#9DB0C4] sm:text-[11px]">
        {label}
      </p>
    </div>
  );
}
