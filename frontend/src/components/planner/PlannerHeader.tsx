import Link from "next/link";
import { User } from "lucide-react";

import { DayNavigator } from "@/components/planner/DayNavigator";
import { NutrientBadge } from "@/components/planner/NutrientBadge";
import { AppTopBar } from "@/components/shared/AppTopBar";

const profileBtnClass =
  "flex size-10 shrink-0 items-center justify-center rounded-full border border-[#2A3A50] bg-[#1A2333] text-[#EEF2F7] transition-colors hover:bg-[#232d42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A3A50] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117]";

/**
 * Planner top bar: profile, centered day navigator, nutrient badge.
 */
export function PlannerHeader() {
  return (
    <AppTopBar
      left={
        <Link href="/profile" className={profileBtnClass} aria-label="Open profile">
          <User className="size-[18px]" strokeWidth={2} />
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
