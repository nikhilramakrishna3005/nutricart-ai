interface NutrientSectionProps {
  /** Stable id for `aria-labelledby`. */
  sectionId: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Grouped block with WHOOP-style uppercase section label.
 */
export function NutrientSection({ sectionId, title, description, children }: NutrientSectionProps) {
  return (
    <section className="space-y-3" aria-labelledby={sectionId}>
      <div className="px-0.5">
        <h2 id={sectionId} className="text-[11px] font-bold uppercase tracking-section-caps text-[#5E7590]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-xs font-normal leading-relaxed text-[#5E7590]">{description}</p>
        ) : null}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}
