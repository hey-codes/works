"use client";

import { Analytics } from "@vercel/analytics/next";
import { optedOut } from "@/lib/analytics-opt-out";
import { withRefPath } from "@/lib/analytics-ref";

/** localStorage, or null where reading it throws (some private windows). */
export function siteStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// Vercel Web Analytics: page views and referrers in aggregate; no cookies, nothing personal.
// An opted-out browser sends nothing; a ?ref link is counted under /ref/<source>.
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => (optedOut(window.location.search, siteStorage()) ? null : { ...event, url: withRefPath(event.url) })}
    />
  );
}
