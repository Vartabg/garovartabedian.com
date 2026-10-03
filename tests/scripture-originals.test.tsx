import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OriginalVerseLine from "../src/app/scriptures/[tradition]/[book]/[chapter]/OriginalVerseLine";
import { describeOriginalWord } from "../src/lib/scriptures/morphology";
import { ORIGINAL_EDITION_DISPLAY } from "../src/lib/scriptures/original-editions";
import { hasOriginalChapter } from "../src/lib/scriptures/server";
import type {
  OriginalChapter,
  OriginalManifest,
} from "../src/lib/scriptures/types";

const readJson = <T,>(file: string): T => JSON.parse(readFileSync(file, "utf8")) as T;
const manifest = readJson<OriginalManifest>("public/scriptures/original/manifest.json");
const genesis = readJson<OriginalChapter>("public/scriptures/original/GEN/1.json");
const daniel = readJson<OriginalChapter>("public/scriptures/original/DAN/2.json");
const john = readJson<OriginalChapter>("public/scriptures/original/JHN/1.json");
const tobit = readJson<OriginalChapter>("public/scriptures/original/TOB/1.json");

describe("original-language corpus", () => {
  it("covers Hebrew, Greek New Testament, and LXX editions by lazy chapter", () => {
    assert.equal(Object.keys(manifest.books).length, 83);
    assert.equal(Object.values(manifest.chapterCounts).reduce((sum, count) => sum + count, 0), 1386);
    assert.equal(manifest.books.GEN, "oshb");
    assert.equal(manifest.books.REV, "sblgnt");
    assert.equal(manifest.books.TOB, "lxx");
    assert.equal(manifest.books.PS2, "lxx");
    assert.equal(manifest.books["2ES"], undefined);
    assert.equal(existsSync("public/scriptures/original/2ES"), false);
    assert.equal(manifest.chapterCounts.PSA, 150);
    assert.equal(manifest.chapterCounts.DAN, 12);

    for (const [book, chapterCount] of Object.entries(manifest.chapterCounts)) {
      assert.ok(existsSync(`public/scriptures/original/${book}/1.json`), `${book} chapter 1`);
      assert.ok(
        existsSync(`public/scriptures/original/${book}/${chapterCount}.json`),
        `${book} final chapter`,
      );
    }
  });

  it("only exposes LXX chapters when the hosted translation has identical verse numbering", () => {
    assert.deepEqual(manifest.readerTranslations, {
      "1MA": ["web", "brenton"],
      "2MA": ["web", "brenton"],
      "3MA": ["web", "brenton"],
      PS2: ["web"],
      MAN: ["web", "brenton"],
    });
    assert.equal(hasOriginalChapter("1MA", 1, "web"), true);
    assert.equal(hasOriginalChapter("1MA", 1, "brenton"), true);
    assert.equal(hasOriginalChapter("1MA", 1, "drb"), false);
    assert.equal(hasOriginalChapter("TOB", 1, "web"), false);
    assert.equal(hasOriginalChapter("2ES", 1, "web"), false);
  });

  it("identifies editions and licenses without calling any text an autograph", () => {
    assert.ok(
      manifest.generatedAt >= "2026-08-21",
      "the generated snapshot cannot predate the pinned lxx-morph revision",
    );
    assert.match(manifest.editions.oshb.description, /Westminster Leningrad Codex/);
    assert.equal(manifest.editions.oshb.textLicense, "Public domain");
    assert.equal(manifest.editions.oshb.dataLicense, "CC BY 4.0");
    assert.equal(manifest.editions.sblgnt.textLicense, "CC BY 4.0");
    assert.equal(manifest.editions.sblgnt.dataLicense, "CC BY-SA 3.0");
    assert.equal(manifest.editions.lxx.textLicense, "Public domain (Rahlfs 1935)");
    assert.equal(manifest.editions.lxx.dataLicense, "CC BY 4.0");
    assert.match(manifest.editions.lxx.description, /Rahlfs Septuagint/);
    assert.match(manifest.editions.lxx.description, /Eliran Wong/);
    assert.equal(manifest.editions.lxx.source, "https://git.sr.ht/~sethkush/lxx-morph");
    assert.match(manifest.editions.lxx.attribution, /Seth Kushniryk/);
    assert.doesNotMatch(manifest.editions.lxx.attribution, /Seth Krishnan/);
    assert.doesNotMatch(JSON.stringify(manifest), /authorial manuscript|autograph/i);
  });

  it("gives the LXX its own reader identity instead of labeling it SBLGNT", () => {
    assert.deepEqual(
      {
        language: ORIGINAL_EDITION_DISPLAY.lxx.language,
        short: ORIGINAL_EDITION_DISPLAY.lxx.short,
        name: ORIGINAL_EDITION_DISPLAY.lxx.name,
      },
      {
        language: "Septuagint Greek",
        short: "Rahlfs LXX + lxx-morph",
        name: "Rahlfs Septuagint (1935) + lxx-morph",
      },
    );
    assert.notEqual(
      ORIGINAL_EDITION_DISPLAY.lxx.short,
      ORIGINAL_EDITION_DISPLAY.sblgnt.short,
    );
  });

  it("preserves scripts, language changes, qere/ketiv, and English verse alignment", () => {
    assert.equal(genesis.direction, "rtl");
    assert.equal(genesis.verses[0].words[0].text, "בְּרֵאשִׁ֖ית");
    assert.deepEqual(daniel.verses.find((verse) => verse.number === 4)?.languages, [
      "hebrew",
      "aramaic",
    ]);
    assert.ok(
      daniel.verses.find((verse) => verse.number === 4)?.words.some((word) => word.ketiv),
    );
    assert.equal(john.direction, "ltr");
    assert.equal(john.verses[0].words[0].text, "Ἐν");

    const isaiah64 = readJson<OriginalChapter>("public/scriptures/original/ISA/64.json");
    const psalm13 = readJson<OriginalChapter>("public/scriptures/original/PSA/13.json");
    assert.equal(isaiah64.verses.find((verse) => verse.number === 1)?.words.length, 7);
    assert.equal(psalm13.verses.find((verse) => verse.number === 5)?.words.length, 6);
    assert.equal(psalm13.verses.find((verse) => verse.number === 6)?.words.length, 5);
  });

  it("decodes representative Hebrew, Aramaic, and Greek morphology", () => {
    const hebrew = describeOriginalWord(genesis.verses[0].words[0], "oshb");
    assert.equal(hebrew.language, "hebrew");
    assert.match(hebrew.segments.join(" "), /preposition/);
    assert.match(hebrew.segments.join(" "), /noun · common · feminine · singular · absolute/);

    const aramaicWord = daniel.verses
      .find((verse) => verse.number === 4)!
      .words.find((word) => word.morph.startsWith("AV"))!;
    const aramaic = describeOriginalWord(aramaicWord, "oshb");
    assert.equal(aramaic.language, "aramaic");
    assert.match(aramaic.segments.join(" "), /verb/);

    const greekWord = john.verses[0].words.find((word) => word.text === "ἦν")!;
    const greek = describeOriginalWord(greekWord, "sblgnt");
    assert.equal(greek.language, "greek");
    assert.match(greek.segments[0], /verb · third person · imperfect · active · indicative · singular/);

    const lxxNoun = describeOriginalWord(tobit.verses[0].words[0], "lxx");
    assert.equal(lxxNoun.language, "greek");
    assert.equal(lxxNoun.segments[0], "noun · feminine · nominative · singular");
    assert.deepEqual(
      {
        pos: tobit.verses[0].words[0].pos,
        confidence: tobit.verses[0].words[0].analysisConfidence,
        source: tobit.verses[0].words[0].analysisSource,
      },
      { pos: "noun", confidence: "medium", source: "augmented" },
    );

    const lxxVerbWord = tobit.verses
      .flatMap((verse) => verse.words)
      .find((word) => word.morph === "aor ind act 3rd sg");
    assert.ok(lxxVerbWord);
    const lxxVerb = describeOriginalWord(lxxVerbWord, "lxx");
    assert.equal(
      lxxVerb.segments[0],
      "verb · aorist · indicative · active · third person · singular",
    );

    const lxxMiddlePassiveWord = tobit.verses
      .flatMap((verse) => verse.words)
      .find((word) => word.morph === "imperf ind mid/pass 1st sg");
    assert.ok(lxxMiddlePassiveWord);
    const lxxMiddlePassive = describeOriginalWord(lxxMiddlePassiveWord, "lxx");
    assert.equal(
      lxxMiddlePassive.segments[0],
      "verb · imperfect · indicative · middle/passive · first person · singular",
    );
  });
});

let dom: JSDOM;
let root: Root;

beforeEach(() => {
  dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>");
  for (const [key, value] of Object.entries({
    React,
    self: dom.window,
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
  })) {
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

describe("original-language word inspector", () => {
  it("opens source-backed details from a keyboard-accessible word button", async () => {
    await act(async () => {
      root.render(<OriginalVerseLine chapter={genesis} verse={genesis.verses[0]} />);
    });
    const line = document.querySelector(".scr-original-line");
    assert.equal(line?.getAttribute("dir"), "rtl");
    assert.equal(line?.getAttribute("lang"), "he");

    const firstWord = document.querySelector<HTMLButtonElement>('.scr-original-token button');
    assert.ok(firstWord);
    await act(async () => {
      firstWord.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const inspector = document.querySelector(".scr-word-inspector");
    assert.ok(inspector);
    assert.match(inspector.textContent ?? "", /Lexical ID/);
    assert.match(inspector.textContent ?? "", /b\/7225/);
    assert.match(inspector.textContent ?? "", /preposition/);
    assert.equal(firstWord.getAttribute("aria-pressed"), "true");
    assert.match(inspector.querySelector("a")?.getAttribute("href") ?? "", /openscriptures/);
  });

  it("renders LXX lemmas, grammar, and the pinned edition's source identity", async () => {
    await act(async () => {
      root.render(<OriginalVerseLine chapter={tobit} verse={tobit.verses[0]} />);
    });
    const line = document.querySelector(".scr-original-line");
    assert.equal(line?.getAttribute("dir"), "ltr");
    assert.equal(line?.getAttribute("lang"), "grc");

    const firstWord = document.querySelector<HTMLButtonElement>('.scr-original-token button');
    assert.ok(firstWord);
    await act(async () => {
      firstWord.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const inspector = document.querySelector(".scr-word-inspector");
    assert.ok(inspector);
    assert.equal(inspector.querySelector("dt")?.textContent, "Lemma");
    assert.match(inspector.textContent ?? "", /βίβλος/);
    assert.match(inspector.textContent ?? "", /noun · feminine · nominative · singular/);
    assert.match(inspector.textContent ?? "", /Part of speechnoun/);
    assert.match(inspector.textContent ?? "", /Source analysis/);
    assert.match(inspector.textContent ?? "", /Confidence: Medium · Method: augmented/);
    assert.match(inspector.textContent ?? "", /Rahlfs Septuagint \(1935\) \+ lxx-morph/);
    assert.equal(
      inspector.querySelector("a")?.getAttribute("href"),
      ORIGINAL_EDITION_DISPLAY.lxx.href,
    );
  });
});
