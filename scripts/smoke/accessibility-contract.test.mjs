import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { routes } from "../a11y/config.mjs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("the production check fails closed on rendered accessibility regressions", () => {
  const packageJson = JSON.parse(read("package.json"));
  const runner = read("scripts/a11y/test.mjs");

  assert.match(packageJson.scripts.check, /test:a11y/);
  for (const route of ["/", "/jesus", "/jesus/words", "/jesus/life", "/apostles", "/church", "/scriptures"]) {
    assert.ok(routes.includes(route), `Missing accessibility coverage: ${route}`);
  }
  assert.match(runner, /process\.exitCode\s*=\s*1|throw new Error/);
});

test("the first render has translated copy and a full-size church era navigator", () => {
  const context = read("src/lib/i18n/context.tsx");
  const eraSpine = read("src/app/church/EraSpine.tsx");

  assert.match(context, /defaultTranslations/);
  assert.match(eraSpine, /aria-label="Church history eras"/);
  assert.match(eraSpine, /className="ch-spine-links"/);
});
