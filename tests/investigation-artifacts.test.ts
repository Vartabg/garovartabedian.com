import assert from "node:assert/strict";
import test from "node:test";
import { readInvestigationArtifact } from "../src/lib/evidence/investigation-artifacts-server";

test("investigation artifacts reject paths outside the explicit source set", async () => {
  for (const artifact of ["package.json", "../package.json", "/etc/passwd", "public/early/texts/../texts/1clement.json"]) {
    await assert.rejects(readInvestigationArtifact(artifact), /Unsupported investigation artifact/);
  }
});
