import assert from "node:assert/strict";
import { test } from "node:test";
import { CITY_ZOOM } from "./map-config.ts";
import { fromCityZoom, HAS_OPENING, marketFilter, openSites, restSites, siteFilter, underCityZoom } from "./map-filters.ts";
import type { Opening } from "./types.ts";

test("from the zoom given the tiles hold every site, and under it the open markets' sites", () => {
  assert.deepEqual(siteFilter(["Los Angeles", "Beverly Hills"], 8), ["any", [">=", ["zoom"], 8], ["in", ["get", "city"], ["literal", ["Los Angeles", "Beverly Hills"]]]]);
});

test("with no market open, under the zoom given the tiles hold no site", () => {
  assert.deepEqual(siteFilter(null, 9), ["any", [">=", ["zoom"], 9], ["in", ["get", "city"], ["literal", []]]]);
});

test("the open layers hold the open markets' sites, at any zoom", () => {
  assert.deepEqual(openSites(["Los Angeles", "Beverly Hills"]), ["in", ["get", "city"], ["literal", ["Los Angeles", "Beverly Hills"]]]);
  assert.deepEqual(openSites(null), ["in", ["get", "city"], ["literal", []]]);
});

test("the rest layers hold every other site, from the zoom given", () => {
  assert.deepEqual(restSites(["Los Angeles"], 8), ["all", [">=", ["zoom"], 8], ["!", ["in", ["get", "city"], ["literal", ["Los Angeles"]]]]]);
  assert.deepEqual(restSites(null, 8), ["all", [">=", ["zoom"], 8], ["!", ["in", ["get", "city"], ["literal", []]]]]);
});

/** Whether an expression uses an operator anywhere inside it. */
const uses = (expr: unknown, op: string): boolean => Array.isArray(expr) && (expr[0] === op || expr.some((e) => uses(e, op)));

test("the rest are drawn from city zoom by a step on the camera's zoom alone", () => {
  assert.deepEqual(fromCityZoom(0.9), ["step", ["zoom"], 0, CITY_ZOOM, 0.9]);
  // A value that reads a site's data is worked out per tile, at the tile's zoom, not per frame.
  for (const op of ["get", "has", "in", "id", "properties", "feature-state", "geometry-type"]) assert.equal(uses(fromCityZoom(1), op), false, op);
});

test("the market circles step out at city zoom by a step on the camera's zoom alone", () => {
  assert.deepEqual(underCityZoom(0.75), ["step", ["zoom"], 0.75, CITY_ZOOM, 0]);
  for (const op of ["get", "has", "in", "id", "properties", "feature-state", "geometry-type"]) assert.equal(uses(underCityZoom(1), op), false, op);
});

test("every market circle shows until one is open, then it and the markets it takes in step out", () => {
  assert.deepEqual(marketFilter(null), ["has", "sites"]);
  assert.deepEqual(marketFilter(["Los Angeles", "Beverly Hills"]), ["!", ["in", ["get", "city"], ["literal", ["Los Angeles", "Beverly Hills"]]]]);
});

test("the open cities are copied into the filter, not shared with the caller", () => {
  const open = ["Los Angeles"];
  const filter = marketFilter(open) as [string, [string, unknown, [string, string[]]]];
  assert.notEqual(filter[1][2][1], open);
});

test("the mark filter matches the opening against the tier list, not whether the field is present", () => {
  assert.deepEqual(HAS_OPENING, ["in", ["get", "opening"], ["literal", ["opened", "supported", "pre-opening", "in-progress"]]]);
});

test("the mark filter spells out every opening tier, and only those", () => {
  // The typecheck holds this record to exactly the members of Opening.
  const tiers: Record<Opening, true> = { opened: true, supported: true, "pre-opening": true, "in-progress": true };
  const listed = (HAS_OPENING as [string, unknown, [string, string[]]])[2][1];
  assert.deepEqual([...listed].sort(), Object.keys(tiers).sort());
});
