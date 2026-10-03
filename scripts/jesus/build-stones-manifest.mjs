#!/usr/bin/env node
/**
 * Build archaeological reconstruction plate manifest from public/jesus/stones.json.
 * Writes public/jesus/stones-plates.json (prompts + captions for Lane B plates).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { laneBPrompt } from "../media/lanes.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STONES_JSON = path.join(ROOT, "public/jesus/stones.json");
const PLATES_DIR = path.join(ROOT, "public/jesus/stones");
const OUT = path.join(ROOT, "public/jesus/stones-plates.json");

const stones = JSON.parse(fs.readFileSync(STONES_JSON, "utf8"));
const manifest = {};

for (const stone of stones) {
  const ready = fs.existsSync(path.join(PLATES_DIR, `${stone.id}.jpg`));
  const summary = `${stone.name}. ${stone.note}`;
  manifest[stone.id] = {
    title: stone.name,
    caption: `${stone.artifactDate} · ${stone.found}`,
    alt: `Reconstruction plate for ${stone.name}`,
    summary,
    ready,
    prompt: laneBPrompt({
      room: "jesus",
      summary,
      theme: `${stone.name}; ${stone.artifactDate}; ${stone.found}`,
      source: "Jesus Christ / historical record / carved in stone",
    }),
  };
}

fs.writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${OUT} — ${Object.keys(manifest).length} stone plates`);
