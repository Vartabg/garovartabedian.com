#!/usr/bin/env node
/**
 * Bring the museum art onto this site's own disk.
 *
 * Two rooms show public-domain artwork — the Jesus lens (30 works) and the
 * church's faces (13). Both manifests carried a museum CDN URL, so every plate
 * was a live request to a third party at read time. That cost three things:
 *
 *   - The Art Institute images bypass the image optimizer, which means the
 *     visitor's own browser opened a connection to artic.edu to read a page on
 *     this site. Nothing here should require that.
 *   - The rest went through the optimizer, which fetches and transforms them on
 *     a cache miss — a metered operation, repeated for a set that never changes.
 *   - Nothing checked the links. A museum re-pathing its CDN would silently
 *     turn a plate into a "view at the museum" link, and no build would notice.
 *
 * Every work in both manifests is CC0 or a museum open-access public-domain
 * release, so the files can simply live here. This script fetches each one
 * once, downscales it to what the layout actually renders, writes it under
 * `public/art/`, and rewrites the manifest to point at the local copy while
 * recording where it came from in `sourceImageUrl`.
 *
 * Run once; it is idempotent. `tests/museum-art-local.test.ts` then holds the
 * line — a manifest that reaches off-site again fails the build.
 *
 * Usage:
 *   node scripts/site/vendor-museum-art.mjs           # fetch anything missing
 *   node scripts/site/vendor-museum-art.mjs --refetch # re-download everything
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const ART_DIR = path.join(ROOT, "public/art");
export const PUBLIC_PREFIX = "/art/";

/**
 * Each manifest keeps its own on-disk formatting so vendoring shows up as a
 * diff of the URLs and nothing else.
 */
export const MANIFESTS = [
  { file: "public/jesus/art.json", indent: undefined, trailingNewline: false },
  { file: "public/church/faces.json", indent: 1, trailingNewline: true },
];

/**
 * The plates render at ~220px on a wide screen and up to full width on a
 * phone; 1200px covers a 3x phone with room to spare. Two of the Met entries
 * pointed at `/original/` and were pulling 4–6MB apiece for a thumbnail.
 */
const MAX_WIDTH = 1200;
const JPEG_QUALITY = 78;
const FETCH_TIMEOUT_MS = 45_000;
/** Below this a "download" is an error page, not a picture. */
const MIN_BYTES = 5_000;

/** Every object carrying both an image and the museum page it belongs to. */
export function collectWorks(value, found = []) {
  if (Array.isArray(value)) {
    for (const entry of value) collectWorks(entry, found);
  } else if (value && typeof value === "object") {
    if (typeof value.imageUrl === "string" && typeof value.objectUrl === "string") found.push(value);
    for (const entry of Object.values(value)) collectWorks(entry, found);
  }
  return found;
}

export const isLocal = (url) => url.startsWith(PUBLIC_PREFIX);

async function fetchImage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "garovartabedian.com art vendoring (one-off)" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

async function vendor(work, { refetch }) {
  const target = path.join(ART_DIR, `${work.id}.jpg`);
  const source = isLocal(work.imageUrl) ? work.sourceImageUrl : work.imageUrl;
  if (!source) throw new Error(`${work.id} is already local but records no source`);

  if (!refetch && fs.existsSync(target) && fs.statSync(target).size >= MIN_BYTES) {
    return { id: work.id, bytes: fs.statSync(target).size, skipped: true };
  }

  const raw = await fetchImage(source);
  await sharp(raw)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(target);

  // Verify by the artefact, not the exit code: the file has to exist, be big
  // enough to be a picture, and decode back to an image.
  const { size } = fs.statSync(target);
  if (size < MIN_BYTES) throw new Error(`${work.id} wrote only ${size} bytes`);
  const meta = await sharp(target).metadata();
  if (!meta.width || !meta.height) throw new Error(`${work.id} did not decode as an image`);

  return { id: work.id, bytes: size, width: meta.width, height: meta.height, skipped: false };
}

async function main() {
  const refetch = process.argv.includes("--refetch");
  fs.mkdirSync(ART_DIR, { recursive: true });

  let total = 0;
  for (const manifest of MANIFESTS) {
    const file = path.join(ROOT, manifest.file);
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const works = collectWorks(data);
    console.log(`\n${manifest.file} — ${works.length} works`);

    for (const work of works) {
      const result = await vendor(work, { refetch });
      const source = isLocal(work.imageUrl) ? work.sourceImageUrl : work.imageUrl;
      work.sourceImageUrl = source;
      work.imageUrl = `${PUBLIC_PREFIX}${work.id}.jpg`;
      total += result.bytes;
      console.log(
        `  ${result.skipped ? "have" : "got "} ${String(Math.round(result.bytes / 1024)).padStart(5)}KB  ${work.id}`,
      );
    }

    const serialized = JSON.stringify(data, null, manifest.indent);
    fs.writeFileSync(file, manifest.trailingNewline ? `${serialized}\n` : serialized);
  }

  console.log(`\n${Math.round(total / 1024)}KB of art now served from this site.`);
}

// No top-level await: the test suite imports this module through tsx, which
// transforms to CJS and cannot carry one.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
