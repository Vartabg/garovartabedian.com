import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { validateGuideContext } from "./guide-context-validation.mjs";

/** The drafting default. build-guides-v2.mjs drafts under this version. */
export const GUIDE_RUBRIC_VERSION = "guide-v2";
/**
 * Every rubric a guide may be locked to, and the only limits that differ
 * between them. Everything else in validateGuideV2 is the same for both.
 *
 * guide-v2 bounds machine drafts. guide-v3 has the wider limits of the
 * hand-written Mark guides, which guide-v2 rejected: more questions, outline
 * parts and key verses, no required `word` question, and a glossary entry
 * may name something the chapter shows without spelling (Crucifixion, the
 * longer ending) if it is tied to verses in the chapter. guide-v3 only
 * widens: a guide that meets guide-v2's limits meets guide-v3's.
 */
export const GUIDE_RUBRICS = {
  "guide-v2": {
    file: "GUIDE_RUBRIC_V2.md",
    questions: [7, 9],
    outlineMax: 7,
    keyVerses: [2, 4],
    requireWord: true,
    glossaryVerseTie: false,
  },
  "guide-v3": {
    file: "GUIDE_RUBRIC_V3.md",
    questions: [7, 14],
    outlineMax: 9,
    keyVerses: [2, 5],
    requireWord: false,
    glossaryVerseTie: true,
  },
};
export const isSupportedRubric = (version) =>
  typeof version === "string" && Object.hasOwn(GUIDE_RUBRICS, version);
/** Said of a guide whose `generation` block is absent, malformed, or names no supported rubric. */
export const NO_PROVENANCE_MESSAGE = "missing or malformed guide generation provenance";
export const HOSTED_TRANSLATIONS = ["web", "kjv", "drb", "brenton", "charles"];
/**
 * The only grounding fields a guide may be re-bound across without a fresh
 * review: where a book briefing's citation points and what it is called.
 * A URL is opaque to a drafter and a label is a pointer's name; neither can
 * change what a chapter says. Everything else — the hosted text, the
 * briefing's claims (`says`), cross-references, topics, the rubric — is
 * substance, and a change there means the guide was checked against
 * something the reader can no longer see. Kept here so the tool that
 * re-binds and the validator that audits it cannot disagree.
 */
export const REBIND_ALLOWED_FIELD = /^bookBriefing\.sources\.\d+\.(?:url|label)$/;
export const REBIND_REASON_MIN_LENGTH = 40;
export const isCanonicalIsoDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};
export const isCanonicalIsoTimestamp = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  ) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
};

export const TEMPLATE_SIGNATURES = [
  /\(\d+ verses\) continues the story of/i,
  /for a first-time reader, it answers: who is god in this moment/i,
  /this placeholder will be replaced/i,
  /the guide will be replaced/i,
  /what is happening in .+ \d+\?/i,
  /read the summary above, then note who is speaking/i,
];

export const normalizeGuideQuote = (value) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export function parseVerseRange(value) {
  const match = /^(\d+):(\d+)(?:[-–—](\d+))?$/.exec(
    String(value).replace(/\s/g, ""),
  );
  if (!match) return null;

  const chapter = Number(match[1]);
  const start = Number(match[2]);
  const end = Number(match[3] ?? match[2]);
  return chapter >= 1 && start >= 1 && end >= start
    ? { chapter, start, end }
    : null;
}

export function parseOutlineRange(value) {
  const match = /^(\d+)(?:[-–—](\d+))?$/.exec(String(value).replace(/\s/g, ""));
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2] ?? match[1]);
  return start >= 1 && end >= start ? { start, end } : null;
}

export const hasTemplateSignature = (guide) => {
  if (typeof guide === "string") {
    // Preserve the original signature/escaping rules within each text value.
    // Serializing a whole guide lets .+ join unrelated questions and answers.
    const text = JSON.stringify(guide);
    return TEMPLATE_SIGNATURES.some((signature) => signature.test(text));
  }
  return guide !== null && typeof guide === "object"
    ? Object.values(guide).some(hasTemplateSignature)
    : false;
};

// These are generation instructions or serialization markers, not broad words
// such as "analysis", "schema", or "I need to", which can belong in commentary.
// Check decoded prose strings: JSON.stringify itself introduces delimiters.
const PROSE_CONTAMINATION_SIGNATURES = [
  ["JSON output instruction", /\b(?:should\s+be\s+(?:valid\s+)?json|(?:ensure\s+)?(?:return|output|emit|respond\s+with)\s+(?:only\s+(?:(?:valid|strict)\s+)?json|(?:(?:valid|strict)\s+)?json\s+only))\b/i],
  ["schema self-check", /\bfinal\s+used\s+schema\s+(?:probably\s+)?(?:ok|okay)\b/i],
  ["model self-identification", /\bas\s+an?\s+(?:ai(?:\s+language)?|large\s+language)\s+model\b/i],
  ["model protocol token", /<\|(?:im_start|im_end|im_sep|start_header_id|end_header_id|eot_id|endoftext|start|end|message|channel)\|>/i],
  ["reasoning channel tag", /<\/?(?:think|analysis|final)>/i],
  ["code fence", /(?:^|\n)\s*```(?:json|javascript|js)?(?:\s|$)/i],
  ["stray JSON delimiter", /}\s*,\s*{/],
];

/**
 * Validate all reader-facing prose, including optional continuity notes.
 * Deliberately omit IDs, refs, hashes, and provenance: those describe how the
 * guide was produced and may legitimately discuss generation or validation.
 */
export function validateGuideProse(guide) {
  const fields = [];
  const addFields = (value, prefix, keys) => {
    for (const key of keys) fields.push([`${prefix}${key}`, value?.[key]]);
  };
  addFields(guide, "", ["bookName", "summary", "whyItMatters"]);
  addFields(guide.context, "context.", ["author", "audience", "date", "setting", "literaryForm"]);
  for (const [name, keys] of [
    ["outline", ["heading", "note"]],
    ["keyVerses", ["text", "why"]],
    ["questions", ["question", "answer"]],
    ["glossary", ["term", "def"]],
  ]) {
    if (Array.isArray(guide[name])) {
      guide[name].forEach((entry, index) => addFields(entry, `${name}[${index}].`, keys));
    }
  }
  if (Array.isArray(guide.themes)) {
    guide.themes.forEach((theme, index) => fields.push([`themes[${index}]`, theme]));
  }
  for (const position of ["before", "here", "after"]) {
    addFields(guide.readingContext?.[position], `readingContext.${position}.`, ["text"]);
  }

  return fields.flatMap(([field, value]) => {
    if (typeof value !== "string") return [];
    const signature = PROSE_CONTAMINATION_SIGNATURES.find(([, pattern]) => pattern.test(value));
    return signature
      ? [`${guide.book}/${guide.chapter}: ${field} contains generation/protocol residue (${signature[0]})`]
      : [];
  });
}

export function quotesHostedText(hosted, quotation) {
  const normalizedHosted = normalizeGuideQuote(hosted);
  const fragments = String(quotation)
    .split(/(?:\.{3}|…)/)
    .map(normalizeGuideQuote)
    .filter(Boolean);

  if (fragments.length === 0) return false;

  let cursor = 0;
  for (const fragment of fragments) {
    let position = normalizedHosted.indexOf(fragment, cursor);
    while (
      position !== -1 &&
      ((position > 0 && normalizedHosted[position - 1] !== " ") ||
        (position + fragment.length < normalizedHosted.length &&
          normalizedHosted[position + fragment.length] !== " "))
    ) {
      position = normalizedHosted.indexOf(fragment, position + 1);
    }
    if (position === -1) return false;
    cursor = position + fragment.length;
  }
  return true;
}

export function loadHostedTexts({ root, canons, book }) {
  return (canons.books[book]?.trans ?? HOSTED_TRANSLATIONS).flatMap(
    (translation) => {
      const file = path.join(root, "public/scriptures/text", translation, `${book}.json`);
      return existsSync(file)
        ? [{ translation, text: JSON.parse(readFileSync(file, "utf8")) }]
        : [];
    },
  );
}

const versesFor = (text, range) => {
  const chapter = text.chapters[range.chapter - 1];
  if (!chapter || range.end > chapter.length) return null;
  return chapter.slice(range.start - 1, range.end);
};

const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const isSha256Hex = (value) => /^[a-f0-9]{64}$/.test(value ?? "");

/**
 * A re-bind record is the audit trail for a prompt hash that moved without a
 * fresh review. Each entry must say when, who, why, what the guide was bound
 * to before, and exactly which grounding fields differed — and every one of
 * those fields must be citation metadata (REBIND_ALLOWED_FIELD). A record
 * that cannot be read this way is a failure, not a warning: an unexplained
 * hash change is the thing the hash exists to catch.
 *
 * @param {any} generation the guide's `generation` block
 * @param {string} label `${book}/${chapter}` for messages
 * @returns {string[]} failures
 */
export function validateRebindRecord(generation, label) {
  const failures = [];
  const rebound = generation?.rebound;
  if (!Array.isArray(rebound) || rebound.length === 0) {
    failures.push(`${label}: generation.rebound must be a non-empty array when present`);
    return failures;
  }
  const seenPrevious = new Set();
  rebound.forEach((entry, index) => {
    const where = `${label}: rebound[${index}]`;
    if (!entry || typeof entry !== "object") {
      failures.push(`${where} must be an object`);
      return;
    }
    if (!isCanonicalIsoTimestamp(entry.at)) {
      failures.push(`${where}.at must be a canonical ISO timestamp`);
    }
    if (!nonEmpty(entry.by) || entry.by.trim().length < 3) {
      failures.push(`${where}.by must name who re-bound the guide`);
    }
    if (!nonEmpty(entry.reason) || entry.reason.trim().length < REBIND_REASON_MIN_LENGTH) {
      failures.push(
        `${where}.reason must explain the correction in at least ${REBIND_REASON_MIN_LENGTH} characters`,
      );
    }
    if (!isSha256Hex(entry.previousPromptHash)) {
      failures.push(`${where}.previousPromptHash must be the sha256 the guide was bound to before`);
    } else if (entry.previousPromptHash === generation.promptHash) {
      failures.push(`${where}.previousPromptHash must differ from the current prompt hash`);
    } else if (seenPrevious.has(entry.previousPromptHash)) {
      failures.push(`${where}.previousPromptHash repeats an earlier entry`);
    }
    seenPrevious.add(entry.previousPromptHash);
    if (!Array.isArray(entry.changedFields) || entry.changedFields.length === 0) {
      failures.push(`${where}.changedFields must list the grounding fields that differed`);
    } else {
      const disallowed = entry.changedFields.filter(
        (field) => typeof field !== "string" || !REBIND_ALLOWED_FIELD.test(field),
      );
      if (disallowed.length > 0) {
        failures.push(
          `${where}.changedFields may only name citation url/label fields; found ${disallowed.join(", ")}`,
        );
      }
    }
  });
  return failures;
}

const QUESTION_CATEGORIES = new Set([
  "context",
  "word",
  "theology",
  "history",
  "practical",
  "hard_verse",
]);

/**
 * Strict validation for guides locked to a rubric. Legacy guides continue to
 * use the repository-wide integrity test until they are replaced.
 *
 * `rubricVersion` means "measure the content against this version's limits".
 * Without it the guide's own version is used when it names a supported one,
 * and the drafting rubric otherwise, so a guide with no provenance is
 * measured as it always was. The validator does not compare the argument
 * with the guide's own version; the stamp tool, which writes the version,
 * holds that guard.
 *
 * @param {{
 *   guide: any,
 *   root: string,
 *   canons: any,
 *   book: string,
 *   chapter: number,
 *   expectedPromptHash?: string,
 *   rubricVersion?: string,
 * }} options
 */
export function validateGuideV2({
  guide,
  root,
  canons,
  book,
  chapter,
  expectedPromptHash,
  rubricVersion,
}) {
  const failures = [];
  const label = `${book}/${chapter}`;
  if (rubricVersion !== undefined && !isSupportedRubric(rubricVersion)) {
    throw new Error(
      `Unknown rubric "${rubricVersion}"; expected one of ${Object.keys(GUIDE_RUBRICS).join(", ")}`,
    );
  }
  const ownVersion = guide.generation?.rubricVersion;
  const limits =
    GUIDE_RUBRICS[rubricVersion ?? (isSupportedRubric(ownVersion) ? ownVersion : GUIDE_RUBRIC_VERSION)];
  const hostedTexts = loadHostedTexts({ root, canons, book });
  const primaryTranslation = hostedTexts.find(({ translation }) => translation === "web") ?? hostedTexts[0];
  const primaryText = primaryTranslation?.text;
  const chapterVerses = primaryText?.chapters?.[chapter - 1] ?? [];
  const requiredTranslationId = primaryTranslation?.translation ?? "web";
  const briefingFile = path.join(root, "public/scriptures/books", `${book}.json`);
  const briefing = existsSync(briefingFile) ? JSON.parse(readFileSync(briefingFile, "utf8")) : null;
  const contextText = hostedTexts.find(({ translation }) => translation === guide.readingContextSource?.translation)?.text;
  failures.push(...validateGuideContext({ guide, text: contextText, briefing }));
  failures.push(...validateGuideProse(guide));

  if (chapterVerses.length === 0) {
    failures.push(`${label}: hosted ${requiredTranslationId.toUpperCase()} chapter is missing or empty`);
  }

  if (guide.book !== book || Number(guide.chapter) !== Number(chapter)) {
    failures.push(`${label}: path identity does not match guide identity`);
  }
  if (guide.bookName !== canons.books[book]?.name) {
    failures.push(`${label}: bookName does not match canon metadata`);
  }
  if (
    !guide.generation ||
    !isSupportedRubric(guide.generation.rubricVersion) ||
    !["direct-generation", "review-bound"].includes(guide.generation.method) ||
    !isCanonicalIsoTimestamp(guide.generation.generatedAt) ||
    !/^[a-f0-9]{64}$/.test(guide.generation.promptHash ?? "")
  ) {
    failures.push(`${label}: ${NO_PROVENANCE_MESSAGE}`);
  } else if (guide.generation.method === "direct-generation") {
    // `model` is a measurement: only a real run may write it.
    if (!nonEmpty(guide.generation.model)) {
      failures.push(`${label}: direct-generation must record the model that answered`);
    }
    if (guide.generation.attributedModel !== undefined) {
      failures.push(`${label}: a measured run may not also carry an attribution`);
    }
  } else {
    // `attributedModel` is an assertion by the reviewer, and must not be able
    // to masquerade as a measurement.
    if (!nonEmpty(guide.generation.attributedModel)) {
      failures.push(`${label}: review-bound must record who or what drafted it`);
    }
    if (guide.generation.model !== undefined) {
      failures.push(
        `${label}: review-bound may not set model — an unmeasured claim belongs in attributedModel`,
      );
    }
  }
  if (
    expectedPromptHash !== undefined &&
    guide.generation?.promptHash !== expectedPromptHash
  ) {
    failures.push(`${label}: generation prompt hash does not match current grounding`);
  }
  if (guide.generation?.rebound !== undefined) {
    failures.push(...validateRebindRecord(guide.generation, label));
  }
  if (!nonEmpty(guide.summary) || guide.summary.trim().length < 80) {
    failures.push(`${label}: summary must be specific and at least 80 characters`);
  }
  if (!nonEmpty(guide.whyItMatters) || guide.whyItMatters.trim().length < 60) {
    failures.push(`${label}: whyItMatters must be specific and at least 60 characters`);
  }
  for (const field of ["author", "audience", "date", "setting", "literaryForm"]) {
    if (!nonEmpty(guide.context?.[field])) {
      failures.push(`${label}: context.${field} must preserve the book briefing's orientation`);
    }
  }
  if (hasTemplateSignature(guide)) {
    failures.push(`${label}: retained a rejected template signature`);
  }

  const minOutline = Math.min(3, chapterVerses.length);
  if (
    !Array.isArray(guide.outline) ||
    guide.outline.length < minOutline ||
    guide.outline.length > limits.outlineMax
  ) {
    failures.push(`${label}: outline must contain ${minOutline}-${limits.outlineMax} chapter-specific movements`);
  } else {
    const covered = new Set();
    let expectedStart = 1;
    for (const part of guide.outline) {
      const range = parseOutlineRange(part.verses);
      if (
        !nonEmpty(part.heading) ||
        !nonEmpty(part.note) ||
        !range ||
        range.end > chapterVerses.length
      ) {
        failures.push(`${label}: invalid outline movement ${part.heading || "<empty>"}`);
        continue;
      }
      if (range.start !== expectedStart) {
        failures.push(`${label}: outline has a gap, overlap, or out-of-order movement at ${part.verses}`);
      }
      for (let verse = range.start; verse <= range.end; verse += 1) covered.add(verse);
      expectedStart = range.end + 1;
    }
    if (covered.size !== chapterVerses.length) {
      failures.push(`${label}: outline must cover every verse in the ${requiredTranslationId.toUpperCase()} chapter`);
    }
  }

  let matchingTranslations = hostedTexts;
  const [minKeyVerses, maxKeyVerses] = limits.keyVerses;
  if (
    !Array.isArray(guide.keyVerses) ||
    guide.keyVerses.length < minKeyVerses ||
    guide.keyVerses.length > maxKeyVerses
  ) {
    failures.push(`${label}: keyVerses must contain ${minKeyVerses}-${maxKeyVerses} quotations`);
  } else {
    for (const keyVerse of guide.keyVerses) {
      const range = parseVerseRange(keyVerse.ref);
      if (
        !range ||
        range.chapter !== chapter ||
        !nonEmpty(keyVerse.text) ||
        normalizeGuideQuote(keyVerse.text).split(" ").length < 5 ||
        !nonEmpty(keyVerse.why) ||
        keyVerse.why.trim().length < 40
      ) {
        failures.push(`${label}: invalid key verse ${keyVerse.ref || "<empty>"}`);
        continue;
      }
      const matches = hostedTexts.filter(({ text }) => {
        const verses = versesFor(text, range);
        return verses && quotesHostedText(verses.join(" "), keyVerse.text);
      });
      if (matches.length === 0) {
        failures.push(`${label}: ${keyVerse.ref} does not quote a hosted translation`);
      }
      if (!matches.some(({ translation }) => translation === requiredTranslationId)) {
        failures.push(`${label}: ${keyVerse.ref} does not quote the bundled ${requiredTranslationId.toUpperCase()} chapter`);
      }
      const ids = new Set(matches.map(({ translation }) => translation));
      matchingTranslations = matchingTranslations.filter(({ translation }) =>
        ids.has(translation),
      );
    }
    if (matchingTranslations.length === 0) {
      failures.push(`${label}: key verses do not share one hosted translation`);
    }
  }

  const reviewFieldsPresent = [
    guide.reviewStatus,
    guide.reviewedAt,
    guide.reviewer,
    guide.sourceIds,
  ].some((value) => value !== undefined);
  if (reviewFieldsPresent) {
    if (!["agent-reviewed", "human-reviewed"].includes(guide.reviewStatus)) {
      failures.push(`${label}: reviewStatus must name a supported review tier`);
    }
    if (!isCanonicalIsoDate(guide.reviewedAt)) {
      failures.push(`${label}: reviewedAt must be a real ISO calendar date`);
    }
    if (!nonEmpty(guide.reviewer) || guide.reviewer.trim().length < 3) {
      failures.push(`${label}: reviewer must name who signed the review`);
    }
    if (
      guide.reviewStatus === "human-reviewed" &&
      /agent/i.test(guide.reviewer ?? "")
    ) {
      failures.push(`${label}: human-reviewed guides cannot credit an agent reviewer`);
    }
    if (
      !Array.isArray(guide.sourceIds) ||
      guide.sourceIds.length === 0 ||
      new Set(guide.sourceIds).size !== guide.sourceIds.length ||
      guide.sourceIds.some(
        (sourceId) => !matchingTranslations.some(
          ({ translation }) => translation === sourceId,
        ),
      )
    ) {
      failures.push(`${label}: sourceIds must be unique matching hosted translations`);
    }
  }

  if (!Array.isArray(guide.themes) || guide.themes.length < 3 || guide.themes.length > 6) {
    failures.push(`${label}: themes must contain 3-6 concise entries`);
  } else if (!guide.themes.every(nonEmpty)) {
    failures.push(`${label}: themes must be nonempty strings`);
  } else if (
    new Set(guide.themes.map((theme) => theme.trim().toLowerCase())).size !==
    guide.themes.length
  ) {
    failures.push(`${label}: themes must not repeat`);
  }

  const questions = Array.isArray(guide.questions) ? guide.questions : [];
  const [minQuestions, maxQuestions] = limits.questions;
  if (questions.length < minQuestions || questions.length > maxQuestions) {
    failures.push(`${label}: questions must contain ${minQuestions}-${maxQuestions} grounded entries`);
  }
  const ids = new Set();
  const categories = new Set();
  for (const question of questions) {
    if (!nonEmpty(question.id) || ids.has(question.id)) {
      failures.push(`${label}: question ids must be nonempty and unique`);
    }
    ids.add(question.id);
    categories.add(question.category);
    if (!QUESTION_CATEGORIES.has(question.category)) {
      failures.push(`${label}: question ${question.id || "<empty>"} has an invalid category`);
    }
    if (!nonEmpty(question.question) || !nonEmpty(question.answer) || question.answer.trim().length < 70) {
      failures.push(`${label}: question ${question.id || "<empty>"} needs a substantive answer`);
    }
    if (!Array.isArray(question.verseRefs) || question.verseRefs.length === 0) {
      failures.push(`${label}: question ${question.id || "<empty>"} has no verseRefs`);
      continue;
    }
    const ranges = question.verseRefs.map(parseVerseRange);
    if (
      ranges.some(
        (range) =>
          !range ||
          range.chapter !== chapter ||
          range.end > chapterVerses.length,
      )
    ) {
      failures.push(`${label}: question ${question.id} has an unresolved or off-chapter ref`);
    }
    if (
      question.relatedVerses !== undefined &&
      !Array.isArray(question.relatedVerses)
    ) {
      failures.push(`${label}: question ${question.id} relatedVerses must be an array`);
      continue;
    }
    for (const verse of question.relatedVerses ?? []) {
      const covered = ranges.some(
        (range) => range && verse >= range.start && verse <= range.end,
      );
      if (!Number.isInteger(verse) || !covered) {
        failures.push(`${label}: question ${question.id} has an ungrounded related verse ${verse}`);
      }
    }
  }
  if (limits.requireWord && !categories.has("word")) {
    failures.push(`${label}: needs a chapter-specific word question`);
  }
  if (!categories.has("hard_verse")) {
    failures.push(`${label}: needs an honest hard-verse question`);
  }

  if (!Array.isArray(guide.glossary) || guide.glossary.length < 2) {
    failures.push(`${label}: glossary must explain at least two terms from the chapter`);
  } else {
    const normalizedChapter = normalizeGuideQuote(chapterVerses.join(" "));
    for (const entry of guide.glossary) {
      if (!nonEmpty(entry.term) || !nonEmpty(entry.def) || entry.def.trim().length < 25) {
        failures.push(`${label}: glossary entries must have a term and definition`);
        continue;
      }
      // guide-v3 only: an entry may be tied to verses instead of sharing a
      // word with the chapter. The code checks that each ref resolves inside
      // this chapter. That the term belongs to those verses is the
      // reviewer's judgment, not something measured here.
      let tiedToVerses = false;
      if (limits.glossaryVerseTie && entry.verses !== undefined) {
        const refs = Array.isArray(entry.verses) ? entry.verses.map(parseVerseRange) : [];
        tiedToVerses =
          refs.length > 0 &&
          refs.every(
            (range) => range && range.chapter === chapter && range.end <= chapterVerses.length,
          );
        if (!tiedToVerses) {
          failures.push(`${label}: glossary term “${entry.term}” has an unresolved or off-chapter verse tie`);
          continue;
        }
      }
      const termTokens = normalizeGuideQuote(entry.term)
        .split(" ")
        .filter((token) => token.length >= 4);
      if (
        !tiedToVerses &&
        termTokens.length > 0 &&
        !termTokens.some((token) => normalizedChapter.includes(token))
      ) {
        failures.push(`${label}: glossary term “${entry.term}” is not active in the hosted chapter`);
      }
    }
  }

  return {
    failures,
    matchingTranslationIds: matchingTranslations.map(({ translation }) => translation),
  };
}
