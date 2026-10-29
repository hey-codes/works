# Claude Design brief

Paste everything under the line into the Claude Design project for codymitch.works, with `docs/DESIGN.md` attached. It carries the house rules from `CLAUDE.md` and `docs/PRODUCT.md`, which Claude Design does not read on its own. Where the two disagree, `CLAUDE.md` and the code win; update this file when a rule changes.

---

## What this is

codymitch.works is a one-page CV site for Cody Mitchell, a facilities leader (13 years, 9 brands, 400+ locations). It is a document, not an app: readable in about two minutes, and it prints cleanly. Readers are recruiters and hiring managers in facilities and workplace operations, usually on desktop with the PDF resume open beside it.

The site is live and in a polish phase. Refine what is there; do not add features. The bar for every change: does it make the page more Cody's, or just more styled? Simple and refined, not louder.

The code is the source of truth (Next.js, plain CSS variables in `src/app/globals.css`, CSS modules). Your output is a design reference that Claude Code builds into the real files, so name the token, size and component for each change.

## Fixed: do not change

- **Career facts and copy.** Every word comes from `src/data/resume-data.ts`. Do not rewrite, shorten or reword any text, number or name to make a layout work. If you think wording should change, list it separately as a suggestion.
- **The four stat figures:** 13 Years in FM, 400+ Locations, 2.8M+ Sq ft managed, 9 Brands.
- **Five sections, in this order:** 01 Highlights, 02 Experience, 03 Education, 04 Capabilities, 05 Stack.
- **No dollar figures** anywhere on the page. (`public/llms.txt`, the profile for AI assistants, is the one file that carries them; Cody, 2026-10-29.)
- **No email address** anywhere.
- **No marginalia** (the old red-pen notes are retired).

## Color: blue is interaction, red is structure, never crossed

- If you can click it, it is blue. Focus rings are always blue.
- Red marks where something begins or belongs: the section heads' dash, an open role's rail, the pen line under the hero name and under an open role's name, the AWARD chips, and on the map the red diamonds for Cody's projects (new site openings and sites in construction). Nothing else is red.
- Nothing that is not clickable may be blue, and nothing clickable may be red, except the map's project diamonds, which are red and clickable, and the footer's UPDATED date, a red link to the changelog that stays red on hover and focus (its focus ring is blue; Cody, 2026-10-29).

Tokens (light / dark):

| Token | Light | Dark | Job |
|---|---|---|---|
| bg | #ffffff | #171614 | page |
| soft | #fbfaf9 | #1b1a18 | hover ground, map sea |
| line | #e9e9e7 | #33312d | hairlines |
| ink | #37352f | #ebe8e2 | text |
| muted | #6b6a63 | #a3a097 | metadata |
| chip | #f1f1ef | #262521 | capability chip ground |
| blue | #0070e0 | #4da3ff | interaction only |
| red | #e10b00 | #ff453a | structure only |

Dark mode is a warm charcoal designed on its own terms, not an inverted light mode. Design both.

## Type: three families, three jobs

- **Fraunces:** display only (the name, tagline, section titles, item titles, stat figures).
- **Geist:** prose only, 14 to 15px, 1.55 to 1.6 leading, at most 62ch.
- **JetBrains Mono:** metadata and the body default (nav, eyebrows, stat labels, role titles, meta lines, chips). Three sizes only: 13px data, 12px secondary, 11px caps labels. Nothing under 11px.

Bold figures inside prose (like **2.8M+**) are scan waypoints at weight 650.

## Shape

- No shadows, anywhere.
- Chips are squared (4 to 6px radius), never pills.
- No UI kit look: no shadcn defaults, no cards with shadows, no icon-heavy rows, no dashboard chrome.
- No staggered fade-in on sections. Motion stays small and only where it is now.

## Writing

- **No em dashes or en dashes**, in copy, labels or notes. Use commas, parentheses, semicolons or a new sentence. Ranges read "30 to 55%" in prose and "2018-2021" in the year column.

## The map

Leave the map (the MapLibre map in the right column) as it is in your mockups; it will not render faithfully here. If you want a map change, describe it in words and Claude Code will build it.

## Open for refinement

These are the areas Cody has marked as wanted:

- Density and vertical rhythm between roles and sections.
- The header, and the header plus stat strip read as one unit.
- Dark mode designed on its own terms.
- The mobile top bar.

## What to send back

A handoff that, for each change, names the component or section, the old and new values (tokens, sizes, spacing in px), and both themes and phone width (360px) where they differ. List any text you would change separately, as suggestions, not as edits.
