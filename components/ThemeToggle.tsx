"use client";

import { useEffect, useState } from "react";

function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const storage = safeStorage();
      const saved = storage?.getItem("aisolution-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const nextTheme = saved === "dark" || (!saved && prefersDark) ? "dark" : "light";
      document.documentElement.dataset.theme = nextTheme;
      setTheme(nextTheme);
    } catch {
      const nextTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.dataset.theme = nextTheme;
      setTheme(nextTheme);
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    safeStorage()?.setItem("aisolution-theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle theme">
      <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
      <strong>{theme === "dark" ? "Dark" : "Light"}</strong>
    </button>
  );
}
