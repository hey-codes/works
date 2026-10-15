import assert from "node:assert/strict";
import { test } from "node:test";
import { LOCATIONS } from "../data/locations.ts";
import { buildSitePoints, pointsFor, SITE_POINTS, type SiteProps } from "./site-points.ts";
import { buildSpotLabels, orderSites, spotLabelsFor, spotPointsOf, spotSites } from "./spots.ts";
import type { Site } from "./types.ts";

const MORE = "{name} +{n}";

const site = (over: Partial<SiteProps> & Pick<SiteProps, "id">): SiteProps => ({
  role: 0,
  name: `Site ${over.id}`,
  type: "Boutique",
  city: "Atlanta",
  sqft: null,
  sqftEstimate: false,
  opening: null,
  openedYear: null,
  closed: false,
  closedYear: null,
  ...over,
});

const record = (over: Partial<Site>): Site => ({
  id: 1,
  brand: "FENDI",
  name: "Test Boutique",
  type: "Boutique",
  sqft: 4000,
  city: "Atlanta",
  country: "US",
  lat: 33.85,
  lon: -84.36,
  placeholder: false,
  status: "open",
  kind: "store",
  ...over,
});

const at = (lng: number, lat: number, role: number | null) =>
  spotLabelsFor(role)
    .features.filter((f) => f.geometry.coordinates[0] === lng && f.geometry.coordinates[1] === lat)
    .map((f) => f.properties);

test("sites with an opening come first, the newest opening year first", () => {
  const ordered = orderSites([site({ id: 1 }), site({ id: 2, opening: "supported", openedYear: 2019 }), site({ id: 3, opening: "opened", openedYear: 2022 })]);
  assert.deepEqual(
    ordered.map((s) => s.id),
    [3, 2, 1],
  );
});

test("an opening with no year comes after the dated ones and before plain sites", () => {
  const ordered = orderSites([site({ id: 1 }), site({ id: 2, opening: "supported" }), site({ id: 3, opening: "supported", openedYear: 2020 })]);
  assert.deepEqual(
    ordered.map((s) => s.id),
    [3, 2, 1],
  );
});

test("plain sites keep the records' order", () => {
  assert.deepEqual(
    orderSites([site({ id: 9 }), site({ id: 4 }), site({ id: 7 })]).map((s) => s.id),
    [4, 7, 9],
  );
});

test("the order is a copy; what it was given is left as it was", () => {
  const given = [site({ id: 2 }), site({ id: 1 })];
  orderSites(given);
  assert.deepEqual(
    given.map((s) => s.id),
    [2, 1],
  );
});

test("record ids rise in the records' order, so the id can stand for it", () => {
  for (let i = 1; i < LOCATIONS.length; i++) {
    const before = LOCATIONS[i - 1]?.id ?? 0;
    const now = LOCATIONS[i]?.id ?? 0;
    assert.ok(now > before, `id ${now} comes after ${before}`);
  }
});

test("sites at one point get one label: the lead's name and how many more", () => {
  const points = buildSitePoints(
    [record({ id: 1, name: "Saks" }), record({ id: 2, name: "Lenox", opening: "supported", openedYear: 2022 }), record({ id: 3, name: "Midtown", lat: 33.78, lon: -84.38 })],
    ["FENDI"],
  );
  assert.deepEqual(
    buildSpotLabels(points, MORE).features.map((f) => [f.properties, f.geometry.coordinates]),
    [
      [{ id: 2, city: "Atlanta", label: "Lenox +1" }, [-84.36, 33.85]],
      [{ id: 3, city: "Atlanta", label: "Midtown" }, [-84.38, 33.78]],
    ],
  );
});

test("neighbours a few metres apart are two spots, not one", () => {
  const points = buildSitePoints([record({ id: 1, name: "Bloor", lon: -79.3882 }), record({ id: 2, name: "Bloor St", lon: -79.3883 })], ["FENDI"]);
  assert.deepEqual(
    buildSpotLabels(points, MORE).features.map((f) => f.properties.label),
    ["Bloor", "Bloor St"],
  );
});

test("with every brand on, Lenox is named once, for the site Cody supported there", () => {
  assert.deepEqual(at(-84.3629, 33.8467, null), [{ id: 340, city: "Atlanta", label: "Lenox +3" }]);
});

test("a dated opening leads an undated one", () => {
  assert.deepEqual(at(-73.5756, 45.4979, null), [{ id: 310, city: "Montreal", label: "Holt Renfrew Ogilvy Men's +1" }]);
});

test("with one brand open, a spot counts only that brand's sites", () => {
  assert.deepEqual(
    at(-84.3629, 33.8467, 3).map((p) => p.label),
    ["Lenox +1"],
  );
  assert.deepEqual(
    at(-84.3629, 33.8467, 5).map((p) => p.label),
    ["Lenox"],
  );
});

test("every point holds one label, and 26 of them name more than one site", () => {
  const labels = spotLabelsFor(null).features;
  const points = new Set(SITE_POINTS.features.map((f) => f.geometry.coordinates.join(",")));
  assert.equal(labels.length, points.size);
  assert.equal(labels.filter((f) => f.properties.label.includes(" +")).length, 26);
});

test("sites at one point share one city, so an open market keeps or drops a spot whole", () => {
  const cities = new Map<string, Set<string>>();
  for (const f of SITE_POINTS.features) {
    const key = f.geometry.coordinates.join(",");
    cities.set(key, (cities.get(key) ?? new Set()).add(f.properties.city));
  }
  assert.ok([...cities.values()].every((c) => c.size === 1));
});

test("the same role gives the same labels, so the map is not reloaded for nothing", () => {
  assert.equal(spotLabelsFor(3), spotLabelsFor(3));
});

const ids = (sites: readonly SiteProps[]) => sites.map((s) => s.id);

test("every site at a point is read, in the data's order", () => {
  const points = buildSitePoints([record({ id: 1 }), record({ id: 2, lat: 33.78 }), record({ id: 3 }), record({ id: 4 })], ["FENDI"]);
  assert.deepEqual(ids(spotSites(points, [[-84.36, 33.85]])), [1, 3, 4]);
});

test("two points read both spots' sites", () => {
  const points = buildSitePoints([record({ id: 1 }), record({ id: 2, lat: 33.78 }), record({ id: 3 }), record({ id: 4, lat: 33.7 })], ["FENDI"]);
  assert.deepEqual(
    ids(
      spotSites(points, [
        [-84.36, 33.78],
        [-84.36, 33.85],
      ]),
    ),
    [1, 2, 3],
  );
});

test("a point with no site reads none", () => {
  const points = buildSitePoints([record({ id: 1 })], ["FENDI"]);
  assert.deepEqual(spotSites(points, [[-84.36, 33.9]]), []);
  assert.deepEqual(spotSites(points, []), []);
});

test("a coordinate given twice does not read its sites twice", () => {
  const points = buildSitePoints([record({ id: 1 }), record({ id: 2 })], ["FENDI"]);
  assert.deepEqual(
    ids(
      spotSites(points, [
        [-84.36, 33.85],
        [-84.36, 33.85],
      ]),
    ),
    [1, 2],
  );
});

test("with every brand on, the Lenox spot reads all four sites; with one brand, that brand's", () => {
  assert.deepEqual(ids(spotSites(SITE_POINTS, [[-84.3629, 33.8467]])), [135, 270, 340, 358]);
  assert.deepEqual(ids(spotSites(pointsFor(3), [[-84.3629, 33.8467]])), [340, 358]);
});

test("a site's own point is found by its id, where the map hands back a point rounded to its tile", () => {
  const points = buildSitePoints([record({ id: 1 }), record({ id: 2, lat: 33.78 }), record({ id: 3 })], ["FENDI"]);
  assert.deepEqual(spotPointsOf(points, [3]), [[-84.36, 33.85]]);
  assert.deepEqual(
    spotPointsOf(points, [2, 3, 2]),
    [
      [-84.36, 33.78],
      [-84.36, 33.85],
    ],
  );
  assert.deepEqual(spotPointsOf(points, [99]), []);
});

test("a site's spot reads back through its own point under every brand view, twice the same", () => {
  // The round trip an open card's re-read relies on: the point recorded when it opened
  // finds the site again wherever the site is on the map, whatever brand is shown.
  const views = [null, 0, 1, 2, 3, 4, 5, 6, 7, 8].map(pointsFor);
  for (const view of views) {
    const shown = new Set(view.features.map((f) => f.properties.id));
    for (const { properties } of SITE_POINTS.features) {
      const points = spotPointsOf(SITE_POINTS, [properties.id]);
      const read = ids(spotSites(view, points));
      if (shown.has(properties.id)) assert.ok(read.includes(properties.id), `site ${properties.id}`);
      assert.deepEqual(ids(spotSites(view, points)), read, `site ${properties.id} read twice`);
    }
  }
});
