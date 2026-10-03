import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { searchVersesFrom, type SearchDataSource } from "../src/lib/scriptures/search";
import { wordingEvidence, wordingLabel } from "../src/lib/scriptures/search-wording";
import { searchExpansion } from "../src/lib/scriptures/search-expansion";
import { findReturnHref, withFindContext, preserveFindContext } from "../src/lib/scriptures/search-url";
import { parseFindRef } from "../src/lib/site/find-query";
import { findSearchHref } from "../src/lib/site/find-text";
import type { Canons, BookText, SearchPosting } from "../src/lib/scriptures/types";
const canons: Canons = JSON.parse(readFileSync("public/scriptures/canons.json", "utf8"));
function fixture(texts: string[], queryWords: string[], translation: "web" | "kjv" = "web"): SearchDataSource {
  const posts = texts.map((_, i) => [canons.bookOrder.indexOf("GEN"), 1, i + 1] as SearchPosting);
  return { canons, meta: { trans: translation, stopwords: ["of", "the", "not", "do", "be", "but"], shardScheme: "first2" }, loadShard: async () => Object.fromEntries(queryWords.map(word => [word, posts])), loadBook: async book => ({ book, trans: translation, chapters: [texts] }) as BookText };
}
test("complete phrases beyond the display cap outrank 220 scattered matches", async () => {
  const texts = [...Array<string>(220).fill("The world has darkness; his light fails."), "I am the light of the world."];
  const result = await searchVersesFrom("light of the world", fixture(texts, ["light", "world"]));
  assert.equal(result.totalHits, 221); assert.equal(result.hits.length, 200);
  assert.equal(result.hits[0].verse, 221); assert.equal(result.hits[0].match, "phrase");
});
test("negation survives stopwords and favors preserved wording without claiming agreement", async () => {
  const result = await searchVersesFrom("do not be afraid", fixture(["Be afraid.", "Don't be afraid.", "Do not be afraid."], ["afraid"]));
  assert.ok(result.searched.includes("not")); assert.ok(!result.dropped.includes("not"));
  assert.deepEqual(result.hits.map(h => h.verse), [3, 2, 1]);
  assert.equal(wordingLabel(result.hits[1]), "Phrase with a contraction");
  assert.match(wordingLabel(result.hits[2]), /negation differs/);
});
test("ordered nearby wording ranks above reversed scattered content", async () => {
  const result = await searchVersesFrom("not peace but a sword", fixture(["The sword will not bring peace.", "I came not to send peace, but a sword."], ["peace", "a", "sword"]));
  assert.equal(result.hits[0].verse, 2);
});
test("phrase normalization retains numbers, repetition and negative words", () => {
  assert.equal(wordingEvidence("LIGHT of the world", "Light—of the world!").phrase, true);
  assert.equal(wordingEvidence("not peace", "peace").phrase, false);
  assert.equal(wordingEvidence("holy holy", "holy").phrase, false);
  assert.equal(wordingEvidence("seven 7", "seven 8").phrase, false);
});
test("failed or mismatched source verification never produces a phrase claim", async () => {
  const source = fixture(["love your enemies"], ["love", "your", "enemies"], "kjv");
  source.loadBook = async book => ({ book, trans: "web", chapters: [["love your enemies"]] }) as BookText;
  const result = await searchVersesFrom("love your enemies", source);
  assert.equal(result.translation, "kjv"); assert.equal(result.hits[0].match, undefined);
  assert.equal(result.warnings?.length, 1);
});
test("general vocabulary bridges remain optional and never rewrite negated queries", () => {
  for (const query of ["loneliness", "exhausted", "betrayal", "grief", "anxiety"]) assert.ok(searchExpansion(query).terms.length, query);
  for (const query of ["I am not lonely", "never forgive", "don't be afraid", "without friends"]) {
    const expansion = searchExpansion(query); assert.equal(expansion.query, null); assert.deepEqual(expansion.terms, []); assert.deepEqual(expansion.topics, []);
  }
  assert.equal(searchExpansion("quantum computing").query, null);
});
test("search context preserves the actual source edition and the original search edition separately", () => {
  const target = withFindContext("/scriptures/protestant/PSA/23?t=web#v1", "loneliness", "drb", "texts");
  const url = new URL(target, "https://local.invalid");
  assert.equal(url.searchParams.get("t"), "web"); assert.equal(url.hash, "#v1");
  assert.equal(findReturnHref(url.searchParams), "/scriptures/search?q=loneliness&trans=drb&scope=texts");
  assert.equal(withFindContext("https://example.com", "test", "web"), "https://example.com");
  assert.equal(findReturnHref(new URLSearchParams("find=test&findTrans=invalid")), null);
});
test("popup references and search submissions carry the selected edition and scope", () => {
  assert.equal(parseFindRef("John 8:12", canons, "kjv")?.href, "/scriptures/protestant/JHN/8?t=kjv#v12");
  assert.equal(parseFindRef("web: John 8:12", canons, "kjv")?.href, "/scriptures/protestant/JHN/8?t=web#v12");
  assert.equal(parseFindRef("John 8:12", canons, "charles"), null);
  assert.equal(findSearchHref("love your enemies", false, "drb", "texts"), "/scriptures/search?q=love%20your%20enemies&trans=drb&scope=texts");
});

test("reader variant changes retain the original search without copying other parameters", () => {
  assert.equal(preserveFindContext("/scriptures/protestant/JHN/8?t=kjv#v12", new URLSearchParams("find=light&findTrans=drb&findScope=texts&untrusted=extra")), "/scriptures/protestant/JHN/8?t=kjv&find=light&findTrans=drb&findScope=texts#v12");
});
