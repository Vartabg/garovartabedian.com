import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { naveIndex } from "../src/lib/scriptures/server/nave-index";
import { LARGER_MIN_REFS, LARGEST_SHOWN, largestTopics, letterTopics, matchTopics } from "../src/lib/scriptures/topics-index";
import TopicsRoom from "../src/app/scriptures/topics/TopicsRoom";

const topics = naveIndex.topics;
const text = (node: Element | null) => (node?.textContent ?? "").replace(/\s+/g, " ").trim();

test("the topics page opens on the topics with the most references, not on the letter A", () => {
  const page = new JSDOM(renderToStaticMarkup(<TopicsRoom data={naveIndex} />)).window.document;
  const rows = [...page.querySelectorAll(".scr-topics-list > li")];
  const largest = largestTopics(topics);

  assert.equal(rows.length, LARGEST_SHOWN);
  assert.equal(text(page.querySelector(".scr-topics-head h2")), `The ${LARGEST_SHOWN} largest topics`);
  assert.deepEqual(rows.slice(0, 3).map((row) => text(row.querySelector("a"))), ["God", "Jesus, the Christ", "Church"]);
  assert.deepEqual(
    rows.map((row) => row.querySelector("a")!.getAttribute("href")),
    largest.map((topic) => `/scriptures/topics/${encodeURIComponent(topic.id)}`),
  );
  for (let i = 1; i < largest.length; i++) assert.ok(largest[i - 1].refCount >= largest[i].refCount, "largest first");
  assert.equal(text(rows[0].querySelector("span")), largest[0].refCount.toLocaleString());
  assert.match(text(page.querySelector(".scr-topics-note")), new RegExp(`^${topics.length.toLocaleString()} topics in all\\.`));

  // One letter picker, straight under the search box; the density block is gone.
  assert.equal(page.querySelectorAll("nav.scr-topics-az").length, 1);
  assert.equal(page.querySelectorAll("nav.scr-topics-az button").length, new Set(topics.map((topic) => topic.section)).size);
  assert.equal(page.querySelectorAll(".scr-topic-atlas, .scr-topic-bars").length, 0);
  assert.equal(page.querySelector(".scr-topics-search")!.nextElementSibling, page.querySelector("nav.scr-topics-az"));
});

test("a letter leads with its larger topics and keeps every topic reachable", () => {
  const sections = [...new Set(topics.map((topic) => topic.section))];
  let listed = 0;
  for (const section of sections) {
    const { all, larger } = letterTopics(topics, section);
    listed += all.length;
    assert.ok(all.length > 0, `${section} has topics`);
    assert.ok(larger.length < all.length, `${section} folds only when something is left to fold`);
    const big = all.filter((topic) => topic.refCount >= LARGER_MIN_REFS);
    assert.deepEqual(larger, big.length < all.length ? big : []);
  }
  assert.equal(listed, topics.length, "every topic sits under exactly one letter");

  const s = letterTopics(topics, "S");
  assert.deepEqual([s.all.length, s.larger.length], [570, 71]);
  assert.deepEqual(s.larger.slice(0, 3).map((topic) => topic.id), ["SABBATH", "SALT", "SALUTATIONS"]);
  // A letter with no larger topics lists all of them, with nothing folded.
  assert.deepEqual(letterTopics(topics, "Q").larger, []);
});

test("a search matches any part of a topic name, in any case", () => {
  assert.deepEqual(matchTopics(topics, " faith ").map((topic) => topic.id), ["FAITH", "FAITHFULNESS", "FIGHT OF FAITH", "UNFAITHFULNESS"]);
  assert.deepEqual(matchTopics(topics, "holy trinity").map((topic) => topic.id), ["ANGEL (Holy Trinity)"]);
  assert.deepEqual(matchTopics(topics, "  "), []);
});
