// Light/dark theme with localStorage persistence.
import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const LS_KEY = "nrb.theme";

function readInitial(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(LS_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* noop */
  }
  const prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function useTheme(): [Theme, (t: Theme) => void, () => void] {
  const [theme, setTheme] = useState<Theme>(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(LS_KEY, theme);
    } catch {
      /* noop */
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return [theme, setTheme, toggle];
}
