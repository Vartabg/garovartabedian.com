import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGraph,
  labelPropagation,
  outAdjacency,
  pageRank,
  parseRef,
  shortestPath,
  undirectedAdjacency,
} from "../scripts/site/scripture-graph.mjs";

test("parseRef handles single verses, ranges, and rejects garbage", () => {
  assert.deepEqual(parseRef("PRO 8:22"), { book: "PRO", chapter: 8, verse: 22, verseEnd: 22 });
  assert.deepEqual(parseRef("PRO 8:22-24"), { book: "PRO", chapter: 8, verse: 22, verseEnd: 24 });
  assert.equal(parseRef("1JN 1:1")?.book, "1JN");
  assert.equal(parseRef("not a ref"), null);
  assert.equal(parseRef("GEN 1:0"), null);
  assert.equal(parseRef("GEN 5:3-1"), null); // reversed range rejected
  assert.equal(parseRef(42), null);
});

test("buildGraph expands ranges, drops self-loops, accumulates weight", () => {
  const { nodes, weights } = buildGraph([
    {
      book: "GEN",
      refs: {
        "1:1": ["GEN 1:1", "EXO 20:11", "EXO 20:9-11"],
        "1:2": ["EXO 20:11"],
      },
    },
  ]);
  assert.ok(nodes.includes("GEN.1.1"));
  assert.ok(nodes.includes("EXO.20.9"));
  assert.ok(nodes.includes("EXO.20.11"));
  // self-loop GEN.1.1 → GEN.1.1 must not exist
  assert.equal(weights.get("GEN.1.1|GEN.1.1"), undefined);
  // EXO 20:11 cited twice from GEN 1:1 (direct + range) → weight 2
  assert.equal(weights.get("GEN.1.1|EXO.20.11"), 2);
  // range expansion created EXO 20:9 and 20:10 nodes
  assert.equal(weights.get("GEN.1.1|EXO.20.9"), 1);
  assert.equal(weights.get("GEN.1.1|EXO.20.10"), 1);
  assert.equal(weights.get("GEN.1.2|EXO.20.11"), 1);
});

test("pageRank: hub beats spokes, scores sum to 1", () => {
  // Star: A→B, A→C, B→C, C→B. B and C receive from everywhere; B also from C.
  const { nodes, weights } = buildGraph([
    { book: "AAA", refs: { "1:1": ["BBB 1:1", "CCC 1:1"] } },
    { book: "BBB", refs: { "1:1": ["CCC 1:1"] } },
    { book: "CCC", refs: { "1:1": ["BBB 1:1"] } },
  ]);
  const rank = pageRank(nodes, weights);
  const sum = [...rank.values()].reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-6, `scores must sum to 1, got ${sum}`);
  // BBB receives from AAA and CCC; CCC receives from AAA and BBB — but AAA
  // also feeds both, so the pair outranks the source. BBB ≥ CCC > AAA holds
  // because BBB keeps CCC's full vote while CCC splits nothing.
  assert.ok(rank.get("BBB.1.1") > rank.get("AAA.1.1"));
  assert.ok(rank.get("CCC.1.1") > rank.get("AAA.1.1"));
});

test("pageRank is deterministic across runs", () => {
  const { nodes, weights } = buildGraph([
    { book: "AAA", refs: { "1:1": ["BBB 1:1"], "1:2": ["CCC 1:1", "BBB 1:1"] } },
    { book: "BBB", refs: { "1:1": ["AAA 1:1", "CCC 1:1"] } },
  ]);
  const a = pageRank(nodes, weights);
  const b = pageRank(nodes, weights);
  assert.deepEqual([...a.entries()], [...b.entries()]);
});

test("labelPropagation finds exactly two communities for two cliques", () => {
  // Clique 1: AAA.1.1-3 fully connected. Clique 2: BBB.1.1-3 fully connected.
  // One bridge edge AAA.1.3 → BBB.1.1.
  const refOf = (id: string) => {
    const [book, c, v] = id.split(".");
    return `${book} ${c}:${v}`;
  };
  const keyOf = (id: string) => {
    const [, c, v] = id.split(".");
    return `${c}:${v}`;
  };
  const members = ["AAA.1.1", "AAA.1.2", "AAA.1.3", "BBB.1.1", "BBB.1.2", "BBB.1.3"];
  const refsByBook: Record<string, Record<string, string[]>> = { AAA: {}, BBB: {} };
  for (const a of members) {
    for (const b of members) {
      if (a === b || a.split(".")[0] !== b.split(".")[0]) continue; // intra-clique only
      const book = a.split(".")[0];
      (refsByBook[book][keyOf(a)] ??= []).push(refOf(b));
    }
  }
  refsByBook.AAA["1:3"].push("BBB 1:1"); // the single bridge
  const { nodes, weights } = buildGraph([
    { book: "AAA", refs: refsByBook.AAA },
    { book: "BBB", refs: refsByBook.BBB },
  ]);
  const labels = labelPropagation(nodes, weights);
  const communities = new Set(labels.values());
  assert.equal(communities.size, 2, `expected 2 communities, got ${communities.size}`);
  const groupOf = (node: string) => labels.get(node);
  assert.equal(groupOf("AAA.1.1"), groupOf("AAA.1.2"));
  assert.equal(groupOf("BBB.1.2"), groupOf("BBB.1.3"));
  assert.notEqual(groupOf("AAA.1.1"), groupOf("BBB.1.2"));
});

test("shortestPath: direct edge, multi-hop chain, and null when disconnected", () => {
  const { nodes, weights } = buildGraph([
    {
      book: "AAA",
      refs: { "1:1": ["BBB 1:1"], "1:2": ["CCC 1:1"], "1:3": ["DDD 1:1"] },
    },
    { book: "BBB", refs: { "1:1": ["CCC 1:1"] } },
  ]);
  const adj = undirectedAdjacency(nodes, weights);
  assert.deepEqual(shortestPath(adj, "AAA.1.1", "BBB.1.1"), ["AAA.1.1", "BBB.1.1"]);
  // AAA.1.1 → BBB.1.1 → CCC.1.1 (undirected) — 2 hops beats AAA.1.2 → CCC.1.1? both 2 hops; BFS tie-break by sorted order
  const path = shortestPath(adj, "AAA.1.1", "CCC.1.1");
  assert.ok(path, "path should exist");
  assert.equal(path.length, 3);
  // DDD.1.1 only connects to AAA.1.3; AAA.1.3 is isolated from the rest
  assert.equal(shortestPath(adj, "AAA.1.1", "DDD.1.1", { maxHops: 4 }), null);
  // maxHops respected: 2-hop journey not found with maxHops 1
  assert.equal(shortestPath(adj, "AAA.1.1", "CCC.1.1", { maxHops: 1 }), null);
});

test("outAdjacency sorts destinations and sums weights", () => {
  const { nodes, weights } = buildGraph([
    { book: "AAA", refs: { "1:1": ["CCC 1:1", "BBB 1:1", "CCC 1:1"] } },
  ]);
  const adj = outAdjacency(nodes, weights);
  const row = adj.get("AAA.1.1") as Array<[string, number]>;
  assert.deepEqual(
    row.map((entry) => entry[0]),
    ["BBB.1.1", "CCC.1.1"],
  );
  assert.equal(row.find((entry) => entry[0] === "CCC.1.1")?.[1], 2);
});
