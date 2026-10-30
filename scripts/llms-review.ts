// Writes archive/llms-review.md: /llms.txt rendered with each sourced line
// tagged "[src: ...]", for Cody's one full read. Local only (archive/ is
// git-ignored); the served file never carries the tags.
// Run: pnpm llms:review
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { LLMS_PROSE } from "../src/data/llms-prose.ts";
import { LOCATIONS } from "../src/data/locations.ts";
import { RESUME_DATA } from "../src/data/resume-data.ts";
import { latestEntryDate } from "../src/lib/changelog.ts";
import { renderLlms, wordCount } from "../src/lib/llms.ts";

const changelog = readFileSync(new URL("../public/changelog.md", import.meta.url), "utf8");
const updated = latestEntryDate(changelog);
const out = renderLlms({ resume: RESUME_DATA, sites: LOCATIONS, prose: LLMS_PROSE, updated }, { sources: true });

const dir = new URL("../archive/", import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL("llms-review.md", dir), out);
const publicOut = renderLlms({ resume: RESUME_DATA, sites: LOCATIONS, prose: LLMS_PROSE, updated });
console.log(`archive/llms-review.md written; public llms-full.txt (no source tags): ${wordCount(publicOut)} words`);
