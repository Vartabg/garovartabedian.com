#!/usr/bin/env node

/**
 * The per-chapter record behind "Guide checks" on the site case study.
 *
 * One row per hosted chapter slot, saying what was checked for that chapter's
 * guide when this ran: nothing here is typed by hand. corpus-health.json
 * keeps the totals; this file keeps the rows, so pages that only need the
 * totals do not load 1,586 of them.
 *
 * Reviewers and drafters are listed in the order they are first met, walking
 * the books in canon order and each book's chapters upward. Running it takes
 * about five seconds.
 *
 * Tests import this module, so the write happens only when it is run as a
 * script.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateGuideContract } from "../lib/guide-validation.mjs";
import { prepareTarget } from "../scriptures/build-guides-v2.mjs";
import {
  GUIDE_RUBRICS,
  NO_PROVENANCE_MESSAGE,
  isSupportedRubric,
  loadHostedTexts,
  validateGuideV2,
} from "../scriptures/guide-validation.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const GUIDE_RECORD_PATH = path.join(ROOT, "public/meta/guide-record.json");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

/** validateGuideV2 says this of any guide locked to no supported rubric; it is the state, not a problem. */
const isNoProvenance = (message) => message.endsWith(NO_PROVENANCE_MESSAGE);

/** The supported rubrics, in the order a row's `rubric` index refers to. */
const RUBRICS = Object.keys(GUIDE_RUBRICS);

const REVIEW = { "agent-reviewed": "agent", "human-reviewed": "human" };

/** Position of `value` in `list`, adding it on first sight. */
const indexIn = (list, value, same = (a, b) => a === b) => {
  const found = list.findIndex((entry) => same(entry, value));
  return found === -1 ? list.push(value) - 1 : found;
};

export function collectGuideRecord() {
  const canons = readJson(path.join(ROOT, "public/scriptures/canons.json"));
  const reviewers = [];
  const drafters = [];
  const totals = { chapters: 0, current: 0, earlier: 0, none: 0, agentReviewed: 0, humanReviewed: 0, unreviewed: 0 };

  const books = canons.bookOrder.map((id) => {
    const meta = canons.books[id];
    const hostedTexts = loadHostedTexts({ root: ROOT, canons, book: id });
    // The text validateGuideV2 checks a guide against.
    const primary = (hostedTexts.find(({ translation }) => translation === "web") ?? hostedTexts[0])?.text;
    // What each tradition that lists the book would open: its preferred hosted translation.
    const readers = canons.traditions.flatMap((entry, index) => {
      if (!entry.books.includes(id)) return [];
      const translation = entry.transPreference.find((candidate) => meta.trans.includes(candidate)) ?? meta.trans[0];
      const text = hostedTexts.find((hosted) => hosted.translation === translation)?.text;
      return text ? [{ index, text }] : [];
    });
    /** The first tradition whose reader has text for this chapter, so the link never opens an empty page. */
    const traditionFor = (chapter) =>
      readers.find(({ text }) => (text.chapters[chapter - 1]?.length ?? 0) > 0)?.index ?? null;

    const chapters = Array.from({ length: meta.chapters }, (_, index) => {
      const chapter = index + 1;
      totals.chapters += 1;
      const file = path.join(ROOT, "public/scriptures/guides", id, `${chapter}.json`);
      if (!fs.existsSync(file)) {
        totals.none += 1;
        return { chapter, state: "none", tradition: traditionFor(chapter) };
      }

      const guide = readJson(file);
      // Throws on a guide that fails the checks every published guide must pass.
      validateGuideContract(guide, { bookId: id, bookName: meta.name, chapter, hostedTexts });

      const verses = primary?.chapters?.[chapter - 1]?.length ?? 0;
      // A guide is checked against the rubric it is locked to, and against the
      // prompt that rubric produces. One locked to none is measured against
      // the drafting rubric, which is what "problems" counts for it.
      const rubricVersion = guide.generation?.rubricVersion;
      const onRubric = isSupportedRubric(rubricVersion);
      const failures = validateGuideV2({
        guide,
        root: ROOT,
        canons,
        book: id,
        chapter,
        ...(onRubric
          ? { expectedPromptHash: prepareTarget(id, chapter, { rubricVersion }).promptHash }
          : {}),
      }).failures.filter((message) => onRubric || !isNoProvenance(message));
      // A guide that claims a rubric and fails it must not ship; corpus health stops the build for the same reason.
      if (onRubric && failures.length > 0) {
        throw new Error(`${id}/${chapter} carries ${rubricVersion} provenance but fails the rubric:\n- ${failures.join("\n- ")}`);
      }
      const state = onRubric ? "current" : "earlier";
      totals[state] += 1;

      const review = REVIEW[guide.reviewStatus] ?? "none";
      totals[review === "agent" ? "agentReviewed" : review === "human" ? "humanReviewed" : "unreviewed"] += 1;

      const generation = guide.generation ?? {};
      const drafter = generation.model
        ? { kind: "measured", label: generation.model }
        : generation.attributedModel
          ? { kind: "attributed", label: generation.attributedModel }
          : null;

      return {
        chapter,
        state,
        tradition: traditionFor(chapter),
        keyVerses: guide.keyVerses.length,
        questions: guide.questions.length,
        outlineParts: guide.outline.length,
        verses,
        review,
        reviewer: guide.reviewer ? indexIn(reviewers, guide.reviewer) : null,
        reviewedAt: guide.reviewedAt ?? null,
        drafter: drafter
          ? indexIn(drafters, drafter, (a, b) => a.kind === b.kind && a.label === b.label)
          : null,
        rebinds: (generation.rebound ?? []).length,
        // The rubric cannot run where the text it checks against lacks the chapter.
        problems: verses === 0 ? null : failures.length,
        // Which rubric a current guide is locked to; null for an earlier one.
        rubric: onRubric ? RUBRICS.indexOf(rubricVersion) : null,
      };
    });

    return { id, name: meta.name, chapters };
  });

  return {
    schemaVersion: 2,
    generatedBy: "scripts/site/build-guide-record.mjs",
    rubrics: RUBRICS,
    totals,
    traditions: canons.traditions.map((entry) => entry.id),
    reviewers,
    drafters,
    books,
  };
}

/** One chapter row per line, so a changed guide is a one-line diff. */
export function serializeGuideRecord(record) {
  const { books, ...head } = record;
  const pairs = (object) =>
    Object.entries(object).map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)}`);
  const lines = ["{", ...pairs(head).map((pair) => `  ${pair},`), '  "books": ['];
  books.forEach(({ chapters, ...meta }, bookIndex) => {
    lines.push(`    { ${pairs(meta).join(", ")}, "chapters": [`);
    chapters.forEach((row, rowIndex) => {
      lines.push(`      ${JSON.stringify(row)}${rowIndex < chapters.length - 1 ? "," : ""}`);
    });
    lines.push(`    ] }${bookIndex < books.length - 1 ? "," : ""}`);
  });
  lines.push("  ]", "}");
  return `${lines.join("\n")}\n`;
}

export function writeGuideRecord() {
  const record = collectGuideRecord();
  fs.mkdirSync(path.dirname(GUIDE_RECORD_PATH), { recursive: true });
  fs.writeFileSync(GUIDE_RECORD_PATH, serializeGuideRecord(record), "utf8");
  return record;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { totals } = writeGuideRecord();
  console.log(
    `Guide record: ${totals.chapters} chapters, ${totals.current} on the current checks, ${totals.earlier} on the earlier checks, ${totals.none} with no guide`,
  );
  console.log(path.relative(ROOT, GUIDE_RECORD_PATH));
}
