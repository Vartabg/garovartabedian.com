import { createHash } from "node:crypto";

/** Continuity depends on the neighboring text as well as the viewed chapter. */
export function contextTextHash(text) {
  return createHash("sha256").update(JSON.stringify({
    book: text.book,
    trans: text.trans,
    chapters: text.chapters,
  })).digest("hex");
}

const populated = (value) => typeof value === "string" && value.trim().length > 0;

/** Optional for legacy guides; an authored context must resolve every reference. */
export function validateGuideContext({ guide, text, briefing }) {
  const failures = [];
  const label = `${guide.book}/${guide.chapter}`;
  const sourceIds = new Set((briefing?.sources ?? []).map((source) => source.id));
  const evidence = (ids, where) => {
    if (ids === undefined) return;
    if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length ||
        ids.some((id) => !sourceIds.has(id))) {
      failures.push(`${label}: ${where} must cite existing, unique book-briefing sources`);
    }
  };
  evidence(guide.contextSourceIds, "contextSourceIds");
  for (const question of Array.isArray(guide.questions) ? guide.questions : []) {
    evidence(question.evidenceSourceIds, `question ${question.id} evidenceSourceIds`);
  }
  if (guide.readingContext === undefined) {
    if (guide.readingContextSource !== undefined) failures.push(`${label}: context source requires readingContext`);
    return failures;
  }
  if (!text || text.book !== guide.book ||
      guide.readingContextSource?.translation !== text.trans ||
      guide.readingContextSource?.textHash !== contextTextHash(text)) {
    failures.push(`${label}: reading context must bind to the current complete hosted edition`);
  }
  for (const key of ["before", "here", "after"]) {
    const block = guide.readingContext?.[key];
    if (!block || !populated(block.text) || !Array.isArray(block.verseRefs) || !block.verseRefs.length) {
      failures.push(`${label}: readingContext.${key} needs prose and book-local verse references`);
      continue;
    }
    evidence(block.evidenceSourceIds, `readingContext.${key} evidenceSourceIds`);
    for (const ref of block.verseRefs) {
      const match = /^(\d+):(\d+)(?:[-–—](\d+))?$/.exec(String(ref));
      const chapter = Number(match?.[1]);
      const start = Number(match?.[2]);
      const end = Number(match?.[3] ?? match?.[2]);
      const verses = text?.chapters?.[chapter - 1];
      if (!match || start < 1 || end < start || !verses || end > verses.length ||
          !verses.slice(start - 1, end).some(populated) ||
          (key === "here" && chapter !== guide.chapter) ||
          (key === "before" && chapter > guide.chapter) ||
          (key === "after" && chapter < guide.chapter)) {
        failures.push(`${label}: readingContext.${key} has an unresolved or misplaced reference ${ref}`);
      }
    }
  }
  return failures;
}
