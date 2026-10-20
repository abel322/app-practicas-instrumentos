import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#09090b", // zinc-950
        surface: "#121217",
        "surface-border": "rgba(255, 255, 255, 0.08)",
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          glow: "#00f0ff",
        },
        fuchsia: {
          400: "#e879f9",
          500: "#d946ef",
        },
      },
      boxShadow: {
        "glow-cyan": "0 0 20px -2px rgba(6, 182, 212, 0.45)",
        "glow-cyan-lg": "0 0 35px 2px rgba(34, 211, 238, 0.4)",
        "glow-fuchsia": "0 0 20px -2px rgba(217, 70, 239, 0.45)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scanline 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
