/**
 * The two live demos the Machinery page mounts whole.
 *
 * These are the only third parties this site ever frames, and the arrangement
 * is fragile in a way nothing was watching: the embed works only while the
 * demo's own deploy keeps allowing it. atxbro.com permits exactly
 * `frame-ancestors 'self' https://garovartabedian.com`; a deploy that dropped
 * that line, or a redesign that added `X-Frame-Options: DENY`, would turn the
 * page's strongest claim — "no screenshots, no mockups" — into two empty boxes,
 * and nothing here would have said so.
 *
 * So the URLs live here once. The page renders from this list, the CSP's
 * frame-src is checked against it, and `npm run check:embeds` visits each one
 * and records whether it can still be framed from this site
 * (public/meta/embeds.json). A demo that starts refusing fails the build.
 */
export type LabEmbed = {
  /** The framed URL. Must appear in the CSP frame-src allow-list. */
  url: string;
  title: string;
  /** Badge beside the heading. */
  tag: string;
  /** Accessible title on the iframe element. */
  frameTitle: string;
  /** Plain link text for reading it full-screen — the fallback if framing fails. */
  openLabel: string;
};

/** The origin the demos must allow; the site's canonical host. */
export const SITE_ORIGIN = "https://garovartabedian.com";

export const LAB_EMBEDS: LabEmbed[] = [
  {
    url: "https://eye-code-visualizer.vercel.app",
    title: "EYE",
    tag: "live demo",
    frameTitle: "EYE — live demo of the code execution visualizer",
    openLabel: "Open EYE full-screen",
  },
  {
    url: "https://www.atxbro.com",
    title: "atxbro.com",
    tag: "shipped · live",
    frameTitle: "atxbro.com — live site embedded",
    openLabel: "Open atxbro.com full-screen",
  },
];
