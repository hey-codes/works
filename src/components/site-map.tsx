"use client";

import type * as MapLibreGL from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Map, MapControls, MapPopup, useMap } from "@/components/ui/map";
import { RESUME_DATA } from "@/data/resume-data";
import { showEverySiteFlies } from "@/lib/flight";
import { cardPadding, framePadding } from "@/lib/framing";
import { FIT_MAX_ZOOM, MAP_MAX_ZOOM, MAP_MIN_ZOOM, ROLE_FIT_MAX_ZOOM } from "@/lib/map-config";
import { openingTiers, type OpeningTier, portfolioTiers } from "@/lib/openings";
import { boundsOfCoords, farFor, farSites, MAINLAND_BOUNDS, marketsFor, pointsFor, roleBounds, SITE_POINTS, type SitePoints } from "@/lib/site-points";
import { spotLabelsFor, spotPointsOf, spotSites } from "@/lib/spots";
import { motionMs, prefersCoarsePointer, prefersReducedMotion, useMediaQuery } from "@/lib/use-media-query";
import { useAtlas } from "./atlas-state";
import { cameraFor, flyToBounds } from "./map-flight";
import { SiteCard } from "./site-card";
import { SpotCard } from "./spot-card";
import { type ClickedSpot, type HoveredSpot, SiteClusters } from "./site-clusters";

const ROLES = RESUME_DATA.work;
/** Each site's role, by site id, so a dot under the mouse can trace its role. (`Map` here is mapcn's map.) */
const ROLE_OF = new globalThis.Map(SITE_POINTS.features.map((f) => [f.properties.id, f.properties.role]));

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
 * The camera follows the open role and nothing else. It flies when that role
 * changes: never on hover, never for a traced system, and never because the
 * theme reloaded. It also owns "Show every site": from a brand's view or with
 * a market open it leaves the camera where it is, and only a press with every
 * brand shown and nothing open flies out to the opening view.
 */
function Camera({ frame, brandAlone, marketOpen, onReset }: { frame: number | null; brandAlone: boolean; marketOpen: boolean; onReset: () => void }) {
  const { map, isLoaded } = useMap();
  const { showAll } = useAtlas();
  // undefined until the map first loads and takes its opening view.
  const framed = useRef<number | null | undefined>(undefined);
  // Set when "Show every site" must not move the camera, so the frame change it causes is swallowed.
  const hold = useRef(false);

  useEffect(() => {
    if (!map || !isLoaded || framed.current === frame) return;
    // "Show every site" from a brand's view leaves the camera where it is.
    if (hold.current) {
      hold.current = false;
      framed.current = frame;
      return;
    }
    const bounds = frame === null ? MAINLAND_BOUNDS : roleBounds(frame);
    // A role with no sites leaves the view where it is.
    if (!bounds) return;
    // The first view is a jump, not a flight: the map opened on its own fit
    // of these bounds, which this matches but for the zoom floor's rule (a
    // box too tall for the phone frame keeps clear of the top controls).
    const first = framed.current === undefined;
    framed.current = frame;
    if (first) map.jumpTo(cameraFor(map, bounds, frame === null ? MAP_MAX_ZOOM : ROLE_FIT_MAX_ZOOM));
    else flyToBounds(map, bounds, ROLE_FIT_MAX_ZOOM);
  }, [map, isLoaded, frame]);

  // The hold covers the one frame change "Show every site" causes. This runs
  // after the effect above on every change of frame, so a hold that effect
  // returned before consuming (a role with no sites, or the map not loaded)
  // cannot stay armed and swallow a later flight.
  useEffect(() => {
    hold.current = false;
  }, [frame]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    map.getCanvas().setAttribute("aria-label", RESUME_DATA.map.label);
    // The credit starts as its (i) button, as MapLibre leaves it after a drag,
    // so its 300px bar never lies over the sites; the button opens it.
    map.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
  }, [map, isLoaded]);

  // Every brand back, open rows kept, any open market closed. The camera stays
  // where the reader is looking; only with every brand already shown and no
  // market open does it fly out to the opening view.
  const showEverySite = () => {
    const flies = showEverySiteFlies(brandAlone, marketOpen);
    // Framed on a role, the frame changes on showAll. A press that stays holds
    // the camera through that change; one that flies (a trace, with every brand
    // shown and the role framed) lets that change make the one flight out.
    if (!flies && frame !== null) hold.current = true;
    showAll();
    onReset();
    if (map && flies && framed.current === null) flyToBounds(map, MAINLAND_BOUNDS, ROLE_FIT_MAX_ZOOM);
  };

  return (
    <button
      type="button"
      onClick={showEverySite}
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

/**
 * What the caption shows of the map: the brand drawn (`role`, null for every
 * brand), whether its far sites (Honolulu's) are off the frame and their
 * place and count, and its opening tiers. Worked out here, in the map's
 * chunk, so the page's first script never carries the location records.
 */
export interface MapReport {
  role: number | null;
  offFrame: boolean;
  far: { city: string; count: number } | null;
  tiers: OpeningTier[];
}

/**
 * Reports to the caption, after every move and every change of brand, and
 * hands it the flight to the far sites. The flight starts by giving focus to
 * the map, since the caption's link goes once the sites are in view. When the
 * map goes (its error boundary caught, or it unmounted), the report and the
 * flight go with it, so the caption drops the tier chips and the far link.
 */
function MapReporter({ data, role, onReport, goRef }: { data: SitePoints; role: number | null; onReport: (report: MapReport | null) => void; goRef: React.RefObject<(() => void) | null> }) {
  const { map } = useMap();
  useEffect(() => {
    if (!map) return;
    const far = farFor(role);
    const tiers = role === null ? portfolioTiers(RESUME_DATA.work.length) : openingTiers(role);
    const coords = farSites(data).map((f) => f.geometry.coordinates as [number, number]);
    const check = () => {
      const view = map.getBounds();
      onReport({ role, offFrame: coords.length > 0 && !coords.some((c) => view.contains(c)), far, tiers });
    };
    goRef.current = coords.length
      ? () => {
          const box = boundsOfCoords(coords);
          if (!box) return;
          map.getCanvas().focus({ preventScroll: true });
          flyToBounds(map, box, FIT_MAX_ZOOM);
        }
      : null;
    check();
    map.on("moveend", check);
    return () => {
      map.off("moveend", check);
      goRef.current = null;
      onReport(null);
    };
  }, [map, data, role, onReport, goRef]);
  return null;
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

/**
 * Every site, explorable. Loaded after first paint by map-aside, which shows
 * the caption: `onReport` tells it what the map shows (see MapReport), and
 * `goAway` holds the flight to the far sites.
 */
export default function SiteMap({ onReport, goAway }: { onReport: (report: MapReport | null) => void; goAway: React.RefObject<(() => void) | null> }) {
  const { focus, narrow, sysActive, openRoleAndScroll, openRoleInPlace, siteAsk, hover } = useAtlas();
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
  // A dot under the mouse traces its role, as hovering the role's row does:
  // the row lights and the map rings that role's markets. Only a role this
  // set is cleared here, so a flight that starts under a hovered row (which
  // clears the map's hover) leaves the row's own hover alone. From 960px,
  // where the list drives the map.
  const dotRole = useRef<number | null>(null);
  const onHover = useCallback(
    (h: HoveredSpot | null) => {
      setHovered(h);
      const lead = h?.ids[0];
      const role = lead === undefined || narrowNow.current ? null : (ROLE_OF.get(lead) ?? null);
      if (role === dotRole.current) return;
      if (role !== null) hover(role);
      else hover(null);
      dotRole.current = role;
    },
    [hover],
  );
  // Mouse only: touch has no hover, and a tap opens the card anyway.
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  // The map's layout switches at 960px (`narrow`), the card's at 1280px: from
  // 960 to 1279 the map column is 320 to 380px wide, too short for the desktop
  // card's rows, so the card keeps the compact layout there too (Cody, 2026-10-14).
  const compactCard = useMediaQuery("(max-width: 1279.98px)");
  const showHover = canHover && hovered && !(spot && spot.sites.some((s) => hovered.ids.includes(s.id)));

  // An open role is shown alone: its sites, its clusters, its markets.
  const data = pointsFor(focus.selected);
  const markets = marketsFor(focus.selected);
  const spotLabels = spotLabelsFor(focus.selected);
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

  // A site asked for from outside the map (a caption tier chip): its brand is
  // shown (opening its role, if another is), the map flies to it and its card
  // opens, with focus in it only if asked (a chip keeps focus, so the reader
  // can press again). A request waits a render for its brand's sites to be drawn.
  const answered = useRef(0);
  const roleAsked = useRef(0);
  // The card waiting for its flight to land. A flight cut short still ends in
  // a moveend (flyTo stops the one before it), so a waiting card is let go
  // before the next flight, or it would open at the half-flown camera.
  const landing = useRef<(() => void) | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!siteAsk || answered.current === siteAsk.n || !map) return;
    const site = SITE_POINTS.features.find((f) => f.properties.id === siteAsk.id);
    const drawn = data.features.some((f) => f.properties.id === siteAsk.id);
    // Not drawn: open its role once (a trace keeps every brand on, which draws it anyway).
    if (site && !drawn && roleAsked.current !== siteAsk.n) {
      roleAsked.current = siteAsk.n;
      openRoleInPlace(site.properties.role);
      return;
    }
    answered.current = siteAsk.n;
    if (!site || !drawn) return;
    const [lng = 0, lat = 0] = site.geometry.coordinates;
    const open = () => openSpot({ lng, lat, sites: spotSites(data, [[lng, lat]]) }, { first: siteAsk.id, returnTo: siteAsk.from, focusCard: siteAsk.focusCard });
    const letGo = () => {
      if (landing.current) map.off("moveend", landing.current);
      landing.current = null;
    };
    letGo();
    flyToBounds(map, [[lng, lat], [lng, lat]], FIT_MAX_ZOOM);
    // A jump (reduced motion) has landed already; a flight opens the card where it lands.
    if (prefersReducedMotion()) {
      open();
      return;
    }
    const land = () => {
      landing.current = null;
      open();
    };
    landing.current = land;
    map.once("moveend", land);
    return letGo;
  }, [siteAsk, data, openRoleInPlace, openSpot]);

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
      {/* The brand drawn: none when every brand is (a role with no sites of its own draws them all). */}
      <MapReporter data={data} role={data === SITE_POINTS ? null : focus.selected} onReport={onReport} goRef={goAway} />
      {showHover ? <HoverName spot={hovered} /> : null}
      <BeforeAttribution>
        <Camera frame={focus.frame} brandAlone={focus.selected !== null} marketOpen={openMarkets !== null} onReset={clearMarkets} />
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
                  // Hidden where showing the brand would change nothing visible: under 960px
                  // (the list does not drive the map), while a system is traced (every brand
                  // stays on), or when the map already shows this brand.
                  canShowBrand={!narrow && !sysActive && focus.selected !== site.role}
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
