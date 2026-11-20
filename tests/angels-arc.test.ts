import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ANGEL_ARC, resolveArcStop } from "../src/lib/angels/arc";
import type {
  EncountersData,
  FallData,
  OrderData,
  TeachingData,
} from "../src/lib/angels/types";

const read = <T>(path: string): T =>
  JSON.parse(readFileSync(path, "utf8")) as T;

const data = {
  order: read<OrderData>("public/angels/order.json"),
  fall: read<FallData>("public/angels/fall.json"),
  encounters: read<EncountersData>("public/angels/encounters.json"),
  teaching: read<TeachingData>("public/angels/teaching.json"),
};

describe("Angels arc spine", () => {
  it("keeps the six eras in story order", () => {
    assert.deepEqual(
      ANGEL_ARC.map((era) => era.id),
      ["throne", "fall", "israel", "christ", "now", "end"],
    );
    assert.deepEqual(
      ANGEL_ARC.map((era) => era.when),
      ["Before history", "The rebellion", "Israel's story", "Christ", "Now", "The end"],
    );
  });

  it("resolves every stop to a real source record", () => {
    for (const era of ANGEL_ARC) {
      assert.ok(era.stops.length >= 3, era.id);
      for (const stop of era.stops) {
        const resolved = resolveArcStop(stop, data);
        assert.ok(resolved, `${era.id}: ${stop.kind}:${stop.key}`);
        assert.ok(resolved.title.length > 0, `${era.id}: ${stop.key}`);
        assert.ok(resolved.roomHref.startsWith("/angels"), resolved.roomHref);
      }
    }
  });

  it("never launders a grade: fall and band stops keep the source status", () => {
    for (const era of ANGEL_ARC) {
      for (const stop of era.stops) {
        const resolved = resolveArcStop(stop, data);
        assert.ok(resolved);
        if (stop.kind === "fall") {
          const source = data.fall.steps.find((step) => step.id === stop.key);
          assert.equal(resolved.evidence?.status, source?.evidence.status, stop.key);
        } else if (stop.kind === "band") {
          const source = data.order.bands.find((band) => band.id === stop.key);
          assert.equal(resolved.evidence?.status, source?.evidence.status, stop.key);
        } else {
          // Teaching and encounter records carry no grade; none may be invented.
          assert.equal(resolved.evidence, undefined, `${stop.kind}:${stop.key}`);
        }
      }
    }
    const isaiah = resolveArcStop({ kind: "fall", key: "isa-14-12-15", note: "" }, data);
    assert.equal(isaiah?.evidence?.status, "disputed");
  });

  it("assigns no grade to any stop in the arc definition itself", () => {
    for (const era of ANGEL_ARC) {
      for (const stop of era.stops) {
        assert.deepEqual(Object.keys(stop).sort(), ["key", "kind", "note"]);
      }
    }
  });

  it("keeps the present era honest: inferred framing, Acts framed as history", () => {
    const now = ANGEL_ARC.find((era) => era.id === "now");
    assert.ok(now);
    assert.equal(now.claimEvidence.status, "inferred");
    assert.match(now.claim, /not as a promise about today/);
    const acts = now.stops.find((stop) => stop.key === "ACT 16:16-18");
    assert.ok(acts);
    assert.match(acts.note, /In the Acts record/);
  });

  it("deep-links with the rooms' existing anchor formats", () => {
    const fall = resolveArcStop({ kind: "fall", key: "rev-20-abyss-end", note: "" }, data);
    assert.equal(fall?.roomHref, "/angels/fall#rev-20-abyss-end");
    const appearance = resolveArcStop({ kind: "appearance", key: "GEN 28:12", note: "" }, data);
    assert.equal(appearance?.roomHref, "/angels/encounters#enc-GEN-28-12");
    const band = resolveArcStop({ kind: "band", key: "lake-of-fire", note: "" }, data);
    assert.equal(band?.roomHref, "/angels#band-lake-of-fire");
    const teaching = resolveArcStop({ kind: "teaching", key: "eph-6-12", note: "" }, data);
    assert.equal(teaching?.roomHref, "/angels#eph-6-12");
  });
});
