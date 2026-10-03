#!/usr/bin/env node
// Words of Jesus (red-letter) extractor: pulls every \wj ...\wj* span from the
// World English Bible USFM source and emits public/jesus/words.json.
// Plain Node >= 18, no dependencies (uses system curl + unzip, same as build-data.mjs).
// Run: node scripts/scriptures/extract-words.mjs
//
// Output shape (minified):
//   { "books": { "MAT": { "5:3": "Blessed are the poor in spirit, ..." } },
//     "counts": { "MAT": 574, ... } }
//
// Notes:
// - Books are detected by the presence of \wj markers (not assumed): WEB red-letters
//   MAT MRK LUK JHN ACT 1CO 2CO 1TI REV (1TI 5:18 quotes Luke 10:7).
// - Multiple \wj spans in one verse are joined with " … " when narration sits between
//   them, or with a plain space when only markup/footnotes separate them.
// - Markup is stripped the same way build-data.mjs does for VPL text (pilcrow/nbsp/
//   whitespace collapse); additionally the outer double quotation marks that USFM
//   places inside \wj spans are trimmed, since red-letter styling replaces them.
//   Inner single quotes (‘ ’) are kept as printed. No words added, removed, or changed.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EBIBLE_TO_USFM, BOOK_NAMES, PROTESTANT_66, DEUTERO_ORDER } from './canon-data.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(HERE, '.cache');
const OUT_DIR = path.resolve(HERE, '../../public/jesus');
const OUT_FILE = path.join(OUT_DIR, 'words.json');
const WEB_TEXT_DIR = path.resolve(HERE, '../../public/scriptures/text/web');

const USFM_ID = 'eng-web_usfm';
const USFM_URL = 'https://ebible.org/Scriptures/eng-web_usfm.zip';

// ---------- fetch (idempotent; skipped when cached) ----------
function fetchUsfm() {
  fs.mkdirSync(CACHE, { recursive: true });
  const zip = path.join(CACHE, `${USFM_ID}.zip`);
  if (!fs.existsSync(zip) || fs.statSync(zip).size < 100_000) {
    console.log(`downloading ${USFM_URL}`);
    execFileSync('curl', ['-sL', '--max-time', '300', '-o', zip, USFM_URL]);
  }
  const dir = path.join(CACHE, USFM_ID);
  if (!fs.existsSync(dir) || !fs.readdirSync(dir).some((f) => f.endsWith('.usfm'))) {
    fs.mkdirSync(dir, { recursive: true });
    execFileSync('unzip', ['-oq', zip, '-d', dir]);
  }
  return dir;
}

// ---------- strip helpers (verse cleaning identical to build-data.mjs cleanVerse) ----------
function cleanVerse(text) {
  return text
    .replace(/¶/g, ' ')   // pilcrow
    .replace(/ /g, ' ')   // nbsp
    .replace(/\s+/g, ' ')
    .trim();
}

function stripNotes(s) {
  // footnotes, endnotes, cross-references: drop entirely (incl. \fr \ft \fqa \xo \xt)
  return s
    .replace(/\\fe .*?\\fe\*/gs, ' ')
    .replace(/\\f .*?\\f\*/gs, ' ')
    .replace(/\\x .*?\\x\*/gs, ' ');
}

function unwrapWords(s) {
  // \w text|strong="..."\w* and nested \+w ...\+w* -> keep the text, drop attributes
  return s.replace(/\\\+?w ([^\\|]*)(?:\|[^\\]*?)?\\\+?w\*/g, '$1');
}

// Red-letter styling stands in for the outermost quotation marks that USFM keeps
// inside \wj spans; trim them per span (WEB uses “ ” only at the outermost level).
function trimOuterQuotes(verseText) {
  return verseText
    .split(' … ')
    .map((part) => part.replace(/^[“"]+\s*/, '').replace(/\s*[”"]+$/, ''))
    .filter(Boolean)
    .join(' … ');
}

// ---------- per-book extraction ----------
const stats = { bridgedVerses: 0, unbalancedWj: 0 };

function extractBook(raw) {
  const s = unwrapWords(stripNotes(raw.replace(/\r\n?/g, '\n')));

  // token stream: markers vs. text between them
  const events = [];
  const re = /\\(\+?[a-z0-9]+\*?)/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) events.push({ text: s.slice(last, m.index) });
    events.push({ marker: m[1] });
    last = re.lastIndex;
  }
  if (last < s.length) events.push({ text: s.slice(last) });

  const verses = new Map(); // "c:v" -> { red, plainSince }
  let bookId = null;
  let chapter = 0;
  let cur = null;
  let inWj = false;
  let expect = null; // marker whose argument leads the next text token: 'id' | 'c' | 'v'

  for (const ev of events) {
    if (ev.marker) {
      const mk = ev.marker;
      if (mk === 'id' || mk === 'c' || mk === 'v') expect = mk;
      else if (mk === 'wj') inWj = true;
      else if (mk === 'wj*') inWj = false;
      // every other marker (\p \q1 \q2 \m \b \nb \h \toc* \mt* \ide ...) acts as whitespace
      continue;
    }

    let text = ev.text;
    if (expect === 'id') {
      const idm = text.match(/^\s*([0-9A-Z]{2,3})/);
      if (idm) bookId = EBIBLE_TO_USFM[idm[1]] ?? idm[1];
      expect = null;
      continue;
    }
    if (expect === 'c') {
      const cm = text.match(/^\s*(\d+)/);
      if (cm) { chapter = +cm[1]; cur = null; }
      expect = null;
      continue;
    }
    if (expect === 'v') {
      const vm = text.match(/^\s*(\d+)(?:[-–](\d+))?[a-z]?\s?/);
      expect = null;
      if (!vm || !chapter) continue;
      if (vm[2]) stats.bridgedVerses++;
      const key = `${chapter}:${+vm[1]}`;
      cur = verses.get(key);
      if (!cur) verses.set(key, (cur = { red: '', plainSince: false }));
      text = text.slice(vm[0].length);
    }
    if (!cur || !/\S/.test(text)) continue;

    if (inWj) {
      if (cur.red) cur.red += cur.plainSince ? ' … ' : ' ';
      cur.red += text;
      cur.plainSince = false;
    } else if (cur.red) {
      cur.plainSince = true; // narration after a span -> next span is non-contiguous
    }
  }
  if (inWj) stats.unbalancedWj++;

  const out = {};
  for (const [key, { red }] of verses) {
    const t = trimOuterQuotes(cleanVerse(red));
    if (t) out[key] = t;
  }
  return { bookId, verses: out };
}

// ---------- main ----------
function main() {
  const dir = fetchUsfm();

  const found = {}; // USFM id -> { "c:v": text }
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.usfm')) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    if (!/\\wj(?!\*)/.test(raw)) continue; // detect red-letter books, don't assume
    const { bookId, verses } = extractBook(raw);
    if (!bookId || !BOOK_NAMES[bookId]) throw new Error(`${file}: unknown book id ${bookId}`);
    if (Object.keys(verses).length) found[bookId] = verses;
  }

  // canonical book order, same global order as canons.json
  const order = [...PROTESTANT_66, ...DEUTERO_ORDER].filter((b) => found[b]);
  const stray = Object.keys(found).filter((b) => !order.includes(b));
  if (stray.length) throw new Error(`books outside global order: ${stray.join(',')}`);

  const books = {};
  const counts = {};
  for (const b of order) {
    books[b] = found[b];
    counts[b] = Object.keys(found[b]).length;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ books, counts })); // minified

  // ---------- validation ----------
  const bytes = fs.statSync(OUT_FILE).size;
  const totalVerses = Object.values(counts).reduce((a, n) => a + n, 0);
  const mat53 = books.MAT?.['5:3'] ?? '';
  const jhn316 = books.JHN?.['3:16'];

  // spot-check 20 random extracted keys against public/scriptures/text/web/{BOOK}.json
  const allKeys = order.flatMap((b) => Object.keys(books[b]).map((k) => [b, k]));
  const webCache = {};
  let spotOk = 0, spotTried = 0, spotFailures = [];
  if (fs.existsSync(WEB_TEXT_DIR)) {
    for (let i = 0; i < 20 && allKeys.length; i++) {
      const [b, key] = allKeys[Math.floor(Math.random() * allKeys.length)];
      spotTried++;
      try {
        webCache[b] ??= JSON.parse(fs.readFileSync(path.join(WEB_TEXT_DIR, `${b}.json`), 'utf8'));
        const [c, v] = key.split(':').map(Number);
        const verse = webCache[b].chapters?.[c - 1]?.[v - 1];
        if (typeof verse === 'string' && verse !== '') spotOk++;
        else spotFailures.push(`${b} ${key}`);
      } catch {
        spotFailures.push(`${b} ${key} (file error)`);
      }
    }
  }

  const checks = [
    ['MAT 5:3 starts "Blessed are the poor"', mat53.startsWith('Blessed are the poor'), JSON.stringify(mat53.slice(0, 60))],
    ['JHN 11:35 absent (narration, not speech)', !('11:35' in (books.JHN ?? {})), books.JHN?.['11:35'] ?? '(absent)'],
    ['JHN 3:16 presence (informational)', true, jhn316 ? `present: ${JSON.stringify(jhn316.slice(0, 60))}` : 'absent'],
    ['MAT count > 550', (counts.MAT ?? 0) > 550, counts.MAT],
    ['LUK count > 550', (counts.LUK ?? 0) > 550, counts.LUK],
    ['JHN count > 400', (counts.JHN ?? 0) > 400, counts.JHN],
    ['MRK count > 250', (counts.MRK ?? 0) > 250, counts.MRK],
    ['file size < 500KB', bytes < 500 * 1024, `${(bytes / 1024).toFixed(1)} KB`],
    ['spot-check keys exist in text/web', spotTried > 0 && spotOk === spotTried, `${spotOk}/${spotTried}${spotFailures.length ? ' failed: ' + spotFailures.join(', ') : ''}`],
    ['no unbalanced \\wj spans', stats.unbalancedWj === 0, stats.unbalancedWj],
  ];
  console.log('=== VALIDATION ===');
  for (const [name, ok, actual] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ->  ${actual}`);

  console.log('\n=== OUTPUT ===');
  console.log(`wrote ${OUT_FILE} (${(bytes / 1024).toFixed(1)} KB)`);
  console.log(`books (${order.length}): ${order.map((b) => `${b}=${counts[b]}`).join(' ')}`);
  console.log(`total red-letter verses: ${totalVerses}; bridgedVerses=${stats.bridgedVerses}`);
}

main();
