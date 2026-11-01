import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { HAND_OUTLINES, firstYear, handForYear } from "../src/lib/hands";

const ROOT = path.join(import.meta.dirname, "..");

test("the church road changes hands at the turns of its history", () => {
  const road = JSON.parse(readFileSync(path.join(ROOT, "public/church/road.json"), "utf8")) as {
    eras: { id: string; years: string }[];
  };
  const hands = Object.fromEntries(road.eras.map((era) => [era.id, handForYear(firstYear(era.years) ?? 30)]));
  assert.equal(hands["upper-room"], "capitals");
  assert.equal(hands["under-the-sword"], "capitals");
  assert.equal(hands["empire-converts"], "uncial");
  assert.equal(hands["high-throne"], "blackletter");
  assert.equal(hands["the-break"], "print");
  assert.equal(hands["whole-world"], "today");
});

test("every hand has its outline file and the license that came with it", () => {
  for (const [hand, url] of Object.entries(HAND_OUTLINES)) {
    assert.ok(existsSync(path.join(ROOT, "public", url)), `${hand} outlines missing`);
    const license = readFileSync(path.join(ROOT, "public/fonts/era", `${hand}-OFL.txt`), "utf8");
    assert.match(license, /SIL Open Font License/, `${hand} license`);
  }
});
