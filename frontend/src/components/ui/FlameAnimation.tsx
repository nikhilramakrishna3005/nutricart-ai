"use client";

import { useId } from "react";

import { LUCIDE_FLAME_PATH, LUCIDE_FLAME_VIEWBOX } from "@/components/ui/NutriFlameShape";
import { cn } from "@/lib/utils";

/** Bottom-center pivot inside Lucide 24×24 flame (tuned for scale-from-base). */
const PX = 12;
const PY = 21.25;

function tf(scale: number) {
  return `translate(${PX},${PY}) scale(${scale}) translate(${-PX},${-PY})`;
}

/**
 * Large streak flame: same path as weekly Lucide flames, layered, hotter colors, strong motion.
 */
export function FlameAnimation({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const gOut = `nf-go-${id}`;
  const gMid = `nf-gm-${id}`;
  const gIn = `nf-gi-${id}`;
  const gCore = `nf-gc-${id}`;
  const fBloom = `nf-fb-${id}`;
  const fHot = `nf-fh-${id}`;

  return (
    <div
      className={cn(
        "relative flex h-[4rem] w-[3.35rem] shrink-0 items-center justify-center overflow-visible border-none bg-transparent shadow-none sm:h-[4.4rem] sm:w-[3.65rem]",
        className,
      )}
      aria-hidden
    >
      {/* Soft bloom — diffuse only, blends into card (no solid “plate” behind flame). */}
      <div className="pointer-events-none absolute bottom-0.5 left-1/2 -translate-x-1/2">
        <div className="h-[3rem] w-[3.25rem] rounded-full bg-[#FF4D00]/25 blur-[28px] mix-blend-screen animate-fa-glow-strong sm:h-[3.25rem] sm:w-[3.5rem] sm:blur-[32px]" />
      </div>
      <div className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2">
        <div className="h-10 w-9 rounded-full bg-[#FF6A00]/18 blur-2xl mix-blend-soft-light animate-fa-glow-strong [animation-delay:0.35s] sm:h-11 sm:w-10 sm:blur-3xl" />
      </div>

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            "pointer-events-none absolute bottom-[12%] rounded-full bg-[#FFF4D6]/80 animate-fa-spark-rise-strong",
            i === 0 && "left-[28%] size-0.5",
            i === 1 && "left-[40%] size-px [animation-delay:0.12s]",
            i === 2 && "left-[50%] size-0.5 [animation-delay:0.28s]",
            i === 3 && "left-[58%] size-px [animation-delay:0.44s]",
            i === 4 && "left-[66%] size-0.5 [animation-delay:0.58s]",
            i === 5 && "left-[36%] size-px [animation-delay:0.75s]",
          )}
        />
      ))}

      <div
        className="relative z-10 flex h-full w-full items-end justify-center pb-0.5 origin-bottom animate-fa-flame-shell"
        style={{ transformOrigin: "50% 100%" }}
      >
        <svg
          className="h-[3.3rem] w-[3.3rem] overflow-visible sm:h-[3.65rem] sm:w-[3.65rem]"
          viewBox={LUCIDE_FLAME_VIEWBOX}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gOut} x1="12" y1="22.5" x2="12" y2="4" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF2200" />
              <stop offset="0.4" stopColor="#FF4D00" />
              <stop offset="0.75" stopColor="#FF6A00" />
              <stop offset="1" stopColor="#FF8F52" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id={gMid} x1="12" y1="21" x2="13" y2="7" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF5A00" />
              <stop offset="0.45" stopColor="#FF8A1A" />
              <stop offset="0.85" stopColor="#FFC14A" />
              <stop offset="1" stopColor="#FFE7B8" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id={gIn} x1="12" y1="20" x2="12" y2="9" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFB347" />
              <stop offset="0.55" stopColor="#FFD6A5" />
              <stop offset="1" stopColor="#FFF8E8" stopOpacity="0.98" />
            </linearGradient>
            <radialGradient id={gCore} cx="50%" cy="65%" r="55%">
              <stop offset="0%" stopColor="#FFFEF5" stopOpacity="1" />
              <stop offset="0.35" stopColor="#FFF3C2" stopOpacity="0.95" />
              <stop offset="0.7" stopColor="#FFD78A" stopOpacity="0.65" />
              <stop offset="1" stopColor="#FF6A00" stopOpacity="0" />
            </radialGradient>
            <filter id={fBloom} x="-70%" y="-60%" width="240%" height="220%">
              <feGaussianBlur stdDeviation="1.35" result="a" />
              <feMerge>
                <feMergeNode in="a" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={fHot} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1.8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer — Lucide path, largest scale + secondary pulse (nested so SVG attr transform is preserved). */}
          <g transform={tf(2.88)}>
            <g
              className="animate-fa-flame-outer-pulse"
              style={{ transformOrigin: `${PX}px ${PY}px`, transformBox: "fill-box" }}
            >
              <path d={LUCIDE_FLAME_PATH} fill={`url(#${gOut})`} filter={`url(#${fBloom})`} className="animate-fa-path-hot" />
            </g>
          </g>

          {/* Mid */}
          <g transform={tf(2.12)}>
            <g
              className="animate-fa-flame-mid-shift"
              style={{ transformOrigin: `${PX}px ${PY}px`, transformBox: "fill-box" }}
            >
              <path d={LUCIDE_FLAME_PATH} fill={`url(#${gMid})`} opacity={0.96} />
            </g>
          </g>

          {/* Inner */}
          <g transform={tf(1.34)}>
            <g
              className="animate-fa-flame-inner-wobble"
              style={{ transformOrigin: `${PX}px ${PY}px`, transformBox: "fill-box" }}
            >
              <path d={LUCIDE_FLAME_PATH} fill={`url(#${gIn})`} opacity={0.98} />
            </g>
          </g>

          {/* Core — same silhouette, small + bright */}
          <g transform={tf(0.58)}>
            <g
              className="animate-fa-flame-core-pop"
              style={{ transformOrigin: `${PX}px ${PY}px`, transformBox: "fill-box" }}
            >
              <path
                d={LUCIDE_FLAME_PATH}
                fill={`url(#${gCore})`}
                filter={`url(#${fHot})`}
                className="mix-blend-screen"
                opacity={0.92}
              />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
