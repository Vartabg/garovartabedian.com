import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { assertWorkerDependencies, prepareMapLibreWorker } from "../site/prepare-maplibre-worker.mjs";

test("committed MapLibre worker, shared module, license and URL match the locked package", async () => {
  const manifest = await prepareMapLibreWorker();
  assert.equal(manifest.workerUrl, `/vendor/maplibre-gl/${manifest.version}/maplibre-gl-worker.mjs`);
  assert.equal(Object.keys(manifest.files).length, 3);
});

test("worker preparation rejects new minified and dynamic module dependencies", () => {
  assert.doesNotThrow(() => assertWorkerDependencies('import{a}from"./maplibre-gl-shared.mjs";export{a};', "worker.mjs"));
  for (const source of [
    'import{a}from"./extra.mjs";',
    'import"unknown-package";',
    'export{a}from"./extra.mjs";',
    'export*from"unknown-package";',
    'import("./extra.mjs");',
  ]) assert.throws(() => assertWorkerDependencies(source, "worker.mjs"), /Review .*worker dependency/);
});

test("asset and dependency drift fail without rewriting committed files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "maplibre-worker-"));
  const installed = path.join(root, "node_modules/maplibre-gl");
  try {
    await mkdir(path.join(installed, "dist"), { recursive: true });
    await writeFile(path.join(installed, "package.json"), JSON.stringify({ version: "6.11.2" }));
    await writeFile(path.join(root, "package-lock.json"), JSON.stringify({ packages: { "node_modules/maplibre-gl": { version: "6.11.2" } } }));
    await writeFile(path.join(installed, "dist/maplibre-gl-worker.mjs"), 'import{a}from"./maplibre-gl-shared.mjs";');
    await writeFile(path.join(installed, "dist/maplibre-gl-shared.mjs"), "export const a=1;");
    await writeFile(path.join(installed, "LICENSE.txt"), "Test license");
    const manifest = await prepareMapLibreWorker({ root, write: true });
    await prepareMapLibreWorker({ root });
    for (const name of Object.keys(manifest.files)) {
      const target = path.join(root, "public/vendor/maplibre-gl/6.11.2", name);
      const original = await readFile(target);
      await writeFile(target, "changed");
      await assert.rejects(prepareMapLibreWorker({ root }), /worker asset drift/);
      assert.equal(await readFile(target, "utf8"), "changed");
      await writeFile(target, original);
    }
    await writeFile(path.join(root, "src/lib/jesus/maplibre-worker.json"), '{"workerUrl":""}');
    await assert.rejects(prepareMapLibreWorker({ root }), /worker asset drift/);
    await writeFile(path.join(installed, "package.json"), JSON.stringify({ version: "6.11.3" }));
    await assert.rejects(prepareMapLibreWorker({ root, write: true }), /match package-lock/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
