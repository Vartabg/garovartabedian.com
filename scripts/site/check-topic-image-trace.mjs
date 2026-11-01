import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TRACES = [
  ".next/server/app/scriptures/topics/[topic]/page.js.nft.json",
  ".next/server/app/scriptures/topics/[topic]/opengraph-image/route.js.nft.json",
];

// Public assets being uploaded is insufficient: fs reads inside a Vercel
// function can only reach files included in that function's runtime trace.
export async function checkTopicImageTrace(root = ROOT) {
  const index = JSON.parse(await readFile(path.join(root, "public/scriptures/nave/index.json"), "utf8"));
  const shards = [...new Set(index.topics.map(({ section }) => section))];
  for (const relative of TRACES) {
    const filename = path.join(root, relative);
    const trace = JSON.parse(await readFile(filename, "utf8"));
    const files = new Set(trace.files.map((file) => path.resolve(path.dirname(filename), file)));
    for (const shard of shards) {
      const expected = path.join(root, "public/scriptures/nave", `${shard}.json`);
      if (!files.has(expected)) throw new Error(`${relative} is missing Nave shard ${shard}`);
      await readFile(expected);
    }
  }
  return shards.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkTopicImageTrace().then((count) => {
    console.log(`Topic page and preview-image traces include all ${count} Nave shards.`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
