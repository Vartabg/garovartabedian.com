/**
 * Shared lock helpers for Early Writings section manifests.
 *
 * A curated manifest carries:
 *   { "$lock": { "curated": true, "reason": "…", "owner": "human" }, …chapters }
 *
 * Chapter keys never start with `$`. Runtime loaders and audits must ignore `$…` keys.
 */

export function isMetaSectionKey(key) {
  return typeof key === "string" && key.startsWith("$");
}

export function isCuratedSectionManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return false;
  }
  const lock = manifest.$lock;
  return Boolean(lock && typeof lock === "object" && lock.curated === true);
}

/** Chapter entries only — strips `$lock` and any future `$…` meta keys. */
export function sectionChapterEntries(manifest) {
  if (!manifest || typeof manifest !== "object") return {};
  const out = {};
  for (const [key, value] of Object.entries(manifest)) {
    if (isMetaSectionKey(key)) continue;
    out[key] = value;
  }
  return out;
}

export function curatedLockReason(manifest) {
  if (!isCuratedSectionManifest(manifest)) return null;
  return manifest.$lock?.reason || "hand-curated section prompts";
}
