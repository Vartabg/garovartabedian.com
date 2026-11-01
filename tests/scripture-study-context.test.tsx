import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseStudyContext, studyReaderHref, studyToolHref, type StudyContext } from "../src/lib/scriptures/study-context";
import { resolveStudyContext } from "../src/lib/scriptures/server/study-context";
import { getBookText, getOriginalChapter } from "../src/lib/scriptures/server";
import { loadStudyPassage } from "../src/lib/scriptures/study-passage";
import StudyContextBanner from "../src/app/scriptures/_components/StudyContextBanner";
import PolyglotPage from "../src/app/scriptures/polyglot/page";
import DossierPage from "../src/app/scriptures/dossier/page";
import { buildNotebookLMDossier, type NotebookLMDossier } from "../src/lib/site/notebooklm";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const params = { tradition: "protestant", book: "JHN", chapter: "3", verse: "16", translation: "kjv" };
const loaders = { book: getBookText, original: getOriginalChapter };
const context = parseStudyContext(params).context!;

function clientProps<T>(node: React.ReactNode, key: string): T | null {
  if (!React.isValidElement<Record<string, unknown>>(node)) return null;
  if (key in node.props) return node.props as T;
  for (const child of React.Children.toArray(node.props.children as React.ReactNode)) {
    const found = clientProps<T>(child, key);
    if (found) return found;
  }
  return null;
}

test("passage links retain exact canon, edition and verse through each tool", () => {
  const compare = studyToolHref("/scriptures/polyglot", context);
  const dossier = studyToolHref("/scriptures/dossier", parseStudyContext(new URL(compare, "https://example.test").searchParams).context!);
  const restored = parseStudyContext(new URL(dossier, "https://example.test").searchParams).context!;
  assert.deepEqual(restored, context);
  assert.equal(studyReaderHref(restored), "/scriptures/protestant/JHN/3?t=kjv#v16");
  assert.equal(parseStudyContext({ book: "JHN" }).context?.verse, 1);
  assert.equal(parseStudyContext({ book: "JHN" }).context?.chapter, 1);
  assert.deepEqual(parseStudyContext({}), { context: null, error: null });
  assert.throws(() => studyToolHref("https://example.test", context));
  assert.throws(() => studyToolHref("//example.test/scriptures/polyglot", context));
});

test("metadata validation respects actual edition chapter counts and rejects malformed context", () => {
  for (const invalid of [
    { ...params, book: "../../JHN" }, { ...params, tradition: "unknown" },
    { ...params, translation: "charles" }, { ...params, chapter: "3.5" },
    { ...params, verse: "0" }, { ...params, verse: "999" },
    { ...params, book: "EZR", chapter: "11", verse: "1", translation: "web" },
    { book: "JHN", verse: ["1", "16"] }, { chapter: "3" },
  ]) {
    const result = parseStudyContext(invalid);
    assert.equal(result.context, null);
    assert.ok(result.error);
  }
  assert.ok(parseStudyContext({ book: "EZR", chapter: "23", translation: "brenton" }).context);
});

test("server validation rejects an edition gap instead of substituting another verse", async () => {
  const result = await resolveStudyContext({ book: "LUK", chapter: "17", verse: "36", translation: "web" });
  assert.equal(result.context, null);
  assert.match(result.error ?? "", /no hosted text/);
  const valid = await resolveStudyContext(params);
  assert.match(valid.sourceText ?? "", /only begotten Son/);
});

test("comparison and dossier server pages initialize the requested John verse", async () => {
  const compare = clientProps<{ initialAligned: { number: number; kjvText?: string }[]; initialContext: StudyContext }>(
    await PolyglotPage({ searchParams: Promise.resolve(params) }), "initialAligned")!;
  assert.deepEqual(compare.initialContext, context);
  assert.equal(compare.initialAligned.length, 1);
  assert.equal(compare.initialAligned[0].number, 16);
  assert.match(compare.initialAligned[0].kjvText ?? "", /only begotten Son/);
  const dossier = clientProps<{ initialDossier: NotebookLMDossier; initialTarget: string; initialContext: StudyContext }>(
    await DossierPage({ searchParams: Promise.resolve(params) }), "initialDossier")!;
  assert.equal(dossier.initialTarget, "John 3:16");
  assert.deepEqual(dossier.initialContext, context);
  assert.match(dossier.initialDossier.markdown, /only begotten Son/);
  assert.ok(dossier.initialDossier.sourceWitnessCount > 0);
  const invalid = await PolyglotPage({ searchParams: Promise.resolve({ ...params, verse: "999" }) });
  assert.equal(clientProps(invalid, "initialAligned"), null);
});

test("historic Psalm contexts preserve the source reference and omit unverified mappings", async () => {
  const historic = parseStudyContext({ book: "PSA", chapter: "21", verse: "17", translation: "brenton" }).context!;
  const mapped = await loadStudyPassage(historic, loaders);
  assert.equal(mapped.chapter, 22);
  assert.equal(mapped.verse, 16);
  assert.match(mapped.sourceText, /pierced my hands and my feet/i);
  assert.match(mapped.aligned[0].webText ?? "", /pierced my hands and feet/i);
  assert.match(studyReaderHref(historic), /PSA\/21\?t=brenton#v17$/);
  const unmapped = await loadStudyPassage(parseStudyContext({ book: "PSA", chapter: "23", verse: "1", translation: "brenton" }).context!, loaders);
  assert.match(unmapped.note, /no verified cross-edition mapping/);
  assert.ok(unmapped.aligned[0].brentonText);
  assert.equal(unmapped.aligned[0].webText, undefined);
  assert.equal(unmapped.aligned[0].originalVerse, null);
  assert.equal(unmapped.includeReception, false);
});

test("Charles-only passages enter the dossier under their actual edition name", async () => {
  const resolved = await resolveStudyContext({ book: "ENO", chapter: "1", verse: "1", translation: "charles" });
  assert.ok(resolved.context);
  const loaded = await loadStudyPassage(resolved.context, loaders);
  assert.equal(loaded.aligned.length, 0);
  const dossier = buildNotebookLMDossier({ target: loaded.target, primaryVerses: loaded.primaryVerses, includeReception: false });
  assert.equal(dossier.sourceWitnessCount, 1);
  assert.match(dossier.markdown, /Charles/);
  assert.ok(dossier.markdown.includes(loaded.sourceText));
  assert.doesNotMatch(dossier.markdown, /\*\*World English Bible \(2020\)\*\*/);
  const markup = renderToStaticMarkup(<StudyContextBanner context={context} sourceText="Selected verse" />);
  assert.match(markup, /Build a research dossier/);
  assert.match(markup, /Return to reading/);
  assert.match(markup, /t=kjv#v16/);
});


test("unverified book numbering preserves the selected edition without aligning unrelated numeric references", async () => {
  const brentonJoel = await getBookText("brenton", "JOL"), webJoel = await getBookText("web", "JOL");
  assert.equal(brentonJoel?.chapters.length, 4);
  assert.equal(webJoel?.chapters.length, 3);
  assert.match(brentonJoel?.chapters[2][0] ?? "", /pour out of my Spirit/);
  assert.match(webJoel?.chapters[2][0] ?? "", /restore the fortunes/);
  for (const params of [
    { book: "JOL", chapter: "3", verse: "1", translation: "brenton" },
    { book: "JOL", chapter: "3", verse: "1", translation: "web" },
    { book: "EZR", chapter: "11", verse: "1", translation: "brenton" },
    { book: "EST", chapter: "11", verse: "1", translation: "drb" },
    { book: "DAN", chapter: "3", verse: "24", translation: "drb" },
  ]) {
    const context = parseStudyContext(params).context!;
    assert.ok(context);
    const loaded = await loadStudyPassage(context, loaders);
    const book = await getBookText(context.translation, context.bookId);
    const text = book!.chapters[context.chapter - 1][context.verse! - 1];
    assert.equal(loaded.sourceText, text);
    assert.match(loaded.note, /Cross-edition correspondence has not been verified/);
    assert.equal(loaded.includeReception, false);
    assert.equal(loaded.aligned.length, 1);
    assert.equal(loaded.aligned[0].originalVerse, null);
    const witnesses = Object.fromEntries(Object.entries(loaded.primaryVerses[0]).filter(([key, value]) => key !== "ref" && value));
    assert.deepEqual(witnesses, { [context.translation]: text });
  }
});
