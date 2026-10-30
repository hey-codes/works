import { LLMS_PROSE } from "@/data/llms-prose";
import { LOCATIONS } from "@/data/locations";
import { RESUME_DATA } from "@/data/resume-data";
import { changelogDate } from "@/lib/changelog-file";
import { renderLlmsIndex } from "@/lib/llms";

// The /llms.txt index (llmstxt.org layout), pointing at /llms-full.txt.
export const dynamic = "force-static";

export function GET() {
  const text = renderLlmsIndex({ resume: RESUME_DATA, sites: LOCATIONS, prose: LLMS_PROSE, updated: changelogDate() });
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
