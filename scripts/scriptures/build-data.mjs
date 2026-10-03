#!/usr/bin/env node
// Scripture data pipeline: downloads public-domain sources into .cache/ (skipped when
// already present) and regenerates everything under public/scriptures/ from scratch.
// Plain Node >= 18, no dependencies. Run: node scripts/scriptures/build-data.mjs

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EBIBLE_TO_USFM, BOOK_NAMES, PROTESTANT_66, DEUTERO_ORDER,
  TRANSLATIONS, TRADITIONS, TSK_ABBR, STOPWORDS,
} from './canon-data.mjs';
import { publishStagedEntriesSync } from '../lib/atomic-publication.mjs';
import { buildCharlesSearch, stageCharlesBooks } from './charles-supplement.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(HERE, '.cache');
const FINAL_OUT = path.resolve(HERE, '../../public/scriptures');
const GENERATED_ENTRIES = [
  'text',
  'xref',
  'search',
  'canons.json',
  'shelf.json',
  'SOURCES.md',
];
let OUT = FINAL_OUT;
const RETRIEVED = '2026-07-01';

const SOURCES = {
  web:     { id: 'eng-web',     url: 'https://ebible.org/Scriptures/eng-web_vpl.zip' },
  kjv:     { id: 'eng-kjv2006', url: 'https://ebible.org/Scriptures/eng-kjv2006_vpl.zip' },
  drb:     { id: 'engDRA',      url: 'https://ebible.org/Scriptures/engDRA_vpl.zip' },
  brenton: { id: 'eng-Brenton', url: 'https://ebible.org/Scriptures/eng-Brenton_vpl.zip' },
};
const TSK_URL = 'https://raw.githubusercontent.com/ariseshinestudio/TSK/master/tskxref.txt';

// ---------- fetch ----------
function fetchSources() {
  fs.mkdirSync(CACHE, { recursive: true });
  for (const { id, url } of Object.values(SOURCES)) {
    const zip = path.join(CACHE, `${id}_vpl.zip`);
    if (!fs.existsSync(zip) || fs.statSync(zip).size < 100_000) {
      console.log(`downloading ${url}`);
      execFileSync('curl', ['-sL', '--max-time', '300', '-o', zip, url]);
    }
    const dir = path.join(CACHE, id);
    const vpl = path.join(dir, `${id}_vpl.txt`);
    if (!fs.existsSync(vpl)) {
      fs.mkdirSync(dir, { recursive: true });
      execFileSync('unzip', ['-oq', zip, '-d', dir]);
    }
  }
  const tsk = path.join(CACHE, 'tskxref.txt');
  if (!fs.existsSync(tsk) || fs.statSync(tsk).size < 1_000_000) {
    console.log(`downloading ${TSK_URL}`);
    execFileSync('curl', ['-sL', '--max-time', '300', '-o', tsk, TSK_URL]);
  }
}

// ---------- parse VPL ----------
const SKIP_BOOKS = new Set(['FRT', 'BAK', 'GLO', 'XXA', 'XXB', 'XXC', 'OTH', 'INT', 'CNC', 'TDX', 'NDX']);
const stats = { gapFills: {}, emptyVerseLines: 0, subVerseMerges: 0, dupVerseLines: 0, skippedVplLines: 0 };

function cleanVerse(text) {
  return text
    .replace(/¶/g, ' ')   // pilcrow
    .replace(/ /g, ' ')   // nbsp
    .replace(/\s+/g, ' ')
    .trim();
}

// returns { BOOKID: [ [v1,v2,...] per chapter ] } with '' placeholders for gaps
function parseVpl(transKey) {
  const { id } = SOURCES[transKey];
  const raw = fs.readFileSync(path.join(CACHE, id, `${id}_vpl.txt`), 'utf8');
  const books = new Map(); // id -> Map(ch -> Map(v -> text))
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const m = line.match(/^([0-9A-Z]{2,3}) (\d+):(\d+)([a-z])?\s?(.*)$/);
    if (!m) { stats.skippedVplLines++; continue; }
    let [, book, ch, v, sub, text] = m;
    if (SKIP_BOOKS.has(book)) continue;
    book = EBIBLE_TO_USFM[book] ?? book;
    if (!BOOK_NAMES[book]) throw new Error(`${transKey}: unknown book id ${book}`);
    ch = +ch; v = +v;
    if (ch === 0 || v === 0) continue; // front matter / headings
    let chs = books.get(book);
    if (!chs) books.set(book, (chs = new Map()));
    let vs = chs.get(ch);
    if (!vs) chs.set(ch, (vs = new Map()));
    const t = cleanVerse(text);
    if (!t && !vs.has(v)) {
      vs.set(v, ''); stats.emptyVerseLines++; // explicit omitted-verse placeholder
    } else if (sub) {
      // LXX lettered sub-verse (e.g. JOS 9:2a): append to the base verse, keeping order
      vs.set(v, `${vs.get(v) ?? ''} ${t}`.trim()); stats.subVerseMerges++;
    } else if (vs.has(v) && vs.get(v) !== '') {
      vs.set(v, `${vs.get(v)} ${t}`.trim()); stats.dupVerseLines++;
    } else {
      vs.set(v, t);
    }
  }
  const out = {};
  for (const [book, chs] of books) {
    const maxCh = Math.max(...chs.keys());
    const chapters = [];
    for (let c = 1; c <= maxCh; c++) {
      const vs = chs.get(c);
      if (!vs) { chapters.push([]); stats.gapFills[transKey] = (stats.gapFills[transKey] ?? 0) + 1; continue; }
      const maxV = Math.max(...vs.keys());
      const verses = [];
      for (let v = 1; v <= maxV; v++) {
        if (vs.has(v)) verses.push(vs.get(v));
        else { verses.push(''); stats.gapFills[transKey] = (stats.gapFills[transKey] ?? 0) + 1; }
      }
      chapters.push(verses);
    }
    out[book] = chapters;
  }
  return out;
}

// ---------- TSK ----------
function parseTskRefSegment(seg) {
  // -> array of display refs "BOOK c:v" | "BOOK c:v-v2", or null if unparseable
  let s = seg.replace(/ /g, ' ').trim();
  if (!s) return null;
  const u = s.match(/^([123]?[A-Za-z]+)(\d+)_(\d+)$/); // e.g. "Ge8_16"
  if (u) s = `${u[1]} ${u[2]}:${u[3]}`;
  s = s.replace(/\s*,\s*/g, ','); // "44:4, 5" -> "44:4,5"
  const m = s.match(/^([123]?[a-z]+) (\d+):(\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)$/i);
  if (!m) return null;
  const book = TSK_ABBR[m[1].toLowerCase()];
  if (!book) return null;
  const ch = m[2];
  return m[3].split(',').map((part) => `${book} ${ch}:${part}`);
}

function buildXrefs() {
  const raw = fs.readFileSync(path.join(CACHE, 'tskxref.txt'), 'utf8');
  const rows = [];
  let badRefSegs = 0, badLines = 0;
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const f = line.split('\t');
    if (f.length < 6) { badLines++; continue; }
    const [bn, ch, v, sort] = [+f[0], +f[1], +f[2], +f[3]];
    const book = PROTESTANT_66[bn - 1];
    if (!book || !ch || !v) { badLines++; continue; }
    rows.push({ book, ch, v, sort, refs: f[5] });
  }
  rows.sort((a, b) => a.ch - b.ch || a.v - b.v || a.sort - b.sort); // stable within book groups
  const byBook = new Map();
  for (const r of rows) {
    let refsMap = byBook.get(r.book);
    if (!refsMap) byBook.set(r.book, (refsMap = new Map()));
    const key = `${r.ch}:${r.v}`;
    let list = refsMap.get(key);
    if (!list) refsMap.set(key, (list = { seen: new Set(), out: [] }));
    for (const seg of r.refs.split(';')) {
      const parsed = parseTskRefSegment(seg);
      if (!parsed) { if (seg.trim()) badRefSegs++; continue; }
      for (const ref of parsed) {
        if (!list.seen.has(ref)) { list.seen.add(ref); list.out.push(ref); }
      }
    }
  }
  return { byBook, badRefSegs, badLines };
}

// ---------- search ----------
function* tokensOf(text) {
  const norm = text.toLowerCase().replace(/[‘’ʼ]/g, "'");
  for (const raw of norm.match(/[a-z0-9']+/g) ?? []) {
    const tok = raw.replace(/'/g, '');
    if (!tok || /^\d+$/.test(tok)) continue;
    yield tok;
  }
}

export function renderScriptureSources() {
  return `# Scripture data sources

All texts below are in the public domain. The eBible and TSK sources were
retrieved ${RETRIEVED}; supplemental source records carry their own retrieval dates.

| Source | ID | URL | License |
| --- | --- | --- | --- |
| World English Bible (with Apocrypha/Deuterocanon) | eng-web | ${SOURCES.web.url} | Public domain |
| King James Version (1769 Blayney, eBible 2006 ed.) | eng-kjv2006 | ${SOURCES.kjv.url} | Public domain |
| Douay-Rheims 1899 American (Challoner) | engDRA | ${SOURCES.drb.url} | Public domain |
| Brenton Septuagint 1851 | eng-Brenton | ${SOURCES.brenton.url} | Public domain |
| 1 Enoch, R. H. Charles (1913) | charles/ENO | https://en.wikisource.org/wiki/The_Book_of_Enoch_(Charles) | Public domain |
| Jubilees, R. H. Charles, The Apocrypha and Pseudepigrapha of the Old Testament, vol. II (Oxford: Clarendon Press, 1913) | charles/JUB | https://www.ccel.org/c/charles/otpseudepig/jubilee/index.htm | Public domain |
| Treasury of Scripture Knowledge cross-references | tskxref.txt | ${TSK_URL} | Public domain |
| Nave's Topical Bible (Orville J. Nave, 1897) | NavesTopicalDictionary.csv | https://raw.githubusercontent.com/BradyStephenson/bible-data/main/NavesTopicalDictionary.csv | Public domain (original work; see note below) |

## R. H. Charles supplements

- The existing 1 Enoch file and its attribution are retained unchanged; its
  ingestion is documented in scripts/scriptures/ingest-enoch.mjs.
- Jubilees uses CCEL's transcription of Charles's 1913 text, scanned and edited
  by Joshua Williams, Northwest Nazarene College. The printed volume is available
  at https://archive.org/details/apocryphapseudep02char .
- Jubilees preserves CCEL's wording and editorial dates. Review against the 1913
  marginal numbering and the 1917 edition's explicit numbering restored 34 verse
  boundaries and two missing verse markers; 20:9 retains the CCEL/1913 boundary.
- The prior Jubilees 17–18 comparison excerpt had omissions. Its source-reviewed
  corrections now match all 23 corresponding full-text verses exactly. See the
  [source review](https://github.com/Vartabg/garovartabedian/blob/master/docs/jubilees-source-review.md) and the
  [pinned source manifest](https://github.com/Vartabg/garovartabedian/blob/master/scripts/scriptures/sources/charles-jubilees-1913/manifest.json)
  for the evidence and boundary repairs.

## World English Bible trademark note

"World English Bible" is a trademark of eBible.org. The WEB text itself is dedicated
to the public domain. Because the text is reproduced here **unmodified** (verse text
as published, markup stripped, no edits), the name "World English Bible" may be used
to identify it, per eBible.org's usage terms.

## Processing notes

- The four eBible editions use verse-per-line (VPL) files, with pilcrows and
  extra whitespace removed. No words were added, removed, or changed.
- Bracketed words (e.g. KJV/Brenton translator-supplied italics) are kept as printed.
- eBible legacy book codes were normalized to standard USFM IDs
  (e.g. JOH -> JHN, PSX -> PS2, DNG -> DAG).
- Missing/bridged verse numbers are kept as empty-string placeholders so verse
  numbering stays aligned with the printed editions.

## Nave's Topical Bible note

Orville J. Nave's Topical Bible was first published in 1897 (Nave died in 1917); it is
in the public domain in the US regardless of any license a particular hosting repo
states for its own redistribution — a plain transcription of a public-domain work does
not create a new copyright. The CSV above is one such transcription; the topic wording
was spot-checked against biblehub.com's independent hosting of the same original text
and matches. \`scripts/scriptures/build-nave.py\` parses it into \`public/scriptures/nave/\`,
resolving Nave's own concordance shorthand (a semicolon starts a new reference clause,
which may omit the book — inheriting the last one stated — and a comma adds another
verse to the current chapter), then verifies every resulting reference against the WEB
text hosted here and drops anything that doesn't resolve (this caught roughly a dozen
genuine typos in the source, e.g. a Mark chapter number that doesn't exist).

The same discipline applies to the dictionary's internal "See X" topic-to-topic
pointers: each one is checked against the actual set of topics this build keeps,
normalizing case/whitespace and trying a comma-order swap for citations like
"PRIEST, HIGH" -> "HIGH PRIEST" (about 3,276 of 4,499 resolve this way). A "See"
that's really a footnote artifact from the 1897 print edition — a bracketed note
number, an embedded scripture reference, a "titles of PSA N" pointer — is rendered
as plain text rather than a link. Anything left that still doesn't resolve to a real
topic (about 1,223 of 4,499, roughly a quarter — mostly cross-references to entries
this particular digitization never carried over as their own topic) is de-linked to
plain text too, rather than pointing somewhere dead.
`;
}

// ---------- emit ----------
const written = [];
function writeJson(rel, obj) {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj)); // minified
  written.push(p);
}

function buildOutput() {
  // OUT is a fresh staging tree. Live data remains untouched until validation.
  for (const sub of ['text', 'xref', 'search']) {
    fs.rmSync(path.join(OUT, sub), { recursive: true, force: true });
  }
  fs.mkdirSync(OUT, { recursive: true });

  // ----- text -----
  const texts = {}; // trans -> { BOOK: chapters[][] }
  for (const trans of Object.keys(SOURCES)) texts[trans] = parseVpl(trans);
  // These independently ingested, versioned texts are not in the eBible ZIPs.
  // Read them before replacing the live text directory; a missing/incomplete
  // supplement must block publication rather than silently remove a book.
  const charlesBooks = stageCharlesBooks(FINAL_OUT, OUT);
  for (const book of Object.keys(charlesBooks)) written.push(path.join(OUT, 'text/charles', `${book}.json`));
  texts.charles = Object.fromEntries(Object.entries(charlesBooks).map(([book, text]) => [book, text.chapters]));

  const available = new Set(Object.values(texts).flatMap((t) => Object.keys(t)));
  const bookOrder = [...PROTESTANT_66, ...DEUTERO_ORDER].filter((b) => available.has(b));
  const extra = [...available].filter((b) => !bookOrder.includes(b));
  if (extra.length) throw new Error(`books outside global order: ${extra.join(',')}`);

  for (const [trans, books] of Object.entries(texts)) {
    if (trans === 'charles') continue; // Already staged verbatim from the ingested source files.
    for (const book of bookOrder) {
      if (!books[book]) continue;
      writeJson(`text/${trans}/${book}.json`, {
        trans, book, name: BOOK_NAMES[book], chapters: books[book],
      });
    }
  }

  // ----- canons.json -----
  const books = {};
  for (const book of bookOrder) {
    const trans = Object.keys(texts).filter((t) => texts[t][book]);
    const chapters = Math.max(...trans.map((t) => texts[t][book].length));
    books[book] = { name: BOOK_NAMES[book], chapters, trans };
  }
  const traditions = TRADITIONS.map((t) => ({ ...t, books: t.books.filter((b) => available.has(b)) }));
  writeJson('canons.json', { bookOrder, books, translations: TRANSLATIONS, traditions });

  // Shelf counts are derived in the same graph as the text files so a corpus
  // rebuild cannot leave this visualization artifact stale.
  const shelf = {};
  for (const book of bookOrder) {
    shelf[book] = Math.max(
      ...Object.values(texts).flatMap((translation) => {
        const bookText = translation[book];
        if (!bookText) return [];
        return [
          bookText.reduce(
            (sum, chapter) =>
              sum + chapter.filter((verse) => typeof verse === 'string' && verse.trim()).length,
            0,
          ),
        ];
      }),
    );
  }
  writeJson('shelf.json', shelf);

  // ----- xref -----
  const { byBook: xrefs, badRefSegs, badLines } = buildXrefs();
  for (const [book, refsMap] of xrefs) {
    const refs = {};
    for (const [key, { out }] of refsMap) if (out.length) refs[key] = out;
    writeJson(`xref/${book}.json`, { book, refs });
  }

  // ----- search (one index per hosted translation) -----
  let totalSearchTokens = 0;
  let totalSearchShards = 0;
  for (const trans of Object.keys(SOURCES)) {
    const postings = new Map(); // token -> [[bIdx,ch,v],...]
    for (let bIdx = 0; bIdx < bookOrder.length; bIdx++) {
      const chapters = texts[trans][bookOrder[bIdx]];
      if (!chapters) continue;
      for (let c = 0; c < chapters.length; c++) {
        for (let v = 0; v < chapters[c].length; v++) {
          if (!chapters[c][v]) continue;
          const seen = new Set();
          for (const tok of tokensOf(chapters[c][v])) {
            if (STOPWORD_SET.has(tok) || seen.has(tok)) continue;
            seen.add(tok);
            let list = postings.get(tok);
            if (!list) postings.set(tok, (list = []));
            list.push([bIdx, c + 1, v + 1]);
          }
        }
      }
    }
    const shards = new Map();
    for (const [tok, list] of postings) {
      const shard = tok.length === 1 ? tok : tok.slice(0, 2);
      let obj = shards.get(shard);
      if (!obj) shards.set(shard, (obj = {}));
      obj[tok] = list;
    }
    for (const [shard, obj] of shards) writeJson(`search/${trans}/${shard}.json`, obj);
    writeJson(`search/${trans}/meta.json`, { trans, stopwords: STOPWORDS, shardScheme: 'first2' });
    totalSearchTokens += postings.size;
    totalSearchShards += shards.size;
  }
  const charlesSearch = buildCharlesSearch(charlesBooks, bookOrder);
  for (const [shard, data] of Object.entries(charlesSearch)) {
    writeJson(`search/charles/${shard}.json`, data);
    if (shard !== 'meta') {
      totalSearchTokens += Object.keys(data).length;
      totalSearchShards += 1;
    }
  }

  // ----- SOURCES.md -----
  const sourcesMd = renderScriptureSources();
  const sourcesPath = path.join(OUT, 'SOURCES.md');
  fs.writeFileSync(sourcesPath, sourcesMd);
  written.push(sourcesPath);

  // ----- validation report -----
  const get = (t, b, c, v) => texts[t]?.[b]?.[c - 1]?.[v - 1];
  const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(OUT, rel), 'utf8'));
  const genXref = readJson('xref/GEN.json');
  const foShard = readJson('search/web/fo.json');
  const checks = [
    ['WEB GEN 1:1 exact', get('web', 'GEN', 1, 1) === 'In the beginning, God created the heavens and the earth.', get('web', 'GEN', 1, 1)],
    ['KJV JHN 3:16 contains "only begotten Son"', (get('kjv', 'JHN', 3, 16) ?? '').includes('only begotten Son'), get('kjv', 'JHN', 3, 16)],
    ['WEB PSA chapters = 150', texts.web.PSA.length === 150, texts.web.PSA.length],
    ['KJV PSA chapters = 150', texts.kjv.PSA.length === 150, texts.kjv.PSA.length],
    ['Brenton PSA chapters (LXX; informational)', true, texts.brenton.PSA.length],
    ['WEB MAT chapters = 28', texts.web.MAT.length === 28, texts.web.MAT.length],
    ['drb has TOB JDT WIS SIR BAR 1MA 2MA', ['TOB','JDT','WIS','SIR','BAR','1MA','2MA'].every((b) => texts.drb[b]), Object.keys(texts.drb).length + ' books'],
    ['brenton has LXX books', ['TOB','JDT','ESG','WIS','SIR','BAR','LJE','SUS','BEL','1MA','2MA','1ES','MAN','3MA','4MA','DAG'].every((b) => texts.brenton[b]), Object.keys(texts.brenton).length + ' books'],
    ['xref GEN refs["1:1"] non-empty', (genXref.refs['1:1'] ?? []).length > 0, JSON.stringify((genXref.refs['1:1'] ?? []).slice(0, 4))],
    ['search shard "fo" has "forgive" postings', (foShard.forgive ?? []).length > 0, (foShard.forgive ?? []).length + ' postings'],
  ];
  console.log('\n=== VALIDATION ===');
  for (const [name, ok, actual] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ->  ${actual}`);
  const failures = checks.filter(([, ok]) => !ok);
  if (failures.length > 0) {
    throw new Error(
      `Scripture build failed ${failures.length} validation check(s): ${failures.map(([name]) => name).join('; ')}`,
    );
  }

  let bytes = 0;
  for (const p of written) bytes += fs.statSync(p).size;
  console.log('\n=== OUTPUT ===');
  console.log(`files: ${written.length}`);
  console.log(`total: ${(bytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`text books: web=${Object.keys(texts.web).length} kjv=${Object.keys(texts.kjv).length} drb=${Object.keys(texts.drb).length} brenton=${Object.keys(texts.brenton).length}`);
  console.log(`bookOrder: ${bookOrder.length} books; xref books: ${xrefs.size}; search tokens: ${totalSearchTokens}; shards: ${totalSearchShards}`);
  console.log(`stats: gapFills=${JSON.stringify(stats.gapFills)} emptyVerseLines=${stats.emptyVerseLines} subVerseMerges=${stats.subVerseMerges} dupVerseLines=${stats.dupVerseLines} skippedVplLines=${stats.skippedVplLines} tskBadLines=${badLines} tskBadRefSegments=${badRefSegs}`);
}

const STOPWORD_SET = new Set(STOPWORDS);

function main() {
  fetchSources();
  const staging = fs.mkdtempSync(path.join(CACHE, 'build-data-'));
  OUT = staging;
  try {
    buildOutput();
    publishStagedEntriesSync(staging, FINAL_OUT, GENERATED_ENTRIES, {
      label: 'scripture-data',
    });
    console.log(`published validated corpus to ${path.relative(process.cwd(), FINAL_OUT)}`);
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
