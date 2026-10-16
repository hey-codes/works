import type * as GeoJSON from "geojson";
import { RESUME_DATA } from "../data/resume-data.ts";
import { pointsFor, type Shown, type SitePoints, type SiteProps } from "./site-points.ts";

type Ordered = Pick<SiteProps, "id" | "opening" | "openedYear">;

/**
 * The order of sites that share a spot, for the map's label and the list
 * card: sites with an opening tier first, the newest opening year first and a
 * tier with no year after the dated ones; then every other site in the
 * records' order. Record ids rise in that order (spots.test.ts holds them to
 * it), so the id stands for it.
 */
export function spotOrder(a: Ordered, b: Ordered): number {
  const aOpens = a.opening !== null;
  const bOpens = b.opening !== null;
  if (aOpens !== bOpens) return aOpens ? -1 : 1;
  if (aOpens && a.openedYear !== b.openedYear) {
    if (a.openedYear === null) return 1;
    if (b.openedYear === null) return -1;
    return b.openedYear - a.openedYear;
  }
  return a.id - b.id;
}

/** A sorted copy, in `spotOrder`. */
export const orderSites = <S extends Ordered>(sites: readonly S[]): S[] => [...sites].sort(spotOrder);

/** One map label per spot: the lead site's id and city, so the site filters apply to it, and its text. */
export interface SpotLabelProps {
  id: number;
  city: string;
  label: string;
}

export type SpotLabels = GeoJSON.FeatureCollection<GeoJSON.Point, SpotLabelProps>;

/**
 * The map's site names, one per spot. A spot is the sites at exactly one
 * point; neighbours a few metres apart are two spots. A spot is named for its
 * lead (the first in `spotOrder`), as `more` ("{name} +{n}") where others
 * share the point, so one name reads for the whole spot.
 */
export function buildSpotLabels(points: SitePoints, more: string): SpotLabels {
  const spots = new Map<string, SitePoints["features"]>();
  for (const f of points.features) {
    const key = f.geometry.coordinates.join(",");
    const spot = spots.get(key);
    if (spot) spot.push(f);
    else spots.set(key, [f]);
  }
  const features: SpotLabels["features"] = [];
  for (const spot of spots.values()) {
    const [lead] = [...spot].sort((a, b) => spotOrder(a.properties, b.properties));
    if (!lead) continue;
    const others = spot.length - 1;
    const { id, city, name } = lead.properties;
    const label = others ? more.replace("{name}", name).replace("{n}", String(others)) : name;
    features.push({ type: "Feature", geometry: lead.geometry, properties: { id, city, label } });
  }
  return { type: "FeatureCollection", features };
}

/**
 * Every site at the given points, each once, in the data's order. A mark's hit
 * area is larger than a dot's, so the pointer can rest on one site of a spot;
 * the spot is read whole, as its map label is. A spot is the sites at exactly
 * one point, keyed as `buildSpotLabels` keys it.
 */
export function spotSites(points: SitePoints, coords: readonly (readonly number[])[]): SiteProps[] {
  const keys = new Set(coords.map((c) => c.join(",")));
  return points.features.filter((f) => keys.has(f.geometry.coordinates.join(","))).map((f) => f.properties);
}

/**
 * The data's own point for each site id, each once. The map hands a point back
 * rounded to its tile, which `spotSites` would not match; the data's point does.
 */
export function spotPointsOf(points: SitePoints, ids: readonly number[]): number[][] {
  const wanted = new Set(ids);
  const seen = new Set<string>();
  const found: number[][] = [];
  for (const f of points.features) {
    const key = f.geometry.coordinates.join(",");
    if (!wanted.has(f.properties.id) || seen.has(key)) continue;
    seen.add(key);
    found.push(f.geometry.coordinates);
  }
  return found;
}

const labelsByPoints = new Map<SitePoints, SpotLabels>();

/** The spot labels for what `pointsFor(role)` shows. */
export function spotLabelsFor(role: Shown): SpotLabels {
  const points = pointsFor(role);
  let labels = labelsByPoints.get(points);
  if (!labels) {
    labels = buildSpotLabels(points, RESUME_DATA.map.hoverMore);
    labelsByPoints.set(points, labels);
  }
  return labels;
}
