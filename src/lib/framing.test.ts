import assert from "node:assert/strict";
import { test } from "node:test";
import { marketRadius } from "./cluster-style.ts";
import { cardPadding, cardWidth, FRAME_CONTROLS, fitView, framePadding, mercatorX, mercatorY, viewCenter } from "./framing.ts";
import { FRAME_PADDING, MAP_MIN_ZOOM } from "./map-config.ts";
import type { Bounds } from "./site-points.ts";

const TILE = 512;
const frame = { w: 557, h: 598 };
const even = { top: 48, right: 48, bottom: 48, left: 48 };
const box: Bounds = [
  [-90, 30],
  [-80, 40],
];

/** Where a point lands in the frame, in px from its top left. */
function at([lng, lat]: [number, number], view: ReturnType<typeof fitView>, f: { w: number; h: number }) {
  const scale = TILE * 2 ** view.zoom;
  return { x: (mercatorX(lng) - view.x) * scale + f.w / 2, y: (mercatorY(lat) - view.y) * scale + f.h / 2 };
}

test("each padded side clears its control by 4px plus the radius of a 10-site circle, the mode's own", () => {
  for (const compact of [false, true]) {
    const clear = 4 + marketRadius(10, compact);
    for (const touch of [false, true]) {
      const c = touch ? FRAME_CONTROLS.touch : FRAME_CONTROLS.mouse;
      assert.deepEqual(framePadding(touch, compact), {
        top: FRAME_CONTROLS.inset + c.resetHeight + clear,
        right: FRAME_CONTROLS.inset + c.zoomWidth + clear,
        bottom: FRAME_PADDING,
        left: FRAME_PADDING,
      });
    }
  }
  assert.deepEqual(framePadding(false, false), { top: 55, right: 57, bottom: 48, left: 48 });
  assert.deepEqual(framePadding(true, false), { top: 67, right: 69, bottom: 48, left: 48 });
  // Under 960px a 10-site circle is 8px, not 11.
  assert.deepEqual(framePadding(false, true), { top: 52, right: 54, bottom: 48, left: 48 });
  assert.deepEqual(framePadding(true, true), { top: 64, right: 66, bottom: 48, left: 48 });
});

test("with even padding a fit centres the box, as MapLibre's cameraForBounds does", () => {
  const view = fitView(box, frame, even, 16);
  const sw = at([-90, 30], view, frame);
  const ne = at([-80, 40], view, frame);
  assert.ok(Math.abs((sw.x + ne.x) / 2 - frame.w / 2) < 1e-6);
  assert.ok(Math.abs((sw.y + ne.y) / 2 - frame.h / 2) < 1e-6);
  // The box fills the padded frame on its tighter axis.
  const fill = Math.max((ne.x - sw.x) / (frame.w - 96), (sw.y - ne.y) / (frame.h - 96));
  assert.ok(Math.abs(fill - 1) < 1e-6);
});

test("uneven padding moves the box into the padded area and keeps every edge inside it", () => {
  const pad = framePadding(true, false);
  const view = fitView(box, frame, pad, 16);
  const sw = at([-90, 30], view, frame);
  const ne = at([-80, 40], view, frame);
  assert.ok(sw.x >= pad.left - 1e-6 && ne.x <= frame.w - pad.right + 1e-6);
  assert.ok(ne.y >= pad.top - 1e-6 && sw.y <= frame.h - pad.bottom + 1e-6);
  // Centred in the padded area on both axes.
  assert.ok(Math.abs((sw.x + ne.x) / 2 - (pad.left + frame.w - pad.right) / 2) < 1e-6);
  assert.ok(Math.abs((sw.y + ne.y) / 2 - (pad.top + frame.h - pad.bottom) / 2) < 1e-6);
});

test("a fit never zooms past its cap, and the box stays centred in the padded area", () => {
  const tiny: Bounds = [
    [-87.63, 41.88],
    [-87.62, 41.89],
  ];
  const pad = framePadding(false, false);
  const view = fitView(tiny, frame, pad, 11);
  assert.equal(view.zoom, 11);
  const c = at([-87.625, mercatorLatMid(41.88, 41.89)], view, frame);
  assert.ok(Math.abs(c.x - (pad.left + frame.w - pad.right) / 2) < 1e-6);
  assert.ok(Math.abs(c.y - (pad.top + frame.h - pad.bottom) / 2) < 1e-6);
});

test("at the zoom floor a box too tall for the padding clears the top controls and spills into the bottom margin", () => {
  const phone = { w: 348, h: 318 };
  const pad = framePadding(true, true);
  // A box 233px tall at the floor: taller than the padded 206px, and short enough to sit at the top padding.
  const tall: Bounds = [
    [-118, 22],
    [-75, 53.5],
  ];
  const view = fitView(tall, phone, pad, 16);
  assert.equal(view.zoom, MAP_MIN_ZOOM);
  const top = at([-100, 53.5], view, phone).y;
  const bottom = at([-100, 22], view, phone).y;
  assert.ok(bottom - top > phone.h - pad.top - pad.bottom, "the box is taller than the padded area");
  assert.ok(Math.abs(top - pad.top) < 1e-6, "its top sits at the top padding");
  assert.ok(bottom <= phone.h + 1e-6, "and it stays inside the frame");
});

test("at the floor a box that would overrun the frame from the top padding rises only as far as it must", () => {
  const phone = { w: 348, h: 318 };
  const pad = framePadding(true, true);
  // 281px tall at the floor: from the top padding it would run 27px past the frame.
  const tall: Bounds = [
    [-118, 14],
    [-75, 53.5],
  ];
  const view = fitView(tall, phone, pad, 16);
  const top = at([-100, 53.5], view, phone).y;
  const bottom = at([-100, 14], view, phone).y;
  assert.ok(bottom - top < phone.h, "shorter than the frame");
  assert.ok(Math.abs(bottom - phone.h) < 1e-6, "its bottom meets the frame's edge");
  assert.ok(top < pad.top && top > 0);
});

test("at the floor a box taller than the whole frame is centred", () => {
  const phone = { w: 348, h: 318 };
  const huge: Bounds = [
    [-118, -40],
    [-75, 60],
  ];
  const view = fitView(huge, phone, framePadding(true, true), 16);
  const top = at([-100, 60], view, phone).y;
  const bottom = at([-100, -40], view, phone).y;
  assert.ok(Math.abs((top + bottom) / 2 - phone.h / 2) < 1e-6);
});

test("a view's centre reads back as the longitude and latitude it was built from", () => {
  const view = fitView(box, frame, even, 16);
  const [lng, lat] = viewCenter(view);
  assert.ok(Math.abs(mercatorX(lng) - view.x) < 1e-12);
  assert.ok(Math.abs(mercatorY(lat) - view.y) < 1e-12);
});

/** The latitude halfway between two, in Web Mercator (not in degrees). */
function mercatorLatMid(a: number, b: number) {
  const y = (mercatorY(a) + mercatorY(b)) / 2;
  return (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;
}

test("a site card keeps clear of the zoom stack where the frame has room: from 1280px, not in the narrow column or on phones", () => {
  // 1440 and 1280 wide, mouse and touch: the stack's width and 4px.
  assert.deepEqual(cardPadding(557, false), { top: 0, right: 46, bottom: 0, left: 0 });
  assert.deepEqual(cardPadding(557, true), { top: 0, right: 58, bottom: 0, left: 0 });
  assert.equal(cardPadding(508, false).right, 46);
  // The 320 to 380px column and a phone's frame: no room, so no band.
  for (const w of [320, 338, 348, 380]) assert.equal(cardPadding(w, false).right, 0);
});

test("a card the band sets to its dot's left still fits in the frame, at every width", () => {
  for (let w = 300; w <= 900; w += 1) {
    for (const touch of [false, true]) {
      const width = cardWidth(w);
      const right = cardPadding(w, touch).right;
      // MapLibre sets it to the left past this x; it ends the popup's 16px
      // offset short of the dot.
      const turn = w - width / 2 - right;
      assert.ok(turn - 16 - width >= 0, `${w}px: a left-set card starts at ${turn - 16 - width}`);
    }
  }
});
