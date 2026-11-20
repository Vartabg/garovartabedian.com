import test from "node:test";
import assert from "node:assert/strict";
import { naveIndex } from "../src/lib/scriptures/server/nave-index";
import { topicTitle as serverTopicTitle } from "../src/lib/scriptures/server";
import { TOPIC_TITLE_NAMES, topicTitle } from "../src/lib/scriptures/topic-title";
import { topicLabel } from "../src/lib/site/find-query";

const ids = naveIndex.topics.map((topic) => topic.id);
const plain = (id: string) => id.charAt(0) + id.slice(1).toLowerCase();

test("a topic title keeps the capitals of the names inside it", () => {
  const pinned: Record<string, string> = {
    "JESUS, THE CHRIST": "Jesus, the Christ",
    "WORD OF GOD": "Word of God",
    "LAMB OF GOD": "Lamb of God",
    "HOLY SPIRIT": "Holy Spirit",
    "PRINCE OF PEACE": "Prince of Peace",
    "I AM THAT I AM": "I AM THAT I AM",
    "DIVINITY OF CHRIST": "Divinity of Christ",
    "NAMES OF JESUS": "Names of Jesus",
    "KINGDOM OF SATAN": "Kingdom of Satan",
    "IFS, OF THE BIBLE": "Ifs, of the Bible",
    "LORD'S SUPPER": "Lord's supper",
    "EUCHARIST (THE LORD'S SUPPER)": "Eucharist (the Lord's supper)",
    "SAVIOUR (SAVIOR)": "Saviour (Savior)",
    "AQUILA AND PRISCILLA": "Aquila and Priscilla",
    "PILATE, PONTIUS": "Pilate, Pontius",
    "URIM AND THUMMIM": "Urim and Thummim",
    "ANATHEMA MARAN-ATHA": "Anathema Maran-atha",
    "ELISABETH (ELIZABETH)": "Elisabeth (Elizabeth)",
    "EL-ELOHE-ISRAEL": "El-elohe-Israel",
    // What the index already wrote in mixed case stays as written.
    "ANGEL (Holy Trinity)": "Angel (Holy Trinity)",
    "ANGEL (a spirit)": "Angel (a spirit)",
    "MINISTER, Christian": "Minister, Christian",
    "TONGUES (the gift)": "Tongues (the gift)",
    // The Revised and Authorized Versions.
    "BEN-DEKAR (R. V.)": "Ben-dekar (R. V.)",
    "EASTER (A.V.)": "Easter (A.V.)",
    "BETH-EL-APHRAH (R. V.) APHRAH (A. V.)": "Beth-el-aphrah (R. V.) Aphrah (A. V.)",
    // Unchanged: one word, a hyphened name in King James style, a common phrase.
    FAITH: "Faith",
    ANTICHRIST: "Antichrist",
    "ABEL-BETH-MAACHAH": "Abel-beth-maachah",
    "RED SEA": "Red sea",
    "KINGDOM OF HEAVEN": "Kingdom of heaven",
  };
  for (const [id, title] of Object.entries(pinned)) {
    assert.ok(ids.includes(id), `${id} is in the index`);
    assert.equal(topicTitle(id), title);
  }
  assert.equal(serverTopicTitle, topicTitle, "the topic pages use the same helper");
  // Find used to capitalise every word, which wrote "Word Of God" and "Lord'S Supper".
  assert.equal(topicLabel("WORD OF GOD"), "Word of God");
  assert.equal(topicLabel("LORD'S SUPPER"), "Lord's supper");
});

test("across the whole index only the listed names change a title", () => {
  const changed = ids.filter((id) => topicTitle(id) !== plain(id));
  for (const id of ids) {
    const title = topicTitle(id);
    assert.match(title, /^[A-Z]/, `${id} starts with a capital`);
    assert.doesNotMatch(title, /(^|[^A-Za-z'-])(god|christ|jesus|lord's|satan|bible)(?![A-Za-z'])/, `${id} keeps a holy name small: ${title}`);
    assert.equal(title.length, id.length, `${id} keeps its length`);
    assert.equal(title.toUpperCase(), id.toUpperCase(), `${id} keeps its letters`);
  }
  // A one-word topic or a hyphened name reads as it did before, bar the one whole-title rule.
  for (const id of changed) {
    assert.ok(/[ ,(]/.test(id) || id === "EL-ELOHE-ISRAEL", `${id} changed without a second word`);
  }
  assert.ok(changed.length > 40 && changed.length < 120, `changed ${changed.length} titles`);

  // Every listed name earns its place.
  for (const name of TOPIC_TITLE_NAMES) {
    assert.ok(
      ids.some((id) => topicTitle(id).slice(1).includes(name) && !plain(id).slice(1).includes(name)),
      `${name} is not used by any topic`,
    );
  }
});
