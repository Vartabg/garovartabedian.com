import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { collectWorks, isLocal, MANIFESTS, PUBLIC_PREFIX } from "../scripts/site/vendor-museum-art.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const ART_DIR = path.join(ROOT, "public/art");

const works = MANIFESTS.flatMap((manifest) =>
  collectWorks(JSON.parse(readFileSync(path.join(ROOT, manifest.file), "utf8"))).map((work) => ({
    ...work,
    manifest: manifest.file,
  })),
);

test("both art manifests carry works", () => {
  assert.ok(works.length >= 40, `only ${works.length} works found`);
  for (const manifest of MANIFESTS) {
    assert.ok(works.some((work) => work.manifest === manifest.file), `${manifest.file} yielded nothing`);
  }
});

test("no artwork is fetched from a museum at read time", () => {
  // This is the whole point of the vendoring. A manifest that reaches off-site
  // again means a visitor's browser opens a connection to a third party to
  // read a page here, and it means the plate can go dark without any build
  // noticing. The CSP below no longer allows it either — this test says why.
  for (const work of works) {
    assert.ok(
      isLocal(work.imageUrl),
      `${work.manifest}: ${work.id} still points off-site (${work.imageUrl})`,
    );
  }
});

test("the strict image policy has no host carve-outs left", () => {
  const config = readFileSync(path.join(ROOT, "next.config.ts"), "utf8");
  const directive = /"(img-src[^"]*)"/.exec(config);
  assert.ok(directive, "img-src is gone from the CSP");
  assert.equal(directive[1], "img-src 'self' data: blob:");
  // Comments are allowed to name it; the config key itself is what matters.
  const code = config.replace(/^\s*\/\/.*$/gm, "");
  assert.ok(!/remotePatterns\s*:/.test(code), "an image host carve-out came back");
});

test("every artwork resolves to a real picture on this disk", () => {
  for (const work of works) {
    const file = path.join(ART_DIR, path.basename(work.imageUrl));
    assert.ok(existsSync(file), `${work.manifest}: ${work.id} has no file at ${work.imageUrl}`);
    // An HTML error page saved as .jpg would be small; a real plate is not.
    assert.ok(statSync(file).size > 5_000, `${work.id} is too small to be an image`);
  }
});

test("public/art holds nothing the manifests do not use", () => {
  const referenced = new Set(works.map((work) => path.basename(work.imageUrl)));
  for (const name of readdirSync(ART_DIR)) {
    assert.ok(referenced.has(name), `public/art/${name} is orphaned — it ships on every deploy`);
  }
});

test("every local copy still says where it came from, and under what licence", () => {
  // Vendoring a public-domain work is only honest if the trail back to the
  // museum survives. objectUrl credits it on the page; sourceImageUrl lets
  // anyone re-run the fetch and check the file against the original.
  for (const work of works) {
    assert.match(work.sourceImageUrl, /^https:\/\//, `${work.id} lost its source URL`);
    assert.ok(!isLocal(work.sourceImageUrl), `${work.id} points its source at itself`);
    assert.match(work.objectUrl, /^https:\/\//, `${work.id} lost its museum page`);
    assert.ok(work.license.trim().length > 0, `${work.id} lost its licence`);
    assert.ok(work.imageUrl === `${PUBLIC_PREFIX}${work.id}.jpg`, `${work.id} is not named for its id`);
  }
});
