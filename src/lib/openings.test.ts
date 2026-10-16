import assert from "node:assert/strict";
import { test } from "node:test";
import { RESUME_DATA } from "../data/resume-data.ts";
import { PROJECT_ORDER, projectTypes } from "./openings.ts";
import { pointsFor, SITE_POINTS } from "./site-points.ts";

const role = (company: string) => RESUME_DATA.work.findIndex((w) => w.company === company);
const count = (type: string) => SITE_POINTS.features.filter((f) => f.properties.opening === type).length;

test("the records hold 37 new site openings and 8 sites in construction (Cody, 2026-10-15)", () => {
  assert.equal(count("nso"), 37);
  assert.equal(count("construction"), 8);
  assert.equal(count("relocation") + count("renovation"), 0);
});

test("the legend names only the project types the records hold, in its order", () => {
  assert.deepEqual(projectTypes(SITE_POINTS), ["nso", "construction"]);
  assert.deepEqual(PROJECT_ORDER, ["nso", "construction", "relocation", "renovation"]);
});

test("Rivian's six openings are its new site openings, as its copy counts them", () => {
  const rivian = pointsFor(role("Rivian Automotive")).features;
  assert.equal(rivian.filter((f) => f.properties.opening === "nso").length, RESUME_DATA.work[role("Rivian Automotive")]?.sites);
  assert.equal(rivian.filter((f) => f.properties.opening === "construction").length, 4);
});

test("every project type has its flag copy", () => {
  for (const type of PROJECT_ORDER) assert.ok(RESUME_DATA.map.card.flags[type], type);
});
