import styles from "./atlas.module.css";
import { SectionDash } from "./section-dash";

/** `aside` ends the eyebrow's line, at its right (05 Stack's hover hint). */
export function SectionHead({ eyebrow, title, aside }: { eyebrow: string; title: string; aside?: React.ReactNode }) {
  return (
    <>
      <div className={styles.eyebrow}>
        <SectionDash />
        <span>{eyebrow}</span>
        {aside}
      </div>
      <h2 className={styles.h2}>{title}</h2>
      <div className={styles.rule} />
    </>
  );
}
