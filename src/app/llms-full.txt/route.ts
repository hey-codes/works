import { LLMS_PROSE } from "@/data/llms-prose";
import { LOCATIONS } from "@/data/locations";
import { RESUME_DATA } from "@/data/resume-data";
import { changelogDate } from "@/lib/changelog-file";
import { renderLlms } from "@/lib/llms";

// Cody's AI profile, written into the static export as /llms-full.txt.
export const dynamic = "force-static";

export function GET() {
  const text = renderLlms({ resume: RESUME_DATA, sites: LOCATIONS, prose: LLMS_PROSE, updated: changelogDate() });
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
