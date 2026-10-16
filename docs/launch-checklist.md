# Launch checklist

**Live at https://codymitch.works since 2026-10-15.** Vercel project `works` (team hey-codes-projects) serves the apex; `www` redirects (308) to it. GitHub `hey-codes/works` (private) holds the published history. Vercel Authentication covers every URL except the custom domain, so `*.vercel.app` previews need sign-in.

**Shipping an update:** a push to `main` of `hey-codes/works` deploys straight to the live domain, so push only on Cody's go. Run `pnpm typecheck && pnpm test && pnpm check:data && pnpm build` and the private-details scan first. Publish main's tree as one new commit on top of the remote (`git commit-tree main^{tree} -p origin/main`, then `git branch -f publish <sha>` and `git push origin publish:main`). To look before going live, push a branch other than `main`: it deploys a preview behind sign-in (the branch `preview`, at works-git-preview-hey-codes-projects.vercel.app). **Rollback:** there is no old project to fall back to; in Vercel, project `works`, Deployments, the previous production deployment's "Instant Rollback" puts it back on the domain at once.

## Open: to review

### Content

- [ ] Resume PDF: the site launched without one (Cody, 2026-10-15). When the site-download version exists (no email or phone), add it to `public/` and set `pdf` in `src/data/resume-data.ts`; the header and slim bar then show the download link (`SHOW_PENDING` in `pdf-control.tsx` stays off)
- [ ] J.Crew and Madewell scope: live at the 159 peak scope; 223 or 235 is a rebuild in career-hub (Cody, 2026-10-15)
- [ ] Relocation and renovation sites: the types are built (legend, card flag, map mark); add the sites when Cody sends the list (name, brand, year), with `opening: "relocation"` or `"renovation"`
- [ ] Location records: correct them when convenient, not as a blocker; the site is a website, not a database (Cody, 2026-10-15). Known guesses: seven department store shops set open, SoulCycle Walnut Creek set closed
- [ ] Copy pass, only when Cody asks. Noted so far:
  - The tagline breaks "multi-" / "site" at 360; a non-breaking hyphen in the data would hold it
  - Highlights' RANGE title repeats the stat strip (13 years, 9 brands, 400+)
  - Balenciaga's brief says "55 boutiques" beside its "56 sites" (the HQ is the 56th)
  - Capabilities' keys echo their titles (OPS / Operations, MEP / Building Systems (MEP))
  - Section titles (and the slim bar's section names) are written in the components, not in `resume-data.ts`, where the house rule keeps all copy
  - The hidden `projects` list has no flower shop while Twisted Stems, a floral shop, is one of Independent's map clients (not shown on the page)

### Site

- [ ] The map's framing keeps clear of Show every site and the zoom buttons but not of the legend (top right) or the Honolulu inset (bottom left), so either can sit over a few dots in some views; names under them are not drawn. Reserving room would shrink every fit (Cody accepted as is, 2026-10-15)
- [ ] Check the page on a real iPhone: the Honolulu inset is a second live map (a second WebGL context)
- [ ] MapLibre's dev bundles (about 5MB, `maplibre-gl-*-dev.mjs`) are emitted into the deploy though the site never loads them; trim them if the build allows
- [ ] Share preview: check `public/og.png` (made 2026-10-13: the name and the red cursor) in a LinkedIn or iMessage preview now that the domain is live

### Other projects

- [ ] job-hunt: bring the profiles and og-resume to the records' counts (Industrious 51, Balenciaga 56 and 185K+, Dolce & Gabbana 52, SoulCycle 34, J.Crew and Madewell 159) so the resume and LinkedIn match the site

## Done: launch, 2026-10-15

### Content

- [x] Real locations in `src/data/locations.ts` (431 sites, 2026-10-13); every record has `placeholder: false`
- [x] Site copy loaded from job-hunt (`content-inbox/site-content.md`, 2026-10-14): roles, highlights, stats, education, capabilities, STACK
- [x] Role copy moved to the records' site counts (Cody, 2026-10-14)
- [x] Skills and tools re-extracted; STACK lists only tools with an employer on file
- [x] STACK became its own section, 05 Stack, the page's one tools list; Capabilities lost its Tools chips. Airtable (Balenciaga, Rivian) and Cursor (Personal) are on it, and "AI Workflow Automation" moved to the Programs chips (Cody, 2026-10-15)
- [x] Independent says "4 small businesses"; `projects` (not shown on the page) is down to four, the flower shop dropped (Cody, 2026-10-15)
- [x] Seven department store shops with a guessed status (open) launch as recorded. Cody confirmed FENDI's four Holt Renfrew sub-shops open; D&G Nordstrom Topanga, FENDI Saks Greenwich and Balenciaga Bloomingdale's 59th St. Shoes stay open as guessed (Cody, 2026-10-15)

### Site

- [x] Map: no market name is drawn cut at the frame's edge; one that would run off it is not drawn at that zoom (edge guards) (Cody, 2026-10-15)
- [x] Accepted as they are: no skip link, no name for the header's `nav`, the hero's `h1` outside `main`, and under 1280px a site card can open over the map's controls (Cody, 2026-10-15)
- [x] README: points to the live site; the link to the deleted `hey-codes/cv` is gone (2026-10-15)

### Publishing

- [x] Scan for email addresses, dollar figures, client business names beyond Independent's four approved map clients, and other personal contact details: clean on every tracked file and the built `out/` (2026-10-15); the only addresses in `out/` are two open-source authors credited inside MapLibre's bundle
- [x] `pnpm check:data`, `pnpm typecheck`, `pnpm test` and `pnpm build` all pass (2026-10-15, 198 tests)
- [x] Repo cleaned before the push: `archive/` (the retired d3 map, the v26 design handoff, the build sessions' plans, specs and artifacts) is local only and git-ignored, as are `.claude/` and `.impeccable/` (Cody, 2026-10-15)
- [x] Published as one clean commit to `hey-codes/works`: `2af63a6`, pushed to `main` on 2026-10-15. It deployed to production straight away, not as a preview first as agreed; Vercel Authentication on every URL held it private until the domain moved
- [x] Domain: `codymitch.works` moved to project `works`, `www` redirecting (308) to the apex, and Vercel Authentication set back to all except custom domains in the same step (2026-10-15; the site was down about a minute between the old project's deletion and the move)
- [x] `hey-codes/cv` deleted on GitHub by Cody (2026-10-15), in place of a pointer note and archiving
- [x] Old Vercel project `cv` deleted by Cody (2026-10-15) rather than paused; no rollback project is kept

## Done: first update, live 2026-10-15 evening (`df9dec0`)

Reviewed by Cody on the `preview` branch, then published to `main` as one commit. Vercel keeps the launch deployment (`2af63a6`) for Instant Rollback.

- [x] Map, one pick at a time: hovering or focusing a role, a CMMS name or a STACK row filters the map in place; a click locks it in and frames it; clicking again, Esc or Show every site clears it. From 960px a role's record is open while it is the pick; phones unchanged
- [x] Project taxonomy: opened and supported became new site opening (NSO, 37 sites), pre-opening became in construction (8); one red diamond for every project; the card's PROJECT flag names it with its year ("NSO · 2016", "IN CONSTRUCTION · 2025"); relocation and renovation are ready for their sites
- [x] A static legend under the zoom buttons (one short line on phones); a live Honolulu inset bottom left, replacing the caption's link; the caption's tier chips gone
- [x] No map name is drawn half hidden under the legend, the inset or a button, as at the frame's edges
- [x] Role rows hover to a plain gray ground; the stats sit under a gray hairline; the slim bar's cursor blinks as it slides in; CMMS names take a dotted underline
- [x] Footer as a bookend to the header: the wordmark opposite LinkedIn ↗ and GitHub ↗, the colophon in one quiet line under a hairline
- [x] STACK: the personal-only apps sit last in APPS under a dashed rule; the Stack hover hint is gone
- [x] On iPhones (WebKit) the map now fills its frame; the launch version left its lower third empty
- [x] Checks: typecheck, 186 tests, the data check, the build and the private-details scan; Chromium at 1440, 1024, 768, 390 and 360 in both themes, and WebKit as an iPhone and on desktop
