import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HEXAPLA_WITNESSES,
  HEXAPLA_PRESETS,
  alignPolyglotVerses,
  generateHexaplaDossier,
  type PolyglotAlignedVerse,
} from "../src/lib/scriptures/polyglot";
import type { OriginalChapter } from "../src/lib/scriptures/types";

describe("Polyglot & Hexapla Engine", () => {
  it("defines all 5 major witnesses", () => {
    assert.equal(Object.keys(HEXAPLA_WITNESSES).length, 5);
    assert.ok(HEXAPLA_WITNESSES.original);
    assert.ok(HEXAPLA_WITNESSES.brenton);
    assert.ok(HEXAPLA_WITNESSES.drb);
    assert.ok(HEXAPLA_WITNESSES.kjv);
    assert.ok(HEXAPLA_WITNESSES.web);
  });

  it("contains 10 landmark textual divergence presets", () => {
    assert.equal(HEXAPLA_PRESETS.length, 10);
    for (const preset of HEXAPLA_PRESETS) {
      assert.ok(preset.id);
      assert.ok(preset.book);
      assert.ok(preset.bookName);
      assert.ok(preset.chapter >= 1);
      assert.ok(preset.startVerse >= 1);
      assert.ok(preset.endVerse >= preset.startVerse);
      assert.ok(preset.title);
      assert.ok(preset.textualDivergence);
      assert.ok(preset.textualDivergence.readingDifferences.length >= 2);
    }
  });

  it("aligns verses correctly across witnesses within verse ranges", () => {
    const mockOriginal: OriginalChapter = {
      book: "GEN",
      bookName: "Genesis",
      chapter: 1,
      edition: "oshb",
      direction: "rtl",
      verses: [
        {
          number: 1,
          languages: ["hebrew"],
          words: [{ text: "בְּרֵאשִׁית", lemma: "7225", morph: "HR" }],
        },
        {
          number: 2,
          languages: ["hebrew"],
          words: [{ text: "וְהָאָרֶץ", lemma: "776", morph: "HC" }],
        },
      ],
    };

    const brenton = ["In the beginning God made the heaven and the earth.", "But the earth was unsightly..."];
    const drb = ["In the beginning God created heaven, and earth.", "And the earth was void and empty..."];
    const kjv = ["In the beginning God created the heaven and the earth.", "And the earth was without form..."];
    const web = ["In the beginning, God created the heavens and the earth.", "The earth was formless and empty..."];

    const aligned = alignPolyglotVerses({
      originalChapter: mockOriginal,
      brentonVerses: brenton,
      drbVerses: drb,
      kjvVerses: kjv,
      webVerses: web,
      startVerse: 1,
      endVerse: 2,
    });

    assert.equal(aligned.length, 2);
    assert.equal(aligned[0].number, 1);
    assert.equal(aligned[0].originalVerse?.words[0].text, "בְּרֵאשִׁית");
    assert.equal(aligned[0].brentonText, brenton[0]);
    assert.equal(aligned[0].drbText, drb[0]);
    assert.equal(aligned[0].kjvText, kjv[0]);
    assert.equal(aligned[0].webText, web[0]);

    assert.equal(aligned[1].number, 2);
    assert.equal(aligned[1].webText, web[1]);
  });

  it("attaches preset divergence notes when applicable", () => {
    const preset = HEXAPLA_PRESETS.find((p) => p.id === "genesis-1");
    assert.ok(preset);

    const aligned = alignPolyglotVerses({
      originalChapter: null,
      brentonVerses: ["v1", "v2"],
      drbVerses: ["v1", "v2"],
      kjvVerses: ["v1", "v2"],
      webVerses: ["v1", "v2"],
      startVerse: 1,
      endVerse: 2,
      presetDivergence: preset.textualDivergence,
    });

    assert.equal(aligned[0].divergence, undefined);
    assert.ok(aligned[1].divergence);
    assert.equal(aligned[1].divergence?.differences.length, 3);
  });

  it("generates a source-grounded NotebookLM research dossier", () => {
    const preset = HEXAPLA_PRESETS.find((p) => p.id === "genesis-1");
    assert.ok(preset);

    const verses: PolyglotAlignedVerse[] = [
      {
        number: 1,
        originalVerse: {
          number: 1,
          languages: ["hebrew"],
          words: [{ text: "בְּרֵאשִׁית", lemma: "7225", morph: "HR" }],
        },
        originalEdition: "oshb",
        originalDirection: "rtl",
        brentonText: "In the beginning...",
        drbText: "In the beginning...",
        kjvText: "In the beginning...",
        webText: "In the beginning...",
      },
    ];

    const dossier = generateHexaplaDossier({
      book: "GEN",
      bookName: "Genesis",
      chapter: 1,
      verses,
      preset,
    });

    assert.ok(dossier.includes("# Grounded Research Dossier: Genesis 1"));
    assert.ok(dossier.includes("NotebookLM"));
    assert.ok(dossier.includes("Curated Textual Comparison Notes"));
    assert.ok(dossier.includes("Comparative Multi-Witness Text"));
    assert.ok(dossier.includes("Brenton Septuagint, English translation (1851)"));
    assert.ok(dossier.includes("Douay-Rheims (Challoner revision; hosted 1899 edition)"));
    assert.doesNotMatch(dossier, /Grounded Truth Contract|Douay-Rheims Vulgate/i);
    assert.ok(dossier.includes("Dialectical Inquiry Prompts"));
  });
});
