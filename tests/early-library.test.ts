import test from "node:test";
import assert from "node:assert/strict";
import { getLibraryPage, getLibrary, searchLibrary } from "../src/lib/early/library-server";
import { LIBRARY_FIND } from "../src/lib/early/library-find";
import { rankFindQuery } from "../src/lib/site/find-query";
import sitemap from "../src/app/early/library/sitemap";

test("literal search returns bounded, attributed results of the chosen kind", async () => {
  const result = await searchLibrary("resurrection", "primary-text");
  assert.ok(result.total > 30);
  assert.equal(result.hits.length, 30);
  assert.ok(result.hits.every(hit => hit.kind === "primary-text" && hit.snippet.length < 355 && !Object.hasOwn(hit, "text")));
  const restricted = await searchLibrary("Hebrew", "reference-only");
  assert.ok(restricted.hits.some(hit => hit.recordId === "community-rule"));
  assert.equal((await searchLibrary("Hebrew", "primary-text", "community-rule")).total, 0);
  assert.equal((await searchLibrary("x")).total, 0);
  assert.equal((await searchLibrary("resurrection", "all", "", NaN)).page, 1);
});

test("unknown sections, path traversal and reference editions cannot expose data files", async () => {
  assert.equal(await getLibraryPage("../../scripts", "library-import-manifest"), null);
  assert.equal(await getLibraryPage("1-clement", "../../search"), null);
  assert.equal(await getLibraryPage("ethiopic-didascalia", "opening"), null);
});

test("Find can discover editions without adding corpus text to its catalog", () => {
  assert.equal(LIBRARY_FIND.length, 122);
  const groups = rankFindQuery("Philo", [], null);
  assert.ok(groups.some(group => group.id === "library" && group.items.some(item => item.href.startsWith("/early/library/philo-"))));
});

test("all library records and bounded reading routes appear in its sitemap", async () => {
  const entries = new Set((await sitemap()).map(entry => entry.url));
  for (const record of await getLibrary()) {
    const base = `https://garovartabedian.com/early/library/${record.id}`;
    assert.ok(entries.has(base));
    for (const section of record.sections) assert.ok(entries.has(`${base}/${section.id}`));
  }
});
