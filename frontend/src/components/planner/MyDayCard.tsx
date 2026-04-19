"use client";

import { MealCard, type MealMacros } from "@/components/planner/MealCard";
import { calculateMacroPercent, type MacroTargets } from "@/lib/nutrition-calculations";
import { useNutriStore } from "@/lib/store/useNutriStore";
import { useDashboardMetrics } from "@/lib/useDashboardMetrics";
import { cn } from "@/lib/utils";
import type { MyDaySlot } from "@/types";

type MealKey = "breakfast" | "lunch" | "dinner";

type DayRow = {
  key: string;
  title: string;
  calories: number;
  macros: MealMacros;
  logged: boolean;
  notLoggedMessage?: string;
  caption?: string;
};

const SHELL = "w-full rounded-[20px] bg-[#131C2A] px-4 py-5 sm:px-6 sm:py-6";

const SLOT_ORDER: Array<{ key: MealKey; label: string }> = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
];

function isLoggedSlot(slot: MyDaySlot | null | undefined): slot is MyDaySlot {
  return slot != null && slot.logged === true;
}

/**
 * Parse `macrosSummary` (e.g. "20g protein · 30g carbs · 5g fibre") and map each macro to % of daily target.
 */
function macroBarsFromSlot(slot: MyDaySlot, targets: MacroTargets): MealMacros {
  const s = slot.macrosSummary || "";
  const pM = s.match(/([\d.]+)\s*g\s*protein/i);
  const cM = s.match(/([\d.]+)\s*g\s*carbs/i);
  const fibM = s.match(/([\d.]+)\s*g\s*fib(?:er|re)?/i);
  const pG = pM ? Number.parseFloat(pM[1]) : 0;
  const cG = cM ? Number.parseFloat(cM[1]) : 0;
  const fibG = fibM ? Number.parseFloat(fibM[1]) : 0;

  return {
    protein: calculateMacroPercent(pG, targets.proteinTarget),
    carbs: calculateMacroPercent(cG, targets.carbsTarget),
    fibre: calculateMacroPercent(fibG, targets.fibreTarget),
  };
}

function rowsFromMyDay(
  myDay: {
    breakfast: MyDaySlot | null;
    lunch: MyDaySlot | null;
    dinner: MyDaySlot | null;
  },
  targets: MacroTargets,
): DayRow[] {
  return SLOT_ORDER.map(({ key, label }) => {
    const slot = myDay[key];
    if (isLoggedSlot(slot)) {
      const macros = macroBarsFromSlot(slot, targets);
      const hasMacroSignal = macros.protein > 0 || macros.carbs > 0 || macros.fibre > 0;
      return {
        key: `myday-${key}`,
        title: slot.title?.trim() || label,
        calories: Number.isFinite(slot.calories) ? slot.calories : 0,
        macros: hasMacroSignal ? macros : { protein: 0, carbs: 0, fibre: 0 },
        logged: true,
        caption: slot.macrosSummary?.trim() || undefined,
      };
    }
    return {
      key: `myday-${key}-empty`,
      title: label,
      calories: 0,
      macros: { protein: 0, carbs: 0, fibre: 0 },
      logged: false,
      notLoggedMessage: "Not logged yet",
    };
  });
}

interface MyDayCardProps {
  className?: string;
}

/**
 * My Day: breakfast / lunch / dinner from shared `myDay` (chat + GET /session hydrate).
 * Mini bars use the same daily macro targets as the rest of the planner.
 */
export function MyDayCard({ className }: MyDayCardProps) {
  const myDay = useNutriStore((s) => s.myDay);
  const { targets } = useDashboardMetrics();
  const rows = rowsFromMyDay(myDay, targets);

  return (
    <section className={cn(SHELL, className)} aria-labelledby="my-day-heading">
      <h2 id="my-day-heading" className="text-base font-bold tracking-tight-head text-[#EEF2F7]">
        My Day
      </h2>

      <div className="mt-5 space-y-3.5 sm:space-y-4">
        {rows.map((row) => (
          <MealCard
            key={row.key}
            title={row.title}
            calories={row.calories}
            macros={row.macros}
            logged={row.logged}
            notLoggedMessage={row.notLoggedMessage}
            caption={row.caption}
          />
        ))}
      </div>
    </section>
  );
}
