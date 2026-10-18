import { useCallback, useState } from "react";

export type Theme = "light" | "dark";

const KEY = "pockity-theme";

export function getTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark");
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* private mode */
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getTheme);
  const toggle = useCallback(() => {
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }, []);
  return { theme, toggle };
}
