// Links Cody shares carry ?ref=<source> (linkedin, resume, email). The free
// plan's dashboard drops query strings, so the source moves into the path:
// codymitch.works/?ref=linkedin is counted as the page /ref/linkedin.
export function withRefPath(url: string): string {
  const u = new URL(url);
  const ref = (u.searchParams.get("ref") ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 32)
    .replace(/^-+|-+$/g, "");
  if (!ref) return url;
  return `${u.origin}${u.pathname.replace(/\/$/, "")}/ref/${ref}`;
}
