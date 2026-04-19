"use client";

import { useEffect, useId } from "react";

import { SettingsFormRenderer } from "@/components/settings/SettingsFormRenderer";
import { Button } from "@/components/ui/button";
import type { FormPrimitive, RowFormSchema } from "@/data/settingsFormSchema";
import { cn } from "@/lib/utils";

export interface SettingsModalProps {
  open: boolean;
  rowId: string;
  title: string;
  schema: RowFormSchema | null;
  draft: Record<string, FormPrimitive>;
  onDraftChange: (fieldId: string, value: FormPrimitive) => void;
  onClose: () => void;
  onSave: () => void;
}

export function SettingsModal({
  open,
  rowId,
  title,
  schema,
  draft,
  onDraftChange,
  onClose,
  onSave,
}: SettingsModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !schema) return null;

  const infoOnly = Boolean(schema.infoOnly);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Close settings editor"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 max-h-[min(90vh,640px)] w-full max-w-md overflow-y-auto rounded-2xl border border-[#2A3A50] bg-[#131C2A] p-4 shadow-xl sm:p-5",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold tracking-tight text-[#EEF2F7]">
              {title}
            </h2>
            <p className="mt-1 text-xs leading-snug text-[#5E7590]">
              {infoOnly ? "Support information (read-only)." : "Edit your preference and tap Save to apply."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-[#2A3A50] bg-[#1A2333] px-2.5 py-1 text-xs font-semibold text-[#EEF2F7] transition-colors hover:bg-[#232d42]"
          >
            Close
          </button>
        </div>

        {infoOnly ? (
          <div className="mt-5 space-y-3">
            {(schema.infoLines ?? []).map((line, i) => (
              <div key={i} className="rounded-lg border border-[#2A3A50] bg-[#0D1117] px-3 py-2.5">
                {line.label ? (
                  <p className="text-[11px] font-bold uppercase tracking-section-caps text-[#5E7590]">{line.label}</p>
                ) : null}
                <p className={cn("text-sm leading-snug text-[#EEF2F7]", line.label ? "mt-1" : "")}>{line.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <SettingsFormRenderer rowId={rowId} fields={schema.fields} draft={draft} onChange={onDraftChange} />
        )}

        {infoOnly ? (
          <div className="mt-6">
            <Button type="button" className="w-full bg-[#38BDF8] text-[#0D1117] hover:bg-[#7DD3FC]" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="border-[#2A3A50] bg-transparent" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" className="bg-[#38BDF8] text-[#0D1117] hover:bg-[#7DD3FC]" onClick={onSave}>
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
