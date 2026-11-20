import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { linkedThomasSayings, parablesXrayTags } from "../src/lib/jesus/parables-xray";

const json = (file: string) => JSON.parse(readFileSync(file, "utf8"));
const parables = json("public/jesus/parables.json");
const synoptic = json("public/jesus/synoptic-figures.json");
const john = json("public/jesus/john-figures.json");
const thomas = json("public/jesus/thomas-parables.json");
const james = json("public/jesus/james-parables.json");
const early = json("public/jesus/early-figures.json");

const base = {
  parables, synoptic, john, thomas,
  checked: { a: ["text"], b: ["text"], c: null },
  writings: 2,
  counts: { MAT: { parabole: 17, paroimia: 0 }, MRK: { parabole: 13, paroimia: 0 }, LUK: { parabole: 18, paroimia: 0 }, JHN: { parabole: 0, paroimia: 4 } },
  scanned: { words: 64499, chapters: 89 },
};

// Every number is recomputed here from the same JSON, so the test fails when the data changes.
test("Built from counts the Gospel entries and accounts in the JSON", () => {
  const { built } = parablesXrayTags(base, 75);
  const stories = parables.filter((p: { kind: string }) => p.kind === "story").length;
  const gospel = [...parables, ...synoptic, ...john];
  const accounts = gospel.reduce((sum: number, e: { accounts?: unknown[] }) => sum + (e.accounts?.length ?? 0), 0);
  const multi = gospel.filter((e: { accounts?: unknown[] }) => (e.accounts?.length ?? 0) > 1).length;
  assert.equal(built.label, "Built from");
  assert.equal(built.facts[0], `${parables.length} Gospel parables: ${stories} stories, ${parables.length - stories} sayings the text calls parables`);
  assert.equal(built.facts[3], `${accounts} Gospel accounts, ${multi} entries told in more than one Gospel`);
  assert.equal(built.facts[4], `${thomas.length + 3} passages from early writings outside the canon`);
  assert.match(built.detail[1], /^Entries link 75 Gospel of Thomas sayings\./);
});

test("Checked reports shown and withheld passages from the check results", () => {
  const { checked } = parablesXrayTags(base, 75);
  assert.deepEqual(checked.facts, ["3 passages from 2 writings matched against a SHA-256 fingerprint of their source paragraphs", "2 shown, 1 withheld"]);
});

test("Counted reports the lemma tallies and how much text was read", () => {
  const { counted } = parablesXrayTags(base, 75);
  assert.deepEqual(counted.facts, ["parabolē: Matthew 17, Mark 13, Luke 18, John 0", "paroimia in John: 4", "from 64,499 Greek words in 89 chapters"]);
});

test("linked Thomas sayings are the distinct sayings across every list", () => {
  const all = new Set<number>([...parables, ...synoptic, ...john, ...james, ...early].flatMap((e: { thomas?: { saying: number }[] }) => (e.thomas ?? []).map((t) => t.saying)));
  for (const story of thomas) all.add(story.saying);
  assert.equal(linkedThomasSayings({ parables, synoptic, john, thomas }, [...james, ...early]), all.size);
});
