import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { formatReadingText, READING_LAYOUT_VERSION } from "../../src/lib/reading-layout";
import { chapterReadingGroups } from "../../src/lib/scriptures/reading-layout";
import type { EarlyText } from "../../src/lib/early/types";
import type { LibraryPage, LibraryRecord } from "../../src/lib/early/library";

/** Audits actual downloaded sources; never writes them or makes provider calls. */
export function auditReadingLayout(root = process.cwd()) {
  const digest = createHash("sha256");
  const read = <T>(path: string): T => {
    const raw = readFileSync(resolve(root, path));
    digest.update(path).update("\0").update(raw).update("\0");
    return JSON.parse(raw.toString());
  };
  const counts = () => ({ sourceBlocks: 0, fragments: 0, editorialBreaks: 0, quotationBlocks: 0, suppliedLineBreaks: 0, longestFragment: 0 });
  const early = { works: 0, ...counts() }, library = { editions: 0, sections: 0, primaryBlocks: 0, commentaryBlocks: 0, ...counts() };
  function check(text: string, stats: ReturnType<typeof counts>, label: string, language = "en") {
    const layout = formatReadingText(text, { language });
    const fragments = layout.flatMap(block => block.fragments);
    assert.equal(fragments.map(p => p.text).join(""), text, `Source round trip: ${label}`);
    let end = 0;
    for (const part of fragments) {
      assert.equal(part.start, end, `Contiguous source offsets: ${label}`);
      assert.equal(part.text, text.slice(part.start, part.end), `Exact slice: ${label}`);
      end = part.end;
    }
    for (const note of text.matchAll(/\[\^[^\]]+\]/g)) assert.ok(fragments.some(p => p.start <= note.index && p.end >= note.index + note[0].length), `Intact note marker: ${label}`);
    stats.sourceBlocks++;
    stats.fragments += fragments.length;
    stats.editorialBreaks += fragments.filter(p => p.boundary === "editorial").length;
    stats.quotationBlocks += layout.filter(b => b.kind === "quotation").length;
    stats.suppliedLineBreaks += (text.match(/\n/g) ?? []).length;
    stats.longestFragment = Math.max(stats.longestFragment, ...fragments.map(p => p.text.length));
  }
  for (const file of readdirSync(resolve(root, "public/early/texts")).filter(f => f.endsWith(".json")).sort()) {
    const text = read<EarlyText>(`public/early/texts/${file}`);
    early.works++;
    text.sections.forEach((s, i) => s.paragraphs.forEach((p, j) => check(p, early, `${file}:${i}:${j}`)));
  }
  const catalog = read<LibraryRecord[]>("content/early-library/catalog.json");
  for (const edition of catalog) {
    if (!edition.sections.length) continue;
    assert.equal(edition.publicationStatus, "published");
    library.editions++;
    for (const section of edition.sections) {
      const page = read<LibraryPage>(`content/early-library/readings/${edition.id}/${section.id}.json`);
      library.sections++;
      page.blocks.forEach((b, i) => {
        if (b.kind === "commentary") library.commentaryBlocks++; else library.primaryBlocks++;
        check(b.text, library, `${edition.id}/${section.id}:${i}`, edition.language);
      });
    }
  }
  const scripture = { translations: 0, books: 0, chapters: 0, verses: 0, readingGroups: 0, suppliedLineBreaks: 0 };
  for (const edition of readdirSync(resolve(root, "public/scriptures/text"), { withFileTypes: true }).filter(d => d.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    scripture.translations++;
    for (const file of readdirSync(resolve(root, "public/scriptures/text", edition.name)).filter(f => f.endsWith(".json")).sort()) {
      const book = read<{ chapters: string[][] }>(`public/scriptures/text/${edition.name}/${file}`);
      scripture.books++; scripture.chapters += book.chapters.length;
      for (const chapter of book.chapters) {
        const groups = chapterReadingGroups(chapter, file.replace(/\.json$/, ""));
        assert.deepEqual(groups.flat(), chapter.map((_, index) => index), `Verse anchors/order: ${edition.name}/${file}`);
        assert.deepEqual(groups.flatMap(group => group.map(index => chapter[index])), chapter, `Exact verses: ${edition.name}/${file}`);
        scripture.readingGroups += groups.length;
        for (const verse of chapter) {
        scripture.verses++; scripture.suppliedLineBreaks += (verse.match(/\n/g) ?? []).length;
        }
      }
    }
  }
  return { layoutVersion: READING_LAYOUT_VERSION, early, library, scripture, unpublishedRecords: catalog.filter(r => r.publicationStatus !== "published").length, sourceSha256: digest.digest("hex") };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(auditReadingLayout(), null, 2));
