"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Medal, MessageCircle, Settings } from "lucide-react";

import { AppShellFooter } from "@/components/shared/AppShellFooter";
import { PLANNER_FRAME_MAX } from "@/lib/planner-layout";
import { cn } from "@/lib/utils";

const labelStyle = { letterSpacing: "0.3px" } as const;

type Item =
  | { id: "home"; label: string; href: string; icon: typeof Home; center?: false }
  | { id: "leaders"; label: string; href: string; icon: typeof Medal; center?: false }
  | { id: "ai"; label: string; href: string; center: true }
  | { id: "articles"; label: string; href: string; icon: typeof BookOpen; center?: false }
  | { id: "settings"; label: string; href: string; icon: typeof Settings; center?: false };

const items: Item[] = [
  { id: "home", label: "Home", href: "/planner", icon: Home },
  { id: "leaders", label: "Leaders", href: "/leaders", icon: Medal },
  { id: "ai", label: "AI Chat", href: "/chat", center: true },
  { id: "articles", label: "Articles", href: "/articles", icon: BookOpen },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
];

/**
 * Articles-page footer: matches main app BottomNav styling; Articles active on /articles.
 */
export function ArticlesFooterNav() {
  const pathname = usePathname();
  const articlesActive = pathname === "/articles" || pathname.startsWith("/articles/");
  const homeActive = pathname.startsWith("/planner");
  const leadersActive = pathname.startsWith("/leaders");
  const settingsActive = pathname.startsWith("/settings");
  const chatActive = pathname.startsWith("/chat");

  const inactive = "text-[#5E7590]";
  const active = "text-[#4ade80]";
  const ringOffset = "focus-visible:ring-offset-[#0D1117]";

  return (
    <AppShellFooter variant="mobile" frameMaxClassName={PLANNER_FRAME_MAX}>
      <nav
        className="w-full border-t border-[#1A2333] bg-[#0D1117] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
        aria-label="Primary navigation"
      >
        <ul className="flex w-full items-end justify-between pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          if ("center" in item && item.center) {
            const isActive = chatActive;
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
                    "mt-1 text-center text-xs font-bold leading-tight sm:text-sm",
                    isActive ? active : inactive,
                  )}
                  style={labelStyle}
                >
                  {item.label}
                </span>
              </li>
            );
          }

          const side = item as Exclude<Item, { center: true }>;
          const isActive =
            side.id === "articles"
              ? articlesActive
              : side.id === "home"
                ? homeActive
                : side.id === "leaders"
                  ? leadersActive
                  : side.id === "settings"
                    ? settingsActive
                    : false;
          const Icon = side.icon;

          return (
            <li key={side.id} className="flex min-w-0 flex-1 flex-col items-center justify-end pb-2">
              <Link
                href={side.href}
                className={cn(
                  "flex w-full max-w-[76px] flex-col items-center gap-1 rounded-lg px-1 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ade80] focus-visible:ring-offset-2",
                  ringOffset,
                  isActive ? active : inactive,
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-6 shrink-0 sm:size-[26px]" strokeWidth={2} />
                <span className="text-center text-xs font-bold leading-tight sm:text-sm" style={labelStyle}>
                  {side.label}
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
