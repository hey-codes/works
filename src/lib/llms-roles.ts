import type { Brand, LlmsProse, ResumeData, Role, Sourced, UsedAt } from "./types.ts";

// The AI profile's Roles compared table and role cards, read from the role
// data, with the TEAM line, intro and bullets from the prose module.

/** A line ending with its source, in the review render only. */
export const withSrc = (text: string, src: string, sources?: boolean) => (sources ? `${text} [src: ${src}]` : text);

export function displayName(company: string, resume: ResumeData): string {
  return resume.work.find((w) => w.company === company)?.display ?? company;
}

function proseFor(role: Role, prose: LlmsProse) {
  const entry = (prose.roles as Partial<LlmsProse["roles"]>)[role.company as Brand];
  if (!entry) throw new Error(`llms-prose.ts has no entry for ${role.company}`);
  return entry;
}

const yearOf = (monthYear: string) => (monthYear === "Present" ? monthYear : monthYear.slice(-4));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthIndex = (monthYear: string) => Number(monthYear.slice(-4)) * 12 + MONTHS.indexOf(monthYear.slice(0, 3));

/** Months in the role, counting the first and last ("5 mo", "2 yr 5 mo"); none while it runs. */
function tenure(role: Role): string | undefined {
  if (role.end === "Present") return undefined;
  const months = monthIndex(role.end) - monthIndex(role.start) + 1;
  const [years, rest] = [Math.floor(months / 12), months % 12];
  return [years ? `${years} yr` : "", rest ? `${rest} mo` : ""].filter(Boolean).join(" ");
}

/** "2026 (5 mo)", "2018-2021 (2 yr 5 mo)" or "2024-Present", as the year column reads. */
export function yearsCell(role: Role): string {
  const [start, end] = [yearOf(role.start), yearOf(role.end)];
  const years = start === end ? start : `${start}-${end}`;
  const length = tenure(role);
  return length ? `${years} (${length})` : years;
}

export function sitesText(role: Role, prose: LlmsProse): string {
  return proseFor(role, prose).sites ?? (role.countWord ? `${role.sites} ${role.countWord}` : String(role.sites));
}

/** Two systems read as a migration, as on the page. */
const cmmsText = (role: Role) => role.cmms.join(" → ");

/** The apps used at a place, in the table's A to Z order. */
export function appsFor(place: Brand | "Personal", apps: UsedAt): string[] {
  return Object.entries(apps)
    .filter(([, at]) => at.includes(place))
    .map(([name]) => name);
}

const cell = (text: string) => text.replaceAll("|", "\\|");
const row = (cells: readonly string[]) => `| ${cells.map(cell).join(" | ")} |`;

export function rolesTable(resume: ResumeData, prose: LlmsProse): string {
  const header = ["Years", "Brand", "Title", "Sector", "Sites", "Sq ft", "CMMS", "Team"];
  const rows = resume.work.map((w) =>
    row([
      yearsCell(w),
      w.display ?? w.company,
      w.title,
      w.sector ?? "",
      sitesText(w, prose),
      (w.sqft ?? "").replace(/ sq ft$/, ""),
      cmmsText(w),
      proseFor(w, prose).team ?? "",
    ]),
  );
  return [row(header), row(header.map(() => "---")), ...rows].join("\n");
}

export function roleCard(role: Role, resume: ResumeData, prose: LlmsProse, opts: { sources?: boolean } = {}): string {
  const entry = proseFor(role, prose);
  const line = (item: Sourced) => withSrc(item.text, item.src, opts.sources);
  // Sector, sites, sq ft, CMMS and team are in the Roles compared table (Cody, 2026-10-29).
  const keys: [string, string | undefined][] = [
    ["BASE", role.location],
    ["APPS", appsFor(role.company as Brand, resume.tools.apps).join(", ")],
    ["AWARD", role.details.filter((d) => d.label === "Award").map((d) => d.value).join(", ")],
    ["PROVES", entry.proves && line(entry.proves)],
    ["BEFORE", entry.before && line(entry.before)],
    ["AFTER", entry.after && line(entry.after)],
    ["RELIED ON FOR", entry.reliedOn && line(entry.reliedOn)],
    ["OPENINGS", entry.openings && line(entry.openings)],
  ];
  const blocks = [
    `### ${role.display ?? role.company} · ${role.title} · ${role.start} to ${role.end}`,
    keys.filter(([, value]) => value).map(([key, value]) => `- ${key}: ${value}`).join("\n"),
  ];
  if (entry.quotes?.length) blocks.push(entry.quotes.map((q) => `> "${q.text}"${opts.sources ? ` [src: ${q.src}]` : ""}`).join("\n\n"));
  blocks.push(entry.intro);
  if (entry.bullets.length) blocks.push(entry.bullets.map((b) => `- ${b}`).join("\n"));
  return blocks.join("\n\n");
}
