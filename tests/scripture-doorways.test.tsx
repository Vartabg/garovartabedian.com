import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import committed from "../public/scriptures/doorways.json" with { type: "json" };
import { buildDoorways } from "../scripts/scriptures/build-doorways.mjs";
import Doorways from "../src/app/scriptures/_components/doorways/Doorways";
import ScripturesHome from "../src/app/scriptures/page";
import { scriptureStudyCatalog } from "../src/lib/scriptures/study-catalog";
import {
  chapterVerses,
  parseReference,
  readerHref,
  sectioned,
  stripLayout,
  suggestReferences,
  translationFor,
  type DoorwaysData,
} from "../src/lib/scriptures/doorways";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const data = committed as DoorwaysData;

test("the committed picker data matches what the sources produce", () => {
  // A stale file fails here rather than drawing books the site no longer hosts.
  assert.deepEqual(committed, buildDoorways());
});

test("every tradition's books land in exactly one section, in that tradition's order", () => {
  for (const tradition of data.traditions) {
    const groups = sectioned(data, tradition.id);
    const placed = groups.flatMap((g) => g.books);
    assert.deepEqual([...placed].sort(), [...tradition.books].sort(), tradition.id);
    assert.equal(new Set(placed).size, placed.length, `${tradition.id} places a book twice`);
    assert.equal(groups.find((g) => g.section === "twelve")?.books.length, 12, `${tradition.id} minor prophets`);
    for (const g of groups) {
      const order = g.books.map((id) => tradition.books.indexOf(id));
      assert.deepEqual(order, [...order].sort((a, b) => a - b), `${tradition.id} ${g.section} order`);
    }
  }
  // Douay-Rheims puts Maccabees after Malachi; the picker files them with history.
  const catholic = sectioned(data, "catholic");
  assert.ok(catholic.find((g) => g.section === "history")?.books.includes("1MA"));
});

test("chapters follow the translation that will open", () => {
  assert.equal(chapterVerses(data, "PSA", "web").length, 150);
  assert.equal(chapterVerses(data, "PSA", "brenton").length, 151);
  assert.equal(chapterVerses(data, "DAN", "web").length, 12);
  assert.equal(chapterVerses(data, "DAN", "drb").length, 14);
  // A book the chosen translation lacks opens in one that carries it.
  assert.equal(translationFor(data, "ENO", "web"), data.books.ENO.translations[0]);
  assert.equal(readerHref("protestant", "JHN", 3, "web", 16), "/scriptures/protestant/JHN/3?t=web#v16");
});

test("the Go-to box reads references and offers a word search for anything else", () => {
  assert.deepEqual(parseReference("1co13:4"), { book: "1co", chapter: 13, verse: 4 });
  const first = (q: string) => suggestReferences(data, "protestant", "web", q)[0];

  const john = first("jn 3:16");
  assert.ok(john.kind === "reference");
  assert.deepEqual([john.bookId, john.chapter, john.verse], ["JHN", 3, 16]);
  assert.equal(first("ps 119").label, "Psalms 119");
  assert.equal(first("1 cor 13").label, "1 Corinthians 13");
  // A one-chapter book opens straight to its chapter.
  const obadiah = first("obad");
  assert.ok(obadiah.kind === "reference" && obadiah.chapter === 1);
  // A chapter past the end says how many there are instead of guessing.
  const tooFar = first("john 30");
  assert.ok(tooFar.kind === "reference" && tooFar.chapter === null && tooFar.detail === "has 21 chapters");

  const words = suggestReferences(data, "protestant", "web", "love your enemies");
  assert.equal(words.length, 1);
  assert.ok(words[0].kind === "search" && words[0].query === "love your enemies");
  assert.equal(suggestReferences(data, "protestant", "web", "jn 3").at(-1)?.kind, "search");
});

test("the map keeps book order and fills its box", () => {
  const items = [{ value: 5, id: "a" }, { value: 3, id: "b" }, { value: 1, id: "c" }, { value: 1, id: "d" }];
  const rects = stripLayout(items, 0, 0, 100, 50);
  assert.deepEqual(rects.map((r) => r.id), ["a", "b", "c", "d"]);
  assert.equal(Math.round(rects.reduce((sum, r) => sum + r.w * r.h, 0)), 5000);
  assert.deepEqual([rects[0].x, rects[0].y], [0, 0]);
});

test("the Scripture page opens on the picker, with nothing picked for the reader", () => {
  const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} };
  const markup = renderToStaticMarkup(
    <AppRouterContext.Provider value={router as never}>
      <ScripturesHome />
    </AppRouterContext.Provider>,
  );

  assert.match(markup, /<h1[^>]*>Read the Bible\.<\/h1>/);
  for (const gone of ["I want to", "Begin with John 1", "Enter by purpose", "Start with the text"]) {
    assert.ok(!markup.includes(gone), `the page still says “${gone}”`);
  }

  // Four ways to browse, the shelf first; every Protestant book is on it as a real link.
  const tabs = [...markup.matchAll(/<button[^>]*role="tab"[^>]*aria-selected="(true|false)"[^>]*>([^<]+)<\/button>/g)];
  assert.deepEqual(tabs.map((t) => t[2]), ["Shelf", "Contents", "Map", "Strip"]);
  assert.deepEqual(tabs.map((t) => t[1]), ["true", "false", "false", "false"]);
  const spines = [...markup.matchAll(/<a[^>]*href="\/scriptures\/protestant\/([A-Z0-9]{3})"[^>]*class="dw-spine/g)].map((m) => m[1]);
  assert.equal(spines.length, 66);
  assert.equal(spines[0], "GEN");

  // One box for references and words; without script it still searches.
  assert.match(markup, /<form[^>]*action="\/scriptures\/search"[^>]*>/);
  // Every study destination uses its canonical name and purpose.
  for (const tool of scriptureStudyCatalog().flatMap((group) => group.tools)) {
    assert.ok(markup.includes(`href="${tool.href}"`), `${tool.label} should be reachable`);
    const escapedLabel = tool.label.replace(/&/g, "&amp;");
    assert.ok(markup.includes(`<strong>${escapedLabel}</strong>`), `${tool.label} should keep its canonical name`);
  }
  assert.match(markup, /href="#read"/);
});

test("from a chapter, the picker opens at that chapter and keeps the reader's view in its links", () => {
  const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} };
  const markup = renderToStaticMarkup(
    <AppRouterContext.Provider value={router as never}>
      <Doorways
        data={data}
        start={{
          tradition: "protestant",
          translation: "web",
          book: "JHN",
          chapter: 3,
          chapterHref: (n) => `/scriptures/protestant/JHN/${n}?t=web&c=kjv`,
        }}
      />
    </AppRouterContext.Provider>,
  );

  assert.match(markup, /<a[^>]*href="\/scriptures\/protestant\/JHN"[^>]*aria-current="true"/);
  const john = [...markup.matchAll(/<a[^>]*class="dw-bar[^"]*"[^>]*>/g)].map((m) => m[0]);
  assert.equal(john.length, 21);
  // Every chapter of this book keeps the comparison the reader has open.
  assert.ok(john.every((a) => /href="\/scriptures\/protestant\/JHN\/\d+\?t=web&amp;c=kjv"/.test(a)));
  const here = john.filter((a) => a.includes('aria-current="page"'));
  assert.equal(here.length, 1);
  assert.match(here[0], /aria-label="John 3, 36 verses"/);
  // Only the page itself links views by address; the sheet leaves the reader's anchors alone.
  assert.match(markup, /role="tab"[^>]*aria-selected="true"[^>]*>Shelf</);
});
