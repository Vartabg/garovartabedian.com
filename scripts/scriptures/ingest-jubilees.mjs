#!/usr/bin/env node
/**
 * Rebuild the complete Charles 1913 Jubilees text from the archived CCEL
 * transcription. Runs offline; input checksums and reviewed verse boundaries
 * are pinned in sources/charles-jubilees-1913/manifest.json.
 *
 * node scripts/scriptures/ingest-jubilees.mjs          # validate, then publish
 * node scripts/scriptures/ingest-jubilees.mjs --check  # compare without writing
 * --source-dir DIR checks independently downloaded pages against the same pins.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { atomicWriteFileSync } from "../lib/atomic-publication.mjs";
import { reconstructJubilees, sourceDirectory, validateExcerpt } from "./reconstruct-jubilees.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const destination = path.join(root, "public/scriptures/text/charles/JUB.json");

function run() {
  let check = false;
  let sources = sourceDirectory;
  const args = process.argv.slice(2);
  while (args.length) {
    const option = args.shift();
    if (option === "--check") check = true;
    else if (option === "--source-dir" && args[0] && !args[0].startsWith("--")) sources = path.resolve(args.shift());
    else throw new Error(`Unknown or incomplete option: ${option}`);
  }
  const book = reconstructJubilees({ sources });
  const excerpt = JSON.parse(fs.readFileSync(path.join(root, "public/parallels/sources/jubilees-17-18.json"), "utf8"));
  validateExcerpt(book, excerpt);
  const serialized = `${JSON.stringify(book, null, 1)}\n`;
  if (check) {
    if (fs.readFileSync(destination, "utf8") !== serialized) throw new Error("Published Jubilees text differs from the validated reconstruction");
  } else {
    // No output is touched until every source, boundary, and excerpt passes.
    atomicWriteFileSync(destination, serialized);
  }
  console.log(`Jubilees (Charles 1913): 50 chapters, 1307 verses, 23/23 reviewed excerpt verses match. ${check ? "Published text matches." : "Published validated text."}`);
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
