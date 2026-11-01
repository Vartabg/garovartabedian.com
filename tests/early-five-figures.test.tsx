import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { EARLY_FIGURES, earlyFigureHref, earlyFigureParts, earlyDisplayBlocks } from "../src/lib/jesus/early-figures";
import { getEarlyFigureTexts } from "../src/lib/jesus/early-figures-server";
import { getLibraryPage } from "../src/lib/early/library-server";
import Reading from "../src/app/early/library/[edition]/[section]/page";
import { FIND_CATALOG } from "../src/lib/site/find-catalog";

const expected: Record<string, [string, string, number, number]> = {
  "acts-thomas-wedding-invitation": ["acts-thomas-wedding-invitation", "excerpt", 1, 1],
  "acts-thomas-old-new-48": ["acts-thomas-old-new-48", "excerpt", 1, 1],
  "acts-thomas-lost-sheep": ["acts-thomas-lost-sheep", "excerpt", 1, 1],
  "acts-thomas-old-new-58": ["acts-thomas-old-new-58", "excerpt", 1, 1],
  "acts-thomas-heat-day": ["acts-thomas-heat-day", "excerpt", 1, 1],
  "acts-thomas-flock-wolves": ["acts-thomas-flock-wolves", "excerpt", 1, 1],
  "acts-thomas-wolves-clothing": ["acts-thomas-wolves-clothing", "excerpt", 1, 1],
  "acts-thomas-stolen-thoughts": ["acts-thomas-stolen-thoughts", "excerpt", 1, 1],
  "barnabas-called-chosen": ["barnabas", "barn-4", 14, 14],
  "barnabas-bird-net": ["barnabas", "barn-5", 4, 4],
  "barnabas-shepherd-struck": ["barnabas", "barn-5", 12, 12],
  "barnabas-red-heifer": ["barnabas", "barn-8", 1, 7],
  "barnabas-thorns-heart": ["barnabas", "barn-9", 4, 4],
  "first-clement-scarlet-snow": ["1-clement", "1-clem-8", 3, 5],
  "first-clement-scarlet-thread": ["1-clement", "1-clem-12", 6, 8],
  "didache-four-winds": ["didache", "did-10", 17, 23],
  "diognetus-sojourners": ["diognetus", "diogn-5", 5, 9],
  "epistula-ten-virgins": ["epistula-apostolorum", "chapter-43", 1, 3],
  "clement-lambs-wolves": ["2-clement", "2-clem-5", 2, 4],
  "philip-pearl": ["gospel-philip", "becoming-christians", 5, 5],
  "philip-dyer": ["gospel-philip", "becoming-christians", 11, 11],
  "philip-blind-sighted": ["gospel-philip", "becoming-christians", 12, 12],
  "truth-sheep": ["gospel-truth", "the-parable-of-the-sheep", 1, 2],
  "truth-jars": ["gospel-truth", "the-parable-of-the-jars", 1, 2],
  "truth-nightmares": ["gospel-truth", "the-parable-of-the-nightmares", 1, 2],
  "hermas-elm-vine": ["shepherd-hermas", "another-parable", 1, 10],
  "hermas-vineyard-servant": ["shepherd-hermas", "another-parable", 27, 37],
  "hermas-tower": ["shepherd-hermas", "vision-3", 13, 21],
  "epistula-fingers-grain": ["epistula-apostolorum", "chapter-32", 1, 1],
  "epistula-blind-guides": ["epistula-apostolorum", "chapter-47", 1, 1],
  "clement-contest": ["2-clement", "2-clem-7", 1, 5],
  "clement-potter": ["2-clement", "2-clem-8", 1, 3],
  "clement-vine": ["2-clement", "2-clem-11", 2, 5],
  "clement-two-one": ["2-clement", "2-clem-12", 2, 6],
  "philip-householder-food": ["gospel-philip", "spiritual-growth", 2, 2],
  "philip-winter-summer": ["gospel-philip", "life-death-light-and-darkness", 1, 1],
  "philip-god-dyer": ["gospel-philip", "becoming-christians", 1, 1],
  "philip-root-evil": ["gospel-philip", "uprooting-evil", 2, 2],
  "truth-fruit-tree": ["gospel-truth", "the-gospel", 2, 2],
  "truth-unopened-will": ["gospel-truth", "the-gospel", 5, 7],
  "truth-fragrance": ["gospel-truth", "doing-the-father-s-will", 3, 3],
  "hermas-two-cities": ["shepherd-hermas", "parables-which-he-spake-with-me", 1, 11],
  "hermas-seasonal-trees": ["shepherd-hermas", "another-parable", 11, 21],
  "hermas-two-shepherds": ["shepherd-hermas", "parable-6", 1, 30],
  "hermas-willow": ["shepherd-hermas", "parable-8", 1, 56],
  "hermas-tower-expanded": ["shepherd-hermas", "parable-9", 1, 53],
  "hermas-wormwood-honey": ["shepherd-hermas", "mandate-5", 1, 6],
  "hermas-stone-water-hail": ["shepherd-hermas", "mandate-11", 18, 21],
  "didache-two-ways": ["didache", "s1", 1, 1],
  "barnabas-two-ways": ["barnabas", "barn-18", 1, 2],
  "didache-scattered-bread": ["didache", "did-9", 14, 19],
  "first-clement-vine": ["1-clement", "1-clem-23", 3, 4],
  "first-clement-seed": ["1-clement", "1-clem-24", 1, 5],
  "first-clement-army-body": ["1-clement", "1-clem-37", 1, 5],
  "diognetus-soul-body": ["diognetus", "diogn-6", 1, 10],
  "eusebius-talents": ["eusebius-talents", "excerpt", 1, 1],
  "acts-thomas-hymn": ["acts-thomas-hymn", "excerpt", 1, 1],
  "didache-watchful": ["didache", "s16", 1, 1],
  "barnabas-animals": ["barnabas", "s9", 1, 2],
  "barnabas-tree-water": ["barnabas", "barn-11", 6, 11],
  "barnabas-spiritual-temple": ["barnabas", "barn-16", 6, 10],
  "first-clement-phoenix": ["1-clement", "1-clem-25", 1, 5],
  "first-clement-gate": ["1-clement", "1-clem-48", 2, 4],
  "diognetus-king-son": ["diognetus", "diogn-7", 3, 4],
  "diognetus-garden": ["diognetus", "diogn-12", 1, 9],
  "acts-thomas-bride": ["acts-thomas-bride", "excerpt", 1, 1],
  "acts-thomas-palace": ["acts-thomas-palace", "excerpt", 1, 1],
  "acts-thomas-prayer": ["acts-thomas-prayer", "excerpt", 1, 1],
  "didache-vine": ["didache", "did-9", 2, 13],
  "didache-holy-dogs": ["didache", "did-9", 20, 20],
  "didache-workers": ["didache", "s13", 1, 1],
  "first-clement-measure": ["1-clement", "1-clem-13", 1, 2],
  "first-clement-millstone": ["1-clement", "s45", 1, 1],
  "first-clement-race": ["1-clement", "1-clem-6", 2, 4],
  "first-clement-harmony": ["1-clement", "s19", 1, 1],
  "barnabas-fountain": ["barnabas", "barn-11", 2, 3],
  "barnabas-cross-serpent": ["barnabas", "barn-12", 2, 7],
  "diognetus-exchange": ["diognetus", "diogn-9", 2, 6],
  "acts-thomas-marriage": ["acts-thomas-marriage", "excerpt", 1, 1],
  "acts-thomas-bride-response": ["acts-thomas-bride-response", "excerpt", 1, 1],
  "acts-thomas-shepherd": ["acts-thomas-shepherd", "excerpt", 1, 1],
  "acts-thomas-crowd": ["acts-thomas-crowd", "excerpt", 1, 1],
  "acts-thomas-bitter-tree": ["acts-thomas-bitter-tree", "excerpt", 1, 1],
  "acts-thomas-yoke": ["acts-thomas-yoke", "excerpt", 1, 1],
  "acts-thomas-seed": ["acts-thomas-seed", "excerpt", 1, 1],
  "acts-thomas-mygdonia-marriage": ["acts-thomas-mygdonia-marriage", "excerpt", 1, 1],
  "acts-thomas-soldiers": ["acts-thomas-soldiers", "excerpt", 1, 1],
  "acts-thomas-tower": ["acts-thomas-tower", "excerpt", 1, 1],
  "acts-thomas-oil": ["acts-thomas-oil", "excerpt", 1, 1],
  "acts-thomas-physician-10": ["acts-thomas-physician-10", "excerpt", 1, 1],
  "acts-thomas-birds": ["acts-thomas-birds", "excerpt", 1, 1],
  "acts-thomas-wealth": ["acts-thomas-wealth", "excerpt", 1, 1],
  "acts-thomas-ask": ["acts-thomas-ask", "excerpt", 1, 1],
  "acts-thomas-physician-95": ["acts-thomas-physician-95", "excerpt", 1, 1],
  "acts-thomas-physician-143": ["acts-thomas-physician-143", "excerpt", 1, 1],
  "acts-thomas-physician-156": ["acts-thomas-physician-156", "excerpt", 1, 1],
  "first-clement-workers": ["1-clement", "1-clem-34", 1, 4],
  "first-clement-mirror": ["1-clement", "1-clem-36", 1, 2],
  "barnabas-cornerstone": ["barnabas", "s5", 1, 1],
  "barnabas-milk-honey": ["barnabas", "barn-6", 8, 17],
  "barnabas-goats-thorns": ["barnabas", "barn-7", 6, 11],
  "diognetus-burden": ["diognetus", "diogn-10", 4, 6],

};

test("selected passages match the hosted text and rendered reader anchors", async () => {
  const texts = await getEarlyFigureTexts();
  assert.equal(EARLY_FIGURES.length, Object.keys(expected).length);
  for (const figure of EARLY_FIGURES) {
    assert.deepEqual([figure.edition, figure.section, figure.start, figure.end], expected[figure.id]);
    assert.ok(figure.speaker && figure.translator);
    assert.ok(FIND_CATALOG.some(item => item.href === `/jesus/parables#parable-${figure.id}` && /outside the canon/.test(item.note)));
    const blocks: string[] = [];
    for (const part of earlyFigureParts(figure)) {
      if (figure.excerpt) {
        const source = JSON.parse(await readFile(`content/jesus/early-excerpts/${figure.edition}.json`, "utf8"));
        blocks.push(...source.blocks.map((block: { text: string }) => block.text));
        assert.match(earlyFigureHref(figure, part), /^https:\/\//);
      } else if (figure.legacy && (figure.edition === "didache" || figure.edition === "barnabas" || figure.legacyText === "1clement")) {
        const source = JSON.parse(await readFile(`public/early/texts/${figure.legacyText ?? figure.edition}.json`, "utf8"));
        blocks.push(...source.sections[Number(part.section.slice(1))].paragraphs.slice(part.start - 1, part.end));
        assert.equal(earlyFigureHref(figure, part), `/early/${figure.legacyText ?? figure.edition}#${part.section}`);
      } else if (figure.legacy) {
        const source = JSON.parse(await readFile("public/early/texts/epistula-apostolorum.json", "utf8"));
        const section = source.sections.find((s: { heading: string }) => s.heading === `Chapter ${part.section.slice(8)}`);
        blocks.push(...section.paragraphs.slice(part.start - 1, part.end));
        assert.equal(earlyFigureHref(figure, part), `/early/epistula-apostolorum#${part.section}`);
      } else {
        const page = (await getLibraryPage(figure.edition, part.section))!;
        blocks.push(...page.blocks.slice(part.start - 1, part.end).map(block => block.text));
        const doc = new JSDOM(renderToStaticMarkup(await Reading({ params: Promise.resolve({ edition: figure.edition, section: part.section }) }))).window.document;
        for (let n = part.start; n <= part.end; n++) assert.ok(doc.querySelector(`#p${n}`), `${figure.id} #p${n}`);
        assert.equal(earlyFigureHref(figure, part), `/early/library/${figure.edition}/${part.section}#p${part.start}`);
      }
    }
    assert.deepEqual(texts[figure.id], blocks);
  }
});

test("unavailable, changed, unpublished, malformed and invalid sources fail independently", async () => {
  const clement = EARLY_FIGURES.find(x => x.id === "clement-lambs-wolves")!;
  const philip = EARLY_FIGURES.find(x => x.id === "philip-pearl")!;
  for (const mode of ["missing", "changed", "unpublished", "malformed", "bounds"]) {
    const load = async (file: string) => {
      const raw = await readFile(file, "utf8");
      if (mode === "unpublished" && file.endsWith("catalog.json")) {
        const catalog = JSON.parse(raw); catalog.find((x: { id: string }) => x.id === "2-clement").publicationStatus = "deferred"; return JSON.stringify(catalog);
      }
      if (!file.endsWith("2-clem-5.json")) return raw;
      if (mode === "missing") throw new Error("missing");
      if (mode === "malformed") return "{";
      if (mode === "changed") { const page = JSON.parse(raw); page.blocks[1].text = page.blocks[1].text.replace("Lord", "Lard"); return JSON.stringify(page); }
      return raw;
    };
    const texts = await getEarlyFigureTexts([mode === "bounds" ? { ...clement, end: 99 } : clement, philip], load, () => {});
    assert.equal(texts[clement.id], null, mode);
    assert.ok(texts[philip.id], mode);
  }
});


test("multipart boundaries join only when source blocks split a sentence", async () => {
  const texts = await getEarlyFigureTexts();
  assert.deepEqual(earlyFigureParts(EARLY_FIGURES.find(item => item.id === "epistula-ten-virgins")!), [
    { section: "chapter-43", start: 1, end: 3 }, { section: "chapter-44", start: 1, end: 1 }, { section: "chapter-45", start: 1, end: 1 },
  ]);
  assert.deepEqual(earlyFigureParts(EARLY_FIGURES.find(item => item.id === "hermas-willow")!), [
    { section: "parable-8", start: 1, end: 56 }, { section: "parable-8-part-2", start: 1, end: 19, joinPrevious: true },
  ]);
  assert.deepEqual(earlyFigureParts(EARLY_FIGURES.find(item => item.id === "hermas-tower-expanded")!), [
    { section: "parable-9", start: 1, end: 53 }, { section: "parable-9-part-2", start: 1, end: 49 },
    { section: "parable-9-part-3", start: 1, end: 48, joinPrevious: true }, { section: "parable-9-part-4", start: 1, end: 48, joinPrevious: true },
  ]);
  for (const id of ["hermas-willow", "hermas-tower-expanded"]) {
    const figure = EARLY_FIGURES.find(item => item.id === id)!;
    const raw = texts[id]!; const shown = earlyDisplayBlocks(figure, raw);
    const joined = earlyFigureParts(figure).filter(part => part.joinPrevious).length;
    assert.equal(shown.length, raw.length - joined);
    let offset = 0;
    for (const [index, part] of earlyFigureParts(figure).entries()) {
      if (index && part.joinPrevious) assert.ok(shown.includes(raw[offset - 1] + raw[offset]));
      offset += part.end - part.start + 1;
    }
  }
  assert.match(EARLY_FIGURES.find(f => f.id === "hermas-willow")!.speaker, /Michael/);
  assert.match(EARLY_FIGURES.find(f => f.id === "hermas-tower-expanded")!.speaker, /virgins and the six men/);
});

test("a missing or malformed later part fails the whole selection", async () => {
  const willow = EARLY_FIGURES.find(f => f.id === "hermas-willow")!;
  const other = EARLY_FIGURES.find(f => f.id === "philip-pearl")!;
  for (const mode of ["missing", "malformed", "changed", "duplicate", "range"]) {
    const load = async (file: string) => {
      const raw = await readFile(file, "utf8");
      if (mode === "duplicate" && file.endsWith("catalog.json")) { const cat = JSON.parse(raw); const record = cat.find((r: { id: string }) => r.id === "shepherd-hermas"); record.sections.push(record.sections.find((s: { id: string }) => s.id === "parable-8-part-2")); return JSON.stringify(cat); }
      if (!file.endsWith("parable-8-part-2.json")) return raw;
      if (mode === "missing") throw Error("missing");
      if (mode === "malformed") return "{";
      if (mode === "changed") { const page = JSON.parse(raw); page.blocks[0].text = page.blocks[0].text.replace("therefore", "thereFore"); return JSON.stringify(page); }
      return raw;
    };
    const broken = mode === "range" ? { ...willow, parts: willow.parts!.map((part, i) => i ? { ...part, end: 200 } : part) } : willow;
    const found = await getEarlyFigureTexts([broken, other], load, () => {});
    assert.equal(found[willow.id], null, mode); assert.ok(found[other.id], mode);
    assert.equal(earlyFigureParts(broken).length, 2);
  }
});

test("new excerpt sources fail closed independently and preserve their source links", async () => {
  const hymn = EARLY_FIGURES.find(item => item.id === "acts-thomas-hymn")!;
  const other = EARLY_FIGURES.find(item => item.id === "first-clement-seed")!;
  for (const mode of ["missing", "malformed", "changed", "extra-block"]) {
    const load = async (file: string) => {
      if (!file.endsWith("acts-thomas-hymn.json")) return readFile(file, "utf8");
      if (mode === "missing") throw new Error("missing");
      if (mode === "malformed") return "{";
      const data = JSON.parse(await readFile(file, "utf8"));
      if (mode === "extra-block") data.blocks.push(data.blocks[0]);
      else data.blocks[0].text += " changed";
      return JSON.stringify(data);
    };
    const result = await getEarlyFigureTexts([hymn, other], load, () => {});
    assert.equal(result[hymn.id], null); assert.ok(result[other.id]);
    assert.match(earlyFigureHref(hymn), /^https:\/\//);
  }
  const text = (await getEarlyFigureTexts())[hymn.id]![0];
  assert.equal(text.split("\n").length, 105);
  assert.match(text, /^1 When I was an infant child/);
  assert.match(text, /\n105 .*before the king\.$/);
});

test("new comparisons preserve every intended Gospel target and manuscript attribution", () => {
  const expectedTargets: Record<string, string[]> = {
    "didache-watchful": ["watchful-servants", "synoptic-lambs-wolves", "ten-virgins"],
    "barnabas-tree-water": ["synoptic-trees-fruit"],
    "first-clement-gate": ["john-sheepfold-shepherd"],
    "acts-thomas-bride": ["wedding-banquet"],
    "acts-thomas-prayer": ["weeds-among-wheat", "john-vine-branches", "talents-and-pounds", "wedding-banquet", "watchful-servants", "john-fields-harvest"],
  };
  for (const [id, targets] of Object.entries(expectedTargets)) {
    const figure = EARLY_FIGURES.find(item => item.id === id)!;
    assert.deepEqual([figure.related, ...(figure.relatedAlso ?? [])], targets);
    assert.equal(new Set(targets).size, targets.length);
    assert.ok(figure.note);
  }
  assert.match(EARLY_FIGURES.find(item => item.id === "acts-thomas-prayer")!.note!, /manuscript U/);
  assert.match(EARLY_FIGURES.find(item => item.id === "barnabas-animals")!.note!, /false/);
  assert.match(EARLY_FIGURES.find(item => item.id === "first-clement-phoenix")!.note!, /legend/);
});

test("Acts excerpts retain the checked passage boundaries and James's supplied word", async () => {
  const texts = await getEarlyFigureTexts();
  const bride = texts["acts-thomas-bride"]![0];
  assert.ok(bride.startsWith("The damsel is the daughter of light"));
  assert.ok(bride.includes("<garlands> of all manner of odorous flowers"));
  assert.ok(bride.endsWith("the Father of truth and the mother of wisdom."));
  const palace = texts["acts-thomas-palace"]![0];
  assert.ok(palace.startsWith("17 Now when the apostle was come into the cities of India"));
  assert.ok(palace.endsWith("the things that were shown unto me by his angels."));
  const prayer = texts["acts-thomas-prayer"]![0];
  assert.ok(prayer.startsWith("145 My mouth sufficeth not to praise thee"));
  assert.ok(prayer.includes("(U omits practically all this chapter.)"));
});

test("a missing or malformed shared catalog leaves all selections unavailable with their links intact", async () => {
  const figures = ["didache-vine", "first-clement-harmony", "acts-thomas-tower"].map(id => EARLY_FIGURES.find(item => item.id === id)!);
  for (const mode of ["missing", "malformed"]) {
    const load = async (file: string) => {
      if (file.endsWith("catalog.json")) {
        if (mode === "missing") throw new Error("missing");
        return "{";
      }
      return readFile(file, "utf8");
    };
    const result = await getEarlyFigureTexts(figures, load, () => {});
    for (const figure of figures) {
      assert.equal(result[figure.id], null, `${mode}: ${figure.id}`);
      assert.ok(earlyFigureHref(figure));
    }
  }
});

test("new Acts passages preserve independently checked printed boundaries and supplied words", async () => {
  const texts = await getEarlyFigureTexts();
  const bounds: Record<string, [string, string]> = {
    "acts-thomas-physician-10": ["10 And the apostle stood", "left them in that place and departed."],
    "acts-thomas-birds": ["28 And the apostle ceased", "implant his sign in your souls."],
    "acts-thomas-wealth": ["36 And when the apostle had said this", "he permitteth thee not to turn thyself away."],
    "acts-thomas-ask": ["53 And the apostle said to him", "the glory and faith of them that stand by."],
    "acts-thomas-physician-95": ["95 But Charisius", "Call her to dinner. But she would not come."],
    "acts-thomas-physician-143": ["143 And as the apostle spake", "turneth away his subjects, that they should not use them."],
    "acts-thomas-physician-156": ["156 And then Judas began to pray", "let thine holy spirit dwell in them."],
  };
  for (const [id, [start, end]] of Object.entries(bounds)) {
    const value = texts[id]![0]; assert.ok(value.startsWith(start), id); assert.ok(value.endsWith(end), id);
  }
  assert.match(texts["acts-thomas-physician-143"]![0], /physician of all <diseases>/);
  assert.match(texts["acts-thomas-physician-95"]![0], /physician of souls/);
  assert.match(EARLY_FIGURES.find(f => f.id === "acts-thomas-physician-95")!.speaker, /Mygdonia and Charisius/);
  assert.match(texts["barnabas-cornerstone"]![0], /foundations of Zion/);
});

test("new source failures remain independent and keep source links and notes", async () => {
  const figures = ["acts-thomas-birds", "first-clement-workers", "barnabas-cornerstone"].map(id => EARLY_FIGURES.find(f => f.id === id)!);
  const other = EARLY_FIGURES.find(f => f.id === "philip-pearl")!;
  for (const figure of figures) for (const mode of ["missing", "malformed", "changed", ...(figure.id === "barnabas-cornerstone" ? ["heading"] : [])]) {
    const filename = figure.excerpt ? `${figure.edition}.json` : figure.legacy ? "barnabas.json" : `${figure.section}.json`;
    const load = async (file: string) => {
      if (!file.endsWith(filename)) return readFile(file, "utf8");
      if (mode === "missing") throw Error("missing");
      if (mode === "malformed") return "{";
      const data = JSON.parse(await readFile(file, "utf8"));
      if (mode === "heading") data.sections[5].heading = "wrong chapter";
      else if (figure.legacy) data.sections[5].paragraphs[0] += " changed";
      else data.blocks[0].text += " changed";
      return JSON.stringify(data);
    };
    const result = await getEarlyFigureTexts([figure, other], load, () => {});
    assert.equal(result[figure.id], null, `${figure.id}: ${mode}`); assert.ok(result[other.id]);
    assert.ok(earlyFigureHref(figure)); assert.ok(figure.note);
  }
});

test("the new selections preserve their speakers, images and comparison boundaries", async () => {
  const texts = await getEarlyFigureTexts();
  const cases: Record<string, [RegExp, RegExp, string?]> = {
    "acts-thomas-wedding-invitation": [/king hath sent heralds/i, /narrator.*townspeople/i, "wedding-banquet"],
    "acts-thomas-old-new-48": [/put off the old man.*put on the new/i, /Thomas prays/i],
    "acts-thomas-lost-sheep": [/sheep that have gone astray/i, /woman.*vision/i, "lost-sheep"],
    "acts-thomas-old-new-58": [/put off.*old man.*put on the new/i, /Thomas addresses/i],
    "acts-thomas-heat-day": [/burden and heat of the day/i, /Thomas prays/i, "workers-in-vineyard"],
    "acts-thomas-flock-wolves": [/flock of Xenophon.*ravening wolves/i, /Thomas prays/i, "synoptic-lambs-wolves"],
    "acts-thomas-wolves-clothing": [/sheep’s clothing.*ravening wolves/i, /wild ass/i, "synoptic-trees-fruit"],
    "acts-thomas-stolen-thoughts": [/catch away your thoughts/i, /Thomas speaks/i, "sower"],
    "barnabas-called-chosen": [/many are called but few are chosen/i, /author quotes/i, "wedding-banquet"],
    "barnabas-bird-net": [/net spread for the birds/i, /author quotes/i, "net"],
    "barnabas-shepherd-struck": [/smite their own shepherd.*sheep/i, /author quotes/i, "synoptic-shepherd-struck"],
    "barnabas-red-heifer": [/heifer/i, /author interprets/i],
    "barnabas-thorns-heart": [/sow not upon thorns/i, /author quotes/i, "sower"],
    "first-clement-scarlet-snow": [/scarlet.*snow/i, /author quotes/i],
    "first-clement-scarlet-thread": [/scarlet thread/i, /author recounts/i],
    "didache-four-winds": [/four winds/i, /prayer/i, "synoptic-four-winds"],
    "diognetus-sojourners": [/sojourners.*citizenship is in heaven/i, /author describes/i],
  };
  for (const [id, [image, speaker, related]] of Object.entries(cases)) {
    const figure = EARLY_FIGURES.find(item => item.id === id)!;
    assert.match(texts[id]!.join(" "), image, id);
    assert.match(figure.speaker, speaker, id);
    assert.ok(figure.note, id);
    if (related) assert.equal(figure.related, related, id);
  }
  assert.match(EARLY_FIGURES.find(item => item.id === "acts-thomas-lost-sheep")!.note!, /does not/i);
  assert.match(EARLY_FIGURES.find(item => item.id === "barnabas-bird-net")!.note!, /different/i);
});
