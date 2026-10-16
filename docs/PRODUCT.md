# PRODUCT.md

Durable product context for codymitch.works. Sources: hey-codes/cv `README.md`, `CLAUDE.md`, `design-system/BRIEF.md`, `design-system/PRIOR-ART.md`, `design-system/COPY.md`, `src/data/resume-data.ts`.

## What it is

A one-page CV site for Cody Mitchell, a facilities leader: 13 years, 9 brands, 400+ locations. Live at https://codymitch.works. Next.js, TypeScript, plain CSS variables, static export on Vercel (repo `hey-codes/works`, live since 2026-10-15; it replaced `hey-codes/cv`, since deleted). All content lives in `src/data/resume-data.ts`; updating the site is a text edit and a deploy.

It is a document, not an app. No dashboard, no shell, no navigation chrome beyond a scroll rail. Readable in about two minutes. Prints cleanly.

## Who reads it

Recruiters and hiring managers in facilities and workplace operations. Usually on desktop, usually with the PDF resume open beside it, so any contradiction between site and PDF is visible immediately. Many have fifty of these open. Not a developer audience; GitHub is linked because it is Cody's, not because readers care.

## What success looks like

- A reader gets the shape of the career (scale, firsts, systems) in under two minutes.
- Bold figures inside prose work as scan waypoints.
- The page feels specifically Cody's, not "more designed." The bar from prior art: does a change make it more his, or just more styled?
- Printing produces a conservative, complete document.

## Mode

Read, leaning Persuade. The visitor's job is to understand a career quickly and decide to reach out.

## Positioning and voice

Tagline: "Senior Facilities Manager for multi-site portfolios and new site openings" (Cody, 2026-10-14).
Voice is first-person, plain, a little warm ("the receipts", "sales floor to FM"). The red-pen marginalia carries the personality; the body copy stays factual.

## Fixed (decisions, not tweaks)

- **Career facts.** Every number was vetted outside the repo against the PDF resumes. Never rewrite a fact for visual reasons. `resume-data.ts` wins over any other copy source.
- **Five sections, in order:** 01 Highlights, 02 Experience, 03 Education, 04 Capabilities, 05 Stack. The 01 to 05 numbering appears in the slim bar and section labels. (Cody, 2026-10-13; Track record tried and dropped. Stack became its own section, the page's one tools list, and Capabilities lost its Tools chips, which repeated it: Cody, 2026-10-15.)
  - Highlights: the four headline claims from `highlights`.
  - Each role's collapsed row carries a one-line `context` note; its highlight opens with the record.
  - Experience lists 9 roles. Independent counts "4 clients", its client markers on the map.
- **Four stat-strip figures:** 13 Years in FM, 400+ Locations, 2.8M+ Sq ft managed, 9 Brands. No dollar figures anywhere on the site. (Cody, 2026-10-14; replaces 2.9M+ and the managed-spend figure.)
- **Filtering dims, never hides.** Tags are clickable to trace a system across roles; the page keeps its shape. The map is the one exception: a pick (a role, a CMMS name or a STACK row, one at a time) shows its sites alone, a hover previews it in place and a click frames it (Cody, 2026-10-14 and 2026-10-15).
- **Print stays conservative:** no marginalia, no motion, everything expanded.

## Identity lock (Cody, 2026-09-28: "Never change these")

1. ~~Red-pen marginalia is the signature.~~ **Retired by Cody, 2026-10-13.** No marginalia anywhere. The `note` field in resume data is unused.
2. **Blue carries interaction, red carries structure. Never crossed.** Clickable = `--blue` (#0070E0 light, #4DA3FF dark). Marks where something begins = `--red`. On the map, that includes Cody's projects, new site openings and sites in construction, each one red diamond (Cody, 2026-10-14 and 2026-10-15). An open role's rail is red too (Cody, 2026-10-15). No steel blue.
3. **Three families, three jobs.** Fraunces display, Geist prose, JetBrains Mono metadata (nav, section labels, stat labels, job titles, meta lines, tags).
- LinkedIn chip and GitHub icon style from the original header.
- Capabilities as chips; tools are not among them, they are 05 Stack.
- No shadcn/ui default styling; every control is styled from site tokens. The map is the one exception: it is mapcn, restyled to the same tokens (Cody, 2026-10-13).

## Open (wanted)

- Distinctiveness through **simple and refined, not louder**: more restraint, deployed more precisely.
- Density and vertical rhythm between roles and sections.
- The header, and the header plus stat strip as one unit.
- Dark mode designed on its own terms, not derived.
- Mobile top bar.

## Anti-references

- Generic developer CV templates (the shadcn look the site was forked from).
- Prior art already set aside: the Wrapped "record layout" register change and the FMWorks "cmworks" skin change. Take lessons, not directions.
- Staggered fade-in on every section. The map moves only when the reader asks it to (Cody, 2026-10-13).
- Dashboard or app chrome: cards with shadow, pill chips, icon-heavy rows.

## House rules

- No em or en dashes anywhere, including page copy.
- Never delete files; move to `archive/` or append `-ARCHIVE`.
- Kebab-case filenames except proper nouns, brands, acronyms.
- Explorations ship as self-contained specimens, never wired into the live app.

## Current direction

Atlas v26, built in this repo: an explorable map of every site (mapcn on CARTO tiles) in a sticky right column; hovering a role, a CMMS name or a STACK row shows its sites alone and clicking it frames them, with a legend for the red diamonds and Honolulu inset in the corner. Under 960px the map sits under the hero, still explorable, and the role list does not drive it. Dark mode follows the system with a manual toggle. Map locations are real records since 2026-10-13 (rulings in `docs/locations-spec.md`).
