import { CITY_ZOOM } from "./map-config.ts";

/** Sites in the open markets and the markets they take in (see `marketsInside`). */
const inOpen = (open: readonly string[] | null) => ["in", ["get", "city"], ["literal", [...(open ?? [])]]];

/**
 * Which sites the site names' tiles hold: every site from `fromZoom`, and
 * under it only the open markets' sites, so a market click always lands on
 * single, named sites whatever zoom fits them. A filter reads each tile's
 * zoom, a whole number, so it changes only as new tiles load. `open` is null
 * when no market is open.
 */
export function siteFilter(open: readonly string[] | null, fromZoom: number): unknown {
  return ["any", [">=", ["zoom"], fromZoom], inOpen(open)];
}

/** The open markets' sites, for the dot and mark layers that draw them at any zoom. */
export function openSites(open: readonly string[] | null): unknown {
  return inOpen(open);
}

/**
 * Every other site, for the dot and mark layers that draw them from city zoom
 * (`fromCityZoom`). Their tiles hold them from `fromZoom`, so when the camera
 * reaches city zoom the tiles on screen, its own or the ones a zoom below,
 * already have them.
 */
export function restSites(open: readonly string[] | null, fromZoom: number): unknown {
  return ["all", [">=", ["zoom"], fromZoom], ["!", inOpen(open)]];
}

/**
 * An opacity of 0 under city zoom and `full` from it. It reads the camera's
 * zoom and nothing else, so MapLibre works it out every frame, and the sites
 * it draws step in on the frame the market circles step out
 * (`underCityZoom`). A value that also read a site's data would be worked
 * out once per tile, at the tile's own zoom, and would lag the camera until
 * the next zoom's tiles load.
 */
export function fromCityZoom(full: number): unknown {
  return ["step", ["zoom"], 0, CITY_ZOOM, full];
}

/**
 * The other side of the same step, for the market circles: `full` under city
 * zoom and 0 from it. Like `fromCityZoom` it reads the camera's zoom alone,
 * so the circles step out on the frame the sites step in, and back in on the
 * first frame under city zoom.
 */
export function underCityZoom(full: number): unknown {
  return ["step", ["zoom"], full, CITY_ZOOM, 0];
}

/**
 * Which market circles show: all of them, except the open market and the
 * markets it takes in, whose own sites stand in for them. A region circle has
 * no city, so it always shows.
 */
export function marketFilter(open: readonly string[] | null): unknown {
  return open === null ? ["has", "sites"] : ["!", inOpen(open)];
}

/**
 * Sites with an opening tier, drawn as red marks; every other site is a dot.
 * The tiers are spelled out because a plain site keeps `opening: null` where
 * the layer filters run, and `has` is true for a null value.
 */
export const HAS_OPENING: unknown = ["in", ["get", "opening"], ["literal", ["opened", "supported", "pre-opening", "in-progress"]]];
