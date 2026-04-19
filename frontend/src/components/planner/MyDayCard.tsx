"use client";

import { Plus } from "lucide-react";

import { MealCard, type MealMacros } from "@/components/planner/MealCard";
import { useNutriStore } from "@/lib/store/useNutriStore";
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

const addBtnClass =
  "flex size-9 shrink-0 items-center justify-center rounded-full border border-[#2A3A50] bg-[#1A2333] text-[#EEF2F7] transition-colors hover:bg-[#232d42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A3A50] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131C2A]";

const SLOT_ORDER: Array<{ key: MealKey; label: string }> = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
];

function isLoggedSlot(slot: MyDaySlot | null | undefined): slot is MyDaySlot {
  return slot != null && slot.logged === true;
}

/**
 * Backend `macrosSummary` is like "20g protein · 30g carbs · 5g fibre".
 * Map to 0–100 bar fills; estimate fat from remaining kcal when not in the string.
 */
function macroBarsFromSlot(slot: MyDaySlot): MealMacros {
  const s = slot.macrosSummary || "";
  const pM = s.match(/([\d.]+)\s*g\s*protein/i);
  const cM = s.match(/([\d.]+)\s*g\s*carbs/i);
  const fM = s.match(/([\d.]+)\s*g\s*fat/i);
  let pG = pM ? Number.parseFloat(pM[1]) : 0;
  let cG = cM ? Number.parseFloat(cM[1]) : 0;
  let fG = fM ? Number.parseFloat(fM[1]) : 0;
  if (!fM && slot.calories > 0 && (pG > 0 || cG > 0)) {
    const remainder = slot.calories - 4 * pG - 4 * cG;
    fG = remainder > 0 ? remainder / 9 : 0;
  }
  const cap = (g: number, max: number) =>
    Math.min(100, Math.max(0, Math.round(max > 0 ? (g / max) * 100 : 0)));
  return {
    p: cap(pG, 40),
    f: cap(fG, 30),
    c: cap(cG, 60),
  };
}

function rowsFromMyDay(myDay: {
  breakfast: MyDaySlot | null;
  lunch: MyDaySlot | null;
  dinner: MyDaySlot | null;
}): DayRow[] {
  return SLOT_ORDER.map(({ key, label }) => {
    const slot = myDay[key];
    if (isLoggedSlot(slot)) {
      const macros = macroBarsFromSlot(slot);
      const hasMacroSignal = macros.p > 0 || macros.f > 0 || macros.c > 0;
      return {
        key: `myday-${key}`,
        title: slot.title?.trim() || label,
        calories: Number.isFinite(slot.calories) ? slot.calories : 0,
        macros: hasMacroSignal ? macros : { p: 0, f: 0, c: 0 },
        logged: true,
        caption: slot.macrosSummary?.trim() || undefined,
      };
    }
    return {
      key: `myday-${key}-empty`,
      title: label,
      calories: 0,
      macros: { p: 0, f: 0, c: 0 },
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
 */
export function MyDayCard({ className }: MyDayCardProps) {
  const myDay = useNutriStore((s) => s.myDay);
  const rows = rowsFromMyDay(myDay);

  return (
    <section className={cn(SHELL, className)} aria-labelledby="my-day-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="my-day-heading" className="text-base font-bold tracking-tight-head text-[#EEF2F7]">
          My Day
        </h2>
        <button type="button" className={addBtnClass} aria-label="Add meal">
          <Plus className="size-5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-4 space-y-3">
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
