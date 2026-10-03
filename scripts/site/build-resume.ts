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
  collectResumeArtifactState,
  renderResumeHtml,
  RESUME_CONVERTER_PATH,
  RESUME_MANIFEST_PATH,
  RESUME_PDF_PATH,
  ROOT,
} from "./resume-artifact";

export function buildResume(): void {
  if (!existsSync(RESUME_CONVERTER_PATH)) {
    throw new Error(`Resume converter not found: ${RESUME_CONVERTER_PATH}`);
  }

  const tempRoot = path.join(ROOT, "tmp/pdfs");
  mkdirSync(tempRoot, { recursive: true });
  const tempDirectory = mkdtempSync(path.join(tempRoot, "resume-"));
  const inputPath = path.join(tempDirectory, "resume.html");
  const outputPath = path.join(tempDirectory, "resume.pdf");
  const manifestPath = path.join(tempDirectory, "resume-artifact.json");

  try {
    writeFileSync(inputPath, renderResumeHtml(), "utf8");
    const result = spawnSync(
      RESUME_CONVERTER_PATH,
      [inputPath, outputPath, "30"],
      { cwd: ROOT, encoding: "utf8" },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(
        `Resume converter failed (${result.status}): ${(result.stderr || result.stdout).trim()}`,
      );
    }

    const manifest = collectResumeArtifactState(outputPath);
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    mkdirSync(path.dirname(RESUME_PDF_PATH), { recursive: true });
    mkdirSync(path.dirname(RESUME_MANIFEST_PATH), { recursive: true });

    // Both files are validated in task-local storage before the public PDF is
    // replaced. A failed render never deletes or truncates the current artifact.
    renameSync(outputPath, RESUME_PDF_PATH);
    renameSync(manifestPath, RESUME_MANIFEST_PATH);
    process.stdout.write(
      `Resume: ${manifest.pageCount} page, ${manifest.pdfSha256}\n${path.relative(ROOT, RESUME_PDF_PATH)}\n${path.relative(ROOT, RESUME_MANIFEST_PATH)}\n`,
    );
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildResume();
}
