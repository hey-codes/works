"use client";

import { useEffect, useRef } from "react";
import { RESUME_DATA } from "@/data/resume-data";
import { cardChips, showsType, type CardChip } from "@/lib/card-chips";
import { compactSqft, displayName, openingLabel, yearSpan } from "@/lib/format";
import { pointsFor, type SiteProps } from "@/lib/site-points";
import type { Opening } from "@/lib/types";

const COPY = RESUME_DATA.map.card;
const ROLES = RESUME_DATA.work;

/** The mono caps label style, without a color, for labels that are links. */
const LABEL = "text-[11px] leading-[1.3] font-medium tracking-[var(--track-label)]";
export const KEY = `text-muted-foreground ${LABEL}`;
const VALUE = "text-[13px] leading-[1.4] font-medium";
const LINK = "pointer-coarse:min-h-11 inline-flex items-center text-[var(--blue)] underline underline-offset-[3px]";
const RULE = "border-border -mx-3 mt-2 border-t px-3 pt-2";
/** The phone card's link: a 24px target (WCAG 2.5.8), so the card fits the short frame whole. */
const COMPACT_LINK = "inline-flex min-h-6 items-center text-[var(--blue)] underline underline-offset-[3px]";
/**
 * The phone card's SQ FT value, on the row it shares with the Role link: as
 * tall as the link, and kept 48px (pr-12) clear of it, so "Est." never runs
 * under it. The link's copy, `RESUME_DATA.map.card.readRole` ("Role ↓"), is
 * 43.2px wide at 12px mono; longer copy there needs a wider clearance here.
 * Where there is no SQ FT, MARKET keeps its one line and the link takes a row
 * of its own.
 */
const COMPACT_LAST = "text-[13px] leading-6 font-medium pr-12";

function Fact({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 flex flex-col gap-1" : "flex min-w-0 flex-col gap-1"}>
      <dt className={KEY}>{label}</dt>
      <dd className={VALUE}>{children}</dd>
    </div>
  );
}

/**
 * The project flag, in red as the map's mark is, one look for every type
 * (Cody, 2026-10-15): the type names it. It never breaks inside ("NSO ·" over
 * "2022"): where it does not fit beside the brand it takes its own line, below
 * the close mark, and may use the room the mark keeps clear on the line above.
 */
const FLAG = "border-[var(--red)] text-[var(--red)]";

export function OpeningFlag({ opening, year, className = "" }: { opening: Opening; year: number | null; className?: string }) {
  return (
    <span className={`inline-block rounded-[4px] border px-1.5 py-1 text-[11px] leading-none font-medium tracking-[var(--track-label)] whitespace-nowrap ${FLAG}${className ? ` ${className}` : ""}`}>
      {openingLabel(opening, year, COPY.flags)}
    </span>
  );
}

const CHIP_TONE: Record<CardChip["tone"], string> = {
  ink: "border-[var(--ink)] text-[var(--ink)]",
  red: "border-[var(--red)] text-[var(--red)]",
  muted: "border-border text-muted-foreground",
};

/** The card's chips (see card-chips.ts); none, nothing. Each is a whole square and wraps whole. */
function ChipSpans({ site }: { site: SiteProps }) {
  return (
    <>
      {cardChips(site).map((c) => (
        <span key={c.key} className={`inline-block rounded-[4px] border px-1.5 py-1 text-[11px] leading-none font-medium tracking-[var(--track-label)] whitespace-nowrap ${CHIP_TONE[c.tone]}`}>
          {c.year === null ? COPY.chips[c.key] : `${COPY.chips[c.key]} · ${c.year}`}
        </span>
      ))}
    </>
  );
}

/** The desktop card's chips, in a row of their own under the site's name. */
function CardChips({ site }: { site: SiteProps }) {
  if (!cardChips(site).length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      <ChipSpans site={site} />
    </div>
  );
}

function Sqft({ site, sqft }: { site: SiteProps; sqft: number }) {
  return (
    <>
      {compactSqft(sqft)}
      {site.sqftEstimate ? <span className="text-muted-foreground font-normal"> {COPY.estimated}</span> : null}
    </>
  );
}

/** The way back to the list card, from a site opened in it: the list's header text, and going back. */
export interface CardBack {
  label: string;
  onBack: () => void;
}

/** The brand's short name, as the card and the list card show it. */
export function brandOf(site: Pick<SiteProps, "role">): string {
  const role = ROLES[site.role];
  return role ? (role.short ?? displayName(role)) : "";
}

/** Focus lands on the back control when a site opens from the list, so a keyboard reader starts there; the page never scrolls for it. */
function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return ref;
}

/** The brand line and, where marked, the flag beside it or under it. */
function BrandLine({ site, brand, className = "" }: { site: SiteProps; brand: React.ReactNode; className?: string }) {
  return (
    <div className={`max-[960px]:pointer-coarse:pr-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 pr-6${className ? ` ${className}` : ""}`}>
      <p className={`${KEY} overflow-hidden uppercase`}>{brand}</p>
      {site.opening ? <OpeningFlag opening={site.opening} year={site.openedYear} className="pointer-coarse:mr-6" /> : null}
    </div>
  );
}

/**
 * Back to the list on the phone card: a 24px "‹" (WCAG 2.5.8) at the start of
 * the brand line, beside the brand and its flag rather than above them, so
 * the card keeps its height. Its name is the list's header.
 */
function BackButton({ back }: { back: CardBack }) {
  const ref = useFocusOnMount<HTMLButtonElement>();
  return (
    <button
      ref={ref}
      type="button"
      data-back=""
      onClick={back.onBack}
      aria-label={back.label}
      className="border-border inline-flex size-6 shrink-0 items-center justify-center rounded-[4px] border text-[13px] leading-none text-[var(--blue)]"
    >
      <span aria-hidden="true">‹</span>
    </button>
  );
}

/** Back to the list on the desktop card: the list's header, where it was, as a link. */
function BackLink({ back }: { back: CardBack }) {
  const ref = useFocusOnMount<HTMLButtonElement>();
  return (
    <button
      ref={ref}
      type="button"
      data-back=""
      onClick={back.onBack}
      className={`${LABEL} pointer-coarse:min-h-11 mb-1 inline-flex min-h-6 items-center gap-1 text-[var(--blue)] uppercase underline underline-offset-[3px]`}
    >
      <span aria-hidden="true">‹</span>
      {back.label}
    </button>
  );
}

/**
 * The card under 1280px, where the frame can be 320px tall (under 960px) or
 * the column 320 to 380px wide (960 to 1279): the same fields, tighter. The
 * flag moves to the top of the card, beside the brand line where both fit and
 * directly under it where they do not, as on phones; the facts read as label
 * and value rows (TYPE, MARKET, SQ FT), and the Role link shares the SQ FT
 * row, so the tallest card fits the frame without scrolling; with no SQ FT,
 * the link takes a row of its own under MARKET. "All N sites" is asked for
 * only from 960px, and takes a row of its own.
 */
function CompactSiteCard({ site, brand, back, showBrand, onReadRole }: { site: SiteProps; brand: React.ReactNode; back: CardBack | null; showBrand: React.ReactNode; onReadRole: () => void }) {
  return (
    <div>
      {/* The close mark sits beside the brand line with a mouse. On touch it
          sits lower, beside the flag or the name's first line, and those stop
          short of it: mr-6 here and the 24 by 16 float below clear mapcn's
          touch close button (PopupCloseButton in ui/map.tsx, 44px at a 4px
          inset, its X 7px wide at the centre) by about 6px. From 960px the
          popup's top padding is 4px deeper, so the brand line sits beside
          the touch X too and keeps its pr-6 there (BrandLine). */}
      {back ? (
        <div className="flex items-start gap-1.5">
          <BackButton back={back} />
          <BrandLine site={site} brand={brand} className="min-w-0 flex-1" />
        </div>
      ) : (
        <BrandLine site={site} brand={brand} />
      )}
      {/* The chips sit after the name and drop below it only where the name leaves no room. */}
      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <p className="max-w-full shrink-0 text-[13px] leading-[1.3] font-medium">
          {/* Holds the name's first line clear of the touch close mark when no flag sits beside it. */}
          {site.opening ? null : <span aria-hidden="true" className="pointer-coarse:block float-right hidden h-4 w-6" />}
          {site.name}
        </p>
        <ChipSpans site={site} />
      </div>
      {/* The facts and the Role link share one grid, the link on the SQ FT row's
          right, which keeps clear of it (COMPACT_LAST); with no SQ FT, on a row of
          its own under the facts, so MARKET keeps its one line. */}
      <div className="mt-1.5 grid">
        <dl className="col-start-1 row-start-1 grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-2">
          {showsType(site) ? (
            <>
              <dt className={KEY}>{COPY.type}</dt>
              <dd className={VALUE}>{site.type}</dd>
            </>
          ) : null}
          <dt className={KEY}>{COPY.market}</dt>
          <dd className={VALUE}>{site.city}</dd>
          {site.sqft === null ? null : (
            <>
              <dt className={KEY}>{COPY.sqft}</dt>
              <dd className={COMPACT_LAST}>
                <Sqft site={site} sqft={site.sqft} />
              </dd>
            </>
          )}
        </dl>
        <button
          type="button"
          onClick={onReadRole}
          className={`${COMPACT_LINK} col-start-1 justify-self-end ${site.sqft === null ? "row-start-2" : "row-start-1 self-end"}`}
        >
          {COPY.readRole}
        </button>
      </div>
      {showBrand ? <div className="mt-1">{showBrand}</div> : null}
    </div>
  );
}

/**
 * One site, in the expanded role's SPEC style: what it is, how big, and
 * whether Cody opened it, then the way to its brand and its role.
 */
export function SiteCard({
  site,
  compact,
  back = null,
  canShowBrand,
  onShowBrand,
  onReadRole,
}: {
  site: SiteProps;
  /** Under 1280px: the short frame's and the narrow column's layout. */
  compact: boolean;
  /** Set when the site was opened from the list card: the way back to it. */
  back?: CardBack | null;
  /** False when the map already shows this brand alone, or does not follow the list. */
  canShowBrand: boolean;
  onShowBrand: () => void;
  onReadRole: () => void;
}) {
  const role = ROLES[site.role];
  if (!role) return null;
  const count = pointsFor(site.role).features.length;
  // Brand and years, wrapping between them and never inside them, with no dot
  // left at a line's end or start (see .brand-line in tailwind.css).
  const brand = (
    <span className="brand-line">
      <span>{brandOf(site)}</span>
      <span className="brand-years">{yearSpan(role)}</span>
    </span>
  );
  const showBrand = canShowBrand ? (
    <button type="button" onClick={onShowBrand} className={compact ? COMPACT_LINK : LINK}>
      {COPY.allSites.replace("{n}", String(count))}
    </button>
  ) : null;

  if (compact) return <CompactSiteCard site={site} brand={brand} back={back} showBrand={showBrand} onReadRole={onReadRole} />;

  return (
    <div>
      {back ? <BackLink back={back} /> : null}
      <p className={`${KEY} pointer-coarse:pr-11 overflow-hidden pr-6 uppercase`}>{brand}</p>
      <p className="mt-1 text-[13px] leading-[1.35] font-medium">{site.name}</p>
      <CardChips site={site} />
      <dl className={`${RULE} grid grid-cols-2 gap-x-4 gap-y-2`}>
        {showsType(site) ? <Fact label={COPY.type}>{site.type}</Fact> : null}
        {site.sqft === null ? null : (
          <Fact label={COPY.sqft}>
            <Sqft site={site} sqft={site.sqft} />
          </Fact>
        )}
        <Fact label={COPY.market}>{site.city}</Fact>
        {site.opening ? (
          <Fact label={COPY.opening} wide>
            <OpeningFlag opening={site.opening} year={site.openedYear} />
          </Fact>
        ) : null}
      </dl>
      <div className={`${RULE} flex gap-4`}>
        {showBrand}
        <button type="button" onClick={onReadRole} className={LINK}>
          {COPY.readRole}
        </button>
      </div>
    </div>
  );
}
