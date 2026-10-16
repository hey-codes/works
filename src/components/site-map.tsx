"use client";

import type * as MapLibreGL from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Map, MapControls, MapPopup, useMap } from "@/components/ui/map";
import { RESUME_DATA } from "@/data/resume-data";
import { cardPadding, framePadding } from "@/lib/framing";
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, ROLE_FIT_MAX_ZOOM } from "@/lib/map-config";
import { projectTypes } from "@/lib/openings";
import { MAINLAND_BOUNDS, marketsFor, pointsFor, roleBounds, SITE_POINTS } from "@/lib/site-points";
import { spotLabelsFor, spotPointsOf, spotSites } from "@/lib/spots";
import { motionMs, prefersCoarsePointer, useMediaQuery } from "@/lib/use-media-query";
import { useAtlas } from "./atlas-state";
import { HonoluluInset } from "./honolulu-inset";
import { cameraFor, flyToBounds } from "./map-flight";
import { SiteCard } from "./site-card";
import { SpotCard } from "./spot-card";
import { type ClickedSpot, type HoveredSpot, SiteClusters } from "./site-clusters";

const ROLES = RESUME_DATA.work;

/** CARTO's street styles, the same pair mapcn defaults to. */
const GROUND = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

/**
 * The frame's own buttons, ahead of MapLibre's controls in the page's order,
 * so Tab reads them as the eye does: the canvas, "Show every site", zoom in,
 * zoom out, then the attribution. The host takes no box (display: contents),
 * so the buttons stay placed against the frame.
 */
function BeforeAttribution({ children }: { children: React.ReactNode }) {
  const { map } = useMap();
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    const div = document.createElement("div");
    div.style.display = "contents";
    container.insertBefore(div, container.querySelector(".maplibregl-control-container"));
    setHost(div);
    return () => {
      div.remove();
      setHost(null);
    };
  }, [map]);

  return host ? createPortal(children, host) : null;
}

/**
 * The camera frames the pick: a role's sites, or every role's that a picked
 * system was used at; with no pick, the opening view. A hover never moves it.
 * It also owns "Show every site", which clears the pick and flies out to the
 * opening view, closing any open market (Cody, 2026-10-15).
 */
function Camera({ frame, onReset }: { frame: readonly number[] | null; onReset: () => void }) {
  const { map, isLoaded } = useMap();
  const { clear } = useAtlas();
  const key = frame === null ? null : frame.join(",");
  // undefined until the map first loads and takes its opening view.
  const framed = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!map || !isLoaded || framed.current === key) return;
    const bounds = frame === null ? MAINLAND_BOUNDS : roleBounds(frame);
    // A pick with no sites leaves the view where it is.
    if (!bounds) return;
    // The first view is a jump, not a flight: the map opened on its own fit
    // of these bounds, which this matches but for the zoom floor's rule (a
    // box too tall for the phone frame keeps clear of the top controls).
    const first = framed.current === undefined;
    framed.current = key;
    if (first) map.jumpTo(cameraFor(map, bounds, frame === null ? MAP_MAX_ZOOM : ROLE_FIT_MAX_ZOOM));
    else flyToBounds(map, bounds, ROLE_FIT_MAX_ZOOM);
    // `frame` is read through `key`, which changes exactly when it does.
  }, [map, isLoaded, key]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    map.getCanvas().setAttribute("aria-label", RESUME_DATA.map.label);
    // The credit starts as its (i) button, as MapLibre leaves it after a drag,
    // so its 300px bar never lies over the sites; the button opens it.
    map.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
  }, [map, isLoaded]);

  // No pick and every site. With a pick, clearing it changes the frame, which
  // flies out; with none, the reader may have moved, so it flies out here.
  const showEverySite = () => {
    onReset();
    clear();
    if (map && frame === null) flyToBounds(map, MAINLAND_BOUNDS, ROLE_FIT_MAX_ZOOM);
  };

  return (
    <button
      type="button"
      onClick={showEverySite}
      data-map-guard=""
      className="border-border bg-background hover:bg-accent pointer-coarse:h-11 pointer-coarse:px-3 absolute top-2 left-2 z-10 h-8 rounded-[4px] border px-2 font-mono text-xs"
    >
      {RESUME_DATA.map.reset}
    </button>
  );
}

/**
 * The ground comes from CARTO. If its style cannot be fetched the map never
 * finishes loading and the sites would never draw, so the style is asked for
 * here as well, and a failure swaps in the blank ground.
 */
function GroundCheck({ onFail }: { onFail: () => void }) {
  const { resolvedTheme } = useMap();

  useEffect(() => {
    let current = true;
    const fail = () => {
      if (current) onFail();
    };
    fetch(GROUND[resolvedTheme]).then((r) => {
      if (!r.ok) fail();
    }, fail);
    return () => {
      current = false;
    };
  }, [resolvedTheme, onFail]);

  return null;
}

const LEGEND = projectTypes(SITE_POINTS);

/**
 * The key to the red diamond (Cody, 2026-10-15): the project types the records
 * hold, each beside the mark, under the zoom buttons. Static: it filters
 * nothing, and the pointer passes through it to the map.
 */
function Legend() {
  return (
    <ul
      data-map-guard=""
      className="border-border bg-background text-muted-foreground pointer-events-none absolute top-[82px] right-2 z-10 m-0 flex list-none flex-col gap-1 rounded-[4px] border px-2 py-1.5 font-mono text-[11px] leading-none font-medium tracking-[var(--track-label)] pointer-coarse:top-[106px]"
    >
      {LEGEND.map((type) => (
        <li key={type} className="flex items-center gap-1.5">
          <svg aria-hidden="true" width="9" height="9" viewBox="0 0 9 9" className="shrink-0">
            <path d="M4.5 0.5 8.5 4.5 4.5 8.5 0.5 4.5Z" fill="var(--red)" />
          </svg>
          {RESUME_DATA.map.legend[type]}
        </li>
      ))}
    </ul>
  );
}

/** The name of the dot or circle under the mouse, with a circle's openings, in the muted metadata style. No shadow, no fade; ignores the pointer. */
function HoverName({ spot }: { spot: HoveredSpot }) {
  const named = spot.more > 0 ? RESUME_DATA.map.hoverMore.replace("{name}", spot.name).replace("{n}", String(spot.more)) : spot.name;
  // A circle that wears a notch says what the red means: "Seattle +3 · 2 openings".
  const { one, other } = RESUME_DATA.map.hoverOpenings;
  const label = spot.openings > 0 ? `${named} · ${(spot.openings === 1 ? one : other).replace("{n}", String(spot.openings))}` : named;
  // Above the point, or below it where the name (26px tall) would leave the frame's top.
  const below = spot.y - spot.lift < 26;
  return (
    <div
      className="border-border bg-background text-muted-foreground pointer-events-none absolute z-10 rounded-[4px] border px-2 py-1 font-mono text-xs whitespace-nowrap"
      style={below ? { left: spot.x, top: spot.y + spot.lift, translate: "-50% 0" } : { left: spot.x, top: spot.y - spot.lift, translate: "-50% -100%" }}
    >
      {label}
    </div>
  );
}

/**
 * The popup, sized so MapLibre can always place it inside the frame.
 * MapLibre puts a popup above its dot, or below it when the dot is nearer the
 * top than the popup is tall, 16px off the dot either way; it centers the
 * popup on the dot, or sets it to one side when the dot is nearer the side
 * than half the popup's width. A popup at most half of (the frame's height
 * less 32px) tall and two thirds of (the frame's width less 16px) wide fits
 * wherever its dot sits. The width cap is that bound, with a pixel to spare
 * for MapLibre's rounding, at every width: from 1280 wide the frame is wide
 * enough that mapcn's 15.5rem is the smaller, as before.
 */
const POPUP_WIDTH = "max-w-[min(15.5rem,calc((100cqw-18px)*2/3))]";
/** Under 960px the popup also loses 4px of padding above and below. */
const NARROW_POPUP = `py-2 ${POPUP_WIDTH}`;
/** The list's cap under 960px: the height bound less the border and the popup's padding. */
const NARROW_LIST = "max-h-[calc(50cqh-34px)] overflow-y-auto";
/**
 * On a phone a list card (two or more sites) needs more than half the short
 * frame: Lenox's four rows are about 220px, the half-frame cap 125. So its spot
 * is eased up to `LIST_SPOT_Y` px from the frame's top, between the two corner
 * controls, and the card opens `LIST_GAP` px under it, clear of the spot's own
 * name, down to 8px off the frame's bottom: the frame less the spot's place,
 * the gap, 8px, and the popup's border and padding (18px).
 */
const LIST_SPOT_Y = 44;
const LIST_GAP = 30;
const NARROW_TALL_LIST = "max-h-[calc(100cqh-102px)] overflow-y-auto";
/** The cap from 960px; overflow-x-hidden, as overflow-y-auto alone lets the desktop card's -mx-3 rules scroll 12px sideways. */
const DESKTOP_LIST = "max-h-[max(calc(50cqh-48px),110px)] overflow-x-hidden overflow-y-auto";

/**
 * A card's scroll box that fades its last 20px while more lies below, so a
 * list that runs past the frame says so. No fade once it is scrolled to the end.
 */
function ScrollFade({ className, focusOnOpen, children }: { className: string; focusOnOpen: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  // A card asked to take focus (askSite's focusCard) puts the reader in it: its
  // way back to the list where it has one, else the card itself (tabIndex -1,
  // not a stop of its own otherwise). After MapLibre's own focus on open,
  // which goes to the close button, so on the next frame.
  useEffect(() => {
    if (!focusOnOpen) return;
    const frame = requestAnimationFrame(() => {
      const el = ref.current;
      (el?.querySelector<HTMLElement>("[data-back]") ?? el)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusOnOpen]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
    check();
    const seen = new ResizeObserver(check);
    seen.observe(el);
    for (const child of el.children) seen.observe(child);
    el.addEventListener("scroll", check, { passive: true });
    return () => {
      seen.disconnect();
      el.removeEventListener("scroll", check);
    };
  }, []);
  return (
    <div ref={ref} tabIndex={-1} data-more={more ? "" : undefined} className={`${className} outline-none data-[more]:[mask-image:linear-gradient(to_bottom,black_calc(100%-20px),transparent)]`}>
      {children}
    </div>
  );
}

/**
 * An open popup. Numbered, so a second click on the same spot is a new popup.
 * `points` are the data's own points for the sites it was opened on, which a
 * brand change reads the spot back from (the map hands its point back rounded).
 */
interface OpenSpot extends ClickedSpot {
  n: number;
  points: number[][];
  /** A phone's list card: opened under its spot, which was eased up to make room. */
  tall: boolean;
  /** Asked for from outside the map (a caption tier chip): the site whose card opens first. */
  first: number | null;
  /** Where focus goes back to when the card closes: the chip it was asked from. */
  returnTo: HTMLElement | null;
  /** Focus goes into the card on open; false for a tier chip, which keeps it. */
  focusCard: boolean;
}

/** Every site, explorable. Loaded after first paint by map-aside, which shows the caption. */
export default function SiteMap() {
  const { focus, narrow, openRoleAndScroll, openRoleInPlace } = useAtlas();
  const [spot, setSpot] = useState<OpenSpot | null>(null);
  const clicks = useRef(0);
  const mapRef = useRef<MapLibreGL.Map>(null);
  const narrowNow = useRef(narrow);
  narrowNow.current = narrow;
  const openSpot = useCallback((s: ClickedSpot, asked?: { first: number; returnTo: HTMLElement | null; focusCard: boolean }) => {
    const points = spotPointsOf(SITE_POINTS, s.sites.map((site) => site.id));
    // A phone's list card opens under its spot, eased up near the frame's top
    // (see LIST_SPOT_Y); the tap asked for it, so the map may move.
    const tall = narrowNow.current && s.sites.length > 1;
    const map = mapRef.current;
    if (tall && map) map.easeTo({ center: [s.lng, s.lat], offset: [0, LIST_SPOT_Y - map.getCanvas().clientHeight / 2], duration: motionMs(300) });
    setSpot({ ...s, n: ++clicks.current, points, tall, first: asked?.first ?? null, returnTo: asked?.returnTo ?? null, focusCard: asked?.focusCard ?? false });
  }, []);
  const [blank, setBlank] = useState(false);
  const goBlank = useCallback(() => setBlank(true), []);
  const [hovered, setHovered] = useState<HoveredSpot | null>(null);
  // The dot or circle under the mouse is only named: it no longer traces its
  // role, since a hover now filters the map and would swap the dots under the
  // pointer (Cody, 2026-10-15).
  const onHover = setHovered;
  // Mouse only: touch has no hover, and a tap opens the card anyway.
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  // The map's layout switches at 960px (`narrow`), the card's at 1280px: from
  // 960 to 1279 the map column is 320 to 380px wide, too short for the desktop
  // card's rows, so the card keeps the compact layout there too (Cody, 2026-10-14).
  const compactCard = useMediaQuery("(max-width: 1279.98px)");
  const showHover = canHover && hovered && !(spot && spot.sites.some((s) => hovered.ids.includes(s.id)));

  // What is picked or previewed is shown alone: its sites, its clusters, its markets.
  const data = pointsFor(focus.shown);
  const markets = marketsFor(focus.shown);
  const spotLabels = spotLabelsFor(focus.shown);
  // The markets whose own sites are drawn, after a market click: every market
  // circle under the pointer. A brand change clears them.
  const [openMarkets, setOpenMarkets] = useState<readonly string[] | null>(null);
  useEffect(() => {
    setOpenMarkets(null);
  }, [data]);
  const clearMarkets = useCallback(() => setOpenMarkets(null), []);

  // When the brands on the map change, an open card reads its spot again: one
  // brand alone keeps that brand's sites there, every brand back brings the
  // rest back, and none left closes it.
  useEffect(() => {
    setSpot((s) => {
      if (!s) return s;
      const sites = spotSites(data, s.points);
      const same = sites.length === s.sites.length && sites.every((site) => s.sites.some((held) => held.id === site.id));
      if (same) return s;
      return sites.length ? { ...s, sites } : null;
    });
  }, [data]);

  useEffect(() => {
    if (!spot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSpot(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [spot]);

  // A card that closes with focus inside it (Escape, its X, "All N sites", a
  // brand change) would drop focus to the page's start; it goes back to the
  // chip it was asked from, or else to the map, where the reader was.
  // "Role ↓" hands focus to the role itself.
  const lastSpot = useRef<OpenSpot | null>(null);
  useEffect(() => {
    const last = lastSpot.current;
    if (last && !spot && (!document.activeElement || document.activeElement === document.body)) {
      if (last.returnTo?.isConnected) last.returnTo.focus({ preventScroll: true });
      else mapRef.current?.getCanvas().focus({ preventScroll: true });
    }
    lastSpot.current = spot;
  }, [spot]);

  return (
    <Map
      ref={mapRef}
      bounds={MAINLAND_BOUNDS}
      // The same padding the Camera's fits use, so the first frame is already
      // clear of the controls.
      fitBoundsOptions={{ padding: framePadding(prefersCoarsePointer(), narrow) }}
      minZoom={MAP_MIN_ZOOM}
      maxZoom={MAP_MAX_ZOOM}
      // Wheel zoom needs Ctrl or Cmd and touch pan needs two fingers, so the
      // page scroll is never caught by the sticky map.
      cooperativeGestures
      dragRotate={false}
      pitchWithRotate={false}
      touchPitch={false}
      // Symbols swap at once when the data changes, so a brand's red marks do
      // not outlast it (MapLibre holds and fades them for 300ms by default);
      // labels pop in and out, as nothing on the page fades.
      fadeDuration={0}
      styles={blank ? undefined : GROUND}
      blank={blank}
    >
      {blank ? null : <GroundCheck onFail={goBlank} />}
      <SiteClusters
        data={data}
        markets={markets}
        spotLabels={spotLabels}
        roleCount={ROLES.length}
        focus={focus}
        compact={narrow}
        openMarkets={openMarkets}
        cardSite={spot?.sites.length === 1 ? (spot.sites[0]?.id ?? null) : null}
        onOpenMarkets={setOpenMarkets}
        onSpotClick={openSpot}
        onHover={onHover}
      />
      {showHover ? <HoverName spot={hovered} /> : null}
      <Legend />
      <HonoluluInset points={data} ground={GROUND} blank={blank} />
      <BeforeAttribution>
        <Camera frame={focus.frame} onReset={clearMarkets} />
        <MapControls position="top-right" zoomInLabel={RESUME_DATA.map.controls.zoomIn} zoomOutLabel={RESUME_DATA.map.controls.zoomOut} />
      </BeforeAttribution>
      {spot ? (
        <MapPopup
          key={spot.n}
          longitude={spot.lng}
          latitude={spot.lat}
          // A click on another site opens its popup before this one reports closing.
          onClose={() => setSpot((s) => (s?.n === spot.n ? null : s))}
          closeButton
          closeLabel={RESUME_DATA.map.controls.close}
          // MapLibre focuses the card's first control (its X) on open; not for
          // a card a tier chip asked for, where focus stays on the chip.
          focusAfterOpen={spot.first === null || spot.focusCard}
          anchor={spot.tall ? "top" : undefined}
          offset={spot.tall ? LIST_GAP : undefined}
          // Clear of the zoom stack where the frame has room (cardPadding). Read
          // as the card opens; each spot opens a new popup.
          padding={spot.tall ? undefined : cardPadding(mapRef.current?.getCanvas().clientWidth ?? 0, prefersCoarsePointer())}
          className={`font-mono text-xs leading-normal ${narrow ? NARROW_POPUP : POPUP_WIDTH}`}
        >
          {/* One site opens its card; several (one address, or dots that
              overlap) open one list card, a row per site (see SpotCard). The
              popup stops at half the frame, so it fits above or below its dot
              wherever the dot is, and the list scrolls past that. Under 960px
              one site's compact card always fits whole. */}
          {/* A card asked for with focusCard takes focus (see ScrollFade). */}
          <ScrollFade className={spot.tall ? NARROW_TALL_LIST : narrow ? NARROW_LIST : DESKTOP_LIST} focusOnOpen={spot.first !== null && spot.focusCard}>
            <SpotCard
              sites={spot.sites}
              first={spot.first}
              card={(site, back) => (
                <SiteCard
                  site={site}
                  compact={compactCard}
                  back={back}
                  // Hidden where picking the brand would change nothing visible: under 960px
                  // (the list does not drive the map), or when the map shows this brand alone.
                  canShowBrand={!narrow && !(focus.shown?.length === 1 && focus.shown[0] === site.role)}
                  onShowBrand={() => {
                    openRoleInPlace(site.role);
                    setSpot(null);
                  }}
                  onReadRole={() => {
                    openRoleAndScroll(site.role);
                    // The page scrolls there itself; focus follows without a second jump.
                    document.getElementById(`role-toggle-${site.role}`)?.focus({ preventScroll: true });
                    setSpot(null);
                  }}
                />
              )}
            />
          </ScrollFade>
        </MapPopup>
      ) : null}
    </Map>
  );
}
