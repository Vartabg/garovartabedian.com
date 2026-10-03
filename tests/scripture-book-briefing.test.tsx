import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import BookBriefingView from "../src/app/scriptures/[tradition]/[book]/BookBriefing";
import ChapterGuideView from "../src/app/scriptures/[tradition]/[book]/[chapter]/ChapterGuide";
import type { BookBriefing, BookText, Canons, ChapterGuide } from "../src/lib/scriptures/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const readJson = <T,>(path: string): T =>
  JSON.parse(readFileSync(path, "utf8")) as T;

const canons = readJson<Canons>("public/scriptures/canons.json");
const briefingFiles = readdirSync("public/scriptures/books")
  .filter((file) => file.endsWith(".json"))
  .sort();
const briefings = briefingFiles.map((file) =>
  readJson<BookBriefing>(`public/scriptures/books/${file}`),
);
const briefing = briefings.find((item) => item.book === "MRK")!;
const mark = readJson<BookText>("public/scriptures/text/web/MRK.json");
const matthewBriefing = briefings.find((item) => item.book === "MAT")!;
const matthew = readJson<BookText>("public/scriptures/text/web/MAT.json");
const lukeBriefing = briefings.find((item) => item.book === "LUK")!;
const luke = readJson<BookText>("public/scriptures/text/web/LUK.json");
const actsBriefing = briefings.find((item) => item.book === "ACT")!;
const acts = readJson<BookText>("public/scriptures/text/web/ACT.json");
const johnBriefing = briefings.find((item) => item.book === "JHN")!;
const john = readJson<BookText>("public/scriptures/text/web/JHN.json");
const leviticusBriefing = briefings.find((item) => item.book === "LEV")!;

const normalizeQuote = (value: string) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[“”"'‘’.,;:!?—–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const verseAt = (text: BookText, ref: string) => {
  const match = /^(\d+):(\d+)$/.exec(ref);
  if (!match) return null;
  return text.chapters[Number(match[1]) - 1]?.[Number(match[2]) - 1] ?? null;
};

const textFilesFor = (book: string) =>
  (canons.books[book]?.trans ?? []).map((translation) =>
    readJson<BookText>(`public/scriptures/text/${translation}/${book}.json`),
  );

const verseExists = (book: string, ref: string) => {
  const match = /^(\d+):(\d+)$/.exec(ref);
  if (!match) return false;
  return textFilesFor(book).some(
    (text) => Boolean(text.chapters[Number(match[1]) - 1]?.[Number(match[2]) - 1]),
  );
};

const chaptersIn = (range: string) => {
  const [rawStart, rawEnd] = range.replace(/\s/g, "").split(/[–—-]/);
  const start = Number.parseInt(rawStart ?? "", 10);
  const end = rawEnd ? Number.parseInt(rawEnd, 10) : start;
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

test("every authored book briefing renders its purpose and language evidence", () => {
  const authoredBooks = new Set(briefings.map((item) => item.book));
  for (const calibrationBook of ["ACT", "DAN", "GEN", "JHN", "LEV", "LUK", "MAT", "MRK", "PSA", "ROM", "SIR"]) {
    assert.ok(authoredBooks.has(calibrationBook), `${calibrationBook} calibration briefing is required`);
  }

  for (const item of briefings) {
    const tradition = canons.traditions.find((candidate) => candidate.books.includes(item.book));
    assert.ok(tradition, `${item.book} should belong to at least one tradition`);
    const baseHref = `/scriptures/${tradition.id}/${item.book}`;
    const markup = renderToStaticMarkup(
      <BookBriefingView briefing={item} baseHref={baseHref} />,
    );
    const text = JSDOM.fragment(markup).textContent ?? "";

    assert.match(markup, /What this book is driving at/);
    assert.ok(text.includes(item.purpose));
    assert.match(text, /The language beneath the English/);
    assert.match(text, /How the text reached you/);
    assert.match(text, /How this language moves/);
    assert.ok(item.language?.textualHistory?.length, `${item.book} needs textual history`);
    assert.ok((item.language?.features?.length ?? 0) >= 4, `${item.book} needs deep features`);
    assert.ok((item.language?.examples?.length ?? 0) >= 4, `${item.book} needs examples`);
  }
});

test("every briefing has resolvable sources, verse references, and complete chapter shape", () => {
  for (const item of briefings) {
    const sourceIds = (item.sources ?? []).map((source) => source.id);
    assert.equal(new Set(sourceIds).size, sourceIds.length, `${item.book} source ids must be unique`);
    assert.ok(sourceIds.length > 0, `${item.book} needs sources`);
    for (const [fact, ids] of Object.entries(item.factSourceIds ?? {})) {
      assert.ok(ids.length > 0, `${item.book} ${fact} needs evidence`);
      for (const id of ids) assert.ok(sourceIds.includes(id), `${item.book} ${fact} must resolve ${id}`);
    }

    const claims = [
      ...(item.language?.textualHistory ?? []),
      ...(item.language?.features ?? []),
      ...(item.language?.examples ?? []),
    ];
    for (const claim of claims) {
      assert.ok(claim.sourceIds.length > 0, `${item.book} language claim needs evidence`);
      for (const sourceId of claim.sourceIds) {
        assert.ok(sourceIds.includes(sourceId), `${item.book} should resolve source ${sourceId}`);
      }
    }

    const refs = [
      ...(item.language?.features ?? []).flatMap((feature) => feature.refs ?? []),
      ...(item.language?.examples ?? []).map((example) => example.ref),
      ...item.howToRead.flatMap((tip) => tip.refs ?? []),
    ];
    for (const ref of refs) {
      assert.ok(verseExists(item.book, ref), `${item.book} ${ref} should resolve in a hosted text`);
    }

    const covered = item.shape.flatMap((part) => chaptersIn(part.chapters));
    const meta = canons.books[item.book];
    assert.ok(meta, `${item.book} needs canon metadata`);
    assert.ok(
      item.shape.every((part) => part.heading?.trim()),
      `${item.book} shape sections need visible headings`,
    );
    assert.ok(
      item.snags.every((snag) => snag.snag?.trim() && snag.help?.trim()),
      `${item.book} reading snags need visible labels and help`,
    );
    const maxChapters = meta.chapters;
    assert.equal(covered.length, maxChapters, `${item.book} shape should cover all chapters`);
    assert.equal(new Set(covered).size, maxChapters, `${item.book} shape should not overlap`);
    assert.deepEqual(
      [...covered].sort((a, b) => a - b),
      Array.from({ length: maxChapters }, (_, index) => index + 1),
      `${item.book} shape should not skip chapters`,
    );
  }
});

test("the Leviticus briefing keeps ritual status, moral judgment, and later reception distinct", () => {
  assert.ok(leviticusBriefing, "Leviticus needs a source-backed book briefing");
  const serialized = JSON.stringify(leviticusBriefing);

  assert.match(serialized, /ritual impurity/i);
  assert.match(serialized, /moral guilt|moral blame/i);
  assert.match(serialized, /Mosaic/i);
  assert.match(serialized, /Priestly/i);
  assert.match(serialized, /Azazel/i);
  assert.match(serialized, /resident alien/i);
  assert.match(serialized, /Jewish tradition|Jewish study|Jewish practice/i);
  assert.match(serialized, /Christian interpretation|later reception/i);
  assert.doesNotMatch(serialized, /Leviticus was a public-health code|dietary laws prevented disease/i);
  assert.equal(leviticusBriefing.shape.at(-1)?.chapters, "27");
});

test("the Mark briefing preserves the colloquial nuance that prompted the language model", () => {
  const markup = renderToStaticMarkup(
    <BookBriefingView briefing={briefing} baseHref="/scriptures/protestant/MRK" />,
  );
  const text = JSDOM.fragment(markup).textContent ?? "";

  assert.match(text, /Koine Greek/);
  assert.match(text, /Aramaic/);
  assert.match(text, /World English Bible/);
  assert.match(text, /How this language moves/);
  assert.match(text, /euthys/);
  assert.match(text, /then\/next/);
  assert.match(text, /common people talked this way/i);
});

test("all Mark guide references resolve and key quotations come from the hosted text", () => {
  for (let chapter = 1; chapter <= mark.chapters.length; chapter += 1) {
    const guide = readJson<ChapterGuide>(`public/scriptures/guides/MRK/${chapter}.json`);

    assert.equal(guide.chapter, chapter);
    assert.doesNotMatch(guide.summary, /continues the story of/i);

    for (const keyVerse of guide.keyVerses) {
      const hostedVerse = verseAt(mark, keyVerse.ref);
      assert.ok(hostedVerse, `${keyVerse.ref} should resolve in the hosted Mark text`);
      assert.ok(
        normalizeQuote(hostedVerse).includes(normalizeQuote(keyVerse.text)),
        `${keyVerse.ref} should quote the hosted text without paraphrase`,
      );
    }

    for (const question of guide.questions) {
      for (const ref of question.verseRefs ?? []) {
        assert.ok(verseAt(mark, ref), `${ref} should resolve in the hosted Mark text`);
      }
    }
  }
});

test("the Matthew briefing explains the Gospel's own Greek habits and cautions", () => {
  const markup = renderToStaticMarkup(
    <BookBriefingView briefing={matthewBriefing} baseHref="/scriptures/protestant/MAT" />,
  );
  const text = JSDOM.fragment(markup).textContent ?? "";

  assert.match(text, /basileia tōn ouranōn/);
  assert.match(text, /plērōthē/);
  assert.match(text, /oligopistoi/);
  assert.match(text, /Five discourse endings/);
  assert.match(text, /secret theological code/i);
  assert.match(JSON.stringify(matthewBriefing), /anti-Judaism|antisemitism/i);
});

test("all 28 Matthew guides are authored, language-specific, and quote the hosted text", () => {
  assert.equal(matthew.chapters.length, 28);

  for (let chapter = 1; chapter <= matthew.chapters.length; chapter += 1) {
    const guide = readJson<ChapterGuide>(`public/scriptures/guides/MAT/${chapter}.json`);

    assert.equal(guide.book, "MAT");
    assert.equal(guide.chapter, chapter);
    assert.doesNotMatch(guide.summary, /continues the story of|starting with|what is happening in/i);
    assert.ok(guide.outline.length >= 3, `Matthew ${chapter} needs a real outline`);
    assert.ok(guide.questions.length >= 7, `Matthew ${chapter} needs deep questions`);
    assert.ok(
      guide.questions.some((question) => question.category === "word"),
      `Matthew ${chapter} needs chapter-specific language context`,
    );

    for (const keyVerse of guide.keyVerses) {
      const hostedVerse = verseAt(matthew, keyVerse.ref);
      assert.ok(hostedVerse, `${keyVerse.ref} should resolve in the hosted Matthew text`);
      assert.ok(
        normalizeQuote(hostedVerse).includes(normalizeQuote(keyVerse.text)),
        `${keyVerse.ref} should quote the hosted text without paraphrase`,
      );
    }

    for (const question of guide.questions) {
      for (const ref of question.verseRefs ?? []) {
        assert.ok(verseAt(matthew, ref), `${ref} should resolve in the hosted Matthew text`);
      }
    }
  }
});

test("the Luke briefing explains its register changes, repeated words, and interpretive cautions", () => {
  const markup = renderToStaticMarkup(
    <BookBriefingView briefing={lukeBriefing} baseHref="/scriptures/protestant/LUK" />,
  );
  const text = JSDOM.fragment(markup).textContent ?? "";

  assert.match(text, /kai egeneto/i);
  assert.match(text, /dei/);
  assert.match(text, /sēmeron/);
  assert.match(text, /sōzō \/ sōtēria \/ sōtēr/);
  assert.match(text, /formal Greek preface/i);
  assert.match(text, /biblical cadence/i);
  assert.match(JSON.stringify(lukeBriefing), /anti-Judaism|antisemitism/i);
});

test("all 24 Luke guides are authored, language-specific, and quote the hosted text", () => {
  assert.equal(luke.chapters.length, 24);

  for (let chapter = 1; chapter <= luke.chapters.length; chapter += 1) {
    const guide = readJson<ChapterGuide>(`public/scriptures/guides/LUK/${chapter}.json`);

    assert.equal(guide.book, "LUK");
    assert.equal(guide.chapter, chapter);
    assert.doesNotMatch(guide.summary, /continues the story of|starting with|what is happening in/i);
    assert.ok(guide.outline.length >= 3, `Luke ${chapter} needs a real outline`);
    assert.ok(guide.questions.length >= 7, `Luke ${chapter} needs deep questions`);
    assert.ok(
      guide.questions.some((question) => question.category === "word"),
      `Luke ${chapter} needs chapter-specific language context`,
    );

    for (const keyVerse of guide.keyVerses) {
      const hostedVerse = verseAt(luke, keyVerse.ref);
      assert.ok(hostedVerse, `${keyVerse.ref} should resolve in the hosted Luke text`);
      assert.ok(
        normalizeQuote(hostedVerse).includes(normalizeQuote(keyVerse.text)),
        `${keyVerse.ref} should quote the hosted text without paraphrase`,
      );
    }

    for (const question of guide.questions) {
      for (const ref of question.verseRefs ?? []) {
        assert.ok(verseAt(luke, ref), `${ref} should resolve in the hosted Luke text`);
      }
    }
  }
});

test("the Acts briefing explains its repeated language, speech craft, and interpretive cautions", () => {
  const markup = renderToStaticMarkup(
    <BookBriefingView briefing={actsBriefing} baseHref="/scriptures/protestant/ACT" />,
  );
  const text = JSDOM.fragment(markup).textContent ?? "";

  assert.match(text, /pneuma/i);
  assert.match(text, /martys \/ martyreō \/ diamartyromai/i);
  assert.match(text, /parrēsia/i);
  assert.match(text, /the Way/i);
  assert.match(text, /speeches repeat one message without sounding identical/i);
  assert.match(text, /Codex Bezae/i);
  assert.match(JSON.stringify(actsBriefing), /anti-Judaism|antisemitism/i);
});

test("all 28 Acts guides are authored, language-specific, and quote the hosted text", () => {
  assert.equal(acts.chapters.length, 28);

  for (let chapter = 1; chapter <= acts.chapters.length; chapter += 1) {
    const guide = readJson<ChapterGuide>(`public/scriptures/guides/ACT/${chapter}.json`);

    assert.equal(guide.book, "ACT");
    assert.equal(guide.chapter, chapter);
    assert.doesNotMatch(guide.summary, /continues the story of|starting with|what is happening in/i);
    assert.ok(guide.outline.length >= 3, `Acts ${chapter} needs a real outline`);
    assert.ok(guide.questions.length >= 7, `Acts ${chapter} needs deep questions`);
    assert.ok(
      guide.questions.some((question) => question.category === "word"),
      `Acts ${chapter} needs chapter-specific language context`,
    );

    for (const keyVerse of guide.keyVerses) {
      const hostedVerse = verseAt(acts, keyVerse.ref);
      assert.ok(hostedVerse, `${keyVerse.ref} should resolve in the hosted Acts text`);
      assert.ok(
        normalizeQuote(hostedVerse).includes(normalizeQuote(keyVerse.text)),
        `${keyVerse.ref} should quote the hosted text without paraphrase`,
      );
    }

    for (const question of guide.questions) {
      for (const ref of question.verseRefs ?? []) {
        assert.ok(verseAt(acts, ref), `${ref} should resolve in the hosted Acts text`);
      }
    }
  }
});

test("the John briefing explains its verbal texture, early witnesses, and interpretive cautions", () => {
  const markup = renderToStaticMarkup(
    <BookBriefingView briefing={johnBriefing} baseHref="/scriptures/protestant/JHN" />,
  );
  const text = JSDOM.fragment(markup).textContent ?? "";
  const serialized = JSON.stringify(johnBriefing);

  assert.match(text, /pisteuō/i);
  assert.match(text, /no occurrence of the noun pistis/i);
  assert.match(text, /menō/i);
  assert.match(text, /Ioudaioi/i);
  assert.match(serialized, /P52/);
  assert.match(serialized, /P66/);
  assert.match(serialized, /P75/);
  assert.match(serialized, /anti-Judaism|antisemitism|anti-Jewish/i);
});

test("all 21 John guides are authored, language-specific, and quote the hosted text", () => {
  assert.equal(john.chapters.length, 21);

  for (let chapter = 1; chapter <= john.chapters.length; chapter += 1) {
    const guide = readJson<ChapterGuide>(`public/scriptures/guides/JHN/${chapter}.json`);

    assert.equal(guide.book, "JHN");
    assert.equal(guide.chapter, chapter);
    assert.doesNotMatch(guide.summary, /continues the story of|starting with|what is happening in/i);
    assert.ok(guide.outline.length >= 3, `John ${chapter} needs a real outline`);
    assert.ok(guide.questions.length >= 7, `John ${chapter} needs deep questions`);
    assert.ok(
      guide.questions.some((question) => question.category === "word"),
      `John ${chapter} needs chapter-specific language context`,
    );

    for (const keyVerse of guide.keyVerses) {
      const hostedVerse = verseAt(john, keyVerse.ref);
      assert.ok(hostedVerse, `${keyVerse.ref} should resolve in the hosted John text`);
      assert.ok(
        normalizeQuote(hostedVerse).includes(normalizeQuote(keyVerse.text)),
        `${keyVerse.ref} should quote the hosted text without paraphrase`,
      );
    }

    for (const question of guide.questions) {
      for (const ref of question.verseRefs ?? []) {
        assert.ok(verseAt(john, ref), `${ref} should resolve in the hosted John text`);
      }
    }
  }
});

test("chapter guides link chapter-qualified references to the referenced verse", () => {
  const guide = readJson<ChapterGuide>("public/scriptures/guides/MAT/13.json");
  const markup = renderToStaticMarkup(
    <ChapterGuideView
      guide={guide}
      bookName="Matthew"
      chapter={13}
      baseHref="/scriptures/protestant/MAT"
      open
    />,
  );
  const fragment = JSDOM.fragment(markup);

  assert.equal(
    fragment.querySelector('a[href="/scriptures/protestant/MAT/13#v11"]')?.textContent,
    "13:11",
  );
  assert.equal(
    fragment.querySelector('a[href="/scriptures/protestant/MAT/13#v23"]')?.textContent,
    "13:23",
  );
  assert.equal(
    fragment.querySelector('a[href="/scriptures/protestant/MAT/13#v52"]')?.textContent,
    "13:52",
  );

  const crossChapterMarkup = renderToStaticMarkup(
    <ChapterGuideView
      guide={{
        ...guide,
        keyVerses: [{ ...guide.keyVerses[0], ref: "14:1" }],
      }}
      bookName="Matthew"
      chapter={13}
      baseHref="/scriptures/protestant/MAT"
      open
    />,
  );
  const crossChapterFragment = JSDOM.fragment(crossChapterMarkup);

  assert.equal(
    crossChapterFragment.querySelector('a[href="/scriptures/protestant/MAT/14#v1"]')?.textContent,
    "14:1",
  );
});

test("chapter guides return readers to the book briefing without promising unpublished work", () => {
  const published = JSDOM.fragment(
    renderToStaticMarkup(
      <ChapterGuideView
        guide={briefing ? readJson<ChapterGuide>("public/scriptures/guides/MRK/1.json") : null}
        bookName="Mark"
        chapter={1}
        baseHref="/scriptures/protestant/MRK"
        open
      />,
    ),
  );
  assert.equal(
    published.querySelector('a[href="/scriptures/protestant/MRK"]')?.textContent,
    "Book briefing",
  );

  const unpublishedMarkup = renderToStaticMarkup(
    <ChapterGuideView
      guide={null}
      bookName="Leviticus"
      chapter={1}
      baseHref="/scriptures/protestant/LEV"
    />,
  );
  assert.doesNotMatch(unpublishedMarkup, /being generated|check back soon/i);
  const unpublished = JSDOM.fragment(unpublishedMarkup);
  assert.equal(
    unpublished.querySelector('a[href="/scriptures/protestant/LEV"]')?.textContent,
    "Book overview",
  );
});

test("guide-v2 review and provenance are visible without implying human approval", () => {
  const guide = readJson<ChapterGuide>("public/scriptures/guides/LEV/1.json");
  const markup = renderToStaticMarkup(
    <ChapterGuideView
      guide={guide}
      bookName="Leviticus"
      chapter={1}
      baseHref="/scriptures/protestant/LEV"
      open
    />,
  );
  const fragment = JSDOM.fragment(markup);
  const text = fragment.textContent ?? "";

  assert.match(text, /Agent-reviewed/);
  assert.doesNotMatch(text, /Human-reviewed/);
  assert.match(text, /guide-v2/);
  assert.match(text, /canonical grounding reviewed/);
  assert.equal(
    fragment.querySelector('a[href="/scriptures/guides/LEV/1.json"]')?.textContent,
    "Open guide record",
  );

  const unreviewedGuide = structuredClone(guide);
  delete unreviewedGuide.reviewStatus;
  delete unreviewedGuide.reviewedAt;
  delete unreviewedGuide.reviewer;
  delete unreviewedGuide.sourceIds;
  const unreviewedText = JSDOM.fragment(
    renderToStaticMarkup(
      <ChapterGuideView
        guide={unreviewedGuide}
        bookName="Leviticus"
        chapter={1}
        baseHref="/scriptures/protestant/LEV"
        open
      />,
    ),
  ).textContent;
  assert.match(unreviewedText ?? "", /No editorial review record/);
});
