"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { UserProfileState } from "@/lib/userProfileModel";
import {
  DEFAULT_USER_PROFILE,
  formatUsernameHandle,
  greetingFirstName,
  initialsFromFullName,
  mergeProfileSectionIntoUser,
} from "@/lib/userProfileModel";
import { readStoredUserProfile, writeStoredUserProfile } from "@/lib/userProfileStorage";
import { useNutriStore } from "@/lib/store/useNutriStore";

type UserProfileContextValue = {
  profile: UserProfileState;
  initials: string;
  handle: string;
  /** First token of full name for greetings */
  greetingName: string;
  updateProfile: (patch: Partial<UserProfileState>) => void;
  replaceProfile: (next: UserProfileState) => void;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

function mergeDefaultsWithStorage(): UserProfileState {
  const fromDisk = readStoredUserProfile();
  return { ...DEFAULT_USER_PROFILE, ...(fromDisk ?? {}) };
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const settingsProfile = useNutriStore((s) => s.settings.profile);
  const [profile, setProfile] = useState<UserProfileState>(() => mergeDefaultsWithStorage());

  useEffect(() => {
    setProfile((prev) => {
      const next = mergeProfileSectionIntoUser(settingsProfile, prev);
      writeStoredUserProfile(next);
      return next;
    });
  }, [settingsProfile]);

  const persist = useCallback((next: UserProfileState) => {
    writeStoredUserProfile(next);
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<UserProfileState>) => {
      setProfile((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const replaceProfile = useCallback(
    (next: UserProfileState) => {
      setProfile(next);
      persist(next);
    },
    [persist],
  );

  const value = useMemo<UserProfileContextValue>(() => {
    const initials = initialsFromFullName(profile.fullName);
    const handle = formatUsernameHandle(profile.username);
    const greetingName = greetingFirstName(profile.fullName);
    return {
      profile,
      initials,
      handle,
      greetingName,
      updateProfile,
      replaceProfile,
    };
  }, [profile, updateProfile, replaceProfile]);

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile(): UserProfileContextValue {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return ctx;
}

/** Safe for routes outside the provider (e.g. rare edge) — returns defaults + no-op updates. */
export function useUserProfileOptional(): UserProfileContextValue {
  const ctx = useContext(UserProfileContext);
  const noop = useCallback(() => {}, []);
  const noopReplace = useCallback((_n: UserProfileState) => {}, []);
  if (ctx) return ctx;
  const p = DEFAULT_USER_PROFILE;
  return {
    profile: p,
    initials: initialsFromFullName(p.fullName),
    handle: formatUsernameHandle(p.username),
    greetingName: greetingFirstName(p.fullName),
    updateProfile: noop,
    replaceProfile: noopReplace,
  };
}
