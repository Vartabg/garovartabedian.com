import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import nextConfig from "../next.config";
import { DIAMOND_ESSAY_SECTIONS } from "../src/lib/jesus/diamond-excerpts";
import { CHRISTIANITY_ESSAY_PATH, EXCERPT_FRAME_ORIGIN, excerptEmbedUrl, excerptWatchUrl } from "../src/lib/site/excerpt-video";
import ExcerptPlayer, { ExcerptPlayback } from "../src/app/jesus/history/belief-and-growth/ExcerptPlayer";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const players = <ExcerptPlayback>{DIAMOND_ESSAY_SECTIONS.map((clip) => <ExcerptPlayer key={clip.id} clip={clip} />)}</ExcerptPlayback>;

test("the readable quotes and timed source links survive without JavaScript or a third-party request", () => {
  const dom = new JSDOM(renderToStaticMarkup(players));
  try {
    const doc = dom.window.document;
    assert.equal(doc.querySelectorAll("iframe, script, img").length, 0);
    assert.equal(doc.querySelectorAll("blockquote").length, DIAMOND_ESSAY_SECTIONS.length);
    for (const clip of DIAMOND_ESSAY_SECTIONS) {
      assert.ok(Array.from(doc.querySelectorAll("a")).some((link) => link.getAttribute("href") === excerptWatchUrl(clip.start)));
      const embed = new URL(excerptEmbedUrl(clip.start, clip.end));
      assert.equal(embed.origin, EXCERPT_FRAME_ORIGIN);
      assert.equal(embed.searchParams.get("end"), String(clip.end), "end is absolute, not a duration");
      assert.equal(embed.searchParams.get("playsinline"), "1");
    }
    assert.throws(() => excerptEmbedUrl(10, 9));
  } finally { dom.window.close(); }
});

test("opening, switching, replaying, and closing excerpts keeps only one player and restores focus", async () => {
  const dom = new JSDOM("<div id='root'></div>", { url: "https://garovartabedian.com" });
  const values = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true };
  const previous = new Map(Object.keys(values).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { configurable: true, value });
  const root = createRoot(document.getElementById("root")!);
  try {
    await act(async () => root.render(players));
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".diamond-watch"));
    await act(async () => buttons[0].click());
    assert.equal(document.querySelectorAll("iframe").length, 1);
    assert.equal(buttons[0].getAttribute("aria-expanded"), "true");
    await act(async () => buttons[1].click());
    assert.equal(document.querySelectorAll("iframe").length, 1);
    assert.equal(buttons[0].getAttribute("aria-expanded"), "false");
    const iframe = document.querySelector("iframe")!;
    assert.equal(new URL(iframe.src).searchParams.get("start"), String(DIAMOND_ESSAY_SECTIONS[1].start));
    assert.equal(iframe.getAttribute("referrerpolicy"), "strict-origin-when-cross-origin");
    await act(async () => buttons[1].click());
    assert.notEqual(document.querySelector("iframe"), iframe, "replay reloads the excerpt from its start");
    await act(async () => document.querySelector<HTMLButtonElement>(".diamond-player-help button")!.click());
    assert.equal(document.querySelectorAll("iframe").length, 0);
    assert.equal(document.activeElement, buttons[1]);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});

test("configured security headers limit YouTube framing and its isolation exception to the essay", async () => {
  const rules = await nextConfig.headers!();
  const general = rules.find((rule) => rule.source === "/:path*")!;
  for (const route of [CHRISTIANITY_ESSAY_PATH, "/jesus/history", "/scriptures/search", `${CHRISTIANITY_ESSAY_PATH}/other`]) {
    const effective = new Map(general.headers.map(({ key, value }) => [key.toLowerCase(), value]));
    for (const rule of rules.filter((rule) => rule.source === route)) {
      for (const { key, value } of rule.headers) effective.set(key.toLowerCase(), value);
    }
    const isEssay = route === CHRISTIANITY_ESSAY_PATH;
    const csp = effective.get("content-security-policy")!;
    assert.equal(csp.includes(EXCERPT_FRAME_ORIGIN), isEssay);
    assert.equal(effective.get("cross-origin-embedder-policy"), isEssay ? "unsafe-none" : "credentialless");
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /form-action 'self'/);
  }
});
