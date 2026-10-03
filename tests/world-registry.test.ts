import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { WORLDS } from "../src/lib/portfolio-content";
import { WORLD_GUIDES } from "../src/lib/world-guidance";
import { WORLD_REGISTRY } from "../src/lib/world-registry";

describe("world registry", () => {
  it("keeps exactly eight unique worlds in one shared order", () => {
    assert.equal(WORLD_REGISTRY.length, 8);
    assert.equal(new Set(WORLD_REGISTRY.map((world) => world.id)).size, 8);
    assert.equal(new Set(WORLD_REGISTRY.map((world) => world.href)).size, 8);
  });

  it("drives the homepage doors and world guides without palette drift", () => {
    assert.deepEqual(
      WORLDS.doors.map((world) => world.id),
      WORLD_REGISTRY.map((world) => world.id),
    );

    for (const world of WORLD_REGISTRY) {
      const door = WORLDS.doors.find((candidate) => candidate.id === world.id);
      const guide = WORLD_GUIDES[world.id];
      assert.equal(door?.title, world.label);
      assert.equal(door?.href, world.href);
      assert.equal(door?.accent, world.accent);
      assert.equal(guide.label, world.label);
      assert.equal(guide.base, world.href);
    }
  });

  it("keeps shared portal art centralized, with a bespoke Apostles story opening", () => {
    const landingPages = {
      scriptures: "src/app/scriptures/page.tsx",
      jesus: "src/app/jesus/page.tsx",
      apostles: "src/app/apostles/ApostlesHome.tsx",
      early: "src/app/early/page.tsx",
      church: "src/app/church/ChurchHome.tsx",
      angels: "src/app/angels/AngelsHome.tsx",
      word: "src/app/word/WordHome.tsx",
      evidence: "src/app/evidence/EvidenceHome.tsx",
    } as const;

    const hero = readFileSync(
      path.join(process.cwd(), "src/app/_components/WorldHomeHero.tsx"),
      "utf8",
    );
    assert.match(hero, /WORLD_BY_ID/);
    assert.match(hero, /<Image/);
    assert.match(hero, /priority/);
    assert.match(hero, /sizes=/);
    assert.match(hero, /className="world-home-hero-plate plate"/);

    for (const [world, sourcePath] of Object.entries(landingPages)) {
      const source = readFileSync(path.join(process.cwd(), sourcePath), "utf8");
      if (world === "apostles") {
        // This world now opens with original narrative art; its one-h1 and
        // all-record discovery contracts are exercised in apostles-stories.spec.ts.
        assert.match(source, /APOSTLE_STORIES/);
        assert.equal((source.match(/<h1\b/g) ?? []).length, 1);
      } else {
        assert.match(source, /<WorldHomeHero/);
      }
      assert.doesNotMatch(source, /\/worlds\/.+\.jpg/);
    }
  });
});
