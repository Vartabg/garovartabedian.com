import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CATENA_RECEPTION,
  getCatenaEntriesForVerse,
  getCatenaEntriesForBook,
  searchCatena,
  generateCatenaDossier,
} from "../src/lib/scriptures/catena";

describe("Computational Catena Aurea Engine", () => {
  it("contains source-attributed early Christian reception entries", () => {
    assert.ok(CATENA_RECEPTION.length >= 18);
    for (const entry of CATENA_RECEPTION) {
      assert.ok(entry.id);
      assert.ok(entry.scriptureRef);
      assert.ok(entry.book);
      assert.ok(entry.chapter >= 1);
      assert.ok(entry.verse >= 1);
      assert.ok(entry.father);
      assert.ok(entry.fatherRole);
      assert.ok(entry.workTitle);
      assert.ok(entry.workId);
      assert.ok(entry.section >= 1);
      assert.ok(entry.excerpt.length > 20);
      assert.ok(entry.theologicalTheme);
      assert.ok(entry.commentaryNote.length > 20);
      assert.ok(entry.href.startsWith("/early/"));
    }
  });

  it("retrieves patristic reception entries by verse reference", () => {
    const isaiahHits = getCatenaEntriesForVerse("ISA.53.5");
    assert.ok(isaiahHits.length >= 1);
    assert.equal(isaiahHits[0].father, "Clement of Rome");
    assert.equal(isaiahHits[0].workTitle, "1 Clement");
    assert.equal(isaiahHits[0].section, 16);

    const prayerHits = getCatenaEntriesForVerse("MAT.6.9");
    assert.ok(prayerHits.length >= 1);
    assert.equal(prayerHits[0].father, "The Didache");
  });

  it("retrieves patristic reception entries by biblical book", () => {
    const matthewHits = getCatenaEntriesForBook("MAT");
    assert.ok(matthewHits.length >= 3);
    assert.ok(matthewHits.some((e) => e.father === "The Didache"));
    assert.ok(matthewHits.some((e) => e.father === "Polycarp of Smyrna"));

    const genesisHits = getCatenaEntriesForBook("GEN");
    assert.ok(genesisHits.length >= 2);
  });

  it("searches catena reception by concept, father, and keyword", () => {
    const eucharistHits = searchCatena("Eucharist");
    assert.ok(eucharistHits.length >= 2);

    const clementHits = searchCatena("Clement of Rome");
    assert.ok(clementHits.length >= 6);

    const atonementHits = searchCatena("atonement");
    assert.ok(atonementHits.length >= 1);
  });

  it("generates a structured research dossier for NotebookLM", () => {
    const entries = getCatenaEntriesForVerse("ISA.53.5");
    const dossier = generateCatenaDossier({
      target: "Isaiah 53:5",
      entries,
    });

    assert.ok(dossier.includes("# Catena Aurea Research Dossier: Patristic Reception of Isaiah 53:5"));
    assert.ok(dossier.includes("NotebookLM"));
    assert.ok(dossier.includes("Clement of Rome"));
    assert.ok(dossier.includes("1 Clement"));
    assert.ok(dossier.includes("Theological Theme"));
    assert.ok(dossier.includes("Dialectical Inquiry Prompts"));
  });
});
