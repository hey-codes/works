"use client";

import { setTheme, useTheme } from "@/lib/theme";
import styles from "./atlas.module.css";
import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggle() {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} theme`;
  return (
    <button type="button" onClick={() => setTheme(next)} aria-label={label} title={label} className={styles.iconButton} data-needs-js="">
      <span className={styles.sun}>
        <SunIcon />
      </span>
      <span className={styles.moon}>
        <MoonIcon />
      </span>
    </button>
  );
}
