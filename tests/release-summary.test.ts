import assert from "node:assert/strict";
import test from "node:test";
import { parseReleaseSummaryEnv, releaseSummaryFrom } from "../src/lib/site/release-summary";

const record = JSON.stringify({
  schemaVersion: 1,
  steps: ["Lint", "Old step", "Build", "Promote"],
  attempts: [
    { date: "2026-09-07", outcome: "live", ran: [0, 1, 2, 3], stop: null, minutes: 20 },
    { date: "2026-10-01", outcome: "live", ran: [0, 2, 3], stop: null, minutes: 25 },
    { date: "2026-10-02", outcome: "stopped", ran: [0], stop: 0, minutes: 2 },
  ],
});

test("the foot's summary counts attempts and shows the latest live gate", () => {
  assert.deepEqual(releaseSummaryFrom(record), { attempts: 3, steps: ["Lint", "Build", "Promote"] });
  assert.equal(releaseSummaryFrom(null), null);
  assert.equal(releaseSummaryFrom("{ not json"), null);
  assert.equal(releaseSummaryFrom(JSON.stringify({ schemaVersion: 1, steps: [], attempts: [] })), null);
});

test("the inlined value round-trips and rejects anything else", () => {
  const summary = releaseSummaryFrom(record);
  assert.deepEqual(parseReleaseSummaryEnv(JSON.stringify(summary)), summary);
  assert.equal(parseReleaseSummaryEnv(""), null);
  assert.equal(parseReleaseSummaryEnv(undefined), null);
  assert.equal(parseReleaseSummaryEnv("null"), null);
  assert.equal(parseReleaseSummaryEnv('{"attempts":0,"steps":[]}'), null);
});
