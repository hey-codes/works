# Launch checklist

Nothing is pushed, deployed or published until Cody says so. Work stays local.

## Content

- [x] Real locations in `src/data/locations.ts` (431 sites, 2026-10-13); every record has `placeholder: false`
- [x] Site copy loaded from job-hunt (`content-inbox/site-content.md`, 2026-10-14): roles, highlights, stats, education, capabilities, STACK
- [x] Role copy moved to the records' site counts (Cody, 2026-10-14)
- [x] Skills and tools re-extracted; STACK lists only tools with an employer on file
- [ ] Resume PDF: launching without one (Cody, 2026-10-15). When the site-download version exists (no email or phone), add it and set `pdf` in `src/data/resume-data.ts`
- [ ] J.Crew and Madewell scope reviewed (live at the 159 peak scope until Cody decides; 223 or 235 is a rebuild in career-hub). Launching at 159 (Cody, 2026-10-15); a follow-up
- [x] Independent says "4 small businesses"; `projects` (not shown on the page) is down to four, the flower shop dropped (Cody, 2026-10-15)
- [x] Seven department store shops have a guessed status (open): launching as recorded. Cody confirmed FENDI's four Holt Renfrew sub-shops open; D&G Nordstrom Topanga, FENDI Saks Greenwich and Balenciaga Bloomingdale's 59th St. Shoes stay open as guessed, since he has no record of them (Cody, 2026-10-15)

## Known at launch (follow-ups on this site)

- [x] Map: no market name is drawn cut at the frame's edge; one that would run off it is not drawn at that zoom (edge guards), so "SF BAY AREA" with SoulCycle open at 1024 and "LOS ANGELES" on the 360 opening view drop rather than clip (Cody, 2026-10-15)
- [x] Accessibility: no skip link, no name for the header's `nav`, the hero's `h1` outside `main`: accepted as they are (Cody, 2026-10-15)

## Follow-ups in other projects (do not block launch)

- [ ] job-hunt: bring the profiles and og-resume to the records' counts (Industrious 51, Balenciaga 56 and 185K+, Dolce & Gabbana 52, SoulCycle 34, J.Crew and Madewell 159) so the resume and LinkedIn match the site
- [x] STACK apps: Cody's map of 2026-10-15 places Microsoft Office and Google Workspace at their brands and lists personal tools (ChatGPT, Claude AI, Figma, GitHub, Google Workspace, Notion, Obsidian) as Personal; Airtable and Cursor stayed off at first. Since 05 Stack became the one tools list, Airtable (Rivian, Balenciaga) and Cursor (Personal) are on it, and "AI Workflow Automation" moved to the Programs chips (Cody, 2026-10-15)

## Before the first push

- [x] Scan for email addresses, dollar figures, client business names beyond Independent's four approved map clients (Cody, 2026-10-15), and other personal contact details (none allowed). Clean on every tracked file and the built out/ (2026-10-15); the only addresses in out/ are two open-source authors credited inside MapLibre's bundle
- [x] `pnpm check:data`, `pnpm typecheck`, `pnpm test` and `pnpm build` all pass (2026-10-15, 198 tests)
- [ ] Publish as one clean commit to a freshly created `hey-codes/works` (no step history)

## After Cody approves the preview

- [ ] Move the `codymitch.works` domain to the new Vercel project
- [ ] Add a pointer note to the `hey-codes/cv` README, then archive that repo
- [ ] Pause (do not delete) the old Vercel project as a rollback
