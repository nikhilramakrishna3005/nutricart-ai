"use client";

import Link from "next/link";

import { DayNavigator } from "@/components/planner/DayNavigator";
import { NutrientBadge } from "@/components/planner/NutrientBadge";
import { useUserProfileOptional } from "@/context/UserProfileContext";
import { AppTopBar } from "@/components/shared/AppTopBar";

const profileBtnClass =
  "flex size-10 shrink-0 items-center justify-center rounded-full border border-[#2A3A50] bg-[#1A2333] text-[#EEF2F7] transition-colors hover:bg-[#232d42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A3A50] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117]";

/**
 * Planner top bar: profile, centered day navigator, nutrient badge.
 */
export function PlannerHeader() {
  const { initials } = useUserProfileOptional();

  return (
    <AppTopBar
      left={
        <Link href="/profile" className={profileBtnClass} aria-label="Open profile">
          <span className="text-[11px] font-bold tracking-tight text-[#EEF2F7]">{initials}</span>
        </Link>
      }
      center={
        <div className="flex min-w-0 justify-center">
          <DayNavigator />
        </div>
      }
      right={<NutrientBadge />}
    />
  );
}
