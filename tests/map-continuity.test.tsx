import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import React, { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import LifeMap from "../src/app/jesus/_components/life-lenses/LifeMap";
import RoadMap from "../src/app/early/ignatius/RoadMap";
import SendingMap from "../src/app/apostles/sent/SendingMap";
import CouncilMap from "../src/app/church/councils/CouncilMap";
import MapView from "../src/app/scriptures/_components/doorways/MapView";
import type { LifeLensesIndex } from "../src/lib/jesus/life-lenses";
import type { IgnatiusData } from "../src/lib/early/types";
import type { SentData } from "../src/lib/apostles/types";
import type { CouncilsData } from "../src/lib/church/types";
import type { DoorwaysData } from "../src/lib/scriptures/doorways";

function fixture<T>(path: string): T {
  return JSON.parse(readFileSync(new URL(`../public/${path}`, import.meta.url), "utf8")) as T;
}

const life = fixture<LifeLensesIndex>("jesus/life-lenses.json");
const ignatius = fixture<IgnatiusData>("early/ignatius.json");
const sending = fixture<SentData>("apostles/sent.json");
const councils = fixture<CouncilsData>("church/councils.json");

let dom: JSDOM;
let root: Root;

beforeEach(() => {
  dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "http://localhost/" });
  for (const [key, value] of Object.entries({
    React,
    self: dom.window,
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    SVGElement: dom.window.SVGElement,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
    IS_REACT_ACT_ENVIRONMENT: true,
    ResizeObserver: class {
      constructor(private callback: () => void) {}
      observe() { this.callback(); }
      disconnect() {}
    },
  })) {
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  Object.defineProperty(dom.window.HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 640 });
  root = createRoot(document.getElementById("root")!);
});

afterEach(async () => {
  await act(async () => root.unmount());
  dom.window.close();
});

async function choose(select: HTMLSelectElement, value: string) {
  await act(async () => {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("map selection and record continuity", () => {
  it("lets the native life-map picker reach a place and keeps its moments and pin selected together", async () => {
    function Harness() {
      const [at, setAt] = useState(-1);
      return <LifeMap data={life} at={at} onChoose={(id) => setAt(life.moments.findIndex((moment) => moment.id === id))} />;
    }
    await act(async () => root.render(<Harness />));
    const select = document.querySelector<HTMLSelectElement>(".map-picker select")!;
    const place = life.places.find((item) => life.moments.filter((moment) => moment.place === item.id).length > 1)!;
    const moments = life.moments.filter((moment) => moment.place === place.id);

    await choose(select, place.id);
    assert.equal(document.querySelector(".jl-here [aria-current='true']")?.textContent, moments[0].title);
    assert.match(document.querySelector("[role='status']")?.textContent ?? "", new RegExp(place.name));
    assert.equal(document.querySelector(".jl-place.is-here title")?.textContent, place.name);
    assert.equal(document.querySelectorAll(".jl-selected-ring").length, 1);

    await act(async () => {
      document.querySelector(".jl-place.is-here")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.equal(select.value, place.id);
    assert.equal(document.querySelector(".jl-here [aria-current='true']")?.textContent, moments[1].title);
  });

  it("offers all seven Ignatius letters, including letters from the same city, without dead-end place choices", async () => {
    function Harness() {
      const [active, setActive] = useState<string | null>(null);
      return <RoadMap data={ignatius} activeLetter={active} onSelect={setActive} />;
    }
    await act(async () => root.render(<Harness />));
    const select = document.querySelector<HTMLSelectElement>(".map-picker select")!;
    assert.deepEqual(Array.from(select.options).map((option) => option.value), ["", ...ignatius.letters.map((letter) => letter.textId)]);

    for (const letter of ignatius.letters) {
      await choose(select, letter.textId);
      assert.match(document.querySelector("[role='status']")?.textContent ?? "", new RegExp(letter.title));
      assert.equal(document.querySelectorAll(".ew-map-letter.active").length, 1);
      assert.equal(document.querySelectorAll(".ew-map-place.active").length, new Set([letter.writtenAt, letter.to]).size);
    }

    await choose(select, "");
    assert.equal(document.querySelectorAll(".ew-map-letter.active").length, 0);
    assert.match(document.querySelector("[role='status']")?.textContent ?? "", /Road overview/);
  });

  it("exposes sending-map records as named HTML links and preserves disputed-route labels", async () => {
    await act(async () => root.render(<SendingMap data={sending} />));
    const links = document.querySelectorAll<HTMLAnchorElement>("nav[aria-label='Apostles on the sending map'] a");
    assert.deepEqual(Array.from(links).map((link) => link.getAttribute("href")), sending.rays.map((ray) => `#sent-${ray.apostleId}`));
    for (const route of sending.routes.filter((item) => item.uncertain)) {
      const link = document.querySelector(`svg a[href='#sent-${route.apostleId}']`);
      assert.match(link?.getAttribute("aria-label") ?? "", /destination disputed/);
    }
    assert.equal(document.querySelector(".ap-smap svg")?.getAttribute("role"), "group");
  });

  it("keeps council-city HTML destinations aligned with the geographic pins and actual council records", async () => {
    await act(async () => root.render(<CouncilMap data={councils} />));
    const controls = Array.from(document.querySelectorAll<HTMLAnchorElement>("nav[aria-label='Council cities'] a"));
    const pins = Array.from(document.querySelectorAll<HTMLAnchorElement>(".ch-cmap svg a"));
    assert.equal(controls.length, 6);
    assert.deepEqual(controls.map((link) => link.getAttribute("href")), pins.map((link) => link.getAttribute("href")));
    for (const link of controls) {
      assert.ok(councils.councils.some((council) => link.getAttribute("href") === `#${council.id}`));
    }
  });

  it("lets the Scripture map jump directly to a book and reset from section zoom", async () => {
    const data: DoorwaysData = {
      schemaVersion: 1,
      traditions: [{ id: "protestant", name: "Protestant", books: ["GEN", "MAT"] }],
      translations: { web: "World English Bible" },
      books: {
        GEN: { name: "Genesis", translations: ["web"], verses: [31, 25] },
        MAT: { name: "Matthew", translations: ["web"], verses: [25] },
      },
    };
    function Harness() {
      const [book, setBook] = useState<string | null>(null);
      return <MapView data={data} tradition="protestant" translation="web" book={book} here={null} onChoose={setBook}
        hrefFor={(id, chapter) => `/scriptures/${id}/${chapter}`} prefetch={() => {}} go={() => {}} onFollow={() => {}} />;
    }
    await act(async () => root.render(<Harness />));
    const select = document.querySelector<HTMLSelectElement>(".map-picker select")!;
    await choose(select, "GEN");
    assert.match(document.querySelector("[role='status']")?.textContent ?? "", /Genesis · 2 chapters/);
    assert.equal(document.querySelectorAll("a.is-chapter").length, 2);

    await choose(select, "");
    const section = document.querySelector<HTMLButtonElement>(".dw-map-sec-h")!;
    await act(async () => section.click());
    assert.match(document.querySelector("[role='status']")?.textContent ?? "", /Law/);
    assert.equal(select.value, "section:law");
    await choose(select, "");
    assert.match(document.querySelector("[role='status']")?.textContent ?? "", /2 books/);
    assert.equal(document.querySelectorAll(".dw-map-sec-h").length, 2);
    await choose(select, "MAT");
    assert.match(document.querySelector("[role='status']")?.textContent ?? "", /Matthew/);
    assert.equal(document.querySelectorAll("a.is-chapter").length, 1);
  });
});
