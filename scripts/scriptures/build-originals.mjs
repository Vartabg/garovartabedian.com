#!/usr/bin/env node
// Builds the word-level original-language corpus used by the Scripture reader.
//
// Hebrew/Aramaic: Open Scriptures Hebrew Bible (WLC text + OSHB morphology)
// Greek: MorphGNT's morphological tagging of the SBL Greek New Testament
//
// Sources are pinned to Git commit IDs. Generated files are split by chapter so
// the reader downloads only the words a visitor deliberately asks to inspect.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publishStagedEntriesSync } from "../lib/atomic-publication.mjs";
import { BOOK_NAMES, NT_27, OT_39 } from "./canon-data.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(HERE, ".cache", "originals");
const PUBLIC_SCRIPTURES = path.resolve(HERE, "../../public/scriptures");

const OSHB_COMMIT = "3d15126fb1ef74867fc1434be1942e837932691f";
const MORPHGNT_COMMIT = "aaed91e57c8e4a8dc9a2383e129ca5e75fe6393d";
const LXX_COMMIT = "c91f6b1e8fb3ba37df701e6ae31f675ace71a2b2";
const LXX_COMMIT_DATE = "2026-08-21";
const SNAPSHOT_DATE = "2026-08-27";

if (SNAPSHOT_DATE < LXX_COMMIT_DATE) {
  throw new Error(
    `Original-language snapshot ${SNAPSHOT_DATE} predates pinned lxx-morph revision ${LXX_COMMIT} (${LXX_COMMIT_DATE})`,
  );
}

const OSHB_BOOKS = {
  Gen: "GEN", Exod: "EXO", Lev: "LEV", Num: "NUM", Deut: "DEU",
  Josh: "JOS", Judg: "JDG", Ruth: "RUT", "1Sam": "1SA", "2Sam": "2SA",
  "1Kgs": "1KI", "2Kgs": "2KI", "1Chr": "1CH", "2Chr": "2CH",
  Ezra: "EZR", Neh: "NEH", Esth: "EST", Job: "JOB", Ps: "PSA",
  Prov: "PRO", Eccl: "ECC", Song: "SNG", Isa: "ISA", Jer: "JER",
  Lam: "LAM", Ezek: "EZK", Dan: "DAN", Hos: "HOS", Joel: "JOL",
  Amos: "AMO", Obad: "OBA", Jonah: "JON", Mic: "MIC", Nah: "NAM",
  Hab: "HAB", Zeph: "ZEP", Hag: "HAG", Zech: "ZEC", Mal: "MAL",
};

const GREEK_FILES = {
  "61-Mt-morphgnt.txt": "MAT", "62-Mk-morphgnt.txt": "MRK",
  "63-Lk-morphgnt.txt": "LUK", "64-Jn-morphgnt.txt": "JHN",
  "65-Ac-morphgnt.txt": "ACT", "66-Ro-morphgnt.txt": "ROM",
  "67-1Co-morphgnt.txt": "1CO", "68-2Co-morphgnt.txt": "2CO",
  "69-Ga-morphgnt.txt": "GAL", "70-Eph-morphgnt.txt": "EPH",
  "71-Php-morphgnt.txt": "PHP", "72-Col-morphgnt.txt": "COL",
  "73-1Th-morphgnt.txt": "1TH", "74-2Th-morphgnt.txt": "2TH",
  "75-1Ti-morphgnt.txt": "1TI", "76-2Ti-morphgnt.txt": "2TI",
  "77-Tit-morphgnt.txt": "TIT", "78-Phm-morphgnt.txt": "PHM",
  "79-Heb-morphgnt.txt": "HEB", "80-Jas-morphgnt.txt": "JAS",
  "81-1Pe-morphgnt.txt": "1PE", "82-2Pe-morphgnt.txt": "2PE",
  "83-1Jn-morphgnt.txt": "1JN", "84-2Jn-morphgnt.txt": "2JN",
  "85-3Jn-morphgnt.txt": "3JN", "86-Jud-morphgnt.txt": "JUD",
  "87-Re-morphgnt.txt": "REV",
};

// Rahlfs Septuagint 1935 — ~sethkush/lxx-morph (CC BY 4.0 data, public-domain text).
// Deuterocanon / LXX extras only; the 39 Hebrew-canon books stay with OSHB.
// PS2 (Psalm 151) and MAN (Prayer of Manasseh) are filtered from psalms-lxx.json / odes.json.
const LXX_FILES = {
  "tobit.json": "TOB",
  "judith.json": "JDT",
  "esther-greek.json": "ESG",
  "wisdom.json": "WIS",
  "sirach.json": "SIR",
  "baruch.json": "BAR",
  "letter-of-jeremiah.json": "LJE",
  "susanna.json": "SUS",
  "bel-and-the-dragon.json": "BEL",
  "1-maccabees.json": "1MA",
  "2-maccabees.json": "2MA",
  "1-esdras.json": "1ES",
  "3-maccabees.json": "3MA",
  "4-maccabees.json": "4MA",
  "daniel.json": "DAG",
};

// Only these LXX works have whole-book, one-to-one verse numbering with the
// named hosted translations. Other imported LXX data remains research corpus,
// but is not joined to English verses until an explicit versification map exists.
const LXX_READER_TRANSLATIONS = {
  "1MA": ["web", "brenton"],
  "2MA": ["web", "brenton"],
  "3MA": ["web", "brenton"],
  PS2: ["web"],
  MAN: ["web", "brenton"],
};

function download(url, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (fs.existsSync(destination) && fs.statSync(destination).size > 100) return;
  console.log(`download ${url}`);
  execFileSync("curl", ["-fLsS", "--max-time", "300", "-o", destination, url], {
    stdio: "inherit",
  });
}

function sourcePath(group, filename) {
  return path.join(CACHE, group, filename);
}

function fetchSources() {
  for (const filename of Object.keys(OSHB_BOOKS)) {
    download(
      `https://raw.githubusercontent.com/openscriptures/morphhb/${OSHB_COMMIT}/wlc/${filename}.xml`,
      sourcePath("oshb", `${filename}.xml`),
    );
  }
  download(
    `https://raw.githubusercontent.com/openscriptures/morphhb/${OSHB_COMMIT}/wlc/VerseMap.xml`,
    sourcePath("oshb", "VerseMap.xml"),
  );
  for (const filename of Object.keys(GREEK_FILES)) {
    download(
      `https://raw.githubusercontent.com/morphgnt/sblgnt/${MORPHGNT_COMMIT}/${filename}`,
      sourcePath("morphgnt", filename),
    );
  }
  for (const filename of Object.keys(LXX_FILES)) {
    download(
      `https://git.sr.ht/~sethkush/lxx-morph/blob/${LXX_COMMIT}/db/seeds/lxx_morph/${filename}`,
      sourcePath("lxx-morph", filename),
    );
  }
  // PS2 (Ps 151) is filtered from psalms-lxx.json; MAN (Prayer of Manasseh) from odes.json
  for (const filename of ["psalms-lxx.json", "odes.json"]) {
    download(
      `https://git.sr.ht/~sethkush/lxx-morph/blob/${LXX_COMMIT}/db/seeds/lxx_morph/${filename}`,
      sourcePath("lxx-morph", filename),
    );
  }
}

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function attributes(tag) {
  const out = {};
  for (const match of tag.matchAll(/([:\w-]+)="([^"]*)"/g)) {
    out[match[1]] = decodeEntities(match[2]);
  }
  return out;
}

function tagName(tag) {
  return tag.match(/^<\/?\s*([:\w-]+)/)?.[1] ?? "";
}

/**
 * Tiny purpose-built OSIS reader. It keeps the source order and the Masoretic
 * punctuation, and chooses the pointed qere for display while retaining the
 * written ketiv as a visible variant. It intentionally understands only the
 * handful of OSIS elements used by the pinned OSHB files.
 */
function parseOshbXml(xml) {
  const verses = new Map();
  const stack = [];
  const wordStack = [];
  let currentVerse = null;
  let currentSeg = null;

  for (const token of xml.match(/<[^>]+>|[^<]+/g) ?? []) {
    if (!token.startsWith("<")) {
      if (stack.at(-1)?.name === "w") wordStack.at(-1).text += decodeEntities(token);
      else if (stack.at(-1)?.name === "seg" && currentSeg)
        currentSeg.text += decodeEntities(token);
      continue;
    }
    if (token.startsWith("<?") || token.startsWith("<!--") || token.startsWith("<!"))
      continue;

    const closing = /^<\//.test(token);
    const selfClosing = /\/>$/.test(token);
    const name = tagName(token);

    if (closing) {
      if (name === "w") {
        const entry = stack.pop();
        const word = wordStack.pop();
        if (!entry || !word) throw new Error("OSHB word stack mismatch");
        const parentWord = wordStack.at(-1);
        if (word.qere && parentWord?.attrs.type === "x-ketiv") {
          parentWord.qere = word;
        } else if (word.qere && currentVerse) {
          // OSHB normally writes the ketiv word first, then places its qere in
          // a sibling <note><rdg>. Replace that pending display token instead
          // of rendering both readings as though both occurred in the verse.
          const pending = currentVerse.words.at(-1);
          if (pending?.isKetiv) {
            currentVerse.words[currentVerse.words.length - 1] = {
              text: word.text.trim().replaceAll("/", ""),
              lemma: word.attrs.lemma ?? "",
              morph: word.attrs.morph ?? "",
              id: word.attrs.id,
              ketiv: pending.text,
              ...(pending.after ? { after: pending.after } : {}),
            };
          }
        } else if (!parentWord && currentVerse) {
          const selected = word.attrs.type === "x-ketiv" && word.qere ? word.qere : word;
          currentVerse.words.push({
            text: selected.text.trim().replaceAll("/", ""),
            lemma: selected.attrs.lemma ?? "",
            morph: selected.attrs.morph ?? "",
            id: selected.attrs.id,
            ...(word.attrs.type === "x-ketiv" && word.qere
              ? { ketiv: word.text.trim().replaceAll("/", "") }
              : {}),
            ...(word.attrs.type === "x-ketiv" && !word.qere ? { isKetiv: true } : {}),
          });
        }
      } else if (name === "seg") {
        stack.pop();
        const value = currentSeg?.text.trim() ?? "";
        if (value && currentVerse?.words.length) {
          const previous = currentVerse.words.at(-1);
          previous.after = `${previous.after ?? ""}${value}`;
        }
        currentSeg = null;
      } else if (name === "verse") {
        stack.pop();
        if (currentVerse) {
          for (const word of currentVerse.words) delete word.isKetiv;
          verses.set(currentVerse.ref, currentVerse.words);
        }
        currentVerse = null;
      } else {
        while (stack.length && stack.at(-1).name !== name) stack.pop();
        if (stack.at(-1)?.name === name) stack.pop();
      }
      continue;
    }

    const attrs = attributes(token);
    if (name === "verse") {
      currentVerse = { ref: attrs.osisID, words: [] };
      stack.push({ name, attrs });
    } else if (name === "w") {
      const qere = stack.some(
        (entry) => entry.name === "rdg" && entry.attrs.type === "x-qere",
      );
      const word = { attrs, text: "", qere };
      wordStack.push(word);
      stack.push({ name, attrs, word });
    } else if (name === "seg") {
      currentSeg = { text: "" };
      stack.push({ name, attrs });
    } else if (!selfClosing) {
      stack.push({ name, attrs });
    }

    if (selfClosing && name === "verse") currentVerse = null;
  }
  return verses;
}

function parseVerseMap(xml) {
  const mapping = new Map();
  for (const match of xml.matchAll(/<verse\s+([^>]+?)\/>/g)) {
    const attrs = attributes(`<verse ${match[1]}>`);
    if (attrs.type === "full") mapping.set(attrs.wlc, attrs.kjv);
  }
  return mapping;
}

function parseRef(ref) {
  const match = ref.match(/^([^.]+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error(`Invalid OSIS reference: ${ref}`);
  return { book: match[1], chapter: Number(match[2]), verse: Number(match[3]) };
}

function pushVerse(chapters, targetRef, sourceRef, words) {
  const { chapter, verse } = parseRef(targetRef);
  const chapterMap = chapters.get(chapter) ?? new Map();
  const existing = chapterMap.get(verse);
  if (existing) {
    existing.words.push(...words);
    existing.sourceRefs.push(sourceRef);
  } else {
    chapterMap.set(verse, { words: [...words], sourceRefs: [sourceRef] });
  }
  chapters.set(chapter, chapterMap);
}

function setMappedVerse(chapters, chapter, verse, words, sourceRefs) {
  const chapterMap = chapters.get(chapter) ?? new Map();
  chapterMap.set(verse, { words, sourceRefs });
  chapters.set(chapter, chapterMap);
}

function mappedVerse(chapters, chapter, verse) {
  const value = chapters.get(chapter)?.get(verse);
  if (!value) throw new Error(`Missing partial-map source ${chapter}:${verse}`);
  return value;
}

/** Seven WLC/KJV boundaries divide a sentence inside a Masoretic verse. */
function applyPartialVerseMappings(book, chapters) {
  if (book === "1KI") {
    const splitAcross = (chapter, firstVerse, secondVerse, firstTake, secondTake) => {
      const first = mappedVerse(chapters, chapter, firstVerse);
      const second = mappedVerse(chapters, chapter, secondVerse);
      setMappedVerse(
        chapters,
        chapter,
        firstVerse,
        [...first.words.slice(0, firstTake), ...second.words.slice(0, secondTake)],
        [...first.sourceRefs, ...second.sourceRefs],
      );
      setMappedVerse(
        chapters,
        chapter,
        secondVerse,
        second.words.slice(secondTake),
        second.sourceRefs,
      );
    };
    splitAcross(18, 33, 34, 9, 10);
    splitAcross(20, 2, 3, 7, 6);

    const v21 = mappedVerse(chapters, 22, 21);
    const v22 = mappedVerse(chapters, 22, 22);
    setMappedVerse(chapters, 22, 21, v21.words.slice(0, 8), v21.sourceRefs);
    setMappedVerse(
      chapters,
      22,
      22,
      [...v21.words.slice(8), ...v22.words],
      [...v21.sourceRefs, ...v22.sourceRefs],
    );
    const v43 = mappedVerse(chapters, 22, 43);
    const v44 = mappedVerse(chapters, 22, 44);
    setMappedVerse(
      chapters,
      22,
      43,
      [...v43.words, ...v44.words.slice(0, 9)],
      [...v43.sourceRefs, v44.sourceRefs[0]],
    );
    setMappedVerse(chapters, 22, 44, v44.words.slice(9), v44.sourceRefs.slice(1));
  } else if (book === "ISA") {
    const verse = mappedVerse(chapters, 63, 19);
    setMappedVerse(chapters, 63, 19, verse.words.slice(0, 9), verse.sourceRefs);
    setMappedVerse(chapters, 64, 1, verse.words.slice(9), verse.sourceRefs);
  } else if (book === "PSA") {
    const verse = mappedVerse(chapters, 13, 6);
    setMappedVerse(chapters, 13, 5, verse.words.slice(0, 6), verse.sourceRefs);
    setMappedVerse(chapters, 13, 6, verse.words.slice(6), verse.sourceRefs);
  }
}

function buildOshb() {
  const verseMap = parseVerseMap(
    fs.readFileSync(sourcePath("oshb", "VerseMap.xml"), "utf8"),
  );
  const books = new Map();

  for (const [osisBook, book] of Object.entries(OSHB_BOOKS)) {
    const rawVerses = parseOshbXml(
      fs.readFileSync(sourcePath("oshb", `${osisBook}.xml`), "utf8"),
    );
    const chapters = new Map();
    for (const [sourceRef, words] of rawVerses) {
      const targetRef = verseMap.get(sourceRef) ?? sourceRef;
      pushVerse(chapters, targetRef, sourceRef, words);
    }
    applyPartialVerseMappings(book, chapters);
    books.set(book, chapters);
  }
  return books;
}

function buildGreek() {
  const books = new Map();
  for (const [filename, book] of Object.entries(GREEK_FILES)) {
    const chapters = new Map();
    const raw = fs.readFileSync(sourcePath("morphgnt", filename), "utf8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      const fields = line.trim().split(/\s+/);
      if (fields.length !== 7 || !/^\d{6}$/.test(fields[0]))
        throw new Error(`${filename}: malformed line ${line}`);
      const chapter = Number(fields[0].slice(2, 4));
      const verse = Number(fields[0].slice(4, 6));
      const chapterMap = chapters.get(chapter) ?? new Map();
      const words = chapterMap.get(verse) ?? [];
      words.push({
        text: fields[3],
        lemma: fields[6],
        morph: `${fields[1]} ${fields[2]}`,
      });
      chapterMap.set(verse, words);
      chapters.set(chapter, chapterMap);
    }
    books.set(book, chapters);
  }
  return books;
}

function buildLxx() {
  const books = new Map();

  const lxxWord = (word) => ({
    text: word.surface,
    lemma: word.lemma || word.surface,
    morph: word.parsing || "",
    ...(word.pos ? { pos: word.pos } : {}),
    ...(word.confidence ? { analysisConfidence: word.confidence } : {}),
    ...(word.source ? { analysisSource: word.source } : {}),
  });

  for (const [filename, book] of Object.entries(LXX_FILES)) {
    const raw = fs.readFileSync(sourcePath("lxx-morph", filename), "utf8");
    const data = JSON.parse(raw);
    const chapters = new Map();
    for (const entry of data) {
      const m = entry.ref.match(/(\d+):(\d+)/);
      if (!m) continue;
      const chapter = Number(m[1]);
      const verse = Number(m[2]);
      // Skip Sirach prologue chapter 0 — site chapters are 1-indexed; keep as 0 would be odd.
      // Keep 0 as-is if present? Normalize 0 → 1 shift is wrong; drop 0 for now.
      if (chapter === 0) continue;
      const chapterMap = chapters.get(chapter) ?? new Map();
      if (chapterMap.has(verse)) {
        // Duplicate numeric verse (e.g. Add Esth 1:1 vs 1:1a) → append words
        chapterMap.get(verse).push(
          ...entry.words.map(lxxWord),
        );
      } else {
        chapterMap.set(
          verse,
          entry.words.map(lxxWord),
        );
      }
      chapters.set(chapter, chapterMap);
    }
    books.set(book, chapters);
  }

  // PS2 — Psalm 151 is Ps 151:1-7 in psalms-lxx.json; expose as single-chapter book PS2 1:1-7
  {
    const raw = fs.readFileSync(sourcePath("lxx-morph", "psalms-lxx.json"), "utf8");
    const data = JSON.parse(raw);
    const chapters = new Map();
    const chapterMap = new Map();
    for (const entry of data) {
      if (!entry.ref.startsWith("Ps 151:")) continue;
      const m = entry.ref.match(/151:(\d+)/);
      if (!m) continue;
      const verse = Number(m[1]);
      chapterMap.set(
        verse,
        entry.words.map(lxxWord),
      );
    }
    if (chapterMap.size) {
      chapters.set(1, chapterMap);
      books.set("PS2", chapters);
    }
  }

  // MAN — Prayer of Manasseh is Odes 12:1-15 in odes.json; expose as MAN 1:1-15
  {
    const raw = fs.readFileSync(sourcePath("lxx-morph", "odes.json"), "utf8");
    const data = JSON.parse(raw);
    const chapters = new Map();
    const chapterMap = new Map();
    for (const entry of data) {
      if (!entry.ref.startsWith("Odes 12:")) continue;
      const m = entry.ref.match(/12:(\d+)/);
      if (!m) continue;
      const verse = Number(m[1]);
      chapterMap.set(
        verse,
        entry.words.map(lxxWord),
      );
    }
    if (chapterMap.size) {
      chapters.set(1, chapterMap);
      books.set("MAN", chapters);
    }
  }

  return books;
}

function languageFor(words, isGreek) {
  if (isGreek) return ["greek"];
  const languages = new Set();
  for (const word of words) {
    if (word.morph.startsWith("A")) languages.add("aramaic");
    else if (word.morph.startsWith("H")) languages.add("hebrew");
    else languages.add("greek");
  }
  return [...languages];
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
}

function emit(oshb, greek, lxx, outputDirectory) {
  fs.mkdirSync(outputDirectory, { recursive: true });
  let chapterCount = 0;
  let wordCount = 0;

  for (const [book, chapters] of [...oshb, ...greek, ...lxx]) {
    const isGreek = greek.has(book);
    const isLxx = lxx.has(book);
    const isGreekLike = isGreek || isLxx;
    for (const [chapter, verseMap] of [...chapters].sort((a, b) => a[0] - b[0])) {
      const verses = [...verseMap]
        .sort((a, b) => a[0] - b[0])
        .map(([number, value]) => {
          const words = isGreekLike ? value : value.words;
          wordCount += words.length;
          return {
            number,
            languages: languageFor(words, isGreekLike),
            words,
            ...(!isGreekLike &&
            (value.sourceRefs.length !== 1 ||
              value.sourceRefs[0] !== `${Object.keys(OSHB_BOOKS).find((k) => OSHB_BOOKS[k] === book)}.${chapter}.${number}`)
              ? { sourceRefs: value.sourceRefs }
              : {}),
          };
        });
      writeJson(path.join(outputDirectory, book, `${chapter}.json`), {
        book,
        bookName: BOOK_NAMES[book],
        chapter,
        edition: isLxx ? "lxx" : isGreek ? "sblgnt" : "oshb",
        direction: isGreekLike ? "ltr" : "rtl",
        verses,
      });
      chapterCount++;
    }
  }

  const manifest = {
    generatedAt: SNAPSHOT_DATE,
    books: {
      ...Object.fromEntries(OT_39.map((book) => [book, "oshb"])),
      ...Object.fromEntries(NT_27.map((book) => [book, "sblgnt"])),
      ...Object.fromEntries([...lxx].map(([book]) => [book, "lxx"])),
    },
    chapterCounts: {
      ...Object.fromEntries([...oshb].map(([book, chapters]) => [book, chapters.size])),
      ...Object.fromEntries([...greek].map(([book, chapters]) => [book, chapters.size])),
      ...Object.fromEntries([...lxx].map(([book, chapters]) => [book, chapters.size])),
    },
    readerTranslations: LXX_READER_TRANSLATIONS,
    editions: {
      oshb: {
        name: "Open Scriptures Hebrew Bible",
        description:
          "Westminster Leningrad Codex text with Open Scriptures lemma and morphology data; Hebrew and Aramaic.",
        source: "https://github.com/openscriptures/morphhb",
        revision: OSHB_COMMIT,
        textLicense: "Public domain",
        dataLicense: "CC BY 4.0",
        attribution: "Open Scriptures Hebrew Bible Project",
      },
      sblgnt: {
        name: "SBL Greek New Testament + MorphGNT",
        description:
          "SBL Greek New Testament text with MorphGNT lemmatization and morphology.",
        source: "https://github.com/morphgnt/sblgnt",
        revision: MORPHGNT_COMMIT,
        textLicense: "CC BY 4.0",
        dataLicense: "CC BY-SA 3.0",
        attribution:
          "SBLGNT, Society of Biblical Literature and Logos Bible Software; MorphGNT, James Tauber, ed.",
      },
      lxx: {
        name: "Rahlfs Septuagint — lxx-morph",
        description:
          "Rahlfs Septuagint (1935) Greek text, derived from the Eliran Wong public-domain digital edition, with lxx-morph lemmatization and morphology (deuterocanon / LXX extras).",
        source: "https://git.sr.ht/~sethkush/lxx-morph",
        revision: LXX_COMMIT,
        textLicense: "Public domain (Rahlfs 1935)",
        dataLicense: "CC BY 4.0",
        attribution:
          "LXX morphology data by Seth Kushniryk, CC BY 4.0, derived from the public-domain Rahlfs Septuagint (Eliran Wong digital edition).",
      },
    },
  };
  writeJson(path.join(outputDirectory, "manifest.json"), manifest);
  fs.writeFileSync(
    path.join(outputDirectory, "SOURCES.md"),
    `# Original-language Scripture sources\n\n` +
      `Generated from source revisions pinned in \`scripts/scriptures/build-originals.mjs\`.\n\n` +
      `| Corpus | Text | Word data | Revision |\n` +
      `| --- | --- | --- | --- |\n` +
      `| [Open Scriptures Hebrew Bible](https://github.com/openscriptures/morphhb) | Westminster Leningrad Codex, public domain | OSHB morphology and lemma data, CC BY 4.0 | \`${OSHB_COMMIT}\` |\n` +
      `| [SBL Greek New Testament + MorphGNT](https://github.com/morphgnt/sblgnt) | SBLGNT, CC BY 4.0 | MorphGNT morphology and lemmatization, CC BY-SA 3.0 | \`${MORPHGNT_COMMIT}\` |\n` +
      `| [Rahlfs Septuagint — lxx-morph](https://git.sr.ht/~sethkush/lxx-morph) | Rahlfs 1935 via the Eliran Wong digital edition, public domain | Morphology data by Seth Kushniryk, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | \`${LXX_COMMIT}\` |\n\n` +
      `The Hebrew files follow the pointed qere for display and retain a ketiv form on the word record when the source marks one. ` +
      `OSHB's verse map is used to align full Masoretic verses with the English numbering used by this site; a source reference is retained whenever the numbering differs. ` +
      `The reader identifies each edition because none is a surviving authorial manuscript. ` +
      `LXX word lines appear only for books and translations whose verse numbering matches for the whole work; the remaining imported LXX data stays unavailable until an explicit versification map is reviewed. ` +
      `This site adapts and filters lxx-morph into chapter-level reader records, renames fields for the reader contract, and omits verbose per-token reasoning from the distributed reader files; that reasoning remains in the pinned upstream revision. ` +
      `Per-token part of speech, parsing, confidence, and analysis-source labels are retained from lxx-morph.\n`,
  );
  console.log(`wrote ${chapterCount} chapters, ${wordCount} words`);
}

function validate(oshb, greek, lxx) {
  if (oshb.size !== 39) throw new Error(`Expected 39 Hebrew Bible books; got ${oshb.size}`);
  if (greek.size !== 27) throw new Error(`Expected 27 Greek NT books; got ${greek.size}`);
  if (lxx.size !== 17) throw new Error(`Expected 17 correctly identified LXX books; got ${lxx.size}: ${[...lxx.keys()].join(",")}`);
  if (lxx.has("2ES")) throw new Error("Rahlfs Esdras B must not be published as apocalyptic 2 Esdras");
  const gen11 = oshb.get("GEN")?.get(1)?.get(1)?.words ?? [];
  if (gen11[0]?.text !== "בְּרֵאשִׁ֖ית")
    throw new Error(`Unexpected Genesis 1:1 opening: ${gen11[0]?.text}`);
  const dan24 = oshb.get("DAN")?.get(2)?.get(4)?.words ?? [];
  if (!dan24.some((word) => word.morph.startsWith("H")) ||
      !dan24.some((word) => word.morph.startsWith("A")))
    throw new Error("Daniel 2:4 should contain both Hebrew and Aramaic");
  const jhn11 = greek.get("JHN")?.get(1)?.get(1) ?? [];
  if (jhn11[0]?.text !== "Ἐν") throw new Error(`Unexpected John 1:1 opening: ${jhn11[0]?.text}`);
  const tob11 = lxx.get("TOB")?.get(1)?.get(1) ?? [];
  if (tob11[0]?.text !== "βίβλος") throw new Error(`Unexpected Tobit 1:1 opening: ${tob11[0]?.text}`);
  const ps151 = lxx.get("PS2")?.get(1)?.get(1) ?? [];
  if (!ps151.length) throw new Error("Psalm 151 LXX missing");
  const man11 = lxx.get("MAN")?.get(1)?.get(1) ?? [];
  if (man11[0]?.text !== "κύριε") throw new Error(`Unexpected MAN 1:1 opening: ${man11[0]?.text}`);

  for (const [book, translations] of Object.entries(LXX_READER_TRANSLATIONS)) {
    const chapters = lxx.get(book);
    if (!chapters) throw new Error(`Reader-aligned LXX book ${book} is missing`);
    for (const translation of translations) {
      const file = path.join(PUBLIC_SCRIPTURES, "text", translation, `${book}.json`);
      const hosted = JSON.parse(fs.readFileSync(file, "utf8"));
      if (hosted.book !== book || hosted.chapters.length !== chapters.size) {
        throw new Error(`${book}/${translation} chapter count does not align with lxx-morph`);
      }
      for (const [chapter, verseMap] of chapters) {
        const hostedChapter = hosted.chapters[chapter - 1];
        const verseNumbers = [...verseMap.keys()].sort((left, right) => left - right);
        if (
          !hostedChapter ||
          verseNumbers.length !== hostedChapter.length ||
          verseNumbers.some((number, index) => number !== index + 1)
        ) {
          throw new Error(`${book} ${chapter}/${translation} verse numbering does not align with lxx-morph`);
        }
      }
    }
  }
  console.log("validation passed: 39 Hebrew/Aramaic + 27 Greek NT + 17 correctly identified LXX books; 5 LXX books are reader-aligned");
}

fetchSources();
const oshb = buildOshb();
const greek = buildGreek();
const lxx = buildLxx();
validate(oshb, greek, lxx);
fs.mkdirSync(CACHE, { recursive: true });
const stagingRoot = fs.mkdtempSync(path.join(CACHE, "publish-"));
try {
  emit(oshb, greek, lxx, path.join(stagingRoot, "original"));
  publishStagedEntriesSync(stagingRoot, PUBLIC_SCRIPTURES, ["original"], {
    label: "original-scriptures",
  });
} finally {
  fs.rmSync(stagingRoot, { recursive: true, force: true });
}
