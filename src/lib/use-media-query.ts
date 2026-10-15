"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Tracks a media query. False on the server and during hydration. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const NARROW_QUERY = "(max-width: 959.98px)";

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A touch screen: the map's controls grow to 44px there (`pointer-coarse:`), and its fits clear them. */
export const prefersCoarsePointer = () => window.matchMedia("(pointer: coarse)").matches;

/** How long a movement takes: `ms`, or none under reduced motion. */
export const motionMs = (ms: number) => (prefersReducedMotion() ? 0 : ms);

/** The line a section or row counts as being read at: 45% down, capped for tall windows. */
export const READ_LINE_RATIO = 0.45;
export const READ_LINE_MAX = 224;

/** Scrolls so `el` sits just under the slim bar. Returns the scroll position asked for. */
export function scrollToElement(el: Element): number {
  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 64);
  window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  return top;
}
