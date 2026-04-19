export type AppShellVariant = "dashboard" | "mobile";

/**
 * Single centered column for the whole app (planner, leaders, articles, settings, profile, footers).
 * One max width so headers, dividers, cards, and bottom nav share the same horizontal grid.
 */
export const APP_SHELL_MAX_UNIFIED = "max-w-[min(100%,1100px)]";

/** @alias {@link APP_SHELL_MAX_UNIFIED} — planner / “dashboard” shell */
export const APP_SHELL_MAX_DASHBOARD = APP_SHELL_MAX_UNIFIED;

/** @alias {@link APP_SHELL_MAX_UNIFIED} — standard tab routes */
export const APP_SHELL_MAX_STANDARD = APP_SHELL_MAX_UNIFIED;

/** @deprecated Use {@link APP_SHELL_MAX_UNIFIED} */
export const APP_SHELL_MAX_MOBILE = APP_SHELL_MAX_UNIFIED;

/** Horizontal inset for {@link import("@/components/shared/PageFrame")} and {@link import("@/components/shared/AppShellFooter")}. */
export const APP_FRAME_GUTTER = "px-4 sm:px-6 lg:px-8";

/** Space reserved above fixed bottom nav + safe area (scroll regions). */
export const PAGE_SCROLL_BOTTOM_PAD = "pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))]";

/** First block below a fixed/sticky top bar inside a scroll area. */
export const PAGE_SECTION_TOP = "pt-4 sm:pt-5";
