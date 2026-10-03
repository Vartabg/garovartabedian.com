#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GENERATED_BY,
  inspectKnowledgePipelinePdf,
  ONEPAGER_MANIFEST_PATH,
  ONEPAGER_PDF_PATH,
  PDF_CONVERTER_PATH,
  renderOnePagerHtml,
  ROOT,
  sha256,
} from "./knowledge-pipeline-artifact";

export function buildOnePager(): void {
  if (!existsSync(PDF_CONVERTER_PATH)) {
    throw new Error(`PDF converter not found: ${PDF_CONVERTER_PATH}`);
  }

  const tempRoot = path.join(ROOT, "tmp/pdfs");
  mkdirSync(tempRoot, { recursive: true });
  const tempDirectory = mkdtempSync(path.join(tempRoot, "onepager-"));
  const inputPath = path.join(tempDirectory, "onepager.html");
  const outputPath = path.join(tempDirectory, "onepager.pdf");
  const manifestPath = path.join(tempDirectory, "onepager-manifest.json");

  try {
    const html = renderOnePagerHtml();
    writeFileSync(inputPath, html, "utf8");

    const result = spawnSync(
      PDF_CONVERTER_PATH,
      [inputPath, outputPath, "30"],
      { cwd: ROOT, encoding: "utf8" },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(
        `PDF converter failed (${result.status}): ${(result.stderr || result.stdout).trim()}`,
      );
    }

    const inspection = inspectKnowledgePipelinePdf(outputPath);
    if (inspection.pageCount !== 1) {
      throw new Error(
        `OnePager PDF must be exactly one page; got ${inspection.pageCount}`,
      );
    }

    const manifest = {
      schemaVersion: 1,
      generatedBy: GENERATED_BY,
      pdfSha256: inspection.pdfSha256,
      htmlSha256: sha256(html),
      normalizedTextSha256: inspection.normalizedTextSha256,
      pageCount: inspection.pageCount,
      urls: inspection.urls,
    };

    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    mkdirSync(path.dirname(ONEPAGER_PDF_PATH), { recursive: true });
    mkdirSync(path.dirname(ONEPAGER_MANIFEST_PATH), { recursive: true });

    renameSync(outputPath, ONEPAGER_PDF_PATH);
    renameSync(manifestPath, ONEPAGER_MANIFEST_PATH);

    process.stdout.write(
      `Knowledge Pipeline One-Pager: ${manifest.pageCount} page, ${manifest.pdfSha256}\n${path.relative(ROOT, ONEPAGER_PDF_PATH)}\n${path.relative(ROOT, ONEPAGER_MANIFEST_PATH)}\n`,
    );
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildOnePager();
}
