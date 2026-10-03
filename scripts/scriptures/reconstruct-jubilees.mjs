import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const directory = path.dirname(fileURLToPath(import.meta.url));
export const sourceDirectory = path.join(directory, "sources/charles-jubilees-1913");
export const manifest = JSON.parse(fs.readFileSync(path.join(sourceDirectory, "manifest.json"), "utf8"));
export const normalizeWhitespace = (text) => text.replace(/\s+/gu, " ").trim();
export const sha256 = (contents) => createHash("sha256").update(contents).digest("hex");

function uniqueOffset(text, prefix, label) {
  if (typeof prefix !== "string" || !prefix.trim()) throw new Error(`${label}: empty repair prefix`);
  const offset = text.indexOf(prefix);
  if (offset < 0 || text.indexOf(prefix, offset + 1) !== -1) {
    throw new Error(`${label}: repair prefix must occur exactly once: ${prefix}`);
  }
  return offset;
}

/**
 * The archived CCEL pages encode verses as list items. The reviewed manifest
 * records lost list markers and misplaced boundaries. Repairs move boundaries
 * only: every source word, date, bracket, and punctuation mark is retained.
 */
export function parseChapter(html, chapter, expectedCount, review = manifest) {
  const dom = new JSDOM(html);
  let entries;
  try {
    const document = dom.window.document;
    if (document.title.trim() !== `Jubilees ${chapter}` ||
        ![...document.querySelectorAll("h5, p")].some((heading) =>
          normalizeWhitespace(heading.textContent) === `[Chapter ${chapter}]`)) {
      throw new Error(`Chapter ${chapter}: source heading does not match`);
    }
    const list = document.querySelector("ol");
    if (!list || list.querySelector("script, style, iframe, form, img, ol")) {
      throw new Error(`Chapter ${chapter}: expected a plain verse list`);
    }
    if ([...list.childNodes].some((node) =>
      (node.nodeType === 1 && node.nodeName !== "LI") ||
      (node.nodeType === 3 && normalizeWhitespace(node.textContent)))) {
      throw new Error(`Chapter ${chapter}: unexpected content outside verse list items`);
    }
    entries = [...list.children].filter((element) => element.tagName === "LI")
      .map((element) => normalizeWhitespace(element.textContent));
    if (!entries.length || entries.some((text) => !text || text.includes("\uFFFD"))) {
      throw new Error(`Chapter ${chapter}: empty or undecodable source verse`);
    }
  } finally {
    dom.window.close();
  }

  const originalText = entries.join(" ");
  // Entry numbers refer to the original list, so apply insertions right-to-left.
  const missing = review.missingListMarkers.filter((repair) => repair.chapter === chapter)
    .toSorted((a, b) => b.entry - a.entry);
  for (const repair of missing) {
    const text = entries[repair.entry - 1];
    if (!text) throw new Error(`Chapter ${chapter}: missing repair entry ${repair.entry}`);
    const offset = uniqueOffset(text, repair.before, `Chapter ${chapter}, entry ${repair.entry}`);
    if (offset === 0) throw new Error(`Chapter ${chapter}: split would create an empty verse`);
    entries.splice(repair.entry - 1, 1, text.slice(0, offset).trim(), text.slice(offset).trim());
  }
  if (entries.length !== expectedCount) {
    throw new Error(`Chapter ${chapter}: expected ${expectedCount} verses, received ${entries.length}`);
  }

  const text = entries.join(" ");
  let offset = 0;
  const starts = entries.map((entry) => {
    const start = offset;
    offset += entry.length + 1;
    return start;
  });
  const repaired = new Set();
  for (const repair of review.boundaryRepairs.filter((item) => item.chapter === chapter)) {
    if (!Number.isInteger(repair.verse) || repair.verse < 2 || repair.verse > expectedCount || repaired.has(repair.verse)) {
      throw new Error(`Chapter ${chapter}: invalid or duplicate repaired verse ${repair.verse}`);
    }
    repaired.add(repair.verse);
    starts[repair.verse - 1] = uniqueOffset(text, repair.before, `${chapter}:${repair.verse}`);
  }
  if (starts.some((start, index) => index > 0 && start <= starts[index - 1])) {
    throw new Error(`Chapter ${chapter}: repaired boundaries are not in reading order`);
  }
  const verses = starts.map((start, index) => text.slice(start, starts[index + 1] ?? text.length).trim());
  if (verses.some((verse) => !verse) || normalizeWhitespace(verses.join(" ")) !== originalText) {
    throw new Error(`Chapter ${chapter}: reconstruction lost, duplicated, or changed source text`);
  }
  return verses;
}

export function reconstructJubilees({ sources = sourceDirectory } = {}) {
  if (manifest.chapterCount !== 50 || manifest.verseCount !== 1307 || manifest.pages.length !== 50) {
    throw new Error("Jubilees requires the complete reviewed 50-chapter source manifest");
  }
  for (const repair of [...manifest.missingListMarkers, ...manifest.boundaryRepairs]) {
    if (!repair.printedPages?.length || repair.printedPages.some((page) => !Number.isInteger(page) || page < 11 || page > 82)) {
      throw new Error(`Repair ${repair.chapter}:${repair.verse ?? repair.entry} has no printed-source evidence`);
    }
  }
  const chapters = manifest.pages.map((page, index) => {
    const chapter = index + 1;
    if (page.chapter !== chapter || page.file !== `${String(chapter).padStart(2, "0")}.html` ||
        !Number.isInteger(page.verses) || page.verses < 1) {
      throw new Error(`Invalid source manifest entry for chapter ${chapter}`);
    }
    const bytes = fs.readFileSync(path.join(sources, page.file));
    if (sha256(bytes) !== page.sha256) throw new Error(`Chapter ${chapter}: archived source checksum mismatch`);
    return parseChapter(bytes.toString("utf8"), chapter, page.verses);
  });
  if (chapters.reduce((count, chapter) => count + chapter.length, 0) !== manifest.verseCount) {
    throw new Error("Jubilees verse total does not match the reviewed source");
  }
  return { trans: "charles", book: "JUB", name: "Jubilees", chapters };
}

export function validateExcerpt(book, excerpt) {
  const references = Object.entries(excerpt.sections);
  if (references.length !== 23) throw new Error("Expected all 23 independently reviewed Jubilees excerpt verses");
  for (const [reference, text] of references) {
    const [chapter, verse] = reference.split(":").map(Number);
    if (book.chapters[chapter - 1]?.[verse - 1] !== normalizeWhitespace(text)) {
      throw new Error(`Jubilees ${reference}: does not match the source-reviewed excerpt`);
    }
  }
}
