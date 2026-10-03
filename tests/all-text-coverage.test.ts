import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildLibrarySearchIndex } from "../src/lib/early/library-search";
import { getLibrarySearchRows, getLibrary, searchLibrary } from "../src/lib/early/library-server";
import type { LibrarySearchRow } from "../src/lib/early/library";
import { chapterReadingGroups, VERSE_LINED_BOOKS } from "../src/lib/scriptures/reading-layout";
import { defaultEasyPrefs, readEasyPrefs } from "../src/lib/scriptures/prefs";
import { wordingEvidence, wordingLabel } from "../src/lib/scriptures/search-wording";
import { librarySearchHref, withLibraryFindContext, findReturnHref, preserveFindContext } from "../src/lib/scriptures/search-url";
import { GET } from "../src/app/api/library-search/route";

const row = (id: string, text: string, kind: LibrarySearchRow["kind"] = "primary-text"): LibrarySearchRow => ({ id, recordId: "edition-a", title: "A writing", edition: "Actual edition", kind, label: id, href: `/early/library/edition-a/chapter-1#${id}`, text });

test("writings phrases outrank scattered overlap before pagination and preserve meaningful negation", () => {
  const search = buildLibrarySearchIndex([...Array.from({ length: 100 }, (_, i) => row(`p${i}`, "The world will not hold its light.")), row("phrase", "The LIGHT of the world."), row("reversed", "The world of the light."), row("negative", "Do not be afraid."), row("contraction", "Don’t be afraid."), row("opposite", "Be afraid.")]);
  assert.equal(search("light of the world").hits[0].id, "phrase");
  assert.equal(search("light of the world").hits[0].match, "phrase");
  assert.equal(search("world light").hits[0].match, "all-words");
  const negative = search("do not be afraid");
  assert.deepEqual(negative.hits.map(h => h.id), ["negative", "contraction", "opposite"]);
  assert.equal(negative.hits[1].match, "phrase-form");
  assert.match(wordingLabel(negative.hits[2]), /negation differs/);
});

test("phrases cannot cross source blocks, source/notes never mingle, and Unicode snippets retain exact source characters", () => {
  const search = buildLibrarySearchIndex([row("p1", "The light of the"), row("p2", "world is here."), row("note", "Light of the world.", "commentary"), row("unicode", "Ἀγάπη · café, שלום world."), row("catalog", "A record about a missing manuscript.", "reference-only")]);
  assert.ok(search("light of the world", ["primary-text"]).hits.every(hit => hit.match !== "phrase"));
  assert.equal(search("light of the world").hits[0].kind, "commentary");
  assert.equal(search("שלום").hits[0].snippet, "Ἀγάπη · café, שלום world.");
  assert.equal(search("manuscript", ["primary-text"]).total, 0);
  assert.equal(search("unlistedword").total, 0);
  assert.equal(search("world", [], [], Infinity).page, 1);
  assert.equal(search("world", [], [], 99).page, 1);
  assert.equal(search("world", [], ["other"]).total, 0);
});

test("long-paragraph excerpts show the actual complete phrase rather than an earlier scattered word", () => {
  const text = "Love is discussed here. " + "A separate sentence. ".repeat(80) + "Love your enemies, he said.";
  const hit = buildLibrarySearchIndex([row("long", text)])("love your enemies").hits[0];
  assert.equal(hit.match, "phrase");
  assert.match(hit.snippet, /Love your enemies/);
});

test("every hosted block and original-shelf paragraph has one edition-pinned indexed anchor", async () => {
  const rows = await getLibrarySearchRows();
  assert.equal(rows.length, 45649 + 778 + 122);
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
  assert.equal(rows.filter(row => row.kind === "reference-only").length, 19);
  assert.equal(rows.filter(row => row.kind === "legacy-edition").length, 778);
  assert.ok(rows.filter(row => ["primary-text", "commentary", "legacy-edition"].includes(row.kind)).every(row => row.href.includes("#")));
  const catalog = await getLibrary();
  const byId = new Map(rows.map(row => [row.id, row]));
  for (const record of catalog) for (const section of record.sections) {
    const page = JSON.parse(readFileSync(`content/early-library/readings/${record.id}/${section.id}.json`, "utf8"));
    for (const [index, block] of page.blocks.entries()) {
      const anchor = block.noteId ? `note-${block.noteId}` : `p${index + 1}`;
      const indexed = byId.get(`${record.id}/${section.id}#${anchor}`)!;
      assert.equal(indexed.kind, block.kind);
      assert.equal(indexed.edition, record.editionLabel);
      assert.equal(indexed.text, block.noteId ? block.text.replace(/^\[\^[^\]]+\]:\s*/, "") : block.text);
    }
  }
});

test("real hosted writing phrase hits and reused editions retain source identity", async () => {
  const hits = (await searchLibrary("love your enemies")).hits;
  assert.ok(hits.some(hit => hit.match === "phrase"));
  for (const hit of hits.filter(hit => hit.match === "phrase")) assert.ok(hit.href.includes("#"));
  const reused = (await searchLibrary("Corinth", "legacy-edition", "1-clement")).hits;
  // A catalog edition only reuses an existing translation where its record says so.
  for (const hit of reused) assert.equal(hit.recordId, "legacy:1clement");
});

test("the library API validates input and returns bounded snippets without source bodies or provider work", async () => {
  for (const q of ["x", "q".repeat(161)]) assert.equal((await GET(new Request(`http://local/api/library-search?q=${q}`))).status, 400);
  const response = await GET(new Request("http://local/api/library-search?q=resurrection&limit=4"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const result = await response.json();
  assert.equal(result.hits.length, 4);
  assert.ok(result.hits.every((hit: object) => !Object.hasOwn(hit, "text")));
});

test("writings return links retain filters and page, cannot become external, and keep source edition/anchor", () => {
  const href = withLibraryFindContext("/early/library/edition-a/chapter-1#p3", "not peace", "commentary", "edition-a", 3);
  const params = new URL(href, "https://local.invalid").searchParams;
  assert.equal(findReturnHref(params), "/early/search?q=not+peace&kind=commentary&record=edition-a&page=3");
  assert.match(preserveFindContext("/early/library/edition-a/chapter-2#p1", params), /findFrom=writings/);
  assert.equal(withLibraryFindContext("//host.invalid", "x"), "//host.invalid");
  assert.equal(librarySearchHref("x", "all", "../../secrets", Infinity), "/early/search?q=x");
});

test("Scripture reading groups preserve verse order, gaps, supplied lineation and poetry", () => {
  const verses = Array.from({ length: 30 }, (_, i) => `${i + 1}. ${"This sentence is unchanged. ".repeat(4)}`);
  const groups = chapterReadingGroups(verses, "JHN");
  assert.ok(groups.length > 2 && groups.length < verses.length);
  assert.deepEqual(groups.flatMap(group => group.map(index => verses[index])), verses);
  for (const book of VERSE_LINED_BOOKS) assert.ok(chapterReadingGroups(verses, book).every(group => group.length === 1));
  assert.deepEqual(chapterReadingGroups(["One.", "", "A line\nAnother line", "End."], "GEN"), [[0], [1], [2], [3]]);
  assert.deepEqual(chapterReadingGroups([], "GEN"), []);
  assert.equal(defaultEasyPrefs.flow, true);
  assert.equal(readEasyPrefs().flow, true);
  assert.ok(wordingEvidence("Αγάπη", "ἀγάπη").words.has("αγαπη"));
});
