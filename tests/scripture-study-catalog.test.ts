import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SITE_ROUTES } from "../src/lib/site-navigation";
import { scriptureDestination, scriptureStudyCatalog } from "../src/lib/scriptures/study-catalog";

describe("Scripture study catalog", () => {
  it("makes every public Scripture destination discoverable under one task", () => {
    const tools = scriptureStudyCatalog().flatMap((group) => group.tools);
    const catalogPaths = tools.map((tool) => tool.href);
    const publicPaths = SITE_ROUTES.filter((route) => route.href.startsWith("/scriptures/")).map((route) => route.href);
    assert.equal(new Set(catalogPaths).size, catalogPaths.length, "each destination belongs to one catalog group");
    assert.deepEqual([...catalogPaths].sort(), publicPaths.sort());
    assert.ok(!catalogPaths.includes("/scriptures/find"));
    assert.ok(!catalogPaths.includes("/scriptures/research"));
  });

  it("uses the shared destination names and notes rather than hub aliases", () => {
    for (const group of scriptureStudyCatalog()) {
      assert.ok(group.title && group.question);
      assert.ok(group.tools.length > 0);
      for (const tool of group.tools) {
        assert.equal(tool, SITE_ROUTES.find((route) => route.href === tool.href));
        assert.ok(tool.label && tool.note, `A visitor needs a name and purpose for ${tool.href}`);
      }
    }
    assert.equal(scriptureDestination("/scriptures/polyglot").label, "Compare translations");
    assert.equal(scriptureDestination("/scriptures/word-bridge").label, "Word Bridge");
    assert.throws(() => scriptureDestination("/scriptures/research"), /missing from SITE_ROUTES/);
  });
});
