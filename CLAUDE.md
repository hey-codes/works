# codymitch.works

One-page CV site for Cody Mitchell (Atlas v26). Next.js App Router, TypeScript,
static export, Vercel. It is a document, not an app: readable in two minutes,
prints cleanly. Replaces `hey-codes/cv`.

## House rules

- **No em or en dashes anywhere**, including page copy, comments and docs. Use
  commas, parens, semicolons or sentence breaks; ranges read "30 to 55%" in
  prose and "2018-2021" in the year column.
- **Never delete files.** Move them to `archive/` (local only: git-ignored, never pushed) or append `-ARCHIVE` to the name.
- **Kebab-case filenames**, except proper nouns, brands, acronyms and files a
  tool requires by name (`CLAUDE.md`, `README.md`).

## Do not touch without asking Cody

- **Career facts in `src/data/resume-data.ts`.** Facts and wording come from
  the job-hunt project (profiles and og-resume). Never rewrite a fact for layout
  reasons. All page copy lives in that file, including per-role context notes,
  detail chips, row keys and the map caption; nothing is hard-coded in components.
- **The four stat figures** (13 Years in FM, 400+ Locations, 2.8M+ Sq ft
  managed, 9 Brands) and the five sections in order: 01 Highlights, 02
  Experience, 03 Education, 04 Capabilities, 05 Stack (Stack its own section,
  the page's one tools list, Cody, 2026-10-15).
- **No dollar figures anywhere on the site** (Cody, 2026-10-14).
- **Site counts follow the map records**, not the resume, where they differ
  (Cody, 2026-10-14). `pnpm check:data` ties each role's count to its rows.
- **Independent's four clients** appear on the map named and at their towns' centres,
  as Cody gave them (2026-10-15); no addresses, and the `projects` block stays by
  business type only.
- **Blue is interaction, red is structure. Never crossed.** Focus rings are blue.
  Red marks where something begins; on the map that includes the sites Cody
  opened or worked on opening (red diamond, ring and dashed ring, the card's flag
  and NEW LOCATION chip, and the caption's opening tier chips), and nothing else
  there is red (Cody, 2026-10-14 and 2026-10-15); an open role's rail, the
  pen lines under the hero name and an open role's name, and the AWARD chips
  are red (Cody, 2026-10-15).
- **Three families, three jobs:** Fraunces display, Geist prose, JetBrains Mono
  metadata and body default.
- **No public email address anywhere** on the site or in this repo (Cody, 2026-10-13).
- No marginalia. No UI kit and no shadcn, except the map, which is mapcn
  (`src/components/ui/map.tsx`, Tailwind without preflight in
  `src/app/tailwind.css`; Cody, 2026-10-13). Everything outside the map is
  styled by hand from the site tokens. Chips are squared, never pills. No shadows.

## Where things are

| Path | What |
|---|---|
| `docs/PRODUCT.md` | Fixed product decisions. Read first. |
| `docs/DESIGN.md` | Visual system: tokens, type, patterns, motion, print |
| `docs/locations-spec.md` | Contract for real location data |
| `src/app/globals.css` | Tokens as CSS variables, light and dark |
| `src/data/resume-data.ts` | All content |
| `src/data/locations.ts` | Map sites, from Cody's records. No source, address or contact fields, ever |
| `content-inbox/` | Raw exports from other projects. Gitignored; never publish or copy private fields out of it |
| `src/lib/types.ts` | Data types |
| `src/components/ui/map.tsx` | mapcn's map, restyled to house rules. The only shadcn-style file |
| `src/app/tailwind.css` | Tailwind for the map only: no preflight, shadcn names mapped to site tokens |
| `archive/` | Local only, git-ignored: the retired d3 plate (`d3-map/`), the v26 design handoff, the build sessions' plans, specs and artifacts (`superpowers/`), the content handoff prompts |

## Commands

```sh
pnpm dev          # local server
pnpm build        # static export to out/
pnpm typecheck
pnpm check:data   # locations and resume data agree
pnpm test         # node --test over src/**/*.test.ts
pnpm sync:worker  # re-copy MapLibre's worker after upgrading maplibre-gl
```
