import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { JSDOM } from "jsdom";
import { accessibilityBootstrap, applyAccessibilityPreferences, defaultAccessibilityPreferences, loadReadingPreferences, resolveReadingPreferences } from "../src/lib/accessibility-preferences";

test("shared appearance migration preserves accessibility and the largest effective text size", () => {
  const p = resolveReadingPreferences(null, { theme: "dark", font: "dyslexic", size: "largest", spacious: true, reduceMotion: true }, { theme: "warm", size: "largest", monochrome: true }, { textSize: 3, font: "serif" });
  assert.equal(p.theme, "dark"); assert.equal(p.font, "dyslexic"); assert.equal(p.customSize, 32.5); assert.equal(p.spacing, "spacious"); assert.ok(p.reduceMotion && p.monochrome);
  assert.equal(resolveReadingPreferences({ theme: "light" }, { theme: "dark" }).theme, "light");
});
test("broken storage and invalid preferences stay bounded", () => {
  assert.deepEqual(loadReadingPreferences({ getItem() { throw Error("blocked"); } }), defaultAccessibilityPreferences);
  assert.equal(resolveReadingPreferences({ customSize: Infinity, size: "custom" }).customSize, 19);
  assert.equal(resolveReadingPreferences({ customSize: 1000, size: "custom" }).customSize, 48);
});
test("before-paint bootstrap uses the same normalization as the interactive controls", () => {
  const dom = new JSDOM("<!doctype html><html></html>");
  const localStorage = { getItem: (key: string) => key === "garovartabedian:a11y:v1" ? JSON.stringify({ font: "dyslexic", theme: "dark", size: "largest" }) : null };
  vm.runInNewContext(accessibilityBootstrap, { document: dom.window.document, localStorage });
  const root = dom.window.document.documentElement;
  assert.equal(root.dataset.a11yTheme, "dark"); assert.equal(root.dataset.a11yFont, "dyslexic");
  const expected = dom.window.document.createElement("div"); applyAccessibilityPreferences(loadReadingPreferences(localStorage), expected);
  assert.deepEqual({ ...root.dataset }, { ...expected.dataset }); assert.equal(root.style.fontSize, expected.style.fontSize);
});
