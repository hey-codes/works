# Locations data spec

> **Status 2026-10-13:** real data is loaded (431 sites, `src/data/locations.ts`). The rulings below override the original checks where they differ. The rest of this file is the original spec, kept for reference.

## Rulings (Cody, 2026-10-13)

1. **J.Crew / Madewell:** peak scope, 159 rows. To be reviewed later; fine to go live at 159.
2. **SoulCycle 34, Dolce & Gabbana 52, Balenciaga 56, Industrious 51:** the copy moves to the records' counts.
3. **Rivian:** all 11 sites on the map; the copy keeps "6 opened". The role states `mapSites: 11` and the map caption reads "6 opened, 11 on the map".
4. **Square feet estimates:** kept. Each is flagged `sqftEstimate: true`. The map's site card prints the figure, short (6.2K), with a muted "Est." (Cody, 2026-10-14; this replaces "never print a per-site figure for those rows").
5. **Balenciaga badge:** 185K+ (records sum to 188,611). Copy reads "55 boutiques (185K+ sq ft) plus the NYC HQ"; the count is 56 with the office (Cody, 2026-10-14).
6. **NYC regional offices (FENDI, Balenciaga):** kept, `kind: "office"`, inside the counts.
7. **Relocated stores:** `status: "closed"`.
8. **Rows of one brand sharing a pin:** kept. The duplicate check is id only (replaces check 6 below).
9. **Markets:** as recorded. New York and New York Metro, Los Angeles and Beverly Hills, Phoenix and Scottsdale are separate dots.
10. **Guessed statuses:** left as built (seven department store shops open, SoulCycle Walnut Creek closed) until corrected.
11. **Private fields:** `source`, `address` and contact details never enter this repo. `check:data` fails if one appears.
12. **Opening status:** optional `opening` per site, with `openedYear` where on record. Source: the "My involvement" and "Year opened" columns of Cody's locations master workbook (career-hub, 2026-10-14). `"opened"`: it was his role to open it (Rivian's six, Balenciaga Miami Design District). `"supported"`: he contributed to or managed parts of the opening (SoulCycle, FENDI's six from the copy, Balenciaga, J.Crew and Madewell, D&G). `"pre-opening"`: in progress during his tenure, opened after. `"in-progress"`: an opening he is running now (none). Left unmarked by Cody although the workbook marks them: J.Crew Northpark main store (it was the Men's Shop), Rivian's DC temporary site, SoulCycle Walnut Creek and South Lake Union, FENDI beyond the copy's six. `check:data` holds opened and supported years inside the role and Rivian's opened count to the copy's "6 opened".
    - **Superseded by the project taxonomy (Cody, 2026-10-15):** `opening` is now one of `"nso"` (new site opening: the former opened and supported, 37 sites), `"construction"` (in construction: the former pre-opening, 8 sites, opened after Cody left), `"relocation"` and `"renovation"` (none yet; add them from Cody's list). `check:data` holds an NSO's, relocation's or renovation's year inside the role, a construction site's year at or after its start, and Rivian's NSO count to the copy's "6 opened".
13. **Independent's clients (Cody, 2026-10-15):** four rows, brand `Independent`, named as Cody gave them (Twisted Stems, Mangione Landscaping, Bee's Knees, and an unnamed woodworking site), each at its town's centre (Crystal Lake IL twice, Brooklyn NY, Montrose CO), never an address. `sqft` is null, none carries an `opening`, and the role's count is "4 clients"; `check:data` ties it to the rows. Optional `closedYear` records the year a closed site closed, where on record (Twisted Stems, 2026).

Also changed from the original spec: `sqft` may be null (one row, Rivian Washington DC), and `type` has two values beyond the suggested list ("Showroom", "Temporary site").

What `locations.js` needs so the Atlas map can drop its placeholder flag. All 410 current records are generated placeholders.

## Fields per site

| Field | Required | Type | Used for | Notes |
|---|---|---|---|---|
| `id` | yes | integer, unique | marker identity | Any stable number; order doesn't matter |
| `brand` | yes | string | ties the site to a role | Must match a `company` in resume-data **exactly** (see list below) |
| `name` | yes | string | popup title, marker label | Store or site name as you'd say it, e.g. "SoHo Flagship", "Rivian Brooklyn Service Center" |
| `type` | yes | string | popup "Type" | Keep a short fixed vocabulary per brand (below) |
| `sqft` | yes | integer | per-role and running sq ft totals | Plain number, no commas or "K" |
| `city` | yes | string | city labels, cluster names, "N sites in X, Y" | Use the market name a reader knows ("Los Angeles", not "Century City") so sites group cleanly |
| `country` | yes | `"US"`, `"CA"` or `"MX"` | popup "Market" | ISO-2 |
| `lat`, `lon` | yes | decimal degrees, 4 places | marker position | Building-level is fine; ~100 m accuracy is plenty. `lon` is negative in the Americas |
| `placeholder` | yes | `false` | gates every derived number on the page | One `true` anywhere hides all counts |
| `status` | yes | `"open"` or `"closed"` | closed sites render as a dimmed pin | Closed sites still count toward every total |
| `kind` | yes | `"store"` or `"office"` | offices and warehouses get a separate pin style | Only inside the brand counts below |

Not used any more: `color`, `logo`. Omit them.

Optional, useful for the confirm step only (the page ignores them): `address`, `source` (which local file the row came from), `confirmed: true`.

## Brand keys and expected counts

The page compares each brand's row count to the role copy. These are the numbers the copy already claims:

| `brand` (exact string) | Sites in copy | Sq ft in copy | Suggested `type` values |
|---|---|---|---|
| `J.Crew / Madewell` | 153 at peak | 700K+ | Retail store, Madewell store, Flagship |
| `SoulCycle` | 33 | 100K+ | Studio |
| `Dolce & Gabbana` | 48 | 190K+ | Boutique |
| `FENDI` | 67 (3 countries) | 220K+ | Boutique, Flagship, Office |
| `Rivian Automotive` | 6 | 200K+ | Service center |
| `Balenciaga` | 54 (US and Canada) | 200K+ | Boutique, Flagship, Office |
| `Bathhouse` | 1 | 35K | Thermal spa |
| `Industrious` | 48 (5 West Coast districts) | 1.2M+ | Flex office |

Total in copy: 410 sites. The locked stat strip says **400+ locations** and **2.9M+ sq ft**.

## Checks the data must pass

1. Every `brand` value is one of the nine strings above (the eight in the table, plus `Independent` and its four client rows).
2. Row count per brand equals the "Sites in copy" column, or the copy changes in resume-data (never the reverse without Cody's sign-off).
3. Sum of all `sqft` is at least 2,900,000. The role badges add up to about 2.85M, so the real per-site figures need to land above that or the 2.9M+ stat is contradicted.
4. Per-brand `sqft` sums are at least the badge figure ("700K+" means ≥ 700,000).
5. FENDI rows span 3 countries; Balenciaga and Dolce & Gabbana rows are US and CA only.
6. No duplicate `id`; no duplicate (`brand`, `lat`, `lon`).
7. Every `lat`/`lon` falls inside the US, Canada or Mexico (Hawaii is supported).
8. J.Crew / Madewell: count only stores you covered, at peak, not the whole fleet.

## Decisions (confirmed 2026-10-11)

- J.Crew: the 153 at peak.
- Closed stores: included, dimmed pin, counted in all totals.
- Offices and warehouses: included, separate pin style.
- Industrious sq ft: per-site figures exist.
- Data arrives pasted in chat.

## Original open questions

- **J.Crew peak list.** 153 is a peak; stores opened and closed across 2013 to 2015. Decide whether the list is "every store I covered at any point" (count may exceed 153) or "the 153 at peak" (pick a date).
- **Closed stores.** Include sites that have since closed? They were managed, so yes is defensible; say so in the prompt.
- **Offices and warehouses.** Corporate offices or DCs count as locations only if they're inside the counts above.
- **Industrious square footage.** 1.2M+ across 48 sites averages 25K each; confirm per-site figures exist in your files, or decide on a documented estimate.

## Prompt for Claude Code

```
Build locations.js for the codymitch.works Atlas map from my local files.

Output: window.LOCATIONS = [ ... ] with one object per site:
{ id, brand, name, type, sqft, city, country, lat, lon, placeholder: false,
  status, kind, address, source, confirmed }

Rules:
- brand must be exactly one of: "J.Crew / Madewell", "SoulCycle",
  "Dolce & Gabbana", "FENDI", "Rivian Automotive", "Balenciaga",
  "Bathhouse", "Industrious".
- Pull names, addresses and square footage only from my files. Never invent
  or estimate a figure; if sqft is missing, leave it null and list the site
  in the report.
- Geocode from the address to 4 decimal places. country is US, CA or MX.
- city is the reader-facing market name (Los Angeles, SF Bay Area, NYC).
- source is the file path and row or page the record came from.
- J.Crew / Madewell: the 153 stores at peak only.
- Include closed sites with status: "closed"; they count toward totals.
- Offices and warehouses get kind: "office"; everything else kind: "store".
- Industrious sqft comes from per-site figures in my files.

Then write locations-report.md with:
- count and sqft sum per brand, against these targets:
  J.Crew / Madewell 153 / 700K+, SoulCycle 33 / 100K+, Dolce & Gabbana 48 / 190K+,
  FENDI 67 / 220K+, Rivian 6 / 200K+, Balenciaga 54 / 200K+,
  Bathhouse 1 / 35K, Industrious 48 / 1.2M+
- grand totals against 400+ sites and 2.9M+ sq ft
- every site with missing sqft, address or coordinates
- every brand whose count doesn't match, with the likely reason
Do not edit resume-data. Flag mismatches for me to decide.
```
