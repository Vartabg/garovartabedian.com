import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { scanSourceText } from "../scripts/check-voice";
import {
  inspectKnowledgePipelinePdf,
  ONEPAGER_MANIFEST_PATH,
  ONEPAGER_PDF_PATH,
  renderOnePagerHtml,
  type OnePagerArtifactManifest,
} from "../scripts/site/knowledge-pipeline-artifact";

describe("knowledge pipeline one-pager artifact lock", () => {
  it("exists on disk and begins with a valid PDF signature", () => {
    assert.ok(existsSync(ONEPAGER_PDF_PATH), "One-pager PDF must exist in public/");
    const header = readFileSync(ONEPAGER_PDF_PATH, { encoding: null }).subarray(0, 5);
    assert.equal(header.toString("ascii"), "%PDF-");
  });

  it("is exactly one page in length", () => {
    const inspection = inspectKnowledgePipelinePdf(ONEPAGER_PDF_PATH);
    assert.equal(inspection.pageCount, 1, "PDF must fit on exactly 1 page");
  });

  it("contains canonical phrases and truthful architecture proof", () => {
    const inspection = inspectKnowledgePipelinePdf(ONEPAGER_PDF_PATH);
    const textLower = inspection.normalizedText.toLowerCase();
    assert.ok(textLower.includes("grounded knowledge architecture"));
    assert.ok(textLower.includes("google notebooklm"));
    assert.ok(textLower.includes("garbage in, garbage out"));
    assert.ok(textLower.includes("source-linked provenance"));
    assert.ok(textLower.includes("garovartabedian.com"));
  });

  it("matches the generated manifest", () => {
    assert.ok(existsSync(ONEPAGER_MANIFEST_PATH), "Manifest must exist");
    const manifest = JSON.parse(
      readFileSync(ONEPAGER_MANIFEST_PATH, "utf8"),
    ) as OnePagerArtifactManifest;
    const inspection = inspectKnowledgePipelinePdf(ONEPAGER_PDF_PATH);
    assert.equal(manifest.pdfSha256, inspection.pdfSha256);
    assert.equal(manifest.pageCount, 1);
  });

  it("passes voice and truth scanning without violations", () => {
    const html = renderOnePagerHtml();
    const result = scanSourceText(html);
    assert.deepEqual(
      result.violations,
      [],
      `OnePager HTML voice check failed: ${JSON.stringify(result.violations)}`,
    );
  });
});
