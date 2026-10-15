"use client";

import { useEffect, useRef, useState } from "react";
import { RESUME_DATA } from "@/data/resume-data";
import { bareUrl, SECTION_NAMES } from "@/lib/format";
import { READ_LINE_MAX, READ_LINE_RATIO, scrollToElement } from "@/lib/use-media-query";
import styles from "./atlas.module.css";
import { PdfControl } from "./pdf-control";

const section = (k: number) => document.getElementById(`s${k + 1}`);

interface Scroll {
  slim: boolean;
  /** Index of the section being read, or -1 above the first. */
  act: number;
  /** Per-section progress, 0 to 1 in 2% steps. */
  prog: readonly number[];
}

/** Reads the bar's state at a scroll position; defaults to where the page is now. */
function measure(scrollY = window.scrollY): Scroll | null {
  const shift = scrollY - window.scrollY;
  const rects = SECTION_NAMES.map((_, k) => section(k)?.getBoundingClientRect());
  if (rects.some((r) => !r)) return null;
  const last = rects.length - 1;
  // Capped so a short section is not skipped on a tall viewport.
  const line = Math.min(window.innerHeight * READ_LINE_RATIO, READ_LINE_MAX);
  const atEnd = window.innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
  let act = -1;
  rects.forEach((r, k) => {
    if (r && r.top - shift < line) act = k;
  });
  if (atEnd) act = last;
  const prog = rects.map((r, k) => {
    if (k < act) return 1;
    if (k > act || !r) return 0;
    return Math.round(Math.min(1, Math.max(0, (line - (r.top - shift)) / Math.max(1, r.height))) * 50) / 50;
  });
  if (atEnd) prog[last] = 1;
  return { slim: scrollY > 160, act, prog };
}

export function SlimBar() {
  const [scroll, setScroll] = useState<Scroll>({ slim: false, act: -1, prog: [0, 0, 0, 0] });
  /** A jump is in flight: the bar already shows the destination and eases to it. */
  const [jumping, setJumping] = useState(false);
  const jump = useRef<{ release: () => void } | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (jump.current) return;
      const next = measure();
      if (!next) return;
      setScroll((s) =>
        s.slim === next.slim && s.act === next.act && s.prog.every((p, k) => p === next.prog[k]) ? s : next,
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      jump.current?.release();
    };
  }, []);

  const jumpTo = (k: number) => {
    const el = section(k);
    if (!el) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const target = Math.min(scrollToElement(el), max);
    history.replaceState(null, "", `#s${k + 1}`);

    // Show the destination now and hold it until the scroll lands, so the
    // sections passed on the way do not light up.
    const there = measure(target);
    if (there) setScroll({ ...there, act: k });
    jump.current?.release();
    const release = () => {
      window.removeEventListener("scrollend", release);
      clearTimeout(timer);
      if (jump.current?.release !== release) return;
      jump.current = null;
      setJumping(false);
      const now = measure();
      if (now) setScroll(now);
    };
    // scrollend is missing in older Safari, and never fires when the page is already there.
    const timer = setTimeout(release, 1200);
    window.addEventListener("scrollend", release);
    jump.current = { release };
    setJumping(true);
  };

  return (
    <div className={styles.slim} data-visible={scroll.slim} data-noprint="">
      <div className={styles.slimInner}>
        <span className={styles.slimWordmark}>
          {bareUrl(RESUME_DATA.personalWebsiteUrl)}
          <i className={styles.cursor} />
        </span>
        <nav aria-label="Sections" className={styles.slimNav} data-jumping={jumping}>
          {SECTION_NAMES.map((name, k) => {
            const num = `0${k + 1}`;
            return (
              <a
                key={name}
                href={`#s${k + 1}`}
                tabIndex={scroll.slim ? 0 : -1}
                onClick={(e) => {
                  e.preventDefault();
                  jumpTo(k);
                }}
                aria-current={scroll.act === k ? "true" : undefined}
                aria-label={`${num} ${name}`}
                className={styles.seg}
              >
                <span className={styles.segLabel}>
                  {num}
                  <span className={styles.segName}> {name}</span>
                </span>
                <i className={styles.segTrack}>
                  <s className={styles.segFill} style={{ "--progress": scroll.prog[k] } as React.CSSProperties} />
                </i>
                <span aria-hidden="true" className={styles.segTip}>
                  {num} {name}
                </span>
              </a>
            );
          })}
        </nav>
        <PdfControl tabIndex={scroll.slim ? 0 : -1} />
      </div>
    </div>
  );
}
