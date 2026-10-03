#!/usr/bin/env node
/**
 * Media integrity audit: coverage, manifest readiness, dimensions, and payload.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const rel = (p) => path.relative(ROOT, p);
const fail = [];

function listFiles(dir, pattern = /\.(jpe?g|png|webp)$/i) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const name of fs.readdirSync(abs)) {
    const file = path.join(abs, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) out.push(...listFiles(rel(file), pattern));
    else if (pattern.test(name)) out.push(rel(file));
  }
  return out.sort();
}

function bytes(files) {
  return files.reduce((sum, file) => sum + fs.statSync(path.join(ROOT, file)).size, 0);
}

function mb(n) {
  return `${Math.round((n / 1024 / 1024) * 10) / 10} MB`;
}

function imageSize(file) {
  const buf = fs.readFileSync(path.join(ROOT, file));
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset < buf.length) {
      if (buf[offset] !== 0xff) break;
      const marker = buf[offset + 1];
      const length = buf.readUInt16BE(offset + 2);
      if (
        marker === 0xc0 ||
        marker === 0xc1 ||
        marker === 0xc2 ||
        marker === 0xc3 ||
        marker === 0xc5 ||
        marker === 0xc6 ||
        marker === 0xc7 ||
        marker === 0xc9 ||
        marker === 0xca ||
        marker === 0xcb ||
        marker === 0xcd ||
        marker === 0xce ||
        marker === 0xcf
      ) {
        return { width: buf.readUInt16BE(offset + 7), height: buf.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }
  return { width: 0, height: 0 };
}

const slug = (s) => {
  if (!s) return undefined;
  const roman = /^Chapter\s+([IVXLCDM]+)/i.exec(s);
  if (roman) return `chapter-${roman[1].toLowerCase()}`;
  const arabic = /^Chapter\s+(\d+)/i.exec(s);
  if (arabic) return `chapter-${arabic[1]}`;
  const fragRoman = /^Fragment\s+([IVXLCDM]+)\b/i.exec(s);
  if (fragRoman) return `fragment-${fragRoman[1].toLowerCase()}`;
  const fragArabic = /^Fragment\s+(\d+)\b/i.exec(s);
  if (fragArabic) return `fragment-${fragArabic[1]}`;
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
};

function reportIssue(label, items) {
  if (!items.length) return;
  fail.push(`${label}: ${items.slice(0, 12).join(", ")}${items.length > 12 ? ` (+${items.length - 12} more)` : ""}`);
}

function checkManifestImages({
  label,
  manifestPath,
  imageDir,
  imageIds,
  requireAll = false,
}) {
  const manifest = read(manifestPath);
  const manifestIds = Object.keys(manifest);
  const images = listFiles(imageDir, /\.jpg$/i).map((file) => path.basename(file, ".jpg"));
  const expected = imageIds ?? manifestIds;
  reportIssue(`${label} missing manifest`, expected.filter((id) => !manifestIds.includes(id)));
  if (requireAll) {
    reportIssue(`${label} unready`, expected.filter((id) => !manifest[id]?.ready));
  }
  reportIssue(`${label} missing image`, expected.filter((id) => manifest[id]?.ready && !images.includes(id)));
  reportIssue(`${label} orphan image`, images.filter((id) => !manifestIds.includes(id)));
  reportIssue(
    `${label} ready mismatch`,
    manifestIds.filter((id) => Boolean(manifest[id].ready) !== images.includes(id)),
  );
  return { manifest: manifestIds.length, images: images.length, ready: manifestIds.filter((id) => manifest[id].ready).length };
}

const life = read("public/jesus/life.json");
const lifeIds = life.events.map((event) => event.id);
const lifeStats = checkManifestImages({
  label: "Jesus life",
  manifestPath: "public/jesus/life-plates.json",
  imageDir: "public/jesus/life",
  imageIds: lifeIds,
  requireAll: true,
});

const earlyTextFiles = listFiles("public/early/texts", /\.json$/i);
let earlyChapters = 0;
let earlyManifestEntries = 0;
let earlySectionImages = 0;
for (const file of earlyTextFiles) {
  const text = read(file);
  const textId = text.id ?? path.basename(file, ".json");
  const structured = text.sections
    .filter((section) => {
      const h = section.heading ?? "";
      return /^Chapter\s+/i.test(h) || /^Fragment\s+/i.test(h);
    })
    .map((section) => slug(section.heading));
  // Free-form section titles only when the text has no Chapter/Fragment parts
  // (3 Corinthians, Quadratus). Avoid counting book-title prefaces on other texts.
  const freeForm =
    structured.length === 0
      ? text.sections
          .filter((section) => {
            const h = (section.heading ?? "").trim();
            return h.length > 0 && h.length <= 100;
          })
          .map((section) => slug(section.heading))
      : [];
  const chapterIds = [...structured, ...freeForm];
  earlyChapters += chapterIds.length;
  const manifestPath = `public/early/sections/${textId}.json`;
  if (!exists(manifestPath)) {
    fail.push(`Early missing manifest: ${textId}`);
    continue;
  }
  const manifest = read(manifestPath);
  // Ignore $lock / other $meta keys — not chapter ids.
  const manifestIds = Object.keys(manifest).filter((id) => !id.startsWith("$"));
  const images = listFiles(`public/early/sections/${textId}`, /\.jpg$/i).map((fileName) =>
    path.basename(fileName, ".jpg"),
  );
  earlyManifestEntries += manifestIds.length;
  earlySectionImages += images.length;
  reportIssue(`${textId} missing manifest chapter`, chapterIds.filter((id) => !manifestIds.includes(id)));
  reportIssue(`${textId} extra manifest chapter`, manifestIds.filter((id) => !chapterIds.includes(id)));
  reportIssue(`${textId} missing section image`, manifestIds.filter((id) => !images.includes(id)));
  reportIssue(`${textId} orphan section image`, images.filter((id) => !manifestIds.includes(id)));
  if (manifest.$lock?.curated) {
    // Informational — curated locks are expected and healthy.
    // Counted later in the summary line.
  }
}

const earlyHeroIds = new Set(earlyTextFiles.map((file) => path.basename(file, ".json")));
const earlyHeroImages = listFiles("public/early/plates", /\.jpg$/i).map((file) => path.basename(file, ".jpg"));
reportIssue("Early missing hero", [...earlyHeroIds].filter((id) => !earlyHeroImages.includes(id)));
reportIssue("Early orphan hero", earlyHeroImages.filter((id) => id !== "ignatius-road" && !earlyHeroIds.has(id)));

const angelsStats = checkManifestImages({
  label: "Angels",
  manifestPath: "public/angels/media-plates.json",
  imageDir: "public/angels/plates",
  requireAll: true,
});
const councilStats = checkManifestImages({
  label: "Church councils",
  manifestPath: "public/church/council-plates.json",
  imageDir: "public/church/councils",
  requireAll: true,
});

const dimensionRules = [
  { label: "Early section", dir: "public/early/sections", width: 1280, height: 720 },
  { label: "Early hero", dir: "public/early/plates", width: 1280, height: 720 },
  { label: "Jesus life", dir: "public/jesus/life", width: 1280, height: 720 },
  { label: "Jesus stone", dir: "public/jesus/stones", width: 1280, height: 720 },
  { label: "Angels plate", dir: "public/angels/plates", width: 1280, height: 720 },
  { label: "Church council", dir: "public/church/councils", width: 1280, height: 720 },
  { label: "World hero", dir: "public/worlds", width: 1200, height: 800 },
  { label: "Home hero", dir: "public/home", width: 1536, height: 1024 },
];

for (const rule of dimensionRules) {
  const bad = listFiles(rule.dir, /\.jpg$/i).filter((file) => {
    const size = imageSize(file);
    return size.width !== rule.width || size.height !== rule.height;
  });
  reportIssue(`${rule.label} bad dimensions`, bad);
}

// Text stubs ("plate pending") land ~20 KB; real 1280×720 plates are usually ≥40 KB.
const STUB_MIN_BYTES = 40_000;
const stubDirs = [
  "public/early/sections",
  "public/early/plates",
  "public/jesus/life",
  "public/jesus/stones",
  "public/angels/plates",
  "public/church/councils",
];
const stubs = stubDirs.flatMap((dir) =>
  listFiles(dir, /\.jpg$/i).filter((file) => {
    const n = fs.statSync(path.join(ROOT, file)).size;
    return n > 0 && n < STUB_MIN_BYTES;
  }),
);
if (stubs.length) {
  console.log(`  Stub-sized plates (< ${STUB_MIN_BYTES} B): ${stubs.length}`);
  for (const file of stubs.slice(0, 12)) {
    console.log(`    - ${file} (${fs.statSync(path.join(ROOT, file)).size} B)`);
  }
  if (stubs.length > 12) console.log(`    … +${stubs.length - 12} more`);
  console.log("  Fix: python3 scripts/early/gen-section-plates.py <textId> --dry-run");
  reportIssue("Stub-sized plate", stubs);
}

if (exists("public/og.jpg")) {
  const og = imageSize("public/og.jpg");
  if (og.width !== 1200 || og.height !== 630) fail.push(`OG bad dimensions: ${og.width}x${og.height}`);
} else {
  fail.push("OG image missing: public/og.jpg");
}

const mediaFiles = listFiles("public");
const publicBytes = bytes(mediaFiles);
console.log("Media audit");
console.log(`  Jesus life: ${lifeStats.images}/${lifeStats.manifest} images ready`);
console.log(`  Early sections: ${earlySectionImages}/${earlyManifestEntries} images for ${earlyChapters} chapters`);
console.log(`  Early heroes: ${earlyHeroImages.length} images`);
console.log(`  Angels plates: ${angelsStats.ready}/${angelsStats.manifest} ready`);
console.log(`  Church council plates: ${councilStats.ready}/${councilStats.manifest} ready`);
console.log(`  Public media payload: ${mb(publicBytes)} across ${mediaFiles.length} files`);

if (fail.length) {
  console.error("\nIssues:");
  for (const issue of fail) console.error(`  - ${issue}`);
  process.exitCode = 1;
} else {
  console.log("  OK");
}
