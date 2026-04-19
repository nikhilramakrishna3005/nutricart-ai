"use client";

import { useUserProfileOptional } from "@/context/UserProfileContext";
import { cn } from "@/lib/utils";

interface GreetingSectionProps {
  className?: string;
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Intro copy above planner content (greeting + snapshot hint).
 */
export function GreetingSection({ className }: GreetingSectionProps) {
  const { greetingName } = useUserProfileOptional();
  const title = `${timeOfDayGreeting()}, ${greetingName}`;

  return (
    <section className={cn("border-b border-[#2A3A50]/60 pb-6 pt-1 lg:border-0 lg:pb-0", className)}>
      <h1 className="text-[22px] font-extrabold leading-[1.15] tracking-tight-head text-[#EEF2F7] sm:text-2xl lg:text-[26px]">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] font-normal leading-relaxed text-[#5E7590] sm:text-base">
        Here&apos;s your nutrition snapshot
      </p>
    </section>
  );
}
