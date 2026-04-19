import { mockProfile } from "@/data/mockProfile";

/** Shared user profile fields (identity, stats, streaks). Seeded from `mockProfile` + settings overlay. */
export type UserProfileState = {
  fullName: string;
  username: string;
  age: number;
  location: string;
  email: string;
  memberSince: string;
  nutritionScore: number;
  budgetEfficiencyPct: number;
  healthyDayStreak: string;
  mealsLogged: number;
  dayStreakDays: number;
  dayStreakSubtitle: string;
  macroBalancePct: number;
  micronutrientPeakPct: number;
  budgetScorePct: number;
  badgeRow: string[];
  nutritionSummary: {
    groceryPlansCreated: number;
    mealsGenerated: number;
    mealsLogged: number;
    avgWeeklySpendUsd: number;
  };
  achievements: string[];
};

export const DEFAULT_USER_PROFILE: UserProfileState = {
  fullName: mockProfile.fullName,
  username: mockProfile.handle.replace(/^@/, "").replace(/_/g, "") || "nikhil_rk",
  age: mockProfile.age,
  location: mockProfile.location,
  email: "nikhil@example.com",
  memberSince: mockProfile.memberSince,
  nutritionScore: mockProfile.highlights.nutritionScore,
  budgetEfficiencyPct: mockProfile.highlights.budgetEfficiencyPct,
  healthyDayStreak: mockProfile.highlights.healthyDayStreak,
  mealsLogged: mockProfile.highlights.mealsLogged,
  dayStreakDays: mockProfile.dayStreak.days,
  dayStreakSubtitle: mockProfile.dayStreak.subtitle,
  macroBalancePct: mockProfile.dataRings.macroBalancePct,
  micronutrientPeakPct: mockProfile.dataRings.micronutrientPeakPct,
  budgetScorePct: mockProfile.dataRings.budgetScorePct,
  badgeRow: [...mockProfile.badgeRow],
  nutritionSummary: { ...mockProfile.nutritionSummary },
  achievements: [...mockProfile.achievements],
};

export function initialsFromFullName(fullName: string, fallback = "NC"): string {
  const t = fullName.trim();
  if (!t) return fallback.slice(0, 2).toUpperCase();
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[1][0];
    if (a && b) return `${a}${b}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

export function formatUsernameHandle(username: string): string {
  const u = username.trim();
  if (!u) return "@user";
  return u.startsWith("@") ? u : `@${u}`;
}

export function greetingFirstName(fullName: string): string {
  const t = fullName.trim();
  if (!t) return "there";
  return t.split(/\s+/)[0] ?? "there";
}

export function mergeProfileSectionIntoUser(
  profile: Record<string, string | number | boolean> | undefined,
  prev: UserProfileState,
): UserProfileState {
  if (!profile) return prev;
  const next = { ...prev };
  if (profile.fullName != null && String(profile.fullName).trim()) {
    next.fullName = String(profile.fullName).trim();
  }
  if (profile.username != null && String(profile.username).trim()) {
    next.username = String(profile.username).trim().replace(/^@/, "");
  }
  if (typeof profile.age === "number" && Number.isFinite(profile.age)) {
    next.age = Math.round(profile.age);
  } else if (profile.age != null && String(profile.age).trim()) {
    const n = Number(profile.age);
    if (Number.isFinite(n)) next.age = Math.round(n);
  }
  if (profile.location != null && String(profile.location).trim()) {
    next.location = String(profile.location).trim();
  }
  if (profile.email != null && String(profile.email).trim()) {
    next.email = String(profile.email).trim();
  }
  return next;
}
