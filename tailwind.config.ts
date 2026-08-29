import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        code: {
          blue: "#1d4ed8",
          babyblue: "#0284c7",
          red: "#dc2626",
          black: "#18181b",
          white: "#f8fafc",
          orange: "#ea580c",
          yellow: "#eab308",
          green: "#16a34a",
          purple: "#7c3aed",
        }
      },
      keyframes: {
        flashRed: {
          "0%, 100%": { backgroundColor: "#ef4444" },
          "50%": { backgroundColor: "#7f1d1d" },
        },
        flashBlue: {
          "0%, 100%": { backgroundColor: "#2563eb" },
          "50%": { backgroundColor: "#1e3a8a" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.02)" },
        }
      },
      animation: {
        "flash-red": "flashRed 0.8s infinite",
        "flash-blue": "flashBlue 0.8s infinite",
        "pulse-glow": "pulseGlow 1.2s infinite ease-in-out",
      }
    },
  },
  plugins: [],
};
export default config;
