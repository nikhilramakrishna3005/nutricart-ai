"use client";

import { useEffect } from "react";

import { DailyInsightCard } from "@/components/planner/DailyInsightCard";
import { DailyTargetsCard } from "@/components/planner/DailyTargetsCard";
import { GreetingSection } from "@/components/planner/GreetingSection";
import { MicronutrientHealthCard } from "@/components/planner/MicronutrientHealthCard";
import { MacroRingsCard } from "@/components/planner/MacroRingsCard";
import { MyDayCard } from "@/components/planner/MyDayCard";
import { PlannerHeader } from "@/components/planner/PlannerHeader";
import { PlannerShell } from "@/components/planner/PlannerShell";
import { TrendGraphCard } from "@/components/planner/TrendGraphCard";
import { AppShell } from "@/components/shared/AppShell";
import { PlannerChatStateProvider } from "@/context/PlannerChatStateContext";
import { getSession } from "@/lib/api";
import { PAGE_SCROLL_BOTTOM_PAD } from "@/lib/app-shell";
import { PLANNER_FRAME_MAX } from "@/lib/planner-layout";
import { useNutriStore } from "@/lib/store/useNutriStore";
import { cn } from "@/lib/utils";

const scrollChrome = cn(
  "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden pt-4 lg:gap-7",
  PAGE_SCROLL_BOTTOM_PAD,
);

function PlannerSessionHydrate() {
  const hydrateFromPersistedSession = useNutriStore((s) => s.hydrateFromPersistedSession);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await getSession();
        if (cancelled) return;
        hydrateFromPersistedSession(session);
      } catch {
        /* keep empty dashboard */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateFromPersistedSession]);
  return null;
}

function PlannerDashboard() {
  return (
    <AppShell variant="dashboard" innerMaxClassName={PLANNER_FRAME_MAX}>
      <PlannerShell>
        <PlannerHeader />

        <main className={scrollChrome} aria-label="Nutrition dashboard">
          <PlannerSessionHydrate />
          <GreetingSection />

          <DailyInsightCard />

          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-6 xl:gap-8">
            <div className="flex flex-col gap-6">
              <MacroRingsCard className="lg:h-full" />
              <TrendGraphCard />
            </div>
            <DailyTargetsCard className="lg:h-full" />
          </div>

          <MicronutrientHealthCard />

          <MyDayCard />
        </main>
      </PlannerShell>
    </AppShell>
  );
}

export function PlannerPageClient() {
  return (
    <PlannerChatStateProvider>
      <PlannerDashboard />
    </PlannerChatStateProvider>
  );
}
