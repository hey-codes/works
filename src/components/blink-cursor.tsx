"use client";

import { useEffect, useState } from "react";
import styles from "./atlas.module.css";

/** Header cursor: blinks until the first scroll, then holds still for good. */
export function BlinkCursor() {
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const stop = () => setBlink(false);
    window.addEventListener("scroll", stop, { passive: true, once: true });
    return () => window.removeEventListener("scroll", stop);
  }, []);
  return <i className={blink ? `${styles.cursor} ${styles.cursorBlink}` : styles.cursor} data-noprint="" />;
}
