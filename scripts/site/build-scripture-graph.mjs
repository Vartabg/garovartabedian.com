#!/usr/bin/env node
/**
 * Build the scripture cross-reference graph layer.
 *
 * Reads public/scriptures/xref/*.json (curated cross references), runs
 * deterministic graph algorithms (see scripture-graph.mjs), and writes
 * public/scriptures/graph/graph.json — a static JSON layer the
 * /scriptures/graph page renders. No model, no generation: every number in
 * the output is reproducible from the committed inputs, and the math is
 * unit-tested in tests/scripture-graph.test.ts.
 */

import fs from "node:fs";
import path from "node:path";
import { readJsonOrNull } from "./stable-stamp.mjs";
import { fileURLToPath } from "node:url";
import {
  buildGraph,
  pageRank,
  shortestPath,
} from "./scripture-graph.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const XREF_DIR = path.join(ROOT, "public/scriptures/xref");
const OUT_PATH = path.join(ROOT, "public/scriptures/graph/graph.json");
const ENDPOINT_HUB_DIR = path.join(ROOT, "public/scriptures/graph/endpoint-hubs");
const CANONS = JSON.parse(fs.readFileSync(path.join(ROOT, "public/scriptures/canons.json"), "utf8"));

const bookName = (id) => CANONS.books[id]?.name ?? id;
const displayRef = (id) => {
  const [book, chapter, verse] = id.split(".");
  return `${bookName(book)} ${chapter}:${verse}`;
};
const readerHref = (id) => {
  const [book, chapter, verse] = id.split(".");
  const tradition = CANONS.traditions.find((t) => t.books.includes(book))?.id ?? "protestant";
  return `/scriptures/${tradition}/${book}/${chapter}#v${verse}`;
};

// ── Hosted verses and cross-reference graph ────────────────────────────────
// Exclude source references that do not have a real reader verse/anchor.
const hostedText = new Map();
const verseCounts = {};
const missingVerses = [];
const validVerses = new Set();
for (const book of Object.keys(CANONS.books).sort()) {
  const meta = CANONS.books[book];
  const tradition = CANONS.traditions.find((item) => item.books.includes(book));
  const translation =
    tradition?.transPreference.find((id) => meta.trans.includes(id)) ?? meta.trans[0];
  const text = JSON.parse(
    fs.readFileSync(path.join(ROOT, "public/scriptures/text", translation, `${book}.json`), "utf8"),
  );
  hostedText.set(book, text);
  verseCounts[book] = text.chapters.map((chapter) => chapter.length);
  text.chapters.forEach((chapter, chapterIndex) => {
    chapter.forEach((verse, verseIndex) => {
      const id = `${book}.${chapterIndex + 1}.${verseIndex + 1}`;
      if (verse.trim()) validVerses.add(id);
      else missingVerses.push(id);
    });
  });
}

const xrefFiles = fs
  .readdirSync(XREF_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();
const books = xrefFiles.map((f) => JSON.parse(fs.readFileSync(path.join(XREF_DIR, f), "utf8")));

const rawGraph = buildGraph(books);
const weights = new Map(
  [...rawGraph.weights].filter(([key]) => key.split("|").every((id) => validVerses.has(id))),
);
const nodeSet = new Set();
for (const key of weights.keys()) {
  const [from, to] = key.split("|");
  nodeSet.add(from);
  nodeSet.add(to);
}
const nodes = [...nodeSet].sort();
const edgeCount = weights.size;
let edgeMass = 0;
for (const weight of weights.values()) edgeMass += weight;
const discardedEdges = rawGraph.weights.size - edgeCount;

// ── Centrality ─────────────────────────────────────────────────────────────
const rank = pageRank(nodes, weights);
const outDeg = new Map(nodes.map((n) => [n, 0]));
const inDeg = new Map(nodes.map((n) => [n, 0]));
for (const [key, weight] of weights) {
  const [src, dst] = key.split("|");
  outDeg.set(src, outDeg.get(src) + weight);
  inDeg.set(dst, inDeg.get(dst) + weight);
}
const ranked = [...rank.entries()].sort((a, b) => b[1] - a[1]);
const scoreSum = ranked.reduce((total, [, score]) => total + score, 0);

const topVerses = ranked.slice(0, 100).map(([id, score], index) => ({
  rank: index + 1,
  id,
  ref: displayRef(id),
  href: readerHref(id),
  score: Number(score.toFixed(6)),
  inDegree: inDeg.get(id),
  outDegree: outDeg.get(id),
}));

// ── Citation flows (book level) ────────────────────────────────────────────
// Honest finding: the book-level citation graph is complete — every book
// cites every other — so community detection degenerates to one cluster (the
// canon is one fabric; recorded in meta.stats). The interpretable structure
// is directional: which books lean on which, by verse-level citation count.
const flowTally = new Map();
for (const [key, weight] of weights) {
  const [src, dst] = key.split("|");
  const srcBook = src.split(".")[0];
  const dstBook = dst.split(".")[0];
  if (srcBook === dstBook) continue;
  const pairKey = `${srcBook}|${dstBook}`;
  flowTally.set(pairKey, (flowTally.get(pairKey) ?? 0) + weight);
}
const flows = [...flowTally.entries()]
  .map(([key, citations]) => {
    const [from, to] = key.split("|");
    return {
      from,
      fromName: bookName(from),
      to,
      toName: bookName(to),
      citations,
    };
  })
  .sort((a, b) => b.citations - a.citations || a.from.localeCompare(b.from))
  .slice(0, 20);

// Connected components of the verse graph (union-find) — expected 1.
const parent = new Map(nodes.map((n) => [n, n]));
const find = (x) => {
  let root = x;
  while (parent.get(root) !== root) root = parent.get(root);
  while (parent.get(x) !== root) {
    const next = parent.get(x);
    parent.set(x, root);
    x = next;
  }
  return root;
};
for (const key of weights.keys()) {
  const [src, dst] = key.split("|");
  parent.set(find(src), find(dst));
}
const componentCount = new Set(nodes.map((n) => find(n))).size;

const fullAdj = new Map();
for (const [key, weight] of weights) {
  const [src, dst] = key.split("|");
  for (const [a, b] of [
    [src, dst],
    [dst, src],
  ]) {
    if (!fullAdj.has(a)) fullAdj.set(a, new Map());
    const row = fullAdj.get(a);
    row.set(b, (row.get(b) ?? 0) + weight);
  }
}

function getSnippet(id) {
  const [book, chapterStr, verseStr] = id.split(".");
  const chapter = parseInt(chapterStr, 10);
  const verse = parseInt(verseStr, 10);
  const data = hostedText.get(book);
  if (!data || !data.chapters || !data.chapters[chapter - 1]) return "";
  const raw = data.chapters[chapter - 1][verse - 1] || "";
  return raw.length > 150 ? raw.slice(0, 147) + "…" : raw;
}

const ICONIC_PAIRS = [
  {
    id: "seed-to-crushed-serpent",
    from: "GEN.3.15",
    to: "REV.20.2",
    title: "The Seed of the Woman to the Serpent Bound",
    theme: "Messianic Victory",
  },
  {
    id: "creation-to-new-creation",
    from: "GEN.1.1",
    to: "REV.21.1",
    title: "Creation to the New Heaven and New Earth",
    theme: "Cosmic Renewal",
  },
  {
    id: "suffering-servant",
    from: "ISA.53.5",
    to: "1PE.2.24",
    title: "The Suffering Servant to the Healing Wounds",
    theme: "Atonement",
  },
  {
    id: "good-shepherd",
    from: "PSA.23.1",
    to: "JHN.10.11",
    title: "The Lord is My Shepherd to The Good Shepherd",
    theme: "Pastoral Care",
  },
  {
    id: "divine-name",
    from: "EXO.3.14",
    to: "JHN.8.58",
    title: "The Burning Bush I AM to Jesus: Before Abraham Was, I AM",
    theme: "Divine Identity",
  },
  {
    id: "dry-bones",
    from: "EZK.37.4",
    to: "1CO.15.52",
    title: "The Valley of Dry Bones to the Resurrection Trumpet",
    theme: "Resurrection",
  },
  {
    id: "melchizedek",
    from: "GEN.14.18",
    to: "HEB.7.17",
    title: "Melchizedek with Bread and Wine to the Eternal Priest",
    theme: "Royal Priesthood",
  },
  {
    id: "passover-lamb",
    from: "EXO.12.5",
    to: "REV.5.6",
    title: "The Unblemished Passover Lamb to the Lamb Slain",
    theme: "Redemption",
  },
  {
    id: "scapegoat",
    from: "LEV.16.22",
    to: "HEB.9.28",
    title: "The Scapegoat Bearing Iniquity to Christ Bearing Sin",
    theme: "Day of Atonement",
  },
  {
    id: "forsaken-psalm",
    from: "PSA.22.1",
    to: "MAT.27.46",
    title: "Forsaken in the Psalms to Forsaken on the Cross",
    theme: "The Passion",
  },
  {
    id: "prophet-like-moses",
    from: "DEU.18.15",
    to: "ACT.3.22",
    title: "A Prophet Like Moses to the Apostolic Witness",
    theme: "Prophecy",
  },
  {
    id: "sun-of-righteousness",
    from: "MAL.4.2",
    to: "LUK.1.78",
    title: "The Sun of Righteousness to the Dayspring from on High",
    theme: "The Advent",
  },
  {
    id: "ruth-covenant",
    from: "RUT.1.16",
    to: "REV.21.3",
    title: "Ruth (Thy people shall be my people) to Revelation (They shall be his people)",
    theme: "Covenant People",
  },
  {
    id: "times-and-seasons",
    from: "ECC.3.1",
    to: "ACT.1.7",
    title: "Ecclesiastes (A time for every purpose) to Acts (Times or seasons)",
    theme: "Sovereign Timing",
  },
  {
    id: "love-strong-as-death",
    from: "SNG.8.6",
    to: "ROM.8.35",
    title: "Song of Solomon (Love is strong as death) to Romans (Who shall separate us)",
    theme: "Unfailing Love",
  },
  {
    id: "sign-of-jonah",
    from: "JON.2.2",
    to: "MAT.12.40",
    title: "Jonah from Sheol to the Sign of the Son of Man",
    theme: "Three Days & Nights",
  },
];

const iconicPaths = [];
for (const pair of ICONIC_PAIRS) {
  let pathNodes = shortestPath(fullAdj, pair.from, pair.to, { maxHops: 4 });
  if (!pathNodes) {
    pathNodes = shortestPath(fullAdj, pair.from, pair.to, { maxHops: 6 });
  }
  if (!pathNodes) continue;
  iconicPaths.push({
    id: pair.id,
    title: pair.title,
    theme: pair.theme,
    from: displayRef(pair.from),
    to: displayRef(pair.to),
    fromId: pair.from,
    toId: pair.to,
    hops: pathNodes.length - 1,
    chain: pathNodes.map((id) => ({
      id,
      ref: displayRef(id),
      href: readerHref(id),
      snippet: getSnippet(id),
    })),
  });
}

// ── Threads (hub-relayed journeys between book representatives) ────────────
// Raw shortest paths relay through census-list verses that happen to be
// heavily cross-referenced. Restricting intermediaries to the canon's most
// central verses keeps every hop meaningful: a thread is a chain of hubs.
const HUB_RELAY_COUNT = 1000;
const hubRelaySet = new Set(ranked.slice(0, HUB_RELAY_COUNT).map(([id]) => id));
const relayAdj = new Map([...hubRelaySet].map((id) => [id, new Map()]));
for (const [key, weight] of weights) {
  const [src, dst] = key.split("|");
  for (const [a, b] of [
    [src, dst],
    [dst, src],
  ]) {
    if (!hubRelaySet.has(a) || !hubRelaySet.has(b)) continue;
    if (!relayAdj.has(a)) relayAdj.set(a, new Map());
    const row = relayAdj.get(a);
    row.set(b, (row.get(b) ?? 0) + weight);
  }
}
const anchorByBook = new Map();
for (const [id, score] of ranked) {
  const book = id.split(".")[0];
  if (!anchorByBook.has(book)) anchorByBook.set(book, { id, score });
}
const anchors = [...anchorByBook.values()].sort((a, b) => b.score - a.score);
const threads = [];
for (let i = 0; i < anchors.length; i++) {
  for (let j = i + 1; j < anchors.length; j++) {
    const a = anchors[i].id;
    const b = anchors[j].id;
    if (!relayAdj.has(a) || !relayAdj.has(b)) continue;
    const path = shortestPath(relayAdj, a, b, { maxHops: 5 });
    if (path && path.length >= 4) {
      threads.push({
        from: displayRef(a),
        to: displayRef(b),
        hops: path.length - 1,
        chain: path.map((id) => ({ id, ref: displayRef(id), href: readerHref(id) })),
      });
    }
  }
}
threads.sort((a, b) => b.hops - a.hops || a.from.localeCompare(b.from));

// ── Write ──────────────────────────────────────────────────────────────────
const output = {
  meta: {
    generatedAt: new Date().toISOString(),
    source: "public/scriptures/xref (curated cross references)",
    algorithms: {
      centrality: "weighted PageRank, damping 0.85, power iteration to 1e-10",
      flows: "directed book-to-book citation counts over all verse-level edges",
      threads:
        "breadth-first shortest paths between each book's most central verse, relayed only through the 1,000 most central verses, 3-5 hops",
    },
    determinism: "no randomness; identical inputs produce identical outputs",
    stats: {
      verses: nodes.length,
      distinctEdges: edgeCount,
      edgeMass,
      discardedInvalidEdges: discardedEdges,
      pageRankScoreSum: Number(scoreSum.toFixed(6)),
      connectedComponents: componentCount,
      threadCount: threads.length,
    },
  },
  centrality: topVerses,
  flows,
  threads: threads.slice(0, 12),
  iconicPaths,
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });

// Keep the stamp honest and the worktree clean. This artefact is derived
// entirely from committed cross-references, so a rebuild almost always produces
// identical data — but a wall-clock stamp made `npm run build` dirty the tree
// every run, and one such churned timestamp has already been committed as if it
// were a change. writeStableJson does this for the flat artefacts; generatedAt
// lives inside meta here, so the same comparison is done directly.
const previous = readJsonOrNull(OUT_PATH);
const withoutStamp = (value) =>
  JSON.stringify({ ...value, meta: { ...value.meta, generatedAt: null } });
if (previous && withoutStamp(previous) === withoutStamp(output)) {
  output.meta.generatedAt = previous.meta.generatedAt;
}

fs.writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
fs.writeFileSync(path.join(path.dirname(OUT_PATH), "threads.json"), `${JSON.stringify(threads)}\n`);

const HUB_PATHS_PATH = path.join(ROOT, "public/scriptures/graph/hub-paths.json");
const hubPathsOutput = {
  meta: {
    generatedAt: output.meta.generatedAt,
    hubCount: hubRelaySet.size,
    maxHops: 6,
    xrefBooks: xrefFiles.map((file) => file.replace(/\.json$/, "")),
    verseCounts,
    missingVerses,
  },
  topHubs: ranked.slice(0, 100).map(([id]) => ({
    id,
    ref: displayRef(id),
    href: readerHref(id),
  })),
  hubs: Object.fromEntries(
    [...relayAdj.entries()].map(([k, vMap]) => [k, [...vMap.keys()]]),
  ),
  iconicPaths,
};

const prevHubPaths = readJsonOrNull(HUB_PATHS_PATH);
if (prevHubPaths && withoutStamp(prevHubPaths) === withoutStamp(hubPathsOutput)) {
  hubPathsOutput.meta.generatedAt = prevHubPaths.meta.generatedAt;
}
fs.writeFileSync(HUB_PATHS_PATH, `${JSON.stringify(hubPathsOutput, null, 2)}\n`);

// Arbitrary endpoints only need their undirected links to relay hubs. Direct
// endpoint links are checked against the two existing xref shards at runtime.
fs.mkdirSync(ENDPOINT_HUB_DIR, { recursive: true });
const hostedBooks = new Set(Object.keys(CANONS.books));
for (const file of fs.readdirSync(ENDPOINT_HUB_DIR)) {
  if (file.endsWith(".json") && !hostedBooks.has(file.replace(/\.json$/, ""))) {
    fs.unlinkSync(path.join(ENDPOINT_HUB_DIR, file));
  }
}
const endpointHubsByBook = new Map(
  Object.keys(CANONS.books)
    .sort()
    .map((book) => [book, {}]),
);
for (const [id, neighbors] of fullAdj) {
  if (hubRelaySet.has(id)) continue;
  const hubNeighbors = [...neighbors.keys()].filter((neighbor) => hubRelaySet.has(neighbor)).sort();
  if (!hubNeighbors.length) continue;
  const [book, chapter, verse] = id.split(".");
  endpointHubsByBook.get(book)[`${chapter}:${verse}`] = hubNeighbors;
}
for (const [book, hubs] of endpointHubsByBook) {
  fs.writeFileSync(
    path.join(ENDPOINT_HUB_DIR, `${book}.json`),
    `${JSON.stringify({ book, hubs })}\n`,
  );
}

console.log(
  `Scripture graph: ${nodes.length} verses, ${edgeCount.toLocaleString()} distinct edges ` +
    `(${edgeMass.toLocaleString()} with multiplicity) → ${path.relative(ROOT, OUT_PATH)}`,
);
console.log(
  `  top verse: ${topVerses[0]?.ref} · ${flows.length} flows · ${threads.length} threads · ${iconicPaths.length} iconic paths`,
);
