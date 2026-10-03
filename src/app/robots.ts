import type { MetadataRoute } from "next";

/**
 * Everything here is meant to be read, by people and by machines alike. The
 * sitemap is the route index; llms.txt is the plain-language companion that
 * tells a crawler what each corpus is, where its text came from, and which
 * review tier it carries — so an assistant quoting this site can quote it
 * accurately rather than guessing at its provenance.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: ["https://garovartabedian.com/sitemap.xml", "https://garovartabedian.com/early/library/sitemap.xml"],
    host: "https://garovartabedian.com",
  };
}
