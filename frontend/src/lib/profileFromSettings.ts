import { mockProfile, type MockProfile } from "@/data/mockProfile";
import {
  SETTINGS_ROW_DEFAULTS,
  labelForSettingsSelect,
  type SettingsRowValuesMap,
} from "@/data/settingsFormSchema";

function initialsFromName(fullName: string, fallback: string): string {
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

function formatHandle(username: string, fallback: string): string {
  const u = username.trim();
  if (!u) return fallback;
  return u.startsWith("@") ? u : `@${u}`;
}

export type ProfileDisplayModel = MockProfile & { email: string };

/** Overlay session-backed settings onto mock profile chrome (metrics, rings, etc. unchanged). */
export function mergeProfileWithSettings(settings: SettingsRowValuesMap): ProfileDisplayModel {
  const prof = { ...SETTINGS_ROW_DEFAULTS.profile, ...settings.profile };
  const dietary = { ...SETTINGS_ROW_DEFAULTS.dietary, ...settings.dietary };
  const budget = { ...SETTINGS_ROW_DEFAULTS.budget, ...settings.budget };
  const stores = { ...SETTINGS_ROW_DEFAULTS.stores, ...settings.stores };

  const fullName = String(prof.fullName ?? "").trim() || mockProfile.fullName;
  const username = String(prof.username ?? "").trim();
  const handle = formatHandle(username, String(mockProfile.handle));
  const age =
    typeof prof.age === "number" && Number.isFinite(prof.age) ? Math.round(prof.age) : mockProfile.age;
  const location = String(prof.location ?? "").trim() || mockProfile.location;
  const email = String(prof.email ?? "").trim();

  const dietLabel = labelForSettingsSelect("dietary", "dietType", dietary.dietType);
  const cuisine = String(dietary.cuisinePreference ?? "").trim();
  const dietTypeDisplay = dietLabel || mockProfile.favoritePreferences.dietType;
  const cuisinePreference = cuisine || mockProfile.favoritePreferences.cuisinePreference;

  const weekly = budget.weeklyBudget;
  const budgetGoal =
    typeof weekly === "number" && Number.isFinite(weekly)
      ? `$${Math.round(weekly)}/week`
      : mockProfile.favoritePreferences.budgetGoal;

  const prefStores = String(stores.preferredStores ?? "").trim();
  const topStore = prefStores
    ? prefStores.split(",")[0]?.trim() || mockProfile.favoritePreferences.topStore
    : mockProfile.favoritePreferences.topStore;

  const initials = initialsFromName(fullName, mockProfile.initials);

  return {
    ...mockProfile,
    initials,
    fullName,
    handle,
    age,
    location,
    email: email || String(SETTINGS_ROW_DEFAULTS.profile.email ?? ""),
    favoritePreferences: {
      dietType: dietTypeDisplay,
      cuisinePreference,
      budgetGoal,
      topStore,
    },
  };
}
