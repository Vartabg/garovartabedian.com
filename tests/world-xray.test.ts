import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import snapshot from "../public/meta/site-xray.json";
import { getDemons, getEncounters, getFall, getLexicon } from "../src/lib/angels/server";
import { getLibrary } from "../src/lib/early/library-server";
import { EARLY_TEXTS } from "../src/lib/early/client";
import { getClaimRegistry, getEvidenceData } from "../src/lib/evidence/server";
import { getSent, getTwelve } from "../src/lib/apostles/server";
import { churchSpineForks, getChurchRoad, getEarlyTimeline, getWordData } from "../src/lib/public-json";
import { CORPUS_HEALTH } from "../src/lib/site/corpus-health";
import {
  angelsFacts, apostlesFacts, churchFacts, earlyFacts, evidenceFacts, jesusFacts, scripturesFacts, wordFacts, worldSnapshotLine, worldXrayTag,
} from "../src/lib/site/world-xray";

const json = (file: string) => JSON.parse(readFileSync(file, "utf8"));
const n = (value: number) => value.toLocaleString("en-US");

// Every number on a world home's "Built from" tag is recomputed here from the
// same data, so the test fails when the data changes; that is the point.
test("the Scriptures home counts what the corpus-health snapshot counts", () => {
  const { facts, detail } = scripturesFacts(CORPUS_HEALTH);
  const c = CORPUS_HEALTH.corpus;
  assert.deepEqual(facts, [
    `${c.books.hostedIds} hosted books`,
    `${c.traditions.count} traditions`,
    `${c.translations.count} translations`,
    `${n(c.books.unionChapterSlots)} chapter slots`,
    `${n(c.crossReferences.targets)} cross-reference targets from ${n(c.crossReferences.sourceVerses)} verses`,
    `${n(c.topics.count)} topics`,
  ]);
  assert.ok(detail[0].includes(`${c.guides.review.humanReviewed} human-reviewed`));
  assert.ok(detail[0].includes(`${c.guides.batchTemplateGuides} still on the batch template`));
});

test("the Jesus home counts the life-lens index", () => {
  const lenses = json("public/jesus/life-lenses.json");
  assert.deepEqual(jesusFacts(lenses).facts, [`${lenses.moments.length} moments on the life map`, `${lenses.places.length} places`, `${lenses.eras.length} eras`]);
});

test("the Apostles home counts the twelve and the sending", () => {
  const twelve = getTwelve();
  const sent = getSent();
  const { facts } = apostlesFacts(twelve, sent);
  assert.equal(facts[0], twelve.apostles.length > 12 ? `${twelve.apostles.length} records: the Twelve and ${twelve.apostles.length - 12} chosen later` : `${twelve.apostles.length} records`);
  assert.equal(facts[1], `${twelve.lists.length} New Testament lists`);
  assert.equal(facts[2], `${sent.rays.length} sendings placed on the map, ${sent.unplaced.length} unplaced`);
  assert.equal(facts[3], `${sent.cities.length} cities`);
  assert.equal(facts[4], `${sent.routes.length} routes`);
});

test("the Early Writings home counts the shelf, the timeline and the library", async () => {
  const library = await getLibrary();
  const timeline = getEarlyTimeline();
  const { facts } = earlyFacts(EARLY_TEXTS.length, timeline, library);
  const words = library.reduce((sum, record) => sum + (record.sourceWords || 0), 0);
  const withChecksum = library.filter((record) => record.sourceSha256).length;
  assert.equal(facts[0], `${EARLY_TEXTS.length} shelf texts`);
  assert.equal(facts[1], `${timeline.items.length} dated items on the timeline`);
  assert.equal(facts[2], `${library.length} library editions of ${new Set(library.map((r) => r.workId)).size} works`);
  assert.equal(facts[3], `${n(words)} source words`);
  assert.equal(facts[4], `${withChecksum} editions carry a source checksum, ${library.length - withChecksum} do not`);
});

test("the Church home counts the road, the forks and both kinds of checked link", () => {
  const road = getChurchRoad();
  const forks = churchSpineForks();
  const links = json("public/church/road-links.json");
  const { facts, detail } = churchFacts(road, forks, links);
  const scripture = links.steps.filter((step: { refs: unknown[] }) => step.refs.length > 0).length;
  const writings = links.steps.filter((step: { textIds: unknown[] }) => step.textIds.length > 0).length;
  assert.equal(facts[0], `${road.eras.length} eras`);
  assert.equal(facts[1], `${road.eras.reduce((sum, era) => sum + era.steps.length, 0)} steps on the road`);
  assert.equal(facts[2], `${forks.length} forks from the tree`);
  assert.equal(facts[3], `checked links on ${links.steps.length} steps: Scripture on ${scripture}, hosted writings on ${writings}`);
  assert.ok(scripture < links.steps.length, "the wording must not claim Scripture links on every step");
  assert.ok(detail[0].startsWith(links.method.slice(0, 40)));
});

test("the Word home counts the ledger, including its placeholders", () => {
  const data = getWordData();
  const { facts } = wordFacts(data);
  const placeholders = data.ledger.entries.filter((entry) => entry.status === "placeholder").length;
  assert.ok(facts[0].startsWith(`${data.ledger.entries.length} translations in the ledger`));
  assert.ok(facts[0].includes(`${placeholders} placeholder`));
  assert.equal(facts[1], `${data.fenced.length} fenced, ${data.free.length} free`);
  assert.equal(facts[2], `${data.ledger.sources.length} sources`);
  assert.equal(facts[3], `${data.hosted.count} hosted on this site`);
});

test("the Angels home repeats the stats the page computes, in the page's own words", () => {
  const stats = {
    fallFragments: getFall().steps.length,
    appearances: getEncounters().appeared.length,
    confrontations: getEncounters().castOut.length,
    namedDemons: getDemons().demons.length,
    vocabularyTerms: getLexicon().totals.terms,
    vocabularyOccurrences: getLexicon().totals.tokens,
  };
  const { facts } = angelsFacts(stats);
  assert.deepEqual(facts, [
    `${stats.fallFragments} fall fragments`,
    `${stats.appearances} appearances`,
    `${stats.confrontations} confrontations`,
    `${stats.namedDemons} named source entries`,
    `${stats.vocabularyTerms} vocabulary terms in ${n(stats.vocabularyOccurrences)} occurrences`,
  ]);
  assert.ok(!facts.some((fact) => /\bdemons\b/.test(fact)), "the page counts source entries, not demons");
});

test("the Evidence home counts the claim registry by axis, with each axis's own grades", () => {
  const data = getEvidenceData();
  const registry = getClaimRegistry();
  const { facts, detail } = evidenceFacts(data, registry.claims, registry.generatedBy);
  const attestation = registry.claims.filter((claim) => claim.basis.axis === "attestation");
  const textual = registry.claims.filter((claim) => claim.basis.axis === "textual");
  const late = attestation.filter((claim) => claim.basis.grade === "late").length;
  assert.equal(facts[0], `${registry.claims.length} claims in the registry`);
  const attestationLine = facts.find((fact) => fact.startsWith("attestation "));
  assert.ok(attestationLine?.startsWith(`attestation ${attestation.length} (`));
  assert.ok(attestationLine?.includes(`late ${late}`));
  assert.ok(facts.some((fact) => fact.startsWith(`textual ${textual.length} (`)));
  assert.ok(facts.includes(`${data.rooms.length} rooms`));
  assert.ok(facts.includes(`${data.claimLab.length} claim-lab cases`));
  assert.ok(facts.includes(`${data.sources.length} sources`));
  assert.deepEqual(detail, ["The registry is generated by build-claims.mjs."]);
});

test("the standard line says only what was counted", () => {
  assert.equal(worldSnapshotLine("word"), `${snapshot.worlds.word.publicJson} JSON files published under its public folder; no scripts folder of its own.`);
  assert.ok(worldSnapshotLine("scriptures").endsWith(`${snapshot.worlds.scriptures.scripts} script files under its scripts folder.`));
  assert.equal(worldSnapshotLine("jesus", {}), "no JSON files published under its public folder; no scripts folder of its own.");
  const tag = worldXrayTag("jesus", { facts: ["40 moments"], detail: ["x"] });
  assert.equal(tag.id, "world");
  assert.equal(tag.label, "Built from");
  assert.equal(tag.detail.length, 2);
  for (const line of [...tag.facts, ...tag.detail]) assert.doesNotMatch(line, /\/Users\/|https?:/);
});
