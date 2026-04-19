export type FormPrimitive = string | number | boolean;

export type FormFieldType = "text" | "textarea" | "number" | "select" | "toggle";

export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FormFieldDef {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  options?: FormSelectOption[];
}

export interface SettingsInfoLine {
  label?: string;
  value: string;
}

export interface RowFormSchema {
  fields: FormFieldDef[];
  /** Which field to preview under the row label (defaults to first field). */
  summaryFieldId?: string;
  /** Read-only modal: no form fields, no Save. */
  infoOnly?: boolean;
  infoLines?: SettingsInfoLine[];
}

export type SettingsRowValuesMap = Record<string, Record<string, FormPrimitive>>;

export const SETTINGS_ROW_SCHEMAS: Record<string, RowFormSchema> = {
  profile: {
    summaryFieldId: "fullName",
    fields: [
      { id: "fullName", label: "Full name", type: "text", placeholder: "Alex Morgan" },
      { id: "username", label: "Username", type: "text", placeholder: "alexm" },
      { id: "age", label: "Age", type: "number", placeholder: "28" },
      { id: "location", label: "Location", type: "text", placeholder: "San Francisco, CA" },
      { id: "email", label: "Email", type: "text", placeholder: "you@example.com" },
    ],
  },
  dietary: {
    summaryFieldId: "dietType",
    fields: [
      {
        id: "dietType",
        label: "Diet type",
        type: "select",
        options: [
          { value: "omnivore", label: "Omnivore" },
          { value: "vegetarian", label: "Vegetarian" },
          { value: "vegan", label: "Vegan" },
          { value: "pescatarian", label: "Pescatarian" },
          { value: "keto", label: "Keto" },
          { value: "mediterranean", label: "Mediterranean" },
        ],
      },
      {
        id: "mealStyle",
        label: "Meal style",
        type: "select",
        options: [
          { value: "three_meals", label: "3 meals / day" },
          { value: "small_frequent", label: "Small frequent meals" },
          { value: "two_large", label: "2 larger meals" },
          { value: "intermittent", label: "Time-restricted eating" },
        ],
      },
      {
        id: "cuisinePreference",
        label: "Cuisine preference",
        type: "text",
        placeholder: "e.g. Mediterranean, Japanese",
      },
    ],
  },
  allergies: {
    summaryFieldId: "riskyFoods",
    fields: [
      {
        id: "riskyFoods",
        label: "Risky foods",
        type: "textarea",
        placeholder: "Comma-separated, e.g. undercooked eggs, unpasteurized dairy",
      },
      {
        id: "allergies",
        label: "Allergies",
        type: "textarea",
        placeholder: "Comma-separated, e.g. peanuts, shellfish, soy",
      },
    ],
  },
  "health-goals": {
    summaryFieldId: "healthGoal",
    fields: [
      {
        id: "healthGoal",
        label: "Health goal",
        type: "select",
        options: [
          { value: "lose_weight", label: "Lose weight" },
          { value: "gain_muscle", label: "Gain muscle" },
          { value: "maintain", label: "Maintain" },
          { value: "energy", label: "More energy" },
          { value: "general", label: "General wellness" },
        ],
      },
      {
        id: "priority",
        label: "Priority",
        type: "select",
        options: [
          { value: "high", label: "High" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
        ],
      },
    ],
  },
  zip: {
    summaryFieldId: "zipCode",
    fields: [
      { id: "zipCode", label: "ZIP / postal code", type: "text", placeholder: "94107" },
      { id: "city", label: "City", type: "text", placeholder: "San Francisco" },
      { id: "shoppingRadius", label: "Shopping radius (mi)", type: "number", placeholder: "10" },
    ],
  },
  macros: {
    summaryFieldId: "proteinGoal",
    fields: [
      { id: "proteinGoal", label: "Protein goal (g/day)", type: "number", placeholder: "120" },
      { id: "carbGoal", label: "Carb goal (g/day)", type: "number", placeholder: "220" },
      { id: "fatGoal", label: "Fat goal (g/day)", type: "number", placeholder: "65" },
    ],
  },
  micros: {
    summaryFieldId: "ironFocus",
    fields: [
      { id: "ironFocus", label: "Emphasize iron", type: "toggle" },
      { id: "calciumFocus", label: "Emphasize calcium", type: "toggle" },
      { id: "vitaminDFocus", label: "Emphasize vitamin D", type: "toggle" },
      { id: "fibreFocus", label: "Emphasize fibre", type: "toggle" },
    ],
  },
  budget: {
    summaryFieldId: "weeklyBudget",
    fields: [
      { id: "weeklyBudget", label: "Weekly budget (USD)", type: "number", placeholder: "120" },
      {
        id: "budgetPriority",
        label: "Budget priority",
        type: "select",
        options: [
          { value: "savings_first", label: "Savings first" },
          { value: "balanced", label: "Balanced" },
          { value: "quality_first", label: "Quality first" },
        ],
      },
    ],
  },
  stores: {
    summaryFieldId: "preferredStores",
    fields: [
      {
        id: "preferredStores",
        label: "Preferred stores",
        type: "textarea",
        placeholder: "Comma-separated, e.g. Whole Foods, Trader Joe's",
      },
    ],
  },
  teams: {
    summaryFieldId: "selectedTeams",
    fields: [
      {
        id: "selectedTeams",
        label: "Teams",
        type: "textarea",
        placeholder: "Comma-separated team names",
      },
    ],
  },
  visibility: {
    summaryFieldId: "visibilityMode",
    fields: [
      {
        id: "visibilityMode",
        label: "Visibility",
        type: "select",
        options: [
          { value: "public", label: "Public" },
          { value: "friends", label: "Friends only" },
          { value: "private", label: "Private" },
        ],
      },
      { id: "anonymousMode", label: "Anonymous on leaderboard", type: "toggle" },
    ],
  },
  "meal-reminders": {
    summaryFieldId: "breakfastReminder",
    fields: [
      { id: "enabled", label: "Meal reminders", type: "toggle" },
      { id: "breakfastReminder", label: "Breakfast", type: "text", placeholder: "8:00 AM" },
      { id: "lunchReminder", label: "Lunch", type: "text", placeholder: "12:30 PM" },
      { id: "dinnerReminder", label: "Dinner", type: "text", placeholder: "7:00 PM" },
    ],
  },
  "grocery-alerts": {
    summaryFieldId: "enabled",
    fields: [
      { id: "enabled", label: "Grocery alerts", type: "toggle" },
      { id: "stockAlerts", label: "Low stock reminders", type: "toggle" },
      { id: "budgetAlerts", label: "Budget warnings", type: "toggle" },
    ],
  },
  "privacy-settings": {
    summaryFieldId: "shareNutrition",
    fields: [
      { id: "shareNutrition", label: "Share nutrition insights", type: "toggle" },
      { id: "shareLeaderboard", label: "Share leaderboard stats", type: "toggle" },
      { id: "anonymousProfile", label: "Anonymous profile", type: "toggle" },
    ],
  },
  "location-perms": {
    summaryFieldId: "allowLocation",
    fields: [
      { id: "allowLocation", label: "Allow device location", type: "toggle" },
      { id: "zipOnlyMode", label: "ZIP-only mode (no GPS)", type: "toggle" },
    ],
  },
  help: {
    infoOnly: true,
    fields: [],
    infoLines: [
      {
        label: "Email",
        value: "support@nutricart.ai",
      },
      {
        label: "Hours",
        value: "Monday–Friday, 9am–6pm PT",
      },
      {
        label: "Help articles",
        value: "Visit nutricart.ai/help for guides and FAQs.",
      },
    ],
  },
  about: {
    infoOnly: true,
    fields: [],
    infoLines: [
      { label: "App", value: "NutriCart AI" },
      { label: "Version", value: "0.1.0" },
      {
        label: "About",
        value: "Plan meals, track nutrition, and shop smarter. Built for the NutriCart hackathon.",
      },
    ],
  },
};

export const SETTINGS_ROW_DEFAULTS: SettingsRowValuesMap = {
  profile: {
    fullName: "Alex Morgan",
    username: "alexm",
    age: 28,
    location: "San Francisco, CA",
    email: "alex@example.com",
  },
  dietary: {
    dietType: "omnivore",
    mealStyle: "three_meals",
    cuisinePreference: "Mediterranean, Japanese",
  },
  allergies: {
    riskyFoods: "Raw sprouts, unpasteurized juice",
    allergies: "Tree nuts",
  },
  "health-goals": {
    healthGoal: "maintain",
    priority: "medium",
  },
  zip: {
    zipCode: "94107",
    city: "San Francisco",
    shoppingRadius: 10,
  },
  macros: {
    proteinGoal: 120,
    carbGoal: 220,
    fatGoal: 65,
  },
  micros: {
    ironFocus: true,
    calciumFocus: false,
    vitaminDFocus: true,
    fibreFocus: true,
  },
  budget: {
    weeklyBudget: 120,
    budgetPriority: "balanced",
  },
  stores: {
    preferredStores: "Whole Foods, Trader Joe's, Safeway",
  },
  teams: {
    selectedTeams: "NutriCart Crew, Weekend Warriors",
  },
  visibility: {
    visibilityMode: "friends",
    anonymousMode: false,
  },
  "meal-reminders": {
    enabled: true,
    breakfastReminder: "8:00 AM",
    lunchReminder: "12:30 PM",
    dinnerReminder: "7:00 PM",
  },
  "grocery-alerts": {
    enabled: true,
    stockAlerts: true,
    budgetAlerts: true,
  },
  "privacy-settings": {
    shareNutrition: true,
    shareLeaderboard: true,
    anonymousProfile: false,
  },
  "location-perms": {
    allowLocation: true,
    zipOnlyMode: false,
  },
};

export function cloneSettingsRowDefaults(): SettingsRowValuesMap {
  return JSON.parse(JSON.stringify(SETTINGS_ROW_DEFAULTS)) as SettingsRowValuesMap;
}

/** Raw `settings` object from GET /session (section id -> field map). */
export type SessionSettingsBlob = Record<string, Record<string, unknown>>;

function normalizeSectionRow(sectionId: string, disk: Record<string, unknown>): Record<string, FormPrimitive> {
  const schema = SETTINGS_ROW_SCHEMAS[sectionId];
  if (!schema?.fields?.length) return {};
  const out: Record<string, FormPrimitive> = {};

  for (const field of schema.fields) {
    if (!Object.prototype.hasOwnProperty.call(disk, field.id)) continue;
    const v = disk[field.id];

    if (field.type === "number") {
      if (typeof v === "number" && Number.isFinite(v)) {
        out[field.id] = v;
      } else if (typeof v === "string") {
        const n = Number(v);
        if (!Number.isNaN(n)) out[field.id] = n;
      }
      continue;
    }

    if (field.type === "toggle") {
      if (typeof v === "boolean") out[field.id] = v;
      else if (typeof v === "string") out[field.id] = v === "true" || v === "1";
      continue;
    }

    if (typeof v === "string") out[field.id] = v;
    else if (typeof v === "number" && Number.isFinite(v)) out[field.id] = v;
    else if (typeof v === "boolean") out[field.id] = v;
  }

  return out;
}

/** Merge server-backed settings with app defaults (used on hydrate). */
export function mergeSessionSettingsIntoDefaults(
  persisted: SessionSettingsBlob | undefined | null,
): SettingsRowValuesMap {
  const merged = cloneSettingsRowDefaults();
  if (!persisted || typeof persisted !== "object") return merged;

  for (const sectionId of Object.keys(SETTINGS_ROW_SCHEMAS)) {
    const schema = SETTINGS_ROW_SCHEMAS[sectionId];
    if (schema.infoOnly) continue;
    const raw = persisted[sectionId];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const defaults = SETTINGS_ROW_DEFAULTS[sectionId] ?? {};
    merged[sectionId] = {
      ...defaults,
      ...normalizeSectionRow(sectionId, raw as Record<string, unknown>),
    };
  }

  return merged;
}

/** Only send schema-defined fields to the API. */
export function pickSectionPayload(
  sectionId: string,
  draft: Record<string, FormPrimitive>,
): Record<string, FormPrimitive> {
  const schema = SETTINGS_ROW_SCHEMAS[sectionId];
  if (!schema?.fields?.length) return {};
  const out: Record<string, FormPrimitive> = {};
  for (const f of schema.fields) {
    if (Object.prototype.hasOwnProperty.call(draft, f.id)) {
      out[f.id] = draft[f.id]!;
    }
  }
  return out;
}

function formatPrimitive(value: FormPrimitive): string {
  if (typeof value === "boolean") return value ? "On" : "Off";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return String(value ?? "").trim();
}

function clampPreview(text: string, max = 56): string {
  const t = text.trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

function fieldById(schema: RowFormSchema, fieldId: string): FormFieldDef | undefined {
  return schema.fields.find((f) => f.id === fieldId);
}

function selectOptionLabel(schema: RowFormSchema, fieldId: string, value: FormPrimitive): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const field = fieldById(schema, fieldId);
  if (field?.type !== "select" || !field.options?.length) return value;
  return field.options.find((o) => o.value === value)?.label ?? value;
}

/** Human label for a persisted settings `<select>` (e.g. diet type on Profile). */
export function labelForSettingsSelect(sectionId: string, fieldId: string, value: FormPrimitive): string {
  const schema = SETTINGS_ROW_SCHEMAS[sectionId];
  if (!schema) return typeof value === "string" ? value : "";
  if (typeof value !== "string") return "";
  return selectOptionLabel(schema, fieldId, value) ?? value;
}

function firstCsvToken(text: string): string {
  return text.split(",")[0]?.trim() ?? "";
}

/** Muted one-line preview under each settings row (from saved store / session). */
export function summarizeRow(rowId: string, rowValues: Record<string, FormPrimitive> | undefined): string | undefined {
  const schema = SETTINGS_ROW_SCHEMAS[rowId];
  if (!schema || !rowValues) return undefined;
  if (schema.infoOnly || !schema.fields.length) return undefined;

  switch (rowId) {
    case "profile": {
      const name = String(rowValues.fullName ?? "").trim();
      const user = String(rowValues.username ?? "").trim();
      if (name && user) return clampPreview(`${name} · @${user}`);
      if (name) return clampPreview(name);
      if (user) return clampPreview(`@${user}`);
      return undefined;
    }
    case "dietary": {
      const diet = selectOptionLabel(schema, "dietType", rowValues.dietType ?? "");
      if (!diet) return undefined;
      const meal = selectOptionLabel(schema, "mealStyle", rowValues.mealStyle ?? "");
      return meal ? clampPreview(`${diet} · ${meal}`) : clampPreview(diet);
    }
    case "allergies": {
      const risky = String(rowValues.riskyFoods ?? "").trim();
      const all = String(rowValues.allergies ?? "").trim();
      if (!risky && !all) return undefined;
      if (risky && all) return clampPreview(`${risky} · ${all}`);
      return clampPreview(risky || all);
    }
    case "health-goals": {
      const goal = selectOptionLabel(schema, "healthGoal", rowValues.healthGoal ?? "");
      const pri = selectOptionLabel(schema, "priority", rowValues.priority ?? "");
      if (!goal) return undefined;
      return pri ? clampPreview(`${goal} · ${pri}`) : clampPreview(goal);
    }
    case "zip": {
      const zip = String(rowValues.zipCode ?? "").trim();
      if (!zip) return undefined;
      const city = String(rowValues.city ?? "").trim();
      const rad = rowValues.shoppingRadius;
      const radStr =
        typeof rad === "number" && Number.isFinite(rad) && rad > 0 ? `${rad} mi` : "";
      return clampPreview([zip, city, radStr].filter(Boolean).join(" · "));
    }
    case "macros": {
      const p = rowValues.proteinGoal;
      const c = rowValues.carbGoal;
      const f = rowValues.fatGoal;
      if (
        typeof p !== "number" ||
        typeof c !== "number" ||
        typeof f !== "number" ||
        !Number.isFinite(p) ||
        !Number.isFinite(c) ||
        !Number.isFinite(f)
      ) {
        return undefined;
      }
      return `${Math.round(p)}g P · ${Math.round(c)}g C · ${Math.round(f)}g F`;
    }
    case "micros": {
      const toggles: { id: string; short: string }[] = [
        { id: "ironFocus", short: "Iron" },
        { id: "calciumFocus", short: "Ca" },
        { id: "vitaminDFocus", short: "Vit D" },
        { id: "fibreFocus", short: "Fibre" },
      ];
      const on = toggles.filter((t) => rowValues[t.id] === true).map((t) => t.short);
      if (!on.length) return undefined;
      return clampPreview(on.join(", "), 48);
    }
    case "budget": {
      const w = rowValues.weeklyBudget;
      const budgetStr =
        typeof w === "number" && Number.isFinite(w) ? `$${Math.round(w)}/wk` : "";
      const pri = selectOptionLabel(schema, "budgetPriority", rowValues.budgetPriority ?? "");
      const line = [budgetStr, pri].filter(Boolean).join(" · ");
      return line ? clampPreview(line) : undefined;
    }
    case "stores": {
      const raw = String(rowValues.preferredStores ?? "").trim();
      if (!raw) return undefined;
      const top = firstCsvToken(raw);
      if (!top) return undefined;
      const more = raw.includes(",") ? " + more" : "";
      return clampPreview(`${top}${more}`, 52);
    }
    case "teams": {
      const raw = String(rowValues.selectedTeams ?? "").trim();
      if (!raw) return undefined;
      const top = firstCsvToken(raw);
      if (!top) return undefined;
      const more = raw.includes(",") ? " + more" : "";
      return clampPreview(`${top}${more}`, 52);
    }
    case "visibility": {
      const mode = selectOptionLabel(schema, "visibilityMode", rowValues.visibilityMode ?? "");
      if (!mode) return undefined;
      if (rowValues.anonymousMode === true) return clampPreview(`${mode} · Anonymous`);
      return clampPreview(mode);
    }
    case "meal-reminders":
      return rowValues.enabled === true ? "Enabled" : "Disabled";
    case "grocery-alerts":
      return rowValues.enabled === true ? "Enabled" : "Disabled";
    case "privacy-settings": {
      const shareN = rowValues.shareNutrition === true;
      const shareL = rowValues.shareLeaderboard === true;
      const anon = rowValues.anonymousProfile === true;
      if (anon && !shareN && !shareL) return "Anonymous";
      if (!shareN && !shareL) return "Private";
      const bits: string[] = [];
      if (shareN) bits.push("Nutrition");
      if (shareL) bits.push("Leaderboard");
      const core = bits.join(" · ");
      if (anon) return clampPreview(`${core} · Anonymous`);
      return clampPreview(core);
    }
    case "location-perms": {
      if (rowValues.zipOnlyMode === true) return "ZIP only";
      if (rowValues.allowLocation === true) return "Location on";
      return "Location off";
    }
    default: {
      const sid = schema.summaryFieldId ?? schema.fields[0]?.id;
      if (!sid) return undefined;
      const field = fieldById(schema, sid);
      const raw = rowValues[sid];
      if (raw === undefined || raw === "") return undefined;

      if (field?.type === "select" && field.options?.length && typeof raw === "string") {
        const text = selectOptionLabel(schema, sid, raw) ?? raw;
        return clampPreview(text, 72);
      }

      const text = formatPrimitive(raw);
      if (!text) return undefined;
      return clampPreview(text, 72);
    }
  }
}
