import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { checkTopicImageTrace } from "../site/check-topic-image-trace.mjs";

test("topic runtime traces require every indexed shard, even when public assets exist", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "topic-image-trace-"));
  const publicDir = path.join(root, "public/scriptures/nave");
  const traces = ["page.js.nft.json", "opengraph-image/route.js.nft.json"].map((file) =>
    path.join(root, ".next/server/app/scriptures/topics/[topic]", file));
  try {
    await mkdir(publicDir, { recursive: true });
    await writeFile(path.join(publicDir, "index.json"), JSON.stringify({ topics: [
      { section: "A" }, { section: "A" }, { section: "Z" },
    ] }));
    for (const shard of ["A", "Z"]) await writeFile(path.join(publicDir, `${shard}.json`), "{}");
    async function writeTrace(filename, shards) {
      await mkdir(path.dirname(filename), { recursive: true });
      await writeFile(filename, JSON.stringify({ version: 1, files: shards.map((shard) =>
        path.relative(path.dirname(filename), path.join(publicDir, `${shard}.json`))) }));
    }
    for (const filename of traces) await writeTrace(filename, ["A", "Z"]);
    assert.equal(await checkTopicImageTrace(root), 2);
    for (const filename of traces) {
      await writeTrace(filename, ["A"]);
      await assert.rejects(checkTopicImageTrace(root), /missing Nave shard Z/);
      await writeTrace(filename, ["A", "Z"]);
    }
    await rm(path.join(publicDir, "Z.json"));
    await assert.rejects(checkTopicImageTrace(root), /ENOENT/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
