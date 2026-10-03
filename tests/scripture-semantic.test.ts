import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rankRows, scoreRow, SEMANTIC_DIMS } from "../src/lib/scriptures/semantic";

/** Quantize a unit vector the way build-embeddings.mjs does. */
function quantize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0)) || 1;
  return vec.map((x) =>
    Math.max(-127, Math.min(127, Math.round((x / norm) * 127))),
  );
}

function matrix(rows: number[][]): Int8Array {
  const out = new Int8Array(rows.length * rows[0].length);
  rows.forEach((row, i) => out.set(quantize(row), i * row.length));
  return out;
}

describe("semantic ranking math", () => {
  const dims = 4;
  const rows = matrix([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [1, 1, 0, 0],
    [-1, 0, 0, 0],
  ]);
  const query = [1, 0, 0, 0];

  it("scoreRow approximates cosine similarity on quantized rows", () => {
    assert.ok(Math.abs(scoreRow(query, rows, 0, dims) - 1) < 0.02);
    assert.ok(Math.abs(scoreRow(query, rows, 1, dims)) < 0.02);
    assert.ok(Math.abs(scoreRow(query, rows, 2, dims) - Math.SQRT1_2) < 0.02);
    assert.ok(Math.abs(scoreRow(query, rows, 3, dims) + 1) < 0.02);
  });

  it("rankRows returns top-k rows in descending score order", () => {
    const ranked = rankRows(query, rows, dims, 3);
    assert.deepEqual(
      ranked.map((hit) => hit.row),
      [0, 2, 1],
    );
    assert.ok(ranked[0].score >= ranked[1].score);
    assert.ok(ranked[1].score >= ranked[2].score);
  });

  it("exports the dimension the build script writes", () => {
    assert.equal(SEMANTIC_DIMS, 384);
  });
});

import { createHash } from "node:crypto";
import {
  loadSemanticArtifact, loadSemanticBook, loadSemanticManifest, validateSemanticManifest, verifySemanticManifestRelease,
  semanticArtifactUrl, type SemanticManifest, type SemanticArtifact,
} from "../src/lib/scriptures/semantic";
import { SEMANTIC_MODEL_ID } from "../src/lib/scriptures/semantic-model";

function artifact(bytes: Uint8Array, extension = "bin"): SemanticArtifact {
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  return { path: `objects/${sha256}.${extension}`, sha256, bytes: bytes.length };
}
function clientFixture(refs: number[][] = [[1, 1], [1, 2]]) {
  const rows = new Uint8Array(2 * SEMANTIC_DIMS); rows[0] = 127; rows[SEMANTIC_DIMS + 1] = 127;
  const refBytes = new TextEncoder().encode(JSON.stringify({ book: "GEN", refs }));
  const chapter = rows.slice(0, SEMANTIC_DIMS);
  const manifest: SemanticManifest = {
    schemaVersion: 2, model: SEMANTIC_MODEL_ID, dims: SEMANTIC_DIMS, quantization: "int8-unit-127",
    translation: "web", generatedAt: "fixture", chapterIndex: [["GEN", 1]], verseCounts: { GEN: 2 },
    chapters: artifact(chapter), books: { GEN: { rows: artifact(rows), refs: artifact(refBytes, "json") } },
  };
  const payload: Partial<SemanticManifest> = { ...manifest }; delete payload.generatedAt;
  manifest.releaseId = createHash("sha256").update(`${JSON.stringify(payload)}\n`).digest("hex");
  return { rows, refBytes, manifest };
}

describe("semantic client integrity", () => {
  it("rejects malformed matrices, non-finite queries and incompatible manifests", () => {
    assert.throws(() => rankRows([1, NaN], new Int8Array(2), 2, 1), /invalid/);
    assert.throws(() => rankRows([1, 0], new Int8Array(3), 2, 1), /invalid/);
    const { manifest } = clientFixture();
    validateSemanticManifest(manifest);
    assert.throws(() => validateSemanticManifest({ ...manifest, dims: 768 }), /Incompatible/);
    assert.throws(() => validateSemanticManifest({ ...manifest, chapterIndex: [["GEN", 1], ["GEN", 1]] }));
    assert.throws(() => semanticArtifactUrl({ path: "../other.bin", sha256: "a".repeat(64), bytes: 384 }));
  });

  it("rejects same-length corrupted bytes and can retry the identical artifact URL", async (t) => {
    const bytes = Uint8Array.from([127, 1, 2]); const descriptor = artifact(bytes);
    let calls = 0;
    t.mock.method(globalThis, "fetch", async () => new Response(++calls === 1 ? Uint8Array.from([127, 1, 3]) : bytes));
    await assert.rejects(loadSemanticArtifact(descriptor), /integrity failure/);
    assert.deepEqual([...await loadSemanticArtifact(descriptor)], [127, 1, 2]);
    assert.equal(calls, 2);
  });

  it("validates reference order even when the artifact hash is valid", async (t) => {
    const { rows, refBytes, manifest } = clientFixture([[1, 2], [1, 1]]);
    t.mock.method(globalThis, "fetch", async (url: string) => new Response(url.endsWith(".json") ? refBytes : rows));
    await assert.rejects(loadSemanticBook(manifest, "GEN"), /reference order/);
  });

  it("failed manifest loads do not poison later retries", async (t) => {
    const { manifest } = clientFixture(); let calls = 0;
    t.mock.method(globalThis, "fetch", async () => ++calls === 1
      ? new Response("Unavailable", { status: 503 })
      : Response.json(manifest));
    await assert.rejects(loadSemanticManifest(), /503/);
    assert.deepEqual(await loadSemanticManifest(), manifest);
    assert.equal(calls, 2);
  });
});


it("manifest binding detects same-shape metadata changes before ranking", async () => {
  const { manifest } = clientFixture();
  await verifySemanticManifestRelease(manifest);
  await assert.rejects(verifySemanticManifestRelease({ ...manifest, chapterIndex: [["GEN", 2]] }), /manifest integrity/);
});
