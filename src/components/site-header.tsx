import { RESUME_DATA } from "@/data/resume-data";
import { bareUrl, socialUrl } from "@/lib/format";
import styles from "./atlas.module.css";
import { BlinkCursor } from "./blink-cursor";
import { GitHubIcon, LinkedInIcon } from "./icons";
import { PdfControl } from "./pdf-control";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <span className={styles.wordmark}>
        {bareUrl(RESUME_DATA.personalWebsiteUrl)}
        <BlinkCursor />
      </span>
      <nav className={styles.headerNav} data-noprint="">
        <PdfControl header />
        <a href={socialUrl(RESUME_DATA, "linkedin")} target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn" className={styles.iconButton}>
          <LinkedInIcon />
        </a>
        <a href={socialUrl(RESUME_DATA, "github")} target="_blank" rel="noopener" aria-label="GitHub" title="GitHub" className={styles.iconButton}>
          <GitHubIcon />
        </a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
