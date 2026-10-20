export type Theme = "light" | "dark";

/** Same key ThemeToggle has always used — existing visitors keep their choice. */
export const THEME_STORAGE_KEY = "aisolution-theme";

/**
 * Runs inline in <head> before first paint (app/[locale]/layout.tsx), so a
 * dark-mode reader never sees a flash of the light theme on refresh.
 * A manual choice (saved by ThemeToggle) wins; otherwise follow the OS
 * setting, as REDESIGN_BRIEF.md asks. Dark is the fallback when neither is known.
 */
export const themeInitScript = `(function(){var t="dark";try{var s=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(s==="light"||s==="dark"){t=s;}else if(window.matchMedia("(prefers-color-scheme: light)").matches){t="light";}}catch(e){}document.documentElement.dataset.theme=t;})();`;
