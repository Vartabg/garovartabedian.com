import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import canonsData from "../public/scriptures/canons.json" with { type: "json" };
import BookList from "../src/app/scriptures/_components/BookList";
import Shelf from "../src/app/scriptures/[tradition]/Shelf";
import CanonsMatrix from "../src/app/scriptures/_components/CanonsMatrix";
import { hostedBookEdition, hostedEditions, hostedChapterSummary } from "../src/lib/scriptures/edition-counts";
import type { Canons } from "../src/lib/scriptures/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const canons = canonsData as Canons;

test("book navigation uses the edition it opens instead of a cross-edition maximum", () => {
  const expected = { EZR: [10, 23], EST: [10, 16], PSA: [150, 151], DAN: [12, 14], JOL: [3, 4] };
  for (const [book, [web, alternate]] of Object.entries(expected)) {
    assert.equal(hostedBookEdition(book, ["web"])?.chapters, web, `${book} WEB`);
    assert.equal(Math.max(...hostedEditions(book).map(edition => edition.chapters)), alternate, `${book} maximum hosted edition`);
  }
  assert.equal(hostedBookEdition("EST", ["drb", "web"])?.chapters, 16);
  assert.equal(hostedBookEdition("DAN", ["drb", "web"])?.chapters, 14);
  assert.equal(hostedBookEdition("JOL", ["brenton", "web"])?.chapters, 4);
});

test("a tradition list names the hosted edition next to its chapter count", () => {
  for (const [id, count, edition] of [["protestant", 10, "World English Bible"], ["orthodox", 23, "Brenton"]] as const) {
    const tradition = canons.traditions.find(item => item.id === id)!;
    const markup = renderToStaticMarkup(<BookList tradition={tradition} canons={canons} />);
    const ezra = markup.match(new RegExp(`<a href="/scriptures/${id}/EZR">([\\s\\S]*?)</a>`))?.[1];
    assert.ok(ezra, `${id} Ezra link exists`);
    assert.match(ezra, new RegExp(`${count} chapters`));
    assert.match(ezra, new RegExp(edition));
  }
});

test("edition summaries are explicitly hosted counts, including differing chapter divisions", () => {
  assert.equal(hostedChapterSummary(hostedEditions("EZR")), "10–23 hosted chapters");
  assert.equal(hostedChapterSummary(hostedEditions("EST")), "10–16 hosted chapters");
  assert.equal(hostedChapterSummary(hostedEditions("JHN")), "21 hosted chapters");
  assert.equal(hostedChapterSummary(hostedEditions("OBA")), "1 hosted chapter");
  assert.deepEqual(hostedEditions("UNKNOWN"), []);
  assert.equal(hostedBookEdition("UNKNOWN", ["web"]), null);
});

test("the visual shelf names the edition used for its counts without inventing missing lengths", () => {
  const tradition = canons.traditions.find(item => item.id === "protestant")!;
  const markup = renderToStaticMarkup(<Shelf tradition={tradition} canons={canons} />);
  assert.match(markup, /aria-label="Ezra, 10 chapters in World English Bible/);
  assert.match(markup, /numbered verse positions/);
  assert.doesNotMatch(markup, /real length|Shelving the books/);
});

test("canon filters count hosted records while chapter ranges identify edition differences", () => {
  const markup = renderToStaticMarkup(<CanonsMatrix />);
  assert.match(markup, /Jewish Tanakh \(39 hosted entries\)/);
  assert.match(markup, /Ethiopian Tewahedo \(82 hosted entries\)/);
  assert.match(markup, /Traditional book totals use each tradition/);
  assert.match(markup, /10–23 hosted chapters/);
  assert.match(markup, /150–151 hosted chapters/);
});

test("book metadata fallback uses the same named edition as its chapter grid", async () => {
  const { generateMetadata } = await import("../src/app/scriptures/[tradition]/[book]/page");
  const metadata = await generateMetadata({ params: Promise.resolve({ tradition: "protestant", book: "EZR" }) });
  assert.match(metadata.description ?? "", /10 chapters in World English Bible/);
  assert.doesNotMatch(metadata.description ?? "", /23 chapters/);
});
