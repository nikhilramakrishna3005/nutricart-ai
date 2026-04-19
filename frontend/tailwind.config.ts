import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        "label-caps": "0.08em",
        "section-caps": "0.2em",
        "tight-head": "-0.025em",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        faFlameShell: {
          "0%, 100%": { transform: "scaleY(1) rotate(-1.2deg) translateX(0)" },
          "20%": { transform: "scaleY(1.05) rotate(1deg) translateX(1.5px)" },
          "40%": { transform: "scaleY(0.96) rotate(-0.8deg) translateX(-1.5px)" },
          "60%": { transform: "scaleY(1.04) rotate(1.1deg) translateX(1px)" },
          "80%": { transform: "scaleY(0.98) rotate(-0.6deg) translateX(-0.5px)" },
        },
        faFlameOuterPulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.03)" },
        },
        faPathHot: {
          "0%, 100%": { opacity: "0.86" },
          "33%": { opacity: "0.98" },
          "66%": { opacity: "0.8" },
        },
        faFlameMidShift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(0.8px, -2.5px)" },
        },
        faFlameInnerWobble: {
          "0%, 100%": { transform: "rotate(-0.9deg)" },
          "50%": { transform: "rotate(1deg)" },
        },
        faFlameCorePop: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.88" },
          "45%": { transform: "scale(1.05)", opacity: "0.98" },
          "75%": { transform: "scale(0.97)", opacity: "0.85" },
        },
        faGlowStrong: {
          "0%, 100%": { opacity: "0.42", transform: "scale(1)" },
          "50%": { opacity: "0.72", transform: "scale(1.08)" },
        },
        faSparkRiseStrong: {
          "0%": { opacity: "0.45", transform: "translateY(0)" },
          "50%": { opacity: "0.12" },
          "100%": { opacity: "0", transform: "translateY(-40px)" },
        },
      },
      animation: {
        "fa-flame-shell": "faFlameShell 2.6s ease-in-out infinite",
        "fa-flame-outer-pulse": "faFlameOuterPulse 2.2s ease-in-out infinite",
        "fa-path-hot": "faPathHot 1.6s ease-in-out infinite",
        "fa-flame-mid-shift": "faFlameMidShift 2.45s ease-in-out infinite",
        "fa-flame-inner-wobble": "faFlameInnerWobble 2.05s ease-in-out infinite",
        "fa-flame-core-pop": "faFlameCorePop 1.9s ease-in-out infinite",
        "fa-glow-strong": "faGlowStrong 2.75s ease-in-out infinite",
        "fa-spark-rise-strong": "faSparkRiseStrong 2.65s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
