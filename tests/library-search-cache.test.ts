import assert from "node:assert/strict";
import test from "node:test";
import { buildLibrarySearchIndex } from "../src/lib/early/library-search";
import type { LibrarySearchRow } from "../src/lib/early/library";

const row = (id: string, text: string, changes: Partial<LibrarySearchRow> = {}): LibrarySearchRow => ({
  id, recordId: "edition-a", title: "A writing", edition: "Actual edition",
  kind: "primary-text", label: id, href: `/early/library/edition-a/chapter-1#${id}`, text,
  ...changes,
});

test("cached source preparation refreshes changed text while retaining the original postings", () => {
  const original = row("mutable", "Light elsewhere; world is discussed.");
  const search = buildLibrarySearchIndex([original]);
  assert.equal(search("light of the world").hits[0].match, "all-words");

  original.text = "Moon, light of the world.";
  const changed = search("light of the world");
  assert.equal(changed.total, 1);
  assert.equal(changed.hits[0].match, "phrase");
  assert.equal(changed.hits[0].snippet, original.text);
  assert.equal(search("moon").total, 0);

  original.text = "Light no longer mentions that other word.";
  assert.equal(search("light of the world").hits[0].match, "some-words");
  assert.equal(search("light of the world").hits[0].matched, 1);
});

test("cached text does not snapshot mutable edition metadata or filters", () => {
  const original = row("metadata", "Light of the world.");
  const search = buildLibrarySearchIndex([original]);
  assert.equal(search("light of the world").hits[0].edition, "Actual edition");
  Object.assign(original, {
    id: "updated", recordId: "edition-b", title: "Updated title", edition: "Updated edition",
    kind: "commentary", label: "Updated label", href: "/early/library/edition-b/chapter-2#note-a",
  });
  const hit = search("light of the world", ["commentary"], ["edition-b"]).hits[0];
  assert.equal(hit.id, "updated");
  assert.equal(hit.title, "Updated title");
  assert.equal(hit.edition, "Updated edition");
  assert.equal(hit.label, "Updated label");
  assert.equal(hit.href, "/early/library/edition-b/chapter-2#note-a");
  assert.equal(hit.match, "phrase");
  assert.equal(search("light", ["primary-text"]).total, 0);
  assert.equal(search("light", [], ["edition-a"]).total, 0);
});

test("replacing an input row preserves the live row metadata and reparses its source text", () => {
  const rows = [row("first", "Light elsewhere; world is discussed.")];
  const search = buildLibrarySearchIndex(rows);
  search("light of the world");
  rows[0] = row("replacement", "Light of the world.", { title: "Replacement" });
  const hit = search("light of the world").hits[0];
  assert.equal(hit.id, "replacement");
  assert.equal(hit.title, "Replacement");
  assert.equal(hit.match, "phrase");
});

test("Unicode snippet offsets still refer to the original source instead of normalized text", () => {
  const source = "Intro ".repeat(30) + "Cafe\u0301 שלום 7 7.";
  const search = buildLibrarySearchIndex([row("unicode", source)]);
  const first = search("café שלום 7 7");
  assert.equal(first.hits[0].match, "phrase");
  assert.equal(first.hits[0].matched, 3);
  assert.equal(first.hits[0].snippet, "…" + "Intro ".repeat(15) + "Cafe\u0301 שלום 7 7.");
  assert.deepEqual(search("café שלום 7 7"), first);
  assert.ok(!Object.hasOwn(first.hits[0], "text"));
});

test("cached phrase matching retains repetitions, numbers, and separate source blocks", () => {
  const search = buildLibrarySearchIndex([
    row("once", "Holy."), row("twice", "Holy holy."),
    row("seven", "Seven 7."), row("eight", "Seven 8."),
    row("left", "The light of the"), row("right", "world is here."),
    row("note", "Light of the world.", { kind: "commentary" }),
  ]);
  assert.equal(search("holy holy").hits[0].id, "twice");
  assert.equal(search("holy holy").hits[0].match, "phrase");
  assert.equal(search("seven 7").hits[0].id, "seven");
  assert.equal(search("seven 7").hits[0].match, "phrase");
  assert.ok(search("light of the world", ["primary-text"]).hits.every(hit => hit.match !== "phrase"));
  assert.equal(search("light of the world", ["commentary"]).hits[0].id, "note");
});

test("filters and pagination keep full totals, stable ordering, and existing page bounds", () => {
  const search = buildLibrarySearchIndex([
    row("c", "Light."), row("a", "Light."), row("b", "Light."),
    row("note", "Light.", { kind: "commentary", recordId: "edition-b" }),
  ]);
  const page = search("light", ["primary-text"], ["edition-a"], 2, 1);
  assert.equal(page.total, 3);
  assert.equal(page.page, 2);
  assert.equal(page.pageSize, 1);
  assert.deepEqual(page.hits.map(hit => hit.id), ["b"]);
  assert.equal(search("light", ["primary-text"], [], 99, 1).page, 3);
  assert.equal(search("light", ["primary-text"], [], Infinity, 1).page, 1);
  assert.equal(search("light", ["commentary"], ["edition-a"]).total, 0);
  assert.deepEqual(search("light", [], ["edition-b"]).hits.map(hit => hit.id), ["note"]);

  const tied = buildLibrarySearchIndex([
    row("same", "Light.", { title: "First" }), row("same", "Light.", { title: "Second" }),
  ]);
  assert.deepEqual(tied("light").hits.map(hit => hit.title), ["First", "Second"]);
  assert.deepEqual(tied("light").hits.map(hit => hit.title), ["First", "Second"]);
});

test("cached negatives distinguish literal wording, contractions, and missing negation", () => {
  const search = buildLibrarySearchIndex([
    row("opposite", "Be afraid."), row("contraction", "Don't be afraid."), row("literal", "Do not be afraid."),
  ]);
  const first = search("do not be afraid");
  assert.deepEqual(first.hits.map(hit => [hit.id, hit.match, hit.missingNegation]), [
    ["literal", "phrase", []], ["contraction", "phrase-form", []], ["opposite", "some-words", ["not"]],
  ]);
  first.hits[0].missingNegation.push("invented");
  assert.deepEqual(search("do not be afraid").hits[0].missingNegation, []);
});
