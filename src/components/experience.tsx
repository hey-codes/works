"use client";

import { Fragment } from "react";
import { RESUME_DATA } from "@/data/resume-data";
import { detailRows, displayName, nameParts, plain, siteWord, toolsFor, yearSpan } from "@/lib/format";
import type { Role } from "@/lib/types";
import { useAtlas, useSystemTrace } from "./atlas-state";
import styles from "./atlas.module.css";
import { OutIcon, PlusIcon } from "./icons";
import { PenStroke } from "./pen-stroke";
import { RichText } from "./rich-text";
import { SectionHead } from "./section-head";

function SystemButton({ name }: { name: string }) {
  const { narrow } = useAtlas();
  const { pinned, handlers } = useSystemTrace(name);
  // Under 960px the list does not drive the map and nothing traces, so the
  // name is text in its line's tone, not a blue button that does nothing (Cody, 2026-10-15).
  if (narrow) return <span>{name}</span>;
  return (
    <button type="button" {...handlers} aria-pressed={pinned} title={`Trace ${name} across roles`} className={styles.sysButton}>
      {name}
    </button>
  );
}

/** A brand's own site, a link of its own inside the clickable row: it opens
    the site and leaves the row as it was. */
function OutLink({ name, url }: { name: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      aria-label={name}
      title={name}
      className={styles.outLink}
      onClick={(e) => e.stopPropagation()}
      data-noprint=""
    >
      <OutIcon />
    </a>
  );
}

function RoleRecord({ role, index }: { role: Role; index: number }) {
  const { sector, sqft, cmms } = role;
  const name = displayName(role);
  const hasMeta = Boolean(sector || sqft || cmms.length);
  const panelId = `role-${index}`;
  const atlas = useAtlas();
  const open = !!atlas.open[index];
  const traced = atlas.sysRoles?.has(index) ?? false;
  const self = { kind: "role", role: index } as const;
  const parts = nameParts(role);
  const tail = parts[parts.length - 1];
  return (
    <div
      id={`role-row-${index}`}
      className={styles.role}
      data-open={open}
      data-dim={atlas.sysRoles !== null && !traced}
      style={{ "--sweep": `${index * 15}ms` } as React.CSSProperties}
    >
      <i className={styles.rail} data-noprint="" />
      {/* The whole row toggles for pointer users; the + button is the keyboard and screen reader control. */}
      <div
        className={styles.roleHead}
        // A pointer that hovers, not a touch: a tap fires mouseenter and
        // nothing ever leaves, so the row's ground stuck after a tap.
        // It previews the role on the map; the row itself only turns gray (CSS).
        onPointerEnter={(e) => e.pointerType !== "touch" && atlas.hover(self)}
        onPointerLeave={(e) => e.pointerType !== "touch" && atlas.hover(null)}
        onClick={() => atlas.toggle(index)}
      >
        <span className={styles.years}>{yearSpan(role)}</span>
        <span className={styles.roleMain}>
          <span className={styles.company}>
            {/* The pen line runs under the name, and under a ↗ inside it
                ("J.Crew ↗ and Madewell"), but not under the last ↗. */}
            <span className={styles.penHost}>
              {parts.map((part, k) => (
                <Fragment key={part.text}>
                  {part.text}
                  {part.url && k < parts.length - 1 ? <OutLink name={part.text} url={part.url} /> : null}
                </Fragment>
              ))}
              {/* Red while the record is open, drawn once as it opens. Hover draws
                  nothing (Cody, 2026-10-15). */}
              {open ? <PenStroke key="open" tone="red" variant={index} /> : null}
            </span>
            {tail?.url ? <OutLink name={tail.text} url={tail.url} /> : null}
          </span>
          <span className={styles.roleTitle}>{role.title}</span>
          <span className={styles.context}>
            <span aria-hidden="true">›</span>
            <span>{role.context}</span>
          </span>
          {hasMeta ? (
            <span className={styles.meta}>
              {sector ? <span className={styles.metaPart}>{sector}&nbsp;·&nbsp;</span> : null}
              {cmms.map((system, k) => (
                <span key={system} className={styles.metaPart}>
                  <SystemButton name={system} />
                  {k < cmms.length - 1 ? " → " : sqft ? " · " : ""}
                </span>
              ))}
              {sqft ? <span className={styles.metaPart}>{sqft}</span> : null}
            </span>
          ) : null}
        </span>
        {/* A role with no managed sites keeps the column so the toggle stays put. */}
        <span className={styles.siteCount}>
          {role.sites > 0 ? (
            <>
              {role.sites}
              <span className={styles.siteWord}>&nbsp;{role.countWord ?? siteWord(role.sites)}</span>
            </>
          ) : null}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            atlas.toggle(index);
          }}
          onFocus={() => atlas.hover(self)}
          onBlur={() => atlas.hover(null)}
          id={`role-toggle-${index}`}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`${open ? "Hide" : "Show"} details for ${name}`}
          className={styles.toggle}
          data-noprint=""
        >
          <span className={styles.togglePlus}>
            <PlusIcon />
          </span>
        </button>
      </div>
      <div id={panelId} className={styles.panel}>
        <div className={styles.panelClip}>
          <div className={styles.panelBody}>
            <div className={styles.band}>
              <span className={styles.bandLabel}>SPEC</span>
              <div className={styles.bandBody}>
                <dl className={styles.spec}>
                  {sector ? (
                    <div className={styles.specItem}>
                      <dt>SECTOR</dt>
                      <dd>{sector}</dd>
                    </div>
                  ) : null}
                  {cmms.length ? (
                    <div className={styles.specItem}>
                      <dt>CMMS</dt>
                      <dd>
                        <span className={styles.cmmsList}>
                          {cmms.map((system, k) => (
                            <span key={system}>
                              <SystemButton name={system} />
                              {k < cmms.length - 1 ? " → " : ""}
                            </span>
                          ))}
                        </span>
                      </dd>
                    </div>
                  ) : null}
                  {role.sites > 0 ? (
                    <div className={styles.specItem}>
                      <dt>FOOTPRINT</dt>
                      {/* Where a phone's column wraps it, the dot stays with the
                          sq ft and the count with its word: "220K+ sq ft ·" over
                          "67 sites". */}
                      <dd>{[sqft, `${role.sites}\u00a0${role.countWord ?? siteWord(role.sites)}`].filter(Boolean).join("\u00a0· ")}</dd>
                    </div>
                  ) : null}
                  <div className={`${styles.specItem} ${styles.specWide}`}>
                    <dt>BASE</dt>
                    <dd>{role.location}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className={styles.band}>
              <span className={styles.bandLabel}>BRIEF</span>
              <div className={styles.bandBody}>
                <div className={styles.brief}>
                  {role.highlights?.map((h) => (
                    <p key={h} className={styles.briefText}>
                      <RichText text={h} />
                    </p>
                  ))}
                  <p className={styles.briefMuted}>{plain(role.description)}</p>
                </div>
              </div>
            </div>
            <div className={styles.band}>
              <span className={styles.bandLabelDetails}>DETAILS</span>
              <div className={styles.bandBodyDetails}>
                {/* One row per key, keyed as SPEC is; each value its own outlined
                    chip. TOOLS is the role's apps from STACK; an AWARD chip is red. */}
                <dl className={styles.details}>
                  {detailRows(role.details, toolsFor(RESUME_DATA, role.company)).map((row) => (
                    <div key={row.key} className={styles.detailRow} data-key={row.key}>
                      <dt>{row.key}</dt>
                      <dd className={styles.detailChips}>
                        {row.values.map((value) => (
                          <span key={value} className={styles.detailChip}>
                            {value}
                          </span>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Experience() {
  const roles = RESUME_DATA.work;
  return (
    <section id="s2" className={styles.section}>
      <SectionHead eyebrow={`02 · ${roles.length} ROLES`} title="Experience" />
      {roles.map((role, i) => (
        <RoleRecord key={role.company} role={role} index={i} />
      ))}
    </section>
  );
}
