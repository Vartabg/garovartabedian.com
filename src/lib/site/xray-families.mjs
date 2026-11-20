/**
 * The kinds of page the site has, for the Engineer lens. One table serves the
 * build script (which browser specs name each kind, by the literal paths in
 * their source) and the client (which kind the current page is). First match
 * wins, so the narrower kinds come first.
 */
export const XRAY_FAMILIES = /** @type {const} */ ([
  { id: "chapter", label: "chapter pages", path: /^\/scriptures\/[a-z-]+\/[1-4]?[A-Z0-9]{2,5}\/\d+\/?$/ },
  { id: "book", label: "book briefings", path: /^\/scriptures\/[a-z-]+\/[1-4]?[A-Z0-9]{2,5}\/?$/ },
  { id: "scriptures", label: "Scriptures pages", path: /^\/scriptures(?:\/|$)/ },
  { id: "jesus", label: "Jesus pages", path: /^\/jesus(?:\/|$)/ },
  { id: "apostles", label: "Apostles pages", path: /^\/apostles(?:\/|$)/ },
  { id: "early", label: "Early Writings pages", path: /^\/early(?:\/|$)/ },
  { id: "church", label: "Church pages", path: /^\/church(?:\/|$)/ },
  { id: "word", label: "Who Owns the Word pages", path: /^\/word(?:\/|$)/ },
  { id: "angels", label: "Angels and Demons pages", path: /^\/angels(?:\/|$)/ },
  { id: "evidence", label: "How We Know pages", path: /^\/evidence(?:\/|$)/ },
  { id: "work", label: "work and case-study pages", path: /^\/work(?:\/|$)/ },
  { id: "sources", label: "the Sources page", path: /^\/sources(?:\/|$)/ },
  { id: "about", label: "about and contact pages", path: /^\/(?:about|contact|hire|resume|services|labs)(?:\/|$)/ },
  { id: "home", label: "the home page", path: /^\/$/ },
]);

/** @typedef {(typeof XRAY_FAMILIES)[number]} XrayFamily */

/** The path part of a URL or href: no query, no hash. */
export function pathOnly(href) {
  return String(href).split(/[?#]/)[0];
}

/**
 * @param {string} pathname
 * @returns {XrayFamily | null}
 */
export function xrayFamilyFor(pathname) {
  const path = pathOnly(pathname);
  return XRAY_FAMILIES.find((family) => family.path.test(path)) ?? null;
}
