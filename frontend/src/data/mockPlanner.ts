import type { PlannerFilters } from "@/types";

/** Default filter values for first paint / demo. */
export const DEFAULT_PLANNER_FILTERS: PlannerFilters = {
  budget_usd: 120,
  grocery_days: 7,
  diet: "either",
  risky_foods: ["peanuts"],
  cuisine: "Mediterranean",
  zip_code: "94103",
};
