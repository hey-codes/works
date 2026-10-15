import assert from "node:assert/strict";
import { test } from "node:test";
import {
  COUNT_FROM,
  COUNT_SIZE,
  countOpacity,
  HAS_TIER,
  LEAD_BASE,
  MARK_ICON,
  MARKET_SORT_KEY,
  marketClusterProperties,
  marketLayout,
  marketNameField,
  marketRadius,
  marketStyle,
  NAME_ANCHORS,
  NOTCH_DISC,
  NOTCH_ICON,
  NOTCH_ICONS,
  NOTCH_OUT,
  NOTCH_SIZE,
  nameOffset,
  notchOffset,
  notchOffsetField,
  siteStyle,
} from "./cluster-style.ts";
import { CITY_ZOOM } from "./map-config.ts";
import { fromCityZoom, underCityZoom } from "./map-filters.ts";

const palette = { ink: "#111", muted: "#777", blue: "#00f", red: "#f00", bg: "#fff" };

test("a region circle sums its markets' sites and roles and spans their boxes", () => {
  const props = marketClusterProperties(2);
  assert.deepEqual(Object.keys(props), ["sites", "tier", "lead", "openings", "w", "s", "e", "n", "r0", "r1"]);
  assert.deepEqual(props.openings, ["+", ["get", "openings"]]);
  // The region's biggest market, by sites, then by its place in the market list: its sites and index in one number.
  assert.deepEqual(props.lead, ["max", ["+", ["*", ["get", "sites"], LEAD_BASE], ["get", "i"]]]);
  assert.deepEqual(props.tier, ["max", ["get", "tier"]]);
  assert.deepEqual(props.sites, ["+", ["get", "sites"]]);
  assert.deepEqual(props.w, ["min", ["get", "w"]]);
  assert.deepEqual(props.n, ["max", ["get", "n"]]);
  assert.deepEqual(props.r1, ["+", ["get", "r1"]]);
});

test("with no focus, market circles are plain ink", () => {
  const m = marketStyle({ tint: [] }, palette, false);
  assert.equal(m.circles["circle-color"], "#111");
  assert.deepEqual(m.circles["circle-opacity"], ["step", ["zoom"], 0.75, CITY_ZOOM, 0]);
  assert.equal(m.circles["circle-stroke-width"], 0);
  assert.equal(m.counts["text-color"], "#fff");
  assert.equal(m.names["text-color"], "#777");
});

test("circles draw by sites, then by feature id, and the id never outweighs a site", () => {
  assert.deepEqual(MARKET_SORT_KEY, ["+", ["get", "sites"], ["*", ["to-number", ["id"], 0], 1e-6]]);
  // The key MapLibre computes, for ids far past any the map hands out.
  const key = (sites: number, id: number) => sites + id * 1e-6;
  assert.ok(key(4, 7) > key(4, 3));
  assert.ok(key(5, 0) > key(4, 99_999));
});

test("a count is hidden, not moved, where its circle is marked covered", () => {
  const m = marketStyle({ tint: [] }, palette, false);
  assert.deepEqual(m.counts["text-opacity"], ["case", ["boolean", ["feature-state", "covered"], false], 0, 1]);
});

const SITES = [0, 9, 10, 49, 50, 400];

test("a market circle is 8px under 10 sites, 11px under 50, 15px from 50; on phones 6, 8 and 11", () => {
  assert.deepEqual(SITES.map((s) => marketRadius(s, false)), [8, 8, 11, 11, 15, 15]);
  assert.deepEqual(SITES.map((s) => marketRadius(s, true)), [6, 6, 8, 8, 11, 11]);
});

test("the circle paint steps on sites exactly as marketRadius does, in both modes, and swaps at once", () => {
  for (const compact of [false, true]) {
    const { circles } = marketStyle({ tint: [] }, palette, compact);
    // MapLibre's step: the base below the first stop, else the output of the last stop passed.
    const [op, input, base, ...stops] = circles["circle-radius"] as [string, unknown, number, ...number[]];
    assert.equal(op, "step");
    assert.deepEqual(input, ["get", "sites"]);
    const step = (sites: number) => {
      let out = base;
      for (let i = 0; i < stops.length; i += 2) if (sites >= (stops[i] ?? 0)) out = stops[i + 1] ?? out;
      return out;
    };
    for (let sites = 0; sites <= 120; sites++) assert.equal(step(sites), marketRadius(sites, compact), `${sites} sites, compact ${compact}`);
    assert.deepEqual(circles["circle-radius-transition"], { duration: 0, delay: 0 });
  }
});

/** Whether an expression uses an operator anywhere inside it. */
const uses = (expr: unknown, op: string): boolean => Array.isArray(expr) && (expr[0] === op || expr.some((e) => uses(e, op)));

test("market circles and their rings step out at city zoom, by the camera's zoom alone", () => {
  // A ring is drawn while either opacity is above 0, and a tinted ring's width reads the circle's data.
  for (const tint of [[], [2, 7]]) {
    const { circles } = marketStyle({ tint }, palette, false);
    assert.deepEqual(circles["circle-opacity"], ["step", ["zoom"], 0.75, CITY_ZOOM, 0]);
    assert.deepEqual(circles["circle-stroke-opacity"], ["step", ["zoom"], 1, CITY_ZOOM, 0]);
    for (const op of ["get", "feature-state"]) {
      assert.equal(uses(circles["circle-opacity"], op), false, op);
      assert.equal(uses(circles["circle-stroke-opacity"], op), false, op);
    }
  }
});

test("a tinted role rings, in blue, the circles that hold its sites", () => {
  const m = marketStyle({ tint: [2, 7] }, palette, false);
  assert.equal(m.circles["circle-stroke-color"], "#00f");
  assert.deepEqual(m.circles["circle-stroke-width"], ["case", [">", ["+", ["get", "r2"], ["get", "r7"]], 0], 2, 0]);
});

test("plain sites are ink dots, blue for a tinted role", () => {
  assert.equal(siteStyle({ tint: [] }, palette).dots["circle-color"], "#111");
  const tinted = ["case", ["in", ["get", "role"], ["literal", [3]]], "#00f", "#111"];
  assert.deepEqual(siteStyle({ tint: [3] }, palette).dots["circle-color"], tinted);
  assert.deepEqual(siteStyle({ tint: [3] }, palette).openDots["circle-color"], tinted);
});

test("site names are ink on a halo of the ground", () => {
  const s = siteStyle({ tint: [] }, palette);
  assert.equal(s.names["text-color"], "#111");
  assert.equal(s.names["text-halo-color"], "#fff");
});

test("the rest of the dots, their rings and marks are drawn from city zoom; the open markets' at any zoom", () => {
  const s = siteStyle({ tint: [] }, palette);
  assert.deepEqual(s.dots["circle-opacity"], fromCityZoom(0.9));
  assert.deepEqual(s.dots["circle-stroke-opacity"], fromCityZoom(1));
  assert.deepEqual(s.marks["icon-opacity"], fromCityZoom(1));
  assert.equal(s.openDots["circle-opacity"], 0.9);
  assert.equal(s.openDots["circle-stroke-opacity"], 1);
  assert.equal(s.openMarks["icon-opacity"], 1);
});

test("an open market's dots look like the rest once drawn", () => {
  const { dots, openDots } = siteStyle({ tint: [2] }, palette);
  const same = (paint: Record<string, unknown>) => Object.fromEntries(Object.entries(paint).filter(([k]) => !k.endsWith("-opacity")));
  assert.deepEqual(same(openDots), same(dots));
});

test("each opening tier gets its own shape: diamond, ring, dashed ring", () => {
  assert.deepEqual(MARK_ICON, ["match", ["get", "opening"], "opened", "mark-opened", "supported", "mark-supported", "mark-dashed"]);
});

test("a notch shows the strongest tier inside: diamond, ring, dashed ring", () => {
  assert.deepEqual(NOTCH_ICONS, { opened: "notch-opened", supported: "notch-supported", dashed: "notch-dashed" });
  assert.deepEqual(NOTCH_ICON, ["match", ["get", "tier"], 3, "notch-opened", 2, "notch-supported", "notch-dashed"]);
  assert.deepEqual(HAS_TIER, [">", ["get", "tier"], 0]);
});

const MODES = [
  { compact: false, key: "wide" },
  { compact: true, key: "compact" },
] as const;

/** A notch's disc of the ground as drawn, its radius in px. */
const discOf = (key: "wide" | "compact") => NOTCH_DISC * NOTCH_SIZE[key];

test("a notch sits just outside its circle's rim at the top right, at every radius step, in both modes", () => {
  assert.deepEqual(NOTCH_OUT, { wide: 7, compact: 6 });
  for (const { compact, key } of MODES) {
    for (const sites of SITES) {
      const [dx, dy] = notchOffset(sites, compact);
      assert.ok(Math.abs(Math.hypot(dx, dy) - (marketRadius(sites, compact) + NOTCH_OUT[key])) < 1e-9, `${sites} sites, ${key}`);
      assert.ok(dx > 0, "right");
      assert.equal(dy, -dx, "up, at 45 degrees");
    }
  }
});

test("a notch's disc touches its rim and is never wider than the smallest circle", () => {
  // Desktop: an 8px disc 7px out, 1px over the rim. Phones: a 6px disc 6px out, against it.
  assert.equal(discOf("wide"), 8);
  assert.equal(discOf("compact"), 6);
  for (const { compact, key } of MODES) {
    assert.ok(discOf(key) >= NOTCH_OUT[key], `${key}: the disc reaches the rim`);
    assert.ok(discOf(key) <= marketRadius(0, compact), `${key}: the disc is no wider than the smallest circle`);
  }
});

test("the notch offset steps on sites exactly as notchOffset does, through the icon's size", () => {
  for (const { compact, key } of MODES) {
    const [kind, input, base, ...stops] = notchOffsetField(compact) as [string, unknown, [string, number[]], ...unknown[]];
    assert.equal(kind, "step");
    assert.deepEqual(input, ["get", "sites"]);
    const at = (sites: number) => {
      let out = base;
      for (let i = 0; i < stops.length; i += 2) if (sites >= (stops[i] as number)) out = stops[i + 1] as [string, number[]];
      assert.equal(out[0], "literal");
      // MapLibre multiplies icon-offset by icon-size.
      return out[1].map((v) => v * NOTCH_SIZE[key]);
    };
    for (const sites of SITES) {
      const [x = 0, y = 0] = at(sites);
      const [dx, dy] = notchOffset(sites, compact);
      assert.ok(Math.abs(x - dx) < 1e-9 && Math.abs(y - dy) < 1e-9, `${sites} sites, ${key}`);
    }
  }
});

test("notches step out at city zoom with the circles, by the camera's zoom alone", () => {
  for (const { compact } of MODES) assert.deepEqual(marketStyle({ tint: [] }, palette, compact).notches, { "icon-opacity": underCityZoom(1) });
});

test("a notch's disc clears its circle's count: one digit on a desktop 8px circle, two on a phone's, three on the biggest", () => {
  // Count text boxes, half width and half height in px: 12px Open Sans Semibold
  // on the desktop, scaled to 11px on phones.
  const box = (digits: number, size: number) => ({ w: (digits * 3.6 * size) / 12, h: (5 * size) / 12 });
  for (const { compact, key } of MODES) {
    for (const [sites, digits] of [[9, 1], [14, 2], [49, 2], [111, 3]] as const) {
      if (sites < COUNT_FROM[key]) continue;
      const [dx, dy] = notchOffset(sites, compact);
      const b = box(digits, COUNT_SIZE[key]);
      // The count box's top right corner is its nearest point to the disc.
      const gap = Math.hypot(dx - b.w, -dy - b.h);
      assert.ok(gap >= discOf(key), `${sites} sites, ${key}: disc ${gap.toFixed(1)}px from the count`);
    }
  }
});

test("counts are 12px on the desktop, 11px on phones, where circles under 10 sites show none but keep their room", () => {
  assert.deepEqual(COUNT_SIZE, { wide: 12, compact: 11 });
  const covered = ["boolean", ["feature-state", "covered"], false];
  assert.deepEqual(countOpacity(false), ["case", covered, 0, 1]);
  // Hidden by opacity, so the count is still placed and no name crosses the circle.
  assert.deepEqual(countOpacity(true), ["case", ["any", covered, ["<", ["get", "sites"], 10]], 0, 1]);
  for (const { compact } of MODES) {
    const { counts } = marketStyle({ tint: [] }, palette, compact);
    assert.deepEqual(counts["text-opacity"], countOpacity(compact));
    assert.deepEqual(counts["text-opacity-transition"], { duration: 0, delay: 0 });
  }
  // The 10 is where a phone's circle grows to 8px.
  assert.equal(marketRadius(COUNT_FROM.compact - 1, true), 6);
  assert.equal(marketRadius(COUNT_FROM.compact, true), 8);
});

test("a mode's layout writes the counts' size, the names' offset and the notches together", () => {
  for (const { compact, key } of MODES) {
    assert.deepEqual(marketLayout(compact), {
      counts: { "text-size": COUNT_SIZE[key] },
      names: { "text-radial-offset": nameOffset(compact) },
      notches: { "icon-offset": notchOffsetField(compact), "icon-size": NOTCH_SIZE[key] },
    });
  }
});

test("a market is named by its city, a region by its biggest market over a quieter +N", () => {
  const plus = { "text-font": ["literal", ["Open Sans Regular"]], "text-color": "#999" };
  const field = marketNameField(["Austin", "Boston", "Chicago"], "{name} +{n}", "#999");
  assert.deepEqual(field, [
    "case",
    ["has", "point_count"],
    // Two lines: the market in the names' weight, then "+N" lighter in weight and tone.
    ["format", ["at", ["%", ["get", "lead"], LEAD_BASE], ["literal", ["Austin", "Boston", "Chicago"]]], {}, "\n+", plus, ["to-string", ["-", ["get", "point_count"], 1]], plus],
    ["get", "city"],
  ]);
  // The template is the copy's own; its words carry over.
  const other = marketNameField(["A"], "{name} and {n} more", "#999") as unknown[];
  assert.deepEqual((other[2] as unknown[]).slice(3), ["\nand ", plus, ["to-string", ["-", ["get", "point_count"], 1]], plus, " more", plus]);
});

test("a name sits under its circle, clear of the rim by 9px at every radius step, in both modes", () => {
  assert.deepEqual(nameOffset(false), ["step", ["get", "sites"], (8 + 9) / 11, 10, (11 + 9) / 11, 50, (15 + 9) / 11]);
  assert.deepEqual(nameOffset(true), ["step", ["get", "sites"], (6 + 9) / 11, 10, (8 + 9) / 11, 50, (11 + 9) / 11]);
  // Under the circle first, above it only where that place is taken, never beside it.
  assert.deepEqual(NAME_ANCHORS, ["top", "bottom"]);
  for (const { compact } of MODES) {
    const [, , base, ...stops] = nameOffset(compact) as [string, unknown, number, ...number[]];
    for (const sites of SITES) {
      let em = base;
      for (let i = 0; i < stops.length; i += 2) if (sites >= (stops[i] ?? 0)) em = stops[i + 1] ?? em;
      assert.ok(Math.abs(em * 11 - marketRadius(sites, compact) - 9) < 1e-9, `${sites} sites, compact ${compact}`);
    }
  }
});
