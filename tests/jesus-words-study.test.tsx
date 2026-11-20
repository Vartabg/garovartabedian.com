import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import WordsRoom from "../src/app/jesus/words/WordsRoom";
import { sayingStudyLinks } from "../src/lib/jesus/saying-study-links";
import type { WordsBook } from "../src/lib/jesus/types";
import type { Canons } from "../src/lib/scriptures/types";

const STUDY_LINKS = sayingStudyLinks();

const CANONS: Canons = {
  bookOrder: ["MAT", "MRK", "LUK", "JHN"],
  books: {
    MAT: { name: "Matthew", chapters: 28, trans: ["web"] },
    MRK: { name: "Mark", chapters: 16, trans: ["web"] },
    LUK: { name: "Luke", chapters: 24, trans: ["web"] },
    JHN: { name: "John", chapters: 21, trans: ["web"] },
  },
  translations: {
    web: { name: "World English Bible", year: "2020", license: "Public domain" },
    kjv: { name: "King James Version", year: "1769", license: "Public domain" },
    drb: { name: "Douay-Rheims", year: "1899", license: "Public domain" },
    brenton: { name: "Brenton Septuagint", year: "1851", license: "Public domain" },
    charles: { name: "R. H. Charles translations", year: "1913", license: "Public domain" },
  },
  traditions: [
    {
      id: "protestant",
      name: "Protestant",
      blurb: "Test fixture",
      books: ["MAT", "MRK", "LUK", "JHN"],
      transPreference: ["web"],
    },
  ],
};

let dom: JSDOM;
let root: Root;

async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(() => {
  dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost/jesus/words",
  });
  const globals = {
    React,
    self: dom.window,
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    SVGElement: dom.window.SVGElement,
    HTMLDetailsElement: dom.window.HTMLDetailsElement,
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

describe("His Words study guide", () => {
  it("keeps deeper study optional, then reveals a sourced reading path", async () => {
    const requested: string[] = [];
    await act(async () => {
      root.render(
        <WordsRoom
          initialBook="MAT"
          initialVerses={{ "5:44": "Love your enemies, bless those who curse you." }}
          counts={{ MAT: 1, MRK: 1, LUK: 1, JHN: 1 }}
          canons={CANONS}
          originalEditions={{}}
          studyLinks={STUDY_LINKS}
      loadBookData={async (book): Promise<WordsBook> => {
            requested.push(book);
            return book === "JHN"
              ? { "8:58": "Before Abraham came into existence, I am." }
              : {};
          }}
        />,
      );
    });

    assert.match(document.body.textContent ?? "", /Love your enemies/);
    const guide = document.querySelector<HTMLDetailsElement>(".jsu-study-guide");
    assert.ok(guide);
    assert.equal(guide.open, false);
    assert.equal(document.querySelector(".jsu-study-body"), null);

    const summary = guide.querySelector("summary");
    assert.ok(summary);
    await click(summary);

    assert.match(document.body.textContent ?? "", /Choose a way in/);
    const identity = [...document.querySelectorAll("button")].find((button) =>
      /identity/i.test(button.textContent ?? ""),
    );
    assert.ok(identity);
    await click(identity);

    assert.match(document.body.textContent ?? "", /Before Abraham was/);
    assert.match(document.body.textContent ?? "", /In the scene/);
    assert.match(document.body.textContent ?? "", /Gospel parallels/);
    assert.match(document.body.textContent ?? "", /Scriptural roots/);
    assert.match(document.body.textContent ?? "", /Language lens/);

    const jump = [...document.querySelectorAll("button")].find((button) =>
      /read it in the red-letter text/i.test(button.textContent ?? ""),
    );
    assert.ok(jump);
    await click(jump);
    assert.deepEqual(requested, ["JHN"]);
    assert.match(document.body.textContent ?? "", /Before Abraham came into existence/);
    assert.match(document.querySelector(".scr-verse.is-study-target")?.textContent ?? "", /Before Abraham/);

    const contextLinks = [...document.querySelectorAll<HTMLAnchorElement>("a")].filter((link) =>
      /read .* in context/i.test(link.textContent ?? ""),
    );
    assert.ok(contextLinks.length >= 1);
    assert.ok(contextLinks.every((link) => link.getAttribute("href")?.startsWith("/scriptures/")));
    // The Greek lens opens this site's own hosted critical edition rather than
    // an outside lookup, at the verse the word actually occurs in.
    assert.ok(!document.querySelector('a[href*="stepbible.org"]'));
    const greek = [...document.querySelectorAll<HTMLAnchorElement>("a")].find((link) =>
      /open the greek at/i.test(link.textContent ?? ""),
    );
    assert.ok(greek, "the study should link into the hosted Greek");
    assert.match(greek.getAttribute("href") ?? "", /^\/scriptures\/[a-z-]+\/[A-Z0-9]{3}\/\d+\?o=1#v\d+$/);
  });

  it("opens a saying before the chapter list and keeps the deeper study closed", async () => {
    await act(async () => {
      root.render(
        <WordsRoom
          initialBook="MAT"
          initialVerses={{
            "3:15": "Allow it now.",
            "6:9": "Our Father in heaven, may your name be kept holy.",
          }}
          counts={{ MAT: 2 }}
          canons={CANONS}
          originalEditions={{}}
          studyLinks={STUDY_LINKS}
          loadBookData={async () => ({})}
        />,
      );
    });

    const door = document.querySelector("nav.jsu-word-door");
    assert.ok(door);
    for (const title of ["Teach us to pray", "Love your enemies", "The mustard seed", "Take up the cross", "Before Abraham was", "A new commandment"]) {
      assert.match(door.textContent ?? "", new RegExp(title));
    }
    assert.equal(document.querySelector(".jsu-study-guide")?.hasAttribute("open"), false);
    assert.equal(document.querySelector("h2.jsu-chapter")?.textContent, "Matthew 3");

    const prayer = [...door.querySelectorAll("button")].find((button) => button.textContent === "Teach us to pray");
    assert.ok(prayer);
    await click(prayer);

    const saying = document.querySelector(".jsu-word-door-saying");
    assert.match(saying?.textContent ?? "", /Our Father in heaven, may your name be kept holy/);
    const cite = saying?.querySelector("a");
    assert.equal(cite?.getAttribute("href"), "/scriptures/protestant/MAT/6#v9");
    assert.equal(cite?.textContent, "Matthew 6:9");
    assert.equal(window.location.search, "?study=lords-prayer");
    const picture = saying?.querySelector("img");
    assert.equal(picture?.getAttribute("src"), "/jesus/words/lords-prayer.jpg");
    assert.match(picture?.getAttribute("alt") ?? "", /Interpretive illustration\.$/);
    assert.match(saying?.textContent ?? "", /Our Father in heaven, may your name be kept holy/);
    assert.equal(document.querySelector("h2.jsu-chapter"), null);
    const readChapter = [...(saying?.querySelectorAll("button") ?? [])].find(
      (button) => button.textContent === "Read this chapter",
    );
    assert.ok(readChapter);
    await click(readChapter);
    assert.equal(
      document.querySelector<HTMLSelectElement>(".jsu-chapter-select select")?.value,
      "6",
    );
    assert.match(document.querySelector(".scr-verse.is-study-target")?.textContent ?? "", /Our Father in heaven/);
    assert.equal(document.querySelector(".jsu-study-body"), null);
  });

  it("opens the saying named in the address before any tap", async () => {
    await act(async () => {
      root.render(
        <WordsRoom
          initialBook="JHN"
          initialStudy="before-abraham"
          initialVerses={{
            "8:58": "Before Abraham came into existence, I am.",
          }}
          counts={{ JHN: 1 }}
          canons={CANONS}
          originalEditions={{}}
          studyLinks={STUDY_LINKS}
          loadBookData={async () => ({})}
        />,
      );
    });

    const saying = document.querySelector(".jsu-word-door-saying");
    assert.match(saying?.textContent ?? "", /before Abraham came into existence, I am/);
    assert.equal(saying?.querySelector("a")?.getAttribute("href"), "/scriptures/protestant/JHN/8#v58");
    assert.equal(document.querySelector("h2.jsu-chapter"), null);
    assert.equal(saying?.querySelector("button")?.textContent, "Read this chapter");
    assert.equal(document.querySelector<HTMLSelectElement>(".jsu-book-select select")?.value, "JHN");
    assert.equal(window.location.search, "");
  });
  it("shows the chosen saying's compare and words lines, and changes them with the saying", async () => {
    await act(async () => {
      root.render(
        <WordsRoom
          initialBook="MAT"
          initialVerses={{ "6:9": "Our Father in heaven, may your name be kept holy." }}
          counts={{ MAT: 1 }}
          canons={CANONS}
          originalEditions={{}}
          studyLinks={STUDY_LINKS}
          loadBookData={async () => ({})}
        />,
      );
    });

    const door = document.querySelector("nav.jsu-word-door");
    const choose = async (title: string) => {
      const button = [...(door?.querySelectorAll("button") ?? [])].find((item) => item.textContent === title);
      assert.ok(button, title);
      await click(button);
    };
    const lines = () =>
      [...document.querySelectorAll<HTMLAnchorElement>(".jsu-word-door-saying nav.passage-study a")].map((link) => ({
        href: link.getAttribute("href"),
        text: link.textContent,
      }));

    await choose("Teach us to pray");
    assert.deepEqual(lines(), [
      { href: STUDY_LINKS["lords-prayer"][0].href, text: "Compare translations of Matthew 6:9, with the Greek→" },
      { href: "/scriptures/protestant/MAT/6?t=web&study=word-bridge#v9", text: "See the Greek words behind Matthew 6:9→" },
    ]);
    assert.equal(document.querySelector(".jsu-word-door-saying nav.passage-study")?.getAttribute("aria-label"), "Study this verse");

    // The verse for this saying is not loaded in this fixture; the lines still show.
    await choose("Love your enemies");
    assert.deepEqual(
      lines().map((line) => line.href),
      [STUDY_LINKS["love-enemies"][0].href, "/scriptures/protestant/MAT/5?t=web&study=word-bridge#v44"],
    );
  });
});
