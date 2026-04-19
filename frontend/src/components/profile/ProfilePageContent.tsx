"use client";

import { useEffect, useMemo, useState } from "react";

import { ProfileBadge } from "@/components/profile/ProfileBadge";
import { ProfileEditSheet } from "@/components/profile/ProfileEditSheet";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileMetricCard } from "@/components/profile/ProfileMetricCard";
import { ProfileRingStat } from "@/components/profile/ProfileRingStat";
import { useUserProfile } from "@/context/UserProfileContext";
import { getSession } from "@/lib/api";
import { mergeProfileWithSettings } from "@/lib/profileFromSettings";
import { useNutriStore } from "@/lib/store/useNutriStore";
import { useDashboardMetrics } from "@/lib/useDashboardMetrics";

export function ProfilePageContent() {
  const settings = useNutriStore((s) => s.settings);
  const myDay = useNutriStore((s) => s.myDay);
  const hydrateFromPersistedSession = useNutriStore((s) => s.hydrateFromPersistedSession);
  const { profile: u, initials, handle } = useUserProfile();
  const dash = useDashboardMetrics();

  const mealsLoggedCount =
    Number(Boolean(myDay.breakfast?.logged)) +
    Number(Boolean(myDay.lunch?.logged)) +
    Number(Boolean(myDay.dinner?.logged));
  const [editOpen, setEditOpen] = useState(false);

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

  const favorites = useMemo(() => mergeProfileWithSettings(settings).favoritePreferences, [settings]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0D1117] text-[#EEF2F7]">
      <ProfileHeader />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-4">
        <div className="flex w-full flex-col gap-5">
          <ProfileHero
            profile={{
              initials,
              fullName: u.fullName,
              handle,
              age: u.age,
              location: u.location,
              memberSince: u.memberSince,
              email: u.email || undefined,
            }}
            onEditClick={() => setEditOpen(true)}
          />

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <ProfileMetricCard label="Nutrition Score" value={String(dash.overallNutritionPercentToday)} />
            <ProfileMetricCard label="Budget Efficiency" value={`${u.budgetEfficiencyPct}%`} />
            <ProfileMetricCard
              label="Healthy Day Streak"
              value={`${dash.currentDayStreak} day${dash.currentDayStreak === 1 ? "" : "s"}`}
            />
            <ProfileMetricCard label="Meals Logged" value={String(mealsLoggedCount)} />
          </div>

          <section className="rounded-[20px] border border-[#2A3A50] bg-gradient-to-br from-[#1A2333] via-[#131C2A] to-[#0D1117] px-4 py-5 shadow-sm sm:px-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#5E7590]">Day Streak</h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[#EEF2F7] sm:text-3xl">
              🔥 {dash.currentDayStreak} {dash.currentDayStreak === 1 ? "Day" : "Days"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#9DB0C4]">{dash.streakSubtitleText}</p>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#5E7590]">
              Data Highlights
            </h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <ProfileRingStat label="Best Macro Balance" valuePct={dash.macroBalancePct} />
              <ProfileRingStat label="Peak Micronutrient Score" valuePct={dash.micronutrientPeakPct} />
              <ProfileRingStat label="Best Budget Score" valuePct={u.budgetScorePct} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {u.badgeRow.map((line) => (
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
                <dd className="font-bold tabular-nums text-[#EEF2F7]">{u.nutritionSummary.groceryPlansCreated}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[#1F2A3D] pb-2.5">
                <dt className="text-[#9DB0C4]">Meals generated</dt>
                <dd className="font-bold tabular-nums text-[#EEF2F7]">{u.nutritionSummary.mealsGenerated}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[#1F2A3D] pb-2.5">
                <dt className="text-[#9DB0C4]">Meals logged</dt>
                <dd className="font-bold tabular-nums text-[#EEF2F7]">{u.nutritionSummary.mealsLogged}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 pt-0.5">
                <dt className="text-[#9DB0C4]">Avg weekly spend</dt>
                <dd className="font-bold tabular-nums text-[#4ADE80]">${u.nutritionSummary.avgWeeklySpendUsd}</dd>
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
                <dd className="font-medium text-[#EEF2F7]">{favorites.dietType}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-[#5E7590]">Cuisine preference</dt>
                <dd className="font-medium text-[#EEF2F7]">{favorites.cuisinePreference}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-[#5E7590]">Budget goal</dt>
                <dd className="font-medium text-[#EEF2F7]">{favorites.budgetGoal}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-[#5E7590]">Top store</dt>
                <dd className="text-right font-medium leading-snug text-[#EEF2F7] sm:text-left">
                  {favorites.topStore}
                </dd>
              </div>
            </dl>
          </section>

          <section className="pb-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#5E7590]">
              Achievements
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {u.achievements.map((title) => (
                <ProfileBadge key={title} title={title} />
              ))}
            </div>
          </section>
        </div>
      </div>

      <ProfileEditSheet open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
