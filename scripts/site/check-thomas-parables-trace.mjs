import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateThomasParables } from "../../src/lib/jesus/thomas-parables-data.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const TRACES = [
  ".next/server/app/jesus/parables/page.js.nft.json",
  ".next/server/app/early/library/[edition]/[section]/page.js.nft.json",
];

/** Fail if the packaged readers omit a mapped saying or the Parables trace pulls in other editions. */
export async function checkThomasParablesTrace(root = ROOT) {
  const parables = JSON.parse(await readFile(path.join(root, "public/jesus/parables.json"), "utf8"));
  const figures = JSON.parse(await readFile(path.join(root, "public/jesus/synoptic-figures.json"), "utf8"));
  const stories = validateThomasParables(JSON.parse(await readFile(path.join(root, "public/jesus/thomas-parables.json"), "utf8")));
  const james = JSON.parse(await readFile(path.join(root, "public/jesus/james-parables.json"), "utf8"));
  const early = JSON.parse(await readFile(path.join(root, "public/jesus/early-figures.json"), "utf8"));
  if (!Array.isArray(james) || james.length !== 13 || new Set(james.map(story => story.id)).size !== 13 || james.some(story => !/^[a-z0-9-]+$/.test(story.section))) throw new Error("Invalid James mapping");
  if (!Array.isArray(early) || early.length !== 102 || new Set(early.map(story => story.id)).size !== 102 || early.some(story => !/^[a-z0-9-]+$/.test(story.edition) || !/^[a-z0-9-]+$/.test(story.section) || (story.legacy && !["epistula-apostolorum", "didache", "barnabas", "1-clement"].includes(story.edition)))) throw new Error("Invalid Early mapping");
  const numbers = [...new Set([...parables.flatMap((p) => (p.thomas ?? []).map((t) => t.saying)), ...figures.flatMap((p) => (p.thomas ?? []).map((t) => t.saying)), ...stories.map((story) => story.saying), ...early.flatMap(story => (story.thomas ?? []).map(item => item.saying))])];
  if (!numbers.length || numbers.some((n) => !Number.isInteger(n) || n < 1 || n > 114)) throw new Error("Invalid Thomas mapping");
  const sources = ["content/early-library/catalog.json", ...numbers.map((n) => `content/early-library/readings/gospel-thomas/saying-${n}.json`)];
  const jamesSources = [...new Set(james.map(story => `content/early-library/readings/secret-book-james/${story.section}.json`))];
  const earlySources = [...new Set(early.filter(story => !story.legacy && !story.excerpt).flatMap(story => (story.parts ?? [story]).map(part => `content/early-library/readings/${story.edition}/${part.section}.json`)))];
  const excerpts = ["content/jesus/early-excerpts/acts-thomas-wedding-invitation.json", "content/jesus/early-excerpts/acts-thomas-old-new-48.json", "content/jesus/early-excerpts/acts-thomas-lost-sheep.json", "content/jesus/early-excerpts/acts-thomas-old-new-58.json", "content/jesus/early-excerpts/acts-thomas-heat-day.json", "content/jesus/early-excerpts/acts-thomas-flock-wolves.json", "content/jesus/early-excerpts/acts-thomas-wolves-clothing.json", "content/jesus/early-excerpts/acts-thomas-stolen-thoughts.json", "content/jesus/early-excerpts/acts-thomas-physician-10.json", "content/jesus/early-excerpts/acts-thomas-birds.json", "content/jesus/early-excerpts/acts-thomas-wealth.json", "content/jesus/early-excerpts/acts-thomas-ask.json", "content/jesus/early-excerpts/acts-thomas-physician-95.json", "content/jesus/early-excerpts/acts-thomas-physician-143.json", "content/jesus/early-excerpts/acts-thomas-physician-156.json", "content/jesus/early-excerpts/eusebius-talents.json", "content/jesus/early-excerpts/acts-thomas-hymn.json", "content/jesus/early-excerpts/acts-thomas-bride.json", "content/jesus/early-excerpts/acts-thomas-palace.json", "content/jesus/early-excerpts/acts-thomas-prayer.json", "content/jesus/early-excerpts/acts-thomas-marriage.json", "content/jesus/early-excerpts/acts-thomas-bride-response.json", "content/jesus/early-excerpts/acts-thomas-shepherd.json", "content/jesus/early-excerpts/acts-thomas-crowd.json", "content/jesus/early-excerpts/acts-thomas-bitter-tree.json", "content/jesus/early-excerpts/acts-thomas-yoke.json", "content/jesus/early-excerpts/acts-thomas-seed.json", "content/jesus/early-excerpts/acts-thomas-mygdonia-marriage.json", "content/jesus/early-excerpts/acts-thomas-soldiers.json", "content/jesus/early-excerpts/acts-thomas-tower.json", "content/jesus/early-excerpts/acts-thomas-oil.json"];
  const legacySource = "public/early/texts/epistula-apostolorum.json";
  for (const relative of TRACES) {
    const filename = path.join(root, relative);
    const trace = JSON.parse(await readFile(filename, "utf8"));
    const files = new Set(trace.files.map((file) => path.resolve(path.dirname(filename), file)));
    for (const source of sources) {
      const expected = path.resolve(root, source);
      if (!files.has(expected)) throw new Error(`${relative} is missing Thomas source ${source}`);
      await readFile(expected);
    }
    for (const source of jamesSources) {
      const expected = path.resolve(root, source);
      if (!files.has(expected)) throw new Error(`${relative} is missing James source ${source}`);
      await readFile(expected);
    }
    for (const source of earlySources) {
      const expected = path.resolve(root, source);
      if (!files.has(expected)) throw new Error(`${relative} is missing Early source ${source}`);
      await readFile(expected);
    }
    if (relative.includes("jesus/parables")) {
      for (const source of [...excerpts, "public/early/texts/didache.json", "public/early/texts/barnabas.json", "public/early/texts/1clement.json"]) {
        if (!files.has(path.resolve(root, source))) throw new Error(`${relative} is missing Early source ${source}`);
        await readFile(path.resolve(root, source));
      }
      if (!files.has(path.resolve(root, legacySource))) throw new Error(`${relative} is missing Early source ${legacySource}`);
      await readFile(path.resolve(root, legacySource));
      for (const file of files) {
        const name = path.relative(root, file);
        if (name.startsWith(`content${path.sep}jesus${path.sep}early-excerpts${path.sep}`) && !excerpts.includes(name.split(path.sep).join("/"))) throw new Error(`${relative} includes unrelated early excerpt ${name}`);
        if (name.startsWith(`content${path.sep}early-library${path.sep}readings${path.sep}`) &&
            !name.startsWith(`content${path.sep}early-library${path.sep}readings${path.sep}gospel-thomas${path.sep}`) &&
            !jamesSources.includes(name.split(path.sep).join("/")) && !earlySources.includes(name.split(path.sep).join("/"))) {
          throw new Error(`${relative} includes unrelated library edition ${name}`);
        }
        if (!name.startsWith(`node_modules${path.sep}`) && (/^(?:scripts|tests|docs|test-results|logs)\//.test(name) || name.endsWith(".tsbuildinfo"))) {
          throw new Error(`${relative} includes build-only project file ${name}`);
        }
      }
    }
  }
  const legacyTrace = path.join(root, ".next/server/app/early/[text]/page.js.nft.json");
  const trace = JSON.parse(await readFile(legacyTrace, "utf8"));
  if (!trace.files.some(file => path.resolve(path.dirname(legacyTrace), file) === path.resolve(root, legacySource))) throw new Error("Early reader trace is missing Epistula source");
  return numbers.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkThomasParablesTrace().then((count) => console.log(`Parables and library reader traces include all ${count} mapped Thomas sayings.`))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
