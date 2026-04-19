import { LEADER_TEAMS } from "@/data/mockLeaders";

import { TeamCard } from "@/components/leaders/TeamCard";

export function CommunitySection() {
  return (
    <section className="space-y-4" aria-labelledby="leaders-community-heading">
      <div className="space-y-1 px-0.5">
        <h2
          id="leaders-community-heading"
          className="text-lg font-bold tracking-tight text-[#EEF2F7] sm:text-xl"
        >
          Build your community
        </h2>
        <p className="text-sm text-[#5E7590] sm:text-base">Compete with people in your situation</p>
      </div>
      <div>
        <h3 className="mb-3 px-0.5 text-[11px] font-bold uppercase tracking-section-caps text-[#5E7590]">
          My Teams
        </h3>
        <div className="space-y-3">
          {LEADER_TEAMS.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      </div>
    </section>
  );
}
