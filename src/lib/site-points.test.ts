import assert from "node:assert/strict";
import { test } from "node:test";
import { LOCATIONS } from "../data/locations.ts";
import { RESUME_DATA } from "../data/resume-data.ts";
import type { Site } from "./types.ts";
import {
  boundsOf,
  boundsOfCoords,
  buildMarkets,
  buildSitePoints,
  farFor,
  farSites,
  MAINLAND_BOUNDS,
  marketBounds,
  marketsFor,
  marketsInside,
  openingRank,
  pointsFor,
  readSiteProps,
  roleBounds,
  SITE_POINTS,
  unionBox,
} from "./site-points.ts";

const site = (over: Partial<Site>): Site => ({
  id: 1,
  brand: "FENDI",
  name: "Test Boutique",
  type: "Boutique",
  sqft: 4000,
  city: "New York",
  country: "US",
  lat: 40.76,
  lon: -73.97,
  placeholder: false,
  status: "open",
  kind: "store",
  ...over,
});

test("a point carries what the site card shows, and nothing else", () => {
  const points = buildSitePoints([site({})], ["SoulCycle", "FENDI"]);
  assert.deepEqual(points.features[0]?.properties, {
    id: 1,
    role: 1,
    name: "Test Boutique",
    type: "Boutique",
    city: "New York",
    sqft: 4000,
    sqftEstimate: false,
    opening: null,
    openedYear: null,
    closed: false,
    closedYear: null,
  });
  assert.deepEqual(points.features[0]?.geometry.coordinates, [-73.97, 40.76]);
});

test("an estimated size and an opening status carry through", () => {
  const points = buildSitePoints([site({ sqftEstimate: true, opening: "construction", openedYear: 2021 })], ["FENDI"]);
  assert.equal(points.features[0]?.properties.sqftEstimate, true);
  assert.equal(points.features[0]?.properties.opening, "construction");
  assert.equal(points.features[0]?.properties.openedYear, 2021);
});

test("a site whose brand is not a role is left out", () => {
  const points = buildSitePoints([site({ brand: "Bathhouse" })], ["FENDI"]);
  assert.equal(points.features.length, 0);
});

test("every row in the records becomes a point", () => {
  assert.equal(SITE_POINTS.features.length, LOCATIONS.length);
});

test("no private field reaches a point: no address, source or contact, and of the status only whether it closed", () => {
  for (const f of SITE_POINTS.features) {
    assert.deepEqual(Object.keys(f.properties).sort(), ["city", "closed", "closedYear", "id", "name", "openedYear", "opening", "role", "sqft", "sqftEstimate", "type"]);
  }
});

test("bounds of nothing is null", () => {
  assert.equal(boundsOf(buildSitePoints([], []), () => true), null);
});

test("bounds of one point is that point twice", () => {
  const points = buildSitePoints([site({})], ["FENDI"]);
  assert.deepEqual(boundsOf(points, () => true), [
    [-73.97, 40.76],
    [-73.97, 40.76],
  ]);
});

test("bounds span the kept points only", () => {
  const points = buildSitePoints(
    [site({ id: 1, lon: -118, lat: 34 }), site({ id: 2, lon: -74, lat: 41 }), site({ id: 3, lon: -157, lat: 21 })],
    ["FENDI"],
  );
  assert.deepEqual(boundsOf(points, (_p, lng) => lng > -130), [
    [-118, 34],
    [-74, 41],
  ]);
});

test("the opening view leaves Hawaii out", () => {
  assert.ok(MAINLAND_BOUNDS[0][0] > -130, "west edge is east of Hawaii");
});

test("a role with no sites has no bounds", () => {
  assert.equal(roleBounds(RESUME_DATA.work.length), null);
  // ...and draws every brand, so the map is never left empty.
  assert.equal(pointsFor(RESUME_DATA.work.length), SITE_POINTS);
});

test("a role with sites has bounds that contain its mainland sites", () => {
  const role = RESUME_DATA.work.findIndex((w) => w.company === "FENDI");
  const b = roleBounds(role);
  assert.ok(b);
  const mainland = SITE_POINTS.features.filter((f) => f.properties.role === role && (f.geometry.coordinates[0] ?? 0) > -130);
  assert.ok(mainland.length > 0);
  for (const f of mainland) {
    const [lng, lat] = f.geometry.coordinates as [number, number];
    assert.ok(lng >= b[0][0] && lng <= b[1][0] && lat >= b[0][1] && lat <= b[1][1]);
  }
});

test("a role's bounds leave Hawaii out, as the opening view does", () => {
  const role = RESUME_DATA.work.findIndex((w) => w.company === "FENDI");
  const hawaii = SITE_POINTS.features.filter((f) => f.properties.role === role && (f.geometry.coordinates[0] ?? 0) < -130);
  assert.ok(hawaii.length > 0, "FENDI has a Hawaii site on record");
  const b = roleBounds(role);
  assert.ok(b);
  assert.ok(b[0][0] > -130, "west edge is east of Hawaii");
});

test("bounds of a list of coordinates", () => {
  assert.deepEqual(
    boundsOfCoords([
      [-118, 34],
      [-74, 41],
    ]),
    [
      [-118, 34],
      [-74, 41],
    ],
  );
  assert.equal(boundsOfCoords([]), null);
});

test("a malformed coordinate is skipped, not read as 0, 0", () => {
  assert.deepEqual(
    boundsOfCoords([[-118, 34], [], [Number.NaN, 40], [-74, 41]]),
    [
      [-118, 34],
      [-74, 41],
    ],
  );
});

test("with no role open the map shows every site", () => {
  assert.equal(pointsFor(null), SITE_POINTS);
});

test("an open role shows only its own sites", () => {
  const role = RESUME_DATA.work.findIndex((w) => w.company === "FENDI");
  const points = pointsFor(role);
  assert.ok(points.features.length > 0);
  assert.ok(points.features.every((f) => f.properties.role === role));
  assert.equal(points.features.length, SITE_POINTS.features.filter((f) => f.properties.role === role).length);
});

test("a role with no sites leaves every site on the map", () => {
  const independent = RESUME_DATA.work.findIndex((w) => w.sites === 0);
  assert.equal(pointsFor(independent), SITE_POINTS);
});

test("the same role gives the same points, so the map is not reloaded for nothing", () => {
  assert.equal(pointsFor(3), pointsFor(3));
});

test("a market sits at the middle of its sites and knows its count, roles and box", () => {
  const points = buildSitePoints(
    [site({ id: 1, city: "Austin", lon: -98, lat: 30 }), site({ id: 2, city: "Austin", lon: -97, lat: 31 }), site({ id: 3, city: "Boston", lon: -71, lat: 42 })],
    ["FENDI"],
  );
  const markets = buildMarkets(points, 1);
  assert.deepEqual(
    markets.features.map((f) => [f.properties, f.geometry.coordinates]),
    [
      [{ city: "Austin", i: 0, sites: 2, tier: 0, openings: 0, w: -98, s: 30, e: -97, n: 31, r0: 2 }, [-97.5, 30.5]],
      [{ city: "Boston", i: 1, sites: 1, tier: 0, openings: 0, w: -71, s: 42, e: -71, n: 42, r0: 1 }, [-71, 42]],
    ],
  );
});

test("every market has its own numeric id, from 0 up, for the map's feature state", () => {
  const ids = marketsFor(null).features.map((f) => f.id);
  assert.deepEqual(ids, ids.map((_id, i) => i));
});

test("every role gets a count on every market, zero where it has no sites", () => {
  const points = buildSitePoints([site({ id: 1, brand: "SoulCycle", city: "Austin" })], ["FENDI", "SoulCycle"]);
  const [austin] = buildMarkets(points, 3).features;
  assert.equal(austin?.properties.r0, 0);
  assert.equal(austin?.properties.r1, 1);
  assert.equal(austin?.properties.r2, 0);
});

test("a market's box comes back as map bounds", () => {
  assert.deepEqual(marketBounds({ w: -98, s: 30, e: -97, n: 31 }), [
    [-98, 30],
    [-97, 31],
  ]);
});

test("every site belongs to exactly one market", () => {
  const total = marketsFor(null).features.reduce((n, f) => n + f.properties.sites, 0);
  assert.equal(total, SITE_POINTS.features.length);
});

test("an open role labels only its own markets", () => {
  const role = RESUME_DATA.work.findIndex((w) => w.company === "Rivian Automotive");
  const cities = new Set(SITE_POINTS.features.filter((f) => f.properties.role === role).map((f) => f.properties.city));
  assert.deepEqual(new Set(marketsFor(role).features.map((f) => f.properties.city)), cities);
});

const nested = () =>
  buildMarkets(
    buildSitePoints(
      [
        site({ id: 1, city: "Big", lon: -100, lat: 30 }),
        site({ id: 2, city: "Big", lon: -98, lat: 32 }),
        site({ id: 3, city: "Inner", lon: -99, lat: 31 }),
        site({ id: 4, city: "Edge", lon: -98, lat: 32 }),
        site({ id: 5, city: "Outer", lon: -90, lat: 40 }),
      ],
      ["FENDI"],
    ),
    1,
  );

test("an open market takes in the markets inside its box, edges included", () => {
  assert.deepEqual(marketsInside(nested(), ["Big"]), ["Big", "Inner", "Edge"]);
});

test("a market outside the open market's box is not taken in", () => {
  assert.ok(!marketsInside(nested(), ["Big"]).includes("Outer"));
  assert.deepEqual(marketsInside(nested(), ["Outer"]), ["Outer"]);
});

test("a city that is not a market takes in nothing", () => {
  assert.deepEqual(marketsInside(nested(), ["Nowhere"]), []);
  assert.deepEqual(marketsInside(nested(), []), []);
});

test("of the cities clicked, those that are markets open", () => {
  assert.deepEqual(marketsInside(nested(), ["Nowhere", "Outer"]), ["Outer"]);
});

// Two markets apart, and one that sits in neither box but inside the box around both.
const apart = () =>
  buildMarkets(
    buildSitePoints(
      [
        site({ id: 1, city: "West", lon: -100, lat: 30 }),
        site({ id: 2, city: "West", lon: -99, lat: 31 }),
        site({ id: 3, city: "East", lon: -97, lat: 32 }),
        site({ id: 4, city: "East", lon: -96, lat: 33 }),
        site({ id: 5, city: "Between", lon: -98, lat: 31.5 }),
        site({ id: 6, city: "Far", lon: -90, lat: 40 }),
      ],
      ["FENDI"],
    ),
    1,
  );

test("markets opened together take in every market inside the box around them all", () => {
  assert.deepEqual(marketsInside(apart(), ["West"]), ["West"]);
  assert.deepEqual(marketsInside(apart(), ["East"]), ["East"]);
  assert.deepEqual(marketsInside(apart(), ["West", "East"]), ["West", "East", "Between"]);
});

test("a market clicked twice opens once", () => {
  assert.deepEqual(marketsInside(apart(), ["West", "East", "West"]), ["West", "East", "Between"]);
});

test("Beverly Hills sits inside Los Angeles, so opening Los Angeles takes it in", () => {
  const open = marketsInside(marketsFor(null), ["Los Angeles"]);
  assert.equal(open[0], "Los Angeles");
  assert.ok(open.includes("Beverly Hills"));
});

test("New York and New York Metro opened together both open, clicked ones first", () => {
  const open = marketsInside(marketsFor(null), ["New York", "New York Metro"]);
  assert.deepEqual(open.slice(0, 2), ["New York", "New York Metro"]);
});

test("the box around a group of markets spans them all", () => {
  assert.deepEqual(
    unionBox([
      { w: -100, s: 30, e: -99, n: 31 },
      { w: -97, s: 32, e: -96, n: 33 },
      { w: -98, s: 29, e: -98, n: 29 },
    ]),
    { w: -100, s: 29, e: -96, n: 33 },
  );
  assert.deepEqual(unionBox([{ w: -98, s: 30, e: -97, n: 31 }]), { w: -98, s: 30, e: -97, n: 31 });
});

test("the box around no markets is null", () => {
  assert.equal(unionBox([]), null);
});

test("a site read back off the map gets its empty fields back as null", () => {
  // MapLibre drops null properties when it tiles the data.
  const read = readSiteProps({ id: 323, role: 4, name: "Washington DC Temporary Site", type: "Temporary site", city: "Washington DC", sqftEstimate: false });
  assert.equal(read.sqft, null);
  assert.equal(read.opening, null);
  assert.equal(read.openedYear, null);
});

test("a site read back off the map keeps the fields it has", () => {
  const read = readSiteProps({ id: 317, role: 4, name: "Brooklyn Service Center", type: "Service center", city: "New York", sqft: 30000, sqftEstimate: false, opening: "nso", openedYear: 2021 });
  assert.equal(read.sqft, 30000);
  assert.equal(read.opening, "nso");
  assert.equal(read.openedYear, 2021);
});

test("every project type ranks alike, 1, and no project 0: one mark for them all", () => {
  for (const type of ["nso", "construction", "relocation", "renovation"] as const) assert.equal(openingRank(type), 1);
  assert.equal(openingRank(null), 0);
});

test("a market with a project among its sites carries a tier, and wears the notch", () => {
  const points = buildSitePoints(
    [
      site({ id: 1, city: "Austin", opening: "nso" }),
      site({ id: 2, city: "Austin", opening: "nso" }),
      site({ id: 3, city: "Austin" }),
      site({ id: 4, city: "Boston", opening: "construction" }),
      site({ id: 5, city: "Chicago" }),
    ],
    ["FENDI"],
  );
  const tiers = Object.fromEntries(buildMarkets(points, 1).features.map((f) => [f.properties.city, f.properties.tier]));
  assert.deepEqual(tiers, { Austin: 1, Boston: 1, Chicago: 0 });
});

test("with a role open, its markets carry that role's tiers only", () => {
  for (let role = 0; role < RESUME_DATA.work.length; role++) {
    const points = pointsFor(role);
    for (const m of buildMarkets(points, RESUME_DATA.work.length).features) {
      const here = points.features.filter((f) => f.properties.city === m.properties.city);
      const strongest = Math.max(0, ...here.map((f) => openingRank(f.properties.opening)));
      assert.equal(m.properties.tier, strongest, `role ${role}, ${m.properties.city}`);
    }
  }
});

test("the sites off the mainland views are Honolulu's six, and a brand's own share of them", () => {
  const all = farSites(pointsFor(null));
  assert.equal(all.length, 6);
  assert.deepEqual([...new Set(all.map((f) => f.properties.city))], ["Honolulu"]);
  const company = (name: string) => RESUME_DATA.work.findIndex((w) => w.company === name);
  assert.equal(farSites(pointsFor(company("Balenciaga"))).length, 2);
  assert.equal(farSites(pointsFor(company("FENDI"))).length, 2);
  assert.equal(farSites(pointsFor(company("SoulCycle"))).length, 0);
  // Every far site lies outside the opening view, which is why the map names them.
  const [[w]] = MAINLAND_BOUNDS;
  for (const f of all) assert.ok((f.geometry.coordinates[0] ?? 0) < w);
});

test("the caption's far link counts the captioned brand's own far sites, and none for a brand without its own sites", () => {
  const company = (name: string) => RESUME_DATA.work.findIndex((w) => w.company === name);
  assert.deepEqual(farFor(null), { city: "Honolulu", count: 6 });
  assert.deepEqual(farFor(company("Balenciaga")), { city: "Honolulu", count: 2 });
  assert.equal(farFor(company("Rivian Automotive")), null);
  // Independent has clients, none of them far from the opening view.
  assert.equal(farFor(company("Independent")), null);
});

test("a market counts its opening sites, of every tier", () => {
  const points = buildSitePoints(
    [
      site({ id: 1, city: "Austin", opening: "nso" }),
      site({ id: 2, city: "Austin", opening: "construction" }),
      site({ id: 3, city: "Austin" }),
      site({ id: 4, city: "Boston" }),
    ],
    ["FENDI"],
  );
  const openings = Object.fromEntries(buildMarkets(points, 1).features.map((f) => [f.properties.city, f.properties.openings]));
  assert.deepEqual(openings, { Austin: 2, Boston: 0 });
  // Every opening site is in one market: the markets' counts add up to the records'.
  const all = buildMarkets(pointsFor(null), RESUME_DATA.work.length).features.reduce((n, f) => n + f.properties.openings, 0);
  assert.equal(all, pointsFor(null).features.filter((f) => f.properties.opening !== null).length);
});

test("a closed site carries that it closed, and the year where the records hold one", () => {
  const points = buildSitePoints([site({ status: "closed" }), site({ id: 2, status: "closed", closedYear: 2026 }), site({ id: 3 })], ["FENDI"]);
  assert.deepEqual(
    points.features.map((f) => [f.properties.closed, f.properties.closedYear]),
    [
      [true, null],
      [true, 2026],
      [false, null],
    ],
  );
});

test("Independent's four clients are on the map at their towns, Twisted Stems closed in 2026", () => {
  const role = RESUME_DATA.work.findIndex((w) => w.company === "Independent");
  const shown = pointsFor(role).features.map((f) => [f.properties.name, f.properties.type, f.properties.city, f.properties.closedYear]);
  assert.deepEqual(shown, [
    ["Twisted Stems", "Floral shop", "Crystal Lake", 2026],
    ["Mangione Landscaping", "Landscaping", "Crystal Lake", null],
    ["Bee’s Knees", "Restaurant and bar", "Brooklyn", null],
    ["Woodworking", "Woodworking", "Montrose", null],
  ]);
  assert.equal(RESUME_DATA.work[role]?.sites, 4);
  assert.equal(RESUME_DATA.work[role]?.countWord, "clients");
});

test("Independent's bounds run from Montrose to Brooklyn", () => {
  const role = RESUME_DATA.work.findIndex((w) => w.company === "Independent");
  assert.deepEqual(roleBounds(role), [
    [-107.8762, 38.4783],
    [-73.9442, 42.2411],
  ]);
});
