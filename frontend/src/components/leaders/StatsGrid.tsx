import { LEADER_STATS } from "@/data/mockLeaders";

import { StatCard } from "@/components/leaders/StatCard";

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {LEADER_STATS.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </div>
  );
}
