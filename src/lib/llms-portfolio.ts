import { PROJECT_ORDER } from "./openings.ts";
import type { Opening, Site } from "./types.ts";

// The AI profile's map figures, counted from the location records so the file
// and the map never disagree.

export interface Count {
  label: string;
  sites: number;
}

const COUNTRY: Record<Site["country"], string> = { US: "U.S.", CA: "Canada", MX: "Mexico" };

// The records keep New York and New York Metro apart; a reader thinks of them
// as one market (Cody, 2026-10-29).
const MARKET: Readonly<Record<string, string>> = { "New York": "New York area", "New York Metro": "New York area" };

const TYPE_GROUP: Readonly<Record<string, string>> = {
  Boutique: "boutiques",
  "Retail store": "retail and Madewell stores",
  "Madewell store": "retail and Madewell stores",
  Flagship: "flagships",
  "Flex office": "flex offices",
  Studio: "studios",
  "Service center": "service centers",
};
const OTHER = "other";

const PROJECT_LABEL: Record<Opening, string> = {
  nso: "new site openings",
  construction: "sites in construction",
  relocation: "relocations",
  renovation: "renovations",
};

function tally(sites: readonly Site[], key: (s: Site) => string): Count[] {
  const counts = new Map<string, number>();
  for (const s of sites) counts.set(key(s), (counts.get(key(s)) ?? 0) + 1);
  return [...counts].map(([label, n]) => ({ label, sites: n }));
}

/** Most sites first, then name A to Z, so ties never reorder between builds. */
const bySize = (a: Count, b: Count) => b.sites - a.sites || a.label.localeCompare(b.label);

export function countryCounts(sites: readonly Site[]): Count[] {
  return tally(sites, (s) => COUNTRY[s.country]).sort(bySize);
}

export function topMarkets(sites: readonly Site[], n: number): Count[] {
  return tally(sites, (s) => MARKET[s.city] ?? s.city).sort(bySize).slice(0, n);
}

/** Site types in the profile's groups; "other" always last. */
export function siteTypeMix(sites: readonly Site[]): Count[] {
  const groups = tally(sites, (s) => TYPE_GROUP[s.type] ?? OTHER);
  return [...groups.filter((g) => g.label !== OTHER).sort(bySize), ...groups.filter((g) => g.label === OTHER)];
}

export interface ProjectCount extends Count {
  /** Labelled by the role's data key (work[].company); the renderer shows display names. */
  byBrand: Count[];
}

/** Projects on the map by type, in the legend's order, each split by brand; types with none are left out. */
export function projects(sites: readonly Site[]): ProjectCount[] {
  return PROJECT_ORDER.map((type) => {
    const rows = sites.filter((s) => s.opening === type);
    return { label: PROJECT_LABEL[type], sites: rows.length, byBrand: tally(rows, (s) => s.brand).sort(bySize) };
  }).filter((c) => c.sites > 0);
}
