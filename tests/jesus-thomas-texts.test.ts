import test from "node:test";
import assert from "node:assert/strict";
import { getLibraryPage } from "../src/lib/early/library-server";
import { getParables } from "../src/lib/jesus/server";
import { THOMAS_PARABLES } from "../src/lib/jesus/thomas-parables";
import { createThomasReader, getThomasTexts, thomasParagraphs } from "../src/lib/jesus/thomas-parallels-server";

const valid = { id: "saying-65", kind: "primary-text", blocks: [{ kind: "primary-text", text: "One" }, { kind: "primary-text", text: "Two" }], chars: 6 };

test("the mapped comparison texts preserve every hosted primary paragraph", async () => {
  const parables = getParables();
  const texts = await getThomasTexts(parables);
  const numbers = [...new Set(parables.flatMap(p => (p.thomas ?? []).map(t => t.saying)))];
  assert.equal(numbers.length, 22);
  for (const number of numbers) {
    const source = await getLibraryPage("gospel-thomas", `saying-${number}`);
    assert.ok(source);
    assert.deepEqual(texts[number], source.blocks.filter(b => b.kind === "primary-text").map(b => b.text), `Saying ${number}`);
  }
});

test("invalid or incomplete sources fail closed without losing neighboring sayings", async () => {
  for (const bad of [null, {}, { ...valid, id: "saying-66" }, { ...valid, kind: "commentary" }, { ...valid, blocks: [] },
    { ...valid, blocks: [{ kind: "primary-text", text: "" }] },
    { ...valid, blocks: [{ kind: "primary-text", text: "One" }, { kind: "primary-text" }] },
    { ...valid, blocks: [{ kind: "primary-text", text: "One" }, { kind: "commentary", text: "Two" }] },
    { ...valid, chars: 5 }]) {
    assert.equal(thomasParagraphs(bad, 65), null);
  }
  assert.deepEqual(thomasParagraphs(valid, 65), ["One", "Two"]);
  const entries = getParables().filter(p => p.id === "wicked-tenants");
  const diagnostics: string[] = [];
  for (const bad of [null, { ...valid, id: "saying-66" }, new Error("missing file")]) {
    const texts = await getThomasTexts(entries, async (_record, section) => {
      if (section === "saying-65") {
        if (bad instanceof Error) throw bad;
        return bad;
      }
      return { ...valid, id: section };
    }, message => diagnostics.push(message));
    assert.equal(texts[65], null);
    assert.deepEqual(texts[66], ["One", "Two"]);
  }
  assert.equal(diagnostics.length, 3);
  assert.ok(diagnostics.every(message => message.includes("65")));
});

test("a repeated saying is read only once", async () => {
  const calls: string[] = [];
  await getThomasTexts(getParables(), async (record, section) => {
    calls.push(`${record}/${section}`);
    return { ...valid, id: section };
  }, () => {});
  assert.equal(calls.length, 22);
  assert.equal(calls.filter(call => call.endsWith("saying-21")).length, 1);
});

test("the narrow reader enforces the published catalog and section boundary", async () => {
  const catalog = (status: string, chars = 6) => JSON.stringify([{ id: "gospel-thomas", publicationStatus: status,
    sections: [{ id: "saying-65", kind: "primary-text", chars }] }]);
  const reader = await createThomasReader(async (file) => file.endsWith("catalog.json") ? catalog("published") : JSON.stringify(valid));
  assert.deepEqual(await reader("gospel-thomas", "saying-65"), valid);
  assert.equal(await reader("other", "saying-65"), null);
  assert.equal(await reader("gospel-thomas", "saying-66"), null);
  assert.equal(await reader("gospel-thomas", "../../secret"), null);
  const withheld = await createThomasReader(async (file) => file.endsWith("catalog.json") ? catalog("reference-only") : JSON.stringify(valid));
  assert.equal(await withheld("gospel-thomas", "saying-65"), null);
  const mismatched = await createThomasReader(async (file) => file.endsWith("catalog.json") ? catalog("published", 7) : JSON.stringify(valid));
  assert.equal(await mismatched("gospel-thomas", "saying-65"), null);
  await assert.rejects(createThomasReader(async () => "not JSON"));
  await assert.rejects(createThomasReader(async () => { throw new Error("unreadable catalog"); }), /unreadable catalog/);
});

test("invalid or duplicate catalog entries do not hide other sayings", async () => {
  for (const bad of [
    { id: "saying-114", kind: "primary-text", chars: 0 },
    { id: "saying-66", kind: "primary-text", chars: 0 },
    { id: "saying-65", kind: "primary-text", chars: 6 },
  ]) {
    const catalog = JSON.stringify([{ id: "gospel-thomas", publicationStatus: "published", sections: [
      { id: "saying-65", kind: "primary-text", chars: 6 }, bad,
      { id: "saying-66", kind: "primary-text", chars: 6 },
    ] }]);
    const reader = await createThomasReader(async (file) => file.endsWith("catalog.json") ? catalog : JSON.stringify(valid));
    assert.equal(await reader("gospel-thomas", "saying-65") === null, bad.id === "saying-65");
    if (bad.id === "saying-66") assert.equal(await reader("gospel-thomas", "saying-66"), null);
  }
});


test("Thomas-only stories load each source exactly and deduplicate shared sayings", async () => {
  const entries = [...getParables(), ...THOMAS_PARABLES.map(story => ({ thomas: [{ saying: story.saying }] }))];
  const texts = await getThomasTexts(entries);
  assert.equal(Object.keys(texts).length, 23);
  for (const story of THOMAS_PARABLES) {
    const source = await getLibraryPage("gospel-thomas", `saying-${story.saying}`);
    assert.ok(source);
    assert.deepEqual(texts[story.saying], source.blocks.filter(block => block.kind === "primary-text").map(block => block.text));
  }
});
