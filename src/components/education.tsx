import { RESUME_DATA } from "@/data/resume-data";
import styles from "./atlas.module.css";
import { OutIcon } from "./icons";
import { PenStroke } from "./pen-stroke";
import { SectionHead } from "./section-head";

export function Education() {
  return (
    <section id="s3" className={styles.section}>
      <SectionHead eyebrow="03" title="Education" />
      {RESUME_DATA.education.map((e, i) => (
        <div key={e.school} className={styles.row}>
          <span className={styles.key}>DEGREE</span>
          <div className={styles.edu}>
            {/* The name is ink, so the blue ↗ is what says it opens a site, as
                it does after a company's name. */}
            <a href={e.link} target="_blank" rel="noopener" className={styles.school}>
              {/* Hover and focus draw a blue pen line under the name (CSS). */}
              <span className={styles.schoolName}>
                <span className={styles.penHost}>
                  {e.school}
                  <PenStroke tone="blue" variant={i + 1} draw={false} />
                </span>
              </span>
              <span className={styles.outGlyph} data-noprint="">
                <OutIcon />
              </span>
            </a>
            <span className={styles.degree}>{e.degree}</span>
            <span className={styles.eduMeta}>
              {e.year} · {e.location}
            </span>
          </div>
        </div>
      ))}
      {RESUME_DATA.affiliations.map((a) => (
        <div key={a.key} className={styles.row}>
          <span className={styles.key}>{a.key}</span>
          <span className={styles.degree}>{a.text}</span>
        </div>
      ))}
    </section>
  );
}
