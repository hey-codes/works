import assert from "node:assert/strict";
import { test } from "node:test";
import { cardChips, showsType } from "./card-chips.ts";

const site = (over: Partial<Parameters<typeof cardChips>[0]>) => ({ name: "Lenox", type: "Boutique", opening: null, closed: false, closedYear: null, ...over });
const keys = (s: Parameters<typeof cardChips>[0]) => cardChips(s).map((c) => c.key);

test("a flagship, an office and a flex office say so as chips, and drop the TYPE row", () => {
  assert.deepEqual(keys(site({ type: "Flagship" })), ["flagship"]);
  assert.deepEqual(keys(site({ type: "Office" })), ["office"]);
  assert.deepEqual(keys(site({ type: "Flex office" })), ["flexOffice"]);
  for (const type of ["Flagship", "Office", "Flex office"]) assert.equal(showsType(site({ type })), false, type);
  assert.equal(showsType(site({ type: "Boutique" })), true);
});

test("a TYPE that only repeats the name is dropped", () => {
  assert.equal(showsType(site({ name: "Woodworking", type: "Woodworking" })), false);
});

test("NEW LOCATION marks the openings Cody led or is leading, never a supported one", () => {
  assert.deepEqual(keys(site({ opening: "opened" })), ["newLocation"]);
  assert.deepEqual(keys(site({ opening: "pre-opening" })), ["newLocation"]);
  assert.deepEqual(keys(site({ opening: "in-progress" })), ["newLocation"]);
  assert.deepEqual(keys(site({ opening: "supported" })), []);
});

test("CLOSED is last and muted, with its year where the records hold one", () => {
  const chips = cardChips(site({ type: "Flagship", opening: "opened", closed: true, closedYear: 2026 }));
  assert.deepEqual(chips, [
    { key: "flagship", tone: "ink", year: null },
    { key: "newLocation", tone: "red", year: null },
    { key: "closed", tone: "muted", year: 2026 },
  ]);
  assert.deepEqual(cardChips(site({ closed: true })), [{ key: "closed", tone: "muted", year: null }]);
});
