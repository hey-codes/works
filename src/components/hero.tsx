import { RESUME_DATA } from "@/data/resume-data";
import styles from "./atlas.module.css";
import { PenStroke } from "./pen-stroke";
import { StatStrip } from "./stat-strip";

export function Hero() {
  return (
    <section className={styles.hero}>
      {/* A red pen line under the name, drawn once on load: where the page begins. */}
      <h1 className={styles.name}>
        <span className={styles.penHost}>
          {RESUME_DATA.name}
          <PenStroke tone="red" print />
        </span>
      </h1>
      <p className={styles.tagline}>{RESUME_DATA.tagline}</p>
      <div className={styles.base}>
        <i className={styles.baseDot} />
        {/* Types in once a visit, after the pen line (CSS, gated by the head
            script's data-type-in). The text is all there for screen readers
            and print; the clip only hides it from view. */}
        <span className={styles.baseText} style={{ "--chars": RESUME_DATA.location.length } as React.CSSProperties}>
          {RESUME_DATA.location}
        </span>
      </div>
      <StatStrip stats={RESUME_DATA.stats} />
    </section>
  );
}
