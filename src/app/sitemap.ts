import type { MetadataRoute } from "next";
import { RESUME_DATA } from "@/data/resume-data";
import { changelogDate } from "@/lib/changelog-file";

// One page, one entry. force-static so the static export writes sitemap.xml.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: RESUME_DATA.personalWebsiteUrl, lastModified: changelogDate() }];
}
