import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import canonsData from "../public/scriptures/canons.json" with { type: "json" };
import roadLinks from "../public/church/road-links.json" with { type: "json" };
import allusionManifest from "../public/early/allusions/manifest.json" with { type: "json" };
import { EARLY_TEXTS } from "../src/lib/early/client";
import type { EarlyText, AllusionFile } from "../src/lib/early/types";
import {
  MIN_MARGIN,
  MIN_SCORE,
  MIN_SHARED,
  MIN_RARE_SHARED,
  contentWords,
  quotedSpans,
} from "../scripts/early/build-allusions.mjs";
import { scriptureRefs } from "../scripts/church/build-road-links.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const ALLUSIONS_DIR = path.join(ROOT, "public/early/allusions");
const canons = canonsData as { books: Record<string, { name: string; chapters: number }> };

const allFiles = readdirSync(ALLUSIONS_DIR)
  .filter((name) => name.endsWith(".json") && name !== "manifest.json")
  .map((name) => JSON.parse(readFileSync(path.join(ALLUSIONS_DIR, name), "utf8")) as AllusionFile);

const allAllusions = allFiles.flatMap((file) => file.allusions);

test("the allusion layer is not empty and matches its manifest", () => {
  assert.ok(allAllusions.length > 20, `only ${allAllusions.length} allusions`);
  assert.equal(allAllusions.length, allusionManifest.matched);
  assert.equal(allusionManifest.minScore, MIN_SCORE);
  assert.equal(allusionManifest.minMargin, MIN_MARGIN);
  assert.equal(allusionManifest.minShared, MIN_SHARED);
});

test("every allusion points at a chapter that exists", () => {
  for (const allusion of allAllusions) {
    const meta = canons.books[allusion.book];
    assert.ok(meta, `unknown book ${allusion.book}`);
    assert.ok(
      allusion.chapter >= 1 && allusion.chapter <= meta.chapters,
      `${allusion.book} ${allusion.chapter} is outside the book`,
    );
    const file = path.join(ROOT, "public/scriptures/text/web", `${allusion.book}.json`);
    const text = JSON.parse(readFileSync(file, "utf8")) as { chapters: string[][] };
    const verses = text.chapters[allusion.chapter - 1];
    assert.ok(verses?.[allusion.verse - 1], `${allusion.book} ${allusion.chapter}:${allusion.verse} has no text`);
  }
});

test("every published allusion clears the bar the manifest advertises", () => {
  for (const allusion of allAllusions) {
    assert.ok(allusion.score >= MIN_SCORE, `${allusion.book} ${allusion.chapter} scores ${allusion.score}`);
    assert.ok(allusion.shared.length >= MIN_SHARED, `too few shared words`);
    assert.ok(
      allusion.rare.length >= MIN_RARE_SHARED,
      `${allusion.book} ${allusion.chapter} rests on ${allusion.rare.length} uncommon words`,
    );
    if (allusion.margin !== null) {
      assert.ok(
        allusion.margin >= MIN_MARGIN,
        `${allusion.book} ${allusion.chapter} has margin ${allusion.margin}`,
      );
    }
  }
});

test("the quoted span an allusion cites is really at that offset in the text", () => {
  // The reference is attached to a paragraph by position. If the offsets drift
  // from the hosted text, the link would appear beside the wrong sentence.
  for (const file of allFiles) {
    const source = JSON.parse(
      readFileSync(path.join(ROOT, "public/early/texts", `${file.textId}.json`), "utf8"),
    ) as EarlyText;
    for (const allusion of file.allusions) {
      const paragraph = source.sections[allusion.section]?.paragraphs[allusion.paragraph];
      assert.ok(paragraph, `${file.textId} §${allusion.section} has no paragraph ${allusion.paragraph}`);
      assert.equal(
        paragraph.slice(allusion.start, allusion.end),
        allusion.quote,
        `${file.textId} §${allusion.section} quote does not sit at its recorded offset`,
      );
      assert.ok(
        quotedSpans(paragraph).some((span) => span.text === allusion.quote),
        `${file.textId} quote is not a quoted span of its paragraph`,
      );
    }
  }
});

test("the words a match rests on are genuinely present on both sides", () => {
  // The published `shared` list is the evidence for the link. If a word in it
  // is not actually in both the quotation and the passage, the evidence is
  // fabricated even though the link may happen to be right.
  for (const file of allFiles) {
    for (const allusion of file.allusions) {
      const quoteWords = new Set(contentWords(allusion.quote));
      const text = JSON.parse(
        readFileSync(path.join(ROOT, "public/scriptures/text/web", `${allusion.book}.json`), "utf8"),
      ) as { chapters: string[][] };
      const last = allusion.endVerse ?? allusion.verse;
      const passage = text.chapters[allusion.chapter - 1]
        .slice(allusion.verse - 1, last)
        .join(" ");
      const passageWords = new Set(contentWords(passage));

      for (const word of allusion.shared) {
        assert.ok(quoteWords.has(word), `${allusion.book}: "${word}" is not in the quotation`);
        assert.ok(passageWords.has(word), `${allusion.book}: "${word}" is not in the passage`);
      }
    }
  }
});

test("known quotations resolve to the passages they actually quote", () => {
  // The findings that justified the thresholds. If a scoring change loses
  // these, it has regressed the thing the layer exists to do.
  const expected: [string, string, number][] = [
    ["barnabas", "LEV", 11],
    ["barnabas", "JER", 2],
    ["1clement", "ISA", 1],
    ["1clement", "PSA", 22],
    ["2clement", "EZK", 14],
    ["polycarp-philippians", "MAT", 7],
  ];
  for (const [textId, book, chapter] of expected) {
    const file = allFiles.find((entry) => entry.textId === textId);
    assert.ok(file, `${textId} has no allusion file`);
    assert.ok(
      file.allusions.some((a) => a.book === book && a.chapter === chapter),
      `${textId} no longer reaches ${book} ${chapter}`,
    );
  }
});

test("road steps link only to chapters and writings that exist", () => {
  assert.ok(roadLinks.steps.length > 0, "the road gained no links at all");
  for (const step of roadLinks.steps) {
    for (const ref of step.refs) {
      assert.match(ref.href, /^\/scriptures\/[a-z]+\/[A-Z0-9]{3}\/\d+/, `bad href ${ref.href}`);
      const [, , , book, chapterPart] = ref.href.split("/");
      const meta = canons.books[book];
      assert.ok(meta, `${ref.label} points at unknown book ${book}`);
      const chapter = Number(chapterPart.split("#")[0]);
      assert.ok(chapter >= 1 && chapter <= meta.chapters, `${ref.label} is outside ${book}`);
    }
    for (const textId of step.textIds) {
      assert.ok(
        EARLY_TEXTS.some((text) => text.id === textId),
        `${step.title} links to unhosted text ${textId}`,
      );
      assert.ok(
        existsSync(path.join(ROOT, "public/early/texts", `${textId}.json`)),
        `${textId} has no hosted file`,
      );
    }
  }
});

test("a road step's scripture links come from its own wording", () => {
  // Parsed, never inferred: every reference must be recoverable from the text
  // of the step itself.
  const road = JSON.parse(readFileSync(path.join(ROOT, "public/church/road.json"), "utf8")) as {
    eras: { id: string; steps?: { title: string; note: string }[] }[];
  };
  for (const step of roadLinks.steps) {
    if (step.refs.length === 0) continue;
    const era = road.eras.find((entry) => entry.id === step.era);
    const source = era?.steps?.find((entry) => entry.title === step.title);
    assert.ok(source, `${step.title} is not a step of ${step.era}`);
    assert.deepEqual(
      scriptureRefs(`${source.title} ${source.note}`).map((ref) => ref.label).sort(),
      step.refs.map((ref) => ref.label).sort(),
    );
  }
});

test("the Martyrdom step opens the Martyrdom, not Polycarp's letter", () => {
  // Name matching got this wrong, which is why the text links are hand-checked.
  const step = roadLinks.steps.find((entry) => entry.title === "Polycarp burned at Smyrna");
  assert.ok(step, "the Polycarp step lost its links");
  assert.deepEqual(step.textIds, ["martyrdom-polycarp"]);

  // And the step about Antioch gains no text link at all: the Barnabas it
  // names is the man in Acts 11, not the epistle.
  const antioch = roadLinks.steps.find((entry) =>
    entry.title.startsWith("Antioch"),
  );
  assert.deepEqual(antioch?.textIds ?? [], []);
});
