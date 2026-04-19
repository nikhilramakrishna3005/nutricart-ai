"use client";

import { useMemo } from "react";

import { buildMicronutrientGapSuggestion } from "@/lib/nutrition-calculations";
import { useDashboardMetrics } from "@/lib/useDashboardMetrics";
import { cn } from "@/lib/utils";

type Status = "Low" | "Moderate" | "Good";

function StatusBadge({ status }: { status: Status }) {
  if (status === "Low") {
    return (
      <span className="shrink-0 rounded-md border border-[#EA580C]/50 bg-[#EA580C]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-label-caps text-[#FB923C]">
        Low
      </span>
    );
  }
  if (status === "Moderate") {
    return (
      <span className="shrink-0 rounded-md border border-[#4ADE80]/35 bg-[#4ADE80]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-label-caps text-[#86EFAC]">
        Moderate
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-md border border-[#38BDF8]/40 bg-[#38BDF8]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-label-caps text-[#7DD3FC]">
      Good
    </span>
  );
}

interface MicronutrientHealthCardProps {
  className?: string;
}

/**
 * Micronutrient-only panel: % of RDI from summed `micronutrient_totals` via shared dashboard metrics.
 */
export function MicronutrientHealthCard({ className }: MicronutrientHealthCardProps) {
  const { microRows: rows } = useDashboardMetrics();

  const suggested = useMemo(
    () => buildMicronutrientGapSuggestion(rows.map((r) => ({ id: r.key, label: r.name, pct: r.pct }))),
    [rows],
  );

  return (
    <section
      className={cn(
        "w-full rounded-[20px] border border-[#2A3A50] bg-[#131C2A] p-4 sm:p-5",
        className,
      )}
      aria-labelledby="micro-health-title"
    >
      <div className="mb-4">
        <h2
          id="micro-health-title"
          className="text-base font-bold tracking-tight text-[#EEF2F7] sm:text-[17px]"
        >
          Micronutrient Health
        </h2>
        <p className="mt-0.5 text-xs font-medium tracking-tight text-[#5E7590] sm:text-sm">
          Key gaps to improve today
        </p>
      </div>

      <ul className="space-y-3 sm:space-y-3.5">
        {rows.map((row) => (
          <li key={row.key}>
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-semibold tracking-tight text-[#EEF2F7]">
                {row.name}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs font-semibold tabular-nums text-[#EEF2F7]">{row.pct}%</span>
                <StatusBadge status={row.status as Status} />
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1D2D40]">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${row.pct}%`, backgroundColor: row.color }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-xl border border-[#2A3A50] bg-[#1A2333] p-3.5 sm:p-4">
        <p className="text-[11px] font-bold uppercase tracking-section-caps text-[#5E7590]">Suggested fix</p>
        <p className="mt-2 text-sm font-normal leading-relaxed text-[#EEF2F7]">{suggested}</p>
      </div>
    </section>
  );
}
