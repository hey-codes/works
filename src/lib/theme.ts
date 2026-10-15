"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const KEY = "atlas-theme";
const EVENT = "atlas-theme-change";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The reader's saved choice if there is one, else the system setting. */
function resolvedTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage can be blocked; the choice still holds for this visit.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener("change", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** Resolved theme. Reads "light" on the server; icons are CSS-driven so nothing flashes. */
export const useTheme = (): Theme => useSyncExternalStore(subscribe, resolvedTheme, () => "light");
