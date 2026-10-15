import type { MapFocus } from "./atlas-reducer.ts";
import { fromCityZoom, underCityZoom } from "./map-filters.ts";

/** Map colors, read from the CSS tokens at draw time. */
export interface Palette {
  ink: string;
  muted: string;
  blue: string;
  red: string;
  bg: string;
}

const roleKey = (role: number) => `r${role}`;

/**
 * Cluster properties for the market source: a region circle carries its
 * biggest market (`lead`, see LEAD_BASE), adds up its markets' sites,
 * opening sites and per-role counts, takes the strongest opening tier among them, and spans the
 * box around all of them, so a click can fly to exactly that region.
 */
export function marketClusterProperties(roleCount: number): Record<string, unknown> {
  const out: Record<string, unknown> = {
    sites: ["+", ["get", "sites"]],
    tier: ["max", ["get", "tier"]],
    lead: ["max", ["+", ["*", ["get", "sites"], LEAD_BASE], ["get", "i"]]],
    openings: ["+", ["get", "openings"]],
    w: ["min", ["get", "w"]],
    s: ["min", ["get", "s"]],
    e: ["max", ["get", "e"]],
    n: ["max", ["get", "n"]],
  };
  for (let role = 0; role < roleCount; role++) out[roleKey(role)] = ["+", ["get", roleKey(role)]];
  return out;
}

/**
 * A market or region circle's radius in px by the sites it holds, on the
 * desktop and on phones (`compact`: under 960px, where the map sits under the
 * hero and the desktop's circles overpower it on load; Cody, 2026-10-15): 8,
 * 11 and 15 on the desktop, 6, 8 and 11 on phones, stepping at 10 and 50
 * sites. The circle paint, the notches, the names, the count cover, the fits'
 * padding and the click-budget test all read these, so none of them drift.
 */
const MARKET_RADIUS = {
  wide: { base: 8, stops: [[10, 11], [50, 15]] },
  compact: { base: 6, stops: [[10, 8], [50, 11]] },
} as const;

const mode = (compact: boolean) => (compact ? "compact" : "wide");

export function marketRadius(sites: number, compact: boolean): number {
  const steps = MARKET_RADIUS[mode(compact)];
  let r: number = steps.base;
  for (const [from, radius] of steps.stops) if (sites >= from) r = radius;
  return r;
}

/**
 * A notch's disc of the ground, its radius in px at full size: the 16px icon
 * mark-icons.ts draws. On phones the notch is drawn at `NOTCH_SIZE`, a 6px
 * disc, no wider than the smallest circle it sits on, as the desktop's 8px
 * disc is no wider than its 8px circle.
 */
export const NOTCH_DISC = 8;
export const NOTCH_SIZE = { wide: 1, compact: 0.75 } as const;

/**
 * How far past its circle's rim a notch's centre sits, in px. On the rim, the
 * notch's disc of the ground would cover the corner of a count drawn in the
 * ground's color, and erase it; 7px out on the desktop it clears every count
 * the circle steps hold, and still touches the rim. A phone's 8px circle holds
 * a two digit count, so there the smaller disc sits 6px out, against the rim.
 */
export const NOTCH_OUT = { wide: 7, compact: 6 } as const;

/** The counts' text size in px: 12 on the desktop, 11 on phones, the type floor. */
export const COUNT_SIZE = { wide: 12, compact: 11 } as const;

/**
 * The fewest sites a circle shows its count for. A phone's 6px circle is too
 * small to hold one, so there circles under 10 sites show none. The count is
 * hidden by its opacity, not left out: placed, it still holds its room, so a
 * neighbour's name never prints over the circle, as with a count that shows.
 */
export const COUNT_FROM = { wide: 0, compact: 10 } as const;

/**
 * Layout `text-radial-offset` for the market names, in ems of their 11px
 * text: from each circle step far enough to clear the rim by 9px, so a name
 * sits the same distance under a small market as under a region.
 */
export function nameOffset(compact: boolean): unknown {
  const steps = MARKET_RADIUS[mode(compact)];
  return ["step", ["get", "sites"], (steps.base + 9) / 11, ...steps.stops.flatMap(([from, r]) => [from, (r + 9) / 11])];
}

/**
 * Layout `text-variable-anchor` for the market names: under the circle, or
 * above it where a count or a notch takes that place, before it gives way.
 * Never beside it: a name moved sideways runs off the frame at its edges and
 * over the next circle.
 */
export const NAME_ANCHORS = ["top", "bottom"] as const;

/** Where a circle's notch sits from its centre, in px: just past the rim at the top right. */
export function notchOffset(sites: number, compact: boolean): [number, number] {
  const d = (marketRadius(sites, compact) + NOTCH_OUT[mode(compact)]) * Math.SQRT1_2;
  return [d, -d];
}

/**
 * A region circle's biggest market, as one number the clustering can carry: a
 * market's sites times this, plus its place in the market list (`i`), so the
 * region's `max` is its biggest market, the earlier one on a tie, and the
 * remainder finds its name. More markets than this never come to one map.
 */
export const LEAD_BASE = 10000;

/**
 * Layout `text-field` for the market names: a market's own city, and a region
 * by its biggest market and how many more markets it holds, through the copy's
 * own "+N" template (`RESUME_DATA.map.hoverMore`, "{name} +{n}"), as its hover
 * name reads. A region's name takes two lines, the space after its market
 * becoming the break ("NEW YORK" over "+13"), so it is half as wide and fits
 * between its neighbours' notches. The "+N" is quieter than the name, in the
 * regular weight and `plusColor`, so the circle's own count stays the one
 * number that reads as sites; it keeps the names' 11px, the type floor.
 * `cities` are the shown markets' names in list order.
 */
export function marketNameField(cities: readonly string[], template: string, plusColor: string): unknown {
  const lead = ["at", ["%", ["get", "lead"], LEAD_BASE], ["literal", [...cities]]];
  const more = ["to-string", ["-", ["get", "point_count"], 1]];
  const plus = { "text-font": ["literal", ["Open Sans Regular"]], "text-color": plusColor };
  const sections = template
    .split(/(\{name\}|\{n\})/)
    .filter(Boolean)
    .flatMap((p, k, all) => (p === "{name}" ? [lead, {}] : p === "{n}" ? [more, plus] : [all[k - 1] === "{name}" ? p.replace(/^ /, "\n") : p, plus]));
  return ["case", ["has", "point_count"], ["format", ...sections], ["get", "city"]];
}

/**
 * Layout `icon-offset` for the notches, stepping on sites as the circle's
 * radius does. MapLibre multiplies an icon's offset by its `icon-size`, so
 * the px offset is divided by it.
 */
export function notchOffsetField(compact: boolean): unknown {
  const size = NOTCH_SIZE[mode(compact)];
  const at = (sites: number) => ["literal", notchOffset(sites, compact).map((v) => v / size)];
  return ["step", ["get", "sites"], at(0), ...MARKET_RADIUS[mode(compact)].stops.flatMap(([from]) => [from, at(from)])];
}

/**
 * Paint `text-opacity` for the counts: hidden where a bigger circle covers
 * the count (see `coveredCounts`), or where the circle is under `COUNT_FROM`.
 */
export function countOpacity(compact: boolean): unknown {
  const covered = ["boolean", ["feature-state", COUNT_COVERED], false];
  const from = COUNT_FROM[mode(compact)];
  return ["case", from ? ["any", covered, ["<", ["get", "sites"], from]] : covered, 0, 1];
}

/**
 * The market layers' layout properties that follow the circles' size, by
 * layer. A change of mode writes them in place (`setLayoutProperty`), so the
 * source and its tiles stay as they are.
 */
export function marketLayout(compact: boolean) {
  const m = mode(compact);
  return {
    counts: { "text-size": COUNT_SIZE[m] },
    names: { "text-radial-offset": nameOffset(compact) },
    notches: { "icon-offset": notchOffsetField(compact), "icon-size": NOTCH_SIZE[m] },
  } as Record<"counts" | "names" | "notches", Record<string, unknown>>;
}

/**
 * Layout `circle-sort-key` for market and region circles: a higher key draws
 * on top, so the circle with more sites sits over the one with fewer, and
 * between two with as many the higher feature id does. Ids stay far under a
 * million (markets count up from 0, region ids from just past them), so the
 * id never outweighs a site. `coveredCounts` ranks circles the same way.
 */
export const MARKET_SORT_KEY: unknown = ["+", ["get", "sites"], ["*", ["to-number", ["id"], 0], 1e-6]];

/** The feature state on a circle whose count another circle covers (see `coveredCounts`). */
export const COUNT_COVERED = "covered";

const FADE = { duration: 150, delay: 0 };
const halo = (palette: Palette) => ({ "text-halo-color": palette.bg, "text-halo-width": 1.5 });

/**
 * Market and region circles: ink, sized by how many sites they hold, ringed in
 * blue when they hold a tinted role's sites. Circles and rings step out at
 * city zoom by the camera's zoom (`underCityZoom`); both opacities step, as a
 * tinted ring's width reads the circle's data and MapLibre draws a circle
 * while either opacity is above 0. Counts sit inside, gone where a bigger
 * circle covers theirs; a market's name sits under it, muted. A circle that
 * holds an opening wears its strongest tier's notch, which steps out with it.
 */
export function marketStyle(focus: Pick<MapFocus, "tint">, palette: Palette, compact: boolean) {
  const tinted = focus.tint.length ? ["+", ...focus.tint.map((r) => ["get", roleKey(r)])] : null;
  const steps = MARKET_RADIUS[mode(compact)];
  return {
    circles: {
      "circle-color": palette.ink,
      "circle-radius": ["step", ["get", "sites"], steps.base, ...steps.stops.flat()],
      // A change of mode swaps the radius at once, with the notches and names, which cannot ease.
      "circle-radius-transition": { duration: 0, delay: 0 },
      "circle-opacity": underCityZoom(0.75),
      "circle-stroke-color": palette.blue,
      "circle-stroke-opacity": underCityZoom(1),
      "circle-stroke-width": tinted ? ["case", [">", tinted, 0], 2, 0] : 0,
      "circle-stroke-width-transition": FADE,
    } as Record<string, unknown>,
    counts: { "text-color": palette.bg, "text-opacity": countOpacity(compact), "text-opacity-transition": { duration: 0, delay: 0 } } as Record<string, unknown>,
    names: { "text-color": palette.muted, ...halo(palette) } as Record<string, unknown>,
    notches: { "icon-opacity": underCityZoom(1) } as Record<string, unknown>,
  };
}

/**
 * Sites: a plain site is a small ink dot, blue for a tinted role. The sites Cody
 * opened or worked on opening are drawn as red icons by their own layers (see
 * MARK_ICON) and stay red whatever is tinted. Dots and marks each have two
 * layers: the open markets' sites, drawn at any zoom, and the rest, drawn from
 * city zoom (`fromCityZoom`). Names are ink on a halo.
 */
export function siteStyle(focus: Pick<MapFocus, "tint">, palette: Palette) {
  const dots = (opacity: unknown, ringOpacity: unknown) =>
    ({
      "circle-radius": 4.5,
      "circle-color": focus.tint.length ? ["case", ["in", ["get", "role"], ["literal", [...focus.tint]]], palette.blue, palette.ink] : palette.ink,
      "circle-opacity": opacity,
      "circle-stroke-color": palette.bg,
      "circle-stroke-width": 1,
      "circle-stroke-opacity": ringOpacity,
      "circle-color-transition": FADE,
    }) as Record<string, unknown>;
  return {
    dots: dots(fromCityZoom(0.9), fromCityZoom(1)),
    openDots: dots(0.9, 1),
    marks: { "icon-opacity": fromCityZoom(1) } as Record<string, unknown>,
    openMarks: { "icon-opacity": 1 } as Record<string, unknown>,
    names: { "text-color": palette.ink, ...halo(palette) } as Record<string, unknown>,
  };
}

/** The opening icons, by tier. Pre-opening and in-progress share the dashed ring. */
export const MARK_ICONS = { opened: "mark-opened", supported: "mark-supported", dashed: "mark-dashed" } as const;

/** Layout `icon-image` for the marks layer: a diamond, a ring or a dashed ring. */
export const MARK_ICON: unknown = ["match", ["get", "opening"], "opened", MARK_ICONS.opened, "supported", MARK_ICONS.supported, MARK_ICONS.dashed];

/** The notch icons, by the strongest tier a circle holds: the marks' shapes on a backing in the ground. */
export const NOTCH_ICONS = { opened: "notch-opened", supported: "notch-supported", dashed: "notch-dashed" } as const;

/** Layout `icon-image` for the notches, by `tier`: 3 opened, 2 supported, 1 pre-opening or in progress. */
export const NOTCH_ICON: unknown = ["match", ["get", "tier"], 3, NOTCH_ICONS.opened, 2, NOTCH_ICONS.supported, NOTCH_ICONS.dashed];

/** Circles that hold an opening, the only ones with a notch. */
export const HAS_TIER: unknown = [">", ["get", "tier"], 0];
