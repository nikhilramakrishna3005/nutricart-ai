import type { LeaderStat } from "@/data/mockLeaders";

import { cn } from "@/lib/utils";
import { Flame, Gauge, Leaf, Wallet } from "lucide-react";

const accentBar: Record<LeaderStat["accent"], string> = {
  green: "bg-gradient-to-r from-[#4ADE80]/90 via-[#4ADE80]/40 to-transparent",
  amber: "bg-gradient-to-r from-[#F59E0B]/90 via-[#F59E0B]/40 to-transparent",
  rose: "bg-gradient-to-r from-[#F97316]/90 via-[#F97316]/40 to-transparent",
  purple: "bg-gradient-to-r from-[#A78BFA]/90 via-[#A78BFA]/40 to-transparent",
};

const iconColor: Record<LeaderStat["accent"], string> = {
  green: "text-[#4ADE80]",
  amber: "text-[#F59E0B]",
  rose: "text-[#FB923C]",
  purple: "text-[#A78BFA]",
};

const icons = {
  leaf: Leaf,
  wallet: Wallet,
  flame: Flame,
  gauge: Gauge,
} as const;

function TopBadge({ text, tone }: { text: string; tone: LeaderStat["badgeTone"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide sm:text-xs",
        tone === "positive" && "bg-[#4ADE80]/15 uppercase text-[#4ADE80]",
        tone === "neutral" && "bg-[#1D2D40] text-[#EEF2F7]",
        tone === "warning" && "bg-[#EA580C]/20 text-[#FB923C]",
      )}
    >
      {text}
    </span>
  );
}

export function StatCard({ stat }: { stat: LeaderStat }) {
  const Icon = icons[stat.icon];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#2A3A50] bg-[#131C2A] p-3.5 sm:p-4">
      <div
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-90", accentBar[stat.accent])}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className={cn("rounded-lg bg-[#0D1117]/80 p-1.5", iconColor[stat.accent])} aria-hidden>
          <Icon className="size-4 sm:size-[18px]" strokeWidth={2} />
        </div>
        <TopBadge text={stat.badgeText} tone={stat.badgeTone} />
      </div>
      <p className="relative mt-3 text-2xl font-extrabold tabular-nums tracking-tight text-[#EEF2F7] sm:text-[26px]">
        {stat.bigValue}
      </p>
      <p className="relative mt-1 text-[11px] font-bold uppercase tracking-section-caps text-[#5E7590]">
        {stat.label}
      </p>
      <p className="relative mt-1 text-xs font-normal leading-snug text-[#5E7590] sm:text-sm">{stat.subtext}</p>
    </div>
  );
}
