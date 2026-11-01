import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SITE_ROUTES, getWorldRoutes } from "../src/lib/site-navigation";
import { routePath, worldContinuation, worldGuideLayout } from "../src/lib/world-continuity";
import { WORLD_REGISTRY } from "../src/lib/world-registry";

describe("world continuity", () => {
  it("offers three distinct reachable next steps without sending readers to the current page", () => {
    const destinations = new Set(SITE_ROUTES.map((route) => route.href));
    // Reader routes exercise the fallback from dynamic content to its section.
    const records: Record<string, string[]> = {
      scriptures: ["/scriptures/protestant/JHN/3", "/scriptures/topics/faith"],
      early: ["/early/library/didache/1", "/early/didache"],
      apostles: ["/apostles/stories/peter"],
      evidence: ["/evidence/frameworks/christianity"],
    };
    for (const world of WORLD_REGISTRY) {
      for (const pathname of [...getWorldRoutes(world.id).map((route) => route.href), ...(records[world.id] ?? [])]) {
        const links = worldContinuation(world.id, pathname);
        assert.equal(links.length, 3, pathname);
        assert.equal(new Set(links.map((link) => routePath(link.href))).size, 3, pathname);
        for (const link of links) {
          assert.notEqual(routePath(link.href), pathname, pathname);
          assert.ok(destinations.has(routePath(link.href)), `${pathname} → ${link.href}`);
          assert.ok(link.note, `${pathname} → ${link.href} needs a useful description`);
        }
        if (pathname !== world.href) assert.ok(links.some((link) => link.href === world.href), `${pathname} needs an overview return`);
      }
    }
  });

  it("keeps entrances compact and distinguishes adjacent route names", () => {
    for (const world of WORLD_REGISTRY) {
      assert.equal(worldGuideLayout(world.id, world.href), "compact");
      assert.equal(worldGuideLayout(world.id, `${world.href}/`), "compact");
      const room = getWorldRoutes(world.id).find((route) => route.href !== world.href)!;
      assert.equal(worldGuideLayout(world.id, room.href), "room");
    }
    assert.equal(worldGuideLayout("scriptures", "/scriptures/protestant/JHN/3"), "reader");
    assert.equal(worldGuideLayout("early", "/early/didache"), "reader");
    assert.equal(routePath("/scriptures/search?q=faith#results"), "/scriptures/search");
  });
});
