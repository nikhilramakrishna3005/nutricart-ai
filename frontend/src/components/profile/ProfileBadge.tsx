import { Award } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ProfileBadgeProps {
  title: string;
  className?: string;
}

export function ProfileBadge({ title, className }: ProfileBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-[#2A3A50] bg-[#101820] px-3 py-2.5",
        className,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#2A3A50] bg-[#1A2333] text-[#4ADE80]">
        <Award className="size-4" strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 text-sm font-semibold leading-snug text-[#EEF2F7]">{title}</span>
    </div>
  );
}
