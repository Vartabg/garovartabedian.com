import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import React, { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import ArtPlate from "../src/app/_components/ArtPlate";
import GalileeMap from "../src/app/jesus/life/GalileeMap";
import ProphecyRoom from "../src/app/jesus/prophecy/ProphecyRoom";
import WordsRoom from "../src/app/jesus/words/WordsRoom";
import type { Passage } from "../src/lib/jesus/client";
import type { Canons } from "../src/lib/scriptures/types";

const CANONS: Canons = {
  bookOrder: ["MAT", "MRK"],
  books: {
    MAT: { name: "Matthew", chapters: 2, trans: ["web"] },
    MRK: { name: "Mark", chapters: 1, trans: ["web"] },
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
      books: ["MAT", "MRK"],
      transPreference: ["web"],
    },
  ],
};

let dom: JSDOM;
let root: Root;

function installDom() {
  dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost/jesus",
  });
  const globals = {
    React,
    self: dom.window,
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
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
}

async function render(node: ReactNode) {
  await act(async () => root.render(node));
}

async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(installDom);
afterEach(async () => {
  await act(async () => root.unmount());
  dom.window.close();
});

describe("Jesus room interactions", () => {
  it("renders one chapter initially and lazy-loads a selected book", async () => {
    const requested: string[] = [];
    await render(
      <WordsRoom
        initialBook="MAT"
        initialVerses={{ "3:15": "Allow it now.", "4:4": "It is written." }}
        counts={{ MAT: 2, MRK: 1 }}
        canons={CANONS}
        originalEditions={{}}
        loadBookData={async (book) => {
          requested.push(book);
          return { "1:15": "The Kingdom of God is at hand." };
        }}
      />,
    );

    assert.equal(document.querySelectorAll("h2.jsu-chapter").length, 1);
    const bookSelect = document.querySelector<HTMLSelectElement>(".jsu-book-select select");
    const chapterSelect = document.querySelector<HTMLSelectElement>(".jsu-chapter-select select");
    assert.ok(bookSelect);
    assert.ok(chapterSelect);
    assert.equal(bookSelect.value, "MAT");
    assert.equal(chapterSelect.value, "3");
    await act(async () => {
      bookSelect.value = "MRK";
      bookSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.deepEqual(requested, ["MRK"]);
    assert.equal(bookSelect.value, "MRK");
    assert.equal(chapterSelect.value, "1");
    assert.equal(document.querySelector("h2.jsu-chapter")?.textContent, "Mark 1");
    assert.match(document.querySelector(".jsu-word-reader")?.textContent ?? "", /Kingdom of God is at hand/);
  });

  it("renders original-language toggle for verses and expands on click", async () => {
    await render(
      <WordsRoom
        initialBook="MAT"
        initialVerses={{ "3:15": "Allow it now." }}
        counts={{ MAT: 1 }}
        canons={CANONS}
        originalEditions={{ MAT: "sblgnt" }}
        loadBookData={async () => ({ "3:15": "Allow it now." })}
      />,
    );

    const toggle = [...document.querySelectorAll("button.orig-line-toggle")].find((btn) =>
      btn.textContent?.includes("Greek"),
    );
    assert.ok(toggle, "original-language toggle should exist with 'Greek' label");
    assert.equal(toggle.getAttribute("aria-expanded"), "false");
    await click(toggle);
    assert.equal(toggle.getAttribute("aria-expanded"), "true");
  });

  it("shows a recoverable prophecy error instead of an endless loading state", async () => {
    const pair = {
      id: "test-pair",
      theme: "Test",
      line: "A test connection",
      connection: "explicit" as const,
      prophecy: { ref: "MAT 1:1" },
      fulfillment: [{ ref: "MRK 1:1" }],
    };
    const loadPassage = async (): Promise<Passage | null> => {
      throw new Error("offline");
    };
    await render(
      <ProphecyRoom
        pairs={[pair]}
        canons={CANONS}
        originalEditions={{}}
        passageLoader={loadPassage}
      />,
    );

    const opener = [...document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("A test connection"),
    );
    assert.ok(opener);
    await click(opener);
    assert.match(document.body.textContent ?? "", /couldn.t load/i);
    assert.ok([...document.querySelectorAll("button")].some((button) => /try again/i.test(button.textContent ?? "")));
  });

  it("exposes the map as a described image with noninteractive place marks", async () => {
    await render(
      <GalileeMap
        active="jerusalem"
        activeEra="birth"
        activeStep={2}
        route={[
          { placeId: "nazareth", era: "birth" },
          { placeId: "bethlehem", era: "birth" },
          { placeId: "jerusalem", era: "birth" },
        ]}
      />,
    );

    const map = document.querySelector("svg.jsu-map");
    assert.equal(map?.getAttribute("role"), "img");
    assert.match(map?.getAttribute("aria-label") ?? "", /place selector/i);
    assert.equal(
      map?.querySelectorAll('[role="button"], [tabindex="0"]').length,
      0,
    );
    assert.ok((map?.querySelectorAll(".jsu-map-place").length ?? 0) >= 10);
    assert.equal(map?.querySelectorAll(".jsu-route").length, 2);
    assert.equal(map?.querySelectorAll(".jsu-route.is-travelled").length, 2);
    assert.equal(map?.querySelectorAll(".jsu-route.is-current").length, 1);
  });

  it("renders museum art immediately without a consent placeholder", async () => {
    // The file is this site's own; the museum is credited in the caption.
    const src = "/art/aic-36654.jpg";
    await render(
      <ArtPlate
        src={src}
        alt="Example artwork"
        title="Example"
        sub="Test culture · Test date"
        museum="Art Institute of Chicago"
        objectUrl="https://www.artic.edu/artworks/36654"
      />,
    );

    const image = document.querySelector<HTMLImageElement>(".artplate-frame img");
    // The optimizer serves it, and it serves it from here — the rendered src
    // carries this site's own path and no museum host.
    assert.match(image?.getAttribute("src") ?? "", /\/_next\/image\?url=%2Fart%2Faic-36654\.jpg/);
    assert.equal(document.querySelectorAll(".artplate-consent").length, 0);
  });
});
