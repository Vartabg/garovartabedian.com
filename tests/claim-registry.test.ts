import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { buildClaims } from "../scripts/site/build-claims.mjs";
import {
  ATTESTATION_GRADES,
  GRADE_LABEL,
  GRADE_MEANING,
  TEXTUAL_GRADES,
  isAttestationGrade,
  isTextualGrade,
  type Claim,
  type ClaimRegistry,
} from "../src/lib/evidence/claims";

const ROOT = path.join(import.meta.dirname, "..");
const committed = JSON.parse(
  readFileSync(path.join(ROOT, "public/meta/claims.json"), "utf8"),
) as ClaimRegistry;

test("the committed registry matches what the rooms' own data produces", () => {
  // The pills a reader sees come from this file. If a room's copy changes and
  // the registry is not rebuilt, the index would quote wording the site no
  // longer publishes.
  const rebuilt = buildClaims(committed.generatedAt) as ClaimRegistry;
  assert.deepEqual(rebuilt.claims, committed.claims);
});

test("the registry actually covers both graded worlds", () => {
  const worlds = new Set(committed.claims.map((claim) => claim.world));
  assert.ok(worlds.has("angels"), "no angels claims were extracted");
  assert.ok(worlds.has("apostles"), "no apostles claims were extracted");
  assert.ok(committed.claims.length >= 40, `only ${committed.claims.length} claims`);
});

test("every grade is one the pills know how to name", () => {
  for (const claim of committed.claims) {
    const { axis, grade } = claim.basis;
    if (axis === "textual") {
      assert.ok(isTextualGrade(grade), `${claim.id} has textual grade "${grade}"`);
    } else {
      assert.ok(isAttestationGrade(grade), `${claim.id} has attestation grade "${grade}"`);
    }
    assert.ok(GRADE_LABEL[grade], `${grade} has no label`);
    assert.ok(GRADE_MEANING[grade], `${grade} has no stated meaning`);
  }
});

test("the two scales stay separate", () => {
  // The whole point of the registry is that "disputed" (how a claim stands to
  // the text) and "later tradition" (how early the witness is) are different
  // measurements. If a grade name ever appeared on both axes, a filter would
  // silently mix them.
  const overlap = TEXTUAL_GRADES.filter((grade) =>
    (ATTESTATION_GRADES as readonly string[]).includes(grade),
  );
  assert.deepEqual(overlap, [], "a grade name is used by both scales");
});

test("every claim carries text, a destination, and a stated boundary or sources", () => {
  for (const claim of committed.claims) {
    assert.ok(claim.text.length > 20, `${claim.id} has no substantive claim text`);
    assert.match(claim.href, /^\/[a-z]/, `${claim.id} has no on-site destination`);
    assert.ok(
      claim.limit || claim.sources.length > 0 || claim.refs.length > 0,
      `${claim.id} offers neither a source, a reference, nor a stated limit`,
    );
  }
});

test("the claim text is carried across verbatim from the rooms", () => {
  // Nothing here is authored. Each claim's wording has to appear, unchanged,
  // in the room data it came from — otherwise the registry is a paraphrase
  // wearing the room's grade.
  const fall = readFileSync(path.join(ROOT, "public/angels/fall.json"), "utf8");
  const order = readFileSync(path.join(ROOT, "public/angels/order.json"), "utf8");
  const twelve = readFileSync(path.join(ROOT, "public/apostles/twelve.json"), "utf8");
  const haystack = `${fall}\n${order}\n${twelve}`;

  const sample = (claims: Claim[], world: string) =>
    claims.filter((claim) => claim.world === world).slice(0, 6);

  for (const claim of [
    ...sample(committed.claims, "angels"),
    ...sample(committed.claims, "apostles"),
  ]) {
    // JSON escapes quotes and newlines, so compare on the collapsed letters.
    const needle = claim.text.replace(/\s+/g, " ").slice(0, 60);
    const flatHaystack = haystack.replace(/\\n/g, " ").replace(/\s+/g, " ");
    assert.ok(
      flatHaystack.includes(needle),
      `${claim.id} does not appear verbatim in its room's data`,
    );
  }
});

test("the translation-rights ledger is deliberately not graded as evidence", () => {
  // public/word/ledger.json records who owns a translation and what may be
  // quoted. That is a permission status, not a historical claim, and giving it
  // an evidence weight would be a category error dressed as consistency.
  for (const claim of committed.claims) {
    assert.notEqual(claim.world as string, "word");
  }
});
