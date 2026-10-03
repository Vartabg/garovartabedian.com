import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import type { BookText, Canons, ChapterGuide } from "../src/lib/scriptures/types";

const GUIDES_ROOT = "public/scriptures/guides";
const TEXT_ROOT = "public/scriptures/text";

const readJson = <T,>(file: string): T =>
  JSON.parse(readFileSync(file, "utf8")) as T;

const canons = readJson<Canons>("public/scriptures/canons.json");

type VerseRange = {
  chapter: number;
  start: number;
  end: number;
};

type HostedText = {
  translation: string;
  text: BookText;
};

const parseVerseRange = (value: string): VerseRange | null => {
  const match = /^(\d+):(\d+)(?:[-–—](\d+))?$/.exec(value.replace(/\s/g, ""));
  if (!match) return null;

  const chapter = Number(match[1]);
  const start = Number(match[2]);
  const end = Number(match[3] ?? match[2]);
  if (chapter < 1 || start < 1 || end < start) return null;

  return { chapter, start, end };
};

const versesFor = (text: BookText, range: VerseRange): string[] | null => {
  const chapter = text.chapters[range.chapter - 1];
  if (!chapter || range.end > chapter.length) return null;
  return chapter.slice(range.start - 1, range.end);
};

const normalizeQuote = (value: string) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const quotesHostedText = (hosted: string, quotation: string) => {
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

const hostedTextsFor = (book: string): HostedText[] =>
  (canons.books[book]?.trans ?? []).flatMap((translation) => {
    const file = path.join(TEXT_ROOT, translation, `${book}.json`);
    return existsSync(file)
      ? [{ translation, text: readJson<BookText>(file) }]
      : [];
  });

test("every Scripture guide resolves its references and quotes one hosted translation", () => {
  const failures: string[] = [];

  for (const entry of readdirSync(GUIDES_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const book = entry.name;
    const guideDirectory = path.join(GUIDES_ROOT, book);
    const hostedTexts = hostedTextsFor(book);
    if (hostedTexts.length === 0) {
      failures.push(`${book}: no hosted translations`);
      continue;
    }

    for (const file of readdirSync(guideDirectory).filter((name) => name.endsWith(".json"))) {
      const guidePath = path.join(guideDirectory, file);
      const guide = readJson<ChapterGuide>(guidePath);
      const pathChapter = Number.parseInt(file.replace(/\.json$/, ""), 10);
      const label = `${book}/${file}`;

      if (guide.book !== book || guide.chapter !== pathChapter) {
        failures.push(
          `${label}: path identity does not match ${guide.book}/${guide.chapter}`,
        );
      }
      if (guide.bookName !== canons.books[book]?.name) {
        failures.push(`${label}: bookName does not match canon metadata`);
      }

      let sourceCandidates = hostedTexts;
      for (const keyVerse of guide.keyVerses) {
        const range = parseVerseRange(keyVerse.ref);
        if (!range) {
          failures.push(`${label}: invalid key-verse reference ${keyVerse.ref}`);
          continue;
        }
        if (range.chapter !== guide.chapter) {
          failures.push(`${label}: key verse ${keyVerse.ref} is outside its guide chapter`);
        }
        if (!keyVerse.text.trim() || !keyVerse.why.trim()) {
          failures.push(`${label}: key verse ${keyVerse.ref} has empty semantic content`);
        }

        const matchingTexts = hostedTexts.filter(({ text }) => {
          const verses = versesFor(text, range);
          return verses && quotesHostedText(verses.join(" "), keyVerse.text);
        });

        if (matchingTexts.length === 0) {
          failures.push(`${label}: ${keyVerse.ref} does not quote a hosted text`);
        }

        const matchingIds = new Set(matchingTexts.map(({ translation }) => translation));
        sourceCandidates = sourceCandidates.filter(({ translation }) =>
          matchingIds.has(translation),
        );
      }

      if (guide.keyVerses.length === 0) {
        failures.push(`${label}: no key verses`);
      } else if (sourceCandidates.length === 0) {
        failures.push(`${label}: key verses do not share one hosted translation`);
      }

      const referenceTexts = sourceCandidates.length > 0 ? sourceCandidates : hostedTexts;
      const localVerseCounts = referenceTexts.flatMap(({ text }) => {
        const chapter = text.chapters[guide.chapter - 1];
        return chapter ? [chapter.length] : [];
      });

      const questionIds = new Set<string>();
      for (const question of guide.questions) {
        if (!question.id.trim() || questionIds.has(question.id)) {
          failures.push(`${label}: question id ${question.id || "<empty>"} is not unique`);
        }
        questionIds.add(question.id);
        if (!question.question.trim() || !question.answer.trim()) {
          failures.push(`${label}: question ${question.id} has empty semantic content`);
        }

        const parsedRefs = question.verseRefs.map((reference) => ({
          reference,
          range: parseVerseRange(reference),
        }));

        for (const { reference, range } of parsedRefs) {
          if (!range || !referenceTexts.some(({ text }) => versesFor(text, range))) {
            failures.push(`${label}: question ${question.id} has unresolved ${reference}`);
          }
        }

        for (const verse of question.relatedVerses ?? []) {
          if (
            !Number.isInteger(verse) ||
            verse < 1 ||
            !localVerseCounts.some((count) => verse <= count)
          ) {
            failures.push(`${label}: question ${question.id} has invalid related verse ${verse}`);
            continue;
          }

          const covered = parsedRefs.some(
            ({ range }) =>
              range?.chapter === guide.chapter &&
              verse >= range.start &&
              verse <= range.end,
          );
          if (!covered) {
            failures.push(
              `${label}: question ${question.id} related verse ${verse} is not covered by verseRefs`,
            );
          }
        }
      }
    }
  }

  assert.deepEqual(failures.sort(), []);
});

test("every hosted WEB chapter has exactly one guide", () => {
  const failures: string[] = [];
  const webRoot = path.join(TEXT_ROOT, "web");

  for (const file of readdirSync(webRoot).filter((name) => name.endsWith(".json"))) {
    const book = file.replace(/\.json$/, "");
    const text = readJson<BookText>(path.join(webRoot, file));
    for (let chapter = 1; chapter <= text.chapters.length; chapter += 1) {
      const guide = path.join(GUIDES_ROOT, book, `${chapter}.json`);
      if (!existsSync(guide)) failures.push(`${book}/${chapter}.json is missing`);
    }
  }

  assert.deepEqual(failures, []);
});
