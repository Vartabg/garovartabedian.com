import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import React, { act, type ReactNode } from "react";
import type { Root } from "react-dom/client";
import NotFoundScripture from "../src/app/_components/NotFoundScripture";
import TopicsRoom from "../src/app/scriptures/topics/TopicsRoom";
import { NOT_FOUND_SCRIPTURES } from "../src/lib/not-found-scriptures";
import type { NaveIndex } from "../src/lib/scriptures/types";

const TOPICS: NaveIndex = {
  topics: [
    { id: "FAITH", section: "F", refCount: 12 },
    { id: "FORGIVENESS", section: "F", refCount: 8 },
  ],
};

let dom: JSDOM;
let root: Root;

async function installDom() {
  dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost/scriptures/topics",
  });
  const globals = {
    React,
    self: dom.window,
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    HTMLInputElement: dom.window.HTMLInputElement,
    Event: dom.window.Event,
    InputEvent: dom.window.InputEvent,
    MouseEvent: dom.window.MouseEvent,
  };
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
    configurable: true,
    value: true,
  });
  const { createRoot } = await import("react-dom/client");
  root = createRoot(document.getElementById("root")!);
}

async function render(node: ReactNode) {
  await act(async () => root.render(node));
}

beforeEach(installDom);
afterEach(async () => {
  await act(async () => root.unmount());
  dom.window.close();
});

describe("site microcopy", () => {
  it("keeps every 404 quotation exact to the hosted WEB text", () => {
    for (const quote of NOT_FOUND_SCRIPTURES) {
      const url = new URL(quote.href, "https://garovartabedian.com");
      const [, scriptures, tradition, book, chapter] = url.pathname.split("/");
      assert.equal(scriptures, "scriptures");
      assert.equal(tradition, "protestant");

      const start = Number(url.hash.replace("#v", ""));
      const range = quote.reference.match(/:(\d+)(?:–(\d+))?$/);
      assert.ok(range, quote.reference);
      assert.equal(start, Number(range[1]), quote.reference);
      const end = Number(range[2] ?? range[1]);
      const source = JSON.parse(
        readFileSync(
          path.join(process.cwd(), "public", "scriptures", "text", "web", `${book}.json`),
          "utf8",
        ),
      ) as { chapters: string[][] };
      const sourceText = source.chapters[Number(chapter) - 1]
        .slice(start - 1, end)
        .join(" ");

      assert.equal(quote.text, sourceText, quote.reference);
    }
  });

  it("places Scripture on the 404 page and offers another verse", async () => {
    await render(<NotFoundScripture />);

    const quote = document.querySelector(".not-found-scripture blockquote");
    const citation = document.querySelector(".not-found-scripture cite");
    assert.ok(quote?.textContent);
    assert.match(document.body.textContent ?? "", /World English Bible/);
    assert.ok(citation?.textContent);
    const firstReference = citation.textContent;

    const another = [...document.querySelectorAll("button")].find(
      (button) => button.textContent === "Show another verse",
    );
    assert.ok(another);
    await act(async () => {
      another.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    assert.notEqual(citation.textContent, firstReference);
  });

  it("explains an empty topic search and lets the reader clear it", async () => {
    await render(<TopicsRoom data={TOPICS} />);

    const input = document.querySelector<HTMLInputElement>(".scr-topics-search");
    assert.ok(input);
    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        dom.window.HTMLInputElement.prototype,
        "value",
      )?.set;
      assert.ok(valueSetter);
      valueSetter.call(input, "mercy");
      input.dispatchEvent(new InputEvent("input", { bubbles: true, data: "mercy" }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    assert.match(document.body.textContent ?? "", /No topics match “mercy”/);
    assert.doesNotMatch(document.body.textContent ?? "", /Showing the first 400 matches/);
    const clear = [...document.querySelectorAll("button")].find(
      (button) => button.textContent === "Clear search",
    );
    assert.ok(clear);

    await act(async () => {
      clear.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    assert.equal(input.value, "");
    assert.doesNotMatch(document.body.textContent ?? "", /No topics match/);
  });
});
