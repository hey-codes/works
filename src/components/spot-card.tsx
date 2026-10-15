"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { RESUME_DATA } from "@/data/resume-data";
import type { SiteProps } from "@/lib/site-points";
import { orderSites } from "@/lib/spots";
import { brandOf, type CardBack, KEY, OpeningFlag } from "./site-card";

const COPY = RESUME_DATA.map.card;

/**
 * What a tap on the map opens. One site: its card. Several (sites at one
 * address, or dots that overlap under the tap): one list card, its header
 * ("4 sites here") over a row per site, opening sites first (see spots.ts).
 * A row opens that site's card in its place, with a way back to the list.
 * `card` draws a site's card, with the back control when it came from the list.
 * `first` opens one site's card at once, as if its row had been chosen.
 */
export function SpotCard({ sites, first = null, card }: { sites: readonly SiteProps[]; first?: number | null; card: (site: SiteProps, back: CardBack | null) => React.ReactNode }) {
  const ordered = useMemo(() => orderSites(sites), [sites]);
  // A site asked for by name (a caption tier chip) opens its own card, with the way back to the list.
  const [openId, setOpenId] = useState<number | null>(first);
  const rows = useRef(new Map<number, HTMLButtonElement>());
  const returnTo = useRef<number | null>(null);
  const headerId = useId();
  // A site the map no longer shows (the map changed to one brand) closes back to the
  // list, and stays closed if its brand comes back: the list returns, not the card. A
  // site that never left keeps its card open, with its back control once the list grows
  // back around it.
  const open = ordered.find((s) => s.id === openId) ?? null;
  if (openId !== null && !open) setOpenId(null);

  // Back on the list, focus returns to the row that was opened.
  useEffect(() => {
    if (open || returnTo.current === null) return;
    rows.current.get(returnTo.current)?.focus();
    returnTo.current = null;
  }, [open]);

  const [only] = ordered;
  if (ordered.length === 1 && only) return card(only, null);
  const header = COPY.sitesHere.replace("{n}", String(ordered.length));
  if (open) {
    const back: CardBack = {
      label: header,
      onBack: () => {
        returnTo.current = open.id;
        setOpenId(null);
      },
    };
    return card(open, back);
  }

  return (
    <div>
      {/* On touch the header is at least 34px tall, so the first row starts below mapcn's
          close button (44px at top-1: its band ends 48px below the popup's inner edge).
          Under 960px the popup pads 8px and the list's mt-1.5 adds 6, so 34 reaches 48
          exactly; from 960px the popup pads 12px and clears it by 4. The mouse layout
          keeps the header's own height. Change the button, check this (see PopupCloseButton). */}
      <p id={headerId} className={`${KEY} pointer-coarse:min-h-[34px] pr-6 uppercase`}>
        {header}
      </p>
      {/* role="list": WebKit drops list semantics under list-style: none, so VoiceOver would not announce the list or its label. */}
      <ul role="list" aria-labelledby={headerId} className="mt-1.5 mb-0 flex list-none flex-col gap-1 p-0">
        {ordered.map((site) => (
          <li key={site.id}>
            <button
              type="button"
              ref={(el) => {
                if (!el) return;
                rows.current.set(site.id, el);
                return () => {
                  rows.current.delete(site.id);
                };
              }}
              onClick={() => setOpenId(site.id)}
              className="group flex min-h-6 w-full items-center gap-2 rounded-[4px] text-left"
            >
              <span className="block min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className={`${KEY} uppercase`}>{brandOf(site)}</span>
                  {site.opening ? <OpeningFlag opening={site.opening} year={site.openedYear} className="pointer-coarse:mr-6" /> : null}
                </span>
                <span className="block text-[13px] leading-[1.3] font-medium group-hover:text-[var(--blue)]">{site.name}</span>
              </span>
              {/* The way into the row's card, blue as every way in is; the
                  card's "‹" is the way back. Not read: the row is the button. */}
              <span aria-hidden="true" className="shrink-0 text-[13px] leading-none text-[var(--blue)]">
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
