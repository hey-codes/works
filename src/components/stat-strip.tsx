"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/use-media-query";
import type { Stat } from "@/lib/types";
import styles from "./atlas.module.css";

const DURATION = 900;

/** "2.8M+" at progress 0.5 reads "1.4M+": prefix, suffix and decimals hold. */
function figureAt(value: string, progress: number): string {
  const m = value.match(/^(\$?)([\d.]+)(.*)$/);
  if (!m) return value;
  const decimals = (m[2]?.split(".")[1] ?? "").length;
  return `${m[1]}${(Number.parseFloat(m[2] ?? "0") * progress).toFixed(decimals)}${m[3]}`;
}

/** The four figures. They count up once on load; the server renders the finals. */
export function StatStrip({ stats }: { stats: readonly Stat[] }) {
  const [progress, setProgress] = useState(1);
  const [pending, setPending] = useState(true);

  useLayoutEffect(() => {
    if (!prefersReducedMotion()) setProgress(0);
    setPending(false);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - t0) / DURATION));
      setProgress(1 - (1 - t) ** 3);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    // Chrome can print a mid-count frame; snap to the finals first.
    const snap = () => {
      cancelAnimationFrame(frame);
      setProgress(1);
    };
    window.addEventListener("beforeprint", snap);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("beforeprint", snap);
    };
  }, []);

  return (
    <div className={styles.stats}>
      <dl className={styles.statGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <dt className={styles.statLabel}>{s.label}</dt>
            <dd aria-label={s.value} className={styles.statFigure} data-pending={pending || undefined}>
              {figureAt(s.value, progress)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
