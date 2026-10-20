"use client";

import { useEffect } from "react";
import { getBrowserStorage } from "@/lib/browser-storage";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/**
 * The active theme is set on <html data-theme> by the inline script in the
 * layout before hydration. This button only flips that attribute, and the
 * icon/label switch in CSS off the same attribute — so the server HTML and
 * the client agree and there's no wrong-icon flash after a refresh.
 */
export function ThemeToggle() {
  useEffect(() => {
    // Another tab toggled the theme — follow it.
    function handleStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY && (event.newValue === "dark" || event.newValue === "light")) {
        applyTheme(event.newValue);
      }
    }

    // No manual choice yet: keep following the OS when it switches (e.g. auto dark mode at night).
    const systemLight = window.matchMedia("(prefers-color-scheme: light)");
    function handleSystemChange(event: MediaQueryListEvent) {
      let saved: string | null = null;
      try {
        saved = getBrowserStorage()?.getItem(THEME_STORAGE_KEY) ?? null;
      } catch {
        saved = null;
      }
      if (saved !== "dark" && saved !== "light") applyTheme(event.matches ? "light" : "dark");
    }

    window.addEventListener("storage", handleStorage);
    systemLight.addEventListener("change", handleSystemChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      systemLight.removeEventListener("change", handleSystemChange);
    };
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try {
      getBrowserStorage()?.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Storage blocked: the theme still switches for this page view.
    }
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle theme">
      <span aria-hidden="true">
        <span className="theme-when-light">☀</span>
        <span className="theme-when-dark">☾</span>
      </span>
      <strong>
        <span className="theme-when-light">Light</span>
        <span className="theme-when-dark">Dark</span>
      </strong>
    </button>
  );
}
