#!/usr/bin/env node
/**
 * Build the guided walks the front door offers.
 *
 * The site's rooms are all built, and the front door is a directory of them.
 * A visitor with no background gets eight doors and no sequence — which is a
 * menu, not a way in. These are named walks that chain rooms and chapters that
 * already exist into something with a start and an end.
 *
 * The steps are authored, because deciding that the last week is worth reading
 * as a unit is a judgement no script makes. Everything about them that can be
 * checked, is: every scripture step must name a book in that tradition and a
 * chapter inside it, every hosted-writing step must name a text on the shelf,
 * and every room must have a page on disk. A walk that points anywhere the
 * site does not go fails the build rather than shipping a dead end.
 *
 * Output: public/meta/reading-paths.json — plain links, rendered server-side.
 *
 * Usage: npm run data:paths
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeStableJson } from "./stable-stamp.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "public/meta/reading-paths.json");

const canons = JSON.parse(
  fs.readFileSync(path.join(ROOT, "public/scriptures/canons.json"), "utf8"),
);
const earlyIds = new Set(
  fs
    .readdirSync(path.join(ROOT, "public/early/texts"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, "")),
);

/** A scripture step. `through` names a span; the link opens its first chapter. */
const read = (book, chapter, note, through) => ({
  kind: "scripture",
  book,
  chapter,
  through,
  note,
});
const room = (href, label, note) => ({ kind: "room", href, label, note });
// `label` overrides the hosted long title: the shelf shows "1 Clement",
// not "The First Epistle of Clement to the Corinthians".
const text = (id, label, note) => ({ kind: "early", id, label, note });

/**
 * Five walks. Each is a sequence someone could actually finish in a sitting or
 * two, and each ends somewhere that invites the next one.
 */
const PATHS = [
  {
    id: "last-week",
    title: "The last week",
    line: "Mark's account of the final days, then the same events on the map and the record of what followed.",
    steps: [
      read("MRK", 11, "He enters Jerusalem and clears the temple.", "MRK 11-13"),
      read("MRK", 14, "The supper, the arrest, the trial by night."),
      read("MRK", 15, "The crucifixion, told with almost no commentary."),
      read("MRK", 16, "The empty tomb — and an ending the manuscripts disagree about."),
      room("/jesus/life", "The life map", "The same week, placed where it happened."),
      room("/jesus/risen", "After the cross", "Every resurrection appearance, and where the accounts differ."),
    ],
  },
  {
    id: "his-own-words",
    title: "In his own words",
    line: "Start with what he actually said, then follow one saying down to the Greek and out to its parallels.",
    steps: [
      room("/jesus/words", "His words", "Every verse in which he speaks, book by book."),
      read("MAT", 5, "The Sermon on the Mount opens.", "MAT 5-7"),
      read("LUK", 15, "Three parables about what was lost."),
      read("JHN", 14, "The last long conversation before the arrest.", "JHN 14-17"),
      room("/scriptures/topics", "Follow a subject", "Where a theme runs through the rest of the text."),
    ],
  },
  {
    id: "first-generation",
    title: "The first generation after",
    line: "What the people who came immediately next actually wrote, in their own words.",
    steps: [
      text("didache", "The Didache", "The oldest church manual: baptism, the meal, how to spot a fraud."),
      text("1clement", "1 Clement", "Rome writes to a divided Corinth, within living memory of the apostles."),
      text("ignatius-romans", "Ignatius — To the Romans", "A bishop on the road to execution, begging Rome not to save him."),
      text("martyrdom-polycarp", "The Martyrdom of Polycarp", "The earliest martyrdom account outside the New Testament."),
      room("/early", "The whole shelf", "Twenty-three texts, dated and sourced."),
      room("/church/tree", "What became of the church", "How one movement became many."),
    ],
  },
  {
    id: "how-we-know",
    title: "How we know any of it",
    line: "The evidence and its limits — what the sources support, what they don't, and where scholars disagree.",
    steps: [
      room("/evidence", "How we know", "The method, and every graded claim on the site."),
      room("/jesus/history", "Outside the Gospels", "What non-Christian writers recorded, and how early."),
      room("/apostles/twelve", "The twelve", "What is known about each, weighted by how early the source is."),
      room("/word", "Who owns the word", "Who holds the rights to the translations you read."),
    ],
  },
  {
    id: "where-it-starts",
    title: "Where the story starts",
    line: "The beginning the rest of the record keeps returning to, and the passage the first Christians read as a description of the cross.",
    steps: [
      read("GEN", 1, "The world made, and called good.", "GEN 1-2"),
      read("GEN", 3, "What went wrong, and the first promise after it."),
      room("/angels/fall", "The fall", "Every text the tradition assembles into that story, graded."),
      read("ISA", 53, "The suffering servant — quoted more than almost any other passage."),
      room("/jesus/prophecy", "Prophecy and fulfilment", "The pairs, with the wording on both sides."),
    ],
  },
];

/** Resolve a step to a link, failing loudly if it points nowhere real. */
function resolveStep(step, pathId, failures) {
  const where = `${pathId}`;
  if (step.kind === "scripture") {
    const meta = canons.books[step.book];
    if (!meta) {
      failures.push(`${where}: unknown book ${step.book}`);
      return null;
    }
    if (!Number.isInteger(step.chapter) || step.chapter < 1 || step.chapter > meta.chapters) {
      failures.push(`${where}: ${step.book} ${step.chapter} is outside the book`);
      return null;
    }
    const tradition = canons.traditions.find((t) => t.books.includes(step.book));
    if (!tradition) {
      failures.push(`${where}: no hosted tradition carries ${step.book}`);
      return null;
    }
    return {
      href: `/scriptures/${tradition.id}/${step.book}/${step.chapter}`,
      label: step.through
        ? step.through.replace(step.book, meta.name)
        : `${meta.name} ${step.chapter}`,
      note: step.note,
    };
  }

  if (step.kind === "early") {
    if (!earlyIds.has(step.id)) {
      failures.push(`${where}: ${step.id} is not a hosted writing`);
      return null;
    }
    const source = JSON.parse(
      fs.readFileSync(path.join(ROOT, "public/early/texts", `${step.id}.json`), "utf8"),
    );
    return { href: `/early/${step.id}`, label: step.label ?? source.title, note: step.note };
  }

  const segments = step.href.split("/").filter(Boolean);
  if (!fs.existsSync(path.join(ROOT, "src/app", ...segments, "page.tsx"))) {
    failures.push(`${where}: ${step.href} has no page`);
    return null;
  }
  return { href: step.href, label: step.label, note: step.note };
}

export function buildReadingPaths() {
  const failures = [];
  const seen = new Set();
  const paths = PATHS.map((entry) => {
    if (seen.has(entry.id)) failures.push(`duplicate path id ${entry.id}`);
    seen.add(entry.id);
    if (entry.steps.length < 3) failures.push(`${entry.id}: a walk needs at least three steps`);
    return {
      id: entry.id,
      title: entry.title,
      line: entry.line,
      steps: entry.steps.map((step) => resolveStep(step, entry.id, failures)).filter(Boolean),
    };
  });

  if (failures.length > 0) {
    throw new Error(`reading paths point somewhere the site does not go:\n  ${failures.join("\n  ")}`);
  }
  return paths;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const paths = buildReadingPaths();
  writeStableJson(OUT, {
    schemaVersion: 1,
    generatedBy: "scripts/site/build-reading-paths.mjs",
    generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, ".000Z"),
    paths,
  });
  const steps = paths.reduce((sum, p) => sum + p.steps.length, 0);
  console.log(`${paths.length} reading paths · ${steps} steps, every one resolved`);
}
