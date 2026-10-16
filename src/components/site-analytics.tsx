"use client";

import { Analytics } from "@vercel/analytics/next";
import { OPT_OUT_KEY, optOutChoice } from "@/lib/analytics-opt-out";
import { withRefPath } from "@/lib/analytics-ref";

// Read on every event, so the visit that carries ?notrack is itself not
// counted. If storage throws (a private window), only the URL decides.
function optedOut(): boolean {
  const choice = optOutChoice(window.location.search);
  try {
    if (choice === true) localStorage.setItem(OPT_OUT_KEY, "1");
    else if (choice === false) localStorage.removeItem(OPT_OUT_KEY);
    else return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {}
  return choice === true;
}

// Vercel Web Analytics: page views and referrers in aggregate; no cookies, nothing personal.
// An opted-out browser sends nothing; a ?ref link is counted under /ref/<source>.
export function SiteAnalytics() {
  return <Analytics beforeSend={(event) => (optedOut() ? null : { ...event, url: withRefPath(event.url) })} />;
}
