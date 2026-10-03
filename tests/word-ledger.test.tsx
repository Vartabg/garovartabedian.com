import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import casesJson from "../public/word/cases.json";
import ledgerJson from "../public/word/ledger.json";
import WordLedger from "../src/app/word/WordLedger";
import { getFreeChain, getWordData } from "../src/lib/public-json";
import { CORPUS_HEALTH } from "../src/lib/site/corpus-health";
import { getWordEntry, searchWordEntries } from "../src/lib/word/search";
import type { CasesData, WordLedger as WordLedgerData } from "../src/lib/word/types";

const ledger = ledgerJson as WordLedgerData;

describe("Who Owns the Word ledger", () => {
  it("keeps records, provenance sources, and research-queue boundaries explicit", () => {
    assert.ok(ledger.entries.length >= 15);
    assert.ok(ledger.entries.every((entry) => entry.timeline.length > 0));

    // The queue may hold unfinished records, but never an anonymous "TBD" slot:
    // each one names a real translation, is dated, and makes no claim.
    for (const entry of ledger.entries.filter((item) => item.status === "placeholder")) {
      assert.equal(entry.category, "placeholder", `${entry.id} queue entries stay in the queue category`);
      assert.notEqual(entry.abbr, "TBD", `${entry.id} must name a translation`);
      assert.doesNotMatch(entry.name, /^next /i, `${entry.id} must name a translation`);
      assert.equal(entry.owner, "Not yet checked");
      assert.match(entry.summary, /No ownership or permission claim is made/);
      for (const event of entry.timeline) {
        assert.equal(event.status, "placeholder", `${event.id} cannot claim a checked source`);
        assert.match(event.year, /^\d{4}$/, `${event.id} must be dated`);
        assert.ok(event.note.length > 60, `${event.id} must say what still needs checking`);
      }
    }
    for (const entry of ledger.entries.filter((item) => item.status === "researched")) {
      assert.notEqual(entry.category, "placeholder", `${entry.id} researched records leave the queue`);
      assert.ok(
        entry.timeline.every((event) => event.status === "researched"),
        `${entry.id} researched records carry only checked provenance`,
      );
    }

    const sourceIds = new Set(ledger.sources.map((source) => source.id));
    for (const source of ledger.sources) {
      if (source.status === "placeholder") {
        assert.match(source.href, /^\//, `${source.id} should stay an internal placeholder`);
      } else {
        assert.match(source.href, /^https:\/\//, `${source.id} should use HTTPS`);
      }
    }
    for (const entry of ledger.entries) {
      assert.ok(entry.abbr.length > 0, `${entry.id} needs an abbreviation`);
      assert.ok(entry.owner.length > 0, `${entry.id} needs an owner posture`);
      for (const sourceId of entry.sourceIds) {
        assert.ok(sourceIds.has(sourceId), `${entry.id} references missing source ${sourceId}`);
      }
      for (const event of entry.timeline) {
        assert.ok(event.note.length > 20, `${event.id} needs a provenance note`);
        for (const sourceId of event.sourceIds) {
          assert.ok(sourceIds.has(sourceId), `${event.id} references missing source ${sourceId}`);
        }
      }
    }
  });

  it("records every text the Scripture reader hosts", () => {
    const data = getWordData();
    const hostedIds = CORPUS_HEALTH.corpus.translations.ids;

    assert.equal(data.hosted.count, hostedIds.length);
    assert.equal(data.free.filter((entry) => entry.onSite).length, hostedIds.length);
    for (const id of hostedIds) {
      const matches = data.free.filter((entry) => (entry.readerId ?? entry.id) === id);
      assert.equal(matches.length, 1, `hosted text ${id} needs exactly one free-translation card`);
      assert.equal(matches[0].onSite, true);
      const record = getWordEntry(ledger.entries, matches[0].id);
      assert.equal(record?.status, "researched", `hosted text ${id} needs a checked ledger record`);
    }
  });

  it("draws every translation card on the fences chart from its own record", () => {
    const data = getWordData();
    const NOW = new Date().getFullYear();
    for (const card of [...data.fenced, ...data.free]) {
      assert.ok(Number.isInteger(card.life.pub), `${card.id} needs a publication year`);
      assert.ok(Number.isInteger(card.life.free), `${card.id} needs a free-from year`);
      assert.ok(card.life.free >= card.life.pub, `${card.id} cannot be free before it was published`);
      assert.ok(card.life.note.length > 0, `${card.id} needs a chart note`);
    }
    for (const card of data.fenced) {
      assert.equal(card.life.pub, card.year, `${card.id} chart year must match the card's copyright year`);
      assert.ok(card.life.free > NOW, `${card.id} is on the fenced side, so its fence must still stand`);
      assert.equal(getWordEntry(ledger.entries, card.id)?.category, "fenced", `${card.id} needs a fenced ledger record`);
    }
    for (const card of data.free) {
      assert.ok(card.life.free <= NOW, `${card.id} is on the free side, so it must already be free`);
      assert.equal(getWordEntry(ledger.entries, card.id)?.category, "free", `${card.id} needs a free ledger record`);
    }
  });

  it("traces every hosted text from source file to license to reader", () => {
    const chain = getFreeChain();
    const hostedIds = [...CORPUS_HEALTH.corpus.translations.ids].sort();
    assert.deepEqual(chain.texts.map((text) => text.id).sort(), hostedIds);
    assert.equal(chain.hosted.count, hostedIds.length);

    const cards = getWordData().free;
    for (const text of chain.texts) {
      assert.ok(text.sources.length >= 1, `${text.id} needs the file it was ingested from`);
      for (const source of text.sources) assert.match(source.href, /^https:\/\//, `${text.id} source must be a live https link`);
      assert.match(text.license.href, /^https:\/\//, `${text.id} rights record must be a live https link`);
      assert.match(text.sample.href, /^\/scriptures\//, `${text.id} must link into the reader`);
      assert.ok(text.books > 0 && text.chapters > 0, `${text.id} must host at least one chapter`);
      assert.ok(
        text.shelves.length + text.alternateShelves.length >= 1,
        `${text.id} must be the default or an alternate on at least one shelf`,
      );
      assert.ok(text.processing.length > 40, `${text.id} must say what the processing did`);

      const record = getWordEntry(ledger.entries, text.recordId);
      assert.equal(record?.category, "free", `${text.id} needs a free ledger record`);
      assert.equal(record?.status, "researched", `${text.id} needs a checked ledger record`);
      assert.equal(cards.find((card) => card.id === text.recordId)?.onSite, true, `${text.id} card must be marked hosted`);
    }
    for (const item of chain.apparatus) {
      assert.ok(item.links.length >= 1, `${item.id} needs a source or license link`);
      for (const link of item.links) assert.match(link.href, /^(https:\/\/|\/)/, `${item.id} links must be https or internal`);
    }
    assert.ok(chain.stats.crossReferenceTargets > 0);
    assert.ok(chain.stats.narrationChapters > 0);
  });

  it("cites every rights holder the AI-era case describes, with the date the pages were read", () => {
    const aiCase = (casesJson as CasesData).cases.find((item) => item.id === "ai-era");
    assert.ok(aiCase, "the AI-era case must exist");
    assert.ok(aiCase.sources && aiCase.sources.length >= 3, "the AI-era case needs one source per rights holder");
    for (const source of aiCase.sources) assert.match(source.url, /^https:\/\//, `${source.label} must be a live https link`);
    for (const host of ["lockman.org", "biblica.com", "crossway.org"]) {
      assert.ok(aiCase.sources.some((source) => source.url.includes(host)), `${host} must be cited`);
    }
    assert.match(aiCase.checked ?? "", /^\d{4}-\d{2}-\d{2}$/, "the AI-era case must say when its pages were read");
  });

  it("ranks exact abbreviations and owner matches before broad policy matches", () => {
    assert.equal(searchWordEntries(ledger.entries, "NIV")[0]?.id, "niv");
    assert.equal(searchWordEntries(ledger.entries, "Biblica")[0]?.id, "niv");
    assert.deepEqual(
      searchWordEntries(ledger.entries, "").map((entry) => entry.id),
      ledger.entries.map((entry) => entry.id),
    );
    assert.equal(getWordEntry(ledger.entries, "missing"), undefined);
  });
});

let dom: JSDOM;
let root: Root;

async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(() => {
  dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost/word",
  });
  const globals = {
    React,
    self: dom.window,
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    HTMLHeadingElement: dom.window.HTMLHeadingElement,
    SVGElement: dom.window.SVGElement,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
  };
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
    configurable: true,
    value: true,
  });
  root = createRoot(document.getElementById("root")!);
});

afterEach(async () => {
  await act(async () => root.unmount());
  dom.window.close();
});

describe("WordLedger interaction", () => {
  it("switches detail records and keeps the source trail visible", async () => {
    await act(async () => root.render(<WordLedger ledger={ledger} />));

    assert.match(document.body.textContent ?? "", /New International Version/);
    const esv = [...document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("ESV"),
    );
    assert.ok(esv);
    await click(esv);

    assert.match(document.body.textContent ?? "", /English Standard Version/);
    assert.match(document.body.textContent ?? "", /Crossway/);
    assert.ok(document.querySelector(".word-timeline"));
    assert.ok(document.querySelector(".word-source-card"));
    assert.equal(window.location.hash, "#word-entry-esv");
  });

  it("renders a queued record as labeled, dated, and non-claiming", async () => {
    await act(async () => root.render(<WordLedger ledger={ledger} />));
    const queued = [...document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("NJB"),
    );
    assert.ok(queued);
    await click(queued);

    const text = document.body.textContent ?? "";
    assert.match(text, /Research queue/);
    assert.match(text, /Not yet verified/);
    assert.match(text, /Not yet checked/);
    assert.match(text, /No ownership or permission claim is made/);
    assert.match(text, /Queued for the next pass/);
    assert.doesNotMatch(text, /TBD/);
  });
});
