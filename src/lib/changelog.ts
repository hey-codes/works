// public/changelog.md lists each ship newest first under a "## YYYY-MM-DD"
// heading; the newest is the site's UPDATED date (Cody, 2026-10-29).

/** The first heading that is a date alone; throws when there is none. */
export function latestEntryDate(md: string): string {
  const m = md.match(/^## (\d{4}-\d{2}-\d{2})[ \t]*$/m);
  if (!m?.[1]) throw new Error("changelog has no dated entry");
  return m[1];
}
