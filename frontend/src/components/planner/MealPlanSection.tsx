import { SectionCard } from "@/components/shared/SectionCard";
import type { MealPlan } from "@/types";

interface MealPlanSectionProps {
  meals: MealPlan[];
  loading?: boolean;
}

export function MealPlanSection({ meals, loading }: MealPlanSectionProps) {
  return (
    <SectionCard
      title="Meal plans"
      description="Two to three simple plans derived from the basket (placeholder copy)."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading meal ideas…</p>
      ) : meals.length === 0 ? (
        <p className="text-sm text-muted-foreground">Meal plans show up with your generated grocery plan.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {meals.map((m) => (
            <div key={m.id} className="rounded-lg border p-4">
              <p className="font-semibold">{m.title}</p>
              <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                {(m.meals ?? []).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {m.notes ? <p className="mt-2 text-xs text-muted-foreground">{m.notes}</p> : null}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
