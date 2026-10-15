"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./atlas.module.css";

/**
 * A section head's red dash. It draws in, left to right, the first time it
 * scrolls into view. The server sends it drawn, and only a dash found out of
 * view once the script runs is taken back to wait for its turn, so no-JS,
 * print and a head already on screen at load all show it drawn, with no flash.
 */
export function SectionDash() {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"pending" | "drawn">();
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let first = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          // In view at load: already drawn, so nothing moves.
          if (!first) setState("drawn");
          io.disconnect();
        } else if (first) {
          setState("pending");
        }
        first = false;
      },
      // Drawn once it is well inside the window, not as it peeks over the edge.
      { threshold: 0.6, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <i ref={ref} className={styles.dash} data-dash={state} />;
}
