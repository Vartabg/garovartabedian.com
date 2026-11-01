import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TRACES = [
  ".next/server/app/scriptures/read/isaiah-53-clement-16/page.js.nft.json",
  ".next/server/app/scriptures/investigations/isaiah-53-clement-16/page.js.nft.json",
];
const SOURCES = [
  "public/scriptures/text/web/ISA.json",
  "public/early/texts/1clement.json",
];
const BUILD_DIRECTORIES = new Set(["test-results", "logs", "scripts", "tests", "docs"]);

function isBuildOnlyProjectFile(root, filename) {
  const relative = path.relative(root, filename);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return false;
  const parts = relative.split(path.sep);
  // A dependency's own tests, documentation or cache do not imply that the
  // application accidentally traced the project root.
  if (parts[0] === "node_modules") return false;
  return BUILD_DIRECTORIES.has(parts[0]) ||
    (parts.length === 1 && relative.endsWith(".tsbuildinfo")) ||
    relative.endsWith(".log");
}

// Dynamic fs reads must preserve their source files without tracing the
// project root, whose local verification output is intentionally not uploaded.
export async function checkInvestigationTrace(root = ROOT) {
  const projectRoot = path.resolve(root);
  for (const relative of TRACES) {
    const filename = path.join(projectRoot, relative);
    const trace = JSON.parse(await readFile(filename, "utf8"));
    const files = new Set(trace.files.map((file) => path.resolve(path.dirname(filename), file)));
    for (const source of SOURCES) {
      const expected = path.join(projectRoot, source);
      if (!files.has(expected)) throw new Error(`${relative} is missing investigation source ${source}`);
      await readFile(expected);
    }
    for (const file of files) {
      if (isBuildOnlyProjectFile(projectRoot, file)) {
        throw new Error(`${relative} includes build-only project file ${path.relative(projectRoot, file)}`);
      }
    }
  }
  return SOURCES.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkInvestigationTrace().then((count) => {
    console.log(`Both investigation traces include ${count} source artifacts without project build output.`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
