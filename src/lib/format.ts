import type { Opening, ResumeData, Role, RoleDetail } from "./types.ts";

export interface Segment {
  text: string;
  bold?: boolean;
  href?: string;
}

/** Markdown-lite to segments: **bold** and [text](url). */
export function segments(s: string): Segment[] {
  const out: Segment[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let i = 0;
  let m: RegExpExecArray | null = re.exec(s);
  while (m) {
    if (m.index > i) out.push({ text: s.slice(i, m.index) });
    if (m[1]) out.push({ text: m[1], bold: true });
    else if (m[2]) out.push({ text: m[2], href: m[3] });
    i = re.lastIndex;
    m = re.exec(s);
  }
  if (i < s.length) out.push({ text: s.slice(i) });
  return out;
}

/** Drops link targets, keeps the link text. */
export const unlink = (s: string) => s.replace(/\[(.+?)\]\(.+?\)/g, "$1");

/** Drops all markdown-lite markup. */
export const plain = (s: string) => unlink(s).replace(/\*\*/g, "");

const year = (monthYear: string) => monthYear.split(" ")[1] ?? monthYear;

/** "2018-2021", "2024-Present", or a single year when the role starts and ends in one. */
export function yearSpan(role: Pick<Role, "start" | "end">): string {
  const a = year(role.start);
  const b = year(role.end);
  return a === b ? b : `${a}-${b}`;
}

export const startYear = (role: Pick<Role, "start">) => year(role.start);

/** The name the page shows for a role. */
export const displayName = (role: Pick<Role, "company" | "display">) => role.display ?? role.company;

export const siteWord = (n: number) => (n === 1 ? "site" : "sites");

/** The apps a role used, A to Z ignoring case: its TOOLS row in DETAILS. */
export function toolsFor(data: Pick<ResumeData, "tools">, company: string): string[] {
  return Object.entries(data.tools.apps)
    .filter(([, at]) => (at as readonly string[]).includes(company))
    .map(([app]) => app)
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

/** A role's DETAILS as one row per key, each value its own chip: SKILL, then
    TOOLS (the role's apps, from `toolsFor`), then AWARD. A key with no values
    has no row. */
export function detailRows(details: readonly RoleDetail[], tools: readonly string[] = []): { key: string; values: string[] }[] {
  const of = (label: RoleDetail["label"]) => details.filter((d) => d.label === label).map((d) => d.value);
  return [
    { key: "SKILL", values: of("Skill") },
    { key: "TOOLS", values: [...tools] },
    { key: "AWARD", values: of("Award") },
  ].filter((row) => row.values.length > 0);
}

/**
 * A role's name as the page shows it, in parts: each brand in `links` is its
 * own part with its site, so "J.Crew and Madewell" reads "J.Crew ↗ and
 * Madewell ↗". A role with one `link` is one part with that link; a role with
 * none is one part with no link.
 */
export function nameParts(role: Pick<Role, "company" | "display" | "link" | "links">): { text: string; url?: string }[] {
  const name = displayName(role);
  if (!role.links?.length) return [role.link ? { text: name, url: role.link } : { text: name }];
  const out: { text: string; url?: string }[] = [];
  let rest = name;
  for (const l of role.links) {
    const at = rest.indexOf(l.name);
    if (at < 0) continue;
    if (at > 0) out.push({ text: rest.slice(0, at) });
    out.push({ text: l.name, url: l.url });
    rest = rest.slice(at + l.name.length);
  }
  if (rest) out.push({ text: rest });
  return out;
}

/** Indexes of the roles that used a CMMS or app, in page order. */
export function systemRoles(data: ResumeData, name: string): number[] {
  // "Personal" names no role, so it never lights one.
  const users: readonly string[] = data.tools.cmms[name] ?? data.tools.apps[name] ?? [];
  const out: number[] = [];
  data.work.forEach((w, i) => {
    if (users.includes(w.company)) out.push(i);
  });
  return out;
}

/** "https://www.linkedin.com/in/heycody/" to "linkedin.com/in/heycody". */
export const bareUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

export const socialUrl = (data: ResumeData, icon: string) =>
  data.contact.social.find((s) => s.icon === icon)?.url ?? "";

export const SECTION_NAMES = ["Highlights", "Experience", "Education", "Capabilities", "Stack"] as const;

/** Square feet in the page's short style: 603, 6.2K, 18K. */
export function compactSqft(sqft: number): string {
  if (sqft < 1000) return String(sqft);
  const tenths = Math.round(sqft / 100) / 10;
  return tenths < 10 ? `${tenths}K` : `${Math.round(sqft / 1000)}K`;
}

/**
 * The project flag: its type, and its year where the records hold one (for a
 * site in construction, the year it opened, after Cody left; Cody, 2026-10-15).
 */
export function openingLabel(opening: Opening, year: number | null, words: Record<Opening, string>): string {
  return year === null ? words[opening] : `${words[opening]} · ${year}`;
}
