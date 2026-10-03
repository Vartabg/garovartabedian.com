import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import React, { StrictMode, act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  useSemanticRequest,
  type SemanticRequestHandle,
} from "../src/lib/use-semantic-request";

let dom: JSDOM;
let root: Root;

function installDom() {
  dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost/",
  });
  const globals = {
    React,
    self: dom.window,
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
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

interface Probe {
  begin: () => SemanticRequestHandle;
  cancel: () => void;
}

function HookProbe({ capture }: { capture: (probe: Probe) => void }) {
  const { begin, cancel } = useSemanticRequest();
  capture({ begin, cancel });
  return null;
}

async function render(node: ReactNode) {
  await act(async () => root.render(node));
}

async function mount(strict = false): Promise<Probe> {
  let latest: Probe | null = null;
  const node = <HookProbe capture={(p) => (latest = p)} />;
  await render(strict ? <StrictMode>{node}</StrictMode> : node);
  return latest!;
}

beforeEach(installDom);
afterEach(async () => {
  await act(async () => root.unmount());
  dom.window.close();
});

describe("useSemanticRequest", () => {
  it("returns stable begin/cancel across renders", async () => {
    let latest: Probe | null = null;
    const capture = (probe: Probe) => { latest = probe; };
    await render(<HookProbe capture={capture} />);
    const first = latest!;
    await render(<HookProbe capture={capture} />);
    const second = latest!;
    assert.equal(second.begin, first.begin);
    assert.equal(second.cancel, first.cancel);
    assert.equal(typeof first.begin, "function");
    assert.equal(typeof first.cancel, "function");
  });

  it("begin aborts the previous request and guards current()", async () => {
    const probe = await mount();
    const a = probe.begin();
    assert.equal(a.signal.aborted, false);
    assert.equal(a.current(), true);

    const b = probe.begin();
    assert.equal(a.signal.aborted, true, "previous signal aborted");
    assert.equal(a.current(), false, "stale handle not current");
    assert.equal(b.signal.aborted, false);
    assert.equal(b.current(), true);
    assert.notEqual(a.signal, b.signal);
  });

  it("cancel invalidates then aborts the active request", async () => {
    const probe = await mount();
    const a = probe.begin();
    probe.cancel();
    assert.equal(a.signal.aborted, true);
    assert.equal(a.current(), false);
    probe.cancel(); // no active request: no-op, must not throw
    const b = probe.begin();
    assert.equal(b.current(), true);
  });

  it("aborts the active request on unmount", async () => {
    let latest: Probe | null = null;
    await render(<HookProbe capture={(p) => (latest = p)} />);
    const handle = latest!.begin();
    await act(async () => root.unmount());
    assert.equal(handle.signal.aborted, true);
    assert.equal(handle.current(), false);
    root = createRoot(document.getElementById("root")!);
  });

  it("works through StrictMode cleanup/setup replay", async () => {
    const probe = await mount(true);
    const a = probe.begin();
    assert.equal(a.signal.aborted, false);
    assert.equal(a.current(), true, "begin works after StrictMode replay");
    const b = probe.begin();
    assert.equal(a.current(), false);
    assert.equal(b.current(), true);
    probe.cancel();
    assert.equal(b.signal.aborted, true);
  });
});
