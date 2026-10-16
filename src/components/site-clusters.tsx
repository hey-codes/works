"use client";

import type * as GeoJSON from "geojson";
import type * as MapLibreGL from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";
import { useMap } from "@/components/ui/map";
import { RESUME_DATA } from "@/data/resume-data";
import type { MapFocus } from "@/lib/atlas-reducer";
import { cityLabelPlan, type GroundPalette, groundPaint, mixHex, regionLabelPlan } from "@/lib/basemap";
import { COUNT_COVERED, HAS_TIER, MARK_ICON, MARKET_SORT_KEY, marketClusterProperties, marketLayout, marketNameField, marketRadius, marketStyle, NAME_ANCHORS, NOTCH_ICON, type Palette, siteStyle } from "@/lib/cluster-style";
import { coveredCounts, type DrawnCircle } from "@/lib/count-cover";
import { CITY_ZOOM, FIT_MAX_ZOOM, MAP_MIN_ZOOM, MARKET_CLUSTER_MAX_ZOOM, MARKET_CLUSTER_RADIUS } from "@/lib/map-config";
import { HAS_OPENING, marketFilter, openSites, restSites, siteFilter } from "@/lib/map-filters";
import { type MarketPoints, marketBounds, marketsInside, readSiteProps, type SitePoints, type SiteProps, unionBox } from "@/lib/site-points";
import { orderSites, type SpotLabels, spotPointsOf, spotSites } from "@/lib/spots";
import { flyToBounds } from "./map-flight";
import { addEdgeGuards } from "./edge-guards";
import { addMarkIcons } from "./mark-icons";

const SITES = "sites";
const MARKETS = "markets";
const MARKET_CIRCLES = "market-circles";
const MARKET_COUNTS = "market-counts";
const MARKET_NAMES = "market-names";
const MARKET_NOTCHES = "market-notches";
const SITE_DOTS = "site-dots";
const SITE_DOTS_OPEN = "site-dots-open";
const SITE_MARKS = "site-marks";
const SITE_MARKS_OPEN = "site-marks-open";
const SITE_NAMES = "site-names";
const SPOT_LABELS = "spot-labels";

/**
 * What the mouse is over, named: a dot (the sites at that address and their
 * lead's name, see spots.ts), or a market or region circle (no sites; a region
 * reads as its biggest market and how many more it holds). `more` is the
 * "+N", `lift` how far above the point the name sits, and `openings` how many
 * opening sites a circle holds (0 for a dot, whose card says so).
 */
export interface HoveredSpot {
  x: number;
  y: number;
  ids: readonly number[];
  name: string;
  more: number;
  lift: number;
  openings: number;
}

/** The spot the reader clicked and every site drawn there. */
export interface ClickedSpot {
  lng: number;
  lat: number;
  sites: readonly SiteProps[];
}

export function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string) => cs.getPropertyValue(name).trim();
  return { ink: v("--ink"), muted: v("--muted"), blue: v("--blue"), red: v("--red"), bg: v("--bg") };
}

export function readGround(): GroundPalette {
  const cs = getComputedStyle(document.documentElement);
  // A canvas hands any CSS color back as six-digit hex, which mixHex reads.
  const ctx = document.createElement("canvas").getContext("2d");
  const v = (name: string) => {
    const raw = cs.getPropertyValue(name).trim();
    if (!ctx) return raw;
    ctx.fillStyle = raw;
    return ctx.fillStyle;
  };
  return { land: v("--land"), soft: v("--soft"), edge: v("--edge"), line: v("--line"), under: v("--under"), ink: v("--ink"), muted: v("--muted") };
}

/** The markets' names in list order, which a region's name reads its biggest market from. */
const cityNames = (markets: MarketPoints) => markets.features.map((f) => f.properties.city);

/**
 * The names' text for these markets, in this theme: a region's "+N" in the
 * muted tone mixed 30% toward the ground, as quiet as CARTO's names.
 */
const nameField = (markets: MarketPoints, palette: Palette) =>
  marketNameField(cityNames(markets), RESUME_DATA.map.hoverMore, mixHex(palette.muted, palette.bg, 0.3)) as never;

function applyPaint(map: MapLibreGL.Map, layer: string, paint: Record<string, unknown>) {
  if (!map.getLayer(layer)) return;
  for (const [name, value] of Object.entries(paint)) map.setPaintProperty(layer, name as never, value as never);
}


/**
 * The sites, region then city. Markets (reader-facing city names) group into
 * region circles at the opening zoom and stand alone from zoom 3. A region
 * click flies to its markets; a market click opens every market circle under
 * the pointer, flies to them and shows their own sites, named, whatever zoom
 * fits them; from city zoom every site in view shows. Plain sites are ink
 * dots; the sites Cody opened or worked on opening are red shapes, and a
 * circle that holds any wears its strongest tier's shape on its rim. Lives
 * inside mapcn's <Map>.
 */
export function SiteClusters({
  data,
  markets,
  spotLabels,
  roleCount,
  focus,
  compact,
  openMarkets,
  cardSite,
  onOpenMarkets,
  onSpotClick,
  onHover,
}: {
  data: SitePoints;
  markets: MarketPoints;
  /** One name per spot, for what the map shows (see spots.ts). */
  spotLabels: SpotLabels;
  roleCount: number;
  focus: Pick<MapFocus, "tint">;
  /** Under 960px: a phone's smaller circles, counts and notches (see marketRadius). */
  compact: boolean;
  /** The markets a market click opened, or null when none is open. */
  openMarkets: readonly string[] | null;
  /** The site whose card is open alone, if any: its own name is not drawn under the card, which names it. */
  cardSite: number | null;
  onOpenMarkets: (cities: readonly string[] | null) => void;
  onSpotClick: (spot: ClickedSpot) => void;
  onHover: (spot: HoveredSpot | null) => void;
}) {
  const { map, isLoaded, resolvedTheme } = useMap();
  // The open markets and every market inside the box around them, so no circle is left among their sites.
  const open = useMemo(() => (openMarkets === null ? null : marketsInside(markets, openMarkets)), [markets, openMarkets]);
  // Each region's name, by its cluster id, once the clustering has told us (see nameCircle).
  const regionNames = useRef(new Map<number, { name: string; more: number }>());
  const latest = useRef({ data, markets, spotLabels, focus, compact, open, onOpenMarkets, onSpotClick, onHover, regionNames: regionNames.current });
  latest.current = { data, markets, spotLabels, focus, compact, open, onOpenMarkets, onSpotClick, onHover, regionNames: regionNames.current };

  // Sources, icons and layers. isLoaded drops to false while a theme change
  // reloads the style, which discards all of them; this runs again after.
  useEffect(() => {
    if (!map || !isLoaded) return;
    const palette = readPalette();
    const mk = marketStyle(latest.current.focus, palette, latest.current.compact);
    const ml = marketLayout(latest.current.compact);
    const st = siteStyle(latest.current.focus, palette);
    // Map text comes from the tile provider's glyphs; CARTO has no mono. The
    // blank ground (CARTO unreachable) has none, so no counts or names there.
    const text = Boolean(map.getStyle().glyphs);

    addMarkIcons(map, palette);
    map.addSource(MARKETS, {
      type: "geojson",
      data: latest.current.markets,
      cluster: true,
      clusterRadius: MARKET_CLUSTER_RADIUS,
      clusterMaxZoom: MARKET_CLUSTER_MAX_ZOOM,
      clusterProperties: marketClusterProperties(roleCount) as never,
    });
    map.addSource(SITES, { type: "geojson", data: latest.current.data });
    map.addSource(SPOT_LABELS, { type: "geojson", data: latest.current.spotLabels });

    // The circles have no maxzoom: from city zoom they are drawn at an
    // opacity of 0 by a step on the camera's zoom (underCityZoom), so the
    // market tiles there still hold them, and on the way back out they show
    // on the first frame under city zoom, from the tiles already on screen,
    // before the zoom below's tiles load. Counts and names stop at city zoom,
    // so they wait for those tiles.
    map.addLayer({
      id: MARKET_CIRCLES,
      type: "circle",
      source: MARKETS,
      // A higher key draws on top and is hit first, so where two circles
      // overlap the market with more sites shows whole, as it keeps its name.
      layout: { "circle-sort-key": MARKET_SORT_KEY as never },
      paint: mk.circles as never,
    });
    if (text) {
      map.addLayer({
        id: MARKET_NAMES,
        type: "symbol",
        source: MARKETS,
        maxzoom: CITY_ZOOM,
        layout: {
          // A market by its city, a region by its biggest market and how many
          // more it holds ("NEW YORK +13"), as its hover name reads.
          "text-field": nameField(latest.current.markets, palette),
          "text-font": ["Open Sans Semibold"],
          "text-size": 11,
          "text-transform": "uppercase",
          "text-letter-spacing": 0.08,
          // Wide enough that "DALLAS-FORT WORTH" (about 143px in spaced caps)
          // keeps one line; the default 10em broke it at the hyphen.
          "text-max-width": 14,
          // Under its circle, or above it where that place is taken.
          "text-variable-anchor": [...NAME_ANCHORS],
          "text-radial-offset": ml.names["text-radial-offset"] as never,
          // Where two names collide, the circle with more sites keeps its name.
          "symbol-sort-key": ["-", ["get", "sites"]],
        },
        paint: mk.names as never,
      });
    }
    // A circle that holds an opening wears its strongest tier's mark on its
    // rim, top right. The notches sit between the names and the counts:
    // MapLibre places the upper layer's symbols first, so a count is placed
    // and drawn over any notch, and a notch, always drawn, holds its room, so
    // a name that would cross it is not drawn at that zoom, as with a count.
    // The notch is an icon and needs no glyphs, so it shows on the blank
    // ground too. Its opacity steps out at city zoom with the circles, and the
    // layer stops there too: an icon at opacity 0 is still placed, and would
    // keep a hidden collision box that drops CARTO's labels beneath it.
    map.addLayer({
      id: MARKET_NOTCHES,
      type: "symbol",
      source: MARKETS,
      maxzoom: CITY_ZOOM,
      filter: HAS_TIER as never,
      layout: { "icon-image": NOTCH_ICON as never, ...(ml.notches as object), "icon-allow-overlap": true },
      paint: mk.notches as never,
    });
    if (text) {
      // Counts sit above the names and the notches. MapLibre places the top
      // layer's text first, and a count is always placed and holds its room, so
      // a name that would cross a count is not drawn there. Where two circles
      // overlap, the smaller one's count is hidden by its opacity instead (see
      // coverCounts below), as is a phone's under 10 sites (COUNT_FROM); a
      // hidden count still holds its room.
      map.addLayer({
        id: MARKET_COUNTS,
        type: "symbol",
        source: MARKETS,
        maxzoom: CITY_ZOOM,
        layout: { "text-field": ["to-string", ["get", "sites"]], "text-font": ["Open Sans Semibold"], ...(ml.counts as object), "text-allow-overlap": true },
        paint: mk.counts as never,
      });
    }
    // Dots and marks each have two layers: the rest, drawn from city zoom, and
    // the open markets' sites, drawn at any zoom (see the filter effect below).
    const markLayout = { "icon-image": MARK_ICON as never, "icon-allow-overlap": true, "icon-ignore-placement": true };
    map.addLayer({ id: SITE_DOTS, type: "circle", source: SITES, paint: st.dots as never });
    // The open layers draw at any zoom, so they start filtered and never draw every site.
    const openNow = openSites(latest.current.open);
    map.addLayer({ id: SITE_DOTS_OPEN, type: "circle", source: SITES, filter: ["all", openNow, ["!", HAS_OPENING]] as never, paint: st.openDots as never });
    map.addLayer({ id: SITE_MARKS, type: "symbol", source: SITES, layout: markLayout, paint: st.marks as never });
    map.addLayer({ id: SITE_MARKS_OPEN, type: "symbol", source: SITES, filter: ["all", openNow, HAS_OPENING] as never, layout: markLayout, paint: st.openMarks as never });
    if (text) {
      // One name per spot: its lead's, "Name +2" where others share the point.
      map.addLayer({
        id: SITE_NAMES,
        type: "symbol",
        source: SPOT_LABELS,
        layout: { "text-field": ["get", "label"], "text-font": ["Open Sans Regular"], "text-size": 11, "text-anchor": "top", "text-offset": [0, 0.9], "text-max-width": 10 },
        paint: st.names as never,
      });
    }
    // Last, so they are placed first: no name is drawn across the frame's edge.
    const dropGuards = text ? addEdgeGuards(map) : () => {};
    // CARTO's ground in the site's colors (basemap.ts). A theme change loads
    // CARTO's other style and this runs again with the new theme's tokens.
    // The blank ground has no CARTO layers to recolor.
    if (text) for (const [id, property, value] of groundPaint(map.getStyle().layers ?? [], readGround())) map.setPaintProperty(id, property as never, value as never);
    // Our market names show from the lowest zoom, so CARTO's city names never do.
    const plan = cityLabelPlan(map.getStyle().layers ?? [], MAP_MIN_ZOOM);
    for (const id of plan.hide) map.setLayoutProperty(id, "visibility", "none");
    for (const l of plan.stopAt) map.setLayerZoomRange(l.id, l.minzoom, l.maxzoom);
    // Country and state names wait for city zoom, so none reads as a circle's name.
    const regions = regionLabelPlan(map.getStyle().layers ?? [], CITY_ZOOM);
    for (const id of regions.hide) map.setLayoutProperty(id, "visibility", "none");
    for (const l of regions.startAt) map.setLayerZoomRange(l.id, l.minzoom, l.maxzoom);

    // Dots and marks are four layers, so one handler reads them all: sites at
    // one address share a card whatever they are drawn as, and one click opens
    // one thing. Sites sit above the market circles, so a site under the
    // pointer wins.
    // A query that lands between a source's new data and its tiles' new index
    // throws in MapLibre's tile reader ("feature index out of bounds"); a brand
    // change swaps the data while counts are checked every frame. That frame
    // reads nothing, and the next one, a few milliseconds on, reads the new tiles.
    const query: typeof map.queryRenderedFeatures = (...args: Parameters<typeof map.queryRenderedFeatures>) => {
      try {
        return map.queryRenderedFeatures(...args);
      } catch {
        return [];
      }
    };
    const siteLayers = () => [SITE_DOTS, SITE_DOTS_OPEN, SITE_MARKS, SITE_MARKS_OPEN].filter((l) => map.getLayer(l));
    // Under city zoom the rest layers' tiles hold sites at an opacity of 0
    // (see fromCityZoom), which a query still returns; a click or a hover
    // reads only the sites drawn, by the same rule on the camera's zoom.
    const drawn = (site: SiteProps) => map.getZoom() >= CITY_ZOOM || (latest.current.open?.includes(site.city) ?? false);
    const sitesUnder = (point: MapLibreGL.PointLike) =>
      query(point, { layers: siteLayers() })
        .map((f) => ({
          site: readSiteProps(f.properties ?? {}),
          coords: (f.geometry as GeoJSON.Point).coordinates as [number, number],
        }))
        .filter((u) => drawn(u.site));
    // Every site at the spots of the dots under the pointer. The map hands a
    // point back rounded to its tile, so each spot is found by its sites' own
    // point in the data.
    const spotsOf = (under: readonly { site: SiteProps }[]) => {
      const { data: points } = latest.current;
      return spotSites(points, spotPointsOf(points, under.map((u) => u.site.id)));
    };
    // Every market and region circle under the pointer, top first. From city
    // zoom the circles are drawn at an opacity of 0, which a query still
    // returns, so there they take no click and show no pointer.
    const circlesUnder = (point: MapLibreGL.PointLike) =>
      map.getLayer(MARKET_CIRCLES) && map.getZoom() < CITY_ZOOM ? query(point, { layers: [MARKET_CIRCLES] }) : [];
    const marketsUnder = (point: MapLibreGL.PointLike) => circlesUnder(point).map((f) => (f.properties ?? {}) as Record<string, number | string>);
    const boxOf = (p: Record<string, number | string>) => ({ w: Number(p.w), s: Number(p.s), e: Number(p.e), n: Number(p.n) });
    const isRegion = (p: Record<string, number | string>) => p.point_count !== undefined;

    const onClick = (e: MapLibreGL.MapMouseEvent) => {
      const under = sitesUnder(e.point);
      const top = under[0];
      if (top) {
        const [lng, lat] = top.coords;
        // A tap on any part of a spot, or on dots that overlap, reads every site at those points.
        const sites = spotsOf(under);
        if (sites.length) latest.current.onSpotClick({ lng, lat, sites });
        return;
      }
      const circles = marketsUnder(e.point);
      const first = circles[0];
      if (!first) return;
      // A region circle on top flies to its markets and closes any open market.
      if (isRegion(first)) {
        latest.current.onOpenMarkets(null);
        flyToBounds(map, marketBounds(boxOf(first)), FIT_MAX_ZOOM);
        return;
      }
      // Otherwise every market circle under the pointer opens, so a market
      // drawn under another opens with it, and the flight fits them all.
      const clicked = circles.filter((p) => !isRegion(p));
      const box = unionBox(clicked.map(boxOf));
      if (!box) return;
      latest.current.onOpenMarkets([...new Set(clicked.map((p) => String(p.city)))]);
      flyToBounds(map, marketBounds(box), FIT_MAX_ZOOM);
    };

    // A circle names itself on hover: a market by its own name, which can give
    // way to a count on the map, and a region, which has none, by its biggest
    // market and how many more it holds ("New York +13"). A region's markets
    // come from the clustering, which answers later; the answer is kept, and
    // shown only if the mouse is still over that region.
    let hoveredRegion: number | null = null;
    const nameCircle = (f: MapLibreGL.MapGeoJSONFeature) => {
      const p = (f.properties ?? {}) as Record<string, number | string>;
      const at = map.project((f.geometry as GeoJSON.Point).coordinates as [number, number]);
      const show = (name: string, more: number) =>
        latest.current.onHover({ x: at.x, y: at.y, ids: [], name, more, lift: marketRadius(Number(p.sites), latest.current.compact) + 6, openings: Number(p.openings) || 0 });
      if (!isRegion(p)) {
        hoveredRegion = null;
        show(String(p.city), 0);
        return;
      }
      const id = Number(p.cluster_id);
      hoveredRegion = id;
      const known = latest.current.regionNames.get(id);
      if (known) {
        show(known.name, known.more);
        return;
      }
      (map.getSource(MARKETS) as MapLibreGL.GeoJSONSource | undefined)?.getClusterLeaves(id, Number.POSITIVE_INFINITY, 0).then(
        (leaves) => {
          const markets = leaves.map((l) => l.properties as { city: string; sites: number });
          const lead = markets.reduce((a, b) => (b.sites > a.sites ? b : a));
          const named = { name: lead.city, more: markets.length - 1 };
          latest.current.regionNames.set(id, named);
          if (hoveredRegion === id) show(named.name, named.more);
        },
        // A style reload or a brand change can drop the source mid-question; the next move asks again.
        () => undefined,
      );
    };

    const onMove = (e: MapLibreGL.MapMouseEvent) => {
      const under = sitesUnder(e.point);
      const top = under[0];
      const circle = top ? undefined : circlesUnder(e.point)[0];
      map.getCanvas().style.cursor = top || circle ? "pointer" : "";
      if (!top) {
        if (circle) nameCircle(circle);
        else clearHover();
        return;
      }
      hoveredRegion = null;
      // The whole spot is read, whichever of its dots or marks is under the pointer,
      // and named for its lead, as its map label is.
      const here = orderSites(spotsOf([top]));
      const at = map.project(top.coords);
      latest.current.onHover({ x: at.x, y: at.y, ids: here.map((s) => s.id), name: (here[0] ?? top.site).name, more: here.length - 1, lift: 12, openings: 0 });
    };
    function clearHover() {
      hoveredRegion = null;
      latest.current.onHover(null);
    }
    // Under zoom 3 markets merge back into region circles, and the open
    // markets' sites would sit on the region that also counts them, so a zoom
    // out by hand past zoom 3 closes them. Only the crossing does: a market
    // opened from the opening view flies in from under zoom 3.
    let marketZoom = map.getZoom() >= MARKET_CLUSTER_MAX_ZOOM + 1;
    const onZoom = () => {
      const nowMarketZoom = map.getZoom() >= MARKET_CLUSTER_MAX_ZOOM + 1;
      if (marketZoom && !nowMarketZoom) latest.current.onOpenMarkets(null);
      marketZoom = nowMarketZoom;
    };

    // Where two circles overlap, only the bigger one's count shows. After each
    // frame the map draws, every circle drawn is checked against the others
    // and a covered one is marked in feature state, which its count's opacity
    // reads. Only changes are written, so a still map draws no extra frame.
    // From city zoom no circle or count is drawn, so there is nothing to
    // check; the first frame back under it checks every circle again.
    const coverCounts = () => {
      if (map.getZoom() >= CITY_ZOOM || !map.getLayer(MARKET_COUNTS)) return;
      const drawn = new Map<number, DrawnCircle>();
      for (const f of query({ layers: [MARKET_CIRCLES] })) {
        // A circle near a tile edge can come back once per tile.
        if (typeof f.id !== "number" || drawn.has(f.id)) continue;
        const { x, y } = map.project((f.geometry as GeoJSON.Point).coordinates as [number, number]);
        drawn.set(f.id, { id: f.id, x, y, sites: Number(f.properties?.sites) });
      }
      const covered = coveredCounts([...drawn.values()], latest.current.compact);
      for (const id of drawn.keys()) {
        const target = { source: MARKETS, id };
        const want = covered.has(id);
        if (Boolean(map.getFeatureState(target)[COUNT_COVERED]) !== want) map.setFeatureState(target, { [COUNT_COVERED]: want });
      }
    };

    map.on("click", onClick);
    map.on("mousemove", onMove);
    map.on("mouseout", clearHover);
    map.on("movestart", clearHover);
    map.on("zoom", onZoom);
    map.on("render", coverCounts);
    onZoom();

    return () => {
      map.off("render", coverCounts);
      map.off("click", onClick);
      map.off("mousemove", onMove);
      map.off("mouseout", clearHover);
      map.off("movestart", clearHover);
      map.off("zoom", onZoom);
      dropGuards();
      latest.current.onHover(null);
      // The map may already be gone (unmount) or mid style swap.
      try {
        for (const layer of [SITE_NAMES, SITE_MARKS_OPEN, SITE_MARKS, SITE_DOTS_OPEN, SITE_DOTS, MARKET_NAMES, MARKET_NOTCHES, MARKET_COUNTS, MARKET_CIRCLES]) if (map.getLayer(layer)) map.removeLayer(layer);
        for (const source of [SITES, SPOT_LABELS, MARKETS]) if (map.getSource(source)) map.removeSource(source);
      } catch {
        // Nothing to clean up.
      }
    };
  }, [map, isLoaded, roleCount]);

  // A role opened or closed: swap what the sources hold. Market ids start
  // again from 0, so no covered mark is carried over to a new market.
  useEffect(() => {
    if (!map || !isLoaded) return;
    (map.getSource(SITES) as MapLibreGL.GeoJSONSource | undefined)?.setData(data);
    (map.getSource(SPOT_LABELS) as MapLibreGL.GeoJSONSource | undefined)?.setData(spotLabels);
    const source = map.getSource(MARKETS) as MapLibreGL.GeoJSONSource | undefined;
    if (map.getLayer(MARKET_NAMES)) map.setLayoutProperty(MARKET_NAMES, "text-field", nameField(markets, readPalette()));
    if (source) {
      map.removeFeatureState({ source: MARKETS });
      // New markets cluster afresh, so a region id may now name another region.
      regionNames.current.clear();
      source.setData(markets);
    }
  }, [map, isLoaded, data, spotLabels, markets]);

  // Which sites each layer holds and which market circles show. The open
  // markets' sites have their own dot and mark layers, drawn at any zoom. The
  // rest are held by tiles from the zoom below city zoom and drawn from city
  // zoom by a step on the camera's zoom (fromCityZoom): they show the frame
  // the camera reaches it, from whatever tiles of zoom 8 or deeper are on
  // screen (a tile from further out holds none of them). Names switch by tile
  // at city zoom itself, so a site not drawn never takes a label's room. The
  // open markets' circles, and those of the markets they take in, step out;
  // an open market's notch goes with its circle.
  useEffect(() => {
    if (!map || !isLoaded) return;
    const set = (layer: string, filter: unknown) => {
      if (map.getLayer(layer)) map.setFilter(layer, filter as never);
    };
    const rest = restSites(open, CITY_ZOOM - 1);
    set(SITE_DOTS, ["all", rest, ["!", HAS_OPENING]]);
    set(SITE_DOTS_OPEN, ["all", openSites(open), ["!", HAS_OPENING]]);
    set(SITE_MARKS, ["all", rest, HAS_OPENING]);
    set(SITE_MARKS_OPEN, ["all", openSites(open), HAS_OPENING]);
    // A site's card names it, so its name on the map is not drawn while the
    // card is open: a card set beside or under its dot would cover part of it
    // (Cody, 2026-10-15).
    const names = siteFilter(open, CITY_ZOOM);
    set(SITE_NAMES, cardSite === null ? names : ["all", names, ["!=", ["get", "id"], cardSite]]);
    set(MARKET_CIRCLES, marketFilter(open));
    set(MARKET_COUNTS, marketFilter(open));
    set(MARKET_NOTCHES, ["all", HAS_TIER, marketFilter(open)]);
    set(MARKET_NAMES, marketFilter(open));
  }, [map, isLoaded, open, cardSite]);

  // The marks in the new theme's red. A theme change on CARTO reloads the
  // style and setup draws them again; on the blank ground both themes share
  // one style, nothing reloads, and only this redraws them.
  useEffect(() => {
    if (!map || !isLoaded) return;
    addMarkIcons(map, readPalette());
  }, [map, isLoaded, resolvedTheme]);

  // Phone or desktop sizes, written in place when the window crosses 960px:
  // the counts, names and notches here, the circles' radius with the paint
  // below. MapLibre lays the symbols out again from the tiles it holds, so
  // the source is not reloaded and nothing flashes. A value already set is
  // left alone, so the first run after setup writes nothing.
  useEffect(() => {
    if (!map || !isLoaded) return;
    const layout = marketLayout(compact);
    const set = (layer: string, props: Record<string, unknown>) => {
      if (!map.getLayer(layer)) return;
      for (const [name, value] of Object.entries(props)) map.setLayoutProperty(layer, name as never, value as never);
    };
    set(MARKET_COUNTS, layout.counts);
    set(MARKET_NAMES, layout.names);
    set(MARKET_NOTCHES, layout.notches);
  }, [map, isLoaded, compact]);

  // Restyle in place when the tint, the theme or the mode changes.
  useEffect(() => {
    if (!map || !isLoaded) return;
    const palette = readPalette();
    const mk = marketStyle(focus, palette, compact);
    const st = siteStyle(focus, palette);
    applyPaint(map, MARKET_CIRCLES, mk.circles);
    applyPaint(map, MARKET_COUNTS, mk.counts);
    applyPaint(map, MARKET_NAMES, mk.names);
    // The "+N" tone is in the names' text, so a theme change writes it again.
    if (map.getLayer(MARKET_NAMES)) map.setLayoutProperty(MARKET_NAMES, "text-field", nameField(latest.current.markets, palette));
    applyPaint(map, MARKET_NOTCHES, mk.notches);
    applyPaint(map, SITE_DOTS, st.dots);
    applyPaint(map, SITE_DOTS_OPEN, st.openDots);
    applyPaint(map, SITE_MARKS, st.marks);
    applyPaint(map, SITE_MARKS_OPEN, st.openMarks);
    applyPaint(map, SITE_NAMES, st.names);
  }, [map, isLoaded, focus, resolvedTheme, compact]);

  return null;
}
