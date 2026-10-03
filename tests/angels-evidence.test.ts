import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  DEMON_RECOGNITION_INSIGHTS,
  ENCOUNTER_FUNCTIONS,
} from "../src/lib/angels/encounter-guides";
import type {
  EncountersData,
  EvidenceStatus,
  FallData,
  OrderData,
} from "../src/lib/angels/types";

const read = <T>(path: string): T =>
  JSON.parse(readFileSync(path, "utf8")) as T;

const validEvidence = new Set<EvidenceStatus>([
  "explicit",
  "inferred",
  "disputed",
  "tradition",
  "extra-canonical",
]);

describe("Angels & Demons evidence framing", () => {
  it("labels every order band and fall fragment with a supported evidence status", () => {
    const order = read<OrderData>("public/angels/order.json");
    const fall = read<FallData>("public/angels/fall.json");

    for (const item of [...order.bands, ...fall.steps]) {
      assert.ok(validEvidence.has(item.evidence.status), item.id);
      assert.ok(item.evidence.note.length >= 24, item.id);
    }
  });

  it("groups every appearance once and only points recognition links at real records", () => {
    const encounters = read<EncountersData>("public/angels/encounters.json");
    const appearanceRefs = encounters.appeared.map((item) => item.ref).sort();
    const groupedRefs = ENCOUNTER_FUNCTIONS.flatMap((group) => group.refs).sort();
    const exorcismRefs = new Set(encounters.castOut.map((item) => item.ref));

    assert.deepEqual(groupedRefs, appearanceRefs);

    for (const insight of DEMON_RECOGNITION_INSIGHTS) {
      for (const ref of insight.refs) {
        assert.ok(exorcismRefs.has(ref), `${insight.id}: ${ref}`);
      }
    }
  });
});
