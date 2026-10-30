import assert from "node:assert/strict";
import { test } from "node:test";
import { LOCATIONS } from "../data/locations.ts";
import { projects, siteTypeMix, topMarkets } from "./llms-portfolio.ts";
import type { Site } from "./types.ts";

let nextId = 1;
function site(partial: Partial<Site>): Site {
  return {
    id: nextId++,
    brand: "FENDI",
    name: "Test site",
    type: "Boutique",
    sqft: null,
    city: "Chicago",
    country: "US",
    lat: 0,
    lon: 0,
    placeholder: false,
    status: "open",
    kind: "store",
    ...partial,
  };
}
const inCity = (city: string, n: number) => Array.from({ length: n }, () => site({ city }));

test("New York and New York Metro merge", () => {
  const rows = [...inCity("New York", 2), ...inCity("New York Metro", 2), ...inCity("Chicago", 3)];
  assert.deepEqual(topMarkets(rows, 5), [
    { label: "New York area", sites: 4 },
    { label: "Chicago", sites: 3 },
  ]);
});

test("ties sort by name", () => {
  const rows = [...inCity("Boston", 2), ...inCity("Austin", 2)];
  assert.deepEqual(topMarkets(rows, 5).map((m) => m.label), ["Austin", "Boston"]);
});

test("topMarkets returns at most n", () => {
  const rows = [...inCity("A", 3), ...inCity("B", 2), ...inCity("C", 1)];
  assert.deepEqual(topMarkets(rows, 2).map((m) => m.label), ["A", "B"]);
});

test("site types group as the spec says", () => {
  const types = ["Boutique", "Retail store", "Madewell store", "Flagship", "Flex office", "Studio", "Service center", "Showroom", "Thermal spa"];
  assert.deepEqual(siteTypeMix(types.map((type) => site({ type }))), [
    { label: "retail and Madewell stores", sites: 2 },
    { label: "boutiques", sites: 1 },
    { label: "flagships", sites: 1 },
    { label: "flex offices", sites: 1 },
    { label: "service centers", sites: 1 },
    { label: "studios", sites: 1 },
    { label: "other", sites: 2 },
  ]);
});

test("the real records' groups add up", () => {
  assert.equal(siteTypeMix(LOCATIONS).reduce((n, g) => n + g.sites, 0), LOCATIONS.length);
});

test("projects count by type, then by brand", () => {
  const rows = [
    site({ opening: "nso", brand: "SoulCycle" }),
    site({ opening: "nso", brand: "SoulCycle" }),
    site({ opening: "nso", brand: "FENDI" }),
    site({ opening: "construction", brand: "FENDI" }),
    site({}),
  ];
  assert.deepEqual(projects(rows), [
    { label: "new site openings", sites: 3, byBrand: [{ label: "SoulCycle", sites: 2 }, { label: "FENDI", sites: 1 }] },
    { label: "sites in construction", sites: 1, byBrand: [{ label: "FENDI", sites: 1 }] },
  ]);
});
