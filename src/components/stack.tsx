"use client";

import { RESUME_DATA } from "@/data/resume-data";
import { systemRoles } from "@/lib/format";
import { useAtlas, useSystemTrace } from "./atlas-state";
import styles from "./atlas.module.css";
import { SectionHead } from "./section-head";

const PERSONAL = "Personal";

function StackAt({ at }: { at: readonly string[] }) {
  return (
    <span className={styles.stackAt}>
      {/* Each place is a flex item that drops a trailing space, so the
          separator's spaces are no-break ones: "Rivian · FENDI", not "Rivian ·FENDI". */}
      {at.map((b, k) => (
        <span key={b}>
          {b}
          {k < at.length - 1 ? "\u00a0·\u00a0" : ""}
        </span>
      ))}
    </span>
  );
}

/** A row that traces its roles on the map. */
function TracedRow({ name, at }: { name: string; at: readonly string[] }) {
  const { sysActive } = useAtlas();
  const { pinned, handlers } = useSystemTrace(name);
  return (
    <button type="button" {...handlers} aria-pressed={pinned} className={styles.stackRow} data-active={sysActive === name}>
      <i className={styles.rail} />
      <span className={styles.stackName}>{name}</span>
      <StackAt at={at} />
    </button>
  );
}

/** Roles in page order by their short names, then "Personal" last (his own use, no role). */
function StackRow({ name, used }: { name: string; used: readonly string[] }) {
  const { narrow } = useAtlas();
  const roles = systemRoles(RESUME_DATA, name).map((i) => {
    const w = RESUME_DATA.work[i];
    return w ? (w.short ?? w.company) : "";
  });
  const at = used.includes(PERSONAL) ? [...roles, PERSONAL] : roles;
  return (
    <li>
      {/* An app used only on his own has no role to trace, so it is plain
          text in the same row, not a button: a trace of no roles would dim
          the whole list and put every brand back on the map. Under 960px
          nothing traces, so every row is (Cody, 2026-10-15). */}
      {roles.length && !narrow ? (
        <TracedRow name={name} at={at} />
      ) : (
        <div className={styles.stackRow} data-static="">
          <span className={styles.stackName}>{name}</span>
          <StackAt at={at} />
        </div>
      )}
    </li>
  );
}

/**
 * 05 Stack: the page's one list of tools (Cody, 2026-10-15), the CMMS rows,
 * then APPS A to Z, each row naming the roles it was used at.
 */
export function Stack() {
  const { tools } = RESUME_DATA;
  const stack = [
    { key: "CMMS", used: tools.cmms },
    // Rows in the data's order, which is A to Z (src/lib/details.test.ts).
    { key: "APPS", used: tools.apps },
  ];
  return (
    <section id="s5" className={styles.section}>
      <SectionHead
        eyebrow="05"
        title="Stack"
        aside={
          <span data-noprint="" data-needs-js="" className={styles.stackHint}>
            HOVER A ROW TO TRACE IT ON THE MAP
          </span>
        }
      />
      {stack.map((grp) => (
        <div key={grp.key} className={styles.stackGroup}>
          <span className={styles.key}>{grp.key}</span>
          <ul className={styles.stackRows}>
            {Object.entries(grp.used).map(([name, used]) => (
              <StackRow key={name} name={name} used={used} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
