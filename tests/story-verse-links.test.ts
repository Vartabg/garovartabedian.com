import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { angelStories } from "../src/lib/angel-stories";
import { APOSTLE_STORIES } from "../src/lib/apostles/stories";
import { PARABLE_WALKS } from "../src/lib/jesus/parable-walks";
import { sayingStudyLinks } from "../src/lib/jesus/saying-study-links";
import { WORD_STUDIES } from "../src/lib/jesus/word-studies";
import { KIND_CODES, STATUS_CODES } from "../src/lib/scriptures/bridge-verdicts.mjs";
import { SCRIPTURE_STORIES } from "../src/lib/scriptures/stories";
import { parseStudyContext, studyToolHref } from "../src/lib/scriptures/study-context";
import { hasUnverifiedStudyNumbering } from "../src/lib/scriptures/study-passage";
import { ORIGINAL_LANGUAGE, verseStudyLinks, type StudyVerse } from "../src/lib/scriptures/verse-study-links";
import { wordBridgeHref } from "../src/lib/scriptures/word-bridge-url";

const hosted = (file: string) => JSON.parse(readFileSync(path.join(process.cwd(), "public/scriptures", file), "utf8"));
const webVerse = ({ book, chapter, verse }: StudyVerse): string => hosted(`text/web/${book}.json`).chapters[chapter - 1]?.[verse - 1];
const bookNames = (hosted("canons.json") as { books: Record<string, { name: string }> }).books;

/** The verse each of the 13 stories outside the Scripture paths turns on. */
const TOLD: { story: string; at: StudyVerse }[] = [
  ...angelStories.map((story) => ({ story: story.slug, at: story.titleVerse })),
  ...APOSTLE_STORIES.map((story) => ({ story: story.slug, at: { book: story.book, chapter: story.chapter, verse: story.titleVerse } })),
  ...PARABLE_WALKS.map((walk) => {
    const last = walk.stops[walk.stops.length - 1];
    return { story: walk.id, at: { book: last.book, chapter: last.chapter, verse: last.end } };
  }),
  ...WORD_STUDIES.map((study) => ({ story: study.id, at: { book: study.anchor.book, chapter: study.anchor.chapter, verse: study.anchor.verse } })),
];

/** The words in each told story's verse that its title comes from (World English Bible). */
const PHRASES: Record<string, string> = {
  "open-his-eyes": "please open his eyes",
  "i-am-with-you": "Behold, I am with you",
  "the-gate-opened": "which opened to them by itself",
  "come-and-eat": "Come and eat breakfast!",
  "peace-be-with-you": "Peace be to you.",
  "every-language": "in our own native language",
  "good-samaritan": "Go and do likewise.",
};

describe("verse study links", () => {
  it("gives compare then words, worded as on the path stories, with the site's own tool links", () => {
    const links = verseStudyLinks({ book: "JHN", chapter: 21, verse: 12 });
    assert.deepEqual(links.map((link) => link.id), ["compare", "words"]);
    assert.deepEqual(links.map((link) => link.label), [
      "Compare translations of John 21:12, with the Greek",
      "See the Greek words behind John 21:12",
    ]);
    assert.equal(links[0].href, studyToolHref("/scriptures/polyglot", { traditionId: "protestant", bookId: "JHN", chapter: 21, verse: 12, translation: "web" }));
    assert.equal(links[1].href, wordBridgeHref("protestant", "JHN", 21, 12));
    assert.deepEqual(verseStudyLinks({ book: "2KI", chapter: 6, verse: 17 }).map((link) => link.label), [
      "Compare translations of 2 Kings 6:17, with the Hebrew",
      "See the Hebrew words behind 2 Kings 6:17",
    ]);
  });

  it("refuses books whose editions are not verified to line up, and books with no listed language", () => {
    assert.throws(() => verseStudyLinks({ book: "EST", chapter: 4, verse: 14 }), /not verified/);
    assert.throws(() => verseStudyLinks({ book: "DAN", chapter: 6, verse: 22 }), /not verified/);
    assert.throws(() => verseStudyLinks({ book: "PSA", chapter: 23, verse: 1 }), /No original language/);
  });

  it("names the language of every path story book that gets the lines", () => {
    for (const story of SCRIPTURE_STORIES) {
      if (hasUnverifiedStudyNumbering(story.book)) continue;
      assert.ok(ORIGINAL_LANGUAGE[story.book], `${story.slug}: no language for ${story.book}`);
    }
  });

  it("covers the 13 told stories outside the Scripture paths", () => {
    assert.equal(TOLD.length, 13);
    assert.equal(new Set(TOLD.map((item) => item.story)).size, 13);
  });

  it("takes each angel and apostle verse from inside the story's own passage", () => {
    for (const story of angelStories) {
      const range = /(\d+):(\d+)–(\d+)$/.exec(story.reference);
      assert.ok(range, story.reference);
      const [chapter, start, end] = range.slice(1).map(Number);
      assert.equal(story.titleVerse.chapter, chapter, story.slug);
      assert.ok(story.titleVerse.verse >= start && story.titleVerse.verse <= end, `${story.slug} verse outside ${story.reference}`);
      assert.ok(story.passage.startsWith(`/scriptures/protestant/${story.titleVerse.book}/${chapter}?`), `${story.slug} passage is another chapter`);
    }
    for (const story of APOSTLE_STORIES) {
      assert.ok(story.titleVerse >= story.start && story.titleVerse <= story.end, `${story.slug} verse outside ${story.reference}`);
    }
  });

  it("quotes the words the title comes from", () => {
    for (const { story, at } of TOLD) {
      const phrase = PHRASES[story];
      if (!phrase) continue;
      assert.ok(webVerse(at).includes(phrase), `${story}: "${phrase}" is not in ${at.book} ${at.chapter}:${at.verse}`);
    }
    assert.equal(Object.keys(PHRASES).length, 7);
  });

  it("builds two lines on each saying's anchor verse", () => {
    const map = sayingStudyLinks();
    assert.deepEqual(Object.keys(map).sort(), WORD_STUDIES.map((study) => study.id).sort());
    for (const study of WORD_STUDIES) {
      assert.deepEqual(map[study.id], verseStudyLinks(study.anchor), study.id);
      assert.equal(map[study.id].length, 2, study.id);
    }
  });

  it("points every line at a verse the hosted data can answer", () => {
    const bridgeIndex = hosted("bridge/index.json") as { books: Record<string, { chapters: number[] }> };
    for (const { story, at } of TOLD) {
      const { book, chapter, verse } = at;
      const where = `${bookNames[book].name} ${chapter}:${verse}`;
      const [compare, words] = verseStudyLinks(at);

      const parsed = parseStudyContext(new URLSearchParams(compare.href.split("?")[1])).context;
      assert.deepEqual(parsed && [parsed.bookId, parsed.chapter, parsed.verse, parsed.translation], [book, chapter, verse, "web"], story);
      for (const translation of ["web", "kjv", "drb"]) {
        const text = hosted(`text/${translation}/${book}.json`).chapters[chapter - 1]?.[verse - 1];
        assert.ok(typeof text === "string" && text.trim(), `${translation} has no ${where}`);
      }

      const original = hosted(`original/${book}/${chapter}.json`) as {
        edition: string;
        verses: { number: number; languages: string[]; words: unknown[] }[];
      };
      const source = original.verses.find((item) => item.number === verse);
      assert.ok(source && source.words.length > 0, `No original text for ${where}`);
      // The language each line names is the language of the hosted original verse.
      assert.deepEqual(source.languages, [ORIGINAL_LANGUAGE[book].toLowerCase()], story);
      assert.equal(compare.label, `Compare translations of ${where}, with the ${ORIGINAL_LANGUAGE[book]}`);
      assert.equal(words.label, `See the ${ORIGINAL_LANGUAGE[book]} words behind ${where}`);

      // The reader opens the word panel only for indexed chapters of these two editions.
      assert.ok(bridgeIndex.books[book]?.chapters.includes(chapter), `${book} ${chapter} is not in the word-link index`);
      assert.ok(["oshb", "sblgnt"].includes(original.edition), story);
      const rows = (hosted(`bridge/${book}/${chapter}.json`).verses[String(verse)] ?? []) as [number[], string[], number, number][];
      const clean = rows.filter((row) => KIND_CODES[row[2]] === "link" && STATUS_CODES[row[3]] === "ok").length;
      assert.ok(clean >= 4, `${where} has only ${clean} checked word links`);
    }
  });
});
