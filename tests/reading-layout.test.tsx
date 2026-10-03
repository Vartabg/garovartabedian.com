import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { formatReadingText, sliceReadingRuns } from "../src/lib/reading-layout";
import FormattedText from "../src/app/_components/reading/FormattedText";
import { auditReadingLayout } from "../scripts/reading/audit-layout";

const long = "A sentence offering enough context to follow the passage without changing any of the words. ".repeat(30);
const parts = (text: string) => formatReadingText(text).flatMap(b => b.fragments);

test("all downloaded hosted prose round-trips, keeps note markers and preserves contiguous source offsets", () => {
  const audit = auditReadingLayout();
  assert.equal(audit.early.works, 23);
  assert.equal(audit.library.editions, 102);
  assert.equal(audit.library.sections, 5099);
  assert.equal(audit.library.sourceBlocks, 45649);
  assert.equal(audit.scripture.verses, 136321);
  assert.ok(audit.early.editorialBreaks > 100);
  assert.ok(audit.library.editorialBreaks > 1000);
});

test("sentence boundaries cannot split an attached footnote's opening bracket", () => {
  for (const punctuation of [".", "!"]) {
    const text = `An opening ${"word ".repeat(110)}ends here${punctuation}[^n432] ${long}`;
    const fragments = parts(text);
    assert.equal(fragments.map(p => p.text).join(""), text);
    assert.ok(fragments.some(p => p.text.includes("[^n432]")));
    assert.ok(fragments.every(p => !p.text.endsWith("[^n432") && !p.text.endsWith("[")));
  }
});

test("Clement 16 separates its two marked quotations and retains exact wording and punctuation", () => {
  const text = JSON.parse(readFileSync("public/early/texts/1clement.json", "utf8")).sections[15].paragraphs[0];
  const blocks = formatReadingText(text);
  const quotes = blocks.filter(b => b.kind === "quotation");
  assert.equal(quotes.length, 2);
  assert.ok(quotes[0].fragments.length > 2);
  assert.match(quotes[0].fragments[0].text, /^“Lord, who hath believed/);
  assert.match(quotes[1].fragments[0].text, /^“I am a worm/);
  assert.equal(blocks.flatMap(b => b.fragments).map(p => p.text).join(""), text);
});

test("supplied poetry, blank lines, fragment brackets and right-to-left text survive unchanged", () => {
  const text = "First line\nSecond line\n\n[Missing leaf]\n\nLast line\r\nAnd its continuation.";
  const fragments = parts(text);
  assert.equal(fragments.length, 3);
  assert.equal(fragments.map(p => p.text).join(""), text);
  assert.ok(fragments.every(p => p.boundary === "source"));
  assert.equal(formatReadingText(long, { language: "he" })[0].fragments.length, 1);
  const html = renderToStaticMarkup(<FormattedText text="בְּרֵאשִׁית בָּרָא" anchor="hebrew" language="he" />);
  assert.match(html, /dir="auto"/);
});

test("reading breaks are sentence-based and explicitly editorial; long sentences are never chopped", () => {
  const fragments = parts(long);
  assert.ok(fragments.length > 2);
  assert.ok(fragments.slice(1).every(p => p.boundary === "editorial"));
  assert.ok(fragments.slice(0, -1).every(p => /\.\s*$/.test(p.text)));
  const sentence = "word ".repeat(1000) + ".";
  assert.equal(parts(sentence).length, 1);
  const withInitial = "word ".repeat(140) + "Dr. J. B. Lightfoot reads this sentence. " + long;
  assert.ok(parts(withInitial).some(p => p.text.includes("Dr. J. B. Lightfoot")));
});

test("unbalanced or short quotes remain inline, complete quotes keep their attached citation", () => {
  assert.ok(formatReadingText(`He said “${long}`).every(b => b.kind === "prose"));
  assert.ok(formatReadingText(`An ambiguous ” sign. “${long}”`).every(b => b.kind === "prose"));
  assert.ok(formatReadingText('A “brief phrase” and a "name".').every(b => b.kind === "prose"));
  assert.ok(formatReadingText(`[“${long}”]`).every(b => b.kind === "prose"));
  for (const marks of [["“", "”"], ['"', '"']]) {
    const blocks = formatReadingText(`Introduction. ${marks[0]}${long}${marks[1]}[^note] Conclusion.`);
    const quote = blocks.find(b => b.kind === "quotation")!;
    assert.match(quote.fragments.at(-1)!.text, /\[\^note\]$/);
  }
});

test("rich text slicing preserves glossary metadata and exact text, including Unicode", () => {
  const runs = ["Alpha 🕊 ", { text: "Clement", entry: "existing glossary" }, " Omega"];
  assert.deepEqual(sliceReadingRuns(runs, 9, 16), [{ text: "Clement", entry: "existing glossary" }]);
  const text = runs.map(r => typeof r === "string" ? r : r.text).join("");
  assert.equal(sliceReadingRuns(runs, 0, text.length).map(r => typeof r === "string" ? r : r.text).join(""), text);
});

test("HTML is valid, escapes hostile text, labels quotation roles and preserves fragment anchors without JavaScript", () => {
  const text = `<script>alert('x')</script> “${long}”`;
  const html = renderToStaticMarkup(<FormattedText text={text} anchor="p1" commentary />);
  const doc = new JSDOM(html).window.document;
  assert.equal(doc.querySelectorAll("script, p p, p blockquote").length, 0);
  assert.ok(doc.querySelector('[data-reading-role="interpretation"]'));
  assert.match(doc.querySelector(".reading-quotation-label")!.textContent!, /edition commentary/);
  assert.equal([...doc.querySelectorAll("[data-reading-fragment]")].map(p => p.textContent).join(""), text);
  assert.ok(doc.getElementById("p1-r0"));
  const note = new JSDOM(renderToStaticMarkup(<FormattedText text="Edition note body." anchor="note-a" sourceOffset={7} commentary />)).window.document;
  assert.equal(note.getElementById("note-a-r7")?.getAttribute("data-reading-fragment"), "7");
});
