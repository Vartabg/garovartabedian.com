import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import BookChaptersPage from "../src/app/scriptures/[tradition]/[book]/page";
import TraditionBooks from "../src/app/scriptures/[tradition]/page";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

/**
 * A book page is how a reader reaches a chapter, and a tradition page is how a
 * reader reaches a book. Both briefings grew long enough to bury the list
 * beneath them — John's chapter grid sat eleven screens down — so the list
 * leads and the briefing follows.
 */
const position = (markup: string, needle: string) => {
  const index = markup.indexOf(needle);
  assert.notEqual(index, -1, `expected the page to contain ${needle}`);
  return index;
};

test("a book page puts its chapters above its briefing", async () => {
  const markup = renderToStaticMarkup(
    await BookChaptersPage({
      params: Promise.resolve({ tradition: "protestant", book: "JHN" }),
    }),
  );

  const thesis = position(markup, "scr-brief-oneline");
  const firstChapter = position(markup, 'href="/scriptures/protestant/JHN/1"');
  const lastChapter = position(markup, 'href="/scriptures/protestant/JHN/21"');

  assert.ok(thesis < firstChapter, "the one-line thesis introduces the chapters");
  for (const heading of [
    "Where you are when this opens",
    "The language beneath the English",
    "What this book is driving at",
    "When you finish",
  ]) {
    assert.ok(
      lastChapter < position(markup, heading),
      `every chapter comes before “${heading}”`,
    );
  }
});

test("a tradition page puts its books above its briefing", async () => {
  const markup = renderToStaticMarkup(
    await TraditionBooks({
      params: Promise.resolve({ tradition: "protestant" }),
    }),
  );

  const thesis = position(markup, "scr-trad-oneline");
  const bookList = position(markup, "scr-book-list");
  const lastBook = position(markup, 'href="/scriptures/protestant/REV"');

  assert.ok(thesis < bookList, "the one-line thesis introduces the shelf");
  for (const heading of [
    "Before you count books",
    "How this shelf took shape",
    "How this tradition receives Scripture",
  ]) {
    assert.ok(
      lastBook < position(markup, heading),
      `every book comes before “${heading}”`,
    );
  }
});

test("Joel's chapter grid follows the tradition's default edition", async () => {
  for (const [tradition, count] of [["protestant", 3], ["catholic", 3], ["orthodox", 4]] as const) {
    const markup = renderToStaticMarkup(
      await BookChaptersPage({
        params: Promise.resolve({ tradition, book: "JOL" }),
      }),
    );
    const document = JSDOM.fragment(markup);
    const links = [...document.querySelectorAll(".scr-chapter-cell")];
    assert.deepEqual(
      links.map((link) => link.getAttribute("href")),
      Array.from({ length: count }, (_, index) => `/scriptures/${tradition}/JOL/${index + 1}`),
    );
    assert.equal(
      Boolean(document.querySelector(".scr-shape")),
      count === 3,
      "the WEB briefing groups only the matching three-chapter grid",
    );
  }
});
