import styles from "./atlas.module.css";
import { SectionDash } from "./section-dash";

export function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <div className={styles.eyebrow}>
        <SectionDash />
        <span>{eyebrow}</span>
      </div>
      <h2 className={styles.h2}>{title}</h2>
      <div className={styles.rule} />
    </>
  );
}
