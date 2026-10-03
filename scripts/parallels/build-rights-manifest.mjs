#!/usr/bin/env node
/**
 * Build the parallels rights manifest from what the site actually reproduces.
 *
 * The manifest exists to answer one question a reader is entitled to ask: what
 * text did you take from where, under what licence, and can I check that it has
 * not changed? It was answering that question with three fields that were not
 * measurements.
 *
 *   sha256          Unverifiable. The only assertion on it was that the string
 *                   was 64 characters long, and `oshb-wlc` carried
 *                   e3b0c44298fc1c14…b855 — the SHA-256 of the empty string. A
 *                   digest computed over nothing, published beside a page that
 *                   promises "cryptographic hash verification", covering the
 *                   Hebrew of Genesis 22.
 *   retrievedAt     Nine of ten corpora carried the identical literal
 *                   2026-08-31T12:00:00.000Z. No fetch happened at that time.
 *   upstreamUrl     Two were 404 — the Vita Adae and M.R. James entries — so
 *                   the trail back to the source ended nowhere.
 *
 * What replaces them is measured:
 *
 *   reproducedTextSha256  A digest over every verbatim string this site
 *                         publishes from that corpus, canonically ordered.
 *                         Recomputable offline, forever, by anyone with the
 *                         repository — tests/parallels-integrity.test.ts does
 *                         exactly that. It answers the question that matters:
 *                         has the text we publish from this corpus changed?
 *   reproducedExcerpts    How many strings that digest covers, so an empty set
 *                         cannot hide behind a plausible-looking hash.
 *   upstreamCheckedAt     The date this script last reached the URL.
 *   upstreamStatus        ok, blocked (the host refuses scripted requests, as
 *                         several publishers do), or dead. Dead fails.
 *
 * The bibliographic and licence facts below are authored, not measured, and
 * that is correct — a licence is a human reading of a human document. They live
 * here so the file is one reviewable list rather than scattered literals.
 *
 * Usage:
 *   node scripts/parallels/build-rights-manifest.mjs
 *   node scripts/parallels/build-rights-manifest.mjs --offline   # skip the fetches
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const PARALLELS_DIR = path.join(ROOT, "public/parallels");
export const SOURCES_DIR = path.join(PARALLELS_DIR, "sources");
export const MANIFEST_PATH = path.join(PARALLELS_DIR, "rights-manifest.json");

// eBible.org routinely takes 15-30s to answer; a short timeout would keep
// recording a live source as unreachable.
const TIMEOUT_MS = 45_000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

/** Only positive evidence of absence fails; a host refusing robots does not. */
export const FAILING_STATUS = "dead";

/**
 * The authored half: bibliography and licence, one entry per corpus this site
 * draws text from. A corpus reproduced but not listed here fails the build, and
 * so does one listed but never reproduced — a licence declaration about text
 * nobody publishes is a claim with nothing behind it.
 */
export const AUTHORED = {
  "tanzil-uthmani": {
    title: "Tanzil Quran Text (Uthmani Script)",
    publisher: "Tanzil Project (tanzil.net)",
    version: "1.0.2",
    upstreamUrl: "https://tanzil.net/download/",
    license: "Tanzil Quran Text License 1.0",
    licenseUrl: "https://tanzil.net/docs/Text_License",
    notice:
      "Tanzil Quran Text (Simple/Uthmani) is provided under the Tanzil Text License. "
      + "Copyright © 2007-2024 Tanzil Project. Reproduction is permitted only verbatim "
      + "with attribution and link to tanzil.net.",
    permittedTransformations: "None (strictly verbatim extraction by surah/ayah locator)",
    jurisdiction: "Global / Open Academic",
  },
  "pickthall-quran": {
    title: "The Meaning of the Glorious Koran",
    translator: "Mohammed Marmaduke Pickthall",
    publishedYear: 1930,
    upstreamUrl: "https://tanzil.net/trans/en.pickthall",
    license: "Public Domain",
    notice:
      "English translation by Marmaduke Pickthall (1930), in the public domain worldwide.",
    permittedTransformations: "Whitespace normalization",
    jurisdiction: "Worldwide Public Domain",
  },
  "charles-jubilees": {
    title: "The Book of Jubilees",
    translator: "R.H. Charles",
    publishedYear: 1913,
    publisher: "Oxford: Clarendon Press",
    upstreamUrl: "https://www.ccel.org/c/charles/otpseudepig/jubilee/17.htm",
    license: "Public Domain",
    notice:
      "English translation from the Ethiopic with introduction and notes by R.H. Charles "
      + "(1913). In the public domain worldwide.",
    permittedTransformations: "Whitespace normalization, standard paragraph segmentation",
    jurisdiction: "Worldwide Public Domain",
  },
  "charles-vita-adae": {
    title: "The Books of Adam and Eve (Vita Adae et Evae)",
    translator: "R.H. Charles",
    publishedYear: 1913,
    publisher: "Oxford: Clarendon Press",
    // The old CCEL path 404s. This is the volume itself — Charles, The Apocrypha
    // and Pseudepigrapha of the Old Testament in English, vol. II, which is where
    // the Books of Adam and Eve are printed.
    upstreamUrl: "https://archive.org/details/apocryphapseudep02char",
    license: "Public Domain",
    notice:
      "English translation of the Latin Vita Adae et Evae by R.H. Charles (1913). "
      + "In the public domain worldwide.",
    permittedTransformations: "Whitespace normalization",
    jurisdiction: "Worldwide Public Domain",
  },
  "mrjames-apocrypha": {
    title: "The Apocryphal New Testament (Protoevangelium of James & Infancy Thomas)",
    translator: "M.R. James",
    publishedYear: 1924,
    publisher: "Oxford: Clarendon Press",
    // The old archive.org identifier 404s; this one resolves and its metadata
    // matches the 1924 James edition.
    upstreamUrl: "https://archive.org/details/JAMESApocryphalNewTestament1924",
    license: "Public Domain",
    notice:
      "English translations of the Protoevangelium of James and Infancy Gospel of Thomas "
      + "by M.R. James (1924). In the public domain worldwide.",
    permittedTransformations: "Whitespace normalization",
    jurisdiction: "Worldwide Public Domain",
  },
  "sefaria-mishnah": {
    title: "Mishnah Sanhedrin",
    publisher: "Sefaria Open Access Edition",
    upstreamUrl: "https://github.com/Sefaria/Sefaria-Export",
    license: "Public Domain",
    notice:
      "Hebrew text and open translation of the Mishnah via Sefaria Open Access (Public Domain).",
    permittedTransformations: "Whitespace normalization, variant recording",
    jurisdiction: "Worldwide",
  },
  "oshb-wlc": {
    title: "Open Scriptures Hebrew Bible (Westminster Leningrad Codex)",
    publisher: "Open Scriptures Hebrew Bible Project",
    upstreamUrl: "https://github.com/openscriptures/morphhb",
    license: "Public domain text; CC BY 4.0 morphology data",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    notice:
      "Westminster Leningrad Codex Hebrew text (public domain) with Open Scriptures lemma "
      + "and morphology data (CC BY 4.0), Open Scriptures Hebrew Bible Project.",
    permittedTransformations: "Whitespace normalization",
    jurisdiction: "Worldwide",
  },
  "web-bible": {
    title: "World English Bible",
    publisher: "eBible.org / Michael Paul Johnson",
    // ebible.org/web/ 301s into a loop that never resolves; this is the
    // catalogue entry that names the edition, its licence, and its downloads.
    upstreamUrl: "https://ebible.org/find/details.php?id=eng-web",
    license: "Public Domain",
    notice:
      "World English Bible is a 100% public domain Modern English translation of the Holy Bible.",
    permittedTransformations: "Whitespace normalization",
    jurisdiction: "Worldwide Public Domain",
  },
  "charles-enoch": {
    title: "1 Enoch (R.H. Charles translation, 1913)",
    translator: "R.H. Charles",
    publishedYear: 1913,
    publisher: "SPCK; Wikisource transcription",
    upstreamUrl: "https://en.wikisource.org/wiki/The_Book_of_Enoch_(Charles)",
    license: "Public Domain",
    // Each matrix witness repeats its corpus notice verbatim and a test compares
    // the two, so this string is load-bearing — it is not a summary to tidy.
    notice:
      "R.H. Charles' 1913 translation of 1 Enoch (SPCK) is in the public domain. "
      + "The Wikisource transcription is used verbatim; Charles' editorial marks "
      + "(\u2308\u2309 conjectures, [ ] restorations) are preserved.",
    permittedTransformations: "None (verbatim; Charles' editorial marks preserved)",
    jurisdiction: "Worldwide Public Domain",
  },
};

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const listJson = (dir) => fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort();

/**
 * Every verbatim string the site publishes, grouped by the corpus it came from.
 *
 * Two shapes carry text. A source file either keys verses by language
 * (`editionHebrew` + `verses[n].hebrew`) or names one edition for a body of
 * sections. A matrix carries `verbatimExcerpt` in each cell, with the corpus
 * named in the cell's own locator.
 *
 * The locator travels with the text so a changed digest points at what moved.
 */
export function collectReproducedText(root = ROOT) {
  const sourcesDir = path.join(root, "public/parallels/sources");
  const parallelsDir = path.join(root, "public/parallels");
  const byCorpus = new Map();
  const add = (corpusId, locator, text) => {
    if (!corpusId || typeof text !== "string" || text.trim() === "") return;
    if (!byCorpus.has(corpusId)) byCorpus.set(corpusId, []);
    byCorpus.get(corpusId).push({ locator, text });
  };

  for (const name of listJson(sourcesDir)) {
    const source = readJson(path.join(sourcesDir, name));

    if (source.verses) {
      // editionHebrew -> verses[n].hebrew, editionEnglish -> verses[n].english …
      const languages = Object.keys(source)
        .filter((key) => /^edition./.test(key))
        .map((key) => ({ corpusId: source[key], field: key.slice("edition".length).toLowerCase() }));
      for (const [verse, body] of Object.entries(source.verses)) {
        for (const { corpusId, field } of languages) {
          add(corpusId, `${source.id} ${verse} (${field})`, body[field]);
        }
      }
    }

    if (source.sections) {
      for (const [ref, text] of Object.entries(source.sections)) {
        add(source.edition, `${source.id} ${ref}`, text);
      }
    }
  }

  for (const name of listJson(parallelsDir)) {
    if (name === "rights-manifest.json") continue;
    const matrix = readJson(path.join(parallelsDir, name));
    if (!Array.isArray(matrix.slots)) continue;
    for (const slot of matrix.slots) {
      for (const cell of Object.values(slot.cells ?? {})) {
        add(
          cell.locator?.editionId,
          `${matrix.id}/${slot.id}/${cell.witnessId}`,
          cell.verbatimExcerpt,
        );
      }
    }
  }

  // Sort so the digest depends on the text, never on directory order.
  for (const entries of byCorpus.values()) {
    entries.sort((a, b) => (a.locator < b.locator ? -1 : a.locator > b.locator ? 1 : 0));
  }
  return byCorpus;
}

/** The digest a reader — or the test — can recompute from the repository. */
export function digestFor(entries) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(entries.map(({ locator, text }) => [locator, text])))
    .digest("hex");
}

async function checkUpstream(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT },
    });
    if (response.ok) return "ok";
    if ([401, 403, 405, 429].includes(response.status)) return "blocked";
    if ([404, 410].includes(response.status)) return "dead";
    return "error";
  } catch {
    return "error";
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const offline = process.argv.includes("--offline");
  const reproduced = collectReproducedText();
  const previous = fs.existsSync(MANIFEST_PATH) ? readJson(MANIFEST_PATH) : { corpora: {} };
  const today = new Date().toISOString().slice(0, 10);
  const problems = [];

  for (const corpusId of reproduced.keys()) {
    if (!AUTHORED[corpusId]) {
      problems.push(`${corpusId} is reproduced on the site but has no licence entry`);
    }
  }
  for (const corpusId of Object.keys(AUTHORED)) {
    if (!reproduced.has(corpusId)) {
      problems.push(`${corpusId} is declared but no text is reproduced from it — remove it`);
    }
  }
  if (problems.length > 0) {
    console.error("The manifest and the corpus have drifted apart:");
    for (const problem of problems) console.error(`  ${problem}`);
    process.exitCode = 1;
    return;
  }

  const corpora = {};
  for (const corpusId of Object.keys(AUTHORED).sort()) {
    const entries = reproduced.get(corpusId);
    const authored = AUTHORED[corpusId];
    const carried = previous.corpora?.[corpusId] ?? {};
    const status = offline
      ? (carried.upstreamStatus ?? "unchecked")
      : await checkUpstream(authored.upstreamUrl);

    corpora[corpusId] = {
      id: corpusId,
      ...authored,
      upstreamStatus: status,
      upstreamCheckedAt: offline ? (carried.upstreamCheckedAt ?? null) : today,
      reproducedExcerpts: entries.length,
      reproducedTextSha256: digestFor(entries),
    };
    console.log(
      `${status.padEnd(9)} ${String(entries.length).padStart(4)} excerpts  ${corpusId}`,
    );
  }

  fs.writeFileSync(
    MANIFEST_PATH,
    `${JSON.stringify(
      {
        schemaVersion: "2.0.0",
        generatedBy: "scripts/parallels/build-rights-manifest.mjs",
        note:
          "reproducedTextSha256 is measured: a SHA-256 over every verbatim string this site "
          + "publishes from the corpus, canonically ordered, recomputed by "
          + "tests/parallels-integrity.test.ts. Bibliography, licence, and notice are "
          + "authored claims. upstreamStatus is measured on the date shown.",
        generatedAt: today,
        corpora,
      },
      null,
      2,
    )}\n`,
  );

  const dead = Object.values(corpora).filter((entry) => entry.upstreamStatus === FAILING_STATUS);
  if (dead.length > 0) {
    console.error(`\n${dead.length} upstream source(s) are gone:`);
    for (const entry of dead) console.error(`  ${entry.id} — ${entry.upstreamUrl}`);
    process.exitCode = 1;
  } else {
    console.log(`\n${Object.keys(corpora).length} corpora, every digest measured.`);
  }
}

// No top-level await: the test suite imports this module through tsx, which
// transforms to CJS and cannot carry one.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
