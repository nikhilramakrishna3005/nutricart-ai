"use client";

import type { FormFieldDef, FormPrimitive } from "@/data/settingsFormSchema";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const inputClass =
  "border-[#2A3A50] bg-[#0D1117] text-[#EEF2F7] placeholder:text-[#5E7590] focus-visible:ring-[#38BDF8]/40";

const selectClass =
  "flex h-10 w-full rounded-md border border-[#2A3A50] bg-[#0D1117] px-3 py-2 text-sm text-[#EEF2F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/40";

const textareaClass =
  "min-h-[88px] w-full resize-y rounded-md border border-[#2A3A50] bg-[#0D1117] px-3 py-2 text-sm text-[#EEF2F7] placeholder:text-[#5E7590] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/40";

export interface SettingsFormRendererProps {
  rowId: string;
  fields: FormFieldDef[];
  draft: Record<string, FormPrimitive>;
  onChange: (fieldId: string, value: FormPrimitive) => void;
}

export function SettingsFormRenderer({ rowId, fields, draft, onChange }: SettingsFormRendererProps) {
  if (!fields.length) return null;

  return (
    <div className="mt-5 space-y-4">
      {fields.map((field) => {
        const id = `settings-field-${rowId}-${field.id}`;
        const value = draft[field.id];

        if (field.type === "textarea") {
          return (
            <div key={field.id} className="grid gap-2">
              <Label htmlFor={id} className="text-[#5E7590]">
                {field.label}
              </Label>
              <textarea
                id={id}
                className={textareaClass}
                placeholder={field.placeholder}
                value={typeof value === "string" ? value : ""}
                onChange={(e) => onChange(field.id, e.target.value)}
              />
            </div>
          );
        }

        if (field.type === "select" && field.options?.length) {
          return (
            <div key={field.id} className="grid gap-2">
              <Label htmlFor={id} className="text-[#5E7590]">
                {field.label}
              </Label>
              <select
                id={id}
                className={selectClass}
                value={typeof value === "string" ? value : String(field.options[0]?.value ?? "")}
                onChange={(e) => onChange(field.id, e.target.value)}
              >
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (field.type === "number") {
          const num = typeof value === "number" && Number.isFinite(value) ? value : 0;
          return (
            <div key={field.id} className="grid gap-2">
              <Label htmlFor={id} className="text-[#5E7590]">
                {field.label}
              </Label>
              <Input
                id={id}
                type="number"
                className={inputClass}
                placeholder={field.placeholder}
                value={Number.isFinite(num) ? num : 0}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange(field.id, v === "" ? 0 : Number(v));
                }}
              />
            </div>
          );
        }

        if (field.type === "toggle") {
          const on = Boolean(value);
          return (
            <div
              key={field.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#2A3A50] bg-[#0D1117] px-3 py-2.5"
            >
              <Label htmlFor={id} className="cursor-pointer text-sm text-[#EEF2F7]">
                {field.label}
              </Label>
              <button
                id={id}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => onChange(field.id, !on)}
                className={cn(
                  "relative h-7 w-12 shrink-0 rounded-full border transition-colors",
                  on ? "border-[#4ADE80]/60 bg-[#1A3328]" : "border-[#2A3A50] bg-[#1A2333]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-6 rounded-full bg-[#EEF2F7] transition-transform",
                    on ? "left-5" : "left-0.5",
                  )}
                />
              </button>
            </div>
          );
        }

        return (
          <div key={field.id} className="grid gap-2">
            <Label htmlFor={id} className="text-[#5E7590]">
              {field.label}
            </Label>
            <Input
              id={id}
              type="text"
              className={inputClass}
              placeholder={field.placeholder}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(field.id, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}
