import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// The x-ray colour tokens against the page in both appearances: text at
// 4.5:1 (small mono type), the outline at 3:1 (a graphic object).
const core = readFileSync("src/app/styles/core.css", "utf8");
const globals = readFileSync("src/app/globals.css", "utf8");

function token(css: string, name: string, after = 0) {
  const match = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css.slice(after));
  assert.ok(match, `${name} missing`);
  return match[1];
}
function luminance(hex: string) {
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a: string, b: string) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

test("the x-ray tokens hold their contrast on the light page", () => {
  const light = core.slice(core.indexOf(":root {"));
  for (const page of [token(light, "--vellum"), token(light, "--folio")]) {
    assert.ok(ratio(token(light, "--xray"), page) >= 4.5, `light text on ${page}`);
    assert.ok(ratio(token(light, "--xray-line"), page) >= 3, `light line on ${page}`);
  }
});

test("the x-ray tokens hold their contrast on the dark page", () => {
  const dark = globals.slice(globals.indexOf('html[data-a11y-theme="dark"]'));
  for (const page of [token(dark, "--vellum"), token(dark, "--folio")]) {
    assert.ok(ratio(token(dark, "--xray"), page) >= 4.5, `dark text on ${page}`);
    assert.ok(ratio(token(dark, "--xray-line"), page) >= 3, `dark line on ${page}`);
  }
  // Every dark palette block (explicit dark, system dark) carries the tokens.
  assert.equal((globals.match(/--xray:/g) ?? []).length, (globals.match(/--deep-gold: #e2c06a;/g) ?? []).length);
  assert.ok((globals.match(/--xray:/g) ?? []).length >= 2);
});
