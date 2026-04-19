import { AppTopBar } from "@/components/shared/AppTopBar";

function NutrientRing({ percent }: { percent: number }) {
  const p = Math.min(100, Math.max(0, percent));
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (1 - p / 100);

  return (
    <div className="relative size-11 shrink-0 -rotate-90" aria-hidden>
      <svg width="44" height="44" viewBox="0 0 44 44" className="block">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#1e1e1e"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#4ADE80"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dash}
        />
      </svg>
      <span className="pointer-events-none absolute inset-0 flex rotate-90 items-center justify-center text-sm font-bold tabular-nums leading-none tracking-tight text-[#4ADE80]">
        {Math.round(p)}%
      </span>
    </div>
  );
}

export function ArticlesHeader() {
  return (
    <AppTopBar
      borderClassName="border-[#222222]"
      className="py-3.5 font-sans [border-bottom-width:0.5px]"
      left={
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#4ADE80] bg-[#1a3a2a] text-sm font-semibold text-[#4ADE80] sm:text-base"
          aria-hidden
        >
          AK
        </div>
      }
      center={
        <h1 className="min-w-0 truncate text-center text-2xl font-extrabold leading-tight tracking-tight-head text-[#EEF2F7] sm:text-[28px] lg:text-[30px]">
          Articles
        </h1>
      }
      right={<NutrientRing percent={65} />}
    />
  );
}
