import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import React, { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import ChurchDiveList from "../src/app/church/ChurchDiveList";
import ChurchSectionNav from "../src/app/church/ChurchSectionNav";
import Tree from "../src/app/church/tree/Tree";
import { GIANT_PLATES, giantPlateFor } from "../src/lib/church/giant-plates";
import type { TreeData } from "../src/lib/church/types";

let dom: JSDOM;
let root: Root;
let observerCallback: IntersectionObserverCallback;

class TestIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];

  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }

  disconnect() {}
  observe() {}
  takeRecords() { return []; }
  unobserve() {}
}

const TREE: TreeData = {
  range: { start: 33, end: 2026 },
  branches: [
    { id: "one", name: "The one church", from: 33, parent: null, note: "The shared trunk." },
    { id: "east", name: "Church of the East", from: 431, parent: "one", note: "The eastern branch." },
  ],
};

function installDom() {
  dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost/church",
  });
  const globals = {
    React,
    self: dom.window,
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    HTMLDetailsElement: dom.window.HTMLDetailsElement,
    SVGElement: dom.window.SVGElement,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
    KeyboardEvent: dom.window.KeyboardEvent,
    IntersectionObserver: TestIntersectionObserver,
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

describe("Church room interactions", () => {
  it("maps exactly the six approved giants to accessible manuscript plates", () => {
    assert.deepEqual(Object.keys(GIANT_PLATES).sort(), [
      "aquinas",
      "athanasius",
      "augustine",
      "barth",
      "calvin",
      "luther",
    ]);

    for (const [id, plate] of Object.entries(GIANT_PLATES)) {
      assert.equal(plate.src, `/church/giants/${id}.jpg`);
      assert.match(plate.alt, /manuscript illustration/i);
      assert.match(plate.caption, /Interpretive manuscript illustration:/);
    }
  });

  it("keeps giants without an approved art brief text-only", () => {
    assert.equal(giantPlateFor("origen"), null);
    assert.equal(giantPlateFor("cyril-alexandria"), null);
    assert.equal(giantPlateFor("john-damascus"), null);
  });

  it("tracks the visible section in the persistent navigation", async () => {
    await render(
      <>
        <ChurchSectionNav
          label="Test sections"
          items={[{ id: "first", label: "First" }, { id: "second", label: "Second" }]}
        />
        <section id="first" />
        <section id="second" />
      </>,
    );

    const second = document.getElementById("second")!;
    await act(async () => {
      observerCallback(
        [{ isIntersecting: true, target: second, boundingClientRect: { top: 10 } } as unknown as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    const current = document.querySelector('a[href="#second"]');
    assert.equal(current?.getAttribute("aria-current"), "location");
    assert.match(document.querySelector(".ch-section-current")?.textContent ?? "", /Second/);
  });

  it("keeps the tree visual and opens a branch through its native selector", async () => {
    await render(<Tree data={TREE} />);

    assert.match(document.querySelector(".ch-tree-swipe")?.textContent ?? "", /Swipe horizontally/);
    const chart = document.querySelector(".ch-tree-viewport svg");
    assert.equal(chart?.getAttribute("role"), "img");
    assert.equal(chart?.querySelectorAll('[role="button"], [tabindex="0"]').length, 0);
    assert.equal(document.querySelectorAll(".ch-tree-table tbody tr").length, TREE.branches.length);
    assert.match(
      document.querySelector(".ch-tree-table tbody tr:nth-child(2)")?.textContent ?? "",
      /Church of the East.*AD 431.*The one church.*The eastern branch/,
    );

    const selector = document.querySelector<HTMLSelectElement>(
      ".ch-tree-picker select",
    );
    assert.ok(selector);
    await act(async () => {
      selector.value = "east";
      selector.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.ok(document.querySelector(".ch-tree")?.classList.contains("has-selection"));
    assert.equal(selector.value, "east");
    assert.match(document.body.textContent ?? "", /The eastern branch/);
  });

  it("opens a deep-linked record and lets the visitor control the whole list", async () => {
    window.history.replaceState(null, "", "#second");
    await render(
      <ChurchDiveList
        id="test-records"
        label="Test records"
        countLabel="Two records"
        description="Choose a depth."
      >
        <details id="first" data-church-dive>
          <summary>First</summary>
          First record
        </details>
        <details id="second" data-church-dive>
          <summary>Second</summary>
          Second record
        </details>
      </ChurchDiveList>,
    );

    const records = [...document.querySelectorAll<HTMLDetailsElement>("details")];
    assert.equal(records[0].open, false);
    assert.equal(records[1].open, true);

    const closeAll = [...document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Close all"),
    );
    assert.ok(closeAll);
    await click(closeAll);
    assert.ok(records.every((record) => !record.open));

    const openAll = [...document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Open all"),
    );
    assert.ok(openAll);
    await click(openAll);
    assert.ok(records.every((record) => record.open));
    assert.match(document.querySelector(".ch-dive-status")?.textContent ?? "", /Opened all/);
  });
});
