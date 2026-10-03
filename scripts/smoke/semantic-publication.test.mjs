import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildEmbeddings, chapterCentroids, DIMS } from "../scriptures/build-embeddings.mjs";
import { buildNeighbors } from "../scriptures/build-neighbors.mjs";
import { readObject, selectedBooks, withIndexLock } from "../scriptures/index-publication.mjs";

const recipe = { fixture: "unit-v1" };
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "semantic-publication-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, data) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), JSON.stringify(data)); };
  write("public/scriptures/canons.json", { bookOrder: ["GEN", "JHN"], books: { GEN: { trans: ["web"] }, JHN: { trans: ["web"] } } });
  const source = (book, chapters) => write(`public/scriptures/text/web/${book}.json`, { book, trans: "web", chapters });
  source("GEN", [["water", "light"], ["word"]]); source("JHN", [["light", "word"], ["water"]]);
  let calls = 0;
  const embed = async (texts) => {
    calls++;
    const data = new Float32Array(texts.length * DIMS);
    texts.forEach((text, row) => { data[row * DIMS + (text.length % 3)] = 1; });
    return { data };
  };
  const dir = path.join(root, "public/scriptures/semantic");
  const manifestBytes = () => fs.readFileSync(path.join(dir, "manifest.json"));
  const build = (options = {}) => buildEmbeddings({ root, recipe, embed, ...options });
  return { root, dir, write, source, build, manifestBytes, calls: () => calls };
}

test("subset rebuild preserves the complete index and unchanged rebuilds are byte-identical", async (t) => {
  const f = fixture(t); const first = await f.build(); const bytes = f.manifestBytes();
  await f.build({ args: ["--books", "GEN"] });
  assert.equal(f.calls(), 2); assert.deepEqual(f.manifestBytes(), bytes);
  const partial = await f.build({ args: ["--books=GEN", "--force"] });
  assert.equal(f.calls(), 3); assert.deepEqual(partial, first);
  assert.deepEqual(partial.books.JHN, first.books.JHN);
});

test("same-count source edits and changed preprocessing invalidate cached vectors", async (t) => {
  const f = fixture(t); const old = await f.build();
  f.source("GEN", [["waters", "light"], ["word"]]);
  const updated = await f.build({ args: ["--books=GEN"] });
  assert.equal(f.calls(), 3); assert.notEqual(updated.books.GEN.fingerprint, old.books.GEN.fingerprint);
  assert.notEqual(updated.books.GEN.rows.sha256, old.books.GEN.rows.sha256);
  await f.build({ recipe: { fixture: "unit-v2" } }); assert.equal(f.calls(), 5);
});

test("unselected stale sources or missing provenance abort without changing publication", async (t) => {
  const f = fixture(t); await f.build(); const bytes = f.manifestBytes();
  f.source("JHN", [["waters", "word"], ["light"]]);
  await assert.rejects(f.build({ args: ["--books=GEN"] }), /Cannot preserve JHN/);
  assert.deepEqual(f.manifestBytes(), bytes); assert.equal(f.calls(), 2);
  fs.rmSync(path.join(f.dir, "manifest.json"));
  await assert.rejects(f.build({ args: ["--books=GEN"] }), /Cannot preserve JHN/);
  assert.ok(!fs.existsSync(path.join(f.dir, "manifest.json")));
});

test("corrupt vectors and reordered references cannot masquerade as cache hits", async (t) => {
  const f = fixture(t); const first = await f.build();
  fs.writeFileSync(path.join(f.dir, first.books.GEN.rows.path), Buffer.alloc(first.books.GEN.rows.bytes));
  await f.build(); assert.equal(f.calls(), 3);
  assert.equal(readObject(f.dir, first.books.GEN.rows).length, first.books.GEN.rows.bytes);
  const refsPath = path.join(f.dir, first.books.JHN.refs.path);
  const refs = JSON.parse(fs.readFileSync(refsPath)); refs.refs.reverse(); fs.writeFileSync(refsPath, JSON.stringify(refs));
  await f.build(); assert.equal(f.calls(), 4);
});

test("inference failures, invalid output and a failure just before publication leave the previous snapshot intact", async (t) => {
  const f = fixture(t); await f.build(); const bytes = f.manifestBytes();
  for (const options of [
    { embed: async () => { throw new Error("inference failed"); } },
    { embed: async () => ({ data: new Float32Array([NaN]) }) },
    { beforePublish: () => { throw new Error("publication failed"); } },
  ]) {
    await assert.rejects(f.build({ args: ["--force"], ...options }));
    assert.deepEqual(f.manifestBytes(), bytes);
  }
  await f.build(); assert.deepEqual(f.manifestBytes(), bytes);
});

test("source edits during inference cannot publish stale source bindings", async (t) => {
  const f = fixture(t); await f.build(); const bytes = f.manifestBytes();
  await assert.rejects(f.build({ beforePublish: () => f.source("GEN", [["changed"]]) }), /Source changed/);
  assert.deepEqual(f.manifestBytes(), bytes);
});

test("centroids honor pooled Buffer offsets and use the same quantized basis", () => {
  const pool = Buffer.alloc(40, 127); const bytes = pool.subarray(9, 13);
  bytes.set([127, 0, 0, 127]);
  const [[chapter, centroid]] = chapterCentroids([[1, 1], [1, 2]], bytes, 2);
  assert.equal(chapter, 1); assert.deepEqual([...centroid], [90, 90]);
});

test("empty/unknown selections fail and concurrent writers are serialized", async (t) => {
  for (const args of [["--books="], ["--books"], ["--books=ZZZ"], ["--books=GEN", "--books=JHN"]]) {
    assert.throws(() => selectedBooks(args, ["GEN", "JHN"]));
  }
  const f = fixture(t);
  await withIndexLock(f.root, "semantic", async () => { await assert.rejects(f.build(), /EEXIST/); });
  assert.ok(!fs.existsSync(path.join(f.root, ".cache/scripture-index-builds/semantic.lock")));
});

test("partial neighbours retain every unselected chapter and refuse changed global inputs", async (t) => {
  const f = fixture(t); await f.build();
  const old = await buildNeighbors({ root: f.root });
  const partial = await buildNeighbors({ root: f.root, args: ["--books=GEN"] });
  assert.deepEqual(partial, old); assert.equal(Object.keys(partial.chapterRecords).length, 4);
  const snapshot = path.join(f.root, "public/scriptures/neighbors/manifest.json");
  const before = fs.readFileSync(snapshot);
  await assert.rejects(buildNeighbors({ root: f.root, beforePublish: () => { throw new Error("stop"); } }), /stop/);
  assert.deepEqual(fs.readFileSync(snapshot), before);
  f.write("public/scriptures/xref/JHN.json", { refs: { "1:1": ["GEN 1:1"] } });
  await assert.rejects(buildNeighbors({ root: f.root, args: ["--books=GEN"] }), /unchanged inputs/);
  assert.deepEqual(fs.readFileSync(snapshot), before);
  const next = await buildNeighbors({ root: f.root }); assert.notEqual(next.releaseId, old.releaseId);
});


test("neighbour builds reject altered chapter metadata without a matching release binding", async (t) => {
  const f = fixture(t); const manifest = await f.build();
  manifest.chapterIndex.reverse();
  f.write("public/scriptures/semantic/manifest.json", manifest);
  await assert.rejects(buildNeighbors({ root: f.root }), /Manifest release integrity/);
  assert.ok(!fs.existsSync(path.join(f.root, "public/scriptures/neighbors/manifest.json")));
});
