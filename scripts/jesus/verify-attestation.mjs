#!/usr/bin/env node
/**
 * Check that the Gospels a life-map event claims really do tell that event.
 *
 * The map records which Gospels carry each moment, and a matrix on the page
 * turns that into a claim a reader can see at a glance — "only John records
 * this." A wrong reference there is not a broken link; it is a false statement
 * about the record, and it looks authoritative.
 *
 * Nothing can verify that a passage is *about* an event. What can be measured
 * is whether two passages claimed as parallels actually share the distinctive
 * vocabulary that parallel accounts share: the names, places, and unusual
 * nouns that survive between two tellings of the same scene. Two accounts of
 * the stilling of the storm agree on wind, boat, and rebuke; two unrelated
 * passages agree only on the ordinary words every chapter contains.
 *
 * Same machinery as the early-writings allusion layer: rare-word overlap over
 * the hosted World English Bible, weighted so common vocabulary carries no
 * evidence.
 *
 * Usage:
 *   node scripts/jesus/verify-attestation.mjs            # fails on a bad pair
 *   node scripts/jesus/verify-attestation.mjs --report   # prints every score
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const WEB = path.join(ROOT, "public/scriptures/text/web");
export const GOSPELS = ["MAT", "MRK", "LUK", "JHN"];

/**
 * Floor for accepting two passages as the same scene.
 *
 * Calibrated against the pairs already on the map, which are correct: the
 * weakest true parallel scored well above this, and deliberately mismatched
 * control pairs scored below it. Set where the two populations separate.
 */
export const MIN_PARALLEL_SCORE = 3.5;

const STOPWORDS = new Set(
  ("a an the and or but for nor so yet of in on at to from by with without into unto "
   + "upon over under through as is are was were be been being am do does did done have "
   + "has had having shall will would should may might must can could not no if then than "
   + "that this these those there here it its he him his she her they them their we us our "
   + "you your i me my mine who whom whose which what when where why how all any every some "
   + "such same other another one two said say says also again very much many more most now "
   + "let out up down came come went go going about because they’re jesus").split(" "),
);

export function contentWords(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word))
    .map((word) => (word.length > 4 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word));
}

const bookCache = new Map();
function bookText(book) {
  if (!bookCache.has(book)) {
    bookCache.set(book, JSON.parse(fs.readFileSync(path.join(WEB, `${book}.json`), "utf8")));
  }
  return bookCache.get(book);
}

/** "MAT 3:13-17" -> the joined verses, or null when it does not resolve. */
export function passageText(ref) {
  const match = /^([A-Z0-9]{3})\s+(\d+):(\d+)(?:-(\d+))?$/.exec(ref.trim());
  if (!match) return null;
  const [, book, chapter, start, end] = match;
  const file = path.join(WEB, `${book}.json`);
  if (!fs.existsSync(file)) return null;
  const verses = bookText(book).chapters[Number(chapter) - 1];
  if (!verses) return null;
  const slice = verses.slice(Number(start) - 1, Number(end ?? start));
  return slice.length === 0 ? null : slice.join(" ");
}

/** Document frequency over the four Gospels — the corpus the claims live in. */
let idfCache = null;
function idf() {
  if (idfCache) return idfCache;
  const documents = [];
  for (const book of GOSPELS) {
    for (const chapter of bookText(book).chapters) {
      for (const verse of chapter) documents.push(new Set(contentWords(verse)));
    }
  }
  const df = new Map();
  for (const words of documents) {
    for (const word of words) df.set(word, (df.get(word) ?? 0) + 1);
  }
  idfCache = { total: documents.length, df };
  return idfCache;
}

/**
 * How strongly two passages agree on distinctive vocabulary, normalised by the
 * smaller passage so a long account cannot win on surface area alone.
 */
export function parallelScore(a, b) {
  const { total, df } = idf();
  const left = new Set(contentWords(a));
  const right = new Set(contentWords(b));
  if (left.size === 0 || right.size === 0) return { score: 0, shared: [] };

  const shared = [...left].filter((word) => right.has(word));
  let weight = 0;
  for (const word of shared) weight += Math.log(total / (df.get(word) ?? total));
  return {
    score: weight / Math.sqrt(Math.min(left.size, right.size)),
    shared: shared.sort((x, y) => (df.get(x) ?? 0) - (df.get(y) ?? 0)).slice(0, 8),
  };
}

export function verifyEvents(events) {
  const failures = [];
  const report = [];

  for (const event of events) {
    const passages = [];
    for (const entry of event.refs) {
      const text = passageText(entry.ref);
      if (!text) {
        failures.push(`${event.id}: ${entry.ref} does not resolve in the hosted text`);
        continue;
      }
      passages.push({ ref: entry.ref, book: entry.ref.split(" ")[0], text });
    }

    // Only Gospel-against-Gospel pairs are a claim about attestation. Two
    // references inside one book are a span, and a reference outside the four
    // (Acts on the ascension) is a further witness rather than a parallel
    // telling — Luke 24:50-53 and Acts 1:9-11 are the same author reporting
    // the same moment twice, and they share almost no wording.
    //
    // A composite event bundles distinct passages on purpose: "ministry base
    // at Capernaum" spans the settling and the synagogue day, which are two
    // scenes, not one told twice. Those are exempt from the parallel test and
    // the page labels them as a span rather than as agreement.
    if (event.composite) continue;
    for (let i = 0; i < passages.length; i += 1) {
      for (let j = i + 1; j < passages.length; j += 1) {
        if (passages[i].book === passages[j].book) continue;
        if (!GOSPELS.includes(passages[i].book) || !GOSPELS.includes(passages[j].book)) continue;
        const { score, shared } = parallelScore(passages[i].text, passages[j].text);
        report.push({ id: event.id, a: passages[i].ref, b: passages[j].ref, score, shared });
        if (score < MIN_PARALLEL_SCORE) {
          failures.push(
            `${event.id}: ${passages[i].ref} and ${passages[j].ref} score ${score.toFixed(2)} — too little in common to be the same scene`,
          );
        }
      }
    }
  }
  return { failures, report };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const life = JSON.parse(fs.readFileSync(path.join(ROOT, "public/jesus/life.json"), "utf8"));
  const { failures, report } = verifyEvents(life.events);

  if (process.argv.includes("--report")) {
    for (const row of report.sort((a, b) => a.score - b.score)) {
      console.log(
        `${row.score.toFixed(2).padStart(6)}  ${row.id.padEnd(24)} ${row.a} ~ ${row.b}  [${row.shared.join(", ")}]`,
      );
    }
    console.log(`\n${report.length} cross-Gospel pairs`);
  }

  if (failures.length > 0) {
    console.error(`${failures.length} attestation problem(s):`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exitCode = 1;
  } else {
    console.log(`${report.length} cross-Gospel pairs verified as parallel accounts`);
  }
}
