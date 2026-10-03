import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getAllDiachronicConcepts,
  getDiachronicConceptById,
  searchDiachronicConcepts,
  generateDiachronicDossier,
  DIACHRONIC_CONCEPTS,
} from "../src/lib/scriptures/diachronic";

describe("Diachronic Semantic Evolution Tracker", () => {
  it("contains comprehensive 1,500-year linguistic concepts", () => {
    const all = getAllDiachronicConcepts();
    assert.equal(all.length, DIACHRONIC_CONCEPTS.length);
    assert.ok(all.length >= 7);
    for (const concept of all) {
      assert.ok(concept.id);
      assert.ok(concept.title);
      assert.ok(concept.hebrewTerm);
      assert.ok(concept.greekTerm);
      assert.ok(concept.latinTerm);
      assert.ok(concept.coreParadox);
      assert.ok(concept.summary.length > 50);
      assert.ok(concept.whyItMatters.length > 20);
      assert.ok(concept.stages.length >= 2);
      assert.ok(concept.divergenceTraps.length >= 2);

      for (const stage of concept.stages) {
        assert.ok(stage.era);
        assert.ok(stage.century);
        assert.ok(stage.language);
        assert.ok(stage.term);
        assert.ok(stage.transliteration);
        assert.ok(stage.literalMeaning);
        assert.ok(stage.theologicalShift);
        assert.ok(stage.primaryWitnesses.length >= 1);
      }
    }
  });

  it("retrieves concepts by ID", () => {
    const ruach = getDiachronicConceptById("ruach-spirit");
    assert.ok(ruach);
    assert.equal(ruach.id, "ruach-spirit");
    assert.ok(ruach.hebrewTerm.includes("רוּחַ"));
    assert.ok(ruach.greekTerm.includes("πνεῦμα"));

    const sheol = getDiachronicConceptById("sheol-afterlife");
    assert.ok(sheol);
    assert.ok(sheol.hebrewTerm.includes("שְׁאוֹל"));
    assert.ok(sheol.greekTerm.includes("ᾅδης"));
  });

  it("searches concepts by English term, Greek/Hebrew term, or thematic shift", () => {
    const hitsPneuma = searchDiachronicConcepts("pneuma");
    assert.ok(hitsPneuma.length >= 1);
    assert.equal(hitsPneuma[0].id, "ruach-spirit");

    const hitsHades = searchDiachronicConcepts("Hades");
    assert.ok(hitsHades.length >= 1);
    assert.equal(hitsHades[0].id, "sheol-afterlife");

    const hitsRighteousness = searchDiachronicConcepts("righteousness");
    assert.ok(hitsRighteousness.length >= 1);
    assert.equal(hitsRighteousness[0].id, "tzedakah-righteousness");
  });

  it("generates complete source-attributed NotebookLM worksheets", () => {
    const concept = DIACHRONIC_CONCEPTS[0]; // Ruach
    const dossier = generateDiachronicDossier(concept);

    assert.ok(dossier.includes("# Diachronic Semantic Comparison:"));
    assert.ok(dossier.includes("## 1. The Core Semantic Question"));
    assert.ok(dossier.includes("## 2. Overview & Historical Significance"));
    assert.ok(dossier.includes("## 3. Selected Witnesses and Reception Stages"));
    assert.ok(dossier.includes("## 4. Interpretive Questions & Translation Checks"));
    assert.ok(dossier.includes("## 5. NotebookLM Dialectical Audio Overview Prompt"));
    assert.ok(dossier.includes("Host 1 compares the attested senses"));
    assert.ok(dossier.includes("Host 2 tests proposed Greek and Latin translation effects"));
    assert.ok(dossier.includes("Source note:"));
    assert.doesNotMatch(dossier, /100% public-domain|zero hallucination/i);
  });

  it("parses console diachronic queries correctly", async () => {
    const { parseDiachronicQuery } = await import("../src/lib/site/find-query");

    const generalHit = parseDiachronicQuery("diachronic");
    assert.ok(generalHit);
    assert.equal(generalHit.href, "/scriptures/diachronic");
    assert.ok(generalHit.title.includes("Open The Diachronic"));

    const targetedHit = parseDiachronicQuery("diachronic ruach");
    assert.ok(targetedHit);
    assert.equal(targetedHit.href, "/scriptures/diachronic");
    assert.ok(targetedHit.title.includes("ruach"));

    const evolutionHit = parseDiachronicQuery("evolution sheol");
    assert.ok(evolutionHit);
    assert.equal(evolutionHit.href, "/scriptures/diachronic");
    assert.ok(evolutionHit.title.includes("sheol"));

    const nonHit = parseDiachronicQuery("unrelated query");
    assert.equal(nonHit, null);
  });
});
