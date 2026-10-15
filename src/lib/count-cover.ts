import { marketRadius } from "./cluster-style.ts";

/** A market or region circle as drawn: its feature id, its centre in px and how many sites it holds. */
export interface DrawnCircle {
  id: number;
  x: number;
  y: number;
  sites: number;
}

/** Whether `o` ranks above `c`: more sites, or as many and a higher id, the order MARKET_SORT_KEY draws them in. */
const ranksAbove = (o: DrawnCircle, c: DrawnCircle) => o.sites > c.sites || (o.sites === c.sites && o.id > c.id);

/**
 * The circles whose count is hidden. Where two circles overlap, only the one
 * that ranks higher keeps its count: the one with more sites, or with as many
 * the one with the higher feature id, which is the one drawn on top (see
 * MARKET_SORT_KEY). The rule holds pair by pair, so a circle overlapping a
 * higher one loses its count even when that one has lost its own. A circle
 * that overlaps no other always keeps its count. Circles are sized as the map
 * draws them in its mode, on phones (`compact`) or the desktop.
 */
export function coveredCounts(circles: readonly DrawnCircle[], compact: boolean): Set<number> {
  const covered = new Set<number>();
  for (const c of circles) {
    const r = marketRadius(c.sites, compact);
    const under = circles.some((o) => o !== c && ranksAbove(o, c) && Math.hypot(o.x - c.x, o.y - c.y) < r + marketRadius(o.sites, compact));
    if (under) covered.add(c.id);
  }
  return covered;
}
