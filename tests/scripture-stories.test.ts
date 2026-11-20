import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { angelStories } from "../src/lib/angel-stories";
import { APOSTLE_STORIES } from "../src/lib/apostles/stories";
import { PARABLE_WALKS } from "../src/lib/jesus/parable-walks";
import { WORD_STUDIES } from "../src/lib/jesus/word-studies";
import { SCRIPTURE_STORIES, getScriptureStory, storyStops } from "../src/lib/scriptures/stories";
import { KIND_CODES, STATUS_CODES } from "../src/lib/scriptures/bridge-verdicts.mjs";
import { storyPassageLinks, storyQuotedVerse } from "../src/lib/scriptures/story-deeper";
import { bookName, passageHref, readSpan } from "../src/lib/scriptures/story-text";
import { parseStudyContext, studyToolHref } from "../src/lib/scriptures/study-context";
import { hasUnverifiedStudyNumbering } from "../src/lib/scriptures/study-passage";
import { wordBridgeHref } from "../src/lib/scriptures/word-bridge-url";
import {
  SAMARITAN_ID,
  SHELF_ORDER,
  SHELF_SITUATIONS,
  SHELF_STORIES,
  shelfBookName,
  shelfCiteLabel,
  shelfStopPicture,
  type ShelfCite,
} from "../src/lib/story-shelf";

describe("scripture stories", () => {
  const joseph = getScriptureStory("joseph");

  it("keeps Joseph to a short path whose lines point at the hosted text", () => {
    assert.ok(joseph);
    assert.equal(SCRIPTURE_STORIES.length, 14);
    assert.equal(getScriptureStory("missing"), undefined);
    for (const story of SCRIPTURE_STORIES) {
      const path = storyStops(story);
      assert.ok(path.length >= 5 && path.length <= 8, story.slug);
      assert.equal(path.filter((stop) => stop.words).length, 1, story.slug);
      const lowest = Math.max(...path.filter((stop) => stop.place.side === "left").map((stop) => stop.place.y));
      const highest = Math.min(...path.filter((stop) => stop.place.side === "right").map((stop) => stop.place.y));
      assert.ok(highest < lowest, story.slug);
      for (const stop of path) {
        assert.ok(stop.line.split(/\s+/).length <= 16, `${story.slug}:${stop.id}`);
        assert.ok(stop.mark.length > 0 && stop.mark.length <= 12, `${story.slug}:${stop.id}`);
        for (const cite of stop.cites) {
          const verse = readSpan(story.book, { chapter: cite.chapter, start: cite.verse, end: cite.verse })[0];
          assert.ok(verse.text.length > 0, `${story.slug}:${stop.id}`);
        }
      }
    }
    const stops = storyStops(joseph);
    assert.equal(stops.length, 8);
    for (const stop of stops) {
      assert.ok(stop.line.split(/\s+/).length <= 16, stop.id);
      for (const cite of stop.cites) {
        const verse = readSpan(joseph.book, { chapter: cite.chapter, start: cite.verse, end: cite.verse })[0];
        assert.ok(verse.text.length > 0, stop.id);
      }
    }
    const sold = stops.find((stop) => stop.id === "sold");
    const soldVerse = readSpan(joseph.book, { chapter: 37, start: 28, end: 28 })[0];
    assert.match(soldVerse.text, /twenty pieces of silver/);
    assert.equal(sold?.cites[0].verse, 28);
    const ending = stops.find((stop) => stop.id === "good");
    assert.equal(ending?.words, true);
    const meant = readSpan(joseph.book, { chapter: 50, start: 20, end: 20 })[0];
    assert.match(meant.text, /you meant evil against me, but God meant it for good/);
    assert.deepEqual(joseph.moves.map((move) => move.label), ["Down", "Up", "Face to face"]);
    const forgotten = stops.find((stop) => stop.id === "forgotten");
    const egypt = stops.find((stop) => stop.id === "egypt");
    const tunic = stops.find((stop) => stop.id === "tunic");
    assert.ok(forgotten && egypt && tunic);
    assert.ok(forgotten.place.y > tunic.place.y, "the pit sits lower than the tunic");
    assert.ok(egypt.place.y < forgotten.place.y, "Egypt rises above the pit");
    assert.ok(stops.every((stop) => stop.mark.length > 0 && stop.mark.length <= 12));
  });
});

/** The hosted World English Bible, read straight from the files the site serves. */
function hostedVerse(cite: ShelfCite): string {
  const file = path.join(process.cwd(), "public/scriptures/text/web", `${cite.book}.json`);
  const hosted = JSON.parse(readFileSync(file, "utf8")) as { name: string; chapters: string[][] };
  assert.equal(shelfBookName(cite.book), hosted.name, cite.book);
  const text = hosted.chapters[cite.chapter - 1]?.[cite.verse - 1];
  assert.ok(text, `No hosted text for ${shelfCiteLabel(cite)}`);
  return text;
}

/** "Genesis 28:10–19" as a book name, chapter and verse range. */
function parseRange(reference: string) {
  const match = /^(.+) (\d+):(\d+)–(\d+)$/.exec(reference);
  assert.ok(match, `Unreadable reference ${reference}`);
  return { name: match[1], chapter: Number(match[2]), start: Number(match[3]), end: Number(match[4]) };
}

function assertInside(cite: ShelfCite, reference: string, where: string) {
  const range = parseRange(reference);
  assert.equal(shelfBookName(cite.book), range.name, where);
  assert.equal(cite.chapter, range.chapter, where);
  assert.ok(cite.verse >= range.start && cite.verse <= range.end, `${where}: ${shelfCiteLabel(cite)} is outside ${reference}`);
}

const LETTER = /[\p{L}\p{N}]/u;

type ListedParable = { id: string; title: string; accounts: { ref: string }[] };

/** The parables list owns a walked parable's title and passage. */
function listedParable(id: string): ListedParable {
  const list = JSON.parse(readFileSync(path.join(process.cwd(), "public/jesus/parables.json"), "utf8")) as ListedParable[];
  const found = list.find((item) => item.id === id);
  assert.ok(found, `The parables list has no ${id}`);
  return found;
}

describe("story passage links", () => {
  const hosted = (file: string) => JSON.parse(readFileSync(path.join(process.cwd(), "public/scriptures", file), "utf8"));
  const withTools = SCRIPTURE_STORIES.filter((story) => !hasUnverifiedStudyNumbering(story.book));

  it("opens every story's passage at its first chapter and names the chapters it covers", () => {
    for (const story of SCRIPTURE_STORIES) {
      const [read] = storyPassageLinks(story);
      const chapters = story.toChapter > story.fromChapter ? `${story.fromChapter}–${story.toChapter}` : `${story.fromChapter}`;
      assert.equal(read.id, "read");
      assert.equal(read.href, passageHref(story.book, story.fromChapter, 1));
      assert.equal(read.label, `Read ${bookName(story.book)} ${chapters}`);
      // A reference that names chapters must agree with the line, so the shelf and the story say the same passage.
      if (/\d/.test(story.reference.replace(/^\d /, ""))) assert.equal(read.label, `Read ${story.reference}`, story.slug);
    }
  });

  it("gives the read line alone to books whose editions are not verified to line up", () => {
    const alone = SCRIPTURE_STORIES.filter((story) => hasUnverifiedStudyNumbering(story.book));
    assert.deepEqual(alone.map((story) => story.slug).sort(), ["esther", "furnace", "lions"]);
    for (const story of alone) assert.deepEqual(storyPassageLinks(story).map((link) => link.id), ["read"]);
    assert.equal(withTools.length, 11);
    for (const story of withTools) assert.deepEqual(storyPassageLinks(story).map((link) => link.id), ["read", "compare", "words"]);
  });

  it("points the compare and words lines at the verse the story quotes, where the hosted data can answer", () => {
    const bridgeIndex = hosted("bridge/index.json") as { books: Record<string, { chapters: number[] }> };
    for (const story of withTools) {
      const { chapter, verse } = storyQuotedVerse(story);
      const [, compare, words] = storyPassageLinks(story);
      const where = `${bookName(story.book)} ${chapter}:${verse}`;

      assert.equal(compare.href, studyToolHref("/scriptures/polyglot", { traditionId: "protestant", bookId: story.book, chapter, verse, translation: "web" }));
      const parsed = parseStudyContext(new URLSearchParams(compare.href.split("?")[1])).context;
      assert.deepEqual(parsed && [parsed.bookId, parsed.chapter, parsed.verse, parsed.translation], [story.book, chapter, verse, "web"], story.slug);
      for (const translation of ["web", "kjv", "drb"]) {
        const text = hosted(`text/${translation}/${story.book}.json`).chapters[chapter - 1]?.[verse - 1];
        assert.ok(typeof text === "string" && text.trim(), `${translation} has no ${where}`);
      }

      const original = hosted(`original/${story.book}/${chapter}.json`) as {
        edition: string;
        verses: { number: number; languages: string[]; words: unknown[] }[];
      };
      const source = original.verses.find((item) => item.number === verse);
      assert.ok(source && source.words.length > 0, `No original text for ${where}`);
      // The language each line names is the language of the hosted original verse.
      const language = /with the (\w+)$/.exec(compare.label)?.[1];
      assert.deepEqual(source.languages, [language?.toLowerCase()], story.slug);
      assert.equal(compare.label, `Compare translations of ${where}, with the ${language}`);
      assert.equal(words.label, `See the ${language} words behind ${where}`);

      assert.equal(words.href, wordBridgeHref("protestant", story.book, chapter, verse));
      // The reader opens the word panel only for indexed chapters of these two editions.
      assert.ok(bridgeIndex.books[story.book]?.chapters.includes(chapter), `${story.book} ${chapter} is not in the word-link index`);
      assert.ok(["oshb", "sblgnt"].includes(original.edition), story.slug);
      const rows = (hosted(`bridge/${story.book}/${chapter}.json`).verses[String(verse)] ?? []) as [number[], string[], number, number][];
      const clean = rows.filter((row) => KIND_CODES[row[2]] === "link" && STATUS_CODES[row[3]] === "ok").length;
      assert.ok(clean >= 4, `${where} has only ${clean} checked word links`);
    }
  });

  it("words the lines as agreed", () => {
    const labels = (slug: string) => storyPassageLinks(getScriptureStory(slug)!).map((link) => link.label);
    assert.deepEqual(labels("noah"), ["Read Genesis 6–9", "Compare translations of Genesis 9:13, with the Hebrew", "See the Hebrew words behind Genesis 9:13"]);
    assert.deepEqual(labels("tomb"), ["Read Luke 22–24", "Compare translations of Luke 24:6, with the Greek", "See the Greek words behind Luke 24:6"]);
    assert.deepEqual(labels("ruth"), ["Read Ruth 1–4", "Compare translations of Ruth 4:17, with the Hebrew", "See the Hebrew words behind Ruth 4:17"]);
    assert.deepEqual(labels("esther"), ["Read Esther 2–8"]);
  });
});

/** A listed parable's first account, "LUK 10:30-37", as book, chapter and verse range. */
function parableSpan(id: string) {
  const ref = listedParable(id).accounts[0].ref;
  const match = /^(\S+) (\d+):(\d+)-(\d+)$/.exec(ref);
  assert.ok(match, `Unreadable parable reference ${ref}`);
  return { book: match[1], chapter: Number(match[2]), start: Number(match[3]), end: Number(match[4]) };
}

describe("story shelf", () => {
  const pathSlugs: string[] = SCRIPTURE_STORIES.map((story) => story.slug);
  const walkIds: string[] = PARABLE_WALKS.map((walk) => walk.id);
  const sayingIds: string[] = WORD_STUDIES.map((study) => study.id);
  const angelSlugs: string[] = angelStories.map((story) => story.slug);
  const apostleSlugs: string[] = APOSTLE_STORIES.map((story) => story.slug);

  it("holds every told story once, from Genesis to Acts", () => {
    const expected = [...pathSlugs, ...walkIds, ...sayingIds, ...angelSlugs, ...apostleSlugs];
    assert.equal(expected.length, 27, "The story count changed: place the new story in SHELF_ORDER and update this number");
    assert.equal(new Set(expected).size, expected.length, "two sources share a story id");
    assert.deepEqual(SHELF_STORIES.map((story) => story.id), [...SHELF_ORDER]);
    assert.deepEqual(
      [...SHELF_ORDER].sort(),
      [...expected].sort(),
      "A told story is not on the shelf, or the shelf names one that is gone: fix SHELF_ORDER in src/lib/story-shelf.ts",
    );

    for (const walk of PARABLE_WALKS) {
      const listed = listedParable(walk.id);
      const shelved = SHELF_STORIES.find((story) => story.id === walk.id);
      assert.ok(shelved, walk.id);
      assert.equal(shelved.title, listed.title, walk.id);
      const span = parableSpan(walk.id);
      assert.ok(shelved.reference.startsWith(`${shelfBookName(span.book)} ${span.chapter}:${span.start}`), walk.id);
    }
    assert.equal(SHELF_STORIES.find((story) => story.id === SAMARITAN_ID)?.reference, "Luke 10:30–37");
  });

  it("opens each card on a page and a picture that exist", () => {
    for (const story of SHELF_STORIES) {
      const expected = pathSlugs.includes(story.id)
        ? `/scriptures/stories/${story.id}`
        : walkIds.includes(story.id)
          ? `/jesus/parables?story=${story.id}`
          : sayingIds.includes(story.id)
            ? `/jesus/words?study=${story.id}`
            : angelSlugs.includes(story.id)
              ? `/angels/stories/${story.id}`
              : `/apostles/stories/${story.id}`;
      assert.equal(story.href, expected, story.id);
      assert.ok(story.title.length > 0 && story.reference.length > 0, story.id);
      assert.ok(!story.title.endsWith("."), `${story.id} keeps a full stop in a list title`);
      assert.ok(existsSync(path.join(process.cwd(), "public", story.picture)), `${story.id} picture ${story.picture}`);
    }
    for (const slug of angelSlugs) {
      // These three are fixed directories, not a dynamic route.
      assert.ok(existsSync(path.join(process.cwd(), "src/app/angels/stories", slug, "page.tsx")), slug);
    }
    for (const story of SCRIPTURE_STORIES) {
      for (const stop of storyStops(story)) {
        assert.ok(
          existsSync(path.join(process.cwd(), "public", shelfStopPicture(story.slug, stop.id))),
          `${story.slug}:${stop.id} has no picture`,
        );
      }
    }
  });

  it("puts a story under a word only with a line its source or the hosted verse already has", () => {
    const shelfIds = SHELF_STORIES.map((story) => story.id);
    const tagged = new Set<string>();
    let tags = 0;
    assert.equal(SHELF_SITUATIONS.length, 11);
    assert.equal(new Set(SHELF_SITUATIONS.map((item) => item.id)).size, SHELF_SITUATIONS.length);

    for (const item of SHELF_SITUATIONS) {
      assert.match(item.id, /^[a-z]+$/, item.id);
      assert.ok(Object.keys(item.tags).length >= 2, `${item.id} needs at least two stories`);

      for (const [storyId, tag] of Object.entries(item.tags)) {
        const where = `${item.id}/${storyId}`;
        tags += 1;
        tagged.add(storyId);
        assert.ok(shelfIds.includes(storyId), where);
        const verse = hostedVerse(tag.cite);

        if (tag.source.kind === "stop") {
          const stopId = tag.source.stopId;
          const story = getScriptureStory(storyId);
          const stop = story ? storyStops(story).find((entry) => entry.id === stopId) : undefined;
          assert.ok(story && stop, where);
          assert.equal(tag.line, stop.line, where);
          assert.deepEqual(tag.cite, { book: story.book, chapter: stop.cites[0].chapter, verse: stop.cites[0].verse }, where);
        } else if (tag.source.kind === "saying") {
          const study = WORD_STUDIES.find((entry) => entry.id === storyId);
          assert.ok(study, where);
          assert.equal(tag.line, study.saying, where);
          assert.deepEqual(tag.cite, { book: study.anchor.book, chapter: study.anchor.chapter, verse: study.anchor.verse }, where);
        } else if (tag.source.kind === "invitation") {
          const story = angelStories.find((entry) => entry.slug === storyId);
          assert.ok(story, where);
          assert.equal(tag.line, story.invitation, where);
          assertInside(tag.cite, story.reference, where);
        } else if (tag.source.kind === "opening") {
          const story = APOSTLE_STORIES.find((entry) => entry.slug === storyId);
          assert.ok(story, where);
          assert.equal(tag.line, story.opening.title, where);
          assertInside(tag.cite, story.opening.reference, where);
        } else {
          // A cut: found in the hosted verse, starting and ending on a word boundary.
          const at = verse.indexOf(tag.line);
          assert.ok(at >= 0, `${where} is not a cut from ${shelfCiteLabel(tag.cite)}`);
          assert.ok(at === 0 || !LETTER.test(verse[at - 1]), `${where} starts inside a word`);
          const after = verse[at + tag.line.length];
          assert.ok(after === undefined || !LETTER.test(after), `${where} ends inside a word`);
          assert.equal(tag.line.trim(), tag.line, where);

          // And the verse lies inside the story's own passage.
          const pathStory = getScriptureStory(storyId);
          const walk = PARABLE_WALKS.find((entry) => entry.id === storyId);
          const study = WORD_STUDIES.find((entry) => entry.id === storyId);
          const angel = angelStories.find((entry) => entry.slug === storyId);
          const apostle = APOSTLE_STORIES.find((entry) => entry.slug === storyId);
          if (pathStory) {
            assert.equal(tag.cite.book, pathStory.book, where);
            assert.ok(tag.cite.chapter >= pathStory.fromChapter && tag.cite.chapter <= pathStory.toChapter, where);
          } else if (walk) {
            const span = parableSpan(walk.id);
            assert.equal(tag.cite.book, span.book, where);
            assert.equal(tag.cite.chapter, span.chapter, where);
            assert.ok(tag.cite.verse >= span.start && tag.cite.verse <= span.end, where);
          } else if (study) {
            // A one-verse saying: the cut may come from the exchange around it, in the same chapter.
            assert.equal(tag.cite.book, study.anchor.book, where);
            assert.equal(tag.cite.chapter, study.anchor.chapter, where);
          } else if (angel) {
            assertInside(tag.cite, angel.reference, where);
          } else {
            assert.ok(apostle, where);
            assert.equal(tag.cite.book, apostle.book, where);
            assert.equal(tag.cite.chapter, apostle.chapter, where);
            assert.ok(tag.cite.verse >= apostle.start && tag.cite.verse <= apostle.end, where);
          }
        }
      }
    }

    assert.equal(tags, 33);
    assert.deepEqual(
      shelfIds.filter((id) => !tagged.has(id)),
      [],
      "A story is under no word: tag it in SHELF_SITUATIONS with a line the story itself has",
    );
  });
});
