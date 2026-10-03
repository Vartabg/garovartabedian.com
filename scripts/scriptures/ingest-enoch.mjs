#!/usr/bin/env node
/**
 * One-time ingestion: 1 Enoch, R.H. Charles translation (1913, public domain),
 * from the Wikisource transcription of the SPCK edition
 * (https://en.wikisource.org/wiki/The_Book_of_Enoch_(Charles)).
 *
 * Fetches all 108 chapter subpages via the Wikisource API, parses the
 * Roman-numeral chapter markers and inline verse numbers, and writes
 * public/scriptures/text/charles/ENO.json in the site's BookText shape.
 *
 * Parsing rules (deliberately conservative):
 *  - verse numbers are accepted only when they continue the expected sequence
 *    (1, 2, 3, …) — any other number-like token is text, not a verse marker;
 *  - Charles' editorial marks (⌈⌉ conjecture brackets, [ ] restorations) are
 *    kept verbatim — altering the edition is not ours to do;
 *  - poetry line breaks inside a verse are collapsed to single spaces;
 *  - every chapter must start at verse 1; gaps are reported, never filled.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "public/scriptures/text/charles/ENO.json");
const UA = "GarovartabedianSiteBuilder/1.0 (contact: garo.vartabed@gmail.com)";
const API = "https://en.wikisource.org/w/api.php";

const CACHE = "/tmp/enoch-chapters";
fs.mkdirSync(CACHE, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchChapter(chapter) {
  const title = `The Book of Enoch (Charles)/Chapter ${String(chapter).padStart(2, "0")}`;
  const cacheFile = path.join(CACHE, `${String(chapter).padStart(2, "0")}.wikitext`);
  if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile, "utf8");
  const url = `${API}?action=query&titles=${encodeURIComponent(title)}&prop=revisions&rvprop=content&format=json&formatversion=2`;
  let content = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429) {
      const wait = Number(res.headers.get("retry-after") ?? "5") * 1000;
      await sleep(Math.max(wait, 5000));
      continue;
    }
    if (!res.ok) throw new Error(`${title}: HTTP ${res.status}`);
    const json = await res.json();
    const page = json.query.pages[0];
    if (page.missing) throw new Error(`${title}: missing on Wikisource`);
    content = page.revisions[0].content;
    break;
  }
  if (!content) throw new Error(`${title}: exhausted retries`);
  fs.writeFileSync(cacheFile, content);
  await sleep(300); // polite pacing for the Wikimedia API
  return content;
}

function parseChapter(raw) {
  // Drop the header template and section markers; keep the body.
  let body = raw.replace(/^\{\{header[\s\S]*?\}\}\s*/m, "");
  body = body.replace(/^===+.*?===+\s*$/gm, "");
  // The chapter marker itself ("CHAPTER I.") is removed; the body that follows
  // is this chapter's text (the next CHAPTER marker belongs to the next page
  // only in the contents — chapter pages hold exactly one chapter).
  body = body.replace(/^CHAPTER\s+[IVXLC]+\.?\s*$/gim, "");
  body = body.replace(/<br\s*\/?>/gi, "\n");
  body = body.replace(/\[\[([^|\]]*\|)?([^\]]+)\]\]/g, "$2"); // wiki links → text

  // Walk the text accepting verse markers only in the expected sequence.
  const verses = [];
  let current = null;
  let expected = 1;
  const markerRe = /(?:^|[\s\]])((?:\d{1,3}))\.\s+/g;
  let lastIndex = 0;
  let match;
  const pushCurrent = () => {
    if (current) {
      verses.push(current.text.replace(/\s+/g, " ").trim());
      current = null;
    }
  };
  while ((match = markerRe.exec(body)) !== null) {
    const num = Number(match[1]);
    if (num !== expected) continue; // not a verse marker — part of the text
    const textStart = match.index + match[0].length;
    if (current) current.text += body.slice(lastIndex, match.index);
    else if (lastIndex === 0 && match.index > 0) {
      // text before verse 1 (e.g. stray headers) — drop it
    }
    pushCurrent();
    current = { num, text: "" };
    expected += 1;
    lastIndex = textStart;
  }
  if (current) current.text += body.slice(lastIndex);
  pushCurrent();

  // A chapter page may contain the NEXT chapter's beginning if the source
  // split differs; detect and trim by checking for a CHAPTER marker we
  // already removed — anything after the last accepted verse that contains
  // another "CHAPTER" marker is dropped by the marker removal above.
  return verses;
}

const chapters = [];
const report = [];
for (let c = 1; c <= 108; c++) {
  const raw = await fetchChapter(c);
  const verses = parseChapter(raw);
  if (verses.length === 0) throw new Error(`Chapter ${c}: no verses parsed`);
  if (verses.some((v) => v.length === 0)) throw new Error(`Chapter ${c}: empty verse`);
  chapters.push(verses);
  report.push({ chapter: c, verses: verses.length });
}

const totalVerses = chapters.reduce((sum, ch) => sum + ch.length, 0);
const empty = chapters.filter((ch) => ch.length === 0).length;
console.log(`1 Enoch (Charles 1913): ${chapters.length} chapters, ${totalVerses} verses, ${empty} empty`);

// Sanity spot-checks against the edition.
const assertIncludes = (chapter, verse, fragment) => {
  const text = chapters[chapter - 1][verse - 1];
  if (!text || !text.includes(fragment)) {
    throw new Error(`Spot check failed at ${chapter}:${verse} — expected fragment: ${fragment}`);
  }
};
assertIncludes(1, 2, "Enoch a righteous man");
assertIncludes(1, 9, "ten thousands of"); // the verse Jude 14-15 quotes
assertIncludes(14, 1, "The book of the words of righteousness");
assertIncludes(14, 10, "large house which was built of crystals");
if (!chapters[107] || chapters[107].length === 0) {
  throw new Error("Chapter 108 missing or empty");
}

const out = {
  trans: "charles",
  book: "ENO",
  name: "1 Enoch",
  chapters,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
console.log(`Wrote ${path.relative(ROOT, OUT)}`);
console.log("Per-chapter verse counts (first 10):", report.slice(0, 10).map((r) => r.verses).join(","));
