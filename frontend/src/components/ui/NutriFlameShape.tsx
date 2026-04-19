import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Exact `d` from `lucide-react` Flame icon (v0.460.0). Keep in sync when upgrading Lucide.
 * @see https://lucide.dev/icons/flame
 */
export const LUCIDE_FLAME_PATH =
  "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z";

export const LUCIDE_FLAME_VIEWBOX = "0 0 24 24";

export type NutriFlameShapeProps = SVGProps<SVGSVGElement> & {
  /** Classes applied to the `<path>`. */
  pathClassName?: string;
};

/** Same silhouette as Lucide `Flame` — use for mini streak cells and scaled hero flames. */
export function NutriFlameShape({
  className,
  pathClassName,
  fill = "currentColor",
  stroke,
  strokeWidth = 0,
  ...props
}: NutriFlameShapeProps) {
  return (
    <svg
      viewBox={LUCIDE_FLAME_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
      {...props}
    >
      <path
        d={LUCIDE_FLAME_PATH}
        className={pathClassName}
        fill={fill === "none" ? "none" : fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
