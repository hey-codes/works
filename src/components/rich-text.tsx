import { segments, unlink } from "@/lib/format";
import styles from "./atlas.module.css";

/** Renders markdown-lite. Bold runs are scan waypoints; links only when asked. */
export function RichText({ text, links = false }: { text: string; links?: boolean }) {
  return (
    <>
      {segments(links ? text : unlink(text)).map((s, i) =>
        s.href ? (
          <a key={i} href={s.href} target="_blank" rel="noopener" className={styles.proseLink}>
            {s.text}
          </a>
        ) : (
          <span key={i} className={s.bold ? styles.bold : undefined}>
            {s.text}
          </span>
        ),
      )}
    </>
  );
}
