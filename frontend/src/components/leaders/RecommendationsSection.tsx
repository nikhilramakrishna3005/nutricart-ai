import { LEADER_RECOMMENDATIONS } from "@/data/mockLeaders";

import { RecommendedCard } from "@/components/leaders/RecommendedCard";

export function RecommendationsSection() {
  return (
    <section className="space-y-3" aria-labelledby="leaders-recommended-heading">
      <h2
        id="leaders-recommended-heading"
        className="px-0.5 text-lg font-bold tracking-tight text-[#EEF2F7] sm:text-xl"
      >
        Recommended for You
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {LEADER_RECOMMENDATIONS.map((item) => (
          <RecommendedCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
