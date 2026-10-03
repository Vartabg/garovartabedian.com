const CATEGORIES = new Set([
  "context",
  "word",
  "theology",
  "history",
  "practical",
  "hard_verse",
]);

const nonEmpty = (value) =>
  typeof value === "string" && value.trim().length > 0;

const normalizeQuote = (value) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export const parseVerseRange = (value) => {
  if (typeof value !== "string") return null;
  const match = /^(\d+):(\d+)(?:[-–—](\d+))?$/.exec(value.replace(/\s/g, ""));
  if (!match) return null;

  const chapter = Number(match[1]);
  const start = Number(match[2]);
  const end = Number(match[3] ?? match[2]);
  if (chapter < 1 || start < 1 || end < start) return null;
  return { chapter, start, end };
};

const versesFor = (text, range) => {
  const sourceChapter = text?.chapters?.[range.chapter - 1];
  if (!Array.isArray(sourceChapter) || range.end > sourceChapter.length) return null;
  return sourceChapter.slice(range.start - 1, range.end);
};

export const quotesHostedText = (hosted, quotation) => {
  if (typeof hosted !== "string" || typeof quotation !== "string") return false;
  const normalizedHosted = normalizeQuote(hosted);
  const fragments = quotation
    .split(/(?:\.{3}|…)/)
    .map(normalizeQuote)
    .filter(Boolean);
  if (fragments.length === 0) return false;

  let cursor = 0;
  for (const fragment of fragments) {
    let position = normalizedHosted.indexOf(fragment, cursor);
    while (position > 0 && normalizedHosted[position - 1] !== " ") {
      position = normalizedHosted.indexOf(fragment, position + 1);
    }
    if (position === -1) return false;
    cursor = position + fragment.length;
  }
  return true;
};

/**
 * Validate the same guide facts that the corpus integrity test relies on.
 * Returns the hosted translations that match every quoted key verse.
 */
export function validateGuideContract(
  guide,
  { bookId, bookName, chapter, hostedTexts },
) {
  const label = `${bookId} ${chapter}`;
  if (!guide || typeof guide !== "object" || Array.isArray(guide)) {
    throw new Error(`${label}: guide root must be an object`);
  }
  if (!Array.isArray(hostedTexts) || hostedTexts.length === 0) {
    throw new Error(`${label}: no hosted translations are available for validation`);
  }

  const errors = [];
  if (
    guide.book !== bookId ||
    guide.chapter !== chapter ||
    guide.bookName !== bookName
  ) {
    errors.push("book, chapter, and bookName must match the target path");
  }
  if (!nonEmpty(guide.summary)) errors.push("summary is empty");
  if (!nonEmpty(guide.whyItMatters)) errors.push("whyItMatters is empty");
  if (
    !guide.context ||
    typeof guide.context !== "object" ||
    Array.isArray(guide.context)
  ) {
    errors.push("context must be an object");
  }
  for (const field of ["outline", "keyVerses", "themes", "questions"]) {
    if (!Array.isArray(guide[field])) errors.push(`${field} must be an array`);
  }
  if (guide.glossary !== undefined && !Array.isArray(guide.glossary)) {
    errors.push("glossary must be an array when present");
  }

  let sourceCandidates = hostedTexts;
  if (Array.isArray(guide.keyVerses)) {
    if (guide.keyVerses.length === 0) errors.push("keyVerses must not be empty");
    for (const keyVerse of guide.keyVerses) {
      const reference = keyVerse?.ref ?? "<missing>";
      const range = parseVerseRange(keyVerse?.ref);
      if (!range || range.chapter !== chapter) {
        errors.push(`key verse ${reference} is outside the target chapter`);
        continue;
      }
      if (!nonEmpty(keyVerse?.text) || !nonEmpty(keyVerse?.why)) {
        errors.push(`key verse ${reference} has empty text or rationale`);
        continue;
      }

      const matchingTexts = hostedTexts.filter(({ text }) => {
        const verses = versesFor(text, range);
        return verses && quotesHostedText(verses.join(" "), keyVerse.text);
      });
      if (matchingTexts.length === 0) {
        errors.push(`key verse ${reference} does not quote a hosted text`);
      }
      const matchingIds = new Set(
        matchingTexts.map(({ translation }) => translation),
      );
      sourceCandidates = sourceCandidates.filter(({ translation }) =>
        matchingIds.has(translation),
      );
    }
    if (guide.keyVerses.length > 0 && sourceCandidates.length === 0) {
      errors.push("key verses do not share one hosted translation");
    }
  }

  const referenceTexts =
    sourceCandidates.length > 0 ? sourceCandidates : hostedTexts;
  const localVerseCounts = referenceTexts.flatMap(({ text }) => {
    const sourceChapter = text?.chapters?.[chapter - 1];
    return Array.isArray(sourceChapter) ? [sourceChapter.length] : [];
  });

  if (Array.isArray(guide.questions)) {
    if (guide.questions.length === 0) errors.push("questions must not be empty");
    const ids = new Set();
    for (const question of guide.questions) {
      const id = nonEmpty(question?.id) ? question.id : "<missing>";
      if (!nonEmpty(question?.id) || ids.has(question.id)) {
        errors.push(`question id ${id} is empty or duplicated`);
      } else {
        ids.add(question.id);
      }
      if (!nonEmpty(question?.question) || !nonEmpty(question?.answer)) {
        errors.push(`question ${id} has empty text`);
      }
      if (!CATEGORIES.has(question?.category)) {
        errors.push(`question ${id} has invalid category`);
      }

      if (!Array.isArray(question?.verseRefs)) {
        errors.push(`question ${id} verseRefs must be an array`);
        continue;
      }
      const parsedRefs = question.verseRefs.map((reference) => ({
        reference,
        range: parseVerseRange(reference),
      }));
      for (const { reference, range } of parsedRefs) {
        if (!range || !referenceTexts.some(({ text }) => versesFor(text, range))) {
          errors.push(`question ${id} has unresolved ${String(reference)}`);
        }
      }

      if (
        question.relatedVerses !== undefined &&
        !Array.isArray(question.relatedVerses)
      ) {
        errors.push(`question ${id} relatedVerses must be an array when present`);
        continue;
      }
      for (const verse of question.relatedVerses ?? []) {
        if (
          !Number.isInteger(verse) ||
          verse < 1 ||
          !localVerseCounts.some((count) => verse <= count)
        ) {
          errors.push(`question ${id} has invalid related verse ${String(verse)}`);
          continue;
        }
        const covered = parsedRefs.some(
          ({ range }) =>
            range?.chapter === chapter &&
            verse >= range.start &&
            verse <= range.end,
        );
        if (!covered) {
          errors.push(
            `question ${id} related verse ${verse} is not covered by verseRefs`,
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`${label} guide failed validation:\n- ${errors.join("\n- ")}`);
  }

  return {
    sourceIds: sourceCandidates.map(({ translation }) => translation),
  };
}

export function validateReviewMetadata(guide, hostedSourceIds) {
  const errors = [];
  if (!new Set(["agent-reviewed", "human-reviewed"]).has(guide.reviewStatus)) {
    errors.push(`invalid reviewStatus ${String(guide.reviewStatus)}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(guide.reviewedAt ?? "")) {
    errors.push("reviewedAt must be an ISO date");
  }
  if (!nonEmpty(guide.reviewer) || guide.reviewer.trim().length < 3) {
    errors.push("reviewer must name who signed the pass");
  }
  if (!Array.isArray(guide.sourceIds) || guide.sourceIds.length === 0) {
    errors.push("sourceIds must list the checked translations");
  } else {
    const allowed = new Set(hostedSourceIds);
    for (const sourceId of guide.sourceIds) {
      if (!allowed.has(sourceId)) {
        errors.push(`sourceIds contains unchecked translation ${String(sourceId)}`);
      }
    }
  }
  if (
    guide.reviewStatus === "human-reviewed" &&
    /agent/i.test(guide.reviewer ?? "")
  ) {
    errors.push("human-reviewed guides cannot credit an agent panel");
  }
  if (errors.length > 0) {
    throw new Error(`review metadata failed validation:\n- ${errors.join("\n- ")}`);
  }
}
