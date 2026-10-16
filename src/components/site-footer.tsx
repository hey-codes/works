import { RESUME_DATA } from "@/data/resume-data";
import { bareUrl, formatUpdated, socialUrl } from "@/lib/format";
import type { FooterCredits } from "@/lib/types";
import styles from "./atlas.module.css";
import { OutIcon } from "./icons";

/** A credits group: its key, then each name, keeping its " ·" with it so a wrap never starts a line on a dot. */
function Credits({ row }: { row: FooterCredits }) {
  const last = row.items.length - 1;
  return (
    <span className={styles.colophonGroup} data-noprint="">
      <span className={styles.colophonKey}>{row.key}</span>
      {row.items.map((item, k) => (
        <span key={item.name} className={styles.footerItem}>
          <a href={item.url} target="_blank" rel="noopener" className={styles.footerLink}>
            {item.name}
          </a>
          {k < last ? " ·" : null}
        </span>
      ))}
    </span>
  );
}

/**
 * The page's sign-off (Cody, 2026-10-15), a bookend to the header: the
 * wordmark with its red cursor, and the ways to reach him, LinkedIn and
 * GitHub, as labelled links with the ↗ of every out link. Under a hairline,
 * the colophon in one quiet line: UPDATED, BUILT and TYPE.
 */
export function SiteFooter() {
  const { footer } = RESUME_DATA;
  const linkedin = socialUrl(RESUME_DATA, "linkedin");
  // LinkedIn first: the way a hiring manager reaches out.
  const out = ["linkedin", "github"].flatMap((icon) => RESUME_DATA.contact.social.filter((s) => s.icon === icon));
  return (
    <footer className={styles.footer}>
      <div className={styles.footerSign} data-noprint="">
        <span className={styles.wordmark}>
          {bareUrl(RESUME_DATA.personalWebsiteUrl)}
          <i className={styles.cursor} />
        </span>
        <span className={styles.footerOuts}>
          {out.map((s) => (
            <a key={s.icon} href={s.url} target="_blank" rel="noopener" className={styles.footerOut}>
              {s.name}
              <span className={styles.outGlyph} aria-hidden="true">
                <OutIcon />
              </span>
            </a>
          ))}
        </span>
      </div>
      <p className={styles.colophon}>
        <span className={styles.colophonGroup}>
          <span className={styles.colophonKey}>{footer.updated}</span>
          {formatUpdated(RESUME_DATA.updated)}
        </span>
        <Credits row={footer.built} />
        <Credits row={footer.type} />
      </p>
      <span className={styles.printContact}>
        {bareUrl(RESUME_DATA.personalWebsiteUrl)} · {bareUrl(linkedin)}
      </span>
    </footer>
  );
}
