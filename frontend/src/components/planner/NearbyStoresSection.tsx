import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/shared/SectionCard";
import type { Store } from "@/types";

interface NearbyStoresSectionProps {
  stores: Store[];
  loading?: boolean;
}

export function NearbyStoresSection({ stores, loading }: NearbyStoresSectionProps) {
  return (
    <SectionCard
      title="Nearby stores"
      description="Mock distances, hours, and open/closed — swap for real store APIs later."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading stores…</p>
      ) : stores.length === 0 ? (
        <p className="text-sm text-muted-foreground">Run “Generate plan” to load store suggestions.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {stores.map((s) => (
            <li key={s.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.distance_miles.toFixed(1)} mi</p>
                </div>
                <Badge variant={s.is_open ? "default" : "secondary"}>
                  {s.is_open ? "Open" : "Closed"}
                </Badge>
              </div>
              {!s.is_open && s.opens_at ? (
                <p className="mt-2 text-xs text-muted-foreground">Opens {s.opens_at}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
