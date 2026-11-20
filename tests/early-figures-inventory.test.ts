import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import figures from "../public/jesus/early-figures.json";
import expected from "./fixtures/early-figures-inventory.json";
import comparisons from "../scripts/release/early-round3-comparisons.json";
import corrections from "./fixtures/lightfoot-corrections.json";
import { EARLY_FIGURES, earlyFigureHref, originalEarlyContinuationHref, originalEarlyReaderHref, validOriginalEarlyReader } from "../src/lib/jesus/early-figures";
import { getEarlyFigureTexts, getEarlyOriginalReaderAvailability } from "../src/lib/jesus/early-figures-server";

type Selection = { id: string; edition: string; section: string; start: number; end: number; speaker: string; related?: string | null; relatedAlso?: string[] };
const normalize = (selection: Selection) => ({
  id: selection.id, edition: selection.edition, section: selection.section,
  start: selection.start, end: selection.end, speaker: selection.speaker,
  related: selection.related ?? null, relatedAlso: selection.relatedAlso ?? [],
});

function checkSelection(actual: Selection, checked: Selection) {
  assert.deepEqual(normalize(actual), normalize(checked), checked.id);
}

test("the independent inventory accounts for each chapter and section", async () => {
  const shorter = await readFile("docs/plans/early-figures-inventory-short-ledger.md", "utf8");
  for (const [heading, end] of [["Didache 1–16", 16], ["1 Clement 1–65", 65], ["Barnabas 1–21", 21], ["Diognetus 1–12", 12]] as const) {
    const section = shorter.split(`## ${heading}\n`)[1]?.split("\n## ")[0];
    assert.ok(section, heading);
    assert.deepEqual([...section.matchAll(/^- \*\*(\d+)\.\*\*/gm)].map(match => Number(match[1])), Array.from({ length: end }, (_, i) => i + 1), heading);
  }
  const acts = await readFile("docs/plans/early-figures-inventory-acts-ledger.md", "utf8");
  const sections = acts.split("## Numbered ledger\n")[1]?.split("\n## ")[0];
  assert.ok(sections);
  assert.deepEqual([...sections.matchAll(/^(\d+)\. \*\*/gm)].map(match => Number(match[1])), Array.from({ length: 170 }, (_, i) => i + 1));

  const reconciled = [shorter, acts].map(text => text.split("## Reconciliation after the snapshot\n")[1]).join("\n");
  for (const figure of figures.slice(102, 162)) assert.ok(reconciled.includes(`\`${figure.id}\``), figure.id);
});

test("checked selections retain their ranges, speakers and comparison targets", () => {
  for (const item of expected) {
    const matches = figures.filter(figure => figure.id === item.id);
    assert.equal(matches.length, 1, item.id);
    checkSelection(matches[0], item);
    for (const target of [item.related, ...item.relatedAlso].filter(Boolean)) {
      assert.ok(comparisons.some(comparison => comparison.id === target && comparison.figures.includes(item.id)), `${item.id} / ${target}`);
    }
  }
  const checked = expected.find(item => item.id === "acts-thomas-bread-life")!;
  for (const wrong of [
    { ...checked, end: 0 },
    { ...checked, speaker: "Jesus" },
    { ...checked, related: null },
  ]) assert.throws(() => checkSelection(wrong, checked));
});

test("corrected excerpts contain only the independently recorded changes", async () => {
  const corrected = EARLY_FIGURES.filter(figure => corrections.some(item => item.id === figure.id));
  assert.equal(corrected.length, 14);
  assert.deepEqual(new Set(corrections.map(item => item.id)), new Set(corrected.map(item => item.id)));
  const texts = await getEarlyFigureTexts(corrected);
  for (const figure of corrected) {
    const original = figure.originalReader!;
    const page = JSON.parse(await readFile(`content/early-library/readings/${original.edition}/${original.section}.json`, "utf8"));
    let expectedText = page.blocks.slice(original.start - 1, original.end).map((block: { text: string }) => block.text).join("\n\n");
    for (const change of corrections.filter(item => item.id === figure.id)) {
      assert.equal(expectedText.split(change.before).length, 2, `${figure.id}: ${change.before}`);
      expectedText = expectedText.replace(change.before, change.after);
      assert.ok(change.printedPages);
    }
    assert.deepEqual(texts[figure.id], [expectedText], figure.id);
    assert.match(figure.note ?? "", /corrects identified transcription errors against the 1891 printed edition/i);
    assert.equal(earlyFigureHref(figure), "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf");
    assert.equal(originalEarlyReaderHref(figure), `/early/library/${original.edition}/${original.section}#p${original.start}`);
  }
});

test("a corrected excerpt is independent of the original edition's publication status and fails closed alone", async () => {
  const corrected = EARLY_FIGURES.find(item => item.id === "first-clement-pillars")!;
  const original = EARLY_FIGURES.find(item => item.id === "first-clement-seed")!;
  const loader = async (file: string) => {
    const raw = await readFile(file, "utf8");
    if (!file.endsWith("catalog.json")) return raw;
    const catalog = JSON.parse(raw);
    catalog.find((item: { id: string }) => item.id === "1-clement").publicationStatus = "deferred";
    return JSON.stringify(catalog);
  };
  const result = await getEarlyFigureTexts([corrected, original], loader, () => {});
  assert.ok(result[corrected.id]);
  assert.equal(result[original.id], null);
  assert.equal((await getEarlyOriginalReaderAvailability([corrected], loader))[corrected.id], false);
  assert.equal((await getEarlyOriginalReaderAvailability([corrected]))[corrected.id], true);
  const duplicateLoader = async (file: string) => {
    const raw = await readFile(file, "utf8");
    if (!file.endsWith("catalog.json")) return raw;
    const catalog = JSON.parse(raw);
    const published = catalog.find((item: { id: string }) => item.id === "1-clement");
    catalog.unshift({ ...published, publicationStatus: "deferred" });
    return JSON.stringify(catalog);
  };
  assert.equal((await getEarlyOriginalReaderAvailability([corrected], duplicateLoader))[corrected.id], false);
  for (const originalReader of [
    { ...corrected.originalReader!, edition: "barnabas" },
    { ...corrected.originalReader!, section: "1-clem-6" },
    { ...corrected.originalReader!, end: corrected.originalReader!.end + 1 },
  ]) {
    const wrong = { ...corrected, originalReader };
    assert.equal(validOriginalEarlyReader(wrong), false);
    assert.equal(originalEarlyReaderHref(wrong), null);
    assert.equal((await getEarlyFigureTexts([wrong], undefined, () => {}))[wrong.id], null);
    assert.equal((await getEarlyOriginalReaderAvailability([wrong]))[wrong.id], false);
  }
  for (const mode of ["missing", "malformed", "changed"]) {
    const load = async (file: string) => {
      if (!file.endsWith(`${corrected.edition}.json`)) return readFile(file, "utf8");
      if (mode === "missing") throw Error("missing");
      if (mode === "malformed") return "{";
      const page = JSON.parse(await readFile(file, "utf8")); page.blocks[0].text += " changed"; return JSON.stringify(page);
    };
    const texts = await getEarlyFigureTexts([corrected, original], load, () => {});
    assert.equal(texts[corrected.id], null, mode);
    assert.ok(texts[original.id], mode);
    assert.ok(earlyFigureHref(corrected));
    assert.ok(originalEarlyReaderHref(corrected));
    assert.ok(corrected.note);
  }
});

test("Hermas continuation links use pinned sections and availability is independent", async () => {
  for (const [id, first, section] of [
    ["hermas-tower-explanation", "vision-3", "vision-3-part-2"],
    ["hermas-vineyard-servant-explanation", "another-parable", "another-parable-part-2"],
  ]) {
    const figure = EARLY_FIGURES.find(item => item.id === id)!;
    assert.equal(originalEarlyContinuationHref(figure), `/early/library/shepherd-hermas/${section}#p1`);
    const available = await getEarlyOriginalReaderAvailability([figure]);
    assert.equal(available[id], true);
    assert.equal(available[`${id}:continuation`], true);
    const missing = (name: string) => async (file: string) => {
      if (file.endsWith(`/shepherd-hermas/${name}.json`)) throw Error("missing");
      return readFile(file, "utf8");
    };
    const noFirst = await getEarlyOriginalReaderAvailability([figure], missing(first));
    assert.equal(noFirst[id], false);
    assert.equal(noFirst[`${id}:continuation`], true);
    const noContinuation = await getEarlyOriginalReaderAvailability([figure], missing(section));
    assert.equal(noContinuation[id], true);
    assert.equal(noContinuation[`${id}:continuation`], false);
    const changed = async (file: string) => {
      const raw = await readFile(file, "utf8");
      if (!file.endsWith(`/shepherd-hermas/${section}.json`)) return raw;
      const page = JSON.parse(raw);
      page.blocks[0].text = page.blocks[0].text.replace(/\S/, "X");
      return JSON.stringify(page);
    };
    const corrupted = await getEarlyOriginalReaderAvailability([figure], changed);
    assert.equal(corrupted[id], true);
    assert.equal(corrupted[`${id}:continuation`], false);
    assert.equal(originalEarlyContinuationHref({ ...figure, originalReader: { ...figure.originalReader!, section: "vision-1" } }), null);
  }
  assert.equal(originalEarlyContinuationHref(EARLY_FIGURES.find(item => item.id === "first-clement-pillars")!), null);
});
