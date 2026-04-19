"use client";

import type { DietPreference, PlannerFilters } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FiltersPanelProps {
  filters: PlannerFilters;
  onChange: (next: PlannerFilters) => void;
  onApply: () => void;
  loading?: boolean;
}

/** Left-column planner constraints (maps to POST /plan body). */
export function FiltersPanel({ filters, onChange, onApply, loading }: FiltersPanelProps) {
  const set = <K extends keyof PlannerFilters>(key: K, value: PlannerFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
        <CardDescription>Budget, duration, diet, and location — sent to the mock planner API.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="budget">Budget (USD)</Label>
          <Input
            id="budget"
            type="number"
            min={10}
            value={filters.budget_usd}
            onChange={(e) => set("budget_usd", Number(e.target.value))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="days">Grocery days</Label>
          <Input
            id="days"
            type="number"
            min={1}
            max={30}
            value={filters.grocery_days}
            onChange={(e) => set("grocery_days", Number(e.target.value))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="diet">Diet</Label>
          <select
            id="diet"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={filters.diet}
            onChange={(e) => set("diet", e.target.value as DietPreference)}
          >
            <option value="either">Either</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="non_veg">Non-vegetarian</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="risky">Risky foods / allergies (comma-separated)</Label>
          <Input
            id="risky"
            placeholder="peanuts, shellfish"
            value={filters.risky_foods.join(", ")}
            onChange={(e) =>
              set(
                "risky_foods",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cuisine">Cuisine preference</Label>
          <Input
            id="cuisine"
            value={filters.cuisine}
            onChange={(e) => set("cuisine", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="zip">Zip code</Label>
          <Input id="zip" value={filters.zip_code} onChange={(e) => set("zip_code", e.target.value)} />
        </div>
        <Button className="w-full" onClick={onApply} disabled={loading}>
          {loading ? "Planning…" : "Generate plan"}
        </Button>
      </CardContent>
    </Card>
  );
}
