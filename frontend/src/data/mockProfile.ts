/** Demo profile content for NutriCart AI — metrics stay mock; identity prefs overlay from session settings. */

export interface MockProfile {
  initials: string;
  fullName: string;
  handle: string;
  age: number;
  location: string;
  memberSince: string;
  highlights: {
    nutritionScore: number;
    budgetEfficiencyPct: number;
    healthyDayStreak: string;
    mealsLogged: number;
  };
  dayStreak: {
    days: number;
    subtitle: string;
  };
  dataRings: {
    macroBalancePct: number;
    micronutrientPeakPct: number;
    budgetScorePct: number;
  };
  badgeRow: readonly string[];
  nutritionSummary: {
    groceryPlansCreated: number;
    mealsGenerated: number;
    mealsLogged: number;
    avgWeeklySpendUsd: number;
  };
  favoritePreferences: {
    dietType: string;
    cuisinePreference: string;
    budgetGoal: string;
    topStore: string;
  };
  achievements: readonly string[];
}

export const mockProfile: MockProfile = {
  initials: "NR",
  fullName: "Nikhil Rama Krishna",
  handle: "@nikhil_rk",
  age: 26,
  location: "Washington, DC",
  memberSince: "November 2025",
  highlights: {
    nutritionScore: 82,
    budgetEfficiencyPct: 89,
    healthyDayStreak: "12 days",
    mealsLogged: 48,
  },
  dayStreak: {
    days: 12,
    subtitle: "You’ve stayed on track for 12 straight days.",
  },
  dataRings: {
    macroBalancePct: 92,
    micronutrientPeakPct: 87,
    budgetScorePct: 94,
  },
  badgeRow: ["8 days under budget", "5 days high-protein", "6 days meal logging streak"],
  nutritionSummary: {
    groceryPlansCreated: 16,
    mealsGenerated: 42,
    mealsLogged: 48,
    avgWeeklySpendUsd: 37,
  },
  favoritePreferences: {
    dietType: "Vegetarian",
    cuisinePreference: "Indian",
    budgetGoal: "Under $50/week",
    topStore: "Walmart Neighborhood Market",
  },
  achievements: [
    "Budget Master",
    "Consistency Streak",
    "Macro Tracker",
    "Smart Shopper",
    "Meal Planner",
  ],
};
