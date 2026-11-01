import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { setFromHere, subscribeFromHere, type FromHere } from "../src/lib/site/from-here";
import { libraryFromHere } from "../src/lib/early/from-here";

describe("From here", () => {
  it("hands the current page's links to a late subscriber and clears them on leave", () => {
    const seen: Array<FromHere | null> = [];
    setFromHere({ label: "Mark 1", links: [{ href: "/scriptures/protestant/LUK/4?t=web", label: "Luke 4", kind: "Cross-referenced 24×" }] });
    const stop = subscribeFromHere((value) => seen.push(value));
    setFromHere(null);
    stop();
    setFromHere({ label: "Ignored", links: [] });
    assert.equal(seen.length, 2);
    assert.equal(seen[0]?.label, "Mark 1");
    assert.equal(seen[1], null);
    setFromHere(null);
  });

  it("links a library edition to the shelf's other translation and its era, and nothing else", () => {
    assert.deepEqual(libraryFromHere("1clement"), [
      { href: "/early/1clement", label: "1 Clement", kind: "Another translation" },
      { href: "/early/era/fathers", label: "The Apostolic Fathers", kind: "Writings from this era" },
    ]);
    assert.deepEqual(libraryFromHere(null), []);
    assert.deepEqual(libraryFromHere("not-a-hosted-text"), []);
  });
});
