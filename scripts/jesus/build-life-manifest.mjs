#!/usr/bin/env node
/**
 * Build life event illustration manifest from public/jesus/life.json.
 * Writes public/jesus/life-plates.json (prompts + captions for Lane B plates).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { laneBPrompt } from "../media/lanes.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const LIFE_JSON = path.join(ROOT, "public/jesus/life.json");
const OUT = path.join(ROOT, "public/jesus/life-plates.json");

const life = JSON.parse(fs.readFileSync(LIFE_JSON, "utf8"));
const eraNames = Object.fromEntries(life.eras.map((e) => [e.id, e.name]));

const manifest = {};
for (const event of life.events) {
  const era = eraNames[event.era] ?? event.era;
  const imgPath = path.join(ROOT, "public/jesus/life", `${event.id}.jpg`);
  manifest[event.id] = {
    era: event.era,
    eraName: era,
    title: event.title,
    caption: event.line,
    alt: `Illustration for ${event.title} — ${era}`,
    summary: event.line,
    ready: fs.existsSync(imgPath),
    prompt: laneBPrompt({
      room: "jesus",
      summary: event.line,
      theme: `${event.title} (${era})`,
      source: "His life",
    }),
  };
}

fs.writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${OUT} — ${Object.keys(manifest).length} events`);