import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { quotesHostedText } from "../scripts/scriptures/guide-validation.mjs";
import type {
  DemonsData,
  EncountersData,
  FallData,
  OrderData,
  TeachingData,
} from "../src/lib/angels/types";
import { parseRef } from "../src/lib/scriptures/refs";
import type { Canons } from "../src/lib/scriptures/types";

/**
 * The Angels & Demons world tells the reader its quotations are the hosted
 * text's own words. Until now nothing checked that, and five of the
 * eighty-odd quotes were paraphrases wearing a verse number. This holds
 * every quote in public/angels to the same rule the chapter guides live
 * under: it must appear, in order and on word boundaries, in the hosted
 * translation the reference points at. Fragments may be joined with an
 * ellipsis; nothing else may be changed.
 */

const readJson = <T,>(file: string): T => JSON.parse(readFileSync(file, "utf8")) as T;
const canons = readJson<Canons>("public/scriptures/canons.json");

const order = readJson<OrderData>("public/angels/order.json");
const demons = readJson<DemonsData>("public/angels/demons.json");
const fall = readJson<FallData>("public/angels/fall.json");
const encounters = readJson<EncountersData>("public/angels/encounters.json");
const teaching = readJson<TeachingData>("public/angels/teaching.json");

type Quotation = { where: string; ref: string; quote: string };

/** Every quotation the world presents as the text's own words, with its reference. */
const quotations: Quotation[] = [
  ...order.named.map((n) => ({ where: `order.named ${n.name}`, ref: n.quoteRef, quote: n.quote })),
  ...order.enemyNames.map((e) => ({ where: `order.enemyNames ${e.title}`, ref: e.ref, quote: e.quote })),
  ...demons.demons.map((d) => ({ where: `demons ${d.id}`, ref: d.quoteRef, quote: d.quote })),
  ...fall.steps.flatMap((s) => [
    ...(s.ref ? [{ where: `fall ${s.id}`, ref: s.ref, quote: s.quote }] : []),
    ...(s.second?.ref ? [{ where: `fall ${s.id} (second)`, ref: s.second.ref, quote: s.second.quote }] : []),
  ]),
  ...encounters.appeared.flatMap((a) =>
    a.quote ? [{ where: `encounters.appeared ${a.ref}`, ref: a.ref, quote: a.quote }] : [],
  ),
  ...encounters.castOut.flatMap((x) =>
    x.theySaid ? [{ where: `encounters.castOut ${x.ref}`, ref: x.ref, quote: x.theySaid }] : [],
  ),
  ...teaching.entries.map((t) => ({ where: `teaching ${t.id}`, ref: t.ref, quote: t.quote })),
];

/** Every reference the world links a reader to. */
const references: { where: string; ref: string }[] = [
  ...quotations.map(({ where, ref }) => ({ where, ref })),
  ...order.bands.flatMap((b) => b.refs.map((ref) => ({ where: `order.bands ${b.id}`, ref }))),
  ...order.named.flatMap((n) => n.refs.map((ref) => ({ where: `order.named ${n.name}`, ref }))),
  ...demons.demons.flatMap((d) => d.refs.map((ref) => ({ where: `demons ${d.id}`, ref }))),
  ...encounters.appeared.map((a) => ({ where: "encounters.appeared", ref: a.ref })),
  ...encounters.castOut.flatMap((x) => [
    { where: "encounters.castOut", ref: x.ref },
    ...x.parallels.map((ref) => ({ where: `encounters.castOut ${x.ref} parallel`, ref })),
  ]),
];

const hostedCache = new Map<string, string[][] | null>();
const hostedChapters = (translation: string, book: string) => {
  const key = `${translation}/${book}`;
  if (!hostedCache.has(key)) {
    const file = `public/scriptures/text/${translation}/${book}.json`;
    hostedCache.set(
      key,
      existsSync(file) ? (readJson<{ chapters: string[][] }>(file).chapters ?? null) : null,
    );
  }
  return hostedCache.get(key) ?? null;
};

const translationsFor = (book: string) => canons.books[book]?.trans ?? ["web"];

test("every Angels & Demons reference parses and lands inside a hosted chapter", () => {
  const failures: string[] = [];
  for (const { where, ref } of references) {
    const parsed = parseRef(ref);
    if (!parsed) {
      failures.push(`${where}: ${ref} does not parse`);
      continue;
    }
    if (!canons.books[parsed.book]) {
      failures.push(`${where}: ${ref} names a book the site does not host`);
      continue;
    }
    const chapters = translationsFor(parsed.book)
      .map((translation) => hostedChapters(translation, parsed.book))
      .find((value) => value !== null);
    const verses = chapters?.[parsed.chapter - 1];
    if (!verses) {
      failures.push(`${where}: ${ref} points at a chapter that is not hosted`);
      continue;
    }
    if ((parsed.endVerse ?? parsed.verse) > verses.length) {
      failures.push(`${where}: ${ref} runs past verse ${verses.length}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("every quotation is the hosted text's own words", () => {
  assert.ok(quotations.length >= 80, `expected the full quotation set, saw ${quotations.length}`);
  const failures: string[] = [];
  for (const { where, ref, quote } of quotations) {
    const parsed = parseRef(ref);
    if (!parsed) continue; // reported by the reference test above
    const matched = translationsFor(parsed.book).some((translation) => {
      const verses = hostedChapters(translation, parsed.book)?.[parsed.chapter - 1];
      if (!verses) return false;
      const hosted = verses.slice(parsed.verse - 1, parsed.endVerse ?? parsed.verse).join(" ");
      return quotesHostedText(hosted, quote);
    });
    if (!matched) {
      failures.push(`${where} (${ref}): “${quote.slice(0, 72)}${quote.length > 72 ? "…" : ""}”`);
    }
  }
  assert.deepEqual(
    failures,
    [],
    `quotations that are not the hosted text's words:\n  ${failures.join("\n  ")}`,
  );
});

test("a fall fragment drawn from a hosted book cites it as one", () => {
  // 1 Enoch is hosted (Charles 1917, Ethiopian shelf). A fragment quoted from
  // it must carry a site ref so the quotation is checked like every other and
  // the reader can open the chapter here, not only on an outside page.
  for (const step of fall.steps) {
    const book = /^1 Enoch (\d+):(\d+)/.exec(step.cite);
    if (!book) continue;
    assert.ok(step.ref, `${step.id}: quotes hosted 1 Enoch without a site ref`);
    assert.equal(parseRef(step.ref)?.book, "ENO", step.id);
  }
});
