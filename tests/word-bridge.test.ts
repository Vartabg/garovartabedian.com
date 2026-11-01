import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { lookupGreek, lookupHebrew, LEXICON_DIR } from "../scripts/scriptures/bridge/lexicon.mjs";
import { loadChapter } from "../scripts/scriptures/bridge/chapter.mjs";
import { checkLink, validateDraft } from "../scripts/scriptures/bridge/check.mjs";
import { MODEL, SCHEMA, parseTarget, requestsFor } from "../scripts/scriptures/bridge/draft.mjs";
import { OUT, buildBook } from "../scripts/scriptures/bridge/build.mjs";
import { bookTags, draftFromTags } from "../scripts/scriptures/bridge/import-ebible.mjs";
import { explain } from "../src/lib/scriptures/bridge-verdicts.mjs";

type Verse = ReturnType<typeof loadChapter>["verses"][number] & { lang: "greek" | "hebrew" };

function verse(book: string, chapter: number, n: number): Verse {
  const ch = loadChapter(book, chapter);
  const v = ch.verses.find((x: { n: number }) => x.n === n);
  assert.ok(v, `${book} ${chapter}:${n} loads`);
  return { ...v, lang: ch.lang };
}
type Kind = "link" | "supplied" | "untranslated";
type Link = Parameters<typeof checkLink>[0];
const link = (en: number[], og: string[], kind: Kind = "link", confidence = "high"): Link => ({ en, og, kind, confidence });

test("the dictionaries are the pinned copies the manifest names", () => {
  const manifest = JSON.parse(readFileSync(path.join(LEXICON_DIR, "manifest.json"), "utf8")) as {
    files: { file: string; sha256: string; license: string }[];
  };
  for (const f of manifest.files) {
    const hash = createHash("sha256").update(readFileSync(path.join(LEXICON_DIR, f.file))).digest("hex");
    assert.equal(hash, f.sha256, `${f.file} matches its manifest hash`);
    assert.ok(f.license.length > 10, `${f.file} records its license`);
  }
  assert.equal(lookupGreek("λόγος")?.strong, "G3056");
  assert.equal(lookupGreek("οὕτω(ς)")?.strong, "G3779");
  assert.match(lookupHebrew("7225")?.long ?? "", /beginning/);
  assert.match(lookupHebrew("b")?.brief ?? "", /^in\b/);
});

test("the checker supports dictionary matches and flags translator readings", () => {
  const v = verse("JHN", 3, 16);
  const english = v.english.map((t: { w: string }) => t.w);
  assert.deepEqual(english.slice(7, 10), ["he", "gave", "his"]);
  assert.equal(checkLink(link([7, 8], ["12"]), v).status, "ok", "“he gave” ↔ ἔδωκεν");
  assert.equal(checkLink(link([5], ["6"]), v).status, "ok", "“world” ↔ κόσμον");
  const his = checkLink(link([9], ["8"]), v);
  assert.equal(his.status, "flag", "“his” ↔ τὸν: the Greek says “the”");
  assert.match(his.why, /“his” is not in the dictionary meaning/);
  assert.equal(checkLink(link([14], ["14", "15"]), v).status, "flag", "“whoever” ↔ πᾶς ὁ");
  assert.equal(checkLink(link([12], [], "supplied"), v).status, "plain");
  assert.equal(checkLink(link([5], ["6"], "link", "low"), v).status, "flag", "an uncertain draft is reviewed");
});

test("grammar carries what the dictionary does not", () => {
  // “he” alone, linked to the finite verb ἔδωκεν: the ending carries the subject.
  const john = verse("JHN", 3, 16);
  const he = checkLink(link([7], ["12"]), john);
  assert.equal(he.status, "ok");
  assert.equal(he.label, "Carried by the grammar");
  // Psalm 22:1 “My God”: אֵלִי carries the pronoun suffix “my”.
  const psalm = verse("PSA", 22, 1);
  const eli = psalm.original.findIndex((w: { t: string }) => w.t.startsWith("אֵלִ"));
  const my = psalm.english.findIndex((t: { w: string }) => t.w === "My");
  assert.ok(eli >= 0 && my >= 0);
  assert.equal(checkLink(link([my], [String(eli)]), psalm).label, "Carried by the grammar");
});

test("Hebrew prefixes and the object marker check against Strong's", () => {
  const g = verse("GEN", 1, 1);
  assert.equal(checkLink(link([0], ["0.0"]), g).status, "ok", "“In” ↔ the prefix בְּ");
  assert.equal(checkLink(link([2], ["0.1"]), g).status, "ok", "“beginning” ↔ רֵאשִׁית");
  const et = checkLink(link([], ["3.0"], "untranslated"), g);
  assert.equal(et.label, "Untranslated, as the dictionary says");
});

test("a draft is cleaned against the real verse before it is checked", () => {
  const v = verse("JHN", 1, 1);
  const { links, problems } = validateDraft([link([0, 99], ["0", "42"]), link([0], ["1"])], v);
  assert.ok(problems.includes("dropped English index 99"));
  assert.ok(problems.includes("dropped original ref 42"));
  assert.ok(problems.includes("dropped English index 0"), "an English word belongs to one link only");
  const gaps = (links as Link[]).filter((l) => l.gap);
  const gap = gaps.find((l) => l.kind === "supplied");
  assert.ok(gap, "unlinked English words become explicit gaps");
  assert.equal(checkLink(gap, v).status, "flag");
});

test("drafting requests use structured outputs on the default model", () => {
  const [request] = requestsFor([parseTarget("JHN:3:16-16")]);
  assert.match(request.custom_id, /^[A-Za-z0-9_-]{1,64}$/);
  assert.equal(request.params.model, MODEL);
  assert.equal(MODEL, "claude-opus-5-5");
  assert.deepEqual(request.params.output_config.format, { type: "json_schema", schema: SCHEMA });
  const body = JSON.parse(request.params.messages[0].content);
  assert.equal(body.verses.length, 1);
  assert.equal(body.verses[0].original[12].lemma, "δίδωμι");
});

type Lang = "greek" | "hebrew";

test("the free eBible tags become drafts the checker sorts", () => {
  const john = loadChapter("JHN", 3);
  const v = { ...john.verses.find((x: { n: number }) => x.n === 16), lang: john.lang };
  const { links } = validateDraft(draftFromTags(v, john.lang as Lang, bookTags("JHN").get(3).get(16)), v);
  const verdict = (word: string) => {
    const i = v.english.findIndex((t: { w: string }) => t.w === word);
    const l = links.find((x: { en: number[] }) => x.en.includes(i));
    return checkLink(l as Link, v, "e");
  };
  assert.equal(verdict("world").status, "ok");
  assert.equal(verdict("gave").status, "ok");
  assert.equal(verdict("should").status, "flag", "eBible tags “should” as θεός");
  assert.equal(verdict("loved").code, "untagged", "an untagged word is unknown, not wrong");
  assert.equal(verdict("loved").status, "plain");

  const gen = loadChapter("GEN", 1);
  const g = { ...gen.verses[0], lang: gen.lang };
  const gl = validateDraft(draftFromTags(g, gen.lang as Lang, bookTags("GEN").get(1).get(1)), g).links;
  const god = gl.find((x: { en: number[] }) => x.en.includes(3));
  assert.equal(checkLink(god as Link, g, "e").status, "flag", "eBible tags “God” in Genesis 1:1 as “heavens”");
  const inn = gl.find((x: { en: number[] }) => x.en.includes(0));
  assert.equal(checkLink(inn as Link, g, "e").status, "flag", "a small word does not match a long definition by accident");
});

test("the published bridge is exactly what the sources and the checker produce", () => {
  const index = JSON.parse(readFileSync(path.join(OUT, "index.json"), "utf8"));
  assert.ok(Object.keys(index.books).length >= 66, "every book with an original text is covered");
  for (const book of ["JHN", "GEN"]) {
    const built = buildBook(book);
    assert.deepEqual(index.books[book], { chapters: built.chapters.map((c: { chapter: number }) => c.chapter), ...built.stats });
    assert.deepEqual(JSON.parse(readFileSync(path.join(OUT, book, "dictionary.json"), "utf8")), built.dictionary);
    for (const { chapter, data } of built.chapters) {
      assert.deepEqual(JSON.parse(readFileSync(path.join(OUT, book, `${chapter}.json`), "utf8")), JSON.parse(JSON.stringify(data)), `${book} ${chapter} is current`);
    }
  }
  // A committed Claude draft wins over the free tags for its verse.
  const john3 = JSON.parse(readFileSync(path.join(OUT, "JHN", "3.json"), "utf8"));
  assert.equal(john3.sources["16"], "c");
});

test("every verdict code the build publishes has words for the reader", () => {
  const john1 = JSON.parse(readFileSync(path.join(OUT, "JHN", "1.json"), "utf8"));
  for (const rows of Object.values(john1.verses) as [number[], string[], number, number, string, string?][][]) {
    for (const [, , , , code, arg] of rows) assert.notEqual(explain(code, arg).why, "This link has not been checked.", code);
  }
});
