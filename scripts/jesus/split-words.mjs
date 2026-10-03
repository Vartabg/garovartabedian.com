#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePath = path.join(ROOT, "public/jesus/words.json");
const outputDir = path.join(ROOT, "public/jesus/words");
const words = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

fs.mkdirSync(outputDir, { recursive: true });

for (const [book, verses] of Object.entries(words.books)) {
  const outputPath = path.join(outputDir, `${book}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(verses)}\n`);
}

console.log(
  `[JesusWords] Split corpus -> Success: ${Object.keys(words.books).length} book payloads written`,
);
