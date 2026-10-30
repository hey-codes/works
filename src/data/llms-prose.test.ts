import assert from "node:assert/strict";
import { test } from "node:test";
import { publicTextProblems } from "../lib/public-text.ts";
import { renderLlms, sourcedItems } from "../lib/llms.ts";
import { LLMS_PROSE } from "./llms-prose.ts";
import { LOCATIONS } from "./locations.ts";
import { RESUME_DATA } from "./resume-data.ts";

const companies = RESUME_DATA.work.map((w) => w.company);

test("every role has prose", () => {
  assert.deepEqual(Object.keys(LLMS_PROSE.roles).sort(), [...companies].sort());
});

test("every sector and result names a real role", () => {
  const named = [...LLMS_PROSE.lookingFor.sectors.flatMap((s) => s.roles), ...LLMS_PROSE.results.map((r) => r.role)];
  for (const role of named) assert.ok(companies.includes(role), role);
});

test("prose passes the public-text scan", () => {
  assert.deepEqual(publicTextProblems(JSON.stringify(LLMS_PROSE), { dollars: true }), []);
});

test("no Independent site name appears", () => {
  const text = JSON.stringify(LLMS_PROSE);
  for (const row of LOCATIONS.filter((l) => l.brand === "Independent")) assert.ok(!text.includes(row.name), row.name);
});

test("the TEAM lines are og-resume's", () => {
  assert.equal(LLMS_PROSE.roles["Bathhouse"].team, "6 direct reports, 200 on-site staff");
  assert.equal(LLMS_PROSE.roles["J.Crew / Madewell"].team, undefined);
  assert.equal(LLMS_PROSE.roles["Independent"].team, undefined);
});

test("solo roles read one way", () => {
  assert.equal(LLMS_PROSE.roles["FENDI"].team, "sole FM");
  assert.equal(LLMS_PROSE.roles["Dolce & Gabbana"].team, "sole FM");
});

test("Rivian's sites read as Cody picked", () => {
  assert.equal(LLMS_PROSE.roles["Rivian Automotive"].sites, "6 opened, 4 in construction (each 1 to 3 months from opening), 1 temporary site");
});

test("every sourced item has a source", () => {
  for (const item of sourcedItems(LLMS_PROSE)) assert.ok(item.src.trim() !== "", JSON.stringify(item));
});

test("Getting personal is GP-2", () => {
  assert.equal(
    LLMS_PROSE.personal.text,
    "Texas born. Colorado educated. True New Yorker (11 years). Dog dad (Blue Heeler). Chicago-based since 2025; currently finishing a family home renovation.",
  );
  assert.equal(LLMS_PROSE.personal.src, "og-resume GP-2");
});

const REAL = { resume: RESUME_DATA, sites: LOCATIONS, prose: LLMS_PROSE, updated: "2026-10-29" };

test("layer 1 is filled", () => {
  assert.ok(LLMS_PROSE.whyCody.length >= 3, `whyCody ${LLMS_PROSE.whyCody.length}`);
  assert.ok(LLMS_PROSE.quickAnswers.length >= 5, `quickAnswers ${LLMS_PROSE.quickAnswers.length}`);
  assert.ok(LLMS_PROSE.scale.length >= 4, `scale ${LLMS_PROSE.scale.length}`);
});

test("2024 to 2026 is a question for Cody", () => {
  const answer = LLMS_PROSE.quickAnswers.find((x) => x.q.includes("2024"));
  assert.ok(answer, "no quick answer asks about 2024");
  assert.ok(answer.a.includes("question for Cody"), answer.a);
  assert.ok(answer.a.includes("https://www.linkedin.com/in/heycody/"), answer.a);
});

test("no Independent site name appears in the render", () => {
  const plain = (s: string) => s.replaceAll("’", "'");
  const text = plain(renderLlms(REAL));
  for (const row of LOCATIONS.filter((l) => l.brand === "Independent")) assert.ok(!text.includes(plain(row.name)), row.name);
});

test("every skill with proof is a listed skill", () => {
  const listed = RESUME_DATA.skills.flatMap((g) => g.items);
  for (const x of LLMS_PROSE.skillProof) assert.ok(listed.includes(x.skill), x.skill);
});

test("recent roles have their story", () => {
  const recent = ["Industrious", "Independent", "Bathhouse", "Balenciaga", "Rivian Automotive"] as const;
  for (const company of recent) assert.ok(LLMS_PROSE.roles[company].proves, `${company} proves`);
  for (const company of ["Balenciaga", "Rivian Automotive"] as const) assert.ok(LLMS_PROSE.roles[company].openings, `${company} openings`);
  for (const [company, entry] of Object.entries(LLMS_PROSE.roles)) assert.ok((entry.quotes ?? []).length <= 2, `${company} quotes`);
});

test("earlier roles have their story", () => {
  const earlier = ["FENDI", "Dolce & Gabbana", "SoulCycle", "J.Crew / Madewell"] as const;
  for (const company of earlier) assert.ok(LLMS_PROSE.roles[company].proves, `${company} proves`);
  // FENDI's opening names are SOFT in its profile: the card carries the count only.
  assert.equal(LLMS_PROSE.roles["FENDI"].openings, undefined);
  assert.ok(LLMS_PROSE.roles["SoulCycle"].openings, "SoulCycle openings");
  for (const company of earlier) assert.ok((LLMS_PROSE.roles[company].quotes ?? []).length <= 2, `${company} quotes`);
});
