import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { JSDOM } from "jsdom";
import React, { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import SaveOffline from "../src/app/scriptures/[tradition]/[book]/[chapter]/SaveOffline";
import { OFFLINE_READER_URL } from "../src/lib/scriptures/offline";

let dom: JSDOM;
let root: Root;
const origin = "https://www.garovartabedian.com";
type Transition = Pick<ViewTransition, "ready" | "skipTransition">;

beforeEach(async () => {
  dom = new JSDOM("<div id='root'></div>", {
    url: `${origin}/scriptures/protestant/JHN/3`,
  });
  for (const [key, value] of Object.entries({
    React,
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  root = createRoot(document.getElementById("root")!);
  await act(async () => root.render(
    <StrictMode>
      <SaveOffline
        bookId="JHN" bookName="John" chapter={3} translation="web"
        translationName="World English Bible" license="Public domain"
        sourcePath="/scriptures/text/web/JHN.json" verses={["Chapter text"]}
      />
    </StrictMode>,
  ));
});

afterEach(async () => {
  await act(async () => root.unmount());
  dom.window.close();
});

function dispatchSwap(destination: string | null, transition: Transition | null) {
  // jsdom has no native PageSwapEvent; supply the browser event's two fields.
  const event = new dom.window.Event("pageswap", { cancelable: true });
  Object.defineProperties(event, {
    activation: { value: destination ? { entry: { url: destination } } : null },
    viewTransition: { value: transition },
  });
  window.dispatchEvent(event);
  assert.equal(event.defaultPrevented, false, "navigation must remain native");
}

test("offline reader transitions are skipped with ready rejection handled first", async (t) => {
  for (const suffix of ["", "?chapter=JHN-3#reading"]) {
    let rejectReady!: (reason: unknown) => void;
    const ready = new Promise<void>((_, reject) => { rejectReady = reject; });
    const catchReady = t.mock.method(ready, "catch");
    const skipTransition = t.mock.fn(() => {
      assert.equal(catchReady.mock.callCount(), 1, "subscribe before skipping");
      rejectReady(new dom.window.DOMException("Transition was skipped", "AbortError"));
    });

    dispatchSwap(`${origin}${OFFLINE_READER_URL}${suffix}`, { ready, skipTransition });
    assert.equal(skipTransition.mock.callCount(), 1, "StrictMode must not leave duplicate listeners");
    await setImmediate();
    const handledReady = catchReady.mock.calls[0].result;
    assert.ok(handledReady);
    await assert.doesNotReject(handledReady);
  }

  const link = document.querySelector<HTMLAnchorElement>("a")!;
  assert.equal(link.getAttribute("href"), OFFLINE_READER_URL);
  assert.equal(link.getAttribute("target"), null);
});

test("other pages and external reader URLs keep their transitions", (t) => {
  for (const destination of [
    `${origin}/scriptures`,
    `${origin}${OFFLINE_READER_URL}-other`,
    `https://example.com${OFFLINE_READER_URL}`,
    `https://www.garovartabedian.com:444${OFFLINE_READER_URL}`,
  ]) {
    const ready = Promise.resolve();
    const catchReady = t.mock.method(ready, "catch");
    const skipTransition = t.mock.fn();
    dispatchSwap(destination, { ready, skipTransition });
    assert.equal(skipTransition.mock.callCount(), 0, destination);
    assert.equal(catchReady.mock.callCount(), 0, destination);
  }
});

test("missing transitions or navigation activation need no intervention", (t) => {
  const errors: unknown[] = [];
  window.addEventListener("error", (event) => { errors.push(event.error); });
  dispatchSwap(`${origin}${OFFLINE_READER_URL}`, null);
  const skipTransition = t.mock.fn();
  dispatchSwap(null, { ready: Promise.resolve(), skipTransition });
  assert.equal(skipTransition.mock.callCount(), 0);
  assert.deepEqual(errors, []);
});

test("unmounting removes the pageswap listener", async (t) => {
  await act(async () => root.render(null));
  const ready = Promise.resolve();
  const catchReady = t.mock.method(ready, "catch");
  const skipTransition = t.mock.fn();
  dispatchSwap(`${origin}${OFFLINE_READER_URL}`, { ready, skipTransition });
  assert.equal(skipTransition.mock.callCount(), 0);
  assert.equal(catchReady.mock.callCount(), 0);
});
