import { readFileSync } from "node:fs";
import { join } from "node:path";
import { latestEntryDate } from "./changelog.ts";

/** The changelog's newest date, read at build time (server only). */
export function changelogDate(): string {
  return latestEntryDate(readFileSync(join(process.cwd(), "public", "changelog.md"), "utf8"));
}
