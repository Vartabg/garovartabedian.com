#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GUIDE_RUBRIC_VERSION,
  hasTemplateSignature,
  validateGuideV2,
} from "../scriptures/guide-validation.mjs";
import { prepareTarget } from "../scriptures/build-guides-v2.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const CORPUS_HEALTH_PATH = path.join(ROOT, "public/meta/corpus-health.json");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const jsonFiles = (directory) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(directory, entry.name))
    .sort();

const nestedJsonFiles = (directory) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return nestedJsonFiles(target);
      return entry.isFile() && entry.name.endsWith(".json") ? [target] : [];
    })
    .sort();

function collectGuideStats(canons) {
  const guideRoot = path.join(ROOT, "public/scriptures/guides");
  const guideFiles = nestedJsonFiles(guideRoot);
  let questions = 0;
  let questionsWithVerseRefs = 0;
  let batchTemplateGuides = 0;
  let agentReviewed = 0;
  let humanReviewed = 0;
  let v2Provenance = 0;
  let v2Passing = 0;
  let v2Failing = 0;
  let v2Rebound = 0;

  for (const file of guideFiles) {
    const guide = readJson(file);
    if (hasTemplateSignature(guide)) batchTemplateGuides += 1;
    if (guide.reviewStatus === "human-reviewed") humanReviewed += 1;
    else if (guide.reviewStatus === "agent-reviewed") agentReviewed += 1;

    for (const question of guide.questions ?? []) {
      questions += 1;
      if ((question.verseRefs ?? []).length > 0) questionsWithVerseRefs += 1;
    }

    if (guide.generation?.rubricVersion === GUIDE_RUBRIC_VERSION) {
      v2Provenance += 1;
      const book = path.basename(path.dirname(file));
      const chapter = Number.parseInt(path.basename(file, ".json"), 10);
      const expectedPromptHash = prepareTarget(book, chapter).promptHash;
      const validation = validateGuideV2({
        guide,
        root: ROOT,
        canons,
        book,
        chapter,
        expectedPromptHash,
      });
      if (validation.failures.length === 0) v2Passing += 1;
      else v2Failing += 1;
      if ((guide.generation.rebound ?? []).length > 0) v2Rebound += 1;
    }
  }

  const reviewed = agentReviewed + humanReviewed;

  return {
    files: guideFiles.length,
    questions,
    questionsWithVerseRefs,
    questionsWithoutVerseRefs: questions - questionsWithVerseRefs,
    batchTemplateGuides,
    customStructuredGuides: guideFiles.length - batchTemplateGuides,
    review: {
      agentReviewed,
      humanReviewed,
      untracked: guideFiles.length - reviewed,
    },
    v2: {
      rubricVersion: GUIDE_RUBRIC_VERSION,
      provenance: v2Provenance,
      passing: v2Passing,
      failing: v2Failing,
      rebound: v2Rebound,
    },
  };
}

function collectCrossReferenceStats() {
  const files = jsonFiles(path.join(ROOT, "public/scriptures/xref"));
  let sourceVerses = 0;
  let targets = 0;

  for (const file of files) {
    const xrefs = readJson(file).refs ?? {};
    sourceVerses += Object.keys(xrefs).length;
    targets += Object.values(xrefs).reduce(
      (sum, refs) => sum + (Array.isArray(refs) ? refs.length : 0),
      0,
    );
  }

  return { sourceVerses, targets };
}

function collectOriginalLanguageStats() {
  const originalRoot = path.join(ROOT, "public/scriptures/original");
  const manifest = readJson(path.join(originalRoot, "manifest.json"));
  const chapterFiles = nestedJsonFiles(originalRoot).filter(
    (file) => path.basename(file) !== "manifest.json",
  );
  let verses = 0;
  let wordTokens = 0;
  let versesWithSourceReferenceMappings = 0;
  let sourceReferenceMappings = 0;

  for (const file of chapterFiles) {
    const chapter = readJson(file);
    for (const verse of chapter.verses ?? []) {
      verses += 1;
      wordTokens += (verse.words ?? []).length;
      if ((verse.sourceRefs ?? []).length > 0) {
        versesWithSourceReferenceMappings += 1;
      }
      sourceReferenceMappings += (verse.sourceRefs ?? []).length;
    }
  }

  const editions = Object.entries(manifest.editions)
    .map(([id, edition]) => ({
      id,
      name: edition.name,
      revision: edition.revision,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    editions,
    books: Object.keys(manifest.books).length,
    chapters: Object.values(manifest.chapterCounts).reduce(
      (sum, count) => sum + count,
      0,
    ),
    verses,
    wordTokens,
    versesWithSourceReferenceMappings,
    sourceReferenceMappings,
  };
}

function collectSemanticStats() {
  const semanticRoot = path.join(ROOT, "public/scriptures/semantic");
  const manifestPath = path.join(semanticRoot, "manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = readJson(manifestPath);
  const verses = Object.values(manifest.verseCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const shardBytes = fs
    .readdirSync(path.join(semanticRoot, "verses"))
    .filter((name) => name.endsWith(".bin"))
    .reduce(
      (sum, name) =>
        sum + fs.statSync(path.join(semanticRoot, "verses", name)).size,
      0,
    );

  return {
    model: manifest.model,
    dims: manifest.dims,
    quantization: manifest.quantization,
    translation: manifest.translation,
    books: Object.keys(manifest.verseCounts).length,
    chapters: manifest.chapterIndex.length,
    verses,
    verseShardBytes: shardBytes,
  };
}

/**
 * The computed chapter-neighbour layer. Published beside the semantic index it
 * is derived from, including how often it agrees with the curated
 * cross-references — the agreement rate is the honest measure of whether the
 * arithmetic is finding anything a reader should trust.
 */
function collectNeighbourStats() {
  const manifestPath = path.join(ROOT, "public/scriptures/neighbors/manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = readJson(manifestPath);
  return {
    grain: manifest.grain,
    model: manifest.model,
    chaptersIndexed: manifest.chaptersIndexed,
    chaptersWithNeighbours: manifest.chaptersWithNeighbours,
    links: manifest.neighbours,
    alsoCrossReferenced: manifest.neighboursAlsoCrossReferenced,
    minScore: manifest.minScore,
    topK: manifest.topK,
  };
}

function collectEarlyWritingStats() {
  const files = jsonFiles(path.join(ROOT, "public/early/texts"));
  return {
    library: collectLibraryStats(),
    texts: files.length,
    sections: files.reduce(
      (sum, file) => sum + (readJson(file).sections ?? []).length,
      0,
    ),
  };
}

function collectLibraryStats() {
  const report = readJson(path.join(ROOT, "content/early-library/report.json"));
  delete report.audits; delete report.outputs;
  return report;
}

export function collectCorpusHealth() {
  const canons = readJson(path.join(ROOT, "public/scriptures/canons.json"));
  const nave = readJson(path.join(ROOT, "public/scriptures/nave/index.json"));
  const searchTranslations = fs
    .readdirSync(path.join(ROOT, "public/scriptures/search"), {
      withFileTypes: true,
    })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  const guides = collectGuideStats(canons);
  const chapterSlots = Object.values(canons.books).reduce(
    (sum, book) => sum + book.chapters,
    0,
  );
  const originals = collectOriginalLanguageStats();
  const originalEditionIds = originals.editions.map((edition) => edition.id);

  return {
    schemaVersion: 1,
    generatedBy: "scripts/site/build-corpus-health.mjs",
    corpus: {
      books: {
        hostedIds: Object.keys(canons.books).length,
        unionChapterSlots: chapterSlots,
        sourceBackedBriefings: jsonFiles(
          path.join(ROOT, "public/scriptures/books"),
        ).length,
      },
      traditions: {
        count: canons.traditions.length,
        shelves: canons.traditions.map((tradition) => ({
          id: tradition.id,
          hostedBookIds: tradition.books.length,
        })),
      },
      translations: {
        count: Object.keys(canons.translations).length,
        ids: Object.keys(canons.translations).sort(),
      },
      guides,
      crossReferences: collectCrossReferenceStats(),
      topics: {
        count: nave.topics.length,
        references: nave.topics.reduce(
          (sum, topic) => sum + topic.refCount,
          0,
        ),
      },
      originals,
      earlyWritings: collectEarlyWritingStats(),
    },
    validation: {
      guides: {
        coverage: {
          status: guides.files === chapterSlots ? "complete" : "incomplete",
          guides: guides.files,
          chapterSlots,
          scope: "one guide for every hosted union book/chapter slot",
        },
        referencesAndQuotations: {
          status: "automated",
          scope:
            "path identity, reference bounds, and key-verse quotation matching against a hosted translation",
          test: "tests/scripture-guide-integrity.test.ts",
        },
        v2Rubric: {
          status: guides.v2.failing === 0 ? "passing" : "failing",
          rubricVersion: guides.v2.rubricVersion,
          guidesWithProvenance: guides.v2.provenance,
          passing: guides.v2.passing,
          failing: guides.v2.failing,
          rebound: guides.v2.rebound,
          scope:
            "template rejection, chapter coverage, exact hosted-edition quotations, cited questions, category depth, glossary, and current-grounding provenance",
          reboundNote:
            "rebound counts guides whose prompt hash was moved after a citation url/label correction to their book briefing, each carrying a validated generation.rebound record (when, who, why, previous hash, fields changed). No re-bind may cross a change to hosted text, briefing claims, cross-references, or the rubric.",
        },
        editorialReview: {
          status:
            guides.review.humanReviewed === guides.files
              ? "complete"
              : guides.review.untracked === 0
                ? "agent-reviewed"
                : guides.review.agentReviewed +
                    guides.review.humanReviewed >
                  0
                ? "in-progress"
                : "untracked",
          agentReviewed: guides.review.agentReviewed,
          humanReviewed: guides.review.humanReviewed,
          untracked: guides.review.untracked,
          note:
            "reviewStatus tiers: agent-reviewed (multi-pass automated-agent editorial panel; quotations and references also machine-verified) and human-reviewed (a named person signed off). Only human-reviewed implies personal approval.",
        },
      },
    },
    coverage: {
      search: {
        translationIds: searchTranslations,
        availableTranslationIds: Object.keys(canons.translations).sort(),
        scope: "exact-word index per translation plus Nave topical relationships",
      },
      semanticSearch: collectSemanticStats() ?? {
        status: "not-built",
        scope: "run npm run data:embeddings to build the semantic verse index",
      },
      chapterNeighbours: collectNeighbourStats() ?? {
        status: "not-built",
        scope: "run npm run data:neighbors to build the computed chapter-neighbour layer",
      },
      originalLanguages: {
        editionIds: originalEditionIds,
        hasGreekSeptuagint: originals.editions.some((edition) =>
          /lxx|septuagint/i.test(`${edition.id} ${edition.name}`),
        ),
        hasTextualApparatus: Boolean(
          readJson(path.join(ROOT, "public/scriptures/original/manifest.json"))
            .apparatus,
        ),
      },
    },
  };
}

export function writeCorpusHealth() {
  const health = collectCorpusHealth();
  if (health.corpus.guides.v2.failing > 0) {
    throw new Error(
      `${health.corpus.guides.v2.failing} guide-v2 file(s) failed the published rubric`,
    );
  }
  fs.mkdirSync(path.dirname(CORPUS_HEALTH_PATH), { recursive: true });
  fs.writeFileSync(
    CORPUS_HEALTH_PATH,
    `${JSON.stringify(health, null, 2)}\n`,
    "utf8",
  );
  return health;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const health = writeCorpusHealth();
  console.log(
    `Corpus health: ${health.corpus.guides.files} guides, ${health.corpus.guides.questions} questions, ${health.corpus.crossReferences.targets} cross-reference targets`,
  );
  console.log(path.relative(ROOT, CORPUS_HEALTH_PATH));
}
