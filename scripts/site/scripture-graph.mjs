#!/usr/bin/env node
/**
 * Scripture cross-reference graph algorithms — pure, deterministic, testable.
 *
 * Every function here is a classic graph algorithm run on the site's curated
 * cross-reference edges (public/scriptures/xref/*.json). No model, no
 * generation, no randomness: identical inputs produce identical outputs, and
 * tests/scripture-graph.test.ts proves the math on known fixtures.
 *
 * Node id format: "GEN.1.1" (BOOK.chapter.verse).
 */

const REF_RE = /^([1-4]?[A-Z0-9]{2,5}) (\d+):(\d+)(?:-(\d+))?$/;

/** Parse "PRO 8:22-24" → { book, chapter, verse, verseEnd } | null. */
export function parseRef(value) {
  if (typeof value !== "string") return null;
  const match = REF_RE.exec(value.trim());
  if (!match) return null;
  const book = match[1];
  const chapter = Number(match[2]);
  const verse = Number(match[3]);
  const verseEnd = match[4] ? Number(match[4]) : verse;
  if (!Number.isInteger(chapter) || !Number.isInteger(verse)) return null;
  if (chapter < 1 || verse < 1 || verseEnd < verse) return null;
  return { book, chapter, verse, verseEnd };
}

export const nodeId = (book, chapter, verse) => `${book}.${chapter}.${verse}`;

/**
 * Build a directed weighted multigraph from xref book data.
 * data: array of { book, refs: { "c:v": ["BOOK c:v-v", ...] } }
 * Ranges expand to every verse they span (whole-chapter refs included);
 * self-loops are dropped; duplicate edges accumulate weight.
 * Returns { nodes: string[] (sorted), weights: Map<"src|dst", number> }.
 */
export function buildGraph(books) {
  const nodeSet = new Set();
  const weights = new Map();
  const addEdge = (src, dst) => {
    if (src === dst) return; // a verse citing itself carries no information
    const key = `${src}|${dst}`;
    weights.set(key, (weights.get(key) ?? 0) + 1);
    nodeSet.add(src);
    nodeSet.add(dst);
  };

  for (const { book, refs } of books) {
    for (const [key, targets] of Object.entries(refs)) {
      const [chapter, verse] = key.split(":").map(Number);
      if (!Number.isInteger(chapter) || !Number.isInteger(verse)) continue;
      const src = nodeId(book, chapter, verse);
      nodeSet.add(src);
      for (const target of targets) {
        const parsed = parseRef(target);
        if (!parsed) continue;
        for (let v = parsed.verse; v <= parsed.verseEnd; v++) {
          addEdge(src, nodeId(parsed.book, parsed.chapter, v));
        }
      }
    }
  }

  const nodes = [...nodeSet].sort();
  return { nodes, weights };
}

/** Directed weighted adjacency: Map<src, Array<[dst, weight]>> (sorted). */
export function outAdjacency(nodes, weights) {
  const adj = new Map(nodes.map((n) => [n, []]));
  for (const [key, weight] of weights) {
    const [src, dst] = key.split("|");
    adj.get(src)?.push([dst, weight]);
  }
  for (const list of adj.values()) list.sort((a, b) => a[0].localeCompare(b[0]));
  return adj;
}

/** Undirected weighted adjacency for community detection and path tracing. */
export function undirectedAdjacency(nodes, weights) {
  const adj = new Map(nodes.map((n) => [n, new Map()]));
  const touch = (a, b, w) => {
    const row = adj.get(a);
    row.set(b, (row.get(b) ?? 0) + w);
  };
  for (const [key, weight] of weights) {
    const [src, dst] = key.split("|");
    touch(src, dst, weight);
    touch(dst, src, weight);
  }
  return adj;
}

/**
 * Weighted PageRank (Brin & Page), power iteration with dangling-mass
 * redistribution. Deterministic: iteration order is the sorted node list.
 * Returns Map<node, score>; scores sum to 1 (± tolerance).
 */
export function pageRank(
  nodes,
  weights,
  { damping = 0.85, maxIterations = 100, tolerance = 1e-10 } = {},
) {
  const adj = outAdjacency(nodes, weights);
  const outWeight = new Map();
  for (const node of nodes) {
    let total = 0;
    for (const [, weight] of adj.get(node)) total += weight;
    outWeight.set(node, total);
  }
  const dangling = nodes.filter((n) => outWeight.get(n) === 0);

  let rank = new Map(nodes.map((n) => [n, 1 / nodes.length]));
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let danglingMass = 0;
    for (const node of dangling) danglingMass += rank.get(node);
    const base = (1 - damping) / nodes.length + (damping * danglingMass) / nodes.length;
    const next = new Map(nodes.map((n) => [n, base]));
    for (const node of nodes) {
      const share = (damping * rank.get(node)) / outWeight.get(node);
      if (!Number.isFinite(share)) continue;
      for (const [dst, weight] of adj.get(node)) {
        next.set(dst, next.get(dst) + share * weight);
      }
    }
    let delta = 0;
    for (const node of nodes) delta += Math.abs(next.get(node) - rank.get(node));
    rank = next;
    if (delta < tolerance) break;
  }
  return rank;
}

/**
 * Label propagation for community detection on the undirected weighted graph
 * (Raghavan et al. 2007, near-linear). Deterministic tie-breaking: among
 * maximal neighbor labels the node keeps its current label if eligible,
 * otherwise the smallest label id wins. Returns Map<node, communityId>.
 */
export function labelPropagation(nodes, weights, { maxIterations = 30 } = {}) {
  const adj = undirectedAdjacency(nodes, weights);
  const labels = new Map(nodes.map((n, i) => [n, i])); // own id = own label
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let changed = false;
    for (const node of nodes) {
      const tally = new Map();
      for (const [neighbor, weight] of adj.get(node)) {
        const label = labels.get(neighbor);
        tally.set(label, (tally.get(label) ?? 0) + weight);
      }
      let best = null;
      let bestWeight = 0;
      const current = labels.get(node);
      for (const [label, weight] of tally) {
        if (weight > bestWeight || (weight === bestWeight && label < best)) {
          best = label;
          bestWeight = weight;
        }
      }
      if (best !== null && best !== current && !(bestWeight === tally.get(current) && current < best)) {
        labels.set(node, best);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return labels;
}

/** BFS shortest path on the undirected graph; null when unreachable. */
export function shortestPath(adj, from, to, { maxHops = 4 } = {}) {
  if (from === to) return [from];
  const parent = new Map([[from, null]]);
  let frontier = [from];
  for (let hop = 0; hop < maxHops; hop++) {
    const next = [];
    for (const node of frontier) {
      const neighbors = [...adj.get(node)?.keys() ?? []].sort();
      for (const neighbor of neighbors) {
        if (parent.has(neighbor)) continue;
        parent.set(neighbor, node);
        if (neighbor === to) {
          const path = [to];
          let cursor = to;
          while (parent.get(cursor) !== null) {
            cursor = parent.get(cursor);
            path.unshift(cursor);
          }
          return path;
        }
        next.push(neighbor);
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return null;
}
