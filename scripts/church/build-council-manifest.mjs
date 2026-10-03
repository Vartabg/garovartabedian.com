#!/usr/bin/env node
/**
 * Build Church council Lane B media manifest.
 * Writes public/church/council-plates.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { laneBPrompt } from "../media/lanes.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CHURCH_DIR = path.join(ROOT, "public/church");
const PLATES_DIR = path.join(CHURCH_DIR, "councils");
const OUT = path.join(CHURCH_DIR, "council-plates.json");

const data = JSON.parse(fs.readFileSync(path.join(CHURCH_DIR, "councils.json"), "utf8"));
const manifest = {};

for (const council of data.councils) {
  const ready = fs.existsSync(path.join(PLATES_DIR, `${council.id}.jpg`));
  const summary = `${council.decision} Consequence: ${council.consequence}`;
  manifest[council.id] = {
    kind: "council",
    title: council.name,
    caption: `${council.year} · ${council.place}`,
    alt: `Illustration for ${council.name} — ${council.place}`,
    summary,
    ready,
    prompt: laneBPrompt({
      room: "church",
      summary,
      theme: `${council.name}; called by ${council.calledBy}; ${council.place}`,
      source: "The Church / councils",
    }),
  };
}

fs.writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${OUT} — ${Object.keys(manifest).length} council plates`);
