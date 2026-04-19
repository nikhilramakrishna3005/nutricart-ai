import type { MyDaySlot, NutritionSummary } from "@/types";

const STORAGE_KEY = "nutricart-day-streak-v1";

export type StreakPersisted = {
  /** Last calendar day (local YYYY-MM-DD) on which the user qualified (≥1 log / nutrition activity). */
  lastQualifiedYmd: string | null;
  /** Consecutive qualified days ending at lastQualifiedYmd. */
  streak: number;
};

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole calendar days between two YYYY-MM-DD strings (a → b), e.g. gap 1 means b is next day after a. */
export function calendarDaysBetween(aYmd: string, bYmd: string): number {
  const a = new Date(`${aYmd}T12:00:00`);
  const b = new Date(`${bYmd}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function readStreakState(): StreakPersisted {
  if (typeof window === "undefined") return { lastQualifiedYmd: null, streak: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lastQualifiedYmd: null, streak: 0 };
    const j = JSON.parse(raw) as Partial<StreakPersisted>;
    const streak = typeof j.streak === "number" && Number.isFinite(j.streak) ? Math.max(0, Math.floor(j.streak)) : 0;
    const last =
      typeof j.lastQualifiedYmd === "string" && /^\d{4}-\d{2}-\d{2}$/.test(j.lastQualifiedYmd)
        ? j.lastQualifiedYmd
        : null;
    return { lastQualifiedYmd: last, streak };
  } catch {
    return { lastQualifiedYmd: null, streak: 0 };
  }
}

function writeStreakState(s: StreakPersisted) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota */
  }
}

/**
 * True when there is evidence of at least one meal logged today (session slots or nutrition totals).
 */
export function hasQualifiedNutritionToday(
  myDay: { breakfast: MyDaySlot | null; lunch: MyDaySlot | null; dinner: MyDaySlot | null },
  nutrition: NutritionSummary | null | undefined,
): boolean {
  const slots = [myDay.breakfast, myDay.lunch, myDay.dinner];
  if (slots.some((s) => s?.logged)) return true;
  if (!nutrition) return false;
  const cals = Number(nutrition.calories_today) || 0;
  const p = Number(nutrition.protein_g) || 0;
  const cb = Number(nutrition.carbs_g) || 0;
  return cals > 0 || p > 0 || cb > 0;
}

/**
 * Incremental streak: +1 when qualifying today after yesterday; reset to 1 after a gap;
 * same value for planner + profile via this function + persisted LS.
 */
export function computeAndPersistDayStreak(input: {
  myDay: { breakfast: MyDaySlot | null; lunch: MyDaySlot | null; dinner: MyDaySlot | null };
  nutritionSummary: NutritionSummary | null | undefined;
  now?: Date;
}): { currentDayStreak: number; lastQualifiedYmd: string | null } {
  const now = input.now ?? new Date();
  const today = ymdLocal(now);
  const qualified = hasQualifiedNutritionToday(input.myDay, input.nutritionSummary);
  const prev = readStreakState();

  if (qualified) {
    if (!prev.lastQualifiedYmd) {
      const next = { streak: 1, lastQualifiedYmd: today };
      if (next.streak !== prev.streak || next.lastQualifiedYmd !== prev.lastQualifiedYmd) writeStreakState(next);
      return { currentDayStreak: next.streak, lastQualifiedYmd: next.lastQualifiedYmd };
    }
    if (prev.lastQualifiedYmd === today) {
      return { currentDayStreak: prev.streak, lastQualifiedYmd: prev.lastQualifiedYmd };
    }
    const gap = calendarDaysBetween(prev.lastQualifiedYmd, today);
    let nextStreak = 1;
    if (gap === 1) nextStreak = prev.streak + 1;
    else if (gap > 1) nextStreak = 1;
    const next = { streak: nextStreak, lastQualifiedYmd: today };
    if (next.streak !== prev.streak || next.lastQualifiedYmd !== prev.lastQualifiedYmd) writeStreakState(next);
    return { currentDayStreak: next.streak, lastQualifiedYmd: next.lastQualifiedYmd };
  }

  // Not qualified yet today: preserve streak if we logged yesterday; break if last success before yesterday.
  if (!prev.lastQualifiedYmd) {
    return { currentDayStreak: 0, lastQualifiedYmd: null };
  }
  const gapLastToToday = calendarDaysBetween(prev.lastQualifiedYmd, today);
  if (gapLastToToday >= 2) {
    const broken = { streak: 0, lastQualifiedYmd: null as string | null };
    if (broken.streak !== prev.streak || broken.lastQualifiedYmd !== prev.lastQualifiedYmd) {
      writeStreakState(broken);
    }
    return { currentDayStreak: 0, lastQualifiedYmd: null };
  }
  return { currentDayStreak: prev.streak, lastQualifiedYmd: prev.lastQualifiedYmd };
}

export function streakSubtitle(currentDayStreak: number, qualifiedToday: boolean): string {
  if (currentDayStreak <= 0) return qualifiedToday ? "Great start — keep logging." : "Log a meal to start your streak.";
  if (!qualifiedToday) return "Log at least one meal today to keep your streak tomorrow.";
  return "You're building a healthy routine.";
}

/** Which weekday flame cells are lit (Mon-first), first min(7, streak) on. */
export function weekFlameMask(streak: number): boolean[] {
  const lit = Math.max(0, Math.min(7, Math.floor(streak)));
  return Array.from({ length: 7 }, (_, i) => i < lit);
}

export type DashboardStreakSlice = {
  currentDayStreak: number;
  streakTitle: string;
  streakSubtitleText: string;
  weekFlameOn: boolean[];
};

/**
 * Streak UI used for the first SSR + first client paint only.
 * Does not read/write `localStorage` so markup matches between server and browser (avoids hydration mismatch).
 * After mount, replace with {@link buildDashboardStreakSliceFromPersistence}.
 */
export function buildStableStreakBeforeHydration(
  myDay: { breakfast: MyDaySlot | null; lunch: MyDaySlot | null; dinner: MyDaySlot | null },
  nutritionSummary: NutritionSummary | null | undefined,
): DashboardStreakSlice {
  const qualified = hasQualifiedNutritionToday(myDay, nutritionSummary);
  return {
    currentDayStreak: 0,
    streakTitle: "0 Day Streak",
    streakSubtitleText: streakSubtitle(0, qualified),
    weekFlameOn: weekFlameMask(0),
  };
}

/** Full streak slice using persisted streak + today’s logs (browser only — call after mount). */
export function buildDashboardStreakSliceFromPersistence(
  myDay: { breakfast: MyDaySlot | null; lunch: MyDaySlot | null; dinner: MyDaySlot | null },
  nutritionSummary: NutritionSummary | null | undefined,
): DashboardStreakSlice {
  const { currentDayStreak } = computeAndPersistDayStreak({ myDay, nutritionSummary });
  const qualifiedToday = hasQualifiedNutritionToday(myDay, nutritionSummary);
  return {
    currentDayStreak,
    streakTitle: `${currentDayStreak} Day Streak`,
    streakSubtitleText: streakSubtitle(currentDayStreak, qualifiedToday),
    weekFlameOn: weekFlameMask(currentDayStreak),
  };
}
