import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import canonsData from "../public/scriptures/canons.json" with { type: "json" };
import { WORD_STUDIES } from "../src/lib/jesus/word-studies";
import type { OriginalChapter } from "../src/lib/scriptures/types";

const ROOT = path.join(import.meta.dirname, "..");
const canons = canonsData as { books: Record<string, { name: string; chapters: number }> };

/** Accents and breathings vary between editions; the letters do not. */
const fold = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ··]/g, "").toLowerCase();

function chapterLemmas(book: string, chapter: number) {
  const file = path.join(ROOT, "public/scriptures/original", book, `${chapter}.json`);
  assert.ok(existsSync(file), `${book} ${chapter} has no hosted original text`);
  return JSON.parse(readFileSync(file, "utf8")) as OriginalChapter;
}

/** A term may be one lemma or a short sequence of them ("ἐγώ εἰμι"). */
function verseCarriesTerm(chapter: OriginalChapter, verseNumber: number, term: string) {
  const verse = chapter.verses.find((entry) => entry.number === verseNumber);
  if (!verse) return false;
  const lemmas = verse.words.map((word) => fold(word.lemma));
  const parts = term.trim().split(/\s+/).map(fold);
  if (parts.length === 1) return lemmas.includes(parts[0]);
  for (let start = 0; start + parts.length <= lemmas.length; start += 1) {
    if (parts.every((part, offset) => lemmas[start + offset] === part)) return true;
  }
  return false;
}

test("every word study names a Greek term the hosted text actually contains", () => {
  // The lens used to link out to STEP Bible, which meant nothing here could
  // check the claim. Pointing it at the site's own critical edition makes the
  // claim checkable, so it is checked: a term the hosted Greek does not carry
  // at the verse the link opens fails the build.
  assert.ok(WORD_STUDIES.length > 0);
  for (const study of WORD_STUDIES) {
    const { book, chapter } = study.anchor;
    const verse = study.language.verse ?? study.anchor.verse;
    const original = chapterLemmas(book, chapter);
    assert.equal(original.edition, "sblgnt", `${study.id}: expected the Greek New Testament`);
    assert.ok(
      verseCarriesTerm(original, verse, study.language.term),
      `${study.id}: "${study.language.term}" is not a lemma at ${book} ${chapter}:${verse}`,
    );
  }
});

test("a study whose word sits away from its anchor says so", () => {
  // The Lord's Prayer is anchored at Matthew 6:9; ἐπιούσιος is in 6:11. If the
  // override were dropped the link would open a verse without the word in it,
  // which the check above would catch — this pins the case that motivated it.
  const prayer = WORD_STUDIES.find((study) => study.id === "lords-prayer");
  assert.ok(prayer, "the Lord's Prayer study is gone");
  assert.equal(prayer.language.verse, 11);
  assert.equal(prayer.anchor.verse, 9);
});

test("no study sends a reader off the site to see a word", () => {
  const source = readFileSync(path.join(ROOT, "src/lib/jesus/word-studies.ts"), "utf8");
  assert.ok(!/stepbible/i.test(source), "a STEP Bible link-out came back");
  assert.ok(!/sourceUrl/.test(source), "the language lens should not carry an external URL");
});

test("every study reference resolves to a real chapter", () => {
  // parallels, roots, and thread are all rendered as links.
  for (const study of WORD_STUDIES) {
    const refs = [...study.parallels, ...study.roots, ...study.thread];
    assert.ok(refs.length > 0, `${study.id} has no references`);
    for (const item of refs) {
      const match = /^([A-Z0-9]{3})\s+(\d+):(\d+)$/.exec(item.ref);
      assert.ok(match, `${study.id}: unparseable ref ${item.ref}`);
      const [, book, chapter] = match;
      const meta = canons.books[book];
      assert.ok(meta, `${study.id}: unknown book ${book}`);
      assert.ok(
        Number(chapter) >= 1 && Number(chapter) <= meta.chapters,
        `${study.id}: ${item.ref} is outside ${book}`,
      );
      assert.ok(item.note.trim().length > 0, `${study.id}: ${item.ref} has no note`);
    }
  }
});
