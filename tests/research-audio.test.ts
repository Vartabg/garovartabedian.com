import assert from "node:assert/strict";
import test from "node:test";
import episodes from "../src/lib/research-audio/episodes.json";
import { WORLD_REGISTRY } from "../src/lib/world-registry";

test("every research world has a listening companion at a unique public route", () => {
  assert.equal(new Set(episodes.map(({ id }) => id)).size, episodes.length);
  assert.equal(new Set(episodes.map(({ route }) => route)).size, episodes.length);
  for (const world of WORLD_REGISTRY) {
    assert.ok(episodes.some(({ route }) => route === world.href || route.startsWith(`${world.href}/`)), world.label);
  }
});

test("overview sections cite named sources with inspectable destinations", () => {
  for (const episode of episodes) {
    assert.match(episode.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(new Set(episode.sources.map(({ id }) => id)).size, episode.sources.length);
    for (const section of episode.sections) {
      assert.ok(section.sourceIds.length > 0, `${episode.id}: ${section.title}`);
      for (const id of section.sourceIds) {
        const source = episode.sources.find((item) => item.id === id);
        assert.ok(source, `${episode.id}: missing source ${id}`);
        assert.ok(source.label.trim() && source.note.trim());
        const url = new URL(source.href, "https://garovartabedian.com");
        assert.equal(url.protocol, "https:");
        assert.ok(source.href.startsWith("/") || source.href.startsWith("https://"));
        assert.ok(!source.href.startsWith("//"));
      }
    }
  }
});
