"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Medal, MessageCircle, Settings } from "lucide-react";

import { AppShellFooter } from "@/components/shared/AppShellFooter";
import { PLANNER_FRAME_MAX } from "@/lib/planner-layout";
import { cn } from "@/lib/utils";

import type { AppShellVariant } from "@/lib/app-shell";

function footerShellVariant(pathname: string | null): AppShellVariant {
  if (pathname?.startsWith("/planner")) return "dashboard";
  return "mobile";
}

type NavId = "home" | "leaders" | "ai" | "articles" | "settings" | "none";

export interface BottomNavProps {
  className?: string;
}

const items: {
  id: NavId;
  label: string;
  href: string;
  center?: boolean;
}[] = [
  { id: "home", label: "Home", href: "/planner" },
  { id: "leaders", label: "Leaders", href: "/leaders" },
  { id: "ai", label: "AI Chat", href: "/chat", center: true },
  { id: "articles", label: "Articles", href: "/articles" },
  { id: "settings", label: "Settings", href: "/settings" },
];

const labelStyle = { letterSpacing: "0.3px" } as const;

function activeNavIdFromPath(pathname: string | null): NavId {
  if (!pathname) return "home";
  if (pathname.startsWith("/profile")) return "none";
  if (pathname.startsWith("/planner")) return "home";
  if (pathname.startsWith("/leaders")) return "leaders";
  if (pathname.startsWith("/articles")) return "articles";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/chat")) return "ai";
  return "home";
}

/**
 * Fixed five-tab bar with a raised center action (AI Chat).
 */
export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();
  const activeId = activeNavIdFromPath(pathname);
  const shellFooterVariant = footerShellVariant(pathname);

  const inactive = "text-[#5E7590]";
  const active = "text-[#4ade80]";
  const ringOffset = "focus-visible:ring-offset-[#0D1117]";

  return (
    <AppShellFooter
      variant={shellFooterVariant}
      className={className}
      frameMaxClassName={PLANNER_FRAME_MAX}
    >
      <nav
        className="w-full border-t border-[#1A2333] bg-[#0D1117] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
        aria-label="Primary navigation"
      >
        <ul className="flex w-full items-end justify-between pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          if (item.center) {
            const isActive = activeId === item.id;
            return (
              <li key={item.id} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                <Link
                  href={item.href}
                  className={cn(
                    "-translate-y-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ade80] focus-visible:ring-offset-2",
                    ringOffset,
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className="flex size-[52px] items-center justify-center rounded-full bg-[#4ade80] shadow-[0_8px_24px_rgba(74,222,128,0.35)]"
                    aria-hidden
                  >
                    <MessageCircle className="size-6 text-[#0D1117]" strokeWidth={2.25} />
                  </span>
                </Link>
                <span
                  className={cn(
                    "mt-1 text-center text-[10px] font-bold leading-none",
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
                ? Medal
                : item.id === "articles"
                  ? BookOpen
                  : Settings;

          return (
            <li key={item.id} className="flex min-w-0 flex-1 flex-col items-center justify-end pb-2">
              <Link
                href={item.href}
                className={cn(
                  "flex w-full max-w-[76px] flex-col items-center gap-1 rounded-lg px-1 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ade80] focus-visible:ring-offset-2",
                  ringOffset,
                  isActive ? active : inactive,
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-[22px] shrink-0" strokeWidth={2} />
                <span
                  className="text-center text-[10px] font-bold leading-tight"
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
    </AppShellFooter>
  );
}
