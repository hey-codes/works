import { RESUME_DATA } from "@/data/resume-data";
import { changelogDate } from "@/lib/changelog-file";
import { bareUrl, socialUrl } from "@/lib/format";
import { AskAiLinks } from "./ask-ai-links";
import styles from "./atlas.module.css";
import { OutIcon } from "./icons";

/**
 * The page's sign-off in three columns (Cody, 2026-10-29, F3): the wordmark
 * with its red cursor over UPDATED and BUILT; CONNECT, LinkedIn and GitHub;
 * ASK AI, the tools that open a chat reading the AI profile, or while it is
 * paused, FOR AI and a link to llms.txt (Cody, 2026-10-29). UPDATED is the
 * changelog's newest date, in red, and opens the changelog. Print keeps
 * UPDATED and the contact line.
 */
export function SiteFooter() {
  const { footer } = RESUME_DATA;
  const updated = changelogDate();
  const linkedin = socialUrl(RESUME_DATA, "linkedin");
  // LinkedIn first: the way a hiring manager reaches out.
  const out = ["linkedin", "github"].flatMap((icon) => RESUME_DATA.contact.social.filter((s) => s.icon === icon));
  const last = footer.built.items.length - 1;
  return (
    <footer className={styles.footer}>
      <div className={styles.footerCol}>
        <span className={styles.footerMark} data-noprint="">
          {bareUrl(RESUME_DATA.personalWebsiteUrl)}
          <i className={styles.cursor} />
        </span>
        <span className={styles.footerMeta}>
          <span className={styles.colophonKey}>{footer.updated}</span>
          <a href="/changelog.md" className={styles.updatedLink}>
            {updated}
          </a>
        </span>
        <span className={styles.footerMeta} data-noprint="">
          <span className={styles.colophonKey}>{footer.built.key}</span>
          {footer.built.items.map((item, k) => (
            <span key={item.name} className={styles.footerItem}>
              <a href={item.url} target="_blank" rel="noopener" className={styles.footerLink}>
                {item.name}
              </a>
              {k < last ? " ·" : null}
            </span>
          ))}
        </span>
      </div>
      <div className={styles.footerCol} data-noprint="">
        <span className={styles.label}>{footer.connect}</span>
        <span className={styles.footerStack}>
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
      <div className={styles.footerCol} data-noprint="">
        {footer.ask.paused ? (
          <>
            <span className={styles.label}>{footer.forAi.key}</span>
            <a href={`/${footer.forAi.file}`} className={styles.footerLink}>
              {footer.forAi.file}
            </a>
            <span className={styles.askReads}>{footer.forAi.note}</span>
          </>
        ) : (
          <>
            <span className={styles.label}>{footer.ask.key}</span>
            <AskAiLinks />
          </>
        )}
      </div>
      <span className={styles.printContact}>
        {bareUrl(RESUME_DATA.personalWebsiteUrl)} · {bareUrl(linkedin)}
      </span>
    </footer>
  );
}
