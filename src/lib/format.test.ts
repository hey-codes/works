import assert from "node:assert/strict";
import { test } from "node:test";
import { compactSqft, detailRows, nameParts, openingLabel, toolsFor } from "./format.ts";

test("under a thousand square feet stays exact", () => {
  assert.equal(compactSqft(603), "603");
  assert.equal(compactSqft(999), "999");
});

test("one to ten thousand keeps one decimal, and drops a .0", () => {
  assert.equal(compactSqft(6200), "6.2K");
  assert.equal(compactSqft(6000), "6K");
  assert.equal(compactSqft(1000), "1K");
  assert.equal(compactSqft(1049), "1K");
});

test("ten thousand and up rounds to whole thousands", () => {
  assert.equal(compactSqft(18417), "18K");
  assert.equal(compactSqft(46470), "46K");
  assert.equal(compactSqft(9960), "10K");
});

const words = { nso: "NSO", construction: "IN CONSTRUCTION", relocation: "RELOCATION", renovation: "RENOVATION" };

test("a project flag carries its year", () => {
  assert.equal(openingLabel("nso", 2022, words), "NSO · 2022");
  assert.equal(openingLabel("renovation", 2019, words), "RENOVATION · 2019");
});

test("a site in construction carries the year it opened; with no year the flag stands alone", () => {
  assert.equal(openingLabel("construction", 2025, words), "IN CONSTRUCTION · 2025");
  assert.equal(openingLabel("nso", null, words), "NSO");
});

test("details read SKILL, then TOOLS, then AWARD, each value its own chip", () => {
  const rows = detailRows(
    [
      { label: "Skill", value: "Facilities Project Management" },
      { label: "Award", value: "Soulccolade" },
      { label: "Skill", value: "Launch Operations" },
    ],
    ["monday.com", "Procore"],
  );
  assert.deepEqual(rows, [
    { key: "SKILL", values: ["Facilities Project Management", "Launch Operations"] },
    { key: "TOOLS", values: ["monday.com", "Procore"] },
    { key: "AWARD", values: ["Soulccolade"] },
  ]);
});

test("a key with nothing in it has no row", () => {
  assert.deepEqual(detailRows([{ label: "Skill", value: "Vendor Management" }]), [{ key: "SKILL", values: ["Vendor Management"] }]);
});

test("a role's tools are the apps that list it, A to Z ignoring case, and Personal is no role", () => {
  const data = {
    tools: {
      cmms: {},
      apps: { Slack: ["SoulCycle" as const], "monday.com": ["SoulCycle" as const], Asana: ["Bathhouse" as const], Notion: ["Personal" as const], Procore: ["SoulCycle" as const] },
    },
  };
  assert.deepEqual(toolsFor(data, "SoulCycle"), ["monday.com", "Procore", "Slack"]);
  assert.deepEqual(toolsFor(data, "Independent"), []);
  assert.deepEqual(toolsFor(data, "Personal"), ["Notion"]);
});

test("a name with two brands links each brand by its own word", () => {
  const role = {
    company: "J.Crew / Madewell",
    display: "J.Crew and Madewell",
    links: [
      { name: "J.Crew", url: "https://www.jcrew.com/" },
      { name: "Madewell", url: "https://www.madewell.com/" },
    ],
  };
  assert.deepEqual(nameParts(role), [
    { text: "J.Crew", url: "https://www.jcrew.com/" },
    { text: " and " },
    { text: "Madewell", url: "https://www.madewell.com/" },
  ]);
  assert.equal(nameParts(role).map((p) => p.text).join(""), "J.Crew and Madewell");
});

test("a name with one link is one linked part, and with none one plain part", () => {
  assert.deepEqual(nameParts({ company: "FENDI", link: "https://www.fendi.com/us-en/" }), [{ text: "FENDI", url: "https://www.fendi.com/us-en/" }]);
  assert.deepEqual(nameParts({ company: "Independent" }), [{ text: "Independent" }]);
});
