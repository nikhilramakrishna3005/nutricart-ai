import type { UserProfileState } from "@/lib/userProfileModel";

const STORAGE_KEY = "nutricart-user-profile-v1";

export function readStoredUserProfile(): Partial<UserProfileState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Partial<UserProfileState>;
  } catch {
    return null;
  }
}

export function writeStoredUserProfile(profile: UserProfileState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* quota / private mode */
  }
}
