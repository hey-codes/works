import type * as MapLibreGL from "maplibre-gl";
import { flightMs } from "@/lib/flight";
import { fitView, framePadding, viewCenter } from "@/lib/framing";
import { FLIGHT } from "@/lib/map-config";
import type { Bounds } from "@/lib/site-points";
import { NARROW_QUERY, prefersCoarsePointer, prefersReducedMotion } from "@/lib/use-media-query";

/**
 * The camera that fits `bounds` in this map's frame, clear of its own
 * controls (see framing.ts, which the click-budget test measures).
 */
export function cameraFor(map: MapLibreGL.Map, bounds: Bounds, maxZoom: number): { center: [number, number]; zoom: number } {
  const canvas = map.getCanvas();
  // Under 960px the circles are a phone's, and the padding with them.
  const compact = window.matchMedia(NARROW_QUERY).matches;
  const view = fitView(bounds, { w: canvas.clientWidth, h: canvas.clientHeight }, framePadding(prefersCoarsePointer(), compact), maxZoom, map.getMinZoom());
  return { center: viewCenter(view), zoom: view.zoom };
}

/**
 * Every camera move the reader causes: one arcing flight to the camera that
 * fits `bounds`, timed by how far it zooms. A new call starts from wherever the
 * camera is; MapLibre stops the flight in progress. Under reduced motion, a jump.
 */
export function flyToBounds(map: MapLibreGL.Map, bounds: Bounds, maxZoom: number) {
  const camera = cameraFor(map, bounds, maxZoom);
  if (prefersReducedMotion()) {
    map.jumpTo(camera);
    return;
  }
  map.flyTo({ ...camera, duration: flightMs(map.getZoom(), camera.zoom), curve: FLIGHT.curve, essential: false });
}
