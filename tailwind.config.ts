import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0f1117",
        surface: "#1a1d27",
        accent: "#6ee7b7",
        danger: "#f87171",
        text: "#f1f5f9",
        foreground: "#f1f5f9",
        muted: "#94a3b8",
        border: "rgba(255,255,255,0.06)",
        amber: "#fbbf24"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.35)"
      }
    }
  },
  plugins: []
} satisfies Config;

