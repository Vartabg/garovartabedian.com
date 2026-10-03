#!/usr/bin/env node
/**
 * Give the church road its internal links.
 *
 * Sixty-two steps, and until now not one of them opened anything on this site.
 * A step that says "the Spirit descends on the disciples in Jerusalem (Acts 2)"
 * should be able to hand a reader Acts 2.
 *
 * Two kinds of link, produced two different ways, because only one of them can
 * be trusted to a machine:
 *
 *   refs     — Scripture references written out in the step's own text, parsed
 *              and then verified to resolve to a hosted chapter. Fully
 *              mechanical, and wrong only if the step's own citation is wrong.
 *
 *   textIds  — the hosted early writing a step is about. NOT matched by name.
 *              Name matching was tried and got two of four wrong: "Polycarp
 *              burned at Smyrna" matched Polycarp's letter to the Philippians
 *              rather than the Martyrdom that actually tells that story, and
 *              "Antioch — first called Christians" matched the Epistle of
 *              Barnabas on the strength of the man Barnabas in Acts 11. Those
 *              links are hand-checked below, and a step gets one only where the
 *              connection is not in doubt.
 *
 * Output: public/church/road-links.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ROAD = path.join(ROOT, "public/church/road.json");
const OUT = path.join(ROOT, "public/church/road-links.json");

const canons = JSON.parse(
  fs.readFileSync(path.join(ROOT, "public/scriptures/canons.json"), "utf8"),
);

/**
 * Hand-checked, one line each, and deliberately short. A step appears here
 * only when the hosted writing is the thing the step is describing — not
 * merely a text that mentions the same name.
 */
const CURATED_TEXT_IDS = {
  // Clement of Rome's letter to Corinth is the event this step records.
  "Rome writes to Corinth": ["1clement"],
  // The account of the burning is the Martyrdom, not Polycarp's own letter.
  "Polycarp burned at Smyrna": ["martyrdom-polycarp"],
  // The step is about the letters written on the road to Rome; the letter to
  // the Romans is the one that begs them not to intervene.
  "Ignatius and the one bishop": [
    "ignatius-romans",
    "ignatius-smyrnaeans",
    "ignatius-magnesians",
  ],
};

const BOOK_NAMES = new Map();
for (const [id, meta] of Object.entries(canons.books)) {
  BOOK_NAMES.set(meta.name.toLowerCase(), id);
}
// A few forms the prose uses that are not the canonical display name.
for (const [alias, id] of Object.entries({
  psalm: "PSA",
  psalms: "PSA",
  revelations: "REV",
  "song of songs": "SNG",
})) {
  if (canons.books[id]) BOOK_NAMES.set(alias, id);
}

const BOOK_PATTERN = [...BOOK_NAMES.keys()]
  .sort((a, b) => b.length - a.length)
  .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

const REF_PATTERN = new RegExp(`\\b(${BOOK_PATTERN})\\s+(\\d{1,3})(?::(\\d{1,3}))?`, "gi");

/** Scripture references in a step's own words, kept only if they resolve. */
export function scriptureRefs(text, tradition = "protestant") {
  const found = new Map();
  let match;
  REF_PATTERN.lastIndex = 0;
  while ((match = REF_PATTERN.exec(text)) !== null) {
    const book = BOOK_NAMES.get(match[1].toLowerCase());
    const chapter = Number(match[2]);
    const meta = book && canons.books[book];
    if (!meta || !Number.isInteger(chapter) || chapter < 1 || chapter > meta.chapters) continue;
    const verse = match[3] ? Number(match[3]) : null;
    const label = `${meta.name} ${chapter}${verse ? `:${verse}` : ""}`;
    if (found.has(label)) continue;
    found.set(label, {
      label,
      href: `/scriptures/${tradition}/${book}/${chapter}${verse ? `#v${verse}` : ""}`,
    });
  }
  return [...found.values()];
}

export function buildRoadLinks() {
  const road = JSON.parse(fs.readFileSync(ROAD, "utf8"));
  const steps = [];

  for (const era of road.eras) {
    for (const step of era.steps ?? []) {
      const refs = scriptureRefs(`${step.title} ${step.note}`);
      const textIds = CURATED_TEXT_IDS[step.title] ?? [];
      if (refs.length === 0 && textIds.length === 0) continue;
      steps.push({ era: era.id, title: step.title, refs, textIds });
    }
  }

  return {
    schemaVersion: 1,
    generatedBy: "scripts/church/build-road-links.mjs",
    method:
      "Scripture references parsed from each step's own wording and checked against the hosted canon; links to hosted writings are hand-checked, never matched by name",
    steps,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const links = buildRoadLinks();
  fs.writeFileSync(OUT, `${JSON.stringify(links, null, 2)}\n`, "utf8");
  const refs = links.steps.reduce((sum, step) => sum + step.refs.length, 0);
  const texts = links.steps.reduce((sum, step) => sum + step.textIds.length, 0);
  console.log(
    `${links.steps.length} road steps linked — ${refs} scripture references, ${texts} hosted writings`,
  );
}
