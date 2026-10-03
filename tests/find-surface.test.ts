import test from "node:test";
import assert from "node:assert/strict";
import canonsJson from "../public/scriptures/canons.json";
import type { Canons } from "../src/lib/scriptures/types";
import type { FindGroup, FindItem } from "../src/lib/site/find-query";
import { surfaceGroups, previewTarget } from "../src/lib/site/find-surface";
const canons = canonsJson as Canons;
const item = (
  id: string,
  kind: FindItem["kind"],
  href = "/" + id,
): FindItem => ({ id, kind, href, title: id, note: "Fixture" });

test("Find scopes distinguish passages from site destinations while retaining writing pages", () => {
  const groups: FindGroup[] = [
    {
      id: "mixed",
      label: "Mixed",
      items: [
        item("verse", "verse"),
        item("reference", "ref"),
        item("topic", "topic"),
        item("didache", "text"),
        item("council", "council"),
      ],
    },
  ];
  assert.deepEqual(
    surfaceGroups(groups, "texts", true)[0].items.map((i) => i.id),
    ["verse", "reference", "topic", "didache"],
  );
  assert.deepEqual(
    surfaceGroups(groups, "site", true)[0].items.map((i) => i.id),
    ["didache", "council"],
  );
  assert.equal(surfaceGroups(groups, "all", true)[0].items.length, 5);
});
test("Find's opening surface is bounded and hides the command directory until requested", () => {
  const groups: FindGroup[] = [
    { id: "console", label: "Commands", items: [item("action", "action")] },
    {
      id: "worlds",
      label: "Worlds",
      items: Array.from({ length: 12 }, (_, i) => item(String(i), "world")),
    },
    { id: "ask", label: "Other search links", items: [item("ask", "ask")] },
  ];
  const opening = surfaceGroups(groups, "all", false);
  assert.equal(opening.length, 1);
  assert.equal(opening[0].items.length, 6);
  assert.equal(surfaceGroups(groups, "texts", true)[0].items[0].id, "action");
});
test("duplicate destinations collapse but distinct preference commands survive", () => {
  const groups: FindGroup[] = [
    {
      id: "a",
      label: "A",
      items: [
        item("one", "page", "/same"),
        item("two", "page", "/same"),
        item("dark", "action", "#"),
        item("light", "action", "#"),
      ],
    },
  ];
  assert.deepEqual(
    surfaceGroups(groups, "all", true)[0].items.map((i) => i.id),
    ["one", "dark", "light"],
  );
});
test("source previews keep the selected edition and resolve reader defaults", () => {
  const kjv = previewTarget(
    item("verse", "ref", "/scriptures/protestant/JHN/11?t=kjv#v35"),
    canons,
  )!;
  assert.deepEqual(
    [kjv.book, kjv.chapter, kjv.verse, kjv.translation],
    ["JHN", 11, 35, "kjv"],
  );
  const defaultChapter = previewTarget(
    item("chapter", "ref", "/scriptures/protestant/JHN/11"),
    canons,
  )!;
  assert.equal(defaultChapter.translation, "web");
  assert.equal(defaultChapter.isVerse, false);
  const brentonOnly = Object.entries(canons.books).find(
    ([, b]) => !b.trans.includes("web") && b.trans.includes("brenton"),
  );
  if (brentonOnly)
    assert.equal(
      previewTarget(
        item("other", "ref", "/scriptures/orthodox/" + brentonOnly[0] + "/1"),
        canons,
      )?.translation,
      "brenton",
    );
});
test("unavailable editions, out-of-range chapters, and non-reader URLs have no preview target", () => {
  for (const href of [
    "/scriptures/protestant/JHN/11?t=bogus#v35",
    "/scriptures/protestant/JHN/0",
    "/scriptures/protestant/JHN/999",
    "/scriptures/protestant/XXX/1",
    "/church/councils",
    "https://example.com/scriptures/protestant/JHN/11",
  ])
    assert.equal(
      previewTarget(item("invalid", "ref", href), canons),
      null,
      href,
    );
});
