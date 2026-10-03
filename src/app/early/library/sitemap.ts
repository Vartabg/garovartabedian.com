import type { MetadataRoute } from "next";
import { getLibrary } from "@/lib/early/library-server";
import { recordHref, sectionHref } from "@/lib/early/library";

/** Separate sitemap keeps edition discovery independent of other worlds' route work. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const records = await getLibrary();
  return ["/early/library", ...records.flatMap(r => [recordHref(r), ...r.sections.map(s => sectionHref(r, s))])].map(href => ({ url: `https://garovartabedian.com${href}`, changeFrequency: "yearly", priority: 0.5 }));
}
