"use client";

import Link from "next/link";
import { BookOpen, Home, MessageCircle, Settings, Users } from "lucide-react";

import { cn } from "@/lib/utils";

export type NavId = "home" | "leaders" | "ai" | "articles" | "settings" | "none";

const labelStyle = { letterSpacing: "0.3px" } as const;

const items: {
  id: NavId;
  label: string;
  href: string;
  center?: boolean;
}[] = [
  { id: "home", label: "Home", href: "/planner" },
  { id: "leaders", label: "Community", href: "/leaders" },
  { id: "ai", label: "AI Chat", href: "/chat", center: true },
  { id: "articles", label: "Articles", href: "/articles" },
  { id: "settings", label: "Settings", href: "/settings" },
];

export function activeNavIdFromPath(pathname: string | null): NavId {
  if (!pathname) return "home";
  if (pathname.startsWith("/profile")) return "none";
  if (pathname.startsWith("/planner")) return "home";
  if (pathname.startsWith("/leaders")) return "leaders";
  if (pathname.startsWith("/articles")) return "articles";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/chat")) return "ai";
  return "home";
}

function BottomNavNotchBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[5.625rem] w-full"
      viewBox="0 0 400 90"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 24 L154 24 C166 24 174 32 182 40 Q200 60 218 40 C226 32 234 24 246 24 L400 24 L400 90 L0 90 Z"
        className="fill-[#0D1117]"
      />
      <path
        d="M0 24 L154 24 C166 24 174 32 182 40 Q200 60 218 40 C226 32 234 24 246 24 L400 24"
        fill="none"
        stroke="#1A2333"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export interface BottomNavBarProps {
  activeId: NavId;
  className?: string;
}

export function BottomNavBar({ activeId, className }: BottomNavBarProps) {
  const inactive = "text-[#5E7590]";
  const active = "text-[#4ade80]";
  const ringOffset = "focus-visible:ring-offset-[#0D1117]";

  return (
    <nav
      className={cn(
        "relative w-full overflow-visible pb-[max(0.25rem,env(safe-area-inset-bottom))]",
        className,
      )}
      aria-label="Primary navigation"
    >
      <BottomNavNotchBackground />

      <ul
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-full items-stretch justify-between",
          "min-h-[4.5rem] px-1 pt-1 sm:min-h-[4.75rem] sm:px-1.5 sm:pt-1.5",
          "pb-[max(0.7rem,calc(0.4rem+env(safe-area-inset-bottom)))]",
        )}
      >
        {items.map((item) => {
          if (item.center) {
            const isActive = activeId === item.id;
            return (
              <li
                key={item.id}
                className="flex min-w-0 flex-1 flex-col items-center justify-end"
              >
                <Link
                  href={item.href}
                  className={cn(
                    "relative z-20 -translate-y-[0.5rem] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ade80] focus-visible:ring-offset-2 sm:-translate-y-[0.625rem]",
                    ringOffset,
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className="absolute -inset-1.5 -z-10 rounded-full bg-[#4ADE80]/20 blur-md"
                    aria-hidden
                  />
                  <span
                    className="relative flex size-[52px] items-center justify-center rounded-full bg-[#4ade80] shadow-[0_10px_32px_rgba(74,222,128,0.48),0_0_0_3px_#0D1117] sm:size-[54px]"
                    aria-hidden
                  >
                    <MessageCircle className="size-6 text-[#0D1117] sm:size-[26px]" strokeWidth={2.25} />
                  </span>
                </Link>
                <span
                  className={cn(
                    "mt-1 text-center text-[10px] font-bold leading-none sm:text-[11px]",
                    isActive ? active : inactive,
                  )}
                  style={labelStyle}
                >
                  {item.label}
                </span>
              </li>
            );
          }

          const isActive = activeId === item.id;
          const Icon =
            item.id === "home"
              ? Home
              : item.id === "leaders"
              ? Users
              : item.id === "articles"
              ? BookOpen
              : Settings;

          return (
            <li
              key={item.id}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-end",
                // 🔥 pushed lower to PERFECT center
                "pt-7 pb-2 sm:pt-8 sm:pb-3",
              )}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex w-full max-w-[76px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ade80] focus-visible:ring-offset-2",
                  // 🔥 final center alignment push
                  "translate-y-4 sm:translate-y-5",
                  ringOffset,
                  isActive ? active : inactive,
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-[22px] shrink-0 sm:size-6" strokeWidth={2} />
                <span
                  className="text-center text-[10px] font-bold leading-tight sm:text-[11px]"
                  style={labelStyle}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}