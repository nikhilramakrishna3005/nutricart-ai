import { SectionCard } from "@/components/shared/SectionCard";
import type { NutritionSummary } from "@/types";

interface NutritionSummarySectionProps {
  nutrition: NutritionSummary | null;
}

export function NutritionSummarySection({ nutrition }: NutritionSummarySectionProps) {
  return (
    <SectionCard
      title="Nutrition summary"
      description="Updates when you log food via chat (mock scoring for demo)."
    >
      {!nutrition ? (
        <p className="text-sm font-normal leading-relaxed text-muted-foreground">
          Log something you ate with “Log food” to populate this panel.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium tracking-tight text-muted-foreground">Nutrition score</p>
            <p className="text-4xl font-extrabold tracking-tight-head text-primary">{nutrition.score}</p>
            <p className="text-xs font-normal text-muted-foreground">0–100 mock index</p>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="font-medium tracking-tight text-muted-foreground">Calories</dt>
              <dd className="font-semibold tabular-nums">{nutrition.calories_today}</dd>
            </div>
            <div>
              <dt className="font-medium tracking-tight text-muted-foreground">Protein</dt>
              <dd className="font-semibold tabular-nums">{nutrition.protein_g} g</dd>
            </div>
            <div>
              <dt className="font-medium tracking-tight text-muted-foreground">Carbs</dt>
              <dd className="font-semibold tabular-nums">{nutrition.carbs_g} g</dd>
            </div>
            <div>
              <dt className="font-medium tracking-tight text-muted-foreground">Fat</dt>
              <dd className="font-semibold tabular-nums">{nutrition.fat_g} g</dd>
            </div>
            <div className="col-span-2">
              <dt className="font-medium tracking-tight text-muted-foreground">Fiber</dt>
              <dd className="font-semibold tabular-nums">{nutrition.fiber_g} g</dd>
            </div>
          </dl>
          {nutrition.highlights.length > 0 ? (
            <ul className="col-span-full list-inside list-disc text-sm text-muted-foreground sm:col-span-2">
              {nutrition.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
