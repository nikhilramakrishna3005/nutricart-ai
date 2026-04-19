import type { ChatResultSummaryView } from "@/components/chat/chatResultSummary";
import { cn } from "@/lib/utils";

interface ResultSummaryPanelProps {
  view: ChatResultSummaryView;
  /** Shown in the Explanation card — not duplicated in the chat bubble. */
  explanation?: string | null;
  className?: string;
}

function truncateExplanation(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

const cardClass =
  "min-w-0 flex-1 rounded-xl border border-[#2A3A50] bg-[#131C2A] px-3 py-2.5 shadow-sm sm:px-3.5 sm:py-3";

/**
 * Compact workspace snapshot: Latest Action + optional Explanation, aligned to chat width.
 */
export function ResultSummaryPanel({ view, explanation, className }: ResultSummaryPanelProps) {
  const expl = explanation?.trim();
  const actionId = "result-latest-action";
  const explId = "result-explanation";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3",
        className,
      )}
    >
      <section className={cardClass} aria-labelledby={actionId}>
        <h2
          id={actionId}
          className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5E7590]"
        >
          Latest Action
        </h2>

        <p className="mt-1 text-[11px] font-semibold leading-none text-[#7D92A8]">{view.intentLine}</p>

        <p className="mt-1.5 text-sm font-semibold leading-snug text-[#EEF2F7]">{view.headline}</p>

        {view.showCounts ? (
          <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#1F2A3D] pt-2 text-[11px] text-[#5E7590]">
            <div className="flex items-baseline gap-1.5">
              <dt className="font-medium text-[#7D92A8]">Stores</dt>
              <dd className="tabular-nums font-semibold text-[#EEF2F7]">{view.storeCount ?? 0}</dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="font-medium text-[#7D92A8]">Products</dt>
              <dd className="tabular-nums font-semibold text-[#EEF2F7]">{view.productCount ?? 0}</dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="font-medium text-[#7D92A8]">Meals</dt>
              <dd className="tabular-nums font-semibold text-[#EEF2F7]">{view.mealCount ?? 0}</dd>
            </div>
          </dl>
        ) : view.variant === "action" && view.progressLine ? (
          <p className="mt-2 border-t border-[#1F2A3D] pt-2 text-[11px] leading-snug text-[#9DB0C4]">
            {view.progressLine}
          </p>
        ) : view.variant === "idle" ? null : null}
      </section>

      {expl ? (
        <aside className={cn(cardClass, "bg-[#101820]")} aria-labelledby={explId}>
          <h3
            id={explId}
            className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5E7590]"
          >
            Explanation
          </h3>
          <p className="mt-1.5 line-clamp-4 text-[12px] leading-relaxed text-[#9DB0C4]">
            {truncateExplanation(expl, 320)}
          </p>
        </aside>
      ) : null}
    </div>
  );
}
