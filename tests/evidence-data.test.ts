import assert from "node:assert/strict";
import { describe, it } from "node:test";
import evidence from "../public/evidence/cases.json";

describe("How We Know evidence boundaries", () => {
  it("keeps the reasoning layers and all eight evidence rooms explicit", () => {
    assert.deepEqual(
      evidence.layers.map((layer) => layer.id),
      ["observed", "inferred", "interpreted"],
    );
    assert.deepEqual(
      evidence.rooms.map((room) => room.id),
      [
        "source",
        "text",
        "stone",
        "witness",
        "experiment",
        "argument",
        "tradition",
        "limit",
      ],
    );

    for (const room of evidence.rooms) {
      assert.ok(room.question.endsWith("?"), `${room.id} needs a question`);
      assert.match(room.href, /^\//, `${room.id} needs an internal route`);
      assert.ok(room.example.length > 40, `${room.id} needs a live example`);
    }
  });

  it("turns existing worlds into claim tests without erasing their limits", () => {
    assert.ok(evidence.claimLab.length >= 6);
    assert.ok(new Set(evidence.claimLab.map((item) => item.world)).size >= 6);

    for (const item of evidence.claimLab) {
      assert.ok(item.record.length > 60, `${item.id} needs a record`);
      assert.ok(item.inference.length > 60, `${item.id} needs an inference`);
      assert.ok(item.limit.length > 60, `${item.id} needs a boundary`);
      assert.match(item.href, /^\//, `${item.id} needs a source-world route`);
    }
  });

  it("keeps Faith & Science secondary and the Trinity away from the front door", () => {
    const docket = evidence.faithScience.docket;
    assert.equal(docket[0]?.id, "big-bang");
    assert.equal(docket.at(-1)?.id, "trinity");
    assert.equal(docket.at(-1)?.status, "later");

    for (const item of docket) {
      assert.ok(item.question.endsWith("?"), `${item.id} needs a question`);
      assert.ok(item.boundary.length > 20, `${item.id} needs a boundary`);
    }
  });

  it("keeps source lanes complete and research sources secure", () => {
    assert.equal(evidence.sourceLanes.length, 8);
    assert.equal(
      new Set(evidence.sourceLanes.map((lane) => lane.href)).size,
      evidence.sourceLanes.length,
    );

    const sourceIds = evidence.sources.map((source) => source.id);
    assert.equal(new Set(sourceIds).size, sourceIds.length);
    for (const source of evidence.sources) {
      assert.match(source.href, /^https:\/\//);
      assert.ok(source.organization.length > 0);
      assert.ok(source.kind.length > 0);
    }
  });
});
