import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildNotebookLMDossier,
  DOSSIER_PRESETS,
} from "../src/lib/site/notebooklm";

describe("Universal NotebookLM Research Dossier Engine", () => {
  it("provides curated landmark research presets", () => {
    assert.ok(DOSSIER_PRESETS.length >= 8);
    for (const preset of DOSSIER_PRESETS) {
      assert.ok(preset.id);
      assert.ok(preset.title);
      assert.ok(preset.category);
      assert.ok(preset.query);
      assert.ok(preset.description);
    }
  });

  it("builds a source-grounded dossier for a landmark textual divergence preset", () => {
    const dossier = buildNotebookLMDossier({
      target: "isaiah-53",
    });

    assert.ok(dossier.title.includes("Isaiah 53"));
    assert.equal(dossier.targetType, "preset");
    assert.ok(dossier.wordCount > 100);
    assert.ok(dossier.sourceWitnessCount >= 3);
    assert.ok(dossier.preset);

    // Markdown checks
    assert.ok(dossier.markdown.includes("# Grounded Research Dossier:"));
    assert.ok(dossier.markdown.includes("Critical Textual Divergence Apparatus"));
    assert.ok(dossier.markdown.includes("Dialectical Inquiry Prompts for NotebookLM Synthesis"));
    assert.ok(dossier.markdown.includes("Source note:"));
    assert.doesNotMatch(dossier.markdown, /100% public-domain|zero hallucination/i);

    // Audio Host prompt checks
    assert.ok(dossier.audioHostPrompt.includes("Historical and textual discussion"));
    assert.ok(dossier.audioHostPrompt.includes("Host 1 compares the named scriptural editions"));
    assert.ok(dossier.audioHostPrompt.includes("Host 2 examines the cited reception entries"));
  });

  it("builds a dossier for a patristic theological concept", () => {
    const dossier = buildNotebookLMDossier({
      target: "Eucharist",
    });

    assert.equal(dossier.title, "Eucharist");
    assert.equal(dossier.targetType, "topic");
    assert.ok(dossier.catenaEntries.length >= 2);
    assert.ok(dossier.sourceWitnessCount >= 2);

    // Checks that the reception index includes Didache or Ignatius
    assert.ok(dossier.markdown.includes("Source-Attributed Early Christian Reception"));
    assert.ok(
      dossier.markdown.includes("The Didache") || dossier.markdown.includes("Ignatius of Antioch"),
    );
    assert.ok(dossier.audioHostPrompt.includes("Distinguish source text from editorial notes"));
  });

  it("incorporates multi-witness scriptural verses into the generated dossier", () => {
    const dossier = buildNotebookLMDossier({
      target: "Psalm 22",
      primaryVerses: [
        {
          ref: "Psalm 22:16",
          original: "כָּאֲרִי יָדַי וְרַגְלָי",
          brenton: "ὤρυξαν χεῖράς μου καὶ πόδας μου",
          drb: "They have dug my hands and feet.",
          kjv: "They pierced my hands and my feet.",
          web: "They have pierced my hands and feet.",
        },
      ],
    });

    assert.ok(dossier.markdown.includes("## 3. Multi-Witness Scriptural Text"));
    assert.ok(dossier.markdown.includes("Psalm 22:16"));
    assert.ok(dossier.markdown.includes("כָּאֲרִי יָדַי וְרַגְלָי"));
    assert.ok(dossier.markdown.includes("ὤρυξαν χεῖράς μου καὶ πόδας μου"));
    assert.ok(dossier.markdown.includes("They have dug my hands and feet."));
    assert.ok(dossier.markdown.includes("They pierced my hands and my feet."));
  });

  it("parses console dossier commands correctly", async () => {
    const { parseDossierQuery } = await import("../src/lib/site/find-query");

    const generalHit = parseDossierQuery("dossier");
    assert.ok(generalHit);
    assert.equal(generalHit.href, "/scriptures/dossier");
    assert.ok(generalHit.title.includes("Open Universal"));

    const targetedHit = parseDossierQuery("dossier isaiah 53");
    assert.ok(targetedHit);
    assert.equal(
      targetedHit.href,
      "/jesus/dossier?preset=messianic-servant-isaiah53",
    );
    assert.ok(targetedHit.title.includes("isaiah 53"));

    const audioHit = parseDossierQuery("audio-prompt eucharist");
    assert.ok(audioHit);
    assert.equal(audioHit.href, "/scriptures/dossier");
    assert.ok(audioHit.title.includes("eucharist"));

    const nonHit = parseDossierQuery("something else");
    assert.equal(nonHit, null);
  });
});
