import { RESUME_DATA } from "@/data/resume-data";
import styles from "./atlas.module.css";
import { SectionHead } from "./section-head";

export function Capabilities() {
  const { skills } = RESUME_DATA;
  return (
    <section id="s4" className={styles.section}>
      <SectionHead eyebrow="04" title="Capabilities" />
      {skills.map((s) => (
        <div key={s.key} className={styles.row}>
          <span className={styles.key}>{s.key}</span>
          <div className={styles.skill}>
            <b className={styles.skillCategory}>{s.category}</b>
            <div className={styles.chips}>
              {s.items.map((x) => (
                <span key={x} className={styles.chip}>
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
