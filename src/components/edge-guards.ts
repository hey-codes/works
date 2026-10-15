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

/** A clear image, `w` by `h` px; only its collision box matters. */
const clear = (w: number, h: number) => ({ width: w, height: h, data: new Uint8Array(w * h * 4) });

/**
 * Where the guards sit: the middle of each of the frame's four edges, as the
 * camera is now. Each is a clear icon centred on its edge, so its collision box
 * reaches `INSET` px in and runs the edge's whole length.
 */
function guards(map: MapLibreGL.Map): GeoJSON.FeatureCollection<GeoJSON.Point, { icon: string }> {
  const { clientWidth: w, clientHeight: h } = map.getCanvas();
  const at = (x: number, y: number, icon: string) => {
    const { lng, lat } = map.unproject([x, y]);
    return { type: "Feature" as const, properties: { icon }, geometry: { type: "Point" as const, coordinates: [lng, lat] } };
  };
  return { type: "FeatureCollection", features: [at(0, h / 2, TALL), at(w, h / 2, TALL), at(w / 2, 0, WIDE), at(w / 2, h, WIDE)] };
}

/**
 * Keeps every name inside the frame, whole (Cody, 2026-10-15). MapLibre draws
 * a name that runs off the frame's edge cut; it has no padding for symbols,
 * only for collisions. So each edge holds an invisible guard that is always
 * placed and holds its room, as a count or a notch does: a name that would
 * cross an edge is not drawn at that zoom, as a name that would cross a count
 * is not, and zooming in brings it back. Counts and marks allow overlap, so a
 * guard never hides one. Added after every other layer, so MapLibre places it
 * first. The guards follow the camera when it settles and when the frame
 * resizes. Returns the cleanup.
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
  return () => {
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
