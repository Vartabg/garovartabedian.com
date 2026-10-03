import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import type { GiantsData } from "../src/lib/church/types";

const giants = JSON.parse(
  readFileSync(new URL("../public/church/giants.json", import.meta.url), "utf8"),
) as GiantsData;

describe("Church learning data", () => {
  it("keeps every giant scannable without losing the full sourced record", () => {
    assert.equal(giants.giants.length, 9);

    for (const giant of giants.giants) {
      assert.ok(giant.giftSummary.length >= 45, giant.name + " needs a useful gift summary");
      assert.ok(giant.giftSummary.length <= 180, giant.name + " gift summary is too long");
      assert.ok(giant.faultSummary.length >= 45, giant.name + " needs a useful fault summary");
      assert.ok(giant.faultSummary.length <= 180, giant.name + " fault summary is too long");
      assert.ok(giant.gift.length > giant.giftSummary.length, giant.name + " needs a deeper gift record");
      assert.ok(giant.fault.length > giant.faultSummary.length, giant.name + " needs a deeper fault record");
      assert.ok(giant.faultSources.length > 0, giant.name + " needs at least one fault source");
    }
  });
});
