import assert from "node:assert/strict";
import { test } from "node:test";
import { RESUME_DATA } from "../data/resume-data.ts";
import { openingsByRole, openingTiers, portfolioTiers } from "./openings.ts";

const ROLES = RESUME_DATA.work;
const rows = openingsByRole(ROLES.length);
const of = (company: string) => rows[ROLES.findIndex((w) => w.company === company)] ?? [];

test("each role's opening rows list its opening sites from the map records", () => {
  assert.equal(rows.length, ROLES.length);
  assert.deepEqual(Object.fromEntries(ROLES.map((w, i) => [w.company, rows[i]?.length])), {
    Industrious: 0,
    Independent: 0,
    Bathhouse: 0,
    Balenciaga: 4,
    "Rivian Automotive": 10,
    FENDI: 7,
    "Dolce & Gabbana": 5,
    SoulCycle: 14,
    "J.Crew / Madewell": 5,
  });
});

test("Rivian's opening rows hold its caption's opened sites, and the pre-openings beside them", () => {
  const rivian = ROLES.find((w) => w.company === "Rivian Automotive");
  const band = of("Rivian Automotive");
  assert.equal(band.filter((r) => r.opening === "opened").length, rivian?.sites);
  assert.equal(band.filter((r) => r.opening === "pre-opening").length, 4);
});

test("rows run newest opening year first, an undated tier after the dated, then the records' order", () => {
  for (const band of rows) {
    for (let i = 1; i < band.length; i++) {
      const a = band[i - 1];
      const b = band[i];
      if (!a || !b) continue;
      if (a.openedYear === b.openedYear) assert.ok(a.id < b.id, `${a.id} before ${b.id}`);
      else if (a.openedYear === null) assert.fail(`undated ${a.id} before dated ${b.id}`);
      else if (b.openedYear !== null) assert.ok(a.openedYear > b.openedYear, `${a.id} before ${b.id}`);
    }
  }
});

test("an opening row carries its site's id, name, flag and year, and nothing else", () => {
  const first = of("FENDI")[0];
  assert.deepEqual(Object.keys(first ?? {}).sort(), ["id", "name", "openedYear", "opening"]);
});

test("a role's opening tiers, in the flags' order, each site newest first", () => {
  const role = (name: string) => ROLES.findIndex((w) => w.company === name);
  const rivian = openingTiers(role("Rivian Automotive"));
  assert.deepEqual(rivian.map((t) => [t.opening, t.sites.length]), [
    ["opened", 6],
    ["pre-opening", 4],
  ]);
  assert.deepEqual(openingTiers(role("SoulCycle")).map((t) => t.opening), ["supported"]);
  assert.deepEqual(openingTiers(role("Industrious")), []);
  // Within a tier, the band's order (newest opening year first).
  const flat = openingTiers(role("FENDI")).flatMap((t) => t.sites.map((s) => s.id));
  const band = openingsByRole(ROLES.length)[role("FENDI")]?.map((r) => r.id) ?? [];
  assert.deepEqual([...flat].sort(), [...band].sort());
  // And each tier keeps the band's order among its own sites.
  for (const name of ["FENDI", "Rivian Automotive", "SoulCycle"]) {
    const rows = openingsByRole(ROLES.length)[role(name)] ?? [];
    for (const t of openingTiers(role(name))) {
      assert.deepEqual(
        t.sites.map((s) => s.id),
        rows.filter((r) => r.opening === t.opening).map((r) => r.id),
      );
    }
  }
});

test("the portfolio's tiers hold every opening site once, each tier newest opening first", () => {
  const roles = RESUME_DATA.work.length;
  const tiers = portfolioTiers(roles);
  const all = openingsByRole(roles).flat();
  assert.equal(tiers.reduce((n, t) => n + t.sites.length, 0), all.length);
  for (const t of tiers) {
    const years = t.sites.map((s) => all.find((r) => r.id === s.id)?.openedYear ?? null);
    const dated = years.filter((y): y is number => y !== null);
    assert.deepEqual(dated, [...dated].sort((a, b) => b - a), t.opening);
  }
});
