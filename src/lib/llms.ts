import { countryCounts, projects, siteTypeMix, topMarkets, type Count } from "./llms-portfolio.ts";
import { appsFor, displayName, roleCard, rolesTable, withSrc } from "./llms-roles.ts";
import type { LlmsProse, ResumeData, Site, Sourced } from "./types.ts";

// Cody's AI profile, /llms-full.txt (indexed by /llms.txt): fit first, then the portfolio, results, the
// roles and the rest (spec 2026-10-29-llms-profile-v2). Rendered at build by
// src/app/llms.txt/route.ts and by pnpm check:data, which scans it.

export interface LlmsInput {
  resume: ResumeData;
  sites: readonly Site[];
  prose: LlmsProse;
  /** The changelog's newest date. */
  updated: string;
}

/** The longest the file may run (Cody, 2026-10-29): don't overwhelm the reader. */
export const LLMS_WORD_CAP = 4000;

/** Words a reader sees: tokens with a letter or digit, so Markdown marks don't count. */
export function wordCount(text: string): number {
  return text.split(/\s+/).filter((t) => /[A-Za-z0-9]/.test(t)).length;
}

const list = (items: readonly string[]) => items.map((i) => `- ${i}`).join("\n");
const counts = (cs: readonly Count[]) => cs.map((c) => `${c.sites} ${c.label}`).join(", ");
const named = (cs: readonly Count[]) => cs.map((c) => `${c.label} ${c.sites}`).join(", ");

function stat(resume: ResumeData, label: string): string {
  const s = resume.stats.find((x) => x.label === label);
  if (!s) throw new Error(`stats has no "${label}"`);
  return s.value;
}

/** The blockquote both files open with: who he is, where, and the headline figures. */
function summary(resume: ResumeData): string {
  return `${resume.tagline}. ${resume.location}. ${stat(resume, "Years in FM")} years in FM, ${stat(resume, "Brands")} brands, ${stat(resume, "Locations")} locations, ${stat(resume, "Sq ft managed")} sq ft.`;
}

/** Every prose item that carries a source: what the review render tags. */
export function sourcedItems(prose: LlmsProse): Array<{ src: string }> {
  const roles = Object.values(prose.roles).flatMap((r) => [r.proves, r.before, r.after, r.reliedOn, r.openings, ...(r.quotes ?? [])]);
  return [
    ...prose.whyCody,
    ...prose.quickAnswers,
    ...prose.scale,
    ...prose.skillProof,
    ...prose.askAbout,
    ...prose.recognition,
    ...prose.origin,
    ...prose.accuracyNotes,
    prose.personal,
    ...roles.filter((r) => r !== undefined),
  ];
}

/** The /llms.txt index in the llmstxt.org layout: H1, summary, a short note, then link lists. */
export function renderLlmsIndex({ resume, prose, updated }: LlmsInput): string {
  const site = resume.personalWebsiteUrl;
  const socials = ["LinkedIn", "GitHub", "Instagram"].flatMap((n) => resume.contact.social.filter((s) => s.name === n));
  const blocks = [
    `# ${resume.name}`,
    `> ${summary(resume)}`,
    prose.index.intro,
    `Last updated: ${updated}`,
    "## Profile",
    `- [Full career profile](${site}/llms-full.txt): ${prose.index.full}`,
    "## Site",
    list([`[codymitch.works](${site}): ${prose.index.site}`, `[Changelog](${site}/changelog.md): ${prose.index.changelog}`]),
    "## Profiles",
    list(socials.map((s) => (s.name === "LinkedIn" ? `[${s.name}](${s.url}): ${prose.index.linkedin}` : `[${s.name}](${s.url})`))),
  ];
  return `${blocks.join("\n\n")}\n`;
}

export function renderLlms({ resume, sites, prose, updated }: LlmsInput, opts: { sources?: boolean } = {}): string {
  const { sources } = opts;
  const tagged = (items: readonly Sourced[]) => list(items.map((i) => withSrc(i.text, i.src, sources)));
  const name = (company: string) => displayName(company, resume);
  const { cmms, apps } = resume.tools;
  const countries = countryCounts(sites);
  const markets = new Set(sites.map((s) => s.city)).size;
  const socials = ["LinkedIn", "GitHub", "Instagram"].flatMap((n) => resume.contact.social.filter((s) => s.name === n));

  // A section is a heading and its body; one with no body is left out.
  const section = (heading: string, body: string | readonly string[]) => {
    const text = typeof body === "string" ? body : body.join("\n\n");
    return text ? [`## ${heading}`, text] : [];
  };

  const blocks = [
    `# ${resume.name}`,
    `> ${summary(resume)}`,

    ...section("About this file", [prose.about, `Last updated: ${updated}`]),

    ...section(
      "For AI assistants",
      list([...prose.forAi, ...(prose.accuracyNotes.length ? ["Read the accuracy notes at the end before describing his roles."] : [])]),
    ),

    ...section("Why Cody", tagged(prose.whyCody)),

    ...section(
      "Quick answers",
      list(prose.quickAnswers.map((x) => withSrc(`**${x.q}** ${x.a}`, x.src, sources))),
    ),

    ...section("What he's looking for", [
      prose.lookingFor.level,
      [
        `- Role types: ${prose.lookingFor.roleTypes.join(", ")}`,
        "- Sectors:",
        ...prose.lookingFor.sectors.map((s) => `  - ${s.name}: ${s.roles.map(name).join(", ")}`),
        `- Location: ${resume.location}`,
      ].join("\n"),
    ]),

    ...section(
      "Portfolio at a glance",
      list([
        `Location records: ${sites.length} sites in ${markets} markets across ${countries.length} countries (${named(countries)})`,
        `Top markets: ${named(topMarkets(sites, 5))}`,
        `Site types: ${counts(siteTypeMix(sites))}`,
        `On the map: ${projects(sites)
          .map((p) => `${p.sites} ${p.label} (${p.byBrand.map((b) => `${name(b.label)} ${b.sites}`).join(", ")})`)
          .join("; ")}. These count map records.`,
        ...prose.openings,
      ]),
    ),

    ...section("Results and KPIs", list(prose.results.map((r) => `${name(r.role)}: ${r.text}`))),

    ...section("Scale and spend", list(prose.scale.map((x) => withSrc(`${name(x.role)}: ${x.text}`, x.src, sources)))),

    ...section("Roles compared", rolesTable(resume, prose)),

    ...section("Experience", resume.work.map((w) => roleCard(w, resume, prose, opts))),

    ...section("Skills with proof", [
      list(resume.skills.map((g) => `${g.category}: ${g.items.join(", ")}`)),
      list(prose.skillProof.map((x) => withSrc(`${x.skill}: ${x.proof}`, x.src, sources))),
    ].filter(Boolean)),

    ...section("Systems and tools", [
      `- CMMS run: ${Object.keys(cmms).length} systems. ${Object.entries(cmms)
        .map(([system, at]) => `${system} (${at.map(name).join(", ")})`)
        .join("; ")}`,
      `- ${prose.cmmsRollouts}`,
      `- Apps for personal use: ${appsFor("Personal", apps).join(", ")} (apps used at each role are on its card)`,
    ].join("\n")),

    ...section("Ask Cody about", tagged(prose.askAbout)),

    ...section("Recognition", tagged(prose.recognition)),

    ...section("How he got here", tagged(prose.origin)),

    ...section("Education", resume.education.map((e) => `${e.school}, ${e.degree} ${e.location}, ${e.year}.`)),

    ...section("Getting personal", withSrc(prose.personal.text, prose.personal.src, sources)),

    ...section("Links", list([`Site: ${resume.personalWebsiteUrl}`, ...socials.map((s) => `${s.name}: ${s.url}`)])),

    ...section("Accuracy notes", tagged(prose.accuracyNotes)),
  ];
  return `${blocks.join("\n\n")}\n`;
}
