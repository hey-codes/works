import { RESUME_DATA } from "@/data/resume-data";
import styles from "./atlas.module.css";
import { RichText } from "./rich-text";
import { SectionHead } from "./section-head";

export function Highlights() {
  return (
    <section id="s1" className={styles.section}>
      <SectionHead eyebrow="01" title="Highlights" />
      {RESUME_DATA.careerHighlights.map((h) => (
        <div key={h.key} className={styles.row}>
          <span className={styles.key}>{h.key}</span>
          <div className={styles.hlBody}>
            <b className={styles.hlTitle}>{h.title}</b>
            <p className={styles.hlText}>
              <RichText text={h.text} links />
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
