import { SITE_POINTS } from "./site-points.ts";
import { orderSites } from "./spots.ts";
import type { Opening } from "./types.ts";

/**
 * One opening site of a role: its id and name, which a tier chip opens and
 * names, its flag, and the year it opened, which orders it (`spotOrder`).
 */
export interface OpeningRow {
  id: number;
  name: string;
  opening: Opening;
  openedYear: number | null;
}

/**
 * Each role's opening sites, by role index, in the list card's order
 * (`spotOrder`): newest opening year first, an undated tier after the dated
 * ones, then the records' order. They feed the caption's tier chips, through
 * `openingTiers`, read in the map's chunk so the location records stay out of
 * the page's first script.
 */
export function openingsByRole(roleCount: number): OpeningRow[][] {
  const rows: OpeningRow[][] = Array.from({ length: roleCount }, () => []);
  for (const { properties: p } of SITE_POINTS.features) {
    if (p.opening === null) continue;
    rows[p.role]?.push({ id: p.id, name: p.name, opening: p.opening, openedYear: p.openedYear });
  }
  return rows.map((band) => orderSites(band));
}

/** One opening tier of a role: its flag and its sites, newest opening first. */
export interface OpeningTier {
  opening: Opening;
  sites: { id: number; name: string }[];
}

const TIER_ORDER: readonly Opening[] = ["opened", "supported", "pre-opening", "in-progress"];

/**
 * A role's openings by tier, in the flags' order, for the caption's tier
 * chips. Read in the map's chunk, never the page's first script.
 */
export function openingTiers(role: number): OpeningTier[] {
  const rows = openingsByRole(role + 1)[role] ?? [];
  return TIER_ORDER.flatMap((opening) => {
    const sites = rows.filter((r) => r.opening === opening).map((r) => ({ id: r.id, name: r.name }));
    return sites.length ? [{ opening, sites }] : [];
  });
}

/**
 * Every role's openings by tier, for the "Every location" caption's chips
 * (Cody, 2026-10-15): the portfolio's key to the red marks, each chip
 * stepping through its tier newest opening first, as a role's chips do.
 */
export function portfolioTiers(roleCount: number): OpeningTier[] {
  const rows = orderSites(openingsByRole(roleCount).flat());
  return TIER_ORDER.flatMap((opening) => {
    const sites = rows.filter((r) => r.opening === opening).map((r) => ({ id: r.id, name: r.name }));
    return sites.length ? [{ opening, sites }] : [];
  });
}
