import type * as GeoJSON from "geojson";
import { LOCATIONS } from "../data/locations.ts";
import { RESUME_DATA } from "../data/resume-data.ts";
import type { Opening, Site } from "./types.ts";

/** Everything the map knows about a site: what its card shows. No address, source or contact, ever; of the status, only whether it closed. */
export interface SiteProps {
  id: number;
  /** Index into `RESUME_DATA.work`. */
  role: number;
  name: string;
  type: string;
  /** Reader-facing market name, e.g. "Los Angeles". */
  city: string;
  sqft: number | null;
  /** The size is typical for that kind of store, not a recorded figure. */
  sqftEstimate: boolean;
  opening: Opening | null;
  openedYear: number | null;
  /** The records mark it closed (a relocated store counts as closed). */
  closed: boolean;
  closedYear: number | null;
}

export type SitePoints = GeoJSON.FeatureCollection<GeoJSON.Point, SiteProps>;

/**
 * A site's properties as the map hands them back. MapLibre drops null
 * properties when it tiles the data, so the empty fields return as null here.
 */
export function readSiteProps(props: Record<string, unknown>): SiteProps {
  const p = props as Partial<SiteProps> & Pick<SiteProps, "id" | "role" | "name" | "type" | "city">;
  return { ...p, sqft: p.sqft ?? null, sqftEstimate: p.sqftEstimate ?? false, opening: p.opening ?? null, openedYear: p.openedYear ?? null, closed: p.closed ?? false, closedYear: p.closedYear ?? null };
}

/** South-west and north-east corners, each `[lng, lat]`. */
export type Bounds = [[number, number], [number, number]];

/** Hawaii sits west of this line. It is on the map but not in the opening view. */
const MAINLAND_WEST = -130;

export function buildSitePoints(sites: readonly Site[], companies: readonly string[]): SitePoints {
  const roleOf = new Map(companies.map((c, i) => [c, i]));
  const features: SitePoints["features"] = [];
  for (const s of sites) {
    const role = roleOf.get(s.brand);
    if (role === undefined) continue;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lon, s.lat] },
      properties: {
        id: s.id,
        role,
        name: s.name,
        type: s.type,
        city: s.city,
        sqft: s.sqft,
        sqftEstimate: s.sqftEstimate ?? false,
        opening: s.opening ?? null,
        openedYear: s.openedYear ?? null,
        closed: s.status === "closed",
        closedYear: s.closedYear ?? null,
      },
    });
  }
  return { type: "FeatureCollection", features };
}

const OPENING_RANK: Record<Opening, number> = { opened: 3, supported: 2, "pre-opening": 1, "in-progress": 1 };

/**
 * A site's opening tier as a rank, so a market can carry its strongest:
 * opened 3, supported 2, pre-opening and in progress 1, none 0.
 */
export const openingRank = (opening: Opening | null): number => (opening ? OPENING_RANK[opening] : 0);

/** The box around a list of `[lng, lat]`, or null when the list is empty. */
export function boundsOfCoords(coords: Iterable<readonly number[]>): Bounds | null {
  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;
  for (const [lng, lat] of coords) {
    // A malformed coordinate is skipped, not read as 0, 0 off the coast of Africa.
    if (lng === undefined || lat === undefined || !Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    west = Math.min(west, lng);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    north = Math.max(north, lat);
  }
  return Number.isFinite(west)
    ? [
        [west, south],
        [east, north],
      ]
    : null;
}

/** The box around the points `keep` accepts, or null when it accepts none. */
export function boundsOf(points: SitePoints, keep: (p: SiteProps, lng: number) => boolean): Bounds | null {
  const kept = points.features.filter((f) => keep(f.properties, f.geometry.coordinates[0] ?? 0));
  return boundsOfCoords(kept.map((f) => f.geometry.coordinates));
}

export const SITE_POINTS: SitePoints = buildSitePoints(
  LOCATIONS,
  RESUME_DATA.work.map((w) => w.company),
);

/**
 * The shown sites that no opening or role view frames: Hawaii's, west of the
 * mainland. The caption offers a way to them while they are off the frame.
 */
export const farSites = (points: SitePoints): SitePoints["features"] =>
  points.features.filter((f) => (f.geometry.coordinates[0] ?? 0) <= MAINLAND_WEST);

/**
 * What the caption's far link offers for a role, or for every brand (null):
 * the far sites' place and count, from that brand's own sites only. None for a
 * role whose own sites are all in view, or that has none.
 */
export function farFor(role: number | null): { city: string; count: number } | null {
  const points = pointsFor(role);
  if (role !== null && points === SITE_POINTS) return null;
  const far = farSites(points);
  const [first] = far;
  return first ? { city: first.properties.city, count: far.length } : null;
}

/** The opening view: every site on the mainland. */
export const MAINLAND_BOUNDS: Bounds = boundsOf(SITE_POINTS, (_p, lng) => lng > MAINLAND_WEST) ?? [
  [-125, 24],
  [-66, 50],
];

/**
 * The box around one role's mainland sites, the same rule as the opening view:
 * a fit that reached Hawaii would push the rest off a narrow frame. null when
 * the role managed none.
 */
export const roleBounds = (role: number): Bounds | null =>
  boundsOf(SITE_POINTS, (p, lng) => p.role === role && lng > MAINLAND_WEST);

const byRole = new Map<number, SitePoints>();

/**
 * The sites the map shows: an open role's alone, so its clusters and counts
 * are its own. Every site when no role is open, or when the open role managed
 * none, so the map never goes blank.
 */
export function pointsFor(role: number | null): SitePoints {
  if (role === null) return SITE_POINTS;
  let points = byRole.get(role);
  if (!points) {
    const features = SITE_POINTS.features.filter((f) => f.properties.role === role);
    points = features.length ? { type: "FeatureCollection", features } : SITE_POINTS;
    byRole.set(role, points);
  }
  return points;
}

/**
 * A market: the reader-facing city name, at the middle of its sites, with how
 * many sites it holds, its strongest opening tier, how many belong to each
 * role (`r0`, `r1`, ...), and the box around them, so a click can fly to
 * exactly those sites.
 */
export interface MarketProps {
  city: string;
  /** Its place in the market list, which a region's name reads back (see LEAD_BASE in cluster-style.ts). */
  i: number;
  sites: number;
  /** The strongest opening tier among its sites (`openingRank`), 0 for none; the circle's notch shows it. */
  tier: number;
  /** How many of its sites carry an opening tier, of any kind; a notched circle's hover name says so. */
  openings: number;
  w: number;
  s: number;
  e: number;
  n: number;
  [role: `r${number}`]: number;
}

export type MarketPoints = GeoJSON.FeatureCollection<GeoJSON.Point, MarketProps>;

export function buildMarkets(points: SitePoints, roleCount: number): MarketPoints {
  const byCity = new Map<string, { coords: [number, number][]; roles: number[]; tier: number; openings: number }>();
  for (const f of points.features) {
    const entry = byCity.get(f.properties.city) ?? { coords: [], roles: Array.from({ length: roleCount }, () => 0), tier: 0, openings: 0 };
    entry.coords.push(f.geometry.coordinates as [number, number]);
    entry.roles[f.properties.role] = (entry.roles[f.properties.role] ?? 0) + 1;
    entry.tier = Math.max(entry.tier, openingRank(f.properties.opening));
    if (f.properties.opening !== null) entry.openings += 1;
    byCity.set(f.properties.city, entry);
  }
  const features: MarketPoints["features"] = [];
  for (const [city, { coords, roles, tier, openings }] of byCity) {
    const box = boundsOfCoords(coords);
    if (!box) continue;
    const [[w, s], [e, n]] = box;
    const properties: MarketProps = { city, i: features.length, sites: coords.length, tier, openings, w, s, e, n };
    roles.forEach((count, role) => {
      properties[`r${role}`] = count;
    });
    const lng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
    const lat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
    // A numeric id, so the map can mark a market whose count is covered (feature
    // state). Region circles get their own ids from the clustering, which
    // start above the number of markets, so the two never meet.
    features.push({ type: "Feature", id: features.length, geometry: { type: "Point", coordinates: [lng, lat] }, properties });
  }
  return { type: "FeatureCollection", features };
}

/** A box by its west, south, east and north edges, as a market carries it. */
export type Box = Pick<MarketProps, "w" | "s" | "e" | "n">;

/** A market's (or a group of markets') box, as map bounds. */
export const marketBounds = (p: Box): Bounds => [
  [p.w, p.s],
  [p.e, p.n],
];

/** The box around a group of markets' boxes, or null for none. */
export function unionBox(boxes: Iterable<Box>): Box | null {
  let box: Box | null = null;
  for (const b of boxes) {
    box = box ? { w: Math.min(box.w, b.w), s: Math.min(box.s, b.s), e: Math.max(box.e, b.e), n: Math.max(box.n, b.n) } : { w: b.w, s: b.s, e: b.e, n: b.n };
  }
  return box;
}

/**
 * The markets a market click opens. A click opens every market circle under
 * the pointer, so `cities` can be several; each opens once, in the order
 * given, then every other market whose point lies inside the box around them
 * all, edges included. A market drawn inside another (Beverly Hills inside Los
 * Angeles) would otherwise sit as a circle among the open markets' sites.
 * Cities that are not markets are skipped; empty when none is.
 */
export function marketsInside(markets: MarketPoints, cities: readonly string[]): string[] {
  const byCity = new Map(markets.features.map((f) => [f.properties.city, f]));
  const open = [...new Set(cities)].flatMap((city) => byCity.get(city) ?? []);
  const box = unionBox(open.map((f) => f.properties));
  if (!box) return [];
  const inside = markets.features.filter((f) => {
    if (open.includes(f)) return false;
    const [lng = Number.NaN, lat = Number.NaN] = f.geometry.coordinates;
    return lng >= box.w && lng <= box.e && lat >= box.s && lat <= box.n;
  });
  return [...open, ...inside].map((f) => f.properties.city);
}

const marketsByPoints = new Map<SitePoints, MarketPoints>();

/** The markets for what `pointsFor(role)` shows. */
export function marketsFor(role: number | null): MarketPoints {
  const points = pointsFor(role);
  let markets = marketsByPoints.get(points);
  if (!markets) {
    markets = buildMarkets(points, RESUME_DATA.work.length);
    marketsByPoints.set(points, markets);
  }
  return markets;
}
