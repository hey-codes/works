// Replays the map's grouping and clicks, so the click budget is a test rather
// than a hope: the same clustering library and options MapLibre uses, and a
// model of a camera fit on a Web Mercator frame. Circles are sized as the
// paint sizes them and drawn bigger on top, so a market a bigger circle covers
// is clicked where it shows, or at its centre when nothing of it shows. A
// region click fits the box around its markets' sites; a market click opens
// every market circle under the pointer and fits the box around them all,
// whose sites then all show; the last click is the site's dot. Every fit is
// the map's own (framing.ts), with the padding the frame's controls set.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Supercluster } from "@maplibre/geojson-vt";
import { RESUME_DATA } from "../data/resume-data.ts";
import { marketRadius } from "./cluster-style.ts";
import { FRAME_CONTROLS, fitView, framePadding, mercatorX as mx, mercatorY as my } from "./framing.ts";
import { FIT_MAX_ZOOM, MARKET_CLUSTER_MAX_ZOOM, MARKET_CLUSTER_RADIUS, ROLE_FIT_MAX_ZOOM } from "./map-config.ts";
import {
  type Bounds,
  type Box,
  boundsOfCoords,
  buildMarkets,
  MAINLAND_BOUNDS,
  marketBounds,
  marketsInside,
  pointsFor,
  roleBounds,
  SITE_POINTS,
  type SitePoints,
  unionBox,
} from "./site-points.ts";

/**
 * The map frame at 1440, 1000 and 390 wide, canvas size in px; 390 is a
 * phone, with touch controls and, under 960px, a phone's smaller circles
 * (`compact`), so both circle modes are measured.
 */
const FRAMES = [
  { name: "1440", w: 557, h: 598, touch: false, compact: false },
  { name: "1000", w: 338, h: 478, touch: false, compact: false },
  { name: "390", w: 348, h: 318, touch: true, compact: true },
];
const TILE = 512;
/** MapLibre's tile extent; cluster radius is given in tile units. */
const EXTENT = 8192;
const ROLE_COUNT = RESUME_DATA.work.length;
/** The biggest circle, so one centred just off the frame can still cover a market in it. */
const maxRadius = (frame: Frame) => marketRadius(Number.POSITIVE_INFINITY, frame.compact);

type Frame = (typeof FRAMES)[number];
interface View {
  zoom: number;
  x: number;
  y: number;
}
interface Market extends Box {
  city: string;
  sites: number;
}
/** A market or region circle as drawn: centre in frame px, radius, and the markets it holds. */
interface Circle {
  x: number;
  y: number;
  r: number;
  sites: number;
  region: boolean;
  markets: Market[];
}

const lngOf = (x: number) => x * 360 - 180;
const latOf = (y: number) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;

/** Where a fit to `bounds` lands: the map's own fit, padded for the frame's controls. */
const fit = (bounds: Bounds, frame: Frame, maxZoom: number): View => fitView(bounds, frame, framePadding(frame.touch, frame.compact), maxZoom);

/** The frame's box in degrees, grown by `pad` px on every side. */
function visibleBox(view: View, frame: Frame, pad = 0): [number, number, number, number] {
  const scale = TILE * 2 ** view.zoom;
  const half = { x: (frame.w / 2 + pad) / scale, y: (frame.h / 2 + pad) / scale };
  return [lngOf(view.x - half.x), latOf(view.y + half.y), lngOf(view.x + half.x), latOf(view.y - half.y)];
}

/** A point on the map in frame px, from the frame's top left. */
function toFrame([lng, lat]: number[], view: View, frame: Frame) {
  const scale = TILE * 2 ** view.zoom;
  return { x: (mx(lng ?? 0) - view.x) * scale + frame.w / 2, y: (my(lat ?? 0) - view.y) * scale + frame.h / 2 };
}

const inside = (p: { x: number; y: number }, frame: Frame) => p.x >= 0 && p.x <= frame.w && p.y >= 0 && p.y <= frame.h;

function grouper(points: SitePoints) {
  const markets = buildMarkets(points, ROLE_COUNT);
  const index = new Supercluster({ radius: MARKET_CLUSTER_RADIUS * (EXTENT / TILE), extent: EXTENT, maxZoom: MARKET_CLUSTER_MAX_ZOOM, minPoints: 2 });
  index.load(markets.features);
  return { index, markets };
}
type Grouping = ReturnType<typeof grouper>;

/** The circles drawn at `view`, minus the open markets', in draw order: fewer sites first, so bigger ones sit on top. */
function circlesAt(group: Grouping, view: View, frame: Frame, open: readonly string[]): Circle[] {
  const circles: Circle[] = [];
  for (const f of group.index.getClusters(visibleBox(view, frame, maxRadius(frame)), Math.floor(view.zoom))) {
    const p = f.properties as Record<string, unknown>;
    const region = Boolean(p.cluster);
    const markets = (region ? group.index.getLeaves(p.cluster_id as number, Number.POSITIVE_INFINITY).map((l) => l.properties) : [p]) as unknown as Market[];
    if (!region && open.includes(markets[0]?.city ?? "")) continue;
    const sites = markets.reduce((n, m) => n + m.sites, 0);
    circles.push({ ...toFrame(f.geometry.coordinates, view, frame), r: marketRadius(sites, frame.compact), sites, region, markets });
  }
  return circles.sort((a, b) => a.sites - b.sites);
}

const covers = (c: Circle, p: { x: number; y: number }) => Math.hypot(p.x - c.x, p.y - c.y) <= c.r;

/**
 * Where a reader clicks `target`: its centre if nothing drawn above covers it,
 * else the first point of its disc in the frame that nothing above covers,
 * else its centre. A circle with as many sites counts as above, the worst case
 * for a tie.
 */
function clickPoint(target: Circle, circles: readonly Circle[], frame: Frame) {
  const above = circles.filter((c) => c !== target && c.sites >= target.sites);
  const centre = { x: target.x, y: target.y };
  for (const k of [0, 0.25, 0.5, 0.75, 0.95]) {
    for (let deg = 0; deg < 360; deg += k ? 10 : 360) {
      const a = (deg * Math.PI) / 180;
      const p = { x: target.x + k * target.r * Math.cos(a), y: target.y + k * target.r * Math.sin(a) };
      if (inside(p, frame) && !above.some((c) => covers(c, p))) return p;
    }
  }
  return centre;
}

/**
 * The circle a click lands on: the top one of those under it. Among circles with as
 * many sites, the worst case wins: another circle over the target, and one of
 * the other kind (region or market) over one of the same kind.
 */
function topAt(hits: readonly Circle[], target: Circle): Circle {
  const most = Math.max(...hits.map((c) => c.sites));
  const rank = (c: Circle) => (c === target ? 2 : c.region === target.region ? 1 : 0);
  return hits.filter((c) => c.sites === most).sort((a, b) => rank(a) - rank(b))[0] ?? target;
}

/**
 * What a reader's click on `target` does, as the map's click handler does it:
 * if the top circle under the pointer is a region, it flies to that region's
 * markets; otherwise it opens every market circle under the pointer.
 */
function clickOn(target: Circle, circles: readonly Circle[], frame: Frame): { region: Market[] } | { markets: Market[] } {
  const p = clickPoint(target, circles, frame);
  const hits = circles.filter((c) => covers(c, p));
  const top = topAt(hits, target);
  if (top.region) return { region: top.markets };
  return { markets: hits.filter((c) => !c.region).flatMap((c) => c.markets) };
}

/** Clicks from `start` until the site's market is open, and until its card is. Infinity when unreachable. */
function clicksTo(id: number, points: SitePoints, group: Grouping, start: View, frame: Frame) {
  const site = points.features.find((f) => f.properties.id === id);
  if (!site) return { city: Number.POSITIVE_INFINITY, card: Number.POSITIVE_INFINITY };
  const city = site.properties.city;
  let view = start;
  let open: readonly string[] = [];
  for (let clicks = 1; clicks <= 6; clicks++) {
    const circles = circlesAt(group, view, frame, open);
    const target = circles.find((c) => inside(c, frame) && c.markets.some((m) => m.city === city));
    if (!target) break;
    const click = clickOn(target, circles, frame);
    if ("region" in click) {
      // A region click flies to its markets and closes any open market.
      view = fit(marketBounds(unionBox(click.region) as Box), frame, FIT_MAX_ZOOM);
      open = [];
      continue;
    }
    // A market click flies to the box around the markets it opened, and opens the markets inside it too.
    const clicked = click.markets;
    view = fit(marketBounds(unionBox(clicked) as Box), frame, FIT_MAX_ZOOM);
    open = marketsInside(group.markets, clicked.map((m) => m.city));
    if (open.includes(city)) {
      const card = inside(toFrame(site.geometry.coordinates, view, frame), frame) ? clicks + 1 : Number.POSITIVE_INFINITY;
      return { city: clicks, card };
    }
  }
  return { city: Number.POSITIVE_INFINITY, card: Number.POSITIVE_INFINITY };
}

const mainland = (points: SitePoints) => points.features.filter((f) => (f.geometry.coordinates[0] ?? 0) > -130);

/** The worst result and the first site that reaches it, for the failure message. */
function worst(results: { id: number; city: number; card: number }[], key: "city" | "card") {
  const top = results.reduce((a, b) => (b[key] > a[key] ? b : a));
  const site = SITE_POINTS.features.find((f) => f.properties.id === top.id)?.properties;
  return { n: top[key], what: `${top[key]} clicks (site ${top.id}, ${site?.city})` };
}

const disc = (city: string, sites: number, x: number): Circle => ({
  x,
  y: 100,
  r: marketRadius(sites, false),
  sites,
  region: false,
  markets: [{ city, sites, w: 0, s: 0, e: 0, n: 0 }],
});
const opened = (click: ReturnType<typeof clickOn>) => ("markets" in click ? click.markets.map((m) => m.city).sort() : []);

test("a market wholly under a bigger one is still opened: a click there opens both", () => {
  const big = disc("Big", 60, 100);
  const small = disc("Small", 1, 106);
  assert.deepEqual(opened(clickOn(small, [small, big], FRAMES[0] as Frame)), ["Big", "Small"]);
});

test("a market partly under a bigger one is clicked where it shows, and opens alone", () => {
  const big = disc("Big", 60, 100);
  const small = disc("Small", 1, 125);
  assert.deepEqual(opened(clickOn(small, [small, big], FRAMES[0] as Frame)), ["Small"]);
});

for (const frame of FRAMES) {
  test(`at ${frame.name} wide, any mainland city is two clicks from the opening view and any site's card three`, () => {
    const group = grouper(SITE_POINTS);
    const start = fit(MAINLAND_BOUNDS, frame, 16);
    const results = mainland(SITE_POINTS).map((f) => ({ id: f.properties.id, ...clicksTo(f.properties.id, SITE_POINTS, group, start, frame) }));
    const city = worst(results, "city");
    const card = worst(results, "card");
    assert.ok(city.n <= 2, `worst city ${city.what}`);
    assert.ok(card.n <= 3, `worst card ${card.what}`);
  });

  test(`at ${frame.name} wide, with a job open, its cities are two clicks away and its cards three`, () => {
    for (let role = 0; role < ROLE_COUNT; role++) {
      const bounds = roleBounds(role);
      if (!bounds) continue;
      const points = pointsFor(role);
      const group = grouper(points);
      const start = fit(bounds, frame, ROLE_FIT_MAX_ZOOM);
      const results = mainland(points).map((f) => ({ id: f.properties.id, ...clicksTo(f.properties.id, points, group, start, frame) }));
      const city = worst(results, "city");
      const card = worst(results, "card");
      assert.ok(city.n <= 2, `role ${role}: worst city ${city.what}`);
      assert.ok(card.n <= 3, `role ${role}: worst card ${card.what}`);
    }
  });

  // Hawaii sits outside the opening view, so a reader pans there first.
  test(`at ${frame.name} wide, every Hawaii site's card is three clicks after panning to Hawaii`, () => {
    const hawaii = SITE_POINTS.features.filter((f) => (f.geometry.coordinates[0] ?? 0) < -130);
    assert.ok(hawaii.length > 0);
    const group = grouper(SITE_POINTS);
    const opening = fit(MAINLAND_BOUNDS, frame, 16);
    const box = boundsOfCoords(hawaii.map((f) => f.geometry.coordinates));
    assert.ok(box);
    const [[w, s], [e, n]] = box;
    const start = { zoom: opening.zoom, x: (mx(w) + mx(e)) / 2, y: (my(n) + my(s)) / 2 };
    const card = worst(
      hawaii.map((f) => ({ id: f.properties.id, ...clicksTo(f.properties.id, SITE_POINTS, group, start, frame) })),
      "card",
    );
    assert.ok(card.n <= 3, `worst card ${card.what}`);
  });
}

/** The frame's controls as boxes in frame px: "Show every site", the zoom stack, and the collapsed attribution. */
function controls(frame: Frame) {
  const c = frame.touch ? FRAME_CONTROLS.touch : FRAME_CONTROLS.mouse;
  const inset = FRAME_CONTROLS.inset;
  return [
    { name: "Show every site", x: inset, y: inset, w: frame.touch ? 134 : 126, h: c.resetHeight },
    { name: "the zoom stack", x: frame.w - inset - c.zoomWidth, y: inset, w: c.zoomWidth, h: frame.touch ? 90 : 66 },
    { name: "the attribution", x: frame.w - 36, y: frame.h - 36, w: 26, h: 26 },
  ];
}

/** Whether a disc of radius `r` at `p` reaches into `box`. */
function under(p: { x: number; y: number }, r: number, box: { x: number; y: number; w: number; h: number }) {
  const nx = Math.max(box.x, Math.min(p.x, box.x + box.w));
  const ny = Math.max(box.y, Math.min(p.y, box.y + box.h));
  return Math.hypot(p.x - nx, p.y - ny) < r;
}

/** A site's mark is 16px across; its dot is smaller. */
const SITE_RADIUS = 8;

for (const frame of FRAMES) {
  test(`at ${frame.name} wide, nothing a reader asked to see lands under the frame's controls`, () => {
    const boxes = controls(frame);
    const found: string[] = [];
    const check = (where: string, items: { x: number; y: number; r: number; what: string }[]) => {
      for (const it of items) for (const box of boxes) if (inside(it, frame) && under(it, it.r, box)) found.push(`${where}: ${it.what} under ${box.name}`);
    };
    for (const role of [null, ...Array.from({ length: ROLE_COUNT }, (_, i) => i)]) {
      const points = pointsFor(role);
      const bounds = role === null ? MAINLAND_BOUNDS : roleBounds(role);
      if (!bounds || (role !== null && points === SITE_POINTS)) continue;
      const group = grouper(points);
      const view = fit(bounds, frame, role === null ? 16 : ROLE_FIT_MAX_ZOOM);
      const where = role === null ? "opening view" : (RESUME_DATA.work[role]?.company ?? `role ${role}`);
      const circles = circlesAt(group, view, frame, []);
      // The view a role opens, or the opening view: every circle it draws.
      check(where, circles.map((c) => ({ ...c, what: c.region ? `a region of ${c.sites}` : (c.markets[0]?.city ?? "") })));
      // One click on each circle in the frame: a region shows its own markets, a market its own sites.
      for (const c of circles.filter((c) => inside(c, frame))) {
        const box = unionBox(c.markets) as Box;
        const next = fit(marketBounds(box), frame, FIT_MAX_ZOOM);
        const cities = c.markets.map((m) => m.city);
        if (c.region) {
          const mine = circlesAt(group, next, frame, []).filter((d) => !d.region && cities.includes(d.markets[0]?.city ?? ""));
          check(`${where}, region of ${c.sites}`, mine.map((d) => ({ ...d, what: d.markets[0]?.city ?? "" })));
        } else {
          const open = marketsInside(group.markets, cities);
          const sites = points.features
            .filter((f) => open.includes(f.properties.city))
            .map((f) => ({ ...toFrame(f.geometry.coordinates, next, frame), r: SITE_RADIUS, what: `site ${f.properties.id}` }));
          check(`${where}, ${cities[0]}`, sites);
        }
      }
    }
    assert.deepEqual(found, []);
  });
}
