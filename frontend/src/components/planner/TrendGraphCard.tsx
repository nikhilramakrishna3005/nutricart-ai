"use client";

import { useMemo } from "react";

import { usePlannerNutriBridge } from "@/lib/store/usePlannerNutriBridge";
import { useDashboardMetrics } from "@/lib/useDashboardMetrics";
import { cn } from "@/lib/utils";

const MOCK_SERIES = [45, 60, 55, 70, 65, 80, 75];

const W = 340;
const H = 168;
const PAD = 18;

function toPoints(values: number[]): [number, number][] {
  const n = values.length;
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const span = maxV - minV || 1;
  return values.map((v, i) => {
    const x = PAD + (i / (n - 1)) * (W - 2 * PAD);
    const t = (v - minV) / span;
    const y = PAD + (1 - t) * (H - 2 * PAD);
    return [x, y] as [number, number];
  });
}

/** Smooth Catmull-Rom style curve as SVG cubic segments. */
function linePath(points: [number, number][]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function areaPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  const baseY = H - PAD;
  const line = linePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last[0]} ${baseY} L ${first[0]} ${baseY} Z`;
}

interface TrendGraphCardProps {
  className?: string;
}

/**
 * 7-day trend sparkline; last point follows nutrition score when chat data is available.
 */
export function TrendGraphCard({ className }: TrendGraphCardProps) {
  const { nutritionSummary } = usePlannerNutriBridge();
  const { overallNutritionPercentToday } = useDashboardMetrics();

  const series = useMemo(() => {
    const s = [...MOCK_SERIES];
    if (nutritionSummary != null) {
      const v = Math.min(98, Math.max(44, overallNutritionPercentToday));
      s[6] = v;
      s[5] = Math.round(s[4] * 0.42 + v * 0.58);
    }
    return s;
  }, [nutritionSummary, overallNutritionPercentToday]);

  const points = toPoints(series);
  const strokePath = linePath(points);
  const fillPath = areaPath(points);
  const viewBox = `0 0 ${W} ${H}`;

  return (
    <section
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col rounded-[20px] border border-[#2A3A50] bg-[#131C2A] p-4 sm:p-5",
        className,
      )}
      aria-labelledby="weekly-progress-title"
    >
      <div className="mb-3 shrink-0 sm:mb-4">
        <h2
          id="weekly-progress-title"
          className="text-base font-bold tracking-tight text-[#EEF2F7] sm:text-[17px]"
        >
          Weekly Progress
        </h2>
        <p className="mt-0.5 text-xs font-medium tracking-tight text-[#5E7590] sm:text-sm">Last 7 days</p>
      </div>

      <div className="relative flex min-h-0 flex-1 w-full items-stretch overflow-hidden rounded-xl">
        <svg
          viewBox={viewBox}
          className="h-full min-h-[9.75rem] w-full max-w-full flex-1 sm:min-h-[10.5rem] lg:max-h-[15rem]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Nutrition trend over the last seven days, increasing overall"
        >
          <defs>
            <linearGradient id="trend-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#4ADE80" stopOpacity="0" />
            </linearGradient>
            <filter id="trend-line-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path d={fillPath} fill="url(#trend-area-fill)" />

          <path
            d={strokePath}
            fill="none"
            stroke="#4ADE80"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#trend-line-glow)"
          />

          {points.map(([x, y], i) => {
            const isLast = i === points.length - 1;
            const r = isLast ? 5.5 : 3.5;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={r}
                fill={isLast ? "#4ADE80" : "#131C2A"}
                stroke="#4ADE80"
                strokeWidth={isLast ? 2 : 1.75}
              />
            );
          })}
        </svg>
      </div>
    </section>
  );
}
