import type { SitePoints } from "./site-points.ts";
import type { Opening } from "./types.ts";

/** The project types in the legend's order (Cody, 2026-10-15). */
export const PROJECT_ORDER: readonly Opening[] = ["nso", "construction", "relocation", "renovation"];

/**
 * The project types the records hold, in the legend's order, so the legend
 * names only what the map can show: relocation and renovation appear once
 * sites carry them. Read in the map's chunk, so the location records stay out
 * of the page's first script.
 */
export function projectTypes(points: SitePoints): Opening[] {
  const held = new Set(points.features.map((f) => f.properties.opening));
  return PROJECT_ORDER.filter((type) => held.has(type));
}
