import assert from "node:assert/strict";
import test from "node:test";
import audit from "./fixtures/parables-audit-early.json";
import { EARLY_FIGURES, earlyFigureHref } from "../src/lib/jesus/early-figures";
import { getEarlyFigureTexts } from "../src/lib/jesus/early-figures-server";
import { JAMES_PARABLES } from "../src/lib/jesus/james-parables";
import { getJamesTexts } from "../src/lib/jesus/james-parables-server";
import { getParables } from "../src/lib/jesus/server";
import { SYNOPTIC_FIGURES } from "../src/lib/jesus/synoptic-figures";
import { JOHN_FIGURES } from "../src/lib/jesus/john-figures";

test("audited noncanonical selections preserve source, speaker, ranges, relationships and notes", async () => {
  const sources = await getEarlyFigureTexts();
  const gospelIds = new Set([...getParables(), ...SYNOPTIC_FIGURES, ...JOHN_FIGURES].map(entry => entry.id));
  for (const expected of audit.selections.filter(row => row.edition !== "secret-book-james")) {
    const matching = EARLY_FIGURES.filter(figure => figure.id === expected.id);
    assert.equal(matching.length, 1, expected.id);
    const actual = matching[0];
    assert.deepEqual([actual.edition, actual.section, actual.start, actual.end, actual.speaker, actual.sha256],
      [expected.edition, expected.section, expected.start, expected.end, expected.speaker, expected.sha256], expected.id);
    assert.equal(actual.note, expected.note, expected.id);
    assert.equal(actual.related ?? null, expected.related, expected.id);
    assert.deepEqual(actual.relatedAlso ?? [], "relatedAlso" in expected ? expected.relatedAlso ?? [] : [], expected.id);
    assert.deepEqual(actual.thomas ?? [], "thomas" in expected ? expected.thomas ?? [] : [], expected.id);
    assert.deepEqual(actual.earlyComparisons ?? [], "earlyComparisons" in expected ? expected.earlyComparisons ?? [] : [], expected.id);
    assert.ok(sources[actual.id]?.length, expected.id);
    for (const id of [actual.related, ...(actual.relatedAlso ?? [])].filter(Boolean)) assert.ok(gospelIds.has(id!), `${actual.id}: ${id}`);
    for (const id of actual.earlyComparisons ?? []) assert.ok(EARLY_FIGURES.some(figure => figure.id === id), `${actual.id}: ${id}`);
  }
  const expected = audit.selections.find(row => row.id === "james-named-parables")!;
  const actual = JAMES_PARABLES.find(row => row.id === expected.id)!;
  assert.equal(actual.section, expected.section);
  assert.equal(actual.paragraph, expected.start);
  assert.equal(actual.sha256, expected.sha256);
  assert.equal(actual.note, expected.note);
  assert.ok((await getJamesTexts())[actual.id]?.length);
  const fullness = JAMES_PARABLES.find(row => row.id === "james-fullness-sobriety")!;
  assert.deepEqual(fullness.thomas?.map(row => row.saying), [13, 28]);
  assert.ok(fullness.thomas?.every(row => /different|thematic/i.test(row.note ?? "")));
});

test("the audit catches altered speakers, truncated ranges and lost partial-comparison notes", () => {
  const checked = audit.selections.find(row => row.id === "philip-unplanted-plant")!;
  const actual = EARLY_FIGURES.find(figure => figure.id === checked.id)!;
  const verify = (figure: typeof actual) => {
    assert.equal(figure.speaker, checked.speaker);
    assert.equal(figure.end, checked.end);
    assert.equal(figure.note, checked.note);
    assert.deepEqual(figure.thomas, checked.thomas);
  };
  verify(actual);
  for (const broken of [
    { ...actual, speaker: "Jesus" },
    { ...actual, end: actual.end - 1 },
    { ...actual, note: undefined },
    { ...actual, thomas: [{ saying: 41, note: actual.thomas![0].note }] },
    { ...actual, thomas: [{ saying: 40 }] },
  ]) assert.throws(() => verify(broken));
});

test("Lightfoot selections and corrected excerpts agree with the scan reconciliation", async () => {
  const { default: lightfoot } = await import("./fixtures/parables-audit-lightfoot.json");
  const { readFile } = await import("node:fs/promises");
  const texts = await getEarlyFigureTexts();
  for (const item of lightfoot.selections) {
    const actual = EARLY_FIGURES.find(figure => figure.id === item.id);
    assert.ok(actual, item.id);
    assert.equal(actual.sha256, item.sha256, item.id);
    assert.equal(actual.speaker, item.speaker, item.id);
    assert.equal(actual.related ?? null, item.related, item.id);
    assert.deepEqual(actual.relatedAlso ?? [], item.relatedAlso, item.id);
    assert.deepEqual(actual.earlyComparisons ?? [], item.earlyComparisons, item.id);
    assert.equal(actual.note ?? null, item.displayedNote, item.id);
    assert.ok(texts[item.id]?.length, item.id);
    assert.ok(item.printedPages.length && item.pdfPages.length, item.id);
    if (!item.excerpt) continue;
    assert.equal(earlyFigureHref(actual), item.scanUrl, item.id);
    let original = "";
    for (const [section, start, end] of item.selection as [string, number, number][]) {
      const page = JSON.parse(await readFile(`content/early-library/readings/${item.sourceEdition}/${section}.json`, "utf8"));
      const part = page.blocks.slice(start - 1, end).map((block: { text: string }) => block.text).join("\n\n");
      original += (original ? "\n\n" : "") + part;
    }
    for (const change of item.corrections) {
      assert.ok(original.includes(change.before), `${item.id}: ${change.before}`);
      original = original.replace(change.before, change.after);
    }
    assert.deepEqual(texts[item.id], [original], item.id);
    assert.match(actual.note ?? "", /corrects identified transcription errors against the 1891 printed edition/);
    assert.ok(actual.originalReader, item.id);
  }
});

test("Eusebius's selected Syriac-based excerpts retain their sources and attribution", async () => {
  const { default: audit } = await import("./fixtures/parables-audit-eusebius.json");
  const { createHash } = await import("node:crypto");
  const { readFile } = await import("node:fs/promises");
  const texts = await getEarlyFigureTexts();
  const gospelIds = new Set([...getParables(), ...SYNOPTIC_FIGURES, ...JOHN_FIGURES].map(entry => entry.id));
  assert.equal(audit.selections.length, 138);
  for (const item of audit.selections) {
    const figure = EARLY_FIGURES.find(row => row.id === item.id);
    assert.ok(figure, item.id);
    assert.equal(figure.speaker, item.speaker, item.id);
    assert.equal(figure.note, item.displayedNote, item.id);
    assert.equal(figure.sha256, item.sha256, item.id);
    assert.deepEqual([figure.related, ...(figure.relatedAlso ?? [])].filter(Boolean), item.related, item.id);
    assert.equal(earlyFigureHref(figure), item.scanUrl, item.id);
    assert.match(figure.translator, /1843 translation from Syriac/);
    assert.ok(item.pdfPages.length && item.printedPages, item.id);
    const page = JSON.parse(await readFile(item.path, "utf8"));
    assert.equal(createHash("sha256").update(page.blocks[0].text).digest("hex"), item.sha256, item.id);
    assert.deepEqual(texts[item.id], [page.blocks[0].text], item.id);
    for (const id of item.related) assert.ok(gospelIds.has(id), `${item.id}: ${id}`);
  }
});

test("Theophany close reading keeps Gospel quotations and partial authorial comparisons distinct", async () => {
  const byId = new Map(EARLY_FIGURES.map(figure => [figure.id, figure]));
  const texts = await getEarlyFigureTexts();
  const cases = [
    ["eusebius-lee-audit-shepherd-lost-sheep", "lost-sheep", /not.*quot|partial/i, /sheep.*strayed/i, /Eusebius/i],
    ["eusebius-lee-audit-strong-man", "divided-house", /interprets/i, /strong man/i, /Jesus/i],
    ["eusebius-lee-audit-good-shepherd-4", "john-sheepfold-shepherd", /different settings/i, /good Shepherd/i, /Jesus/i],
    ["eusebius-lee-audit-winnowing-floor", "synoptic-threshing-floor", /John the Baptist/i, /fan.*hand/i, /John the Baptist/i],
    ["eusebius-lee-audit-rock-keys-5", "synoptic-peter-rock-keys", /Matthew and Mark/i, /keys.*kingdom/i, /Peter and Jesus/i],
  ] as const;
  for (const [id, target, note, source, speaker] of cases) {
    const figure = byId.get(id);
    assert.ok(figure, id);
    assert.ok([figure.related, ...(figure.relatedAlso ?? [])].includes(target), id);
    assert.match(figure.note ?? "", note, id);
    assert.match(figure.speaker, speaker, id);
    assert.match(texts[id]?.join(" ") ?? "", source, id);
    assert.match(earlyFigureHref(figure), /eusebiusbishopof00euse\.pdf#page=\d+$/, id);
  }
  const { SYNOPTIC_FIGURES } = await import("../src/lib/jesus/synoptic-figures");
  const { JOHN_FIGURES } = await import("../src/lib/jesus/john-figures");
  const refs = (id: string) => [...SYNOPTIC_FIGURES, ...JOHN_FIGURES].find(figure => figure.id === id)!.accounts.map(account => account.ref);
  assert.deepEqual(refs("synoptic-peter-rock-keys"), ["MAT 16:18-19"]);
  assert.deepEqual(refs("synoptic-coming-lightning"), ["MAT 24:23-27", "LUK 17:23-24"]);
  assert.ok(refs("synoptic-hidden-revealed").includes("MAT 10:26-27"));
  assert.ok(refs("synoptic-keys-entry").includes("MAT 23:14"));
  assert.equal(JOHN_FIGURES.find(figure => figure.id === "john-lamb-god")?.speaker, "John the Baptist");
  const matthew = JSON.parse(await (await import("node:fs/promises")).readFile("public/scriptures/text/web/MAT.json", "utf8"));
  assert.match(matthew.chapters[22][13], /shut up the Kingdom/i);
});
