import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildEarlyCatalog, earlyCatalog } from "../site/build-early-catalog.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

test("Find's section catalog matches the current hosted sources", () => {
  const published = JSON.parse(fs.readFileSync(path.join(ROOT, "public/early/catalog.json"), "utf8"));
  assert.deepEqual(published, earlyCatalog(ROOT), "Run npm run data:early-catalog after changing hosted sections");
});

test("catalog regeneration follows section insertion and reordering without changing legacy files", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "early-catalog-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const texts = path.join(root, "public/early/texts");
  fs.mkdirSync(texts, { recursive: true });
  const legacy = path.join(root, "public/early/semantic/early.json");
  fs.mkdirSync(path.dirname(legacy), { recursive: true });
  fs.writeFileSync(legacy, "legacy snapshot");
  const write = headings => fs.writeFileSync(path.join(texts, "example.json"), JSON.stringify({
    id: "example", title: "Example", sections: headings.map(heading => ({ heading, paragraphs: ["Source body"] })),
  }));
  write(["First", "Last"]);
  assert.equal(buildEarlyCatalog(root).entries.length, 2);
  write(["Inserted", "Last", "First"]);
  const updated = buildEarlyCatalog(root);
  assert.deepEqual(updated.entries.map(({ id, section, label }) => [id, section, label]), [
    ["example#0", 0, "Example — Inserted"],
    ["example#1", 1, "Example — Last"],
    ["example#2", 2, "Example — First"],
  ]);
  const once = fs.readFileSync(path.join(root, "public/early/catalog.json"), "utf8");
  buildEarlyCatalog(root);
  assert.equal(fs.readFileSync(path.join(root, "public/early/catalog.json"), "utf8"), once);
  assert.equal(fs.readFileSync(legacy, "utf8"), "legacy snapshot");
});
