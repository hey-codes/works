"use client";

import dynamic from "next/dynamic";
import { Component, Fragment } from "react";
import { RESUME_DATA } from "@/data/resume-data";
import { displayName, siteWord, systemRoles, yearSpan } from "@/lib/format";
import type { Pick } from "@/lib/atlas-reducer";
import { useMediaQuery } from "@/lib/use-media-query";
import { useAtlas } from "./atlas-state";
import styles from "./atlas.module.css";

const ROLES = RESUME_DATA.work;

// MapLibre and the tiles load after first paint, in their own chunk.
const SiteMap = dynamic(() => import("./site-map"), { ssr: false });

/** Without WebGL, or if the map chunk fails, the frame goes and the caption stays. */
class MapBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The caption's words for what the map shows: a system, a role, or every site,
 * its figures as parts that read joined by " · ". `blue` when they name what
 * the reader is pointing at or picked.
 */
function captionFor(pick: Pick | null) {
  if (pick?.kind === "sys") return { title: pick.name, sub: [`${systemRoles(RESUME_DATA, pick.name).length} of ${ROLES.length} roles`], blue: true };
  const r = pick?.kind === "role" ? ROLES[pick.role] : undefined;
  if (r) {
    // "6 opened, 11 on the map" when the records hold more sites than the copy claims.
    const count = r.sites > 0 ? `${r.sites} ${r.sitesLabel ?? r.countWord ?? siteWord(r.sites)}` : null;
    const onMap = r.mapSites ? `${r.mapSites} on the map` : null;
    return { title: displayName(r), sub: [count, onMap, r.sqft, yearSpan(r)].filter((part): part is string => Boolean(part)), blue: true };
  }
  return { title: RESUME_DATA.map.title, sub: RESUME_DATA.map.caption.split(" · "), blue: false };
}

function Caption() {
  const { shown, pick, narrow } = useAtlas();
  // The hint teaches the one thing the map does not show: the role list
  // drives it. Only where that is true (from 960px) and only with a mouse,
  // since it asks for a hover.
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const hint = !narrow && canHover;
  // On screen the caption names what the map shows now, a hover's preview
  // included; a screen reader hears only the pick, as it is made or cleared.
  const onScreen = captionFor(shown);
  const chosen = captionFor(pick);

  return (
    <div className={styles.caption}>
      <span className={styles.captionTitle} data-tone={onScreen.blue ? "blue" : undefined} aria-hidden="true">
        {onScreen.title}
      </span>
      <span className={styles.captionSub} aria-hidden="true">
        {/* A line breaks only between figures, never inside one ("2021-2022"). */}
        {onScreen.sub.map((part, k) => (
          <Fragment key={part}>
            {k ? " · " : null}
            <span className={styles.nowrap}>{part}</span>
          </Fragment>
        ))}
      </span>
      <span aria-live="polite" className={styles.srOnly}>
        {chosen.title} · {chosen.sub.join(" · ")}
      </span>
      {/* Only while the caption shows every site; it keeps its line while a
          pick has the caption, so picking never moves what is under it. Not
          read aloud: it describes a hover. */}
      {hint ? (
        <span className={styles.captionHint} data-off={onScreen.blue ? "" : undefined} aria-hidden="true">
          <span>›</span>
          <span>{RESUME_DATA.map.hint}</span>
        </span>
      ) : null}
    </div>
  );
}

export function MapAside() {
  return (
    <aside className={styles.aside} data-noprint="">
      <MapBoundary>
        <div className={`${styles.map} map-scope`} data-needs-js="">
          <SiteMap />
        </div>
      </MapBoundary>
      <Caption />
    </aside>
  );
}
