import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.join(import.meta.dirname, "../..");
const PARALLELS_DIR = path.join(ROOT, "public/parallels");
const RIGHTS_FILE = path.join(PARALLELS_DIR, "rights-manifest.json");

console.log("Validating parallels subsystem...");

if (!readFileSync(RIGHTS_FILE)) {
  console.error("Missing rights-manifest.json");
  process.exit(1);
}

const rights = JSON.parse(readFileSync(RIGHTS_FILE, "utf8"));
const files = readdirSync(PARALLELS_DIR).filter(
  (f) => f.endsWith(".json") && f !== "rights-manifest.json",
);

if (files.length === 0) {
  console.error("No parallel matrix files found in public/parallels/");
  process.exit(1);
}

const VALID_BASES = new Set(["explicit", "inferred", "reception", "disputed"]);
const VALID_RELATIONSHIPS = new Set([
  "direct-citation",
  "allusion",
  "shared-tradition",
  "theological-divergence",
  "independent",
]);

let errors = 0;

for (const file of files) {
  const filePath = path.join(PARALLELS_DIR, file);
  const matrix = JSON.parse(readFileSync(filePath, "utf8"));

  console.log(`Checking ${file} (${matrix.title})...`);

  if (matrix.schemaVersion !== "1.0.0") {
    console.error(`  [FAIL] ${file}: Invalid schemaVersion ${matrix.schemaVersion}`);
    errors++;
  }

  // Check witnesses & rights
  const witnessIds = new Set();
  for (const w of matrix.witnesses) {
    witnessIds.add(w.id);
    if (!rights.corpora[w.corpusEditionId]) {
      console.error(`  [FAIL] ${file}: Unknown corpusEditionId '${w.corpusEditionId}' for witness ${w.id}`);
      errors++;
    }
    if (!w.licenseNotice || w.licenseNotice.trim().length === 0) {
      console.error(`  [FAIL] ${file}: Witness ${w.id} is missing licenseNotice`);
      errors++;
    }
  }

  // Check slots & cells
  for (const slot of matrix.slots) {
    for (const wId of witnessIds) {
      const cell = slot.cells[wId];
      if (!cell) {
        console.error(`  [FAIL] ${file}: Slot '${slot.id}' missing cell for witness '${wId}'`);
        errors++;
        continue;
      }
      if (!VALID_BASES.has(cell.basis)) {
        console.error(`  [FAIL] ${file}: Slot '${slot.id}' witness '${wId}' has invalid basis '${cell.basis}'`);
        errors++;
      }
      if (!cell.verbatimExcerpt || cell.verbatimExcerpt.trim().length === 0) {
        console.error(`  [FAIL] ${file}: Slot '${slot.id}' witness '${wId}' is missing verbatimExcerpt`);
        errors++;
      }
      if (!cell.supportingCitations || cell.supportingCitations.length === 0) {
        console.error(`  [FAIL] ${file}: Slot '${slot.id}' witness '${wId}' is missing supportingCitations`);
        errors++;
      }
    }
  }

  // Check pairwise edges
  for (const edge of matrix.edges) {
    if (!witnessIds.has(edge.sourceWitnessId) || !witnessIds.has(edge.targetWitnessId)) {
      console.error(`  [FAIL] ${file}: Edge '${edge.id}' connects unknown witness IDs`);
      errors++;
    }
    if (!VALID_RELATIONSHIPS.has(edge.relationship)) {
      console.error(`  [FAIL] ${file}: Edge '${edge.id}' has invalid relationship '${edge.relationship}'`);
      errors++;
    }
    if (!edge.citations || edge.citations.length === 0) {
      console.error(`  [FAIL] ${file}: Edge '${edge.id}' is missing scholarly citations`);
      errors++;
    }
  }

  // Check hash
  const contentToHash = JSON.stringify({
    slots: matrix.slots,
    edges: matrix.edges,
    receptionClaims: matrix.receptionClaims,
  });
  const computedHash = crypto.createHash("sha256").update(contentToHash).digest("hex");
  if (matrix.provenance?.reviewedContentHash !== computedHash) {
    console.error(
      `  [FAIL] ${file}: Content hash mismatch (recorded: ${matrix.provenance?.reviewedContentHash}, computed: ${computedHash})`,
    );
    errors++;
  }
}

if (errors > 0) {
  console.error(`\nValidation failed with ${errors} error(s).`);
  process.exit(1);
}

console.log(`\nAll ${files.length} matrix file(s) passed validation.`);
