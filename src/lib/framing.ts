import { marketRadius } from "./cluster-style.ts";
import { FRAME_PADDING, MAP_MIN_ZOOM } from "./map-config.ts";
import type { Bounds } from "./site-points.ts";

/** MapLibre's tile size: the world is this many px wide at zoom 0. */
const TILE = 512;

/** Web Mercator x and y of a longitude and a latitude, 0 to 1 across the world. */
export const mercatorX = (lng: number) => (lng + 180) / 360;
export function mercatorY(lat: number) {
  const s = Math.sin((lat * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
}
const lngOf = (x: number) => x * 360 - 180;
const latOf = (y: number) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;

/**
 * The frame's own controls, in px, as the map draws them: "Show every site"
 * at the top left and the zoom stack at the top right, each 8px in
 * (`top-2`, `left-2`, `right-2`). On touch both grow to 44px targets. The
 * attribution, collapsed to its 26px button 10px from the bottom right
 * corner, sits inside the right-hand padding these set. Change a control's
 * size and these with it.
 */
export const FRAME_CONTROLS = {
  inset: 8,
  mouse: { resetHeight: 32, zoomWidth: 34 },
  touch: { resetHeight: 44, zoomWidth: 46 },
} as const;

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Space kept between a fit and the frame's edges, in px. The top clears
 * "Show every site" and the right the zoom stack: the control, 4px, and the
 * radius of a 10-site circle, the biggest that sits on a fit's edge (a fit's
 * box runs through sites, and a circle sits at the middle of its sites). The
 * bottom and left have no control and keep `FRAME_PADDING`. The circle is
 * the mode's own: smaller on phones (`compact`), so a phone's fit pads less.
 */
export function framePadding(touch: boolean, compact: boolean): Padding {
  const c = touch ? FRAME_CONTROLS.touch : FRAME_CONTROLS.mouse;
  const clear = 4 + marketRadius(10, compact);
  return {
    top: FRAME_CONTROLS.inset + c.resetHeight + clear,
    right: FRAME_CONTROLS.inset + c.zoomWidth + clear,
    bottom: FRAME_PADDING,
    left: FRAME_PADDING,
  };
}

/**
 * A site card's widest, in px, as `POPUP_WIDTH` in site-map.tsx caps it:
 * 15.5rem, or two thirds of (the frame less 18px) where that is less. Change
 * one and the other with it.
 */
export const cardWidth = (frameW: number) => Math.min(248, ((frameW - 18) * 2) / 3);

/**
 * The band a site card keeps clear along the frame's right edge, as MapLibre's
 * popup `padding`: the zoom stack's width and 4px, so a card never opens over
 * the zoom buttons (or the credit button under them). MapLibre knows only
 * bands, so near the band it sets the card to the dot's left. The card's cap
 * leaves a frame `frameW - 18 - 1.5 * cardWidth` px to spare for that, and the
 * band takes no more, so the card still fits wherever its dot sits: all of it
 * from 1280px, none in the 320 to 380px column or on phones, where a card
 * centred on its dot cannot clear the stack anyway.
 */
export function cardPadding(frameW: number, touch: boolean): Padding {
  const c = touch ? FRAME_CONTROLS.touch : FRAME_CONTROLS.mouse;
  const band = FRAME_CONTROLS.inset + c.zoomWidth + 4;
  const spare = Math.floor(frameW - 18 - 1.5 * cardWidth(frameW));
  return { top: 0, right: Math.max(0, Math.min(band, spare)), bottom: 0, left: 0 };
}

/** A camera: its zoom, and the Web Mercator x and y at the frame's centre. */
export interface View {
  zoom: number;
  x: number;
  y: number;
}

/**
 * The camera that fits `bounds` in a frame `frame.w` by `frame.h` px, as
 * MapLibre's cameraForBounds does: zoomed until the box fills the padded
 * frame on its tighter axis, never past `maxZoom` or under `minZoom`, and
 * centred in the padded frame. One rule is added. Under the zoom floor a box
 * can be taller than the padded frame (the whole country on a phone); then it
 * keeps clear of the top controls first and spills into the bottom margin,
 * rising only as far as it must to stay in the frame, and is centred only
 * when it is taller than the frame itself.
 */
export function fitView(bounds: Bounds, frame: { w: number; h: number }, padding: Padding, maxZoom: number, minZoom = MAP_MIN_ZOOM): View {
  const [[w, s], [e, n]] = bounds;
  const dx = (mercatorX(e) - mercatorX(w)) * TILE;
  const dy = (mercatorY(s) - mercatorY(n)) * TILE;
  const room = { w: frame.w - padding.left - padding.right, h: frame.h - padding.top - padding.bottom };
  const fits = Math.log2(Math.min(room.w / dx, room.h / dy));
  const zoom = Math.max(minZoom, Math.min(maxZoom, fits));
  const scale = TILE * 2 ** zoom;
  const boxHeight = dy * 2 ** zoom;
  let boxTop = padding.top + (room.h - boxHeight) / 2;
  if (boxHeight > room.h) boxTop = boxHeight <= frame.h ? Math.min(padding.top, frame.h - boxHeight) : (frame.h - boxHeight) / 2;
  return {
    zoom,
    x: (mercatorX(w) + mercatorX(e)) / 2 - (padding.left - padding.right) / 2 / scale,
    y: mercatorY(n) + (frame.h / 2 - boxTop) / scale,
  };
}

/** A view's centre as `[lng, lat]`. */
export const viewCenter = (view: View): [number, number] => [lngOf(view.x), latOf(view.y)];
