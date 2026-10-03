#!/usr/bin/env node
/**
 * One-time source-shard extraction for the 1 Enoch parallel matrices.
 *
 * Every excerpt is pulled programmatically from the hosted corpus texts —
 * public/scriptures/text/web/*.json (World English Bible) and
 * public/scriptures/text/charles/ENO.json (R.H. Charles, 1913) — so the
 * shards cannot drift from what the site actually displays. Also registers
 * the charles-enoch corpus in the parallels rights manifest.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TEXT_DIR = path.join(ROOT, "public/scriptures/text");
const SOURCES_DIR = path.join(ROOT, "public/parallels/sources");
const RIGHTS_FILE = path.join(ROOT, "public/parallels/rights-manifest.json");

const readBook = (trans, book) =>
  JSON.parse(fs.readFileSync(path.join(TEXT_DIR, trans, `${book}.json`), "utf8"));

const verse = (book, chapter, verseNumber) => {
  const data = readBook(book.trans, book.id);
  const text = data.chapters[chapter - 1]?.[verseNumber - 1];
  if (text === undefined || text === "") {
    throw new Error(`${book.id} ${chapter}:${verseNumber} missing in ${book.trans}`);
  }
  return text;
};

const web = (book, chapter, from, to) => {
  const out = {};
  for (let v = from; v <= to; v++) out[`${chapter}:${v}`] = verse({ id: book, trans: "web" }, chapter, v);
  return out;
};

const eno = (chapter, from, to) => {
  const out = {};
  for (let v = from; v <= to; v++) out[`${chapter}:${v}`] = verse({ id: "ENO", trans: "charles" }, chapter, v);
  return out;
};

const shards = [
  {
    id: "jude-14-15",
    work: "Jude",
    edition: "web-bible",
    translator: "World English Bible",
    sections: web("JUD", 1, 14, 15),
  },
  {
    id: "1-enoch-1",
    work: "1 Enoch",
    edition: "charles-enoch",
    translator: "R.H. Charles (1913)",
    sections: { ...eno(1, 1, 5), ...eno(1, 9, 9) },
  },
  {
    id: "1-enoch-6-16",
    work: "1 Enoch",
    edition: "charles-enoch",
    translator: "R.H. Charles (1913)",
    sections: { ...eno(6, 1, 8), ...eno(7, 1, 6), ...eno(10, 4, 6), ...eno(10, 11, 13) },
  },
  {
    id: "1-enoch-46-48",
    work: "1 Enoch",
    edition: "charles-enoch",
    translator: "R.H. Charles (1913)",
    sections: { ...eno(46, 1, 3), ...eno(48, 2, 7) },
  },
  {
    id: "daniel-7-13-14",
    work: "Daniel",
    edition: "web-bible",
    translator: "World English Bible",
    sections: web("DAN", 7, 13, 14),
  },
  {
    id: "genesis-6-1-4",
    work: "Genesis",
    edition: "web-bible",
    translator: "World English Bible",
    sections: web("GEN", 6, 1, 4),
  },
  {
    id: "matthew-26-63-65",
    work: "Matthew",
    edition: "web-bible",
    translator: "World English Bible",
    sections: web("MAT", 26, 63, 65),
  },
];

fs.mkdirSync(SOURCES_DIR, { recursive: true });
for (const shard of shards) {
  const target = path.join(SOURCES_DIR, `${shard.id}.json`);
  fs.writeFileSync(target, `${JSON.stringify(shard, null, 2)}\n`);
  console.log(`shard: ${path.relative(ROOT, target)} (${Object.keys(shard.sections).length} sections)`);
}

// ── Rights manifest: register the charles-enoch corpus ─────────────────────
const rights = JSON.parse(fs.readFileSync(RIGHTS_FILE, "utf8"));
if (!rights.corpora["charles-enoch"]) {
  const enoFile = path.join(TEXT_DIR, "charles", "ENO.json");
  const sha256 = crypto.createHash("sha256").update(fs.readFileSync(enoFile)).digest("hex");
  rights.corpora["charles-enoch"] = {
    id: "charles-enoch",
    title: "1 Enoch (R.H. Charles translation, 1913)",
    publisher: "SPCK; Wikisource transcription",
    upstreamUrl: "https://en.wikisource.org/wiki/The_Book_of_Enoch_(Charles)",
    retrievedAt: new Date().toISOString(),
    sha256,
    license: "Public Domain",
    notice:
      "R.H. Charles' 1913 translation of 1 Enoch (SPCK) is in the public domain. The Wikisource transcription is used verbatim; Charles' editorial marks (⌈⌉ conjectures, [ ] restorations) are preserved.",
  };
  fs.writeFileSync(RIGHTS_FILE, `${JSON.stringify(rights, null, 2)}\n`);
  console.log("rights: charles-enoch registered (sha256 " + sha256.slice(0, 12) + "…)");
} else {
  console.log("rights: charles-enoch already registered");
}
