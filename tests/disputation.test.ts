import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getAllDisputations,
  getDisputationById,
  searchDisputations,
  generateDisputationDossier,
  SACRED_DISPUTATIONS,
} from "../src/lib/scriptures/disputation";

describe("Polyphonic Sacred Disputation Engine", () => {
  it("contains all foundational scriptural and patristic disputations", () => {
    const disputations = getAllDisputations();
    assert.equal(disputations.length, SACRED_DISPUTATIONS.length);
    assert.ok(disputations.length >= 6);

    for (const d of disputations) {
      assert.ok(d.id);
      assert.ok(d.title);
      assert.ok(d.thematicCategory);
      assert.ok(d.theologicalQuestion);
      assert.ok(d.coreTension);
      assert.ok(d.summary.length > 50);
      assert.ok(d.voices.length >= 2);
      assert.ok(d.historicalSynthesis.title);
      assert.ok(d.historicalSynthesis.patristicAndClassicalView);
      assert.ok(d.historicalSynthesis.howTheCanonHoldsBoth);
      assert.ok(d.audioHostRolePrompt.host1Role);
      assert.ok(d.audioHostRolePrompt.host2Role);
      assert.ok(d.audioHostRolePrompt.inquiryFocus);

      for (const v of d.voices) {
        assert.ok(v.id);
        assert.ok(v.name);
        assert.ok(v.traditionOrAuthor);
        assert.ok(v.historicalPeriod);
        assert.ok(v.perspectiveBadge);
        assert.ok(v.coreThesis);
        assert.ok(v.scripturalWitnesses.length >= 1);
        assert.ok(v.pastoralContext);
      }
    }
  });

  it("retrieves disputations by ID", () => {
    const theodicy = getDisputationById("suffering-theodicy");
    assert.ok(theodicy);
    assert.equal(theodicy.thematicCategory, "theodicy");
    assert.ok(theodicy.voices.some((v) => v.id === "proverbs-traditional"));
    assert.ok(theodicy.voices.some((v) => v.id === "job-protest"));
    assert.ok(theodicy.voices.some((v) => v.id === "qoheleth-skeptic"));

    const soteriology = getDisputationById("faith-and-works");
    assert.ok(soteriology);
    assert.equal(soteriology.thematicCategory, "soteriology");
    assert.ok(soteriology.voices.some((v) => v.id === "paul-romans"));
    assert.ok(soteriology.voices.some((v) => v.id === "james-jerusalem"));
    assert.ok(soteriology.voices.some((v) => v.id === "clement-synthesis"));
  });

  it("searches disputations by theme, question, or speaker name", () => {
    const sufferingHits = searchDisputations("suffering");
    assert.ok(sufferingHits.length >= 1);
    assert.equal(sufferingHits[0].id, "suffering-theodicy");

    const paulHits = searchDisputations("Paul");
    assert.ok(paulHits.length >= 1);

    const christologyHits = searchDisputations("christology");
    assert.ok(christologyHits.length >= 1);
    assert.equal(christologyHits[0].id, "christology-paradox");
  });

  it("generates dialectical source dossiers for NotebookLM synthesis", () => {
    const d = SACRED_DISPUTATIONS[0];
    const md = generateDisputationDossier(d);

    assert.ok(md.includes("# Sacred Disputation:"));
    assert.ok(md.includes("## 1. Executive Theological Summary"));
    assert.ok(md.includes("## 2. Dialectical Voices in Direct Collation"));
    assert.ok(md.includes("## 3. Historical & Canonical Synthesis"));
    assert.ok(md.includes("## 4. NotebookLM Dialectical Audio Overview Prompt"));
    assert.ok(md.includes("Source note:"));
    assert.doesNotMatch(md, /100% public-domain|zero hallucination/i);
  });

  it("parses console disputation queries correctly", async () => {
    const { parseDisputationQuery } = await import("../src/lib/site/find-query");

    const generalHit = parseDisputationQuery("dispute");
    assert.ok(generalHit);
    assert.equal(generalHit.href, "/scriptures/disputation");
    assert.ok(generalHit.title.includes("Open The Polyphonic"));

    const targetedHit = parseDisputationQuery("dispute suffering");
    assert.ok(targetedHit);
    assert.equal(targetedHit.href, "/scriptures/disputation");
    assert.ok(targetedHit.title.includes("suffering"));

    const debateHit = parseDisputationQuery("debate faith");
    assert.ok(debateHit);
    assert.equal(debateHit.href, "/scriptures/disputation");
    assert.ok(debateHit.title.includes("faith"));

    const nonHit = parseDisputationQuery("unrelated query");
    assert.equal(nonHit, null);
  });
});
