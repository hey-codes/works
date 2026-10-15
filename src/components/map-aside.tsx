"use client";

import dynamic from "next/dynamic";
import { Component, Fragment, useEffect, useRef, useState } from "react";
import { RESUME_DATA } from "@/data/resume-data";
import { displayName, siteWord, systemRoles, yearSpan } from "@/lib/format";
import type { OpeningTier } from "@/lib/openings";
import { useMediaQuery } from "@/lib/use-media-query";
import { useAtlas } from "./atlas-state";
import styles from "./atlas.module.css";
import type { MapReport } from "./site-map";

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
 * The caption's words for what the map shows: a traced system, a role, or
 * every site, its figures as parts that read joined by " · ". `blue` when they
 * name what the reader is pointing at or chose.
 */
function captionFor(role: number | null, sys: { name: string; roles: number } | null) {
  const r = role === null ? undefined : ROLES[role];
  if (sys) return { title: sys.name, sub: [`${sys.roles} of ${ROLES.length} roles`], blue: true };
  if (r) {
    // "6 opened, 11 on the map" when the records hold more sites than the copy claims.
    const count = r.sites > 0 ? `${r.sites} ${r.sitesLabel ?? r.countWord ?? siteWord(r.sites)}` : null;
    const onMap = r.mapSites ? `${r.mapSites} on the map` : null;
    return { title: displayName(r), sub: [count, onMap, r.sqft, yearSpan(r)].filter((part): part is string => Boolean(part)), blue: true };
  }
  return { title: RESUME_DATA.map.title, sub: RESUME_DATA.map.caption.split(" · "), blue: false };
}

function Caption({ report, onGo }: { report: MapReport | null; onGo: () => void }) {
  const { hov, selected, focus, sysActive, sysRoles, sysPin, narrow, sysClear, askSite } = useAtlas();
  // The hint teaches the one thing the map does not show: the role list
  // drives it. Only where that is true (from 960px) and only with a mouse,
  // since it asks for a hover.
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const hint = !narrow && canHover;

  // What the caption shows follows hover and focus as well as choice, except
  // while the map shows an open role's brand alone: then it keeps naming that
  // role, since a hovered row has nothing on the map to name (Cody, 2026-10-15).
  const captioned = narrow ? null : (focus.selected ?? hov ?? selected);
  const shown = captionFor(captioned, sysActive && sysRoles ? { name: sysActive, roles: sysRoles.size } : null);
  // The far link only where the caption names what the map draws, with that
  // brand's own count: never under a hovered role, a trace, a role kept open
  // after "Show every site", or a role with no sites of its own. The map
  // works it out (see MapReport), so the records stay in the map's chunk.
  const far = report?.far && report.offFrame && !sysActive && report.role === captioned ? report.far : null;
  // The opening tiers of what the caption names, where that is what the map
  // draws (as for the far link): an open role's, or with every brand on the
  // whole portfolio's, phones included, as the key to the red marks (Cody,
  // 2026-10-15). A chip steps the map through that tier's sites, one card at a
  // time, in the list card's order, and starts again after the last. Focus
  // stays on the chip, so Enter steps on.
  const tiers = !sysActive && report && report.role === captioned ? report.tiers : [];
  const [step, setStep] = useState<{ role: number | null; next: Record<string, number> }>({ role: null, next: {} });
  // Each press is heard, the same site again included: the live line empties,
  // and takes the name on the next frame, so it always changes.
  const [announce, setAnnounce] = useState("");
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const press = (t: OpeningTier, from: HTMLElement) => {
    const next = step.role === captioned ? step.next : {};
    const i = (next[t.opening] ?? 0) % t.sites.length;
    const site = t.sites[i];
    if (!site) return;
    askSite(site.id, from, false);
    setStep({ role: captioned, next: { ...next, [t.opening]: i + 1 } });
    setAnnounce("");
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setAnnounce(site.name));
  };
  // What a screen reader hears follows choice alone: a role opened or closed,
  // a system pinned or cleared. Hovering a row or tabbing to its + already
  // names the role, so the caption is not read again for it.
  const pinned = sysPin && !narrow ? { name: sysPin, roles: systemRoles(RESUME_DATA, sysPin).length } : null;
  const chosen = captionFor(narrow ? null : selected, pinned);

  return (
    <div className={styles.caption}>
      {/* The words on screen are hidden from screen readers, which hear the
          live line below instead; Clear stays a button for both. */}
      <span className={styles.captionTitle} data-tone={shown.blue ? "blue" : undefined} aria-hidden="true">
        {shown.title}
      </span>
      <span className={styles.captionSub}>
        {/* A line breaks only between figures, never inside one ("2021-2022"). */}
        <span aria-hidden="true">
          {shown.sub.map((part, k) => (
            <Fragment key={part}>
              {k ? " · " : null}
              <span className={styles.nowrap}>{part}</span>
            </Fragment>
          ))}
        </span>
        {sysPin && !narrow ? (
          <button type="button" onClick={sysClear} className={styles.clear}>
            Clear
          </button>
        ) : null}
        {/* Sites the map shows off the frame (Honolulu's): their place and
            count, so the circles in view and the count above them add up,
            and a flight there. */}
        {far ? (
          <button type="button" onClick={onGo} className={styles.clear}>
            <span aria-hidden="true">← </span>
            {far.city} · {far.count} {siteWord(far.count)}
          </button>
        ) : null}
        {/* The open role's tier chips end the figures line, each wrapping on
            its own: a chip takes the next line only where it has no room. */}
        {tiers.length ? (
          <span className={styles.captionTiers}>
            {tiers.map((t) => (
              <button key={t.opening} type="button" className={styles.openingFlag} data-tier={t.opening} onClick={(e) => press(t, e.currentTarget)}>
                {RESUME_DATA.map.card.flags[t.opening]} · {t.sites.length}
              </button>
            ))}
          </span>
        ) : null}
      </span>
      <span aria-live="polite" className={styles.srOnly}>
        {chosen.title} · {chosen.sub.join(" · ")}
      </span>
      {/* The site a tier chip opened, named as its card opens. */}
      <span aria-live="polite" className={styles.srOnly}>
        {announce}
      </span>
      {/* Only while the caption shows every site; it keeps its line while a
          role has the caption, so opening a role never takes the line away.
          The role's tier chips, where it has openings, end the figures line,
          a little taller than the text, and add a line only where that line
          has no room for them. Not read aloud: it describes a hover. */}
      {hint ? (
        <span className={styles.captionHint} data-off={shown.blue ? "" : undefined} aria-hidden="true">
          <span>›</span>
          <span>{RESUME_DATA.map.hint}</span>
        </span>
      ) : null}
    </div>
  );
}

export function MapAside() {
  // What the map shows, which it reports and the caption offers ways into:
  // the far sites off the frame, and the open role's opening tiers.
  const [report, setReport] = useState<MapReport | null>(null);
  const goAway = useRef<(() => void) | null>(null);
  return (
    <aside className={styles.aside} data-noprint="">
      <MapBoundary>
        <div className={`${styles.map} map-scope`} data-needs-js="">
          <SiteMap onReport={setReport} goAway={goAway} />
        </div>
      </MapBoundary>
      <Caption report={report} onGo={() => goAway.current?.()} />
    </aside>
  );
}
