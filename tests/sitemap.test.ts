import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sitemap from "../src/app/sitemap";
import { EARLY_TEXTS, ERAS } from "../src/lib/early/client";
import canons from "../public/scriptures/canons.json";
import { PREVIEW_TOPIC_LIMIT, ssgBookParams, ssgTopicIds, topicCanonicalPath } from "../src/lib/scriptures/canonical";
import { WORLD_GUIDES } from "../src/lib/world-guidance";

describe("sitemap", () => {
  const entries = sitemap();
  const paths = new Set(
    entries.map((e) => e.url.replace("https://garovartabedian.com", "") || ""),
  );

  it("includes the front door and eight world homes", () => {
    for (const p of ["", "/scriptures", "/jesus", "/apostles", "/early", "/church", "/angels", "/word", "/evidence"]) {
      assert.ok(paths.has(p), `missing ${p || "/"}`);
    }
  });

  it("includes search and topics index", () => {
    assert.ok(paths.has("/scriptures/search"));
    assert.ok(paths.has("/scriptures/topics"));
    assert.ok(paths.has("/scriptures/graph"));
    assert.ok(paths.has("/scriptures/parallels"));
  });

  it("includes every Writings era landing", () => {
    for (const era of ERAS) {
      assert.ok(paths.has(`/early/era/${era.id}`), `missing era ${era.id}`);
    }
  });

  it("includes every hosted early text", () => {
    for (const t of EARLY_TEXTS) {
      assert.ok(paths.has(`/early/${t.id}`), `missing text ${t.id}`);
    }
  });

  it("includes every church room from the world guide nav", () => {
    for (const item of WORLD_GUIDES.church.nav) {
      assert.ok(paths.has(item.href), `missing ${item.href}`);
    }
  });

  it("includes every tradition landing", () => {
    for (const t of canons.traditions) {
      assert.ok(paths.has(`/scriptures/${t.id}`), `missing tradition ${t.id}`);
    }
  });

  it("includes every SSG book page (tradition × book)", () => {
    const books = ssgBookParams();
    // Derived from the canons so adding a book (e.g. 1 Enoch) updates the
    // expectation instead of breaking the gate.
    const expected = canons.traditions.reduce((n, t) => n + t.books.length, 0);
    assert.equal(books.length, expected);
    for (const { tradition, book } of books) {
      assert.ok(
        paths.has(`/scriptures/${tradition}/${book}`),
        `missing book ${tradition}/${book}`,
      );
    }
  });

  it("includes the 300 SSG topic pages", () => {
    const ids = ssgTopicIds();
    assert.equal(ids.length, PREVIEW_TOPIC_LIMIT);
    for (const id of ids) {
      assert.ok(paths.has(topicCanonicalPath(id)), `missing topic ${id}`);
    }
  });

  it("does not list infinite scripture chapter URLs", () => {
    const chapterish = [...paths].filter((p) =>
      /^\/scriptures\/[^/]+\/[A-Z0-9]+\/\d+$/.test(p),
    );
    assert.deepEqual(chapterish, []);
  });

  it("does not list the long tail of Nave topics beyond the SSG cap", () => {
    const topicPaths = [...paths].filter((p) => p.startsWith("/scriptures/topics/"));
    assert.equal(topicPaths.length, PREVIEW_TOPIC_LIMIT);
  });

  it("uses absolute garovartabedian.com URLs", () => {
    for (const e of entries) {
      assert.match(e.url, /^https:\/\/garovartabedian\.com(\/|$)/);
    }
  });

  it("prioritizes independent work over the secondary employment path", () => {
    const priority = (path: string) =>
      entries.find((entry) => entry.url.endsWith(path))?.priority ?? 0;

    assert.ok(priority("/services") > priority("/hire"));
    assert.ok(priority("/work") > priority("/resume"));
  });
});
