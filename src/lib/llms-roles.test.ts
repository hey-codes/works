import assert from "node:assert/strict";
import { test } from "node:test";
import { LLMS_PROSE } from "../data/llms-prose.ts";
import { RESUME_DATA } from "../data/resume-data.ts";
import { appsFor, roleCard, rolesTable, sitesText, yearsCell } from "./llms-roles.ts";
import type { LlmsProse, ResumeData, Role } from "./types.ts";

function role(company: string): Role {
  const r = RESUME_DATA.work.find((w) => w.company === company);
  if (!r) throw new Error(`no role ${company}`);
  return r;
}

test("years", () => {
  assert.equal(yearsCell(role("Industrious")), "2026 (5 mo)");
  assert.equal(yearsCell(role("FENDI")), "2018-2021 (2 yr 5 mo)");
  assert.equal(yearsCell(role("J.Crew / Madewell")), "2013-2015 (2 yr 2 mo)");
  assert.equal(yearsCell(role("Independent")), "2024-Present");
});

test("sites", () => {
  assert.equal(sitesText(role("Rivian Automotive"), LLMS_PROSE), "6 opened, 4 in construction (each 1 to 3 months from opening), 1 temporary site");
  assert.equal(sitesText(role("Independent"), LLMS_PROSE), "4 clients");
  assert.equal(sitesText(role("Industrious"), LLMS_PROSE), "51");
  assert.equal(sitesText(role("Balenciaga"), LLMS_PROSE), "55 boutiques + HQ");
});

test("the table has a header, a rule and one row per role in page order", () => {
  const lines = rolesTable(RESUME_DATA, LLMS_PROSE).split("\n");
  assert.equal(lines[0], "| Years | Brand | Title | Sector | Sites | Sq ft | CMMS | Team |");
  assert.equal(lines.length - 2, RESUME_DATA.work.length);
  assert.ok(String(lines[2]).startsWith("| 2026 (5 mo) | Industrious |"), lines[2]);
});

test("Independent's row leaves sector, sq ft, CMMS and team blank", () => {
  const row = rolesTable(RESUME_DATA, LLMS_PROSE).split("\n").find((l) => l.includes("| Independent |"));
  assert.ok(row?.endsWith("| 4 clients |  |  |  |"), row);
});

test("a migration reads with an arrow", () => {
  const row = rolesTable(RESUME_DATA, LLMS_PROSE).split("\n").find((l) => l.includes("| Rivian Automotive |"));
  assert.ok(row?.includes("| Limble → FEXA |"), row);
});

test("a pipe in a cell is escaped", () => {
  const work = RESUME_DATA.work.map((w) => (w.company === "Industrious" ? { ...w, title: "A | B" } : w));
  const resume: ResumeData = { ...RESUME_DATA, work };
  assert.ok(rolesTable(resume, LLMS_PROSE).includes("A \\| B"));
});

test("a card keeps only what the table doesn't carry", () => {
  const lines = roleCard(role("Industrious"), RESUME_DATA, LLMS_PROSE).split("\n");
  assert.equal(lines[0], "### Industrious · Facilities Consultant (Contract) · Apr 2026 to Aug 2026");
  const keys = lines.filter((l) => /^- [A-Z ]+: /.test(l)).map((l) => l.slice(2, l.indexOf(":")));
  assert.deepEqual(keys.slice(0, 2), ["BASE", "APPS"]);
  for (const tableKey of ["SECTOR", "SITES", "SQ FT", "CMMS", "TEAM"]) assert.ok(!keys.includes(tableKey), tableKey);
});

test("AWARD only where the role has one", () => {
  assert.ok(roleCard(role("FENDI"), RESUME_DATA, LLMS_PROSE).includes("\n- AWARD: Above & Beyond\n"));
  assert.ok(!roleCard(role("Bathhouse"), RESUME_DATA, LLMS_PROSE).includes("AWARD"));
});

test("a role with no prose throws", () => {
  const { Bathhouse: _, ...rest } = LLMS_PROSE.roles;
  const prose = { ...LLMS_PROSE, roles: rest } as unknown as LlmsProse;
  assert.throws(() => roleCard(role("Bathhouse"), RESUME_DATA, prose), /Bathhouse/);
});

test("apps by place", () => {
  assert.deepEqual(appsFor("Bathhouse", RESUME_DATA.tools.apps), ["Asana", "Google Workspace", "Slack"]);
});

test("a full card runs in order", () => {
  const S = (text: string) => ({ text, src: "test §1" });
  const prose = {
    ...LLMS_PROSE,
    roles: {
      ...LLMS_PROSE.roles,
      Bathhouse: {
        ...LLMS_PROSE.roles.Bathhouse,
        proves: S("proves"),
        before: S("before"),
        after: S("after"),
        reliedOn: S("relied"),
        openings: S("openings"),
        quotes: [S("a quote")],
      },
    },
  };
  const card = roleCard(role("Bathhouse"), RESUME_DATA, prose);
  const keys = card.split("\n").filter((l) => /^- [A-Z ]+: /.test(l)).map((l) => l.slice(2, l.indexOf(":")));
  assert.deepEqual(keys, ["BASE", "APPS", "PROVES", "BEFORE", "AFTER", "RELIED ON FOR", "OPENINGS"]);
  assert.ok(card.includes('\n\n> "a quote"\n\n'));
  assert.ok(!card.includes("[src:"));
  assert.ok(roleCard(role("Bathhouse"), RESUME_DATA, prose, { sources: true }).includes("- PROVES: proves [src: test §1]"));
});

test("a card with two quotes puts a blank line between them", () => {
  const prose = {
    ...LLMS_PROSE,
    roles: { ...LLMS_PROSE.roles, Industrious: { ...LLMS_PROSE.roles.Industrious, quotes: [{ text: "One.", src: "t §1" }, { text: "Two.", src: "t §2" }] } },
  };
  const card = roleCard(role("Industrious"), RESUME_DATA, prose);
  assert.ok(card.includes('> "One."\n\n> "Two."'), card);
});
