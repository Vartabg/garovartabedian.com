import assert from "node:assert/strict";
import { describe, it } from "node:test";
import canonsData from "../public/scriptures/canons.json";
import { continueFrom, describePlace } from "../src/lib/site/find-place";
import type { Canons } from "../src/lib/scriptures/types";

const canons = canonsData as Canons;

describe("describePlace", () => {
  it("names a chapter from the path", () => {
    const here = describePlace("/scriptures/protestant/MRK/14", canons);
    assert.equal(here.title, "Mark 14");
    assert.equal(here.world, "scriptures");
    assert.deepEqual(here.chapter, {
      tradition: "protestant",
      book: "MRK",
      chapter: 14,
    });
  });

  it("names an early text", () => {
    const here = describePlace("/early/didache", canons);
    assert.equal(here.title, "The Didache");
    assert.equal(here.world, "early");
  });
});

describe("continueFrom", () => {
  it("offers next and previous chapters from a reader page", () => {
    const groups = continueFrom("/scriptures/protestant/MRK/14", canons);
    const fromHere = groups.find((group) => group.id === "from-here");
    assert.ok(fromHere);
    const hrefs = fromHere.items.map((item) => item.href);
    assert.ok(hrefs.includes("/scriptures/protestant/MRK/13"));
    assert.ok(hrefs.includes("/scriptures/protestant/MRK/15"));
  });

  it("offers the next step of a named walk when the path is on that walk", () => {
    const groups = continueFrom("/scriptures/protestant/MRK/14", canons);
    const fromHere = groups.find((group) => group.id === "from-here");
    assert.ok(
      fromHere?.items.some(
        (item) =>
          item.href === "/scriptures/protestant/MRK/15" &&
          item.note.includes("The last week"),
      ),
    );
  });

  it("always includes walks and worlds, even on the front door", () => {
    const groups = continueFrom("/", canons);
    assert.ok(groups.some((group) => group.id === "walks" && group.items.length >= 4));
    assert.ok(groups.some((group) => group.id === "worlds"));
    assert.equal(groups.find((group) => group.id === "here")?.items[0]?.title, "Home");
  });

  it("includes recent places when provided, excluding current place", () => {
    const recents = [
      {
        id: "recent-1",
        href: "/early/didache",
        title: "The Didache",
        note: "Early text",
        kind: "text" as const,
      },
      {
        id: "recent-2",
        href: "/scriptures/protestant/MRK/14",
        title: "Mark 14",
        note: "Scripture",
        kind: "ref" as const,
      },
    ];
    const groups = continueFrom("/scriptures/protestant/MRK/14", canons, recents);
    const recentGroup = groups.find((g) => g.id === "recent");
    assert.ok(recentGroup);
    assert.equal(recentGroup.items.length, 1);
    assert.equal(recentGroup.items[0]?.href, "/early/didache");
  });
});
