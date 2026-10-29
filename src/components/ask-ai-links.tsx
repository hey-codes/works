"use client";

import { pageview } from "@vercel/analytics";
import { useState } from "react";
import { RESUME_DATA } from "@/data/resume-data";
import { optedOut } from "@/lib/analytics-opt-out";
import { askHref, askPath } from "@/lib/ask-ai";
import type { AskTool } from "@/lib/types";
import styles from "./atlas.module.css";
import { OutIcon } from "./icons";
import { siteStorage } from "./site-analytics";

/**
 * The ASK AI column (Cody, 2026-10-29): each tool is a real link, so it works
 * without JavaScript. A click is counted as /ask/<tool> unless this browser
 * opted out; a copy tool (Gemini) also puts the prompt on the clipboard, and
 * the note shows only once the copy has worked.
 */
export function AskAiLinks() {
  const { ask } = RESUME_DATA.footer;
  const [copied, setCopied] = useState(false);

  function onClick(tool: AskTool) {
    if (!optedOut(window.location.search, siteStorage())) pageview({ route: askPath(tool.name), path: askPath(tool.name) });
    if (tool.copy) navigator.clipboard?.writeText(ask.prompt).then(() => setCopied(true), () => {});
  }

  return (
    <>
      <span className={styles.askTools}>
        {ask.tools.map((tool) => (
          <a key={tool.name} href={askHref(tool, ask.prompt)} target="_blank" rel="noopener" className={styles.askTool} onClick={() => onClick(tool)}>
            {tool.name}
            <span className={styles.outGlyph} aria-hidden="true">
              <OutIcon />
            </span>
          </a>
        ))}
      </span>
      <span className={styles.askNote} role="status">
        {copied ? ask.copied : null}
      </span>
      <span className={styles.askReads}>
        {ask.reads}{" "}
        <a href={`/${ask.file}`} className={styles.footerLink}>
          {ask.file}
        </a>
      </span>
    </>
  );
}
