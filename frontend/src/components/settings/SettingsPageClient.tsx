"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SettingsFooterNav } from "@/components/settings/SettingsFooterNav";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { AppShell } from "@/components/shared/AppShell";
import { PageFrame } from "@/components/shared/PageFrame";
import { SETTINGS_SECTIONS } from "@/data/mockSettings";
import {
  SETTINGS_ROW_DEFAULTS,
  SETTINGS_ROW_SCHEMAS,
  pickSectionPayload,
  summarizeRow,
  type FormPrimitive,
} from "@/data/settingsFormSchema";
import { getSession, patchSettings } from "@/lib/api";
import { useNutriStore } from "@/lib/store/useNutriStore";
import { PAGE_SCROLL_BOTTOM_PAD, PAGE_SECTION_TOP } from "@/lib/app-shell";
import { PLANNER_FRAME_MAX } from "@/lib/planner-layout";
import { cn } from "@/lib/utils";

function rowLabel(rowId: string): string {
  for (const section of SETTINGS_SECTIONS) {
    const row = section.rows.find((r) => r.id === rowId);
    if (row) return row.label;
  }
  return "Settings";
}

export function SettingsPageClient() {
  const settings = useNutriStore((s) => s.settings);
  const hydrateFromPersistedSession = useNutriStore((s) => s.hydrateFromPersistedSession);

  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, FormPrimitive>>({});

  useEffect(() => {
    let cancelled = false;
    getSession()
      .then((session) => {
        if (!cancelled) hydrateFromPersistedSession(session);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hydrateFromPersistedSession]);

  const openSchema = openRowId ? SETTINGS_ROW_SCHEMAS[openRowId] ?? null : null;

  const openRow = useCallback(
    (rowId: string) => {
      const schema = SETTINGS_ROW_SCHEMAS[rowId];
      if (!schema) return;
      const defaults = SETTINGS_ROW_DEFAULTS[rowId] ?? {};
      const current = settings[rowId] ?? {};
      setDraft({ ...defaults, ...current });
      setOpenRowId(rowId);
    },
    [settings],
  );

  const closeModal = useCallback(() => {
    setOpenRowId(null);
  }, []);

  const handleDraftChange = useCallback((fieldId: string, value: FormPrimitive) => {
    setDraft((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!openRowId) return;
    const schema = SETTINGS_ROW_SCHEMAS[openRowId];
    if (schema?.infoOnly) return;
    try {
      const data = pickSectionPayload(openRowId, draft);
      const session = await patchSettings({ section: openRowId, data });
      hydrateFromPersistedSession(session);
      setOpenRowId(null);
    } catch (e) {
      console.error(e);
    }
  }, [draft, hydrateFromPersistedSession, openRowId]);

  const modalTitle = useMemo(() => (openRowId ? rowLabel(openRowId) : ""), [openRowId]);

  return (
    <AppShell variant="mobile" innerMaxClassName={PLANNER_FRAME_MAX}>
      <main className="flex min-h-0 flex-1 flex-col bg-[#0D1117] font-sans text-[#EEF2F7]">
        <PageFrame className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SettingsHeader />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className={cn(
                "min-h-0 flex-1 space-y-8 overflow-y-auto overflow-x-hidden",
                PAGE_SECTION_TOP,
                PAGE_SCROLL_BOTTOM_PAD,
              )}
            >
              {SETTINGS_SECTIONS.map((section) => (
                <SettingsSection
                  key={section.id}
                  section={section}
                  getSubtitle={(rowId) => summarizeRow(rowId, settings[rowId])}
                  onRowPress={openRow}
                />
              ))}
              <div className="pt-2">
                <button
                  type="button"
                  className="w-full rounded-full border border-[#2A3A50] bg-[#131C2A] py-3.5 text-center text-base font-semibold text-[#EEF2F7] transition-colors hover:border-[#EA580C]/50 hover:bg-[#1A2333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117] sm:py-4"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </PageFrame>
      </main>
      <SettingsFooterNav />
      <SettingsModal
        open={openRowId !== null}
        rowId={openRowId ?? ""}
        title={modalTitle}
        schema={openSchema}
        draft={draft}
        onDraftChange={handleDraftChange}
        onClose={closeModal}
        onSave={handleSave}
      />
    </AppShell>
  );
}
