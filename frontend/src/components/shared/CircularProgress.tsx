"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const TRACK_COLOR = "#1D2D40";

export interface CircularProgressProps {
  /** Fill level 0–100. */
  percentage: number;
  /** Stroke color for the progress arc (e.g. macro color). */
  color: string;
  /** Outer box / viewBox side length in px. */
  size?: number;
  /** Ring thickness; scales with `size` when omitted. */
  strokeWidth?: number;
  /** Delay before the progress arc animates in (e.g. staggered macro rings). */
  animationDelayMs?: number;
  className?: string;
}

function clampPct(value: number) {
  return Math.min(100, Math.max(0, value));
}

/**
 * SVG ring with animated progress and centered label. Intended for macro rings and similar KPIs.
 */
export function CircularProgress({
  percentage,
  color,
  size = 90,
  strokeWidth: strokeWidthProp,
  animationDelayMs = 0,
  className,
}: CircularProgressProps) {
  const strokeWidth = strokeWidthProp ?? Math.max(5, Math.round(size * 0.09));
  const radius = useMemo(
    () => Math.max(1, size / 2 - strokeWidth / 2 - 0.5),
    [size, strokeWidth],
  );
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);

  const target = useMemo(
    () => circumference * (1 - clampPct(percentage) / 100),
    [circumference, percentage],
  );

  const [dashOffset, setDashOffset] = useState(circumference);

  useEffect(() => {
    setDashOffset(circumference);
  }, [circumference]);

  useEffect(() => {
    let raf = 0;
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(() => {
        setDashOffset(target);
      });
    }, animationDelayMs);
    return () => {
      window.clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, animationDelayMs]);

  const cx = size / 2;
  const cy = size / 2;
  const label = `${Math.round(clampPct(percentage))}%`;
  const fontSize = Math.max(11, Math.round(size * 0.22));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0 select-none", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clampPct(percentage))}
      aria-label={label}
    >
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={TRACK_COLOR}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 0.85s cubic-bezier(0.33, 1, 0.68, 1)",
          }}
        />
      </g>
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        className="font-bold tabular-nums tracking-tight text-[#EEF2F7]"
        style={{ fontSize }}
      >
        {label}
      </text>
    </svg>
  );
}
