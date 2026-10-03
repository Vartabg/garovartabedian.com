#!/usr/bin/env node
/**
 * Build Angels & Demons Lane B media manifest.
 * Writes public/angels/media-plates.json for fall fragments, encounters, and named demons.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { laneBPrompt } from "../media/lanes.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ANGELS_DIR = path.join(ROOT, "public/angels");
const PLATES_DIR = path.join(ANGELS_DIR, "plates");
const OUT = path.join(ANGELS_DIR, "media-plates.json");

const read = (file) => JSON.parse(fs.readFileSync(path.join(ANGELS_DIR, file), "utf8"));

const plateSlug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const fallPlateId = (stepId) => `fall-${plateSlug(stepId)}`;
const appearancePlateId = (ref) => `appearance-${plateSlug(ref)}`;
const exorcismPlateId = (ref) => `exorcism-${plateSlug(ref)}`;
const demonPlateId = (id) => `demon-${plateSlug(id)}`;

const ready = (id) => fs.existsSync(path.join(PLATES_DIR, `${id}.jpg`));

const fall = read("fall.json");
const encounters = read("encounters.json");
const demons = read("demons.json");
const manifest = {};

for (const step of fall.steps) {
  const id = fallPlateId(step.id);
  manifest[id] = {
    kind: "fall",
    title: step.title,
    caption: step.note,
    alt: `Illustration for ${step.title} — Angels & Demons, the fall`,
    summary: step.note,
    ready: ready(id),
    prompt: laneBPrompt({
      room: "angels",
      summary: step.note,
      theme: `${step.title} (${step.cite})`,
      source: "Angels & Demons / the fall",
    }),
  };
}

for (const item of encounters.appeared) {
  const id = appearancePlateId(item.ref);
  manifest[id] = {
    kind: "appearance",
    title: item.event,
    caption: item.line,
    alt: `Illustration for ${item.event} — ${item.who}`,
    summary: item.line,
    ready: ready(id),
    prompt: laneBPrompt({
      room: "angels",
      summary: item.line,
      theme: `${item.event}; ${item.who}; ${item.ref}`,
      source: "Angels & Demons / encounters",
    }),
  };
}

for (const item of encounters.castOut) {
  const id = exorcismPlateId(item.ref);
  manifest[id] = {
    kind: "exorcism",
    title: item.event,
    caption: item.line,
    alt: `Illustration for ${item.event} — ${item.place}`,
    summary: item.line,
    ready: ready(id),
    prompt: laneBPrompt({
      room: "angels",
      summary: item.line,
      theme: `${item.event}; ${item.place}; ${item.ref}`,
      source: "Angels & Demons / encounters",
    }),
  };
}

for (const demon of demons.demons) {
  const id = demonPlateId(demon.id);
  manifest[id] = {
    kind: "demon",
    title: demon.name,
    caption: demon.line,
    alt: `Illustration for ${demon.name} — named demon in the biblical record`,
    summary: demon.line,
    ready: ready(id),
    prompt: laneBPrompt({
      room: "angels",
      summary: demon.line,
      theme: `${demon.name}; ${demon.meaning}; ${demon.quoteRef}`,
      source: "Angels & Demons / named demons",
    }),
  };
}

fs.writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${OUT} — ${Object.keys(manifest).length} media plates`);
