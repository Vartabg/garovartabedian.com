import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import WordsRoom from "../src/app/jesus/words/WordsRoom";
import type { WordsBook } from "../src/lib/jesus/types";
import type { Canons } from "../src/lib/scriptures/types";

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
});
