import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test, { mock } from "node:test";
import canonsData from "../public/scriptures/canons.json";
import type { Canons, XrefFile } from "../src/lib/scriptures/types";
import {
  PathTraceError,
  type HubPathsData,
  bfsShortestPath,
  findHubPath,
  hasDirectReference,
  isHostedNodeId,
  loadHubPaths,
  resolveNodeId,
  tracePath,
} from "../src/lib/scriptures/graph-tracer";
import { FIND_CATALOG } from "../src/lib/site/find-catalog";
import { parsePathQuery } from "../src/lib/site/find-query";

const canons = canonsData as Canons;
const fixture = (overrides: Partial<HubPathsData> = {}): HubPathsData => ({
  meta: {
    generatedAt: "2026-01-01T00:00:00.000Z", hubCount: 2, maxHops: 6,
    xrefBooks: [], verseCounts: { GEN: [31], EXO: [22] }, missingVerses: [],
  },
  topHubs: [],
  hubs: { "GEN.1.10": ["GEN.1.11"], "GEN.1.11": ["GEN.1.10"] },
  iconicPaths: [],
  ...overrides,
});

test("resolveNodeId accepts names/dotted case and rejects invalid ranges", () => {
  assert.equal(resolveNodeId("Genesis 1:1", canons), "GEN.1.1");
  assert.equal(resolveNodeId("gen.1.1", canons), "GEN.1.1");
  assert.equal(resolveNodeId("JoHn 3:16", canons), "JHN.3.16");
  assert.equal(resolveNodeId("John 3:16-17", canons), null);
  assert.equal(resolveNodeId("GEN.51.1", canons), null);
  assert.equal(resolveNodeId("GEN.1.0", canons), null);
});

test("hosted validation rejects out-of-text and bridged verses", () => {
  const data = fixture({ meta: { ...fixture().meta, missingVerses: ["GEN.1.2"] } });
  assert.equal(isHostedNodeId("GEN.1.1", data), true);
  assert.equal(isHostedNodeId("GEN.1.2", data), false);
  assert.equal(isHostedNodeId("GEN.1.32", data), false);
});

test("direct-reference check expands ranges and supports checking either endpoint", () => {
  const gen: XrefFile = { book: "GEN", refs: { "1:1": ["EXO 2:3-5"] } };
  const exo: XrefFile = { book: "EXO", refs: { "2:7": ["GEN 1:1"] } };
  assert.equal(hasDirectReference(gen, "GEN.1.1", "EXO.2.3"), true);
  assert.equal(hasDirectReference(gen, "GEN.1.1", "EXO.2.5"), true);
  assert.equal(hasDirectReference(gen, "GEN.1.1", "EXO.2.6"), false);
  assert.equal(hasDirectReference(exo, "EXO.2.7", "GEN.1.1"), true);
});

test("BFS and hub routing use all candidates and enforce total link limit", () => {
  const hubs = { A: [], B: ["C"], C: ["B", "D"], D: ["C"] };
  assert.deepEqual(findHubPath(hubs, "START", "END", ["A", "B"], ["D"], 4), [
    "START", "B", "C", "D", "END",
  ]);
  assert.equal(findHubPath(hubs, "START", "END", ["A", "B"], ["D"], 3), null);
  assert.deepEqual(bfsShortestPath({ A: ["B"], B: ["A"] }, "A", "B"), ["A", "B"]);
});

test("tracePath distinguishes invalid input from valid no-route", async () => {
  const disconnected = fixture({ hubs: { "GEN.1.10": [], "EXO.1.10": [] } });
  await assert.rejects(
    tracePath("Genesis 1:99", "Exodus 1:1", canons, disconnected),
    (error: unknown) => error instanceof PathTraceError &&
      error.code === "invalid-reference" && error.endpoint === "from",
  );
  assert.equal(await tracePath("Genesis 1:10", "Exodus 1:10", canons, disconnected), null);
});

test("failed endpoint and hub fetches are typed and evicted for retry", async () => {
  let endpointCalls = 0;
  let hubCalls = 0;
  const data = fixture();
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/endpoint-hubs/GEN.json")) {
        endpointCalls += 1;
        return endpointCalls === 1
          ? new Response("", { status: 503 })
          : Response.json({
              book: "GEN",
              hubs: { "1:1": ["GEN.1.10"], "1:2": ["GEN.1.11"] },
            });
      }
      assert.equal(url, "/scriptures/graph/hub-paths.json");
      hubCalls += 1;
      return hubCalls === 1 ? new Response("", { status: 503 }) : Response.json(data);
    },
  );
  try {
    await assert.rejects(
      tracePath("Genesis 1:1", "Genesis 1:2", canons, data),
      (error: unknown) => error instanceof PathTraceError &&
        error.code === "load-failed" &&
        error.resource === "/scriptures/graph/endpoint-hubs/GEN.json",
    );
    assert.deepEqual(
      (await tracePath("Genesis 1:1", "Genesis 1:2", canons, data))?.chain.map((step) => step.id),
      ["GEN.1.1", "GEN.1.10", "GEN.1.11", "GEN.1.2"],
    );
    await assert.rejects(loadHubPaths(), (error: unknown) =>
      error instanceof PathTraceError && error.code === "load-failed");
    assert.deepEqual(await loadHubPaths(), data);
    assert.equal(endpointCalls, 2);
    assert.equal(hubCalls, 2);
  } finally {
    fetchMock.mock.restore();
  }
});

test("generated hubs and editorial examples contain only hosted source edges", () => {
  const root = path.resolve(import.meta.dirname, "..");
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "public/scriptures/graph/hub-paths.json"), "utf8"),
  ) as HubPathsData;
  const xrefs = new Map<string, XrefFile>(
    manifest.meta.xrefBooks.map((book) => [
      book,
      JSON.parse(fs.readFileSync(path.join(root, `public/scriptures/xref/${book}.json`), "utf8")),
    ]),
  );
  const sourceEdge = (a: string, b: string) => {
    const ab = a.split(".")[0];
    const bb = b.split(".")[0];
    return hasDirectReference(xrefs.get(ab) ?? { book: ab, refs: {} }, a, b) ||
      hasDirectReference(xrefs.get(bb) ?? { book: bb, refs: {} }, b, a);
  };
  assert.equal(Object.keys(manifest.hubs).length, manifest.meta.hubCount);
  for (const [hub, neighbors] of Object.entries(manifest.hubs)) {
    assert.ok(isHostedNodeId(hub, manifest), hub);
    for (const neighbor of neighbors) {
      assert.ok(isHostedNodeId(neighbor, manifest), neighbor);
      assert.ok(sourceEdge(hub, neighbor), `${hub} ↔ ${neighbor}`);
    }
  }
  const endpointDir = path.join(root, "public/scriptures/graph/endpoint-hubs");
  const endpointFiles = fs.readdirSync(endpointDir).filter((file) => file.endsWith(".json"));
  assert.equal(endpointFiles.length, Object.keys(canons.books).length);
  for (const file of endpointFiles) {
    const payload = JSON.parse(fs.readFileSync(path.join(endpointDir, file), "utf8")) as {
      book: string; hubs: Record<string, string[]>;
    };
    for (const [localRef, hubs] of Object.entries(payload.hubs)) {
      const endpoint = `${payload.book}.${localRef.replace(":", ".")}`;
      assert.ok(isHostedNodeId(endpoint, manifest), endpoint);
      for (const hub of hubs) {
        assert.ok(Object.hasOwn(manifest.hubs, hub), hub);
        assert.ok(sourceEdge(endpoint, hub), `${endpoint} ↔ ${hub}`);
      }
    }
  }
  for (const example of manifest.iconicPaths) {
    assert.ok(example.hops <= manifest.meta.maxHops);
    assert.equal(example.chain.length, example.hops + 1);
    example.chain.forEach((step, index) => {
      assert.ok(isHostedNodeId(step.id, manifest), step.id);
      assert.match(step.href, /^\/scriptures\/[a-z]+\/[1-4A-Z0-9]+\/\d+#v\d+$/);
      const [book, chapter, verse] = step.id.split(".");
      const meta = canons.books[book];
      const tradition = canons.traditions.find((item) => item.books.includes(book));
      const translation =
        tradition?.transPreference.find((id) => meta.trans.includes(id)) ?? meta.trans[0];
      const hosted = JSON.parse(
        fs.readFileSync(
          path.join(root, `public/scriptures/text/${translation}/${book}.json`),
          "utf8",
        ),
      ) as { chapters: string[][] };
      const verseText = hosted.chapters[Number(chapter) - 1][Number(verse) - 1];
      const expectedSnippet =
        verseText.length > 150 ? `${verseText.slice(0, 147)}…` : verseText;
      assert.equal(step.snippet, expectedSnippet, step.id);
      if (index) assert.ok(sourceEdge(example.chain[index - 1].id, step.id));
    });
  }
  const serpent = manifest.iconicPaths.find((item) => item.id === "seed-to-crushed-serpent");
  assert.equal(serpent?.title, "The Seed of the Woman to the Serpent Bound");
});

test("path command and Find catalog integration remain intact", () => {
  const query = parsePathQuery("path Genesis 1:1 to Revelation 21:1", canons);
  assert.deepEqual(query && [query.fromId, query.toId], ["GEN.1.1", "REV.21.1"]);
  assert.equal(parsePathQuery("regular search query", canons), null);
  const place = FIND_CATALOG.find((item) => item.href === "/scriptures/graph");
  assert.ok(place?.keywords.includes("path"));
  assert.ok(place?.keywords.includes("shortest"));
});
