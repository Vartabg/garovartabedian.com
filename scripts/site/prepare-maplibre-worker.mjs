#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MODULES = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];
const FILES = [...MODULES, "LICENSE.txt"];
const MANIFEST = "src/lib/jesus/maplibre-worker.json";

export function assertWorkerDependencies(source, name) {
  const parsed = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if (parsed.parseDiagnostics.length) throw new Error(`Cannot parse MapLibre worker module ${name}`);
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      const specifier = node.moduleSpecifier;
      if (!ts.isStringLiteral(specifier) || !MODULES.some((module) => specifier.text === `./${module}`)) {
        throw new Error(`Review new MapLibre worker dependency in ${name}: ${specifier.getText(parsed)}`);
      }
    }
    // MapLibre also imports optional plugin URLs supplied at runtime. Those
    // variable URLs are not dependencies of this self-hosted module pair.
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.some((argument) => ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))) {
      throw new Error(`Review dynamic MapLibre worker dependency in ${name}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
}

// MapLibre's split ESM worker resolves its shared module relative to its own
// URL. Next bundles the main library, so its import.meta.url cannot locate
// those runtime files. Publish the matching pair unchanged, with its license.
// Run --write after a dependency upgrade; builds only check committed assets.
export async function prepareMapLibreWorker({ root = ROOT, write = false } = {}) {
  const installedRoot = path.join(root, "node_modules/maplibre-gl");
  const installed = JSON.parse(await readFile(path.join(installedRoot, "package.json"), "utf8"));
  const lock = JSON.parse(await readFile(path.join(root, "package-lock.json"), "utf8"));
  if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(installed.version) ||
      installed.version !== lock.packages["node_modules/maplibre-gl"]?.version) {
    throw new Error("Installed MapLibre version must match package-lock.json before preparing its worker");
  }

  const directory = `/vendor/maplibre-gl/${installed.version}`;
  const sources = await Promise.all(FILES.map(async (name) => ({
    name,
    bytes: await readFile(path.join(installedRoot, name === "LICENSE.txt" ? name : `dist/${name}`)),
  })));
  for (const { name, bytes } of sources.filter(({ name }) => MODULES.includes(name))) {
    assertWorkerDependencies(bytes.toString("utf8"), name);
  }
  const manifest = {
    version: installed.version,
    workerUrl: `${directory}/maplibre-gl-worker.mjs`,
    files: Object.fromEntries(sources.map(({ name, bytes }) => [name, createHash("sha256").update(bytes).digest("hex")])),
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  const outputs = [
    ...sources.map(({ name, bytes }) => ({ target: path.join(root, "public", directory, name), bytes })),
    { target: path.join(root, MANIFEST), bytes: manifestBytes },
  ];
  if (write) {
    for (const { target, bytes } of outputs) {
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, bytes);
    }
  } else {
    for (const { target, bytes } of outputs) {
      const actual = await readFile(target).catch(() => null);
      if (!actual?.equals(bytes)) {
        throw new Error(`MapLibre worker asset drift: ${path.relative(root, target)}. Run npm run data:map-worker and commit the matching assets.`);
      }
    }
  }
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !["--write", "--check"].includes(args[0])) {
    throw new Error("Usage: node scripts/site/prepare-maplibre-worker.mjs --write|--check");
  }
  prepareMapLibreWorker({ write: args[0] === "--write" }).then((manifest) => {
    console.log(`MapLibre ${manifest.version} worker assets ${args[0] === "--write" ? "prepared" : "verified"}.`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
