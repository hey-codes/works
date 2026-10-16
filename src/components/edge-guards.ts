import type * as GeoJSON from "geojson";
import type * as MapLibreGL from "maplibre-gl";

const SOURCE = "edge-guards";
const LAYER = "edge-guards";
const TALL = "edge-guard-tall";
const WIDE = "edge-guard-wide";
/** How far a guard reaches into the frame, in px: a name keeps at least this clear of the edge. */
const INSET = 1;
/** Longer than any frame side, so one guard covers its whole edge. */
const LENGTH = 2048;
/** Marks the frame's own furniture (the legend, the Honolulu inset, the buttons): each holds its room too. */
export const GUARD_ATTR = "data-map-guard";

/** A clear image, `w` by `h` px; only its collision box matters. */
const clear = (w: number, h: number) => ({ width: w, height: h, data: new Uint8Array(w * h * 4) });

type Guard = GeoJSON.Feature<GeoJSON.Point, { icon: string }>;

/**
 * Where the guards sit, as the camera is now: the middle of each of the
 * frame's four edges, each a clear icon centred on its edge, so its collision
 * box reaches `INSET` px in and runs the edge's whole length; and the centre of
 * each piece of furniture marked with `GUARD_ATTR`, a clear icon its own size.
 */
function guards(map: MapLibreGL.Map): GeoJSON.FeatureCollection<GeoJSON.Point, { icon: string }> {
  const canvas = map.getCanvas();
  const { clientWidth: w, clientHeight: h } = canvas;
  const at = (x: number, y: number, icon: string): Guard => {
    const { lng, lat } = map.unproject([x, y]);
    return { type: "Feature", properties: { icon }, geometry: { type: "Point", coordinates: [lng, lat] } };
  };
  const frame = canvas.getBoundingClientRect();
  const furniture: Guard[] = [];
  for (const el of map.getContainer().querySelectorAll(`[${GUARD_ATTR}]`)) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const size = `${Math.ceil(r.width)}x${Math.ceil(r.height)}`;
    const icon = `edge-guard-${size}`;
    if (!map.hasImage(icon)) map.addImage(icon, clear(Math.ceil(r.width), Math.ceil(r.height)));
    furniture.push(at(r.left - frame.left + r.width / 2, r.top - frame.top + r.height / 2, icon));
  }
  return { type: "FeatureCollection", features: [at(0, h / 2, TALL), at(w, h / 2, TALL), at(w / 2, 0, WIDE), at(w / 2, h, WIDE), ...furniture] };
}

/**
 * Keeps every name inside the frame and clear of its furniture, whole (Cody,
 * 2026-10-15). MapLibre draws a name that runs off the frame's edge cut, and
 * one under a control hidden; it has no padding for symbols, only for
 * collisions. So each edge, and each piece of furniture, holds an invisible
 * guard that is always placed and holds its room, as a count or a notch does:
 * a name that would cross one is not drawn at that zoom, as a name that would
 * cross a count is not, and zooming in brings it back. Counts and marks allow
 * overlap, so a guard never hides one. Added after every other layer, so
 * MapLibre places it first. The guards follow the camera when it settles, the
 * frame when it resizes, and the furniture when it comes or goes. Returns the
 * cleanup.
 */
export function addEdgeGuards(map: MapLibreGL.Map): () => void {
  if (!map.hasImage(TALL)) map.addImage(TALL, clear(INSET * 2, LENGTH));
  if (!map.hasImage(WIDE)) map.addImage(WIDE, clear(LENGTH, INSET * 2));
  map.addSource(SOURCE, { type: "geojson", data: guards(map) });
  map.addLayer({
    id: LAYER,
    type: "symbol",
    source: SOURCE,
    layout: { "icon-image": ["get", "icon"], "icon-allow-overlap": true, "icon-padding": 0 },
  });
  const follow = () => (map.getSource(SOURCE) as MapLibreGL.GeoJSONSource | undefined)?.setData(guards(map));
  map.on("moveend", follow);
  map.on("resize", follow);
  // Furniture that comes or goes (the inset shows only when the pick has
  // sites there) moves its guard with it. Only those changes: MapLibre
  // restyles its popups and markers every frame, which must not reach setData.
  const guarded = (n: Node) => n instanceof Element && (n.hasAttribute(GUARD_ATTR) || n.querySelector(`[${GUARD_ATTR}]`) !== null);
  const watch = new MutationObserver((changes) => {
    if (changes.some((c) => c.type === "attributes" || [...c.addedNodes, ...c.removedNodes].some(guarded))) follow();
  });
  watch.observe(map.getContainer(), { childList: true, subtree: true, attributeFilter: [GUARD_ATTR] });
  return () => {
    watch.disconnect();
    map.off("moveend", follow);
    map.off("resize", follow);
    try {
      if (map.getLayer(LAYER)) map.removeLayer(LAYER);
      if (map.getSource(SOURCE)) map.removeSource(SOURCE);
    } catch {
      // The map may already be gone (unmount) or mid style swap.
    }
  };
}
