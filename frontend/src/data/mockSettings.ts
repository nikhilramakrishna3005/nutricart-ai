export type SettingsIconKey =
  | "user"
  | "leaf"
  | "shieldAlert"
  | "target"
  | "mapPin"
  | "chartColumn"
  | "sparkles"
  | "wallet"
  | "store"
  | "users"
  | "trophy"
  | "bell"
  | "shoppingCart"
  | "lock"
  | "mapPinned"
  | "helpCircle"
  | "info";

export interface SettingsRowItem {
  id: string;
  icon: SettingsIconKey;
  label: string;
}

export interface SettingsSectionData {
  id: string;
  title: string;
  rows: SettingsRowItem[];
}

export const SETTINGS_SECTIONS: SettingsSectionData[] = [
  {
    id: "account",
    title: "Account & profile",
    rows: [
      { id: "profile", icon: "user", label: "My Profile" },
      { id: "dietary", icon: "leaf", label: "Dietary Preferences" },
      { id: "allergies", icon: "shieldAlert", label: "Allergies & Risky Foods" },
      { id: "health-goals", icon: "target", label: "Health Goals" },
      { id: "zip", icon: "mapPin", label: "Location / ZIP Code" },
    ],
  },
  {
    id: "nutrition",
    title: "Nutrition & planning",
    rows: [
      { id: "macros", icon: "chartColumn", label: "Macro Goals" },
      { id: "micros", icon: "sparkles", label: "Micronutrient Focus" },
      { id: "budget", icon: "wallet", label: "Budget Preference" },
      { id: "stores", icon: "store", label: "Preferred Stores" },
    ],
  },
  {
    id: "community",
    title: "Community",
    rows: [
      { id: "teams", icon: "users", label: "My Teams" },
      { id: "visibility", icon: "trophy", label: "Leaderboard Visibility" },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    rows: [
      { id: "meal-reminders", icon: "bell", label: "Meal Reminders" },
      { id: "grocery-alerts", icon: "shoppingCart", label: "Grocery Alerts" },
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    rows: [
      { id: "privacy-settings", icon: "lock", label: "Privacy Settings" },
      { id: "location-perms", icon: "mapPinned", label: "Location Permissions" },
    ],
  },
  {
    id: "support",
    title: "Support",
    rows: [
      { id: "help", icon: "helpCircle", label: "Help Center" },
      { id: "about", icon: "info", label: "About NutriCart AI" },
    ],
  },
];
