import assert from "node:assert/strict";
import { test } from "node:test";
import { RESUME_DATA } from "../data/resume-data.ts";
import { detailRows, toolsFor } from "./format.ts";

const role = (company: string) => {
  const w = RESUME_DATA.work.find((x) => x.company === company);
  assert.ok(w, company);
  return w;
};
const of = (company: string, label: "Skill" | "Award") =>
  role(company)
    .details.filter((d) => d.label === label)
    .map((d) => d.value);

test("a role's chips are at most three skills and its awards, with short values", () => {
  for (const w of RESUME_DATA.work) {
    assert.ok(of(w.company, "Skill").length <= 3, w.company);
    for (const d of w.details) {
      assert.ok(["Skill", "Award"].includes(d.label), `${w.company}: ${d.label}`);
      assert.ok(d.value.split(/\s+/).length <= 4, `${w.company}: ${d.value}`);
    }
  }
});

test("the skills are the top three Cody approved on 2026-10-15, in his order", () => {
  assert.deepEqual(of("Industrious", "Skill"), ["Office Operations", "Multi-location Management", "Key Performance Indicators"]);
  assert.deepEqual(of("Independent", "Skill"), ["Facilities Management", "Vendor Management", "Maintenance Management"]);
  assert.deepEqual(of("Bathhouse", "Skill"), ["Hospitality Management", "Cross-functional Team Leadership", "Software Implementation"]);
  assert.deepEqual(of("Balenciaga", "Skill"), ["Opening New Locations", "Program Management", "Software Implementation"]);
  assert.deepEqual(of("Rivian Automotive", "Skill"), ["Launch Operations", "Program Management", "Software Implementation"]);
  assert.deepEqual(of("FENDI", "Skill"), ["Opening New Locations", "Software Implementation", "Loss Prevention"]);
  assert.deepEqual(of("Dolce & Gabbana", "Skill"), ["Luxury Retail", "Contract Management", "Multi-location Management"]);
  assert.deepEqual(of("SoulCycle", "Skill"), ["Facilities Project Management", "Launch Operations", "Opening New Locations"]);
  assert.deepEqual(of("J.Crew / Madewell", "Skill"), ["Facilities Project Management", "Opening New Locations", "Multi-location Management"]);
});

test("the awards are unchanged", () => {
  assert.deepEqual(of("FENDI", "Award"), ["Above & Beyond"]);
  assert.deepEqual(of("SoulCycle", "Award"), ["Soulccolade"]);
  const others = RESUME_DATA.work.filter((w) => w.company !== "FENDI" && w.company !== "SoulCycle");
  for (const w of others) assert.deepEqual(of(w.company, "Award"), [], w.company);
});

test("a role's TOOLS row is its apps from STACK, A to Z", () => {
  assert.deepEqual(toolsFor(RESUME_DATA, "Rivian Automotive"), ["Airtable", "Autodesk Construction Cloud", "Confluence", "Coupa", "Figma", "Procore", "Smartsheet", "Trello"]);
  assert.deepEqual(toolsFor(RESUME_DATA, "Independent"), []);
  const keys = (company: string) => detailRows(role(company).details, toolsFor(RESUME_DATA, company)).map((r) => r.key);
  assert.deepEqual(keys("Independent"), ["SKILL"]);
  assert.deepEqual(keys("FENDI"), ["SKILL", "TOOLS", "AWARD"]);
});

test("STACK's apps run A to Z ignoring case, each list in page order with Personal last", () => {
  const names = Object.keys(RESUME_DATA.tools.apps);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));
  const order = [...RESUME_DATA.work.map((w) => w.company), "Personal"];
  for (const [app, at] of Object.entries(RESUME_DATA.tools.apps)) {
    const idx = at.map((c) => order.indexOf(c));
    assert.ok(!idx.includes(-1), app);
    assert.deepEqual(idx, [...idx].sort((a, b) => a - b), app);
  }
});
