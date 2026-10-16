/** A basemap layer as the style lists it: enough to decide whether to touch it. */
export interface BasemapLayer {
  id: string;
  minzoom?: number;
  maxzoom?: number;
}

/** What to do to CARTO's city labels so they never stack under the map's market names. */
export interface CityLabelPlan {
  /** City layers that only show inside the market band: hidden outright. */
  hide: string[];
  /** City layers that start below the band: kept until it begins. */
  stopAt: { id: string; minzoom: number; maxzoom: number }[];
}

/**
 * CARTO draws city names in "city dot" layers that end by zoom 8. Our market
 * names show from `bandStart` (the map's lowest zoom) up to city zoom, so a
 * city dot layer that starts inside that band is hidden, and one that starts
 * below it stops where the band begins. States, countries, towns, water and
 * CARTO's plain city names (from zoom 8) are left alone.
 */
export function cityLabelPlan(layers: readonly BasemapLayer[], bandStart: number): CityLabelPlan {
  const plan: CityLabelPlan = { hide: [], stopAt: [] };
  for (const layer of layers) {
    if (!/^place_(city|capital)_dot/.test(layer.id)) continue;
    const minzoom = layer.minzoom ?? 0;
    if (minzoom >= bandStart) plan.hide.push(layer.id);
    else plan.stopAt.push({ id: layer.id, minzoom, maxzoom: bandStart });
  }
  return plan;
}

/** The site's map colors, read from its tokens at draw time (see docs/DESIGN.md, Color). */
export interface GroundPalette {
  land: string;
  /** The map's sea. */
  soft: string;
  /** The coastline. */
  edge: string;
  line: string;
  under: string;
  ink: string;
  muted: string;
}

const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");

/** "#fff" as "#ffffff"; a six-digit hex as it is. A built stylesheet shortens the tokens. */
const longHex = (c: string) => (c.length === 4 ? `#${[...c.slice(1)].map((d) => d + d).join("")}` : c);

/** `a` mixed toward `b` by `t` (0 to 1) in sRGB, as CSS `color-mix(in srgb, a, b t)`. Three- or six-digit hex in, six-digit out. */
export function mixHex(a: string, b: string, t: number): string {
  const ch = (c: string, i: number) => Number.parseInt(longHex(c).slice(1 + 2 * i, 3 + 2 * i), 16);
  return `#${[0, 1, 2].map((i) => hex(ch(a, i) + (ch(b, i) - ch(a, i)) * t)).join("")}`;
}

type Paint = [layer: string, property: string, value: string];

/**
 * CARTO's ground in the site's own colors, both themes, by layer: Positron
 * and Dark Matter share their layer ids, so one plan serves either. The land
 * is `land` and the sea `soft`, edged by a 1px coastline in `edge`; parks and
 * land cover flatten into the land and built-up areas take a trace of ink;
 * borders are grey (CARTO's pink dashes would read as a red mark); roads
 * are outlined in the hairline greys and filled with the land; CARTO's names
 * are muted a step further than the map's own market names, so Cody's places
 * outrank the basemap's. Red and blue stay out of the ground. Layers it does
 * not name, the map's own among them, are left as they are.
 */
export function groundPaint(layers: readonly { id: string; type: string }[], c: GroundPalette): Paint[] {
  const quiet = mixHex(c.muted, c.land, 0.3);
  const out: Paint[] = [];
  for (const { id, type } of layers) {
    const set = (property: string, value: string) => out.push([id, property, value]);
    if (type === "background") set("background-color", c.land);
    else if (id === "water") {
      set("fill-color", c.soft);
      set("fill-outline-color", c.edge);
    } else if (id === "waterway") set("line-color", c.edge);
    else if (id === "landuse_residential") set("fill-color", mixHex(c.land, c.ink, 0.04));
    else if (/^(landcover|landuse|park_)/.test(id)) set("fill-color", c.land);
    else if (/^building/.test(id)) set("fill-color", mixHex(c.land, c.ink, 0.06));
    else if (/^boundary_country/.test(id)) set("line-color", c.edge);
    else if (id === "boundary_state") set("line-color", c.under);
    else if (id === "boundary_county") set("line-color", c.line);
    else if (/^(road|bridge|tunnel)_(mot|trunk|pri)_case/.test(id)) set("line-color", c.under);
    else if (/^(road|bridge|tunnel)_.*_case|^(road|bridge|tunnel)_path$|^(tunnel_)?rail$|^aeroway/.test(id)) set("line-color", c.line);
    else if (/^(road|bridge|tunnel)_.*_fill|^(tunnel_)?rail_dash$/.test(id)) set("line-color", c.land);
    else if (type === "symbol" && /^(place_|roadname_|poi_|water)/.test(id)) {
      set("text-color", quiet);
      set("text-halo-color", /^watername_/.test(id) ? c.soft : c.land);
      set("icon-color", quiet);
    }
  }
  return out;
}

/** What to do to CARTO's country, state and continent names. */
export interface RegionLabelPlan {
  /** Layers that end before `fromZoom`: hidden outright. */
  hide: string[];
  /** Layers that run past it: started there. */
  startAt: { id: string; minzoom: number; maxzoom: number }[];
}

/**
 * CARTO names countries and states across the zooms the map draws its market
 * circles in, and a country's name beside a circle reads as that circle's
 * ("CUBA" by South Florida's 29, where that market's own name gave way). So
 * those names wait for `fromZoom` (city zoom, where the circles give way to
 * sites); a layer that ends sooner never shows. Towns, cities and water are
 * left as they are.
 */
export function regionLabelPlan(layers: readonly BasemapLayer[], fromZoom: number): RegionLabelPlan {
  const plan: RegionLabelPlan = { hide: [], startAt: [] };
  for (const layer of layers) {
    if (!/^place_(country|state|continent)/.test(layer.id)) continue;
    const maxzoom = layer.maxzoom ?? 24;
    if (maxzoom <= fromZoom) plan.hide.push(layer.id);
    else plan.startAt.push({ id: layer.id, minzoom: Math.max(layer.minzoom ?? 0, fromZoom), maxzoom });
  }
  return plan;
}
