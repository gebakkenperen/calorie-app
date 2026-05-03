"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = (window.localStorage.getItem(STORAGE_KEY) as Theme | null) ?? null;
    const initial: Theme =
      saved === "light" || saved === "dark"
        ? saved
        : window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
          ? "dark"
          : "light";

    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Thema wisselen"
      className={`relative inline-flex h-[28px] w-[56px] items-center rounded-full p-[2px] transition-colors ${
        isDark ? "bg-[#a78bfa]" : "bg-[#6366f1]"
      }`}
    >
      <span
        className="absolute left-[8px] text-[14px] leading-none transition-opacity"
        style={{ opacity: isDark ? 1 : 0.35 }}
        aria-hidden="true"
      >
        🌙
      </span>
      <span
        className="absolute right-[8px] text-[14px] leading-none transition-opacity"
        style={{ opacity: isDark ? 0.35 : 1 }}
        aria-hidden="true"
      >
        ☀️
      </span>

      <span
        className="h-[24px] w-[24px] rounded-full bg-white transition-transform"
        style={{
          transform: `translateX(${isDark ? "0px" : "28px"})`,
          transition: "transform 300ms ease",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)"
        }}
        aria-hidden="true"
      />
    </button>
  );
}

