import { RESUME_DATA } from "@/data/resume-data";
import { bareUrl, formatUpdated, socialUrl } from "@/lib/format";
import type { FooterCredits } from "@/lib/types";
import styles from "./atlas.module.css";
import { GitHubIcon, LinkedInIcon } from "./icons";

/** A credits row. Each name keeps its " ·" with it, so a wrap never starts a line on a dot. */
function CreditsRow({ row }: { row: FooterCredits }) {
  const last = row.items.length - 1;
  return (
    <div className={styles.footerRow} data-noprint="">
      <dt className={styles.key}>{row.key}</dt>
      <dd>
        {row.items.map((item, k) => (
          <span key={item.name}>
            {k > 0 ? " " : null}
            <span className={styles.footerItem}>
              <a href={item.url} target="_blank" rel="noopener" className={styles.footerLink}>
                {item.name}
              </a>
              {k < last ? " ·" : null}
            </span>
          </span>
        ))}
      </dd>
    </div>
  );
}

export function SiteFooter() {
  const { footer } = RESUME_DATA;
  const linkedin = socialUrl(RESUME_DATA, "linkedin");
  return (
    <footer className={styles.footer}>
      <dl className={styles.footerRows}>
        <div className={styles.footerRow}>
          <dt className={styles.key}>{footer.updated}</dt>
          <dd>{formatUpdated(RESUME_DATA.updated)}</dd>
        </div>
        <CreditsRow row={footer.built} />
        <CreditsRow row={footer.type} />
      </dl>
      <span className={styles.printContact}>
        {bareUrl(RESUME_DATA.personalWebsiteUrl)} · {bareUrl(linkedin)}
      </span>
      <span className={styles.footerLinks} data-noprint="">
        <a href={linkedin} target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn" className={styles.footerIcon}>
          <LinkedInIcon />
        </a>
        <a href={socialUrl(RESUME_DATA, "github")} target="_blank" rel="noopener" aria-label="GitHub" title="GitHub" className={styles.footerIcon}>
          <GitHubIcon />
        </a>
      </span>
    </footer>
  );
}
