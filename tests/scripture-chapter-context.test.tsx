import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import ChapterContext from "../src/app/scriptures/[tradition]/[book]/[chapter]/ChapterContext";
import GuideEvidence from "../src/app/scriptures/[tradition]/[book]/[chapter]/GuideEvidence";
import { contextTextHash, validateGuideContext } from "../scripts/scriptures/guide-context-validation.mjs";
import { prepareTarget } from "../scripts/scriptures/build-guides-v2.mjs";
import { validateGuideV2 } from "../scripts/scriptures/guide-validation.mjs";
import type { BookBriefing, BookText, Canons, ChapterGuide } from "../src/lib/scriptures/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const read = <T,>(file: string): T => JSON.parse(readFileSync(file, "utf8"));
const text = read<BookText>("public/scriptures/text/charles/JUB.json");
const canons = read<Canons>("public/scriptures/canons.json");
const briefing = read<BookBriefing>("public/scriptures/books/JUB.json");
const guideAt = (chapter: number) => read<ChapterGuide>(`public/scriptures/guides/JUB/${chapter}.json`);

for (const [book, translation] of [["JUB", "charles"], ["GEN", "web"], ["EXO", "web"], ["LEV", "web"]] as const) {
  test(`every ${book} chapter has a grounded guide and edition-bound reading context`, () => {
    const bookText = read<BookText>(`public/scriptures/text/${translation}/${book}.json`);
    for (let chapter = 1; chapter <= bookText.chapters.length; chapter++) {
      const guide = read<ChapterGuide>(`public/scriptures/guides/${book}/${chapter}.json`);
      const prepared = prepareTarget(book, chapter);
      const result = validateGuideV2({ guide, root: process.cwd(), canons, book, chapter, expectedPromptHash: prepared.promptHash });
      assert.deepEqual(result.failures, [], `${book} ${chapter}`);
      assert.ok(guide.readingContext, `${book} ${chapter} needs continuity notes`);
      assert.equal(guide.readingContextSource?.translation, translation);
      assert.equal(guide.reviewStatus, "agent-reviewed");
      assert.ok(guide.sourceIds?.includes(translation));
    }
  });
}

test("continuity citations reject absent chapters, wrong chapter focus, and invented sources", () => {
  const guide = structuredClone(guideAt(1));
  guide.readingContext!.after.verseRefs = ["51:1"];
  guide.readingContext!.here.verseRefs = ["2:1"];
  guide.questions[0].evidenceSourceIds = ["nonexistent-witness"];
  const failures = validateGuideContext({ guide, text, briefing });
  assert.ok(failures.some((value: string) => value.includes("51:1")));
  assert.ok(failures.some((value: string) => value.includes("here") && value.includes("2:1")));
  assert.ok(failures.some((value: string) => value.includes("book-briefing sources")));
});

test("changing an adjacent chapter invalidates the continuity source binding", () => {
  const guide = guideAt(1);
  const changed = structuredClone(text);
  changed.chapters[1][0] += " changed";
  assert.notEqual(contextTextHash(changed), contextTextHash(text));
  assert.ok(validateGuideContext({ guide, text: changed, briefing }).some((value: string) => value.includes("complete hosted edition")));
});

test("before and after references preserve narrative order and allow book boundaries", () => {
  const first = structuredClone(guideAt(1));
  first.readingContext!.before.verseRefs = ["50:1"];
  assert.ok(validateGuideContext({ guide: first, text, briefing }).some((value: string) => value.includes("before") && value.includes("50:1")));
  const last = structuredClone(guideAt(50));
  last.readingContext!.after.verseRefs = ["1:1"];
  assert.ok(validateGuideContext({ guide: last, text, briefing }).some((value: string) => value.includes("after") && value.includes("1:1")));
  assert.deepEqual(validateGuideContext({ guide: guideAt(1), text, briefing }), []);
  assert.deepEqual(validateGuideContext({ guide: guideAt(50), text, briefing }), []);
});

test("Jubilees grounding names Charles and supports a book without TSK references", () => {
  const prepared = prepareTarget("JUB", 1);
  assert.match(prepared.prompt, /hosted CHARLES lines/);
  assert.doesNotMatch(prepared.prompt, /hosted WEB lines/);
  assert.deepEqual(prepared.grounding.treasuryOfScriptureKnowledge, {});
});

test("reading context exposes focus, adjacent verse links, and editorial labeling before expansion", () => {
  const guide = guideAt(1);
  const fragment = JSDOM.fragment(renderToStaticMarkup(
    <ChapterContext guide={guide} bookName="Jubilees" baseHref="/scriptures/ethiopian/JUB" sources={briefing.sources} editionName="R. H. Charles translations" />,
  ));
  assert.equal(fragment.querySelector("h2")?.textContent, "Before you read");
  assert.ok(fragment.textContent?.includes(guide.readingContext!.here.text));
  assert.ok(fragment.textContent?.includes("Editorial context"));
  assert.ok(fragment.textContent?.includes("References use R. H. Charles translations."));
  assert.ok(fragment.querySelector('a[href^="/scriptures/ethiopian/JUB/2?t=charles#v"]'));
  assert.equal(fragment.querySelector("details")?.hasAttribute("open"), false);
  assert.ok(fragment.querySelector('a[href="/scriptures/ethiopian/JUB"]'));
  assert.equal(renderToStaticMarkup(<ChapterContext guide={null} bookName="Jubilees" baseHref="/scriptures/ethiopian/JUB" />), "");
});

test("chapter evidence links resolve book sources and do not relabel Scripture refs as external evidence", () => {
  const source = briefing.sources!.find((item) => item.url)!;
  assert.ok(source);
  const fragment = JSDOM.fragment(renderToStaticMarkup(<GuideEvidence sourceIds={[source.id]} sources={briefing.sources!} />));
  assert.equal(fragment.querySelector("a")?.getAttribute("href"), source.url);
  assert.equal(fragment.querySelector("a")?.textContent, source.label);
  assert.equal(fragment.querySelector("a")?.getAttribute("rel"), "noopener noreferrer");
});
