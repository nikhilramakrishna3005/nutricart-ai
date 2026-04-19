import type { SettingsSectionData } from "@/data/mockSettings";

import { SettingsRow } from "@/components/settings/SettingsRow";

export function SettingsSection({
  section,
  getSubtitle,
  onRowPress,
}: {
  section: SettingsSectionData;
  getSubtitle: (rowId: string) => string | undefined;
  onRowPress: (rowId: string) => void;
}) {
  return (
    <section className="space-y-2" aria-labelledby={`settings-section-${section.id}`}>
      <h2
        id={`settings-section-${section.id}`}
        className="px-1 text-[11px] font-bold uppercase tracking-section-caps text-[#5E7590]"
      >
        {section.title}
      </h2>
      <div className="flex flex-col gap-2">
        {section.rows.map((row) => (
          <SettingsRow
            key={row.id}
            icon={row.icon}
            label={row.label}
            subtitle={getSubtitle(row.id)}
            onPress={() => onRowPress(row.id)}
          />
        ))}
      </div>
    </section>
  );
}
