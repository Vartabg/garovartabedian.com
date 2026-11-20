import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { checkThomasParablesTrace } from "../site/check-thomas-parables-trace.mjs";

const traces = [".next/server/app/jesus/parables/page.js.nft.json", ".next/server/app/early/library/[edition]/[section]/page.js.nft.json"];
const stories = JSON.parse(await readFile(new URL("../../public/jesus/thomas-parables.json", import.meta.url), "utf8"));
const sections = ["prophecies-and-parables", "know-yourselves", "being-filled", "the-cross-and-death", "be-saved", "few-have-found-the-kingdom", "final-words"];
const james = Array.from({ length: 14 }, (_, i) => ({ id: `james-${i}`, section: sections[i % sections.length] }));
const early = Array.from({ length: 350 }, (_, i) => i === 0 ? { id: `early-${i}`, edition: "epistula-apostolorum", section: "chapter-43", legacy: true } : { id: `early-${i}`, edition: "gospel-philip", section: "becoming-christians", ...(i === 1 ? { parts: [{ section: "becoming-christians" }, { section: "spiritual-growth" }], thomas: [{ saying: 22 }] } : {}) });
early[2].originalReader = { edition: "1-clement", section: "1-clem-5", start: 1, end: 6 };
const legacy = "public/early/texts/epistula-apostolorum.json";
const legacyTrace = ".next/server/app/early/[text]/page.js.nft.json";
const sources = ["content/jesus/early-excerpts/lightfoot-barnabas-goats-thorns.json", "content/jesus/early-excerpts/lightfoot-barnabas-thorns-heart.json", "content/jesus/early-excerpts/lightfoot-first-clement-sheep-lamb.json", "content/jesus/early-excerpts/lightfoot-barnabas-two-peoples.json", "content/jesus/early-excerpts/lightfoot-first-clement-aaron-rod.json", "content/jesus/early-excerpts/lightfoot-first-clement-pillars.json", "content/jesus/early-excerpts/lightfoot-first-clement-dust-smoke.json", "content/jesus/early-excerpts/lightfoot-first-clement-wisdom-fruit.json", "content/jesus/early-excerpts/lightfoot-first-clement-pasture-prayer.json", "content/jesus/early-excerpts/lightfoot-barnabas-yoke-sacrifice.json", "content/jesus/early-excerpts/lightfoot-barnabas-fast-light.json", "content/jesus/early-excerpts/lightfoot-barnabas-beast-covenant.json", "content/jesus/early-excerpts/lightfoot-barnabas-sheep-sun.json", "content/jesus/early-excerpts/lightfoot-barnabas-vessel-body.json", "content/jesus/early-excerpts/acts-thomas-groom-prayer.json", "content/jesus/early-excerpts/acts-thomas-creditor.json", "content/jesus/early-excerpts/acts-thomas-youth-light.json", "content/jesus/early-excerpts/acts-thomas-desert-temple.json", "content/jesus/early-excerpts/acts-thomas-oil-121.json", "content/jesus/early-excerpts/acts-thomas-open-treasury.json", "content/jesus/early-excerpts/acts-thomas-prayer-opening.json", "content/jesus/early-excerpts/acts-thomas-four-one.json", "content/jesus/early-excerpts/acts-thomas-mother-houses.json", "content/jesus/early-excerpts/acts-thomas-good-shepherd.json", "content/jesus/early-excerpts/acts-thomas-spirit-return.json", "content/jesus/early-excerpts/acts-thomas-hidden-mother.json", "content/jesus/early-excerpts/acts-thomas-dwelling-places.json", "content/jesus/early-excerpts/acts-thomas-eagle-dream.json", "content/jesus/early-excerpts/acts-thomas-life-loan.json", "content/jesus/early-excerpts/acts-thomas-bread-life.json", "content/jesus/early-excerpts/acts-thomas-crown.json", "content/jesus/early-excerpts/acts-thomas-wedding-invitation.json", "content/jesus/early-excerpts/acts-thomas-old-new-48.json", "content/jesus/early-excerpts/acts-thomas-lost-sheep.json", "content/jesus/early-excerpts/acts-thomas-old-new-58.json", "content/jesus/early-excerpts/acts-thomas-heat-day.json", "content/jesus/early-excerpts/acts-thomas-flock-wolves.json", "content/jesus/early-excerpts/acts-thomas-wolves-clothing.json", "content/jesus/early-excerpts/acts-thomas-stolen-thoughts.json", "content/jesus/early-excerpts/acts-thomas-physician-10.json", "content/jesus/early-excerpts/acts-thomas-birds.json", "content/jesus/early-excerpts/acts-thomas-wealth.json", "content/jesus/early-excerpts/acts-thomas-ask.json", "content/jesus/early-excerpts/acts-thomas-physician-95.json", "content/jesus/early-excerpts/acts-thomas-physician-143.json", "content/jesus/early-excerpts/acts-thomas-physician-156.json", "content/early-library/catalog.json", ...[...new Set([22, 33, 65, ...stories.map(story => story.saying)])].map(n => `content/early-library/readings/gospel-thomas/saying-${n}.json`), ...sections.map(s => `content/early-library/readings/secret-book-james/${s}.json`), "content/early-library/readings/gospel-philip/becoming-christians.json", "content/early-library/readings/gospel-philip/spiritual-growth.json", legacy, "public/early/texts/didache.json", "content/jesus/early-excerpts/eusebius-talents.json", "content/jesus/early-excerpts/acts-thomas-hymn.json", "content/jesus/early-excerpts/acts-thomas-bride.json", "content/jesus/early-excerpts/acts-thomas-palace.json", "content/jesus/early-excerpts/acts-thomas-prayer.json", "public/early/texts/barnabas.json", "public/early/texts/1clement.json", "content/jesus/early-excerpts/acts-thomas-marriage.json", "content/jesus/early-excerpts/acts-thomas-bride-response.json", "content/jesus/early-excerpts/acts-thomas-shepherd.json", "content/jesus/early-excerpts/acts-thomas-crowd.json", "content/jesus/early-excerpts/acts-thomas-bitter-tree.json", "content/jesus/early-excerpts/acts-thomas-yoke.json", "content/jesus/early-excerpts/acts-thomas-seed.json", "content/jesus/early-excerpts/acts-thomas-mygdonia-marriage.json", "content/jesus/early-excerpts/acts-thomas-soldiers.json", "content/jesus/early-excerpts/acts-thomas-tower.json", "content/jesus/early-excerpts/acts-thomas-oil.json"];

sources.push("content/early-library/readings/1-clement/1-clem-5.json", "content/early-library/readings/shepherd-hermas/vision-3-part-2.json", "content/early-library/readings/shepherd-hermas/another-parable-part-2.json");
const lightfoot = JSON.parse(await readFile(new URL("../../tests/fixtures/parables-audit-lightfoot.json", import.meta.url), "utf8"));
const eusebius = JSON.parse(await readFile(new URL("../../tests/fixtures/parables-audit-eusebius.json", import.meta.url), "utf8"));
sources.push(...lightfoot.selections.map(row => row.excerpt).filter(Boolean), ...eusebius.selections.map(row => row.path));

test("both traces contain the mapped sources and Parables excludes unrelated editions", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "thomas-trace-"));
  const write = async (file, content) => { await mkdir(path.dirname(path.join(root, file)), { recursive: true }); await writeFile(path.join(root, file), content); };
  const trace = async (name, files) => write(name, JSON.stringify({ files: files.map(file => path.relative(path.dirname(path.join(root, name)), path.join(root, file))) }));
  try {
    await write("public/jesus/parables.json", JSON.stringify([{ thomas: [{ saying: 65 }] }]));
    await write("public/jesus/synoptic-figures.json", JSON.stringify([{ thomas: [{ saying: 33 }] }]));
    await write("public/jesus/john-figures.json", JSON.stringify([]));
    await write("public/jesus/thomas-parables.json", JSON.stringify(stories));
    await write("public/jesus/james-parables.json", JSON.stringify(james));
    await write("public/jesus/early-figures.json", JSON.stringify(early));
    for (const file of sources) await write(file, "{}");
    for (const name of traces) await trace(name, sources);
    await trace(legacyTrace, [legacy]);
    assert.equal(await checkThomasParablesTrace(root), 20);
    for (const name of traces) {
      await trace(name, [sources[0]]);
      await assert.rejects(checkThomasParablesTrace(root), /missing Thomas source/);
      await trace(name, sources);
    }
    await trace(traces[0], [...sources, "content/early-library/readings/other/saying-1.json"]);
    await assert.rejects(checkThomasParablesTrace(root), /unrelated library edition/);
    await trace(traces[0], [...sources, "content/jesus/early-excerpts/unrelated.json"]);
    await assert.rejects(checkThomasParablesTrace(root), /unrelated early excerpt/);
    await trace(traces[0], [...sources, "scripts/example.mjs"]);
    await assert.rejects(checkThomasParablesTrace(root), /build-only project file/);
    await trace(traces[0], sources);
    for (const bad of [stories.filter(x => x.saying !== 97), [stories[0], stories[0], ...stories.slice(2)], [stories[0], { ...stories[1], title: "" }, ...stories.slice(2)]]) {
      await write("public/jesus/thomas-parables.json", JSON.stringify(bad));
      await assert.rejects(checkThomasParablesTrace(root), /Invalid Thomas-only/);
    }
    await write("public/jesus/thomas-parables.json", JSON.stringify(stories));
    for (const name of traces) {
      await trace(name, sources.filter(file => !file.endsWith("saying-33.json")));
      await assert.rejects(checkThomasParablesTrace(root), /missing Thomas source.*saying-33/);
      await trace(name, sources.filter(file => !file.endsWith("saying-97.json")));
      await assert.rejects(checkThomasParablesTrace(root), /missing Thomas source.*saying-97/);
      await trace(name, sources.filter(file => !file.endsWith("know-yourselves.json")));
      await assert.rejects(checkThomasParablesTrace(root), /missing James source.*know-yourselves/);
      await trace(name, sources.filter(file => !file.endsWith("being-filled.json")));
      await assert.rejects(checkThomasParablesTrace(root), /missing James source.*being-filled/);
      await trace(name, sources.filter(file => !file.endsWith("becoming-christians.json")));
      await assert.rejects(checkThomasParablesTrace(root), /missing Early source.*becoming-christians/);
      await trace(name, sources.filter(file => !file.endsWith("spiritual-growth.json")));
      await assert.rejects(checkThomasParablesTrace(root), /missing Early source.*spiritual-growth/);
      await trace(name, sources.filter(file => !file.endsWith("saying-22.json")));
      await assert.rejects(checkThomasParablesTrace(root), /missing Thomas source.*saying-22/);
      await trace(name, sources.filter(file => !file.endsWith("1-clem-5.json")));
      await assert.rejects(checkThomasParablesTrace(root), /missing Early source.*1-clem-5/);
      for (const section of ["vision-3-part-2.json", "another-parable-part-2.json"]) {
        await trace(name, sources.filter(file => !file.endsWith(section)));
        await assert.rejects(checkThomasParablesTrace(root), new RegExp(`missing Early source.*${section}`));
      }
      await trace(name, sources);
    }
    await trace(legacyTrace, []);
    await assert.rejects(checkThomasParablesTrace(root), /missing Epistula source/);
    await trace(legacyTrace, [legacy]);
    await trace(traces[0], sources.filter(file => !file.endsWith("acts-thomas-hymn.json")));
    await assert.rejects(checkThomasParablesTrace(root), /missing Early source.*acts-thomas-hymn/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
