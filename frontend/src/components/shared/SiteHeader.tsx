import Link from "next/link";

import { cn } from "@/lib/utils";

const links = [{ href: "/planner", label: "Dashboard" }];

/** Top navigation used across routes. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/planner" className="text-lg font-bold tracking-tight-head text-primary">
          NutriCart AI
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium tracking-tight">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn("text-muted-foreground transition-colors hover:text-foreground")}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
