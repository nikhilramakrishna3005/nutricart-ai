"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNutriStore } from "@/lib/store/useNutriStore";
import { cn } from "@/lib/utils";
import type { DietPreference, PlannerFilters } from "@/types";

interface PreferencesModalProps {
  open: boolean;
  onClose: () => void;
}

export function PreferencesModal({ open, onClose }: PreferencesModalProps) {
  const titleId = useId();
  const stored = useNutriStore((s) => s.preferences);
  const setPreferences = useNutriStore((s) => s.setPreferences);
  const [draft, setDraft] = useState<PlannerFilters>(stored);

  useEffect(() => {
    if (open) setDraft(stored);
  }, [open, stored]);

  const set = useCallback(<K extends keyof PlannerFilters>(key: K, value: PlannerFilters[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSave = () => {
    setPreferences(draft);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Close preferences"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 max-h-[min(90vh,640px)] w-full max-w-md overflow-y-auto rounded-2xl border border-[#2A3A50] bg-[#131C2A] p-4 shadow-xl sm:p-5",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-bold tracking-tight text-[#EEF2F7]">
              Preferences
            </h2>
            <p className="mt-1 text-xs leading-snug text-[#5E7590]">
              Used for chat requests and planning. Change anytime before you send a message.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-[#2A3A50] bg-[#1A2333] px-2.5 py-1 text-xs font-semibold text-[#EEF2F7] transition-colors hover:bg-[#232d42]"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="pref-budget" className="text-[#5E7590]">
              Budget (USD)
            </Label>
            <Input
              id="pref-budget"
              type="number"
              min={10}
              className="border-[#2A3A50] bg-[#0D1117] text-[#EEF2F7]"
              value={draft.budget_usd}
              onChange={(e) => set("budget_usd", Number(e.target.value))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pref-days" className="text-[#5E7590]">
              Grocery days
            </Label>
            <Input
              id="pref-days"
              type="number"
              min={1}
              max={30}
              className="border-[#2A3A50] bg-[#0D1117] text-[#EEF2F7]"
              value={draft.grocery_days}
              onChange={(e) => set("grocery_days", Number(e.target.value))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pref-diet" className="text-[#5E7590]">
              Diet type
            </Label>
            <select
              id="pref-diet"
              className="flex h-10 w-full rounded-md border border-[#2A3A50] bg-[#0D1117] px-3 py-2 text-sm text-[#EEF2F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/40"
              value={draft.diet}
              onChange={(e) => set("diet", e.target.value as DietPreference)}
            >
              <option value="either">Either</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="non_veg">Non-vegetarian</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pref-risky" className="text-[#5E7590]">
              Risky foods / allergies (comma-separated)
            </Label>
            <Input
              id="pref-risky"
              placeholder="peanuts, shellfish"
              className="border-[#2A3A50] bg-[#0D1117] text-[#EEF2F7] placeholder:text-[#5E7590]"
              value={draft.risky_foods.join(", ")}
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
            <Label htmlFor="pref-cuisine" className="text-[#5E7590]">
              Cuisine preference
            </Label>
            <Input
              id="pref-cuisine"
              className="border-[#2A3A50] bg-[#0D1117] text-[#EEF2F7]"
              value={draft.cuisine}
              onChange={(e) => set("cuisine", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pref-zip" className="text-[#5E7590]">
              Zip code
            </Label>
            <Input
              id="pref-zip"
              className="border-[#2A3A50] bg-[#0D1117] text-[#EEF2F7]"
              value={draft.zip_code}
              onChange={(e) => set("zip_code", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="border-[#2A3A50] bg-transparent" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" className="bg-[#38BDF8] text-[#0D1117] hover:bg-[#7DD3FC]" onClick={handleSave}>
            Save preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
