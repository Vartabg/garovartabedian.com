import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import canonsData from "../public/scriptures/canons.json";
import {
  ANGELS_DOSSIER_PRESETS,
  buildAngelsNotebookLMDossier,
  findAngelsDossierPreset,
} from "../src/lib/angels/notebooklm";
import * as JesusDossiers from "../src/lib/jesus/notebooklm";
import type { Canons } from "../src/lib/scriptures/types";

type SourceEntryDossier = {
  markdown: string;
  preset?: { id: string };
  sourceEntryCount: number;
  targetType: "preset" | "passage" | "topic";
};

type JesusDossierModule = typeof JesusDossiers & {
  findJesusDossierPreset: (target: string) =>
    | (typeof JesusDossiers.JESUS_DOSSIER_PRESETS)[number]
    | undefined;
};

const canons = canonsData as Canons;
const jesusModule = JesusDossiers as unknown as JesusDossierModule;

const badGroundingClaims =
  /100% public[- ]domain|zero hallucination guarantee|every textual reading and ancient witness|verbatim extracts from first-to-fourth century/i;
const badEditionLabels =
  /\*\*Original Language \(OSHB\/SBLGNT\)\*\*|Latin Vulgate \(Douay-Rheims|Douay-Rheims 1609|Reformation Classic \(KJV 1611\)|Modern Critical \(WEB\)|Second Temple Translation \(Charles 1913\/1917\)/i;

function presetEntryCount(preset: {
  textualDivergence?: { readingDifferences: { witness: string }[] };
  ancientWitnesses: { source: string }[];
}): number {
  return new Set([
    ...(preset.textualDivergence?.readingDifferences.map(({ witness }) => witness) ?? []),
    ...preset.ancientWitnesses.map(({ source }) => source),
  ]).size;
}

describe("research dossier source boundaries", () => {
  it("resolves Angels preset ids, titles, and reader aliases without a default-on-empty match", () => {
    const aliases: Record<string, string> = {
      Mastema: "watchers-nephilim-enoch",
      "Yom Kippur": "azazel-scapegoat",
      "Daniel 10": "territorial-princes",
      Legion: "synoptic-exorcisms",
      malakh: "angel-of-the-lord",
      "Psalm 82": "divine-council-deut32",
      accuser: "adversary-evolution",
    };
    for (const [alias, id] of Object.entries(aliases)) {
      assert.equal(findAngelsDossierPreset(alias)?.id, id, alias);
    }
    assert.equal(
      findAngelsDossierPreset(ANGELS_DOSSIER_PRESETS[0].title)?.id,
      ANGELS_DOSSIER_PRESETS[0].id,
    );
    assert.equal(findAngelsDossierPreset("   "), undefined);
    assert.equal(findAngelsDossierPreset("unrelated research topic"), undefined);
  });

  it("resolves the matching Jesus dossier for common research aliases", () => {
    assert.equal(typeof jesusModule.findJesusDossierPreset, "function");
    const aliases: Record<string, string> = {
      Josephus: "testimonium-flavianum",
      "Isaiah 53": "messianic-servant-isaiah53",
      "synoptic problem": "synoptic-problem-q",
      resurrection: "resurrection-minimal-facts",
      "Son of Man": "son-of-man-daniel7",
      Tacitus: "roman-historians-tacitus-pliny",
      "seven sayings": "seven-sayings-cross",
      "temple cleansing": "temple-cleansing-sign",
    };
    for (const [alias, id] of Object.entries(aliases)) {
      assert.equal(jesusModule.findJesusDossierPreset(alias)?.id, id, alias);
    }
    assert.equal(jesusModule.findJesusDossierPreset("   "), undefined);
    assert.equal(jesusModule.findJesusDossierPreset("unrelated research topic"), undefined);
  });

  it("reports the named editions and notes actually present", () => {
    for (const preset of ANGELS_DOSSIER_PRESETS) {
      assert.equal(
        buildAngelsNotebookLMDossier({ target: preset.id }).sourceEntryCount,
        presetEntryCount(preset),
        preset.id,
      );
    }
    for (const preset of JesusDossiers.JESUS_DOSSIER_PRESETS) {
      const dossier = JesusDossiers.buildJesusNotebookLMDossier({
        target: preset.id,
      }) as unknown as SourceEntryDossier;
      assert.equal(dossier.sourceEntryCount, presetEntryCount(preset), preset.id);
    }

    const angelsPreset = findAngelsDossierPreset("Mastema")!;
    const angels = buildAngelsNotebookLMDossier({
      target: angelsPreset.id,
      primaryVerses: [{
        ref: "Genesis 6:1",
        original: "original",
        brenton: "brenton",
        drb: "douay",
        kjv: "king james",
        web: "web",
        charles: "charles",
      }],
    });
    assert.equal(angels.sourceEntryCount, presetEntryCount(angelsPreset) + 6);

    const jesusPreset = jesusModule.findJesusDossierPreset("resurrection")!;
    const jesus = JesusDossiers.buildJesusNotebookLMDossier({
      target: jesusPreset.id,
      primaryVerses: [{
        ref: "1 Corinthians 15:3",
        web: "web",
      }],
    }) as unknown as SourceEntryDossier;
    assert.equal(jesus.sourceEntryCount, presetEntryCount(jesusPreset) + 1);
  });

  it("does not count empty source values or imply that an unresolved passage loaded evidence", () => {
    const angels = buildAngelsNotebookLMDossier({
      target: "Genesis 1:1",
      canons,
      primaryVerses: [{ ref: "Genesis 1:1", original: "", web: "   " }],
    });
    assert.equal(angels.targetType, "passage");
    assert.equal(angels.sourceEntryCount, 0);
    assert.doesNotMatch(angels.markdown, /## 3\. Multi-Witness Ancient Texts/);
    assert.match(angels.markdown, /no hosted verse was loaded/i);

    const jesus = JesusDossiers.buildJesusNotebookLMDossier({
      target: "Genesis 1:1",
      canons,
      primaryVerses: [{ ref: "Genesis 1:1", original: "", web: "   " }],
    }) as unknown as SourceEntryDossier;
    assert.equal(jesus.targetType, "passage");
    assert.equal(jesus.sourceEntryCount, 0);
    assert.doesNotMatch(jesus.markdown, /## 3\. Multi-Witness Ancient Texts/);
    assert.match(jesus.markdown, /no hosted verse was loaded/i);
  });

  it("keeps absolute provenance promises and false edition labels out of exports", () => {
    const angels = buildAngelsNotebookLMDossier({
      target: "unresolved topic",
      primaryVerses: [{
        ref: "Jubilees 17:1",
        original: "original",
        drb: "douay",
        kjv: "king james",
        web: "web",
        charles: "charles",
      }, {
        ref: "1 Enoch 6:1",
        charles: "enoch charles",
      }],
    });
    const jesus = JesusDossiers.buildJesusNotebookLMDossier({
      target: "unresolved topic",
      primaryVerses: [{
        ref: "Reference",
        original: "original",
        drb: "douay",
        kjv: "king james",
        web: "web",
      }],
    });
    for (const markdown of [angels.markdown, jesus.markdown]) {
      assert.doesNotMatch(markdown, badGroundingClaims);
      assert.doesNotMatch(markdown, badEditionLabels);
      assert.match(markdown, /Original-language surface text/);
      assert.match(markdown, /Douay-Rheims \(Challoner revision; hosted 1899 edition\)/);
      assert.match(markdown, /King James Version \(1769 text\)/);
      assert.match(markdown, /World English Bible \(2020\)/);
    }
    assert.match(
      angels.markdown,
      /R\. H\. Charles, The Book of Jubilees \(1913 hosted wording\)/,
    );
    assert.match(
      angels.markdown,
      /R\. H\. Charles translation of 1 Enoch \(1913 hosted wording\)/,
    );

    for (const target of JesusDossiers.JESUS_DOSSIER_PRESETS.map(({ id }) => id)) {
      const presetMarkdown = JesusDossiers.buildJesusNotebookLMDossier({ target }).markdown;
      assert.doesNotMatch(presetMarkdown, badGroundingClaims, target);
    }
  });

  it("keeps the public dossier introductions free of absolute evidence promises", () => {
    for (const page of [
      "src/app/angels/dossier/page.tsx",
      "src/app/jesus/dossier/page.tsx",
    ]) {
      assert.doesNotMatch(readFileSync(page, "utf8"), badGroundingClaims, page);
    }
  });
});
