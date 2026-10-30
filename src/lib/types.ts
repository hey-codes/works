export type IconType = "github" | "linkedin" | "instagram";

export interface Stat {
  /** Final figure as displayed, e.g. "2.8M+". The count-up parses it. */
  value: string;
  label: string;
}

export interface CareerHighlight {
  /** Mono row key in 01 Highlights, e.g. "FIRST HIRE". */
  key: string;
  title: string;
  /** Markdown-lite: **bold** and [text](url). */
  text: string;
}

/** A DETAILS chip kept in the data. The TOOLS row is not one: it is read from `tools.apps`. */
export interface RoleDetail {
  label: "Skill" | "Award";
  value: string;
}

export interface Role {
  /** Data key. Locations and the tools tables refer to a role by this string. */
  company: string;
  /** Name shown on the page, when it differs from the key. */
  display?: string;
  /** Short name for the STACK rows, when it differs from the key. */
  short?: string;
  /** The brand's own site: a ↗ after the name. */
  link?: string;
  /** Several brands in one name, each with its own ↗ after its word ("J.Crew ↗ and Madewell ↗"). Each `name` is a word of the display. */
  links?: ReadonlyArray<{ name: string; url: string }>;
  location: string;
  title: string;
  /** "Mon YYYY" */
  start: string;
  /** "Mon YYYY" or "Present" */
  end: string;
  /** Sites the copy claims for this role. 0 hides the count and the map line. */
  sites: number;
  /** Word after the count in the map caption when it is not "sites", e.g. "opened". */
  sitesLabel?: string;
  /** Word after the count wherever it shows (row, FOOTPRINT, caption) when the role counts something other than sites, e.g. "clients". */
  countWord?: string;
  /** Rows in locations.ts for this role, when the records hold more than `sites`. */
  mapSites?: number;
  sector?: string;
  /** As printed, e.g. "220K+ sq ft". */
  sqft?: string;
  /** In order of use; two names read as a migration ("Limble → FEXA"). */
  cmms: readonly string[];
  /** One-line context note on the collapsed row. */
  context: string;
  description: string;
  /** Markdown-lite: **bold**. */
  highlights?: readonly string[];
  /** DETAILS chips in the expanded record. */
  details: readonly RoleDetail[];
}

export interface SkillGroup {
  /** Mono row key in 04 Capabilities, e.g. "OPS". */
  key: string;
  category: string;
  items: readonly string[];
}

/**
 * Where a tool was used: a role (exact `work[].company`) or "Personal", his own
 * use outside any role. "Personal" is a place, not a role: it lists last in
 * STACK and traces nothing on the map.
 */
export type UsedPlace = Brand | "Personal";

/** Tool or platform name to where it was used: roles in page order, then "Personal". */
export type UsedAt = Readonly<Record<string, readonly UsedPlace[]>>;

/** A footer credits row: its key, then each name linked to its own site. */
export interface FooterCredits {
  key: string;
  items: ReadonlyArray<{ name: string; url: string }>;
}

/** An AI tool in the footer's ASK AI column. */
export interface AskTool {
  name: string;
  /** Prefill tools end in their prompt parameter ("?q="); the prompt is appended. */
  url: string;
  /** Opens `url` as it is and copies the prompt instead (Gemini has no prefill). */
  copy?: boolean;
}

export interface ResumeData {
  name: string;
  initials: string;
  tagline: string;
  /** Hero base line, as shown. */
  location: string;
  locationLink: string;
  about: string;
  summary: string;
  personalWebsiteUrl: string;
  /** Person schema (JSON-LD) for search engines and AI agents; not shown on the page. */
  schema: {
    jobTitle: string;
    addressLocality: string;
    addressRegion: string;
    description: string;
  };
  /** Path or URL of the resume PDF. null hides the PDF link. */
  pdf: string | null;
  /** Note shown on the PDF control while `pdf` is null. */
  pdfPending: string;
  contact: {
    social: ReadonlyArray<{
      name: string;
      url: string;
      icon: IconType;
      handle?: string;
    }>;
  };
  stats: readonly Stat[];
  /** Fixed text around the map. */
  map: {
    title: string;
    caption: string;
    hint: string;
    hintNarrow: string;
    /** Accessible name of the map image. */
    label: string;
    /** Accessible names of the map's own buttons. */
    controls: { zoomIn: string; zoomOut: string; close: string };
    /** A hovered dot that shares its address: takes {name} and {n}, the others there. */
    hoverMore: string;
    /** A hovered circle's opening sites, after its name ("Seattle +3 · 2 openings"): takes {n}. */
    hoverOpenings: { one: string; other: string };
    /** The map's legend: each project type's name beside the red diamond. */
    legend: Record<Opening, string>;
    /** The site card in a map popup. `allSites` and `sitesHere` take {n}. */
    card: {
      type: string;
      sqft: string;
      opening: string;
      estimated: string;
      /** The project flag, by its type. */
      flags: Record<Opening, string>;
      allSites: string;
      readRole: string;
      /** The list card's header where a tap reads several sites; also the way back to it. */
      sitesHere: string;
      /** The market row's key. */
      market: string;
      /** Chips under a site's name; `closed` may take " · {year}" after it. */
      chips: { flagship: string; office: string; flexOffice: string; closed: string };
    };
    /** Control that returns the map to every site. */
    reset: string;
  };
  /** The footer's key rows, in SPEC's style: UPDATED, then the credits. */
  footer: {
    /** Key of the row that shows the changelog's newest date; the one row that prints. */
    updated: string;
    /** What the site is built with. */
    built: FooterCredits;
    /** Key over LinkedIn and GitHub. */
    connect: string;
    /** The ASK AI column: tools that open a chat reading llms.txt. */
    ask: {
      key: string;
      /** Sent verbatim to every tool (Cody, 2026-10-29). */
      prompt: string;
      tools: ReadonlyArray<AskTool>;
      /** "Reads", before the file's name. */
      reads: string;
      /** The profile's file name in public/, linked as /<file>. */
      file: string;
      /** Shown once a copy tool's prompt is on the clipboard. */
      copied: string;
      /** true hides the column; the footer shows `forAi` in its place. */
      paused: boolean;
    };
    /** The third column while Ask AI is paused: a plain link to the AI profile. */
    forAi: { key: string; file: string; note: string };
  };
  education: ReadonlyArray<{
    school: string;
    link: string;
    location: string;
    degree: string;
    year: string;
  }>;
  /** Extra rows under Education, e.g. a membership. */
  affiliations: ReadonlyArray<{ key: string; text: string }>;
  careerHighlights: readonly CareerHighlight[];
  work: readonly Role[];
  skills: readonly SkillGroup[];
  /** The STACK block: CMMS platforms and apps, each with where it was used. */
  tools: { cmms: UsedAt; apps: UsedAt };
  projects: ReadonlyArray<{
    title: string;
    techStack: readonly string[];
    description: string;
    location: string;
    status: "on-boarding" | "in-progress" | "complete";
  }>;
}

/** The eight employers and Independent, exactly as `work[].company` spells them. */
export type Brand =
  | "J.Crew / Madewell"
  | "SoulCycle"
  | "Dolce & Gabbana"
  | "FENDI"
  | "Rivian Automotive"
  | "Balenciaga"
  | "Bathhouse"
  | "Industrious"
  | "Independent";

/** One managed site. Field contract: docs/locations-spec.md. */
export interface Site {
  id: number;
  brand: Brand;
  name: string;
  /** Short per-brand vocabulary, e.g. "Boutique", "Studio", "Flex office". */
  type: string;
  /** Plain integer square feet. null when nothing is on file. */
  sqft: number | null;
  /** The figure is a typical size for that kind of store, not a recorded one. */
  sqftEstimate?: boolean;
  /** Reader-facing market name, e.g. "Los Angeles". */
  city: string;
  country: "US" | "CA" | "MX";
  lat: number;
  lon: number;
  /** true marks generated data. Real records carry false. */
  placeholder: boolean;
  /** As of the build date. A store that relocated counts as closed. */
  status: "open" | "closed";
  /** Year a closed site closed, where on record (Independent's Twisted Stems). */
  closedYear?: number;
  kind: "store" | "office";
  /** Cody's part in this site's opening (source: his locations master). Unset: open before he arrived, or no part. */
  opening?: Opening;
  /** Year the site opened, where the master records it. Shown with the opening flag. */
  openedYear?: number;
}

/**
 * The project Cody had at a site (Cody, 2026-10-15): "nso" a new site
 * opening; "construction" a site under construction on his watch that opened
 * after he left; "relocation" a site moved to a new address; "renovation" a
 * remodel of an operating site. The map marks them all alike; the card and
 * the legend name the type.
 */
export type Opening = "nso" | "construction" | "relocation" | "renovation";

/**
 * The hand-written words of the AI profile (/llms.txt): everything the site's
 * data does not hold. Rendered by src/lib/llms.ts; dollars allowed here only.
 */
export interface Sourced {
  text: string;
  /** Where the line comes from: "<profile> <entry ID or section>"; shown only in the review render. */
  src: string;
}

export interface LlmsProse {
  about: string;
  /** Rules for the AI reading the file, one bullet each. */
  forAi: readonly string[];
  lookingFor: {
    level: string;
    roleTypes: readonly string[];
    /** job-hunt's fit-tag sectors, each with the roles behind it. */
    sectors: ReadonlyArray<{ name: string; roles: readonly Brand[] }>;
  };
  /** The openings, as the page and og-resume count them, after the map's count. */
  openings: readonly string[];
  /** Why Cody: the strongest claims, one bullet each. */
  whyCody: readonly Sourced[];
  quickAnswers: ReadonlyArray<{ q: string; a: string; src: string }>;
  results: ReadonlyArray<{ role: Brand; text: string }>;
  /** Scale and spend, one line per role. */
  scale: ReadonlyArray<{ role: Brand; text: string; src: string }>;
  /** Per role: TEAM (og-resume Part 4), a SITES override, the intro and bullets, and the v3 card lines. */
  roles: Readonly<
    Record<
      Brand,
      {
        team?: string;
        sites?: string;
        intro: string;
        bullets: readonly string[];
        proves?: Sourced;
        before?: Sourced;
        after?: Sourced;
        reliedOn?: Sourced;
        openings?: Sourced;
        quotes?: readonly Sourced[];
      }
    >
  >;
  skillProof: ReadonlyArray<{ skill: string; proof: string; src: string }>;
  cmmsRollouts: string;
  /** The short /llms.txt index (llmstxt.org format) that points at /llms-full.txt (Cody, 2026-10-29). */
  index: { intro: string; full: string; site: string; changelog: string; linkedin: string };
  askAbout: readonly Sourced[];
  recognition: readonly Sourced[];
  origin: readonly Sourced[];
  personal: Sourced;
  accuracyNotes: readonly Sourced[];
}
