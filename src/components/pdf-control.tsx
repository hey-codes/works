"use client";

import { useEffect, useId, useRef, useState } from "react";
import { RESUME_DATA } from "@/data/resume-data";
import styles from "./atlas.module.css";

/**
 * Whether the work-in-progress note shows while `pdf` is null. Off: there is
 * no PDF control at all until the PDF exists (Cody, 2026-10-15).
 */
const SHOW_PENDING = false;

/**
 * The resume PDF: a download link once `pdf` is set, until then a button that
 * only shows a work-in-progress note. Hover and keyboard focus show the note
 * in CSS; on touch a tap toggles it, and a tap elsewhere or Escape hides it.
 * `header` anchors the note to the nav's right edge so it stays on screen;
 * the slim bar's control is already last in its row.
 */
export function PdfControl({ tabIndex, header = false }: { tabIndex?: number; header?: boolean }) {
  const tipId = useId();
  const [open, setOpen] = useState(false);
  /** Escape hides a note that hover or focus is showing, until the pointer or focus leaves. */
  const [dismissed, setDismissed] = useState(false);

  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Nothing to dismiss once the PDF is a plain link, or while there is no control.
    if (RESUME_DATA.pdf || !SHOW_PENDING) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      // Only a note that this control's hover or focus is showing; an Escape
      // that closes something else on the page must not silence it.
      if (wrapRef.current?.matches(":hover, :focus-within")) setDismissed(true);
    };
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  if (RESUME_DATA.pdf) {
    return (
      <a href={RESUME_DATA.pdf} tabIndex={tabIndex} className={header ? `${styles.pdf} ${styles.pdfHeader}` : styles.pdf}>
        PDF ↓
      </a>
    );
  }

  if (!SHOW_PENDING) return null;

  return (
    <span
      className={header ? styles.pdfWrapStatic : styles.pdfWrap}
      ref={wrapRef}
      data-open={open}
      data-needs-js=""
      data-dismissed={dismissed}
      onPointerEnter={() => setDismissed(false)}
      onFocus={() => setDismissed(false)}
      onPointerLeave={() => setDismissed(false)}
      onBlur={() => setDismissed(false)}
    >
      <button
        type="button"
        tabIndex={tabIndex}
        aria-describedby={tipId}
        className={`${styles.pdf} ${styles.pdfButton}${header ? ` ${styles.pdfHeader}` : ""}`}
        onClick={() => {
          // Hover and focus already show the note; only touch needs the toggle.
          if (window.matchMedia("(hover: none)").matches) setOpen((o) => !o);
        }}
      >
        PDF ↓
      </button>
      <span id={tipId} role="tooltip" className={styles.pdfTip}>
        {RESUME_DATA.pdfPending}
      </span>
    </span>
  );
}
