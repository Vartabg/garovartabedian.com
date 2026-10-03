#!/usr/bin/env node
/** Find navigation metadata comes from hosted sections, independently of model indexes. */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { collectEarly } from "./corpus-sources.mjs";
import { atomicWrite, jsonBytes } from "../scriptures/index-publication.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

export function earlyCatalog(root = ROOT) {
  const entries = collectEarly(root).entries.map(({ id, textId, section, label }) =>
    ({ id, textId, section, label }));
  if (!entries.length || new Set(entries.map(entry => entry.id)).size !== entries.length) {
    throw new Error("Empty or duplicate early section catalog");
  }
  return { schemaVersion: 1, entries };
}

export function buildEarlyCatalog(root = ROOT) {
  const catalog = earlyCatalog(root);
  atomicWrite(path.join(root, "public/early/catalog.json"), jsonBytes(catalog));
  // A compact edition catalog for global discovery, never section bodies or restricted data.
  const libraryPath = path.join(root, "content/early-library/catalog.json");
  if (fs.existsSync(libraryPath)) {
    const records = JSON.parse(fs.readFileSync(libraryPath, "utf8"));
    const entries = records.map(({ id, title, editionLabel, workId, group, publicationStatus }) => ({ id, title, editionLabel, workId, group, publicationStatus, href: `/early/library/${id}` }));
    atomicWrite(path.join(root, "public/early/library-catalog.json"), jsonBytes({ schemaVersion: 1, entries }));
  }
  return catalog;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const catalog = buildEarlyCatalog();
  console.log(`Find catalog: ${catalog.entries.length} hosted sections`);
}
