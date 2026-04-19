"use client";

import { useCallback, useEffect, useState } from "react";

import { pickSectionPayload, type FormPrimitive } from "@/data/settingsFormSchema";
import { useUserProfile } from "@/context/UserProfileContext";
import { getSession, patchSettings } from "@/lib/api";
import { useNutriStore } from "@/lib/store/useNutriStore";
import { cn } from "@/lib/utils";

export interface ProfileEditSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileEditSheet({ open, onClose }: ProfileEditSheetProps) {
  const { profile, updateProfile } = useUserProfile();
  const hydrateFromPersistedSession = useNutriStore((s) => s.hydrateFromPersistedSession);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    fullName: profile.fullName,
    username: profile.username,
    age: String(profile.age),
    location: profile.location,
    email: profile.email,
    memberSince: profile.memberSince,
  });

  useEffect(() => {
    if (!open) return;
    setDraft({
      fullName: profile.fullName,
      username: profile.username,
      age: String(profile.age),
      location: profile.location,
      email: profile.email,
      memberSince: profile.memberSince,
    });
    setError(null);
  }, [open, profile]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const ageParsed = Number.parseInt(String(draft.age), 10);
      const age =
        Number.isFinite(ageParsed) && ageParsed > 0 ? ageParsed : profile.age;
      const payload: Record<string, FormPrimitive> = {
        fullName: draft.fullName.trim(),
        username: draft.username.trim().replace(/^@/, ""),
        age,
        location: draft.location.trim(),
        email: draft.email.trim(),
      };
      const data = pickSectionPayload("profile", payload);
      const session = await patchSettings({ section: "profile", data });
      hydrateFromPersistedSession(session);
      updateProfile({
        memberSince: draft.memberSince.trim() || profile.memberSince,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      try {
        const session = await getSession();
        hydrateFromPersistedSession(session);
      } catch {
        /* ignore */
      }
    } finally {
      setSaving(false);
    }
  }, [draft, hydrateFromPersistedSession, onClose, profile.memberSince, updateProfile]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-edit-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-[101] flex max-h-[min(92vh,640px)] w-full max-w-md flex-col rounded-t-2xl border border-[#2A3A50] bg-[#131C2A] shadow-xl sm:rounded-2xl",
        )}
      >
        <div className="border-b border-[#1F2A3D] px-4 py-3 sm:px-5">
          <h2 id="profile-edit-title" className="text-base font-bold text-[#EEF2F7]">
            Edit profile
          </h2>
          <p className="mt-0.5 text-xs text-[#5E7590]">Updates sync across the app and your settings.</p>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          <label className="block text-xs font-semibold text-[#9DB0C4]">
            Full name
            <input
              className="mt-1 w-full rounded-lg border border-[#2A3A50] bg-[#0D1117] px-3 py-2 text-sm text-[#EEF2F7] outline-none focus:border-[#4ADE80]/50"
              value={draft.fullName}
              onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-[#9DB0C4]">
            Username (without @)
            <input
              className="mt-1 w-full rounded-lg border border-[#2A3A50] bg-[#0D1117] px-3 py-2 text-sm text-[#EEF2F7] outline-none focus:border-[#4ADE80]/50"
              value={draft.username}
              onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-[#9DB0C4]">
            Age
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-[#2A3A50] bg-[#0D1117] px-3 py-2 text-sm text-[#EEF2F7] outline-none focus:border-[#4ADE80]/50"
              value={draft.age}
              onChange={(e) => setDraft((d) => ({ ...d, age: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-[#9DB0C4]">
            Location
            <input
              className="mt-1 w-full rounded-lg border border-[#2A3A50] bg-[#0D1117] px-3 py-2 text-sm text-[#EEF2F7] outline-none focus:border-[#4ADE80]/50"
              value={draft.location}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-[#9DB0C4]">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-[#2A3A50] bg-[#0D1117] px-3 py-2 text-sm text-[#EEF2F7] outline-none focus:border-[#4ADE80]/50"
              value={draft.email}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-[#9DB0C4]">
            Member since (display only)
            <input
              className="mt-1 w-full rounded-lg border border-[#2A3A50] bg-[#0D1117] px-3 py-2 text-sm text-[#EEF2F7] outline-none focus:border-[#4ADE80]/50"
              value={draft.memberSince}
              onChange={(e) => setDraft((d) => ({ ...d, memberSince: e.target.value }))}
            />
          </label>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
        <div className="flex gap-2 border-t border-[#1F2A3D] px-4 py-3 sm:px-5">
          <button
            type="button"
            className="flex-1 rounded-xl border border-[#2A3A50] py-2.5 text-sm font-semibold text-[#9DB0C4] hover:bg-[#1A2333]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            className="flex-1 rounded-xl bg-[#4ADE80]/90 py-2.5 text-sm font-semibold text-[#0D1117] hover:bg-[#4ADE80] disabled:opacity-50"
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
