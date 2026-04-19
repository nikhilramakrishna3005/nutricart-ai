"use client";

import { useEffect, useMemo } from "react";

import { ProfileBadge } from "@/components/profile/ProfileBadge";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileMetricCard } from "@/components/profile/ProfileMetricCard";
import { ProfileRingStat } from "@/components/profile/ProfileRingStat";
import { getSession } from "@/lib/api";
import { mergeProfileWithSettings } from "@/lib/profileFromSettings";
import { useNutriStore } from "@/lib/store/useNutriStore";

export function ProfilePageContent() {
  const settings = useNutriStore((s) => s.settings);
  const hydrateFromPersistedSession = useNutriStore((s) => s.hydrateFromPersistedSession);

  useEffect(() => {
    let cancelled = false;
    getSession()
      .then((session) => {
        if (!cancelled) hydrateFromPersistedSession(session);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hydrateFromPersistedSession]);

  const p = useMemo(() => mergeProfileWithSettings(settings), [settings]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0D1117] text-[#EEF2F7]">
      <ProfileHeader />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-4">
        <div className="flex w-full flex-col gap-5">
          <ProfileHero
            profile={{
              initials: p.initials,
              fullName: p.fullName,
              handle: p.handle,
              age: p.age,
              location: p.location,
              memberSince: p.memberSince,
              email: p.email,
            }}
          />

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <ProfileMetricCard label="Nutrition Score" value={String(p.highlights.nutritionScore)} />
            <ProfileMetricCard
              label="Budget Efficiency"
              value={`${p.highlights.budgetEfficiencyPct}%`}
            />
            <ProfileMetricCard label="Healthy Day Streak" value={p.highlights.healthyDayStreak} />
            <ProfileMetricCard label="Meals Logged" value={String(p.highlights.mealsLogged)} />
          </div>

          <section className="rounded-[20px] border border-[#2A3A50] bg-gradient-to-br from-[#1A2333] via-[#131C2A] to-[#0D1117] px-4 py-5 shadow-sm sm:px-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#5E7590]">Day Streak</h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[#EEF2F7] sm:text-3xl">
              🔥 {p.dayStreak.days} Days
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#9DB0C4]">{p.dayStreak.subtitle}</p>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#5E7590]">
              Data Highlights
            </h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <ProfileRingStat label="Best Macro Balance" valuePct={p.dataRings.macroBalancePct} />
              <ProfileRingStat
                label="Peak Micronutrient Score"
                valuePct={p.dataRings.micronutrientPeakPct}
              />
              <ProfileRingStat label="Best Budget Score" valuePct={p.dataRings.budgetScorePct} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.badgeRow.map((line) => (
                <span
                  key={line}
                  className="rounded-full border border-[#2A3A50] bg-[#101820] px-3 py-1 text-[11px] font-semibold text-[#9DB0C4]"
                >
                  {line}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[20px] border border-[#2A3A50] bg-[#131C2A] px-4 py-4 sm:px-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#5E7590]">
              Nutrition Summary
            </h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-[#1F2A3D] pb-2.5">
                <dt className="text-[#9DB0C4]">Grocery plans created</dt>
                <dd className="font-bold tabular-nums text-[#EEF2F7]">
                  {p.nutritionSummary.groceryPlansCreated}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[#1F2A3D] pb-2.5">
                <dt className="text-[#9DB0C4]">Meals generated</dt>
                <dd className="font-bold tabular-nums text-[#EEF2F7]">
                  {p.nutritionSummary.mealsGenerated}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[#1F2A3D] pb-2.5">
                <dt className="text-[#9DB0C4]">Meals logged</dt>
                <dd className="font-bold tabular-nums text-[#EEF2F7]">
                  {p.nutritionSummary.mealsLogged}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 pt-0.5">
                <dt className="text-[#9DB0C4]">Avg weekly spend</dt>
                <dd className="font-bold tabular-nums text-[#4ADE80]">
                  ${p.nutritionSummary.avgWeeklySpendUsd}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[20px] border border-[#2A3A50] bg-[#131C2A] px-4 py-4 sm:px-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#5E7590]">
              Favorite preferences
            </h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-[#5E7590]">Diet type</dt>
                <dd className="font-medium text-[#EEF2F7]">{p.favoritePreferences.dietType}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-[#5E7590]">Cuisine preference</dt>
                <dd className="font-medium text-[#EEF2F7]">{p.favoritePreferences.cuisinePreference}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-[#5E7590]">Budget goal</dt>
                <dd className="font-medium text-[#EEF2F7]">{p.favoritePreferences.budgetGoal}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-[#5E7590]">Top store</dt>
                <dd className="text-right font-medium leading-snug text-[#EEF2F7] sm:text-left">
                  {p.favoritePreferences.topStore}
                </dd>
              </div>
            </dl>
          </section>

          <section className="pb-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#5E7590]">
              Achievements
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {p.achievements.map((title) => (
                <ProfileBadge key={title} title={title} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
