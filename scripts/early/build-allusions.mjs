#!/usr/bin/env node
/**
 * Find where the early Christian writings quote Scripture, and link the phrase
 * to the verse in the hosted reader.
 *
 * These texts are the site's distinctive holding, and the thing they do most
 * is quote the Bible. Until now that was invisible: a reader meeting "He was
 * wounded for our transgressions" in Barnabas had no way to reach Isaiah 53
 * except by already knowing it was Isaiah 53.
 *
 * Entirely deterministic. No model is involved at any stage: the candidates
 * come from the quotation marks the translators themselves set, and the
 * matching is rare-word overlap against the hosted World English Bible. A
 * match is published only when one passage stands clearly above every rival,
 * so a phrase that could be half the Psalter links to nothing rather than to a
 * guess.
 *
 * The hard part is that the two sides were translated ninety years apart. The
 * Ante-Nicene Fathers render Isaiah 53:5 "He was wounded for our
 * transgressions, and bruised for our iniquities: with His stripes we are
 * healed"; the World English Bible renders it "He was pierced for our
 * transgressions. He was crushed for our iniquities... by his wounds we are
 * healed." Almost every content word differs. What survives translation is the
 * rare vocabulary — transgressions, iniquities, healed — so that is what is
 * matched, after folding the archaic forms and British spellings that would
 * otherwise hide agreement.
 *
 * Output: public/early/allusions/{textId}.json
 *
 * Usage:
 *   node scripts/early/build-allusions.mjs
 *   node scripts/early/build-allusions.mjs --evaluate --texts=barnabas
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonOrNull, writeStableJson } from "../site/stable-stamp.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TEXTS_DIR = path.join(ROOT, "public/early/texts");
const WEB_DIR = path.join(ROOT, "public/scriptures/text/web");
const OUT_DIR = path.join(ROOT, "public/early/allusions");

/**
 * Minimum score for a quoted span to be published as a match.
 *
 * Tuned against Barnabas, which quotes Scripture more densely than anything
 * else in the corpus. At a lower bar the only two wrong answers in the whole
 * book were also its two lowest-scoring: "Who is he that wishes to live for
 * ever?" was sent to Deuteronomy 4:33 when it is Psalm 34:12, and "a lofty
 * cave of the strong rock" to Revelation 6:15 when it is Isaiah 33:16. Both
 * sat below 19 with the narrowest margins in the book, and every correct match
 * sat above 20. The bar is set where the errors stopped.
 */
export const MIN_SCORE = 6;
/**
 * How far the best candidate must stand above the best candidate from any
 * other book. A phrase that fits Psalm 22 and Psalm 69 equally well is not
 * evidence that the writer meant either one.
 */
export const MIN_MARGIN = 1.3;
/** Shared rare words required regardless of score. */
export const MIN_SHARED = 4;
/**
 * Shared words that must be genuinely uncommon — appearing in fewer than
 * roughly this many verses across the whole Bible.
 */
const RARE_VERSE_CEILING = 200;
/** How many of those a match must have. */
export const MIN_RARE_SHARED = 2;
/** Verses a single quotation may span. */
const MAX_SPAN = 4;

/**
 * Words too common to carry evidence. Kept deliberately short: the IDF
 * weighting already discounts frequent words, and an over-long list starts
 * throwing away the vocabulary that identifies a passage.
 */
const STOPWORDS = new Set(
  ("a an the and or but for nor so yet of in on at to from by with without into "
    + "unto upon over under through as is are was were be been being am do does "
    + "did done have has had having shall will would should may might must can "
    + "could not no nor if then than that this these those there here it its "
    + "he him his she her they them their we us our you your i me my mine ye "
    + "thee thou thy thine who whom whose which what when where why how all any "
    + "every some such same other another one two things thing said say says "
    + "saith also again very much many more most now also let").split(" "),
);

/**
 * Archaic and British forms folded to the wording the hosted Bible uses. Only
 * pairs that actually block a real match are listed; guessing at morphology
 * would create agreement that is not there.
 */
const FOLD = new Map(
  Object.entries({
    behoveth: "behove",
    brethren: "brother",
    brethrens: "brother",
    hearken: "hear",
    hearkened: "hear",
    honour: "honor",
    honours: "honor",
    honoured: "honor",
    labour: "labor",
    labours: "labor",
    neighbour: "neighbor",
    neighbours: "neighbor",
    saviour: "savior",
    favour: "favor",
    behaviour: "behavior",
    valour: "valor",
    endeavour: "endeavor",
    rumour: "rumor",
    clamour: "clamor",
    succour: "succor",
    armour: "armor",
    fulfil: "fulfill",
    fulfilled: "fulfill",
    fulfilling: "fulfill",
    marvellous: "marvelous",
    counsellor: "counselor",
    travelled: "traveled",
    offence: "offense",
    offences: "offense",
    defence: "defense",
    judgement: "judgment",
    judgements: "judgment",
    ancles: "ankle",
    shew: "show",
    shewed: "show",
    sheweth: "show",
    shewing: "show",
    spake: "speak",
    spoke: "speak",
    spoken: "speak",
    wrought: "work",
    worketh: "work",
    doeth: "do",
    hath: "have",
    hast: "have",
    cometh: "come",
    knoweth: "know",
    loveth: "love",
    liveth: "live",
    giveth: "give",
    taketh: "take",
    maketh: "make",
    dwelleth: "dwell",
    walketh: "walk",
    speaketh: "speak",
    heareth: "hear",
    seeketh: "seek",
    keepeth: "keep",
    calleth: "call",
    sitteth: "sit",
    standeth: "stand",
    receiveth: "receive",
    believeth: "believe",
  }),
);

/** Light plural/tense fold, applied after the explicit map. */
function stem(word) {
  if (word.length <= 4) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.endsWith("sses")) return word.slice(0, -2);
  if (word.endsWith("ses") || word.endsWith("xes") || word.endsWith("ches") || word.endsWith("shes")) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("us")) return word.slice(0, -1);
  return word;
}

export function contentWords(value) {
  const words = String(value)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const out = [];
  for (const raw of words) {
    if (raw.length < 3) continue;
    const folded = FOLD.get(raw) ?? raw;
    if (STOPWORDS.has(folded)) continue;
    const stemmed = stem(folded);
    if (stemmed.length < 3 || STOPWORDS.has(stemmed)) continue;
    out.push(stemmed);
  }
  return out;
}

/** Every WEB verse, flattened, with a rare-word posting list over the corpus. */
export function buildVerseIndex() {
  const verses = [];
  const postings = new Map();

  for (const file of fs.readdirSync(WEB_DIR).sort()) {
    if (!file.endsWith(".json")) continue;
    const text = JSON.parse(fs.readFileSync(path.join(WEB_DIR, file), "utf8"));
    text.chapters.forEach((chapter, chapterIndex) => {
      chapter.forEach((verse, verseIndex) => {
        if (!verse || !verse.trim()) return;
        const index = verses.length;
        const words = new Set(contentWords(verse));
        verses.push({
          book: text.book,
          chapter: chapterIndex + 1,
          verse: verseIndex + 1,
          words,
        });
        for (const word of words) {
          let posting = postings.get(word);
          if (!posting) postings.set(word, (posting = []));
          posting.push(index);
        }
      });
    });
  }

  const idf = new Map();
  for (const [word, posting] of postings) {
    idf.set(word, Math.log(verses.length / posting.length));
  }
  return { verses, postings, idf };
}

/**
 * Score a candidate against a window of consecutive verses. The score is the
 * summed rarity of the words they share, so three unusual words in common beat
 * a dozen ordinary ones.
 *
 * Normalised by the size of the target, not just the span. Without that, a
 * long passage wins by sheer surface area: Greek Esther 8:13 is a 688-word
 * royal decree, and it was matching five unrelated quotations across Hermas
 * and the Martyrdom of Polycarp purely because it contains a bit of everything.
 * Dividing by the square root of the target's vocabulary makes the score a
 * measure of concentration — how much of this passage the quotation accounts
 * for — rather than of overlap alone.
 */
function scoreWindow(index, queryWords, start, span) {
  const shared = new Set();
  let score = 0;
  let targetWords = 0;
  for (let offset = 0; offset < span; offset += 1) {
    const verse = index.verses[start + offset];
    if (!verse) return null;
    targetWords += verse.words.size;
    for (const word of queryWords) {
      if (shared.has(word) || !verse.words.has(word)) continue;
      shared.add(word);
      score += index.idf.get(word) ?? 0;
    }
  }
  // A typical verse carries about twenty content words; scaling to that keeps
  // the published thresholds in the same range as before the fix.
  const sizePenalty = Math.sqrt(Math.max(targetWords, 1) / 20);
  return { score: score / (Math.sqrt(span) * sizePenalty), shared };
}

export function matchQuotation(index, quotation) {
  const queryWords = new Set(contentWords(quotation));
  if (queryWords.size < MIN_SHARED) return null;

  // Only the rarest words are worth expanding into candidates; the common ones
  // would drag in thousands of verses to score for nothing.
  const seeds = [...queryWords]
    .filter((word) => index.postings.has(word))
    .sort((a, b) => (index.idf.get(b) ?? 0) - (index.idf.get(a) ?? 0))
    .slice(0, 8);

  const starts = new Set();
  for (const seed of seeds) {
    for (const verseIndex of index.postings.get(seed)) {
      for (let back = 0; back < MAX_SPAN; back += 1) {
        if (verseIndex - back >= 0) starts.add(verseIndex - back);
      }
    }
  }

  let best = null;
  const bestByBook = new Map();
  for (const start of starts) {
    for (let span = 1; span <= MAX_SPAN; span += 1) {
      const end = start + span - 1;
      const first = index.verses[start];
      const last = index.verses[end];
      // A window may not run across a book boundary.
      if (!first || !last || first.book !== last.book) break;
      const scored = scoreWindow(index, queryWords, start, span);
      if (!scored) break;
      const candidate = { start, span, ...scored, book: first.book };
      if (!best || candidate.score > best.score) best = candidate;
      const bookBest = bestByBook.get(first.book);
      if (!bookBest || candidate.score > bookBest.score) bestByBook.set(first.book, candidate);
    }
  }

  if (!best || best.shared.size < MIN_SHARED || best.score < MIN_SCORE) return null;

  // Ordinary vocabulary in common is not evidence of quotation. A real
  // quotation carries words that occur almost nowhere else — "cistern",
  // "ruminant", "brazen" — and it is those that identify the passage.
  const rareShared = [...best.shared].filter(
    (word) => (index.postings.get(word)?.length ?? Infinity) <= RARE_VERSE_CEILING,
  );
  if (rareShared.length < MIN_RARE_SHARED) return null;

  // The runner-up must come from a different book: two adjacent windows in the
  // same chapter are the same find, not a rival to it.
  let rival = 0;
  for (const [book, candidate] of bestByBook) {
    if (book === best.book) continue;
    rival = Math.max(rival, candidate.score);
  }
  if (rival > 0 && best.score / rival < MIN_MARGIN) return null;

  const first = index.verses[best.start];
  const last = index.verses[best.start + best.span - 1];
  return {
    book: first.book,
    chapter: first.chapter,
    verse: first.verse,
    endVerse: last.verse !== first.verse || last.chapter !== first.chapter ? last.verse : undefined,
    endChapter: last.chapter !== first.chapter ? last.chapter : undefined,
    score: Number(best.score.toFixed(2)),
    shared: [...best.shared].sort(),
    rare: rareShared.sort(),
    margin: rival > 0 ? Number((best.score / rival).toFixed(2)) : null,
  };
}

/** Quoted spans, in order, with their character offsets in the paragraph. */
export function quotedSpans(paragraph) {
  const spans = [];
  const pattern = /[“"]([^”"]{12,700})[”"]/g;
  let match;
  while ((match = pattern.exec(paragraph)) !== null) {
    spans.push({ text: match[1], start: match.index + 1, end: match.index + 1 + match[1].length });
  }
  return spans;
}

export function buildAllusions(index, text) {
  const sections = [];
  text.sections.forEach((section, sectionIndex) => {
    section.paragraphs.forEach((paragraph, paragraphIndex) => {
      for (const span of quotedSpans(paragraph)) {
        const hit = matchQuotation(index, span.text);
        if (!hit) continue;
        sections.push({
          section: sectionIndex,
          paragraph: paragraphIndex,
          start: span.start,
          end: span.end,
          quote: span.text,
          ...hit,
        });
      }
    });
  });
  return sections;
}

const args = process.argv.slice(2);
const evaluate = args.includes("--evaluate");
const textsOpt = args.find((argument) => argument.startsWith("--texts="));
const generatedAtOpt = args.find((argument) => argument.startsWith("--generated-at="));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const only = textsOpt ? new Set(textsOpt.slice(8).split(",")) : null;
  const index = buildVerseIndex();
  if (!evaluate) console.log(`indexed ${index.verses.length} verses`);

  const generatedAt = generatedAtOpt
    ? generatedAtOpt.slice(15)
    : new Date().toISOString().replace(/\.\d{3}Z$/, ".000Z");

  // Read before the clear, so the stamp survives a rebuild that finds the same
  // quotations.
  const previousManifest = readJsonOrNull(path.join(OUT_DIR, "manifest.json"));
  if (!evaluate) fs.rmSync(OUT_DIR, { recursive: true, force: true });
  if (!evaluate) fs.mkdirSync(OUT_DIR, { recursive: true });

  let totalSpans = 0;
  let totalMatched = 0;
  const perText = [];

  for (const file of fs.readdirSync(TEXTS_DIR).sort()) {
    if (!file.endsWith(".json")) continue;
    const text = JSON.parse(fs.readFileSync(path.join(TEXTS_DIR, file), "utf8"));
    if (only && !only.has(text.id)) continue;

    const spans = text.sections.reduce(
      (sum, section) =>
        sum + section.paragraphs.reduce((n, paragraph) => n + quotedSpans(paragraph).length, 0),
      0,
    );
    const allusions = buildAllusions(index, text);
    totalSpans += spans;
    totalMatched += allusions.length;
    perText.push({ id: text.id, spans, matched: allusions.length });

    if (evaluate) {
      for (const allusion of allusions) {
        console.log(
          `${text.id} §${allusion.section} — ${allusion.book} ${allusion.chapter}:${allusion.verse}${
            allusion.endVerse ? `-${allusion.endVerse}` : ""
          }  score=${allusion.score} margin=${allusion.margin ?? "—"}\n    “${allusion.quote.slice(0, 130)}”\n    shared: ${allusion.shared.join(", ")}`,
        );
      }
      continue;
    }

    if (allusions.length === 0) continue;
    fs.writeFileSync(
      path.join(OUT_DIR, `${text.id}.json`),
      `${JSON.stringify({ textId: text.id, allusions })}\n`,
      "utf8",
    );
  }

  if (!evaluate) {
    writeStableJson(
      path.join(OUT_DIR, "manifest.json"),
      {
        schemaVersion: 1,
        generatedBy: "scripts/early/build-allusions.mjs",
        generatedAt,
        method: "quotation marks in the hosted translation, matched by rare-word overlap against the World English Bible",
        minScore: MIN_SCORE,
        minMargin: MIN_MARGIN,
        minShared: MIN_SHARED,
        quotedSpans: totalSpans,
        matched: totalMatched,
        texts: perText.filter((entry) => entry.matched > 0),
      },
      { previous: previousManifest },
    );
  }

  console.log(
    `${totalMatched} of ${totalSpans} quoted spans matched a passage (${((totalMatched / Math.max(totalSpans, 1)) * 100).toFixed(0)}%)`,
  );
}
