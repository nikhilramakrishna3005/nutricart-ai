"use client";

import { Pencil } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ProfileHeroDisplay {
  initials: string;
  fullName: string;
  handle: string;
  age: number;
  location: string;
  memberSince: string;
  email?: string;
}

export interface ProfileHeroProps {
  profile: ProfileHeroDisplay;
  className?: string;
  onEditClick?: () => void;
}

export function ProfileHero({ profile, className, onEditClick }: ProfileHeroProps) {
  return (
    <section
      className={cn(
        "flex w-full flex-col items-center rounded-[20px] border border-[#2A3A50] bg-[#131C2A] px-4 py-7 text-center shadow-sm sm:px-6 sm:py-8",
        className,
      )}
    >
      <div className="flex w-full max-w-md flex-col items-center">
        <div
          className="flex size-[88px] shrink-0 items-center justify-center rounded-full border-2 border-[#2A3A50] bg-gradient-to-br from-[#1A2333] to-[#0D1117] text-2xl font-bold tracking-tight text-[#EEF2F7] shadow-inner"
          aria-hidden
        >
          {profile.initials}
        </div>

        <h2 className="mt-5 max-w-full text-pretty text-lg font-bold tracking-tight text-[#EEF2F7] sm:text-xl">
          {profile.fullName}
        </h2>
        <p className="mt-1.5 text-sm font-medium text-[#38BDF8]">{profile.handle}</p>

        <dl className="mt-6 w-full max-w-sm space-y-0 text-sm text-[#9DB0C4]">
          <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0 border-t border-[#1F2A3D] py-2.5 first:border-t-0 first:pt-0">
            <dt className="text-left text-[#5E7590]">Age</dt>
            <dd className="text-right font-semibold tabular-nums text-[#EEF2F7]">{profile.age}</dd>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-x-4 border-t border-[#1F2A3D] py-2.5">
            <dt className="text-left text-[#5E7590]">Location</dt>
            <dd className="text-right font-medium leading-snug text-[#EEF2F7]">{profile.location}</dd>
          </div>
          {profile.email ? (
            <div className="grid grid-cols-[1fr_auto] gap-x-4 border-t border-[#1F2A3D] py-2.5">
              <dt className="min-w-0 text-left text-[#5E7590]">Email</dt>
              <dd className="max-w-[min(100%,12rem)] truncate text-right font-medium text-[#EEF2F7]">
                {profile.email}
              </dd>
            </div>
          ) : null}
          <div className="grid grid-cols-[1fr_auto] gap-x-4 border-t border-[#1F2A3D] py-2.5">
            <dt className="text-left text-[#5E7590]">Member since</dt>
            <dd className="text-right font-medium text-[#EEF2F7]">{profile.memberSince}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onEditClick}
          className="mt-7 flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-[#2A3A50] bg-[#1A2333] px-4 py-2.5 text-xs font-semibold text-[#EEF2F7] transition-colors hover:bg-[#232d42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80]/35 sm:max-w-[14rem]"
        >
          <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
          Edit profile
        </button>
      </div>
    </section>
  );
}
