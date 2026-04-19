import { LEADER_ACHIEVEMENTS } from "@/data/mockLeaders";

import { Crown, Flame, Sparkles, Target } from "lucide-react";

const achievementIcons = {
  crown: Crown,
  flame: Flame,
  target: Target,
  sparkles: Sparkles,
} as const;

export function AchievementsSection() {
  return (
    <section className="space-y-3" aria-labelledby="leaders-achievements-heading">
      <h2
        id="leaders-achievements-heading"
        className="px-0.5 text-lg font-bold tracking-tight text-[#EEF2F7] sm:text-xl"
      >
        My Achievements
      </h2>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 pt-0.5">
        {LEADER_ACHIEVEMENTS.map((a) => {
          const Icon = achievementIcons[a.icon];
          return (
            <div
              key={a.id}
              className="flex w-[88px] shrink-0 flex-col items-center rounded-xl border border-[#2A3A50] bg-[#131C2A] px-2 py-3 sm:w-[100px]"
            >
              <div className="rounded-lg bg-[#1A2333] p-2 text-[#4ADE80]" aria-hidden>
                <Icon className="size-5" strokeWidth={2} />
              </div>
              <p className="mt-2 text-center text-[11px] font-semibold leading-tight text-[#EEF2F7] sm:text-xs">
                {a.title}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
