import type { LeaderTeam } from "@/data/mockLeaders";

import { cn } from "@/lib/utils";

const barColor: Record<LeaderTeam["progressAccent"], string> = {
  green: "from-[#4ADE80] via-[#4ADE80] to-[#22C55E]/40",
  blue: "from-[#38BDF8] via-[#38BDF8] to-[#0EA5E9]/40",
  violet: "from-[#A78BFA] via-[#A78BFA] to-[#7C3AED]/40",
};

const glowColor: Record<LeaderTeam["progressAccent"], string> = {
  green: "shadow-[0_0_12px_rgba(74,222,128,0.35)]",
  blue: "shadow-[0_0_12px_rgba(56,189,248,0.35)]",
  violet: "shadow-[0_0_12px_rgba(167,139,250,0.35)]",
};

export function TeamCard({ team }: { team: LeaderTeam }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#2A3A50] bg-[#131C2A] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold tracking-tight text-[#EEF2F7] sm:text-lg">{team.name}</h3>
            <span className="rounded-full bg-[#1A2333] px-2 py-0.5 text-[10px] font-semibold text-[#5E7590] sm:text-xs">
              {team.membersLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#5E7590] sm:text-sm">{team.subtitle}</p>
        </div>
        <span className="shrink-0 rounded-lg border border-[#4ADE80]/30 bg-[#4ADE80]/10 px-2 py-1 text-xs font-bold text-[#4ADE80] sm:text-sm">
          {team.rankBadge}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex -space-x-1.5" aria-hidden>
          {team.avatarInitials.map((ch, i) => (
            <span
              key={`${team.id}-av-${i}`}
              className="flex size-7 items-center justify-center rounded-full border-2 border-[#131C2A] bg-[#1A2333] text-[10px] font-bold text-[#EEF2F7]"
            >
              {ch}
            </span>
          ))}
        </div>
        <p className="text-right text-xs font-medium text-[#5E7590] sm:text-sm">{team.leaderLine}</p>
      </div>

      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[#1D2D40]">
        <div
          className={cn(
            "h-full w-4/5 rounded-full bg-gradient-to-r to-transparent",
            barColor[team.progressAccent],
            glowColor[team.progressAccent],
          )}
          aria-hidden
        />
      </div>
    </article>
  );
}
