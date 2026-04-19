"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppTopBar } from "@/components/shared/AppTopBar";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  className?: string;
}

export function ProfileHeader({ className }: ProfileHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof document === "undefined") {
      router.push("/planner");
      return;
    }
    const ref = document.referrer;
    try {
      if (ref && new URL(ref).origin === window.location.origin) {
        router.back();
        return;
      }
    } catch {
      /* ignore */
    }
    router.push("/planner");
  };

  return (
    <AppTopBar
      borderClassName="border-[#1A2333]"
      className={cn(
        "sticky top-0 z-20 bg-[#0D1117]/95 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-[#0D1117]/90",
        className,
      )}
      left={
        <button
          type="button"
          onClick={handleBack}
          className="flex size-10 items-center justify-center rounded-full border border-transparent text-[#EEF2F7] transition-colors hover:border-[#2A3A50] hover:bg-[#1A2333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80]/40"
          aria-label="Go back"
        >
          <ChevronLeft className="size-6" strokeWidth={2} />
        </button>
      }
      center={
        <h1 className="min-w-0 truncate text-center text-base font-bold tracking-tight text-[#EEF2F7]">
          Profile
        </h1>
      }
      right={<span className="size-10 shrink-0" aria-hidden />}
    />
  );
}
