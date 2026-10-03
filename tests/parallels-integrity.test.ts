import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { ParallelMatrix, RightsManifest } from "../src/lib/parallels/types";
import {
  AUTHORED,
  collectReproducedText,
  digestFor,
  FAILING_STATUS,
} from "../scripts/parallels/build-rights-manifest.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const PARALLELS_DIR = path.join(ROOT, "public/parallels");

const rights = JSON.parse(
  readFileSync(path.join(PARALLELS_DIR, "rights-manifest.json"), "utf8"),
) as RightsManifest;

const matrixFiles = readdirSync(PARALLELS_DIR).filter(
  (f) => f.endsWith(".json") && f !== "rights-manifest.json",
);

test("rights manifest contains valid corpus licenses and required notices", () => {
  assert.equal(rights.schemaVersion, "2.0.0");
  assert.ok(Object.keys(rights.corpora).length >= 4, "manifest must contain pilot corpora");

  for (const [id, corpus] of Object.entries(rights.corpora)) {
    assert.equal(id, corpus.id);
    assert.ok(corpus.title.length > 0, `${id} missing title`);
    assert.ok(corpus.upstreamUrl.startsWith("https://"), `${id} missing upstreamUrl`);
    assert.ok(corpus.notice.length > 10, `${id} missing mandatory legal notice`);
    assert.ok(corpus.license.length > 0, `${id} missing license label`);
  }
});

test("every corpus digest is recomputed, not taken on trust", () => {
  // The predecessor of this test asserted `sha256.length === 64`, which is a
  // check that a string is a string. `oshb-wlc` passed it carrying
  // e3b0c44298fc1c14…b855 — the SHA-256 of the empty string — while the
  // parallels page told readers the work carries "cryptographic hash
  // verification", and while that corpus supplied the Hebrew of Genesis 22.
  //
  // So the digest is recomputed here from the repository itself. If a verbatim
  // excerpt is edited anywhere, this fails until someone re-runs the build and
  // looks at what moved.
  const reproduced = collectReproducedText(ROOT);
  assert.ok(reproduced.size > 0, "no reproduced text found at all");

  for (const [id, corpus] of Object.entries(rights.corpora)) {
    const entries = reproduced.get(id);
    assert.ok(entries, `${id} is declared but the site reproduces nothing from it`);
    assert.equal(
      corpus.reproducedExcerpts,
      entries.length,
      `${id} claims ${corpus.reproducedExcerpts} excerpts; the corpus holds ${entries.length}`,
    );
    assert.ok(corpus.reproducedExcerpts > 0, `${id} covers no text — the digest would be empty`);
    assert.equal(
      corpus.reproducedTextSha256,
      digestFor(entries),
      `${id}: the recorded digest is not the digest of the text on disk`,
    );
  }
});

test("no text is published from a corpus with no licence entry", () => {
  const authored = AUTHORED as Record<string, unknown>;
  for (const id of collectReproducedText(ROOT).keys()) {
    assert.ok(rights.corpora[id], `${id} is reproduced on the site with no rights entry`);
    assert.ok(authored[id], `${id} has no authored licence record`);
  }
});

test("no upstream source is on record as gone", () => {
  // Calibrated like the other live-check gates: only positive evidence of
  // absence fails. A host that refuses scripted requests is not a dead source,
  // and neither is a timeout — both were recorded, and both are real citations.
  for (const [id, corpus] of Object.entries(rights.corpora)) {
    assert.notEqual(
      corpus.upstreamStatus,
      FAILING_STATUS,
      `${id}: ${corpus.upstreamUrl} is gone — rerun npm run data:rights`,
    );
    assert.ok(corpus.upstreamCheckedAt, `${id} has never been checked`);
  }
});

test("parallel matrices exist and have valid structure", () => {
  assert.ok(matrixFiles.length >= 1, "at least one pilot matrix must exist");

  for (const file of matrixFiles) {
    const matrix = JSON.parse(
      readFileSync(path.join(PARALLELS_DIR, file), "utf8"),
    ) as ParallelMatrix;

    assert.equal(matrix.schemaVersion, "1.0.0");
    assert.ok(matrix.id.length > 0);
    assert.ok(matrix.title.length > 0);
    assert.ok(matrix.summary.length > 0);
    assert.ok(matrix.witnesses.length >= 2, "matrix must have at least 2 witnesses");
    assert.ok(matrix.slots.length >= 3, "matrix must have at least 3 comparison slots");
    assert.ok(matrix.edges.length >= 1, "matrix must have at least 1 pairwise edge");
    assert.ok(matrix.receptionClaims.length >= 1, "matrix must have at least 1 reception claim");
  }
});

test("every witness in matrix binds to a valid rights-manifest corpus", () => {
  for (const file of matrixFiles) {
    const matrix = JSON.parse(
      readFileSync(path.join(PARALLELS_DIR, file), "utf8"),
    ) as ParallelMatrix;

    for (const witness of matrix.witnesses) {
      const corpus = rights.corpora[witness.corpusEditionId];
      assert.ok(corpus, `${witness.id} in ${file} references unknown corpus ${witness.corpusEditionId}`);
      assert.equal(
        witness.licenseNotice,
        corpus.notice,
        `${witness.id} license notice does not match rights manifest`,
      );
    }
  }
});

test("every slot cell has verbatim quotes, citations, and valid evidence basis", () => {
  const VALID_BASES = new Set(["explicit", "inferred", "reception", "disputed"]);

  for (const file of matrixFiles) {
    const matrix = JSON.parse(
      readFileSync(path.join(PARALLELS_DIR, file), "utf8"),
    ) as ParallelMatrix;

    const witnessIds = matrix.witnesses.map((w) => w.id);

    for (const slot of matrix.slots) {
      assert.ok(slot.id.length > 0);
      assert.ok(slot.label.length > 0);
      assert.ok(slot.description.length > 0);

      for (const wId of witnessIds) {
        const cell = slot.cells[wId];
        assert.ok(cell, `Slot '${slot.id}' in ${file} missing cell for witness '${wId}'`);
        assert.equal(cell.witnessId, wId);
        assert.ok(VALID_BASES.has(cell.basis), `Invalid basis '${cell.basis}' in ${slot.id}`);
        assert.ok(cell.summary.length > 5, `Summary too short in ${slot.id}/${wId}`);
        assert.ok(cell.verbatimExcerpt.length > 5, `Verbatim excerpt missing in ${slot.id}/${wId}`);
        assert.ok(cell.supportingCitations.length >= 1, `Citations missing in ${slot.id}/${wId}`);
        assert.ok(cell.locator.passageRef.length > 0, `Locator missing in ${slot.id}/${wId}`);
      }
    }
  }
});

test("pairwise edges connect valid witnesses and carry scholarly citations", () => {
  const VALID_RELATIONSHIPS = new Set([
    "direct-citation",
    "allusion",
    "shared-tradition",
    "theological-divergence",
    "independent",
  ]);

  for (const file of matrixFiles) {
    const matrix = JSON.parse(
      readFileSync(path.join(PARALLELS_DIR, file), "utf8"),
    ) as ParallelMatrix;

    const witnessIds = new Set(matrix.witnesses.map((w) => w.id));

    for (const edge of matrix.edges) {
      assert.ok(witnessIds.has(edge.sourceWitnessId), `Unknown source witness ${edge.sourceWitnessId}`);
      assert.ok(witnessIds.has(edge.targetWitnessId), `Unknown target witness ${edge.targetWitnessId}`);
      assert.notEqual(edge.sourceWitnessId, edge.targetWitnessId, "Edge cannot connect witness to itself");
      assert.ok(VALID_RELATIONSHIPS.has(edge.relationship), `Invalid relationship ${edge.relationship}`);
      assert.ok(edge.basisNote.length > 20, `Basis note too short on edge ${edge.id}`);
      assert.ok(edge.citations.length >= 1, `Citations missing on edge ${edge.id}`);
    }
  }
});

test("reception claims follow evidence claim schema with valid sources and boundaries", () => {
  for (const file of matrixFiles) {
    const matrix = JSON.parse(
      readFileSync(path.join(PARALLELS_DIR, file), "utf8"),
    ) as ParallelMatrix;

    for (const claim of matrix.receptionClaims) {
      assert.ok(claim.id.startsWith("claim-"));
      assert.ok(["jewish", "christian", "islamic", "academic"].includes(claim.tradition));
      assert.ok(claim.subject.length > 3);
      assert.ok(claim.text.length > 20);
      assert.ok(claim.basis.axis === "textual" || claim.basis.axis === "attestation");
      assert.ok(claim.sources.length >= 1, `Claim ${claim.id} missing sources`);
      assert.ok(claim.limit && claim.limit.length > 10, `Claim ${claim.id} missing boundary/limit`);
    }
  }
});

test("reviewed content hash matches cryptographic digest over slots, edges, and reception claims", () => {
  for (const file of matrixFiles) {
    const matrix = JSON.parse(
      readFileSync(path.join(PARALLELS_DIR, file), "utf8"),
    ) as ParallelMatrix;

    const contentToHash = JSON.stringify({
      slots: matrix.slots,
      edges: matrix.edges,
      receptionClaims: matrix.receptionClaims,
    });
    const computedHash = crypto.createHash("sha256").update(contentToHash).digest("hex");

    assert.equal(
      matrix.provenance.reviewedContentHash,
      computedHash,
      `Reviewed content hash mismatch in ${file}`,
    );
    assert.ok(["agent-reviewed", "human-approved"].includes(matrix.provenance.reviewStatus));
    assert.ok(matrix.provenance.reviewer.length > 3);
  }
});
