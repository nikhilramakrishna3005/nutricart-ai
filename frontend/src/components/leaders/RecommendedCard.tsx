import type { LeaderRecommendation } from "@/data/mockLeaders";

export function RecommendedCard({ item }: { item: LeaderRecommendation }) {
  return (
    <article className="flex min-w-0 flex-1 flex-col rounded-2xl border border-[#2A3A50] bg-[#131C2A] p-3 sm:p-4">
      <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: item.accentLine }} aria-hidden />
      <h3 className="mt-3 text-sm font-bold tracking-tight text-[#EEF2F7] sm:text-base">{item.title}</h3>
      <p className="mt-1 text-xs text-[#5E7590] sm:text-sm">{item.subtitle}</p>
      <p className="mt-2 text-[11px] font-medium text-[#5E7590] sm:text-xs">{item.membersLabel}</p>
      <span className="mt-2 inline-flex w-fit rounded-full border border-[#2A3A50] bg-[#0D1117] px-2 py-0.5 text-[10px] font-semibold text-[#A7B4C8] sm:text-xs">
        {item.pillText}
      </span>
      <button
        type="button"
        className="mt-4 w-full rounded-xl border border-[#2A3A50] bg-[#0D1117] py-2 text-xs font-semibold text-[#EEF2F7] transition-colors hover:border-[#4ADE80]/40 hover:bg-[#1A2333] sm:text-sm"
      >
        Join
      </button>
    </article>
  );
}
