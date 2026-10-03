import assert from "node:assert/strict";
import test from "node:test";
import {
  prepareWordingQuery,
  prepareWordingText,
  wordingEvidence,
  wordingEvidencePrepared,
} from "../src/lib/scriptures/search-wording";

type ExpectedEvidence = {
  phrase: boolean;
  phraseForm: boolean;
  missingNegation: string[];
  proximity: number;
  words: string[];
};

// Fixed expectations were checked against the pre-cache implementation.
function expectEvidence(query: string, text: string, expected: ExpectedEvidence, contentWords: string[] = []) {
  const prepared = wordingEvidencePrepared(prepareWordingQuery(query), prepareWordingText(text), contentWords);
  assert.deepEqual({ ...prepared, words: [...prepared.words] }, expected);
  assert.deepEqual(wordingEvidence(query, text, contentWords), prepared);
}

test("prepared evidence preserves Unicode normalization, numbers, and repeated phrase words", () => {
  expectEvidence("CAFÉ שלום 7 7", "cafe\u0301 — שלום 7 7.", {
    phrase: true, phraseForm: false, missingNegation: [], proximity: 1,
    words: ["cafe", "שלום", "7"],
  }, ["cafe", "שלום", "7"]);
  expectEvidence("holy holy", "holy", {
    phrase: false, phraseForm: false, missingNegation: [], proximity: 0, words: ["holy"],
  });
  expectEvidence("holy holy", "HOLY—holy.", {
    phrase: true, phraseForm: false, missingNegation: [], proximity: 0, words: ["holy"],
  });
  expectEvidence("seven 7", "Seven 8.", {
    phrase: false, phraseForm: false, missingNegation: [], proximity: 0, words: ["seven", "8"],
  });
  expectEvidence("Αγάπη", "ἀγάπη", {
    phrase: false, phraseForm: false, missingNegation: [], proximity: 0, words: ["αγαπη"],
  });
});

test("a single contraction can become an expanded phrase while a literal single word cannot", () => {
  expectEvidence("can't", "can not", {
    phrase: false, phraseForm: true, missingNegation: [], proximity: 0, words: ["can", "not"],
  });
  expectEvidence("can't", "can't", {
    phrase: false, phraseForm: true, missingNegation: [], proximity: 0, words: ["cant"],
  });
  expectEvidence("afraid", "afraid", {
    phrase: false, phraseForm: false, missingNegation: [], proximity: 0, words: ["afraid"],
  });
  expectEvidence("do not be afraid", "Don't be afraid.", {
    phrase: false, phraseForm: true, missingNegation: [], proximity: 0,
    words: ["dont", "be", "afraid"],
  });
});

test("missing negation retains query order and deduplication rather than treating all negatives alike", () => {
  expectEvidence("Never, never not without can't", "Never fear.", {
    phrase: false, phraseForm: false, missingNegation: ["not", "without", "cant"], proximity: 0,
    words: ["never", "fear"],
  });
  expectEvidence("never without fear", "Not without fear.", {
    phrase: false, phraseForm: false, missingNegation: ["never"], proximity: 0,
    words: ["not", "without", "fear"],
  });
});

test("prepared proximity keeps ordered occurrences and the caller's content-word sequence", () => {
  expectEvidence("light world", "World; light x world and light world.", {
    phrase: true, phraseForm: false, missingNegation: [], proximity: 1,
    words: ["world", "light", "x", "and"],
  }, ["light", "world"]);
  expectEvidence("light world", "World before light", {
    phrase: false, phraseForm: false, missingNegation: [], proximity: 0,
    words: ["world", "before", "light"],
  }, ["light", "world"]);
  expectEvidence("light of the world", "LIGHT—of, the world!", {
    phrase: true, phraseForm: false, missingNegation: [], proximity: 0.5,
    words: ["light", "of", "the", "world"],
  }, ["light", "world"]);
});

test("empty wording and token substrings never become phrases", () => {
  expectEvidence("", "", {
    phrase: false, phraseForm: false, missingNegation: [], proximity: 0, words: [],
  });
  expectEvidence("light world", "Delight in worldly things.", {
    phrase: false, phraseForm: false, missingNegation: [], proximity: 0,
    words: ["delight", "in", "worldly", "things"],
  });
});

test("prepared query and source text can be reused independently without carrying evidence between calls", () => {
  const query = prepareWordingQuery("light of the world");
  const text = prepareWordingText("Light of the world.");
  assert.equal(wordingEvidencePrepared(query, text).phrase, true);
  assert.equal(wordingEvidencePrepared(query, prepareWordingText("The world lacks light.")).phrase, false);
  assert.equal(wordingEvidencePrepared(prepareWordingQuery("light light"), text).phrase, false);
  assert.equal(wordingEvidencePrepared(query, text).phrase, true);
});

test("mutating returned word Sets or negatives does not poison prepared cache entries", () => {
  const query = prepareWordingQuery("not light");
  const text = prepareWordingText("Light alone.");
  const first = wordingEvidencePrepared(query, text);
  first.words.clear();
  first.words.add("invented");
  first.missingNegation.push("invented");
  const next = wordingEvidencePrepared(query, text);
  assert.deepEqual([...next.words], ["light", "alone"]);
  assert.deepEqual(next.missingNegation, ["not"]);
  assert.notEqual(next.words, first.words);
  const compatible = wordingEvidence("not light", "Light alone.");
  assert.ok(compatible.words instanceof Set);
  assert.deepEqual(compatible, next);
});
