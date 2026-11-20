import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import canons from "../public/scriptures/canons.json";
import { EBIBLE_RETRIEVED, SCRIPTURE_SOURCES } from "../src/lib/scriptures/sources";

const sourcesMd = readFileSync("public/scriptures/SOURCES.md", "utf8").toLowerCase();

test("every hosted translation has a source row that SOURCES.md backs", () => {
  for (const id of Object.keys(canons.translations)) {
    const row = SCRIPTURE_SOURCES[id as keyof typeof SCRIPTURE_SOURCES];
    assert.ok(row, `no source row for ${id}`);
    for (const origin of [row.origin, ...Object.values(row.byBook ?? {}).map((book) => book.origin)]) {
      for (const word of origin.split(/ and /)) assert.ok(sourcesMd.includes(word.toLowerCase()), `${id}: ${word} is not in SOURCES.md`);
    }
    assert.equal(row.license, "public domain");
  }
  assert.ok(sourcesMd.includes(`retrieved ${EBIBLE_RETRIEVED}`));
  assert.equal(SCRIPTURE_SOURCES.web.retrieved, EBIBLE_RETRIEVED);
  assert.equal(SCRIPTURE_SOURCES.charles.retrieved, null);
});
