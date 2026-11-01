import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { RESEARCH_TOOLS, discoveryThreads, engineeringNote, researchToolForPath } from "../src/lib/discovery-content";
import { HEXAPLA_WITNESSES } from "../src/lib/scriptures/polyglot";
import { WORLD_REGISTRY } from "../src/lib/world-registry";

test("discovery tools and their implementation references resolve to real files", () => {
  assert.equal(Object.keys(HEXAPLA_WITNESSES).length, 5);
  for (const tool of RESEARCH_TOOLS) {
    assert.ok(existsSync(`src/app${tool.href}/page.tsx`), tool.href);
    assert.ok(existsSync(tool.source), tool.source);
  }
  assert.ok(existsSync(engineeringNote("/scriptures/protestant/JHN/1").source));
});

test("every world has three distinct onward tools and never links to the current tool", () => {
  for (const world of WORLD_REGISTRY) {
    for (const pathname of [world.href, ...RESEARCH_TOOLS.map((tool) => tool.href)]) {
      const threads = discoveryThreads(world.id, pathname);
      assert.equal(threads.length, 3);
      assert.equal(new Set(threads.map((tool) => tool.href)).size, 3);
      assert.ok(threads.every((tool) => tool.href !== pathname));
    }
  }
});

test("implementation notes match route boundaries and safely fall back", () => {
  assert.equal(researchToolForPath("/scriptures/polyglot")?.id, "polyglot");
  assert.equal(researchToolForPath("/scriptures/polyglot/extra")?.id, "polyglot");
  assert.equal(researchToolForPath("/scriptures/polyglot-extra"), undefined);
  assert.equal(engineeringNote("/scriptures/protestant/JHN/1").title, "THE CHAPTER READER");
  assert.equal(engineeringNote("/work").title, "THE RESEARCH & THE CRAFT");
});
