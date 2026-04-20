import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#090A08",
        accent: "#41BD0E",
        link: "#515B12",
        "green-moss": "#515B12",
        "green-deep": "#41BD0E",
        "green-clear": "#41BD0E",
        "green-mint": "#DFF7CC",
        "green-pale": "#F6FFEE",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        // Minimum readable sizes - 37signals style
        "2xs": "0.8125rem",   // 13px - smallest allowed (labels only)
        "xs": "0.875rem",      // 14px - small text, captions
        "sm": "0.9375rem",     // 15px - secondary text
        "base": "1rem",        // 16px - default body
        "lg": "1.0625rem",     // 17px - slightly emphasized
        "xl": "1.25rem",       // 20px - section headers
        "2xl": "1.5rem",       // 24px - subsection headers
        "3xl": "1.75rem",      // 28px - KPI values
        "4xl": "2rem",         // 32px - page titles
        "5xl": "2.5rem",       // 40px - hero numbers
      },
    },
  },
  plugins: [],
};

export default config;
