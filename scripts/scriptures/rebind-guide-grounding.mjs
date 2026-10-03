#!/usr/bin/env node
/**
 * Re-bind guide-v2 chapter guides after a citation-metadata correction to
 * their book briefing.
 *
 * Every v2 guide carries `generation.promptHash`, the sha256 of the exact
 * grounding bundle it was drafted or reviewed against. The bundle embeds the
 * whole book briefing, so correcting one dead citation URL changes the hash
 * for every chapter of that book — and the corpus-health gate then refuses
 * the build, as it should: an unexplained hash change is precisely what the
 * hash exists to catch.
 *
 * The fix is not to loosen the hash. It is to make the one legitimate case
 * explicit and auditable. This tool re-binds a guide only when it can prove
 * three things, and it writes the proof into the guide:
 *
 *   1. The guide's stored hash equals the hash of the *previous* bundle
 *      (the briefing as committed, or as supplied). A binding we cannot
 *      reproduce is not one we can move.
 *   2. The only fields that differ between the previous and current bundle
 *      are `bookBriefing.sources[*].url` / `.label` (REBIND_ALLOWED_FIELD).
 *      A URL is opaque to a drafter and a label is a pointer's name. If the
 *      briefing's claims (`says`), the hosted text, a cross-reference, or the
 *      rubric moved, the run refuses — that guide needs a person, not a tool.
 *   3. The re-bound guide passes the full v2 validator against the current
 *      grounding.
 *
 * It then appends `{ at, by, reason, previousPromptHash, changedFields }` to
 * `generation.rebound`. The reader-facing record shows the hash moved and
 * why; the validator (guide-validation.mjs) rejects any record that does not
 * say so completely.
 *
 * This command never touches `model`, `attributedModel`, `reviewStatus`,
 * `reviewer`, or `reviewedAt`. Who drafted a guide and who reviewed it are
 * not things a citation fix can change, so nothing here can restate them.
 *
 * Usage:
 *   node scripts/scriptures/rebind-guide-grounding.mjs \
 *     --books ENO --by "Jane Doe" \
 *     --reason "Two citation URLs returned 404; replaced with the verified …" \
 *     [--previous-briefing-ref HEAD | --previous-briefing-file <path>] [--dry-run]
 *
 * All-or-nothing: if any selected guide refuses, nothing is written.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareTarget, ROOT } from "./build-guides-v2.mjs";
import {
  GUIDE_RUBRIC_VERSION,
  REBIND_ALLOWED_FIELD,
  REBIND_REASON_MIN_LENGTH,
  validateGuideV2,
} from "./guide-validation.mjs";

const GUIDES = path.join(ROOT, "public/scriptures/guides");
const BRIEFINGS = path.join(ROOT, "public/scriptures/books");
const TARGET_PATTERN = /^([1-4]?[A-Z]+)\/([1-9]\d*)$/;

const writeJsonAtomically = (file, value) => {
  const temporary = `${file}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, file);
};

/** Flatten nested JSON to dotted paths so two bundles can be diffed field by field. */
export function flattenGrounding(value, prefix = "", out = {}) {
  if (value !== null && typeof value === "object") {
    const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
    let empty = true;
    for (const [key, child] of entries) {
      empty = false;
      flattenGrounding(child, prefix ? `${prefix}.${key}` : String(key), out);
    }
    if (empty) out[prefix] = Array.isArray(value) ? "[]" : "{}";
    return out;
  }
  out[prefix] = value;
  return out;
}

/** Dotted paths whose values differ between two grounding bundles. */
export function changedGroundingFields(previous, current) {
  const before = flattenGrounding(previous);
  const after = flattenGrounding(current);
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => before[key] !== after[key])
    .sort();
}

/**
 * Compute the re-bound guide, or the reason it must not be re-bound.
 * Pure with respect to the guide: returns a new object, never mutates input.
 *
 * @returns {{ ok: true, guide: any, changedFields: string[] } | { ok: false, reason: string }}
 */
export function rebindGuide({
  guide,
  book,
  chapter,
  previousBriefing,
  by,
  reason,
  at,
  root = ROOT,
  canons,
}) {
  const label = `${book}/${chapter}`;
  const generation = guide.generation;
  if (!generation || generation.rubricVersion !== GUIDE_RUBRIC_VERSION) {
    return { ok: false, reason: `${label}: not a ${GUIDE_RUBRIC_VERSION} guide; nothing to re-bind` };
  }
  if (!/^[a-f0-9]{64}$/.test(generation.promptHash ?? "")) {
    return { ok: false, reason: `${label}: stored promptHash is not a sha256` };
  }

  const previous = prepareTarget(book, chapter, { bookBriefing: previousBriefing });
  const current = prepareTarget(book, chapter);

  if (previous.promptHash === current.promptHash) {
    return { ok: false, reason: `${label}: grounding is unchanged; there is nothing to re-bind` };
  }
  if (generation.promptHash !== previous.promptHash) {
    return {
      ok: false,
      reason: `${label}: stored promptHash does not match the previous grounding — cannot prove what this guide was bound to`,
    };
  }

  const changedFields = changedGroundingFields(previous.grounding, current.grounding);
  const disallowed = changedFields.filter((field) => !REBIND_ALLOWED_FIELD.test(field));
  if (disallowed.length > 0) {
    return {
      ok: false,
      reason: `${label}: grounding changed outside citation metadata (${disallowed.join(", ")}); this guide needs review, not a re-bind`,
    };
  }

  const rebound = {
    ...guide,
    generation: {
      ...generation,
      promptHash: current.promptHash,
      rebound: [
        ...(Array.isArray(generation.rebound) ? generation.rebound : []),
        { at, by, reason, previousPromptHash: previous.promptHash, changedFields },
      ],
    },
  };

  const validation = validateGuideV2({
    guide: rebound,
    root,
    canons,
    book,
    chapter,
    expectedPromptHash: current.promptHash,
  });
  if (validation.failures.length > 0) {
    return { ok: false, reason: `${label}: re-bound guide fails v2 validation — ${validation.failures.join("; ")}` };
  }
  return { ok: true, guide: rebound, changedFields };
}

function parseArgs(argv) {
  const args = {
    books: [],
    list: [],
    by: null,
    reason: null,
    previousRef: null,
    previousFile: null,
    dryRun: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--books") args.books = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--list") args.list = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--by") args.by = argv[++i];
    else if (a === "--reason") args.reason = argv[++i];
    else if (a === "--previous-briefing-ref") args.previousRef = argv[++i];
    else if (a === "--previous-briefing-file") args.previousFile = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else throw new Error(`Unknown arg ${a}`);
  }
  if (!args.by || args.by.trim().length < 3) throw new Error("--by must name who is re-binding");
  if (!args.reason || args.reason.trim().length < REBIND_REASON_MIN_LENGTH) {
    throw new Error(`--reason must explain the correction in at least ${REBIND_REASON_MIN_LENGTH} characters`);
  }
  if (args.list.length > 0 && args.books.length > 0) throw new Error("Use either --list or --books, not both");
  if (args.list.length === 0 && args.books.length === 0) throw new Error("Select guides with --books or --list");
  for (const item of args.list) {
    if (!TARGET_PATTERN.test(item)) throw new Error(`Bad --list target: ${item}`);
  }
  for (const book of args.books) {
    if (!/^[1-4]?[A-Z]+$/.test(book)) throw new Error(`Bad --books target: ${book}`);
  }
  if (args.previousRef && args.previousFile) {
    throw new Error("Use either --previous-briefing-ref or --previous-briefing-file, not both");
  }
  if (!args.previousRef && !args.previousFile) args.previousRef = "HEAD";
  return args;
}

function resolveTargets(args) {
  const targets = [...args.list];
  for (const book of args.books) {
    const dir = path.join(GUIDES, book);
    if (!existsSync(dir)) throw new Error(`No guide directory for ${book}`);
    for (const f of readdirSync(dir)) {
      if (f.endsWith(".json")) targets.push(`${book}/${f.replace(".json", "")}`);
    }
  }
  return [...new Set(targets)].sort((a, b) => {
    const [ab, ac] = a.split("/");
    const [bb, bc] = b.split("/");
    return ab === bb ? Number(ac) - Number(bc) : ab.localeCompare(bb);
  });
}

/** The briefing as it was: from a git revision or a file the operator names. */
function loadPreviousBriefing(book, args) {
  if (args.previousFile) {
    return JSON.parse(readFileSync(path.resolve(args.previousFile), "utf8"));
  }
  const relative = path.posix.join("public/scriptures/books", `${book}.json`);
  const result = spawnSync("git", ["show", `${args.previousRef}:${relative}`], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`Could not read ${relative} at ${args.previousRef}: ${result.stderr.trim()}`);
  }
  return JSON.parse(result.stdout);
}

function describeChange(previousBriefing, currentBriefing, changedFields) {
  const before = flattenGrounding({ bookBriefing: previousBriefing });
  const after = flattenGrounding({ bookBriefing: currentBriefing });
  return changedFields.map((field) => `  ${field}\n    - ${before[field]}\n    + ${after[field]}`).join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  const targets = resolveTargets(args);
  if (targets.length === 0) throw new Error("No guides matched the selection");

  const canons = JSON.parse(readFileSync(path.join(ROOT, "public/scriptures/canons.json"), "utf8"));
  const at = new Date().toISOString();
  const previousByBook = new Map();
  const refused = [];
  const candidates = [];
  const changesByBook = new Map();

  for (const item of targets) {
    const [book, ch] = item.split("/");
    const chapter = Number(ch);
    const file = path.join(GUIDES, book, `${ch}.json`);
    if (!existsSync(file)) {
      refused.push(`${item}: guide file is missing`);
      continue;
    }
    if (!previousByBook.has(book)) previousByBook.set(book, loadPreviousBriefing(book, args));
    const guide = JSON.parse(readFileSync(file, "utf8"));
    const result = rebindGuide({
      guide,
      book,
      chapter,
      previousBriefing: previousByBook.get(book),
      by: args.by,
      reason: args.reason,
      at,
      canons,
    });
    if (!result.ok) {
      refused.push(result.reason);
      continue;
    }
    candidates.push({ file, guide: result.guide });
    if (!changesByBook.has(book)) {
      const currentBriefing = JSON.parse(readFileSync(path.join(BRIEFINGS, `${book}.json`), "utf8"));
      changesByBook.set(book, describeChange(previousByBook.get(book), currentBriefing, result.changedFields));
    }
  }

  for (const [book, description] of changesByBook) {
    console.log(`${book}: citation metadata changed\n${description}`);
  }

  if (refused.length > 0) {
    console.error(`re-bound 0/${targets.length} guides; nothing was written`);
    console.error(`REFUSED (${refused.length}):`);
    for (const line of refused) console.error(`  ${line}`);
    process.exitCode = 1;
    return;
  }
  if (args.dryRun) {
    console.log(`[dry-run] would re-bind ${candidates.length}/${targets.length} guides`);
    return;
  }
  for (const { file, guide } of candidates) writeJsonAtomically(file, guide);
  console.log(`re-bound ${candidates.length}/${targets.length} guides at ${at} by ${args.by}`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) main();
