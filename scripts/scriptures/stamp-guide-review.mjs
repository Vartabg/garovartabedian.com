#!/usr/bin/env node
/**
 * Stamp editorial-review metadata onto chapter guides.
 *
 * Safety: a guide is only stampable if it passes the same machine checks the
 * integrity test runs (path identity, reference bounds, key-verse quotation
 * matching against a hosted translation). The matching translations are
 * recorded as sourceIds — the review's source set is measured, not asserted.
 *
 * Usage:
 *   node scripts/scriptures/stamp-guide-review.mjs \
 *     --status agent-reviewed \
 *     --reviewer "agent editorial panel (2026-08-24)" \
 *     --books EZR,EST --chapters 11-23        # ranges apply per book
 *   node scripts/scriptures/stamp-guide-review.mjs --status agent-reviewed \
 *     --reviewer "..." --list EZR/11,EZR/12,SUS/1
 *   node scripts/scriptures/stamp-guide-review.mjs --status agent-reviewed \
 *     --reviewer "Codex editorial panel" --books LEV --rubric guide-v2 \
 *     --bind-hand-authored --generated-at 2026-08-28T12:00:00.000Z \
 *     --grounding-bundle-reviewed
 *
 * This command can never name the model that wrote a guide.
 *
 * It used to accept `--generation-model <anything>`, which let an operator
 * write a whole provenance block from scratch — including a model name — onto
 * a draft that model had never seen. That is exactly what happened: three
 * guides were hand-written by an agent, stamped `gemini-2.5-pro`, and the
 * reader was shown that name on the page. The machine checks all passed,
 * because none of them could tell whether the stamp was true.
 *
 * So there are now two paths and no third:
 *
 *   generated  — build-guides-v2.mjs wrote `generation.model` during a real
 *                run. This command verifies it and never overwrites it.
 *   hand       — no model ran. `--bind-hand-authored` binds the draft to the
 *                grounding bundle and records `attributedModel`, never
 *                `model`. `--attributed-model gpt-5.5` names the drafter when
 *                it is known; otherwise it records "hand-authored". Either
 *                way it is an assertion by the named reviewer, and the schema
 *                keeps it in a different field from anything measured.
 *
 * A reader therefore sees either the model that actually ran, or the plain
 * fact that a person or agent wrote it. There is no input by which a third
 * answer can be produced.
 *
 * --sources auto (default) detects matching translations per guide;
 * --sources web,brenton requires every named edition to match every quotation.
 */
import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { prepareTarget } from "./build-guides-v2.mjs";
import {
  GUIDE_RUBRIC_VERSION,
  isCanonicalIsoDate,
  isCanonicalIsoTimestamp,
  validateGuideV2,
} from "./guide-validation.mjs";

const ROOT = process.cwd();
const GUIDES = path.join(ROOT, "public/scriptures/guides");
const TEXT = path.join(ROOT, "public/scriptures/text");
const STATUSES = new Set(["agent-reviewed", "human-reviewed"]);
const TARGET_PATTERN = /^([1-4]?[A-Z]+)\/([1-9]\d*)$/;
/**
 * What `generation.model` says when no model produced the draft. A fixed
 * literal, never operator input, so it cannot be mistaken for a model id.
 */
export const HAND_AUTHORED_MODEL = "hand-authored";

const writeJsonAtomically = (file, value) => {
  const temporary = `${file}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, file);
};

const localCalendarDate = (date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, "0"))
    .join("-");

function parseArgs(argv) {
  const args = {
    sources: "auto",
    status: null,
    reviewer: null,
    list: [],
    books: [],
    chapters: null,
    rubric: null,
    reviewedAt: null,
    bindHandAuthored: false,
    attributedModel: null,
    generatedAt: null,
    groundingBundleReviewed: false,
    dryRun: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--status") args.status = argv[++i];
    else if (a === "--reviewer") args.reviewer = argv[++i];
    else if (a === "--sources") args.sources = argv[++i];
    else if (a === "--list") {
      args.list = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (a === "--books") {
      args.books = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (a === "--chapters") args.chapters = argv[++i];
    else if (a === "--rubric") args.rubric = argv[++i];
    else if (a === "--reviewed-at") args.reviewedAt = argv[++i];
    else if (a === "--bind-hand-authored") args.bindHandAuthored = true;
    else if (a === "--attributed-model") args.attributedModel = argv[++i];
    else if (a === "--generated-at") args.generatedAt = argv[++i];
    else if (a === "--grounding-bundle-reviewed") args.groundingBundleReviewed = true;
    else if (a === "--dry-run") args.dryRun = true;
    else throw new Error(`Unknown arg ${a}`);
  }
  if (!args.status || !STATUSES.has(args.status)) {
    throw new Error(`--status must be one of ${[...STATUSES].join(", ")}`);
  }
  if (!args.reviewer || args.reviewer.trim().length < 3) {
    throw new Error("--reviewer must name who signed this pass");
  }
  if (args.status === "human-reviewed" && /agent/i.test(args.reviewer)) {
    throw new Error("human-reviewed guides cannot credit an agent reviewer");
  }
  if (args.list.length > 0 && args.books.length > 0) {
    throw new Error("Use either --list or --books, not both");
  }
  if (args.list.length > 0 && args.chapters !== null) {
    throw new Error("--chapters cannot be combined with the already explicit --list selection");
  }
  for (const item of args.list) {
    if (!TARGET_PATTERN.test(item)) throw new Error(`Bad --list target: ${item}`);
  }
  for (const book of args.books) {
    if (!/^[1-4]?[A-Z]+$/.test(book)) throw new Error(`Bad --books target: ${book}`);
  }
  if (args.rubric !== null && args.rubric !== GUIDE_RUBRIC_VERSION) {
    throw new Error(`--rubric must be ${GUIDE_RUBRIC_VERSION}`);
  }
  if (args.reviewedAt !== null) {
    if (!isCanonicalIsoDate(args.reviewedAt)) {
      throw new Error("--reviewed-at must be a real ISO calendar date");
    }
  }
  if (args.bindHandAuthored && args.rubric !== GUIDE_RUBRIC_VERSION) {
    throw new Error("--bind-hand-authored requires --rubric guide-v2");
  }
  if (args.generatedAt !== null && !isCanonicalIsoTimestamp(args.generatedAt)) {
    throw new Error("--generated-at must be a real canonical ISO timestamp");
  }
  if (args.bindHandAuthored !== (args.generatedAt !== null)) {
    throw new Error("--bind-hand-authored and --generated-at must be supplied together");
  }
  if (args.attributedModel !== null && !args.bindHandAuthored) {
    throw new Error("--attributed-model only applies with --bind-hand-authored");
  }
  if (args.attributedModel !== null && args.attributedModel.trim().length < 3) {
    throw new Error("--attributed-model must name who or what drafted the guide");
  }
  if (args.bindHandAuthored && !args.groundingBundleReviewed) {
    throw new Error(
      "--bind-hand-authored requires --grounding-bundle-reviewed: inspect the exact prepared bundle before binding its hash",
    );
  }
  return args;
}

const normalize = (v) =>
  v.normalize("NFKC").toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();

const parseRef = (ref) => {
  const m = /^(\d+):(\d+)(?:[-–—](\d+))?$/.exec(ref.replace(/\s/g, ""));
  if (!m) return null;
  const chapter = Number(m[1]);
  const start = Number(m[2]);
  const end = Number(m[3] ?? m[2]);
  return chapter >= 1 && start >= 1 && end >= start ? { chapter, start, end } : null;
};

function matchingTranslations(book, chapter, keyVerses) {
  const matches = [];
  for (const trans of ["web", "kjv", "drb", "brenton", "charles"]) {
    const file = path.join(TEXT, trans, `${book}.json`);
    if (!existsSync(file)) continue;
    const text = JSON.parse(readFileSync(file, "utf8"));
    const ok =
      text.book === book &&
      keyVerses.every((kv) => {
        const range = parseRef(kv.ref);
        if (!range || range.chapter !== chapter) return false;
        const verses = text.chapters[range.chapter - 1]?.slice(range.start - 1, range.end);
        if (!verses) return false;
        const hosted = normalize(verses.join(" "));
        return kv.text
          .split(/(?:\.{3}|…)/)
          .map(normalize)
          .filter(Boolean)
          .every((frag) => hosted.includes(frag));
      });
    if (ok) matches.push(trans);
  }
  return matches;
}

function chapterRange(chapters, book) {
  if (!chapters) return null;
  const m = /^(\d+)(?:-(\d+))?$/.exec(chapters);
  if (!m) throw new Error(`Bad --chapters value: ${chapters}`);
  const start = Number(m[1]);
  const end = Number(m[2] ?? m[1]);
  if (start < 1 || end < start) throw new Error(`Bad --chapters value: ${chapters}`);
  const out = [];
  for (let c = start; c <= end; c++) {
    const p = path.join(GUIDES, book, `${c}.json`);
    if (!existsSync(p)) throw new Error(`Missing requested guide ${book}/${c}`);
    out.push(`${book}/${c}`);
  }
  return out;
}

function resolveTargets(args) {
  const targets = [];
  for (const item of args.list) {
    targets.push(item);
  }
  for (const book of args.books) {
    if (args.chapters) {
      const range = chapterRange(args.chapters, book);
      if (range) targets.push(...range);
    } else {
      const dir = path.join(GUIDES, book);
      if (!existsSync(dir)) throw new Error(`No guide directory for ${book}`);
      for (const f of readdirSync(dir)) {
        if (f.endsWith(".json")) targets.push(`${book}/${f.replace(".json", "")}`);
      }
    }
  }
  return [...new Set(targets)].sort();
}

// Guarded so the module can be imported. It used to run its whole CLI body at
// top level, which meant merely importing a constant from it parsed argv and
// threw — and so nothing could test its rules.
function main() {
  const args = parseArgs(process.argv);
  const targets = resolveTargets(args);
  if (targets.length === 0) throw new Error("No guides matched the selection");

  const canons = JSON.parse(readFileSync(path.join(ROOT, "public/scriptures/canons.json"), "utf8"));
  const today = args.reviewedAt ?? localCalendarDate(new Date());
  const skipped = [];
  const candidates = [];

  for (const item of targets) {
    const [book, ch] = item.split("/");
    const file = path.join(GUIDES, book, `${ch}.json`);
    if (!existsSync(file)) {
      skipped.push(`${item}: guide file is missing`);
      continue;
    }
    const guide = JSON.parse(readFileSync(file, "utf8"));
    if (guide.book !== book || Number(guide.chapter) !== Number(ch)) {
      skipped.push(`${item}: identity mismatch`);
      continue;
    }

    // ENO uses Charles; other books use WEB. Resolve primary translation from canons.
    const primaryTransForStamp = (canons.books[book]?.trans?.[0] ?? "web");
    const textPathPrimary = path.join(TEXT, primaryTransForStamp, `${book}.json`);
    const textPathWebFallback = path.join(TEXT, "web", `${book}.json`);
    const textPath = existsSync(textPathPrimary) ? textPathPrimary : textPathWebFallback;
    let chapterVerses = 0;
    if (existsSync(textPath)) {
      const parsedText = JSON.parse(readFileSync(textPath, "utf8"));
      const chEntry = parsedText.chapters?.[Number(ch)-1] ?? parsedText.chapters?.[ch];
      if (Array.isArray(chEntry)) chapterVerses = chEntry.length;
      else if (chEntry && typeof chEntry === "object") chapterVerses = Object.keys(chEntry).length;
      else chapterVerses = parsedText.chapters?.[ch] ? Object.keys(parsedText.chapters[ch]).length : 0;
    }
    let invalidQuestion = null;
    for (const q of guide.questions ?? []) {
      for (const ref of q.verseRefs ?? []) {
        const parsed = parseRef(ref);
        if (!parsed || parsed.chapter !== Number(ch) || (chapterVerses > 0 && parsed.end > chapterVerses)) {
          invalidQuestion = `${item}: question ${q.id ?? q.question} has unresolved ${ref}`;
          break;
        }
      }
      if (invalidQuestion) break;
    }
    if (invalidQuestion) {
      skipped.push(invalidQuestion);
      continue;
    }

    let strictSources = null;
    if (args.rubric === GUIDE_RUBRIC_VERSION) {
      const prepared = prepareTarget(book, Number(ch));
      if (args.bindHandAuthored) {
        // A model that actually ran left its own name here. Binding a
        // hand-authored draft may never overwrite that, or the record of which
        // model wrote a guide could be edited away after the fact.
        const existing = guide.generation?.model;
        if (existing) {
          skipped.push(
            `${item}: already generated by ${existing}; --bind-hand-authored cannot overwrite a real run`,
          );
          continue;
        }
        guide.generation = {
          // Never `model`. That field is a measurement, and nothing here
          // measured anything — the reviewer is asserting who drafted it.
          attributedModel: args.attributedModel ?? HAND_AUTHORED_MODEL,
          promptHash: prepared.promptHash,
          generatedAt: new Date(args.generatedAt).toISOString(),
          rubricVersion: GUIDE_RUBRIC_VERSION,
          method: "review-bound",
        };
      }
      const validation = validateGuideV2({
        guide,
        root: ROOT,
        canons,
        book,
        chapter: Number(ch),
        expectedPromptHash: prepared.promptHash,
      });
      if (validation.failures.length > 0) {
        skipped.push(`${item}: v2 validation failed — ${validation.failures.join("; ")}`);
        continue;
      }
      const provenance = guide.generation;
      const expectedHash = prepared.promptHash;
      if (
        !provenance ||
        !(provenance.model?.trim() || provenance.attributedModel?.trim()) ||
        provenance.rubricVersion !== GUIDE_RUBRIC_VERSION ||
        !["direct-generation", "review-bound"].includes(provenance.method) ||
        !isCanonicalIsoTimestamp(provenance.generatedAt) ||
        !/^[a-f0-9]{64}$/.test(provenance.promptHash ?? "") ||
        provenance.promptHash !== expectedHash
      ) {
        skipped.push(`${item}: missing, stale, or invalid v2 generation provenance`);
        continue;
      }
      strictSources = validation.matchingTranslationIds;
    }
    const measuredSources =
      strictSources ?? matchingTranslations(book, Number(ch), guide.keyVerses ?? []);
    const sources =
      args.sources === "auto"
        ? measuredSources
        : [...new Set(args.sources.split(",").map((s) => s.trim()).filter(Boolean))];
    if (sources.length === 0) {
      skipped.push(`${item}: key verses match no hosted translation — fix before stamping`);
      continue;
    }
    const unmatchedSources = sources.filter((source) => !measuredSources.includes(source));
    if (unmatchedSources.length > 0) {
      skipped.push(
        `${item}: requested sourceIds do not match every quotation — ${unmatchedSources.join(", ")}`,
      );
      continue;
    }
    guide.reviewStatus = args.status;
    guide.reviewedAt = today;
    guide.reviewer = args.reviewer;
    guide.sourceIds = sources;
    candidates.push({ file, guide });
  }

  if (skipped.length) {
    console.error(`stamped 0/${targets.length} guides as ${args.status}; no guides were stamped`);
    console.error(`SKIPPED (${skipped.length}):`);
    for (const s of skipped) console.error("  " + s);
    process.exitCode = 1;
  } else if (args.dryRun) {
    console.log(`[dry-run] would stamp ${candidates.length}/${targets.length} guides as ${args.status}`);
  } else {
    for (const { file, guide } of candidates) {
      writeJsonAtomically(file, guide);
    }
    console.log(`stamped ${candidates.length}/${targets.length} guides as ${args.status}`);
  }

}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
