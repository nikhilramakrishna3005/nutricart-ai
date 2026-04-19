/**
 * Matches {@link import("@/components/shared/SiteHeader")} inner column (`max-w-7xl` + same gutters via
 * {@link import("@/components/shared/PageFrame")}) so planner chrome aligns with “NutriCart AI” / “Dashboard”.
 */
export const PLANNER_FRAME_MAX = "max-w-7xl";

/** Legacy alias — planner dashboard column width. */
export const PLANNER_CONTENT_MAX = `mx-auto w-full ${PLANNER_FRAME_MAX}`;

/** Fills space below the global header when the root body uses a flex column layout. */
export const PLANNER_VIEWPORT =
  "flex min-h-0 flex-1 justify-center overflow-hidden bg-[#0D1117]";
