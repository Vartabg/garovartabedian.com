#!/usr/bin/env node
/**
 * Build per-text chapter manifests for section illustration plates.
 * Reads public/early/texts/<id>.json, writes public/early/sections/<id>.json
 *
 * HARD LOCK: if an existing sections/<id>.json has `$lock.curated: true`,
 * this script will NOT overwrite it. Agents cannot bypass with a casual flag —
 * unlock requires BOTH `--force-unlock` and env EARLY_SECTION_UNLOCK=1.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { laneBPrompt } from "../media/lanes.mjs";
import {
  isCuratedSectionManifest,
  sectionChapterEntries,
} from "./section-manifest-lock.mjs";
import {
  atomicWriteFileSync,
  publishStagedEntriesSync,
} from "../lib/atomic-publication.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TEXTS_DIR = path.join(ROOT, "public/early/texts");
const OUT_DIR = path.join(ROOT, "public/early/sections");
const CACHE_DIR = path.join(ROOT, "scripts/scriptures/.cache");
const TEXT_ID_RE = /^[a-z0-9-]+$/;

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Stable section id — must match src/lib/early/sections.ts */
export function sectionSlug(heading) {
  if (!heading) return undefined;
  const roman = /^Chapter\s+([IVXLCDM]+)/i.exec(heading);
  if (roman) return `chapter-${roman[1].toLowerCase()}`;
  const arabic = /^Chapter\s+(\d+)/i.exec(heading);
  if (arabic) return `chapter-${arabic[1]}`;
  const fragRoman = /^Fragment\s+([IVXLCDM]+)\b/i.exec(heading);
  if (fragRoman) return `fragment-${fragRoman[1].toLowerCase()}`;
  const fragArabic = /^Fragment\s+(\d+)\b/i.exec(heading);
  if (fragArabic) return `fragment-${fragArabic[1]}`;
  return slug(heading);
}

function chapterTitle(heading) {
  const dash = heading.indexOf("—");
  if (dash >= 0) return heading.slice(dash + 1).trim().replace(/\.$/, "");
  const colon = heading.indexOf(":");
  if (colon >= 0) return heading.slice(colon + 1).trim().replace(/\.$/, "");
  return heading
    .replace(/^Chapter\s+[IVXLCDM\d]+[.—:\s]*/i, "")
    .replace(/^Fragment\s+[IVXLCDM\d]+[.—:\s]*/i, "")
    .trim();
}

function summarize(paragraphs) {
  const raw = (paragraphs[0] ?? "").replace(/\s+/g, " ").trim();
  const trimmed = raw.length > 220 ? `${raw.slice(0, 217)}…` : raw;
  return trimmed.replace(/^\d+\.\s*/, "");
}

function buildPrompt(text, heading, summary) {
  const theme = chapterTitle(heading);
  return laneBPrompt({
    room: "early",
    summary,
    theme: `"${theme}" from ${text.title}`,
    source: text.title,
  });
}

function buildManifest(text) {
  const chapters = {};
  for (const section of text.sections) {
    const heading = section.heading?.trim();
    if (!heading) continue;
    // Chapter / Fragment always plate. Free-form titled parts (3 Corinthians,
    // Quadratus) plate when the heading is usable and not a long preface line.
    const structured = /^Chapter\s+/i.test(heading) || /^Fragment\s+/i.test(heading);
    if (!structured && heading.length > 100) continue;
    const id = sectionSlug(heading);
    if (!id) continue;
    if (chapters[id]) {
      throw new Error(`${text.id}: duplicate section slug ${id} (${heading})`);
    }
    const theme = chapterTitle(heading) || heading;
    const summary = summarize(section.paragraphs ?? []);
    chapters[id] = {
      heading,
      caption: theme,
      alt: `Illustration for ${heading} — ${text.title}`,
      summary,
      prompt: buildPrompt(text, heading, summary),
    };
  }
  return chapters;
}

function structuralManifest(manifest) {
  const comparable = {};
  for (const [key, value] of Object.entries(sectionChapterEntries(manifest))) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      comparable[key] = value;
      continue;
    }
    // A prompt records how an already-rendered plate was made. Prompt-template
    // evolution must not rewrite that provenance without regenerating the image.
    const structural = { ...value };
    delete structural.prompt;
    comparable[key] = structural;
  }
  return comparable;
}

function parseArgs(argv) {
  const forceUnlock = argv.includes("--force-unlock");
  const check = argv.includes("--check");
  const positional = argv.filter((a) => !a.startsWith("-"));
  if (positional.length > 1) {
    throw new Error(`Unexpected arguments: ${positional.slice(1).join(" ")}`);
  }
  return { check, forceUnlock, textFilter: positional[0] };
}

const { check, forceUnlock, textFilter } = parseArgs(process.argv.slice(2));
const unlockEnv = process.env.EARLY_SECTION_UNLOCK === "1";
const mayUnlock = forceUnlock && unlockEnv;

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs
  .readdirSync(TEXTS_DIR)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !textFilter || f.replace(".json", "") === textFilter);

if (textFilter && files.length === 0) {
  console.error(`No text JSON matching "${textFilter}"`);
  process.exit(2);
}

let total = 0;
let skipped = 0;
let blocked = 0;
const pending = [];
const drift = [];

for (const file of files) {
  const sourcePath = path.join(TEXTS_DIR, file);
  const text = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const fileId = file.replace(/\.json$/, "");
  if (
    !text ||
    typeof text !== "object" ||
    text.id !== fileId ||
    !TEXT_ID_RE.test(text.id) ||
    !Array.isArray(text.sections)
  ) {
    throw new Error(
      `${path.relative(ROOT, sourcePath)} violates the Early Writing contract: id must match its filename and sections must be an array`,
    );
  }
  const outPath = path.join(OUT_DIR, `${text.id}.json`);

  if (fs.existsSync(outPath)) {
    const existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
    if (isCuratedSectionManifest(existing)) {
      if (!mayUnlock) {
        const reason =
          existing.$lock?.reason ||
          "hand-curated prompts ($lock.curated)";
        console.error(
          `LOCKED  ${text.id}: refused to overwrite (${reason}). ` +
            `To unlock intentionally: EARLY_SECTION_UNLOCK=1 node scripts/early/build-section-manifest.mjs ${text.id} --force-unlock`,
        );
        blocked += 1;
        // Targeted rebuild of a locked text is a hard failure so CI/agents stop.
        if (textFilter) process.exit(3);
        continue;
      }
      console.warn(`UNLOCK  ${text.id}: overwriting curated manifest (explicit unlock)`);
    }
  }

  const manifest = buildManifest(text);
  const count = Object.keys(sectionChapterEntries(manifest)).length;
  if (!count) {
    skipped += 1;
    continue;
  }
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  if (check) {
    if (!fs.existsSync(outPath)) {
      drift.push(`${text.id}: manifest is missing`);
    } else {
      const committed = JSON.parse(fs.readFileSync(outPath, "utf8"));
      if (
        JSON.stringify(structuralManifest(committed)) !==
        JSON.stringify(structuralManifest(manifest))
      ) {
        drift.push(
          `${text.id}: structural manifest fields differ from the committed file`,
        );
      }
    }
  } else {
    pending.push({ relative: `${text.id}.json`, serialized });
  }
  console.log(`${text.id}: ${count} chapters${check ? " checked" : " staged"}`);
  total += count;
}

if (drift.length > 0) {
  console.error(`DRIFT (${drift.length}):`);
  for (const item of drift) console.error(`  ${item}`);
  process.exit(4);
}

if (!check && pending.length > 0) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const staging = fs.mkdtempSync(path.join(CACHE_DIR, "early-section-manifests-"));
  try {
    for (const item of pending) {
      atomicWriteFileSync(path.join(staging, item.relative), item.serialized);
    }
    publishStagedEntriesSync(
      staging,
      OUT_DIR,
      pending.map((item) => item.relative),
      { label: "early-sections" },
    );
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

console.log(
  `total: ${total} chapter manifests ${check ? "verified" : "published"}`,
);
if (blocked) console.log(`locked: ${blocked} skipped (curated)`);
if (skipped) console.log(`empty: ${skipped} texts with no plateable sections`);

// Full-corpus run with only locks is success; targeted lock is exit 3 above.
if (blocked && textFilter) process.exit(3);
