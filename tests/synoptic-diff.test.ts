import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  diffPericope,
  normalizeEnglish,
  normalizeGreek,
} from "../src/lib/jesus/synoptic-diff";
import { getSynopticPericopes } from "../src/lib/jesus/server";

describe("Synoptic Harmony & Pericope Diffing Engine", () => {
  it("loads all landmark pericopes with full canonical integrity", () => {
    const pericopes = getSynopticPericopes();
    assert.ok(pericopes.length >= 12, `Expected at least 12 pericopes, got ${pericopes.length}`);

    for (const p of pericopes) {
      assert.ok(p.id, "Pericope must have an id");
      assert.ok(p.title, `Pericope ${p.id} must have a title`);
      assert.ok(p.category, `Pericope ${p.id} must have a category`);
      assert.ok(p.synopsis, `Pericope ${p.id} must have a synopsis`);
      assert.ok(p.tradition, `Pericope ${p.id} must have a tradition`);

      const witnessKeys = Object.keys(p.witnesses);
      assert.ok(
        witnessKeys.length >= 2,
        `Pericope ${p.id} must have at least 2 witnesses, got ${witnessKeys.length}`,
      );

      for (const [code, w] of Object.entries(p.witnesses)) {
        assert.ok(w, `Witness ${code} must exist in ${p.id}`);
        assert.equal(w.book, code);
        assert.ok(w.verses.length > 0, `Witness ${code} in ${p.id} must have English verses`);
        assert.ok(
          w.greekVerses && w.greekVerses.length > 0,
          `Witness ${code} in ${p.id} must have Greek verses`,
        );
      }
    }
  });

  it("normalizes English tokens correctly", () => {
    assert.equal(normalizeEnglish("Kingdom!"), "kingdom");
    assert.equal(normalizeEnglish("“Blessed”"), "blessed");
    assert.equal(normalizeEnglish("heavens"), "heaven");
    assert.equal(normalizeEnglish("righteousness"), "righteousness");
  });

  it("normalizes Greek tokens and lemmas correctly", () => {
    assert.equal(normalizeGreek("Μακάριοι"), "μακαριοι");
    assert.equal(normalizeGreek("πτωχοὶ"), "πτωχοι");
    assert.equal(normalizeGreek("βασιλεία"), "βασιλεια");
  });

  it("computes Double Tradition (Q-Source) diffing for the Lord's Prayer", () => {
    const pericopes = getSynopticPericopes();
    const prayer = pericopes.find((p) => p.id === "lords-prayer");
    assert.ok(prayer, "Lord's Prayer pericope must exist");

    const result = diffPericope(prayer, "en", true);
    assert.equal(result.pericopeId, "lords-prayer");
    assert.ok(result.witnesses.MAT, "Matthew witness diff must exist");
    assert.ok(result.witnesses.LUK, "Luke witness diff must exist");

    // Both Matthew and Luke share key prayer stems
    const matTokens = result.witnesses.MAT.tokens;
    const lukTokens = result.witnesses.LUK.tokens;

    const matFather = matTokens.find((t) => t.stem === "father");
    assert.ok(matFather, "Matthew must have 'father'");
    assert.equal(matFather.classification, "all");

    const lukFather = lukTokens.find((t) => t.stem === "father");
    assert.ok(lukFather, "Luke must have 'father'");
    assert.equal(lukFather.classification, "all");

    // Matthew's unique petition: "debts", "debtors", "glory", "amen"
    const debtsToken = matTokens.find((t) => t.stem.startsWith("debt"));
    assert.ok(debtsToken, "Matthew must contain 'debts'");
    assert.equal(debtsToken.classification, "unique");

    // Overlap should be significant
    const matLukOverlap = result.pairwiseOverlap["MAT-LUK"];
    assert.ok(matLukOverlap > 0.25, `Expected MAT-LUK overlap > 0.25, got ${matLukOverlap}`);
  });

  it("detects Triple Tradition and Markan priority in Stilling the Storm", () => {
    const pericopes = getSynopticPericopes();
    const storm = pericopes.find((p) => p.id === "stilling-the-storm");
    assert.ok(storm, "Stilling the Storm pericope must exist");

    const result = diffPericope(storm, "en", true);
    assert.ok(result.witnesses.MAT);
    assert.ok(result.witnesses.MRK);
    assert.ok(result.witnesses.LUK);

    // Common words shared across all three
    assert.ok(result.sharedAllVocabulary.includes("boat"));
    assert.ok(result.sharedAllVocabulary.includes("wind"));

    // Matthew and Mark share "sea", while Luke uniquely writes "lake"
    const matSea = result.witnesses.MAT.tokens.find((t) => t.stem === "sea");
    assert.ok(matSea, "Matthew must have 'sea'");
    assert.equal(matSea.classification, "shared");

    const lukLake = result.witnesses.LUK.tokens.find((t) => t.stem === "lake");
    assert.ok(lukLake, "Luke must uniquely use 'lake'");
    assert.equal(lukLake.classification, "unique");

    // Mark's unique detail: "cushion"
    const mrkCushion = result.witnesses.MRK.tokens.find((t) => t.clean.toLowerCase() === "cushion");
    assert.ok(mrkCushion, "Mark must mention cushion");
    assert.equal(mrkCushion.classification, "unique");

    // Mark's unique detail: "stern"
    const mrkStern = result.witnesses.MRK.tokens.find((t) => t.clean.toLowerCase() === "stern");
    assert.ok(mrkStern, "Mark must mention stern");
    assert.equal(mrkStern.classification, "unique");
  });

  it("identifies verbatim copying runs in Healing of the Paralytic", () => {
    const pericopes = getSynopticPericopes();
    const paralytic = pericopes.find((p) => p.id === "healing-paralytic");
    assert.ok(paralytic, "Healing of the Paralytic pericope must exist");

    const result = diffPericope(paralytic, "en", false);
    const matResult = result.witnesses.MAT!;
    const mrkResult = result.witnesses.MRK!;
    const lukResult = result.witnesses.LUK!;

    // Verbatim run count should be high
    assert.ok(matResult.verbatimRunCount > 10, "Matthew should have substantial verbatim runs");
    assert.ok(mrkResult.verbatimRunCount > 10, "Mark should have substantial verbatim runs");
    assert.ok(lukResult.verbatimRunCount > 10, "Luke should have substantial verbatim runs");
  });

  it("diffs original Greek SBLGNT with lemma matching", () => {
    const pericopes = getSynopticPericopes();
    const beatitudes = pericopes.find((p) => p.id === "beatitudes");
    assert.ok(beatitudes, "Beatitudes must exist");

    const greekResult = diffPericope(beatitudes, "el", true);
    assert.equal(greekResult.language, "el");
    assert.ok(greekResult.witnesses.MAT);
    assert.ok(greekResult.witnesses.LUK);

    // Both Matthew and Luke use the Greek lemma μακάριος
    const matTokens = greekResult.witnesses.MAT.tokens;
    const lukTokens = greekResult.witnesses.LUK.tokens;

    const matMakarios = matTokens.find((t) => t.lemma === "μακάριος");
    assert.ok(matMakarios, "Matthew must have lemma μακάριος");
    assert.equal(matMakarios.classification, "all");

    const lukMakarios = lukTokens.find((t) => t.lemma === "μακάριος");
    assert.ok(lukMakarios, "Luke must have lemma μακάριος");
    assert.equal(lukMakarios.classification, "all");
  });

  it("handles Quadruple Attestation (All 4 Gospels) for Feeding of the 5,000", () => {
    const pericopes = getSynopticPericopes();
    const feeding = pericopes.find((p) => p.id === "feeding-5000");
    assert.ok(feeding, "Feeding 5000 must exist");

    const result = diffPericope(feeding, "en", true);
    assert.ok(result.witnesses.MAT, "Matthew present");
    assert.ok(result.witnesses.MRK, "Mark present");
    assert.ok(result.witnesses.LUK, "Luke present");
    assert.ok(result.witnesses.JHN, "John present");

    // All four agree on core miracle elements: five, loaves/bread/fish
    assert.ok(result.sharedAllVocabulary.includes("five"));
    assert.ok(
      result.sharedAllVocabulary.some((s) => ["loaves", "loaf", "bread", "fish"].includes(s)),
      "Expected shared loaves or fish in all four",
    );

    // John uniquely introduces Philip and Andrew
    const jhnPhilip = result.witnesses.JHN.tokens.find((t) => t.clean.toLowerCase() === "philip");
    assert.ok(jhnPhilip, "John must mention Philip");
    assert.equal(jhnPhilip.classification, "unique");
  });
});
