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
        navy: {
          DEFAULT: "#1e3a5f",
          light: "#2d4a6f",
          dark: "#152a47",
        },
        teal: {
          DEFAULT: "#4a9ba5",
          light: "#5fb5bf",
          pale: "#e8f4f5",
        },
        action: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
        },
        black: "#1a1f36",
        gray: {
          50: "#f8f9fa",
          100: "#f1f3f5",
          200: "#e9ecef",
          300: "#dee2e6",
          400: "#adb5bd",
          500: "#6c757d",
          600: "#495057",
          700: "#343a40",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": "0.625rem",
      },
      borderRadius: {
        'pill': '9999px',
      },
    },
  },
  plugins: [],
};

export default config;
