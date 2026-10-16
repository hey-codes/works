// Consistency checks between resume-data.ts and locations.ts.
// Run: pnpm check:data
import { LOCATIONS, LOCATIONS_ARE_PLACEHOLDER } from "../src/data/locations.ts";
import { RESUME_DATA } from "../src/data/resume-data.ts";
import { SITE_POINTS } from "../src/lib/site-points.ts";

// Private fields from the source records that must never reach this repo.
const PRIVATE_FIELDS = ["source", "address", "confirmed", "notes"];

const errors: string[] = [];
const companies = new Set(RESUME_DATA.work.map((w) => w.company));

const perBrand = new Map<string, number>();
const ids = new Set<number>();
for (const l of LOCATIONS) {
  if (!companies.has(l.brand)) errors.push(`site ${l.id}: unknown brand "${l.brand}"`);
  if (ids.has(l.id)) errors.push(`duplicate site id ${l.id}`);
  ids.add(l.id);
  for (const f of PRIVATE_FIELDS) if (f in l) errors.push(`site ${l.id}: private field "${f}" present`);
  perBrand.set(l.brand, (perBrand.get(l.brand) ?? 0) + 1);
}

// Rows per role match the copy. A role may claim fewer sites than the records
// hold (Rivian: 6 opened, 11 on the map) by stating the difference as mapSites.
for (const w of RESUME_DATA.work) {
  const n = perBrand.get(w.company) ?? 0;
  const expected = w.mapSites ?? w.sites;
  if (n !== expected) errors.push(`${w.company}: ${n} location rows, data says ${expected}`);
}

// Every traced system points at real roles, and each role's CMMS is in the table.
// "Personal" is the one place that is not a role: his own use, traced nowhere.
const { cmms, apps } = RESUME_DATA.tools;
for (const [table, used] of [["cmms", cmms], ["apps", apps]] as const) {
  for (const [tool, at] of Object.entries(used)) {
    for (const c of at) if (c !== "Personal" && !companies.has(c)) errors.push(`tools.${table}["${tool}"]: unknown company "${c}"`);
  }
}
for (const w of RESUME_DATA.work) {
  for (const system of w.cmms) {
    if (!(cmms[system] as readonly string[] | undefined)?.includes(w.company)) errors.push(`${w.company}: CMMS "${system}" missing from tools.cmms`);
  }
}
for (const [system, at] of Object.entries(cmms)) {
  for (const c of at) {
    const role = RESUME_DATA.work.find((w) => w.company === c);
    if (role && !role.cmms.includes(system)) errors.push(`tools.cmms["${system}"] lists ${c}, whose cmms field does not`);
  }
}

// Public-copy rules: no dollar figures, no email, no em or en dashes.
const copy = JSON.stringify(RESUME_DATA) + JSON.stringify(LOCATIONS);
const banned: [string, string, number][] = [
  [String.fromCharCode(0x24), "dollar sign", 0],
  // The Instagram handle is the one allowed at sign.
  ["@", "at sign (email or handle)", 1],
  [String.fromCharCode(0x2014), "em dash", 0],
  [String.fromCharCode(0x2013), "en dash", 0],
];
for (const [ch, name, allowed] of banned) {
  const hits = copy.split(ch).length - 1;
  if (hits > allowed) errors.push(`${name} found in data (${hits})`);
}

// Project marks agree with the role they belong to. A new site opening, a
// relocation or a renovation happened during the role; a site in construction
// opened during it or after. Where the copy counts openings ("6 opened"), the
// new site openings match that count.
const yearOf = (monthYear: string) => (monthYear === "Present" ? new Date().getFullYear() : Number(monthYear.slice(-4)));
for (const w of RESUME_DATA.work) {
  const rows = LOCATIONS.filter((l) => l.brand === w.company);
  const [start, end] = [yearOf(w.start), yearOf(w.end)];
  for (const l of rows) {
    if (!l.opening || l.openedYear === undefined) continue;
    if (l.opening !== "construction" && (l.openedYear < start || l.openedYear > end)) {
      errors.push(`site ${l.id}: ${l.opening} in ${l.openedYear}, outside ${w.company} ${start}-${end}`);
    }
    if (l.opening === "construction" && l.openedYear < start) errors.push(`site ${l.id}: in construction but opened ${l.openedYear}, before ${w.company} began`);
  }
  if (w.sitesLabel === "opened") {
    const opened = rows.filter((l) => l.opening === "nso").length;
    if (opened !== w.sites) errors.push(`${w.company}: ${opened} new site openings, copy says ${w.sites} ${w.sitesLabel}`);
  }
}

// Every record reaches the map. A brand that matches no role would drop out silently.
if (SITE_POINTS.features.length !== LOCATIONS.length) {
  errors.push(`map: ${SITE_POINTS.features.length} points built from ${LOCATIONS.length} location rows`);
}

console.log(`${LOCATIONS.length} sites, ${RESUME_DATA.work.length} roles, placeholder: ${LOCATIONS_ARE_PLACEHOLDER}`);
if (errors.length) {
  for (const e of errors) console.error(`  x ${e}`);
  process.exit(1);
}
console.log("data checks passed");
