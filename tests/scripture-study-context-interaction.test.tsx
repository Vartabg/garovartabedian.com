import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import type { Root } from "react-dom/client";
import PolyglotClient from "../src/app/scriptures/polyglot/PolyglotClient";
import DossierClient from "../src/app/scriptures/dossier/DossierClient";
import { buildNotebookLMDossier } from "../src/lib/site/notebooklm";
import type { Canons } from "../src/lib/scriptures/types";
import { loadBook } from "../src/lib/scriptures/client";
import { parseStudyContext } from "../src/lib/scriptures/study-context";

const canons = JSON.parse(readFileSync("public/scriptures/canons.json", "utf8")) as Canons;
const initialDossier = buildNotebookLMDossier({ target: "Initial research", canons });
let dom: JSDOM, root: Root, unmounted: boolean;
const savedFetch = globalThis.fetch;
const descriptors = new Map<string, PropertyDescriptor | undefined>();
const deferred = () => { let resolve!: () => void; const promise = new Promise<void>((done) => { resolve = done; }); return { promise, resolve }; };
const gates = new Map<string, ReturnType<typeof deferred>>();
const requests: string[] = [];

beforeEach(async () => {
  dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://example.test/scriptures/dossier", pretendToBeVisual: true });
  for (const [key, value] of Object.entries({ React, window: dom.window, self: dom.window,
    document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, FormData: dom.window.FormData, IS_REACT_ACT_ENVIRONMENT: true })) {
    descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  gates.clear();
  requests.length = 0;
  globalThis.fetch = async (input) => {
    const url = String(input);
    requests.push(url);
    const book = /\/(?:text\/[^/]+|original)\/([A-Z0-9]+)(?:\.json|\/)/.exec(url)?.[1];
    if (book && gates.has(book)) await gates.get(book)!.promise;
    const file = `public${url}`;
    return new Response(existsSync(file) ? readFileSync(file, "utf8") : "{}", { status: existsSync(file) ? 200 : 404 });
  };
  unmounted = false;
  const { createRoot } = await import("react-dom/client");
  root = createRoot(dom.window.document.getElementById("root")!);
  await act(async () => root.render(<DossierClient canons={canons} initialDossier={initialDossier} initialTarget="Initial research" />));
});

afterEach(async () => {
  if (!unmounted) await act(async () => root.unmount());
  globalThis.fetch = savedFetch;
  for (const [key, descriptor] of descriptors) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  dom.window.close();
});

async function submit(value: string) {
  const input = dom.window.document.querySelector("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });
  await act(async () => { input.form!.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })); });
}

const settle = async () => { await act(async () => { await new Promise((done) => setTimeout(done, 20)); }); };

test("a slower earlier dossier cannot overwrite a later submitted passage", async () => {
  const slow = deferred(), fast = deferred();
  gates.set("GEN", slow); gates.set("JHN", fast);
  await submit("Genesis 1:1");
  await submit("John 1:1");
  fast.resolve(); await settle();
  assert.ok([...dom.window.document.querySelectorAll("h1,h2,h3")].some((heading) => heading.textContent === "John 1:1"));
  slow.resolve(); await settle();
  assert.ok([...dom.window.document.querySelectorAll("h1,h2,h3")].some((heading) => heading.textContent === "John 1:1"));
  assert.ok(![...dom.window.document.querySelectorAll("h1,h2,h3")].some((heading) => heading.textContent === "Genesis 1:1"));
});

test("unmounting invalidates pending dossier state updates without aborting shared loads", async () => {
  const slow = deferred(); gates.set("EXO", slow);
  let lateCollationReads = 0, watchLate = false;
  const watchedCanons = { ...canons, get books() {
    if (watchLate) lateCollationReads += 1;
    return canons.books;
  } };
  await act(async () => root.render(<DossierClient canons={watchedCanons} initialDossier={initialDossier} initialTarget="Initial research" />));
  await submit("John 1:1"); await settle();
  assert.ok([...dom.window.document.querySelectorAll("h1,h2,h3")].some((heading) => heading.textContent === "John 1:1"));
  await submit("Exodus 1:1");
  assert.ok(requests.includes("/scriptures/text/web/EXO.json"), "the pending passage request must have started");
  await act(async () => root.unmount()); unmounted = true; watchLate = true;
  slow.resolve(); await settle();
  assert.equal(lateCollationReads, 0, "a resolved load must not compile or set a dossier after leaving the page");
  assert.equal((await loadBook("web", "EXO")).book, "EXO");
  assert.equal(requests.filter((url) => url === "/scriptures/text/web/EXO.json").length, 1);
});


test("regenerating a historic Psalm keeps the selected edition's verse after canonical alignment", async () => {
  const context = parseStudyContext({ book: "PSA", chapter: "21", verse: "17", translation: "brenton" }).context!;
  const selected = (await loadBook("brenton", "PSA")).chapters[20][16];
  await act(async () => root.render(<DossierClient key="historic" canons={canons} initialDossier={initialDossier} initialTarget="Psalms 22:16" initialContext={context} />));
  await submit("Psalms 22:16"); await settle();
  const markdownTab = [...dom.window.document.querySelectorAll("button")].find((button) => button.textContent === "Raw Markdown (.md)")!;
  await act(async () => markdownTab.click());
  assert.ok(dom.window.document.querySelector("textarea")!.value.includes(selected), "regeneration must include the selected Brenton Psalm 21:17 text");
  assert.ok(!dom.window.document.querySelector('[role="status"]')?.textContent?.includes("Could not load"));
});


test("comparison controls retain the starting passage while replacing unverified selection notes", async () => {
  const context = parseStudyContext({ book: "JOL", chapter: "3", verse: "1", translation: "brenton" }).context!;
  await act(async () => root.render(<PolyglotClient key="polyglot" initialPreset={null} initialSelection={{ book: "JOL", chapter: 3 }} initialContext={context} initialSourceText="Starting Joel passage" initialAligned={[]} bookOrder={canons.bookOrder} booksMeta={canons.books} />));
  const changeChapter = async (chapter: string) => {
    const select = dom.window.document.querySelectorAll("select")[1];
    await act(async () => { select.value = chapter; select.dispatchEvent(new dom.window.Event("change", { bubbles: true })); });
    await settle();
  };
  await changeChapter("1");
  assert.match(dom.window.document.querySelector('[role="status"]')!.textContent!, /Joel 1:1.*Brenton/);
  assert.ok(requests.includes("/scriptures/text/brenton/JOL.json"));
  assert.ok(!requests.some((url) => /\/(?:original\/JOL|text\/web\/JOL)/.test(url)));
  const banner = dom.window.document.querySelector('aside[aria-label="Study passage"]')!;
  assert.match(banner.textContent!, /Starting Joel passage/);
  assert.match(banner.textContent!, /controls below show your current selection/);
  const preset = [...dom.window.document.querySelectorAll("button")].find((button) => button.textContent?.startsWith("Psalm 22:14"))!;
  await act(async () => preset.click()); await settle();
  assert.equal(dom.window.document.querySelectorAll("select")[0].value, "PSA");
  assert.equal(dom.window.document.querySelectorAll("select")[1].value, "22");
  assert.ok(!dom.window.document.querySelector('[role="status"]')?.textContent?.includes("Cross-edition correspondence"));
  await changeChapter("23");
  assert.match(dom.window.document.querySelector('[role="status"]')!.textContent!, /Brenton and Douay-Rheims are omitted/);
  assert.match(banner.querySelector('a[href*="dossier"]')!.getAttribute("href")!, /book=JOL.*chapter=3.*translation=brenton/);
});
