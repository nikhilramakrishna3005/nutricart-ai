"use client";

import { Pencil } from "lucide-react";

import type { MockProfile } from "@/data/mockProfile";
import { cn } from "@/lib/utils";

export interface ProfileHeroProps {
  profile: Pick<
    MockProfile,
    "initials" | "fullName" | "handle" | "age" | "location" | "memberSince"
  > & {
    /** From Settings → My Profile (optional row hidden when empty). */
    email?: string;
  };
  className?: string;
}

export function ProfileHero({ profile, className }: ProfileHeroProps) {
  return (
    <section
      className={cn(
        "rounded-[20px] border border-[#2A3A50] bg-[#131C2A] px-4 py-6 text-center shadow-sm sm:px-6",
        className,
      )}
    >
      <div className="mx-auto flex size-[88px] items-center justify-center rounded-full border-2 border-[#2A3A50] bg-gradient-to-br from-[#1A2333] to-[#0D1117] text-2xl font-bold tracking-tight text-[#EEF2F7]">
        {profile.initials}
      </div>

      <h2 className="mt-4 text-lg font-bold tracking-tight text-[#EEF2F7] sm:text-xl">{profile.fullName}</h2>
      <p className="mt-1 text-sm font-medium text-[#38BDF8]">{profile.handle}</p>

      <dl className="mt-4 grid gap-2 text-left text-sm text-[#9DB0C4] sm:mx-auto sm:max-w-xs">
        <div className="flex justify-between gap-4 border-t border-[#1F2A3D] pt-3">
          <dt className="text-[#5E7590]">Age</dt>
          <dd className="font-semibold tabular-nums text-[#EEF2F7]">{profile.age}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#5E7590]">Location</dt>
          <dd className="text-right font-medium text-[#EEF2F7]">{profile.location}</dd>
        </div>
        {profile.email ? (
          <div className="flex justify-between gap-4">
            <dt className="text-[#5E7590]">Email</dt>
            <dd className="max-w-[60%] truncate text-right font-medium text-[#EEF2F7]">{profile.email}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-[#5E7590]">Member since</dt>
          <dd className="text-right font-medium text-[#EEF2F7]">{profile.memberSince}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-[#2A3A50] bg-[#1A2333] px-4 py-2.5 text-xs font-semibold text-[#EEF2F7] transition-colors hover:bg-[#232d42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80]/35"
      >
        <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
        Edit profile
      </button>
    </section>
  );
}
