import assert from "node:assert/strict";
import { test } from "node:test";
import { makeOverviewGroups, searchOverviewGroups } from "../src/app/jesus/parables/ParablesOverview";
import { getParables } from "../src/lib/jesus/server";
import { SYNOPTIC_FIGURES } from "../src/lib/jesus/synoptic-figures";
import { JOHN_FIGURES } from "../src/lib/jesus/john-figures";
import { THOMAS_PARABLES } from "../src/lib/jesus/thomas-parables";
import { JAMES_PARABLES } from "../src/lib/jesus/james-parables";
import { EARLY_FIGURES } from "../src/lib/jesus/early-figures";

test("overview counts entries and derives source coverage from the actual accounts", () => {
  const groups = makeOverviewGroups(getParables(), SYNOPTIC_FIGURES, JOHN_FIGURES, THOMAS_PARABLES, JAMES_PARABLES, EARLY_FIGURES);
  assert.deepEqual(groups.map((group) => group.items.length), [31, 7, SYNOPTIC_FIGURES.length, JOHN_FIGURES.length, THOMAS_PARABLES.length + JAMES_PARABLES.length + EARLY_FIGURES.length]);
  const sower = groups[0].items.find((item) => item.id === "sower")!;
  assert.deepEqual(sower.books, ["MAT", "MRK", "LUK"]);
  assert.equal(sower.unknown, false);
  assert.ok((sower.writings ?? 0) > 0);
  assert.ok(sower.search.includes("matthew 13"));
  assert.equal(new Set(groups.flatMap((group) => group.items.map((item) => item.id))).size, groups.reduce((sum, group) => sum + group.items.length, 0));
});

test("an unparseable account remains unknown instead of claiming a Gospel is absent", () => {
  const groups = makeOverviewGroups([{ id: "broken", title: "An uncertain reference", kind: "story", snodgrass: null, trench: [], accounts: [{ ref: "not-a-reference" }] }], [], [], [], [], []);
  assert.equal(groups[0].items[0].unknown, true);
  assert.deepEqual(groups[0].items[0].books, []);
});

test("reference search matches the same Gospel and verses within a range", () => {
  const groups = makeOverviewGroups(getParables(), SYNOPTIC_FIGURES, JOHN_FIGURES, THOMAS_PARABLES, JAMES_PARABLES, EARLY_FIGURES);
  const ids = (query: string) => searchOverviewGroups(groups, query).flatMap((group) => group.items.map((item) => item.id));
  assert.ok(ids("Matthew 13:3").includes("sower"));
  assert.ok(ids("Matt. 13:6").includes("sower"));
  assert.ok(ids("MAT 13:6-8").includes("sower"));
  assert.ok(ids("Matthew 13:6—8").includes("sower"));
  assert.ok(ids("sower Matthew 13:6").includes("sower"));
  assert.match(searchOverviewGroups(groups, "Matthew 13:6").flatMap((group) => group.items).find((item) => item.id === "sower")!.match!, /Account: Matthew 13:3-9/);
  assert.ok(!ids("Matthew 13:3").includes("ten-virgins"));
  assert.deepEqual(ids("Matthew 13:3 virgins"), []);
  assert.ok(!ids("Mark 13:6").includes("sower"));
  assert.deepEqual(ids("Matthew 13:0"), []);
  assert.deepEqual(ids("Matthew 13:8-3"), []);
});

test("Thomas saying searches use the linked saying numbers, not unrelated verse numbers", () => {
  const gospelEntries = [...getParables(), ...SYNOPTIC_FIGURES, ...JOHN_FIGURES];
  const groups = makeOverviewGroups(getParables(), SYNOPTIC_FIGURES, JOHN_FIGURES, THOMAS_PARABLES, JAMES_PARABLES, EARLY_FIGURES);
  for (let saying = 1; saying <= 114; saying++) {
    const actual = searchOverviewGroups(groups, `Thomas ${saying}`).flatMap((group) => group.items.map((item) => item.id)).sort();
    const expected = [
      ...gospelEntries.filter((item) => item.thomas?.some((link) => link.saying === saying)).map((item) => item.id),
      ...THOMAS_PARABLES.filter((item) => item.saying === saying).map((item) => item.id),
      ...JAMES_PARABLES.filter((item) => item.thomas?.some((link) => link.saying === saying)).map((item) => item.id),
      ...EARLY_FIGURES.filter((item) => item.thomas?.some((link) => link.saying === saying)).map((item) => item.id),
    ].sort();
    assert.deepEqual(actual, expected, `Thomas ${saying}`);
  }
  assert.ok(searchOverviewGroups(groups, "Matthew 13:6 Thomas 9").flatMap((group) => group.items).some((item) => item.id === "sower"));
  assert.ok(!searchOverviewGroups(groups, "Matthew 13:6 Thomas 1").flatMap((group) => group.items).some((item) => item.id === "sower"));
});
