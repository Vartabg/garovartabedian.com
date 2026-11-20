import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { getLibraryPage } from "../src/lib/early/library-server";
import { getThomasTexts } from "../src/lib/jesus/thomas-parallels-server";
import { getJamesTexts } from "../src/lib/jesus/james-parables-server";
import { JAMES_PARABLES, jamesHref } from "../src/lib/jesus/james-parables";
import { EARLY_FIGURES, earlyFigureHref, earlyFigureParts } from "../src/lib/jesus/early-figures";
import { getEarlyFigureTexts, getEarlyOriginalReaderAvailability } from "../src/lib/jesus/early-figures-server";
import { THOMAS_PARABLES } from "../src/lib/jesus/thomas-parables";
import ParablesRoom from "../src/app/jesus/parables/ParablesRoom";
import type { PassageVerses } from "../src/lib/jesus/client";
import { getParables } from "../src/lib/jesus/server";
import { SYNOPTIC_FIGURES } from "../src/lib/jesus/synoptic-figures";
import { JOHN_FIGURES } from "../src/lib/jesus/john-figures";
import type { Parable } from "../src/lib/jesus/types";
import { parseRef } from "../src/lib/scriptures/refs";
import type { Canons } from "../src/lib/scriptures/types";
import parablesJson from "../public/jesus/parables.json" with { type: "json" };
import canonsJson from "../public/scriptures/canons.json" with { type: "json" };
import round3Comparisons from "../scripts/release/early-round3-comparisons.json" with { type: "json" };
import audit from "./fixtures/parables-audit-gospel-thomas.json" with { type: "json" };
import eusebiusAudit from "./fixtures/parables-audit-eusebius.json" with { type: "json" };
import { validateGospelThomasAudit } from "../scripts/release/check-staged-thomas.mjs";

const parables = parablesJson as Parable[];
const canons = canonsJson as Canons;
const GOSPELS = ["MAT", "MRK", "LUK", "JHN"];

const webCache = new Map<string, { chapters: string[][] }>();
const web = (book: string) => {
  if (!webCache.has(book)) {
    webCache.set(book, JSON.parse(readFileSync(`public/scriptures/text/web/${book}.json`, "utf8")));
  }
  return webCache.get(book)!;
};
const greek = (book: string, chapter: number) =>
  JSON.parse(readFileSync(`public/scriptures/original/${book}/${chapter}.json`, "utf8")) as {
    verses: { number: number; words: { lemma: string }[] }[];
  };

const refsOf = (parable: Parable) =>
  parable.accounts.flatMap((account) =>
    [account.setting, account.ref, account.explanation, account.called].filter((ref): ref is string => Boolean(ref)),
  );

describe("parables data", () => {
  it("matches all 54 independent Gospel dispositions, the added vipers figure, and 46 Thomas candidates", () => {
    validateGospelThomasAudit(audit, {
      "public/jesus/parables.json": parables,
      "public/jesus/synoptic-figures.json": SYNOPTIC_FIGURES,
      "public/jesus/john-figures.json": JOHN_FIGURES,
      "public/jesus/thomas-parables.json": THOMAS_PARABLES,
      "public/jesus/james-parables.json": JAMES_PARABLES,
      "public/jesus/early-figures.json": EARLY_FIGURES,
    });
  });
  it("holds the 31 stories from Snodgrass and Trench and the 7 sayings the Gospels call parables", () => {
    assert.equal(parables.length, 38);
    assert.equal(parables.filter((p) => p.kind === "story").length, 31);
    assert.equal(parables.filter((p) => p.kind === "saying").length, 7);
    assert.equal(new Set(parables.map((p) => p.id)).size, parables.length);
  });

  it("names a source for every story and none for a saying", () => {
    for (const p of parables) {
      if (p.kind === "story") {
        assert.ok(p.snodgrass || p.trench.length, `${p.id} names Snodgrass or Trench`);
      } else {
        assert.equal(p.snodgrass, null, `${p.id} is in neither book`);
        assert.deepEqual(p.trench, [], `${p.id} is in neither book`);
        assert.ok(p.accounts.some((a) => a.called), `${p.id} says where the Gospel calls it a parable`);
      }
    }
  });

  it("keeps the selected John figures distinct, ordered, and in the hosted text", () => {
    const expected: Record<string, string[]> = {
      "john-temple": ["JHN 2:19-21"], "john-born-anew": ["JHN 3:3-7"], "john-wind": ["JHN 3:8"],
      "john-bronze-serpent": ["JHN 3:14-15"], "john-bridegrooms-friend": ["JHN 3:29"], "john-living-water": ["JHN 4:13-14"],
      "john-fields-harvest": ["JHN 4:35-38"], "john-father-son": ["JHN 5:19-23"],
      "john-burning-lamp": ["JHN 5:35"], "john-bread-of-life": ["JHN 6:32-40", "JHN 6:48-51", "JHN 6:52-58"],
      "john-servant-son": ["JHN 8:31-36"], "john-work-by-day": ["JHN 9:4"],
      "john-sheepfold-shepherd": ["JHN 10:1-18"], "john-daylight": ["JHN 11:9-10"],
      "john-grain-wheat": ["JHN 12:24"], "john-walking-light": ["JHN 8:12", "JHN 12:35"],
      "john-servant-master": ["JHN 13:16", "JHN 15:20"], "john-preparing-place": ["JHN 14:1-4"],
      "john-vine-branches": ["JHN 15:1-8"], "john-woman-childbirth": ["JHN 16:20-24"],
      "john-father-son-dwelling": ["JHN 14:23"],
    };
    for (const item of audit.gospel_candidates.filter(item => item.file.endsWith("john-figures.json") && (item.status === "new" || item.status === "new_followup"))) expected[item.id] = item.accounts.map(a => a.ref);
    expected["john-lamb-god"] = ["JHN 1:29"];
    assert.deepEqual(JOHN_FIGURES.map(p => p.id), Object.keys(expected));
    const ids = [...parables, ...THOMAS_PARABLES, ...JOHN_FIGURES, ...SYNOPTIC_FIGURES].map(p => p.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const figure of JOHN_FIGURES) {
      assert.deepEqual(figure.accounts.map(a => a.ref), expected[figure.id]);
      for (const account of figure.accounts) {
        const ref = parseRef(account.ref)!;
        assert.equal(ref.book, "JHN");
        assert.ok(web("JHN").chapters[ref.chapter - 1]?.[ref.verse - 1]);
        assert.ok(web("JHN").chapters[ref.chapter - 1]?.[(ref.endVerse ?? ref.verse) - 1]);
      }
    }
    assert.equal(JOHN_FIGURES.find(p => p.id === "john-bridegrooms-friend")?.speaker, "John the Baptist");
  });

  it("includes each selected Synoptic figure and every hosted verse", async () => {
    const expected: Record<string, string[]> = {
      "synoptic-salt": ["MAT 5:13", "MRK 9:50", "LUK 14:34-35"],
      "synoptic-lamp": ["MAT 5:15", "MRK 4:21", "LUK 8:16", "LUK 11:33"],
      "synoptic-lambs-wolves": ["MAT 10:16", "LUK 10:3"],
      "synoptic-axe-root": ["MAT 3:10", "LUK 3:9"],
      "synoptic-before-judge": ["MAT 5:25-26", "LUK 12:58-59"],
      "synoptic-two-masters": ["MAT 6:24", "LUK 16:13"],
      "synoptic-speck-plank": ["MAT 7:3-5", "LUK 6:41-42"],
      "synoptic-good-gifts": ["MAT 7:9-11", "LUK 11:11-13"],
      "synoptic-trees-fruit": ["MAT 7:15-20", "LUK 6:43-45"],
      "synoptic-wedding-guests": ["MAT 9:15", "MRK 2:19-20", "LUK 5:34-35"],
      "synoptic-children-marketplace": ["MAT 11:16-19", "LUK 7:31-35"],
      "synoptic-sheep-pit": ["MAT 12:11-12"],
      "synoptic-unclean-spirit": ["MAT 12:43-45", "LUK 11:24-26"],
      "synoptic-new-old-treasures": ["MAT 13:52"],
      "synoptic-camel-needle": ["MAT 19:23-24", "MRK 10:23-25", "LUK 18:24-25"],
      "synoptic-doorkeeper": ["MRK 13:33-37", "LUK 12:35-38"],
      "synoptic-physician": ["LUK 4:23"], "synoptic-closed-door": ["LUK 13:24-30"],
      "synoptic-holy-dogs": ["MAT 7:6"],
      "synoptic-measure": ["MAT 7:1-2", "MRK 4:24-25", "LUK 6:37-38"],
      "synoptic-worker-wages": ["MAT 10:9-10", "LUK 10:7"],
      "synoptic-yoke": ["MAT 11:28-30"],
      "synoptic-millstone": ["MAT 18:6-7", "MRK 9:42", "LUK 17:1-2"],
      "synoptic-birds-provision": ["MAT 6:25-34", "LUK 12:22-31"],
      "synoptic-ask-seek": ["MAT 7:7-8", "LUK 11:9-10"],
      "synoptic-physician-sick": ["MAT 9:12-13", "MRK 2:17", "LUK 5:31-32"],
      "synoptic-fine-clothing": ["MAT 11:7-8", "LUK 7:24-25"],
      "synoptic-shepherd-struck": ["MAT 26:31", "MRK 14:27"],
      "synoptic-four-winds": ["MAT 24:31", "MRK 13:27"],
      "synoptic-lips-heart": ["MAT 15:7-9", "MRK 7:6-7"],
      "synoptic-isaiah-release": ["LUK 4:16-21"],
      "synoptic-lot-wife": ["LUK 17:28-32"],
      "synoptic-treasures-heaven": ["MAT 6:19-21", "LUK 12:33-34"],
      "synoptic-left-home": ["MAT 19:27-29", "MRK 10:28-30"],
    };
    for (const item of audit.gospel_candidates.filter(item => item.file.endsWith("synoptic-figures.json") && (item.status === "new" || item.status === "new_followup"))) expected[item.id] = item.accounts.map(a => a.ref);
    expected["synoptic-trees-fruit"] = ["MAT 7:15-20", "LUK 6:43-45", "MAT 12:33"];
    expected["synoptic-peter-rock-keys"] = ["MAT 16:18-19"];
    expected["synoptic-disciple-teacher"] = ["MAT 10:24-25", "LUK 6:40"];
    expected["synoptic-coming-lightning"] = ["MAT 24:23-27", "LUK 17:23-24"];
    expected["synoptic-east-west-feast"] = ["MAT 8:11-12", "LUK 13:28-29"];
    expected["synoptic-lost-sheep-israel"] = ["MAT 10:5-6", "MAT 15:24"];
    assert.deepEqual(SYNOPTIC_FIGURES.map(p => p.id), Object.keys(expected));
    for (const figure of SYNOPTIC_FIGURES) {
      assert.deepEqual(figure.accounts.map(a => a.ref), expected[figure.id]);
      for (const account of figure.accounts) {
        const ref = parseRef(account.ref)!;
        assert.ok(["MAT", "MRK", "LUK"].includes(ref.book));
        const chapter = web(ref.book).chapters[ref.chapter - 1];
        for (let verse = ref.verse; verse <= (ref.endVerse ?? ref.verse); verse++) assert.ok(chapter?.[verse - 1], `${figure.id} ${account.ref}:${verse}`);
      }
    }
    const lamp = SYNOPTIC_FIGURES.find(p => p.id === "synoptic-lamp")!;
    const masters = SYNOPTIC_FIGURES.find(p => p.id === "synoptic-two-masters")!;
    assert.deepEqual(lamp.thomas?.map(t => t.saying), [33]);
    assert.deepEqual(masters.thomas?.map(t => t.saying), [47]);
    const texts = await getThomasTexts([lamp, masters]);
    assert.match(texts[33]!.join(" "), /lamp.*basket.*stand/i);
    assert.match(texts[47]!.join(" "), /servant.*two leaders/i);
  });

  it("resolves every reference to hosted text in a Gospel", () => {
    for (const p of parables) {
      for (const ref of refsOf(p)) {
        const parsed = parseRef(ref);
        assert.ok(parsed, `${p.id}: ${ref} parses`);
        assert.ok(GOSPELS.includes(parsed.book), `${p.id}: ${ref} is in a Gospel`);
        const chapter = web(parsed.book).chapters[parsed.chapter - 1];
        assert.ok(chapter?.[parsed.verse - 1], `${p.id}: ${ref} starts on a hosted verse`);
        assert.ok(chapter?.[(parsed.endVerse ?? parsed.verse) - 1], `${p.id}: ${ref} ends on a hosted verse`);
      }
    }
  });

  it("links each sourced Thomas comparison to hosted primary text", async () => {
    const expected: Record<string, [number, RegExp][]> = {
      "new-patch-new-wine": [[47, /new wine.*old wineskins/i]],
      "divided-house": [[35, /house of the strong/i]],
      sower: [[9, /sower/i]], "weeds-among-wheat": [[57, /weeds/i]],
      "mustard-seed": [[20, /mustard seed/i]], leaven: [[96, /yeast/i]],
      "hidden-treasure": [[109, /treasure/i]], pearl: [[76, /pearl/i]], net: [[8, /net/i]],
      "blind-guide": [[34, /blind/i]], "what-defiles": [[14, /mouth.*defile/i]],
      "lost-sheep": [[107, /sheep/i]], "workers-in-vineyard": [[4, /first will be last/i]],
      "wicked-tenants": [[65, /vineyard/i], [66, /stone the builders rejected/i]],
      "wedding-banquet": [[64, /dinner/i], [75, /door.*bridal chamber/i]], "watchful-servants": [[21, /bandit/i], [103, /bandits/i]],
      "ten-virgins": [[75, /door.*bridal chamber/i]], "tower-and-king": [[98, /sword.*strong enough/i]],
      "talents-and-pounds": [[41, /given more/i]], "seed-growing": [[21, /sickle.*harvest/i]],
      "rich-fool": [[63, /rich man/i], [72, /inheritance/i]], "unjust-steward": [[47, /servant.*two leaders/i]],
    };
    assert.deepEqual(parables.filter(p => p.thomas?.length).map(p => p.id).sort(), Object.keys(expected).sort());
    for (const p of parables.filter(p => p.thomas?.length)) {
      assert.deepEqual(p.thomas!.map(t => t.saying), expected[p.id].map(([n]) => n), p.id);
      assert.equal(new Set(p.thomas!.map(t => t.saying)).size, p.thomas!.length, p.id);
      for (const [saying, wording] of expected[p.id]) {
        const page = await getLibraryPage("gospel-thomas", `saying-${saying}`);
        assert.ok(page, `${p.id}: Thomas ${saying} exists`);
        assert.match(page.blocks.filter(b => b.kind === "primary-text").map(b => b.text).join(" "), wording, p.id);
      }
    }
  });

  it("identifies the specific biblical passages for related sayings and images", () => {
    const notes: Record<string, [number, string][]> = {
      "workers-in-vineyard": [[4, "Matthew 20:16"]],
      "unjust-steward": [[47, "Luke 16:13"]],
      "ten-virgins": [[75, "Matthew 25:10"]],
      "wedding-banquet": [[75, "Matthew 22:14"]],
      "tower-and-king": [[98, "Luke 14:28–32"]],
      "wicked-tenants": [[66, "Matthew 21:42"], [66, "Mark 12:10–11"], [66, "Luke 20:17"]],
      "watchful-servants": [[21, "Matthew 24:43"], [103, "Luke 12:39"]],
      "talents-and-pounds": [[41, "Matthew 25:29"], [41, "Luke 19:26"]],
      "seed-growing": [[21, "Mark 4:29"]],
    };
    for (const [id, pairs] of Object.entries(notes)) {
      const parable = parables.find(p => p.id === id)!;
      for (const [saying, ref] of pairs) assert.ok(parable.thomas?.find(t => t.saying === saying)?.note?.includes(ref), `${id}: Thomas ${saying} should identify ${ref}`);
    }
  });

  it("keeps each new comparison within the actual Gospel account", () => {
    const cases: [string, number, string, number, number, RegExp][] = [
      ["workers-in-vineyard", 4, "MAT", 20, 16, /first last/i],
      ["wedding-banquet", 75, "MAT", 22, 14, /many are called.*few chosen/i],
      ["ten-virgins", 75, "MAT", 25, 10, /wedding feast.*door was shut/i],
      ["tower-and-king", 98, "LUK", 14, 31, /consider whether he is able/i],
      ["unjust-steward", 47, "LUK", 16, 13, /servant.*serve two masters/i],
    ];
    for (const [id, saying, book, chapter, verse, wording] of cases) {
      const parable = parables.find(p => p.id === id)!;
      assert.ok(parable.thomas?.some(t => t.saying === saying));
      assert.ok(parable.accounts.some(account => {
        const ref = parseRef(account.ref);
        return ref?.book === book && ref.chapter === chapter && ref.verse <= verse && (ref.endVerse ?? ref.verse) >= verse;
      }), `${id}: ${book} ${chapter}:${verse} is in the account`);
      assert.match(web(book).chapters[chapter - 1][verse - 1], wording);
    }
  });

  it("offers the comparison links without JavaScript", () => {
    const available = Object.fromEntries(EARLY_FIGURES.filter(item => item.originalReader).flatMap(item => [[item.id, true], [`${item.id}:continuation`, true]]));
    const html = renderToStaticMarkup(<ParablesRoom parables={getParables()} thomasStories={THOMAS_PARABLES} counts={{}} canons={canons} originalEditions={{}} earlyReaderAvailability={available} />);
    const doc = new JSDOM(html).window.document;
    const fallback = doc.querySelector("noscript section")!;
    assert.match(fallback.textContent ?? "", /Gospel of Thomas · outside the canon/);
    for (const n of [21, 64, 65, 66, 97, 98]) assert.ok(fallback.querySelector(`a[href="/early/library/gospel-thomas/saying-${n}"]`));
    for (const story of JAMES_PARABLES) assert.ok(doc.querySelector(`noscript a[href="${jamesHref(story)}"]`));
    for (const figure of EARLY_FIGURES) for (const part of earlyFigureParts(figure)) assert.ok(doc.querySelector(`noscript a[href="${earlyFigureHref(figure, part)}"]`));
    for (const figure of EARLY_FIGURES.filter(item => item.originalReader)) {
      const original = figure.originalReader!;
      const link = doc.querySelector(`noscript a[href="/early/library/${original.edition}/${original.section}#p${original.start}"]`);
      assert.equal(link?.textContent, "Read the uncorrected edition", figure.id);
    }
    for (const [id, relatedId] of [["hermas-tower", "hermas-tower-explanation"], ["hermas-vineyard-servant", "hermas-vineyard-servant-explanation"], ["hermas-two-paths", "didache-two-ways"]]) {
      const figure = EARLY_FIGURES.find(item => item.id === id)!;
      const related = EARLY_FIGURES.find(item => item.id === relatedId)!;
      const link = [...doc.querySelectorAll("noscript a")].find(node => node.textContent?.startsWith(figure.title) && node.getAttribute("href") === earlyFigureHref(figure));
      const item = link!.closest("li")!;
      assert.ok([...item.querySelectorAll("a")].some(node => node.getAttribute("href") === earlyFigureHref(related) && node.textContent?.includes(related.title)), `${id}: ${relatedId}`);
      if (related.excerpt) assert.match(earlyFigureHref(related), /#page=\d+$/, relatedId);
    }
    for (const [id, href] of [["hermas-tower-explanation", "/early/library/shepherd-hermas/vision-3-part-2#p1"], ["hermas-vineyard-servant-explanation", "/early/library/shepherd-hermas/another-parable-part-2#p1"]]) {
      const figure = EARLY_FIGURES.find(item => item.id === id)!;
      const link = [...doc.querySelectorAll("noscript a")].find(node => node.textContent?.startsWith(figure.title) && node.getAttribute("href") === earlyFigureHref(figure));
      assert.ok(link!.closest("li")!.querySelector(`a[href="${href}"]`), id);
    }
    for (const id of ["acts-thomas-birds", "first-clement-workers", "barnabas-cornerstone"]) {
      const figure = EARLY_FIGURES.find(item => item.id === id)!;
      const link = [...doc.querySelectorAll("noscript a")].find(node => node.textContent?.startsWith(figure.title) && node.getAttribute("href") === earlyFigureHref(figure));
      const item = link!.closest("li")!;
      assert.ok(item.textContent?.includes(figure.speaker));
      assert.ok(item.textContent?.includes(figure.note!));
    }
  });

  it("marks a passage as called a parable only where the Greek says parabolē", () => {
    for (const p of parables) {
      for (const account of p.accounts) {
        if (!account.called) continue;
        const parsed = parseRef(account.called)!;
        const end = parsed.endVerse ?? parsed.verse;
        const verses = greek(parsed.book, parsed.chapter).verses.filter(
          (v) => v.number >= parsed.verse && v.number <= end,
        );
        assert.ok(
          verses.some((v) => v.words.some((w) => w.lemma === "παραβολή")),
          `${p.id}: ${account.called} uses παραβολή`,
        );
      }
    }
  });

  it("lists each parable's accounts in Gospel order, and the room in reading order", () => {
    const key = (ref: string) => {
      const parsed = parseRef(ref)!;
      return [GOSPELS.indexOf(parsed.book), parsed.chapter, parsed.verse];
    };
    const before = (a: number[], b: number[]) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
    for (const p of parables) {
      const books = p.accounts.map((a) => GOSPELS.indexOf(parseRef(a.ref)!.book));
      assert.deepEqual(books, [...books].sort((a, b) => a - b), `${p.id} accounts in Gospel order`);
    }
    const ordered = getParables();
    for (let i = 1; i < ordered.length; i++) {
      assert.ok(
        before(key(ordered[i - 1].accounts[0].ref), key(ordered[i].accounts[0].ref)) <= 0,
        `${ordered[i - 1].id} comes before ${ordered[i].id}`,
      );
    }
  });
});

let dom: JSDOM;
let root: Root;

function installDom(url = "http://localhost/jesus/parables") {
  dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url });
  const globals = {
    React,
    self: dom.window,
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    SVGElement: dom.window.SVGElement,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
  };
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { configurable: true, value: true });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  root = createRoot(document.getElementById("root")!);
}

/** Answers with the reference itself as the text, so the panels show what was asked for. */
const echoLoader = async (ref: string): Promise<PassageVerses | null> => {
  const parsed = parseRef(ref)!;
  return {
    ref,
    label: ref,
    href: `/scriptures/protestant/${parsed.book}/${parsed.chapter}#v${parsed.verse}`,
    verses: [{ number: parsed.verse, text: `Text of ${ref}` }],
  };
};

async function renderRoom(loader = echoLoader) {
  const thomasTexts = await getThomasTexts([...getParables(), ...SYNOPTIC_FIGURES, ...JOHN_FIGURES, ...EARLY_FIGURES, ...JAMES_PARABLES, ...THOMAS_PARABLES.map(story => ({ thomas: [{ saying: story.saying }] }))]);
  const jamesTexts = await getJamesTexts();
  const earlyFigureTexts = await getEarlyFigureTexts();
  const earlyReaderAvailability = await getEarlyOriginalReaderAvailability();
  await act(async () =>
    root.render(
      <ParablesRoom
        parables={getParables()}
        thomasStories={THOMAS_PARABLES}
        counts={{ MAT: { parabole: 17, paroimia: 0 }, MRK: { parabole: 13, paroimia: 0 }, LUK: { parabole: 18, paroimia: 0 }, JHN: { parabole: 0, paroimia: 4 } }}
        canons={canons}
        originalEditions={{}}
        thomasTexts={thomasTexts}
        jamesTexts={jamesTexts}
        earlyFigureTexts={earlyFigureTexts}
        earlyReaderAvailability={earlyReaderAvailability}
        passageLoader={loader}
      />,
    ),
  );
}

const head = (id: string) => document.querySelector<HTMLButtonElement>(`#parable-${id} button`)!;

describe("parables room", () => {
  beforeEach(() => installDom());
  afterEach(async () => {
    await act(async () => root.unmount());
    dom.window.close();
  });

  it("renders every Eusebius excerpt and each of its Gospel placements with source and attribution", async () => {
    await renderRoom();
    const texts = await getEarlyFigureTexts();
    for (const item of eusebiusAudit.selections) {
      await act(async () => head(item.id).click());
      const own = document.getElementById(`parable-${item.id}`)!;
      const panel = own.querySelector(".jsu-parable-early")!;
      assert.ok(panel.textContent?.includes(item.speaker), item.id);
      assert.ok(panel.textContent?.includes(item.displayedNote), item.id);
      assert.ok(panel.querySelector(`a[href="${item.scanUrl}"]`), item.id);
      for (const text of texts[item.id] ?? []) assert.ok(panel.textContent?.includes(text), item.id);
      assert.ok(texts[item.id]?.length, item.id);
      for (const target of item.related) {
        await act(async () => head(target).click());
        const entry = document.getElementById(`parable-${target}`)!;
        const matching = [...entry.querySelectorAll(".jsu-parable-early")].filter(node => node.textContent?.includes(item.displayedNote) && node.querySelector(`a[href="${item.scanUrl}"]`));
        assert.equal(matching.length, 1, `${item.id} / ${target}`);
        assert.ok(matching[0].textContent?.includes(item.speaker), item.id);
        assert.ok(matching[0].textContent?.includes(item.displayedNote), item.id);
        for (const text of texts[item.id]!) assert.ok(matching[0].textContent?.includes(text), item.id);
      }
    }
  });

  it("renders every audited Gospel range and Thomas placement with its complete note and source", async () => {
    await renderRoom();
    const texts = await getThomasTexts([...getParables(), ...SYNOPTIC_FIGURES, ...JOHN_FIGURES, ...EARLY_FIGURES, ...JAMES_PARABLES, ...THOMAS_PARABLES.map(story => ({ thomas: [{ saying: story.saying }] }))]);
    const checkThomas = (entry: Element, number: number, note: string | null) => {
      const panels = [...entry.querySelectorAll(".jsu-parable-thomas")].filter(panel => panel.querySelector(`a[href="/early/library/gospel-thomas/saying-${number}"]`));
      assert.equal(panels.length, 1, `${entry.id}: Thomas ${number}`);
      const panel = panels[0];
      assert.match(panel.textContent ?? "", new RegExp(`Saying ${number} · outside the canon`));
      assert.ok(texts[number]?.length, `source Thomas ${number}`);
      for (const paragraph of texts[number]!) assert.ok(panel.textContent?.includes(paragraph), `${entry.id}: full Thomas ${number}`);
      if (note) assert.ok(panel.textContent?.includes(note), `${entry.id}: Thomas ${number} note`);
    };
    for (const item of audit.gospel_candidates) {
      await act(async () => head(item.id).click());
      const entry = document.getElementById(`parable-${item.id}`)!;
      const panels = entry.querySelectorAll(".jsu-parable-account");
      assert.equal(panels.length, item.accounts.length, item.id);
      for (const [index, account] of item.accounts.entries()) {
        for (const key of ["ref", "setting", "explanation"] as const) {
          const ref = (account as Record<string, string>)[key];
          if (ref) assert.ok(panels[index].textContent?.includes(`Text of ${ref}`), `${item.id}: ${key} ${ref}`);
        }
        for (const ref of Object.values(account)) {
          const parsed = parseRef(ref)!;
          assert.ok(panels[index].querySelector(`a[href="/scriptures/protestant/${parsed.book}/${parsed.chapter}#v${parsed.verse}"]`), `${item.id}: ${ref} reader`);
        }
      }
      if ("note" in item && item.note) assert.ok(entry.textContent?.includes(item.note), `${item.id}: figure note`);
      if ("speaker" in item && item.speaker && item.speaker !== "Jesus by context") assert.ok(entry.textContent?.includes(item.speaker), `${item.id}: speaker`);
      for (const candidate of audit.thomas_candidates) for (const placement of candidate.placements) {
        if (placement.id === item.id && placement.role === "comparison") checkThomas(entry, Number(candidate.candidate.split(" ")[1]), placement.note);
      }
    }
    for (const candidate of audit.thomas_candidates) for (const placement of candidate.placements) {
      if (placement.role === "comparison") continue;
      await act(async () => head(placement.id).click());
      checkThomas(document.getElementById(`parable-${placement.id}`)!, Number(candidate.candidate.split(" ")[1]), placement.note);
    }
  });

  it("renders the James fullness comparison with Truth and its limited shared image", async () => {
    await renderRoom();
    await act(async () => head("james-fullness-sobriety").click());
    const entry = document.getElementById("parable-james-fullness-sobriety")!;
    const expected = audit.james_early_comparisons[0];
    assert.ok(entry.querySelector(".jsu-parable-james")?.textContent?.includes(expected.james_note));
    const panel = entry.querySelector(".jsu-parable-early")!;
    assert.ok(panel.textContent?.includes(`${expected.work} · ${expected.locator} · outside the canon`));
    assert.ok(panel.textContent?.includes(expected.speaker));
    assert.ok(panel.textContent?.includes(expected.translator));
    assert.ok(panel.textContent?.includes(expected.note));
    assert.ok(panel.querySelector(`a[href="${expected.reader}"]`));
    const source = await getLibraryPage(expected.edition, expected.section);
    assert.ok(source);
    assert.ok(panel.textContent?.includes(source.blocks[expected.start - 1].text!));
    for (const number of [13, 28]) assert.ok(entry.querySelector(`.jsu-parable-thomas a[href="/early/library/gospel-thomas/saying-${number}"]`));
  });

  it("opens James paragraphs by hash and compares the sourced Mark images", async () => {
    dom.window.history.replaceState({}, "", "/jesus/parables#parable-james-ear-grain");
    await renderRoom();
    assert.equal(head("james-ear-grain").getAttribute("aria-expanded"), "true");
    // The early group and its James writing show, so the entry they hold can be read.
    assert.equal(document.querySelector('[data-parable-group="early"]')?.getAttribute("data-shown"), "true");
    assert.equal(document.querySelector('[data-parable-writing="Secret Book of James"]')?.getAttribute("data-shown"), "true");
    const panel = document.querySelector("#parable-james-ear-grain .jsu-parable-james")!;
    assert.match(panel.textContent ?? "", /outside the canon.*ear of grain/i);
    assert.ok(panel.querySelector('a[href="/early/library/secret-book-james/know-yourselves#p1"]'));
    await act(async () => head("sower").click());
    const sower = document.getElementById("parable-sower")!;
    assert.match(sower.querySelector(".jsu-parable-james")?.textContent ?? "", /Mark 4:13–20.*stories differ/i);
    assert.ok(sower.querySelector(".jsu-parable-account"));
    await act(async () => window.dispatchEvent(new dom.window.CustomEvent("parables:open", { detail: "james-date-palm" })));
    assert.match(document.querySelector("#parable-james-date-palm .jsu-parable-james")?.textContent ?? "", /date palm shoot/);
  });

  it("shows early passages alongside their Gospel comparisons with speaker labels", async () => {
    await renderRoom();
    for (const [gospel, figure] of [["ten-virgins", "epistula-ten-virgins"], ["synoptic-lambs-wolves", "clement-lambs-wolves"], ["lost-sheep", "truth-sheep"]]) {
      await act(async () => head(gospel).click());
      const panel = document.querySelector(`#parable-${gospel} .jsu-parable-early`)!;
      const mapped = EARLY_FIGURES.find(item => item.id === figure)!;
      assert.match(panel.textContent ?? "", /outside the canon/);
      assert.ok(panel.textContent?.includes(mapped.speaker));
      assert.ok(panel.querySelector(`a[href="${earlyFigureHref(mapped)}"]`));
      for (const text of (await getEarlyFigureTexts())[figure]!) assert.ok(panel.textContent?.includes(text));
    }
  });

  it("shows each new comparison beside its Gospel text with its attribution", async () => {
    await renderRoom();
    for (const [target, figure] of [
      ["watchful-servants", "didache-watchful"], ["synoptic-lambs-wolves", "didache-watchful"], ["ten-virgins", "didache-watchful"],
      ["synoptic-trees-fruit", "barnabas-tree-water"], ["john-sheepfold-shepherd", "first-clement-gate"], ["wedding-banquet", "acts-thomas-bride"],
      ...["weeds-among-wheat", "john-vine-branches", "talents-and-pounds", "wedding-banquet", "watchful-servants", "john-fields-harvest"].map(target => [target, "acts-thomas-prayer"]),
    ]) {
      await act(async () => head(target).click());
      const entry = document.getElementById(`parable-${target}`)!;
      if (target === "wedding-banquet") assert.equal((entry.querySelector(".jsu-parable-also > summary")?.textContent?.match(/Acts of Thomas/g) ?? []).length, 1);
      const mapped = EARLY_FIGURES.find(item => item.id === figure)!;
      const panel = [...entry.querySelectorAll(".jsu-parable-early")].find(node => node.textContent?.includes(mapped.locator))!;
      assert.ok(entry.querySelector(".jsu-parable-account"), target);
      assert.ok(panel, `${figure} beside ${target}`);
      assert.ok(panel.textContent?.includes(mapped.speaker));
      assert.ok(panel.textContent?.includes(mapped.note!));
      assert.match(panel.textContent ?? "", /outside the canon/);
      assert.ok(panel.querySelector(`a[href="${earlyFigureHref(mapped)}"]`));
    }
  });

  it("renders each independently mapped early comparison beside the intended Gospel accounts", async () => {
    await renderRoom();
    for (const item of round3Comparisons) {
      const matches = [...getParables(), ...SYNOPTIC_FIGURES, ...JOHN_FIGURES].filter(entry => entry.id === item.id);
      assert.equal(matches.length, 1, item.id);
      assert.deepEqual(matches[0].accounts.map(account => account.ref), item.refs);
      await act(async () => head(item.id).click());
      const entry = document.getElementById(`parable-${item.id}`)!;
      assert.equal(entry.querySelectorAll(".jsu-parable-account").length, item.refs.length, item.id);
      for (const id of item.figures) {
        const figure = EARLY_FIGURES.find(candidate => candidate.id === id)!;
        assert.ok([figure.related, ...(figure.relatedAlso ?? [])].includes(item.id), id);
        const panel = [...entry.querySelectorAll(".jsu-parable-early")].find(node => node.textContent?.includes(`${figure.work} · ${figure.locator}`) && node.textContent?.includes(figure.note!));
        assert.ok(panel, `${id} / ${item.id}`);
        assert.ok(panel.textContent?.includes(figure.speaker));
        assert.ok(panel.textContent?.includes(figure.note!));
        assert.match(panel.textContent ?? "", /outside the canon/);
        assert.ok(panel.querySelector(`a[href="${earlyFigureHref(figure)}"]`));
      }
    }
  });

  it("compares the newly mapped figures without losing their speakers", async () => {
    await renderRoom();
    await act(async () => head("clement-two-one").click());
    const clement = document.querySelector("#parable-clement-two-one")!;
    assert.match(clement.querySelector(".jsu-parable-early")?.textContent ?? "", /author quotes the Lord/);
    assert.match(clement.querySelector(".jsu-parable-thomas")?.textContent ?? "", /Saying 22.*outside the canon.*two into one/s);
    await act(async () => head("synoptic-axe-root").click());
    const axe = document.querySelector("#parable-synoptic-axe-root")!;
    assert.match(axe.querySelector(".jsu-parable-account")?.textContent ?? "", /John the Baptist/);
    assert.match(axe.querySelector(".jsu-parable-early")?.textContent ?? "", /outside the canon.*John the Baptist/s);
    await act(async () => head("blind-guide").click());
    assert.match(document.querySelector("#parable-blind-guide .jsu-parable-early")?.textContent ?? "", /Epistula Apostolorum.*blind man lead a blind/s);
  });

  it("keeps all part links when a multipart source is unavailable", async () => {
    await act(async () => root.render(<ParablesRoom parables={getParables()} thomasStories={THOMAS_PARABLES} counts={{}} canons={canons} originalEditions={{}} />));
    await act(async () => head("hermas-willow").click());
    const panel = document.querySelector("#parable-hermas-willow .jsu-parable-early")!;
    assert.match(panel.textContent ?? "", /could not be loaded here/);
    for (const part of earlyFigureParts(EARLY_FIGURES.find(item => item.id === "hermas-willow")!)) assert.ok(panel.querySelector(`a[href="${earlyFigureHref(EARLY_FIGURES.find(item => item.id === "hermas-willow")!, part)}"]`));
  });

  it("shows each early comparison with distinct speakers and source links", async () => {
    await renderRoom();
    for (const [primary, second] of [["didache-two-ways", "barnabas-two-ways"], ["clement-vine", "first-clement-vine"]]) {
      await act(async () => head(primary).click());
      const panels = document.querySelectorAll(`#parable-${primary} .jsu-parable-early`);
      assert.equal(panels.length, 2);
      const figure = EARLY_FIGURES.find(item => item.id === second)!;
      assert.ok(panels[1].textContent?.includes(figure.speaker));
      assert.match(panels[1].textContent ?? "", /outside the canon/);
      assert.ok(panels[1].querySelector(`a[href="${earlyFigureHref(figure)}"]`));
    }
    await act(async () => head("talents-and-pounds").click());
    assert.match(document.querySelector("#parable-talents-and-pounds .jsu-parable-early")?.textContent ?? "", /Eusebius summarizing.*identity of the gospel is debated/s);
  });

  it("keeps the external source available when an excerpt fails", async () => {
    await act(async () => root.render(<ParablesRoom parables={getParables()} thomasStories={THOMAS_PARABLES} counts={{}} canons={canons} originalEditions={{}} />));
    await act(async () => head("acts-thomas-hymn").click());
    const panel = document.querySelector("#parable-acts-thomas-hymn .jsu-parable-early")!;
    assert.match(panel.textContent ?? "", /could not be loaded here.*source link/);
    assert.ok(panel.querySelector('a[href^="https://www.biblicalstudies.org.uk/"]'));
  });

  it("keeps the scan and uncorrected reader links when a corrected excerpt fails", async () => {
    await act(async () => root.render(<ParablesRoom parables={getParables()} thomasStories={THOMAS_PARABLES} counts={{}} canons={canons} originalEditions={{}} earlyReaderAvailability={{ "first-clement-pillars": true }} />));
    await act(async () => head("first-clement-pillars").click());
    const panel = document.querySelector("#parable-first-clement-pillars .jsu-parable-early")!;
    assert.match(panel.textContent ?? "", /could not be loaded here/);
    assert.match(panel.textContent ?? "", /corrects identified transcription errors/);
    assert.equal(panel.querySelector('a[href^="https://archive.org/"]')?.textContent, "Read the 1891 scan");
    assert.equal(panel.querySelector('a[href="/early/library/1-clement/1-clem-5#p1"]')?.textContent, "Read the uncorrected edition");
  });

  it("links each available uncorrected Hermas continuation independently", async () => {
    const earlyFigureTexts = await getEarlyFigureTexts();
    const id = "hermas-vineyard-servant-explanation";
    await act(async () => root.render(<ParablesRoom parables={getParables()} thomasStories={THOMAS_PARABLES} counts={{}} canons={canons} originalEditions={{}} earlyFigureTexts={earlyFigureTexts} earlyReaderAvailability={{ [id]: false, [`${id}:continuation`]: true }} />));
    await act(async () => head(id).click());
    const panel = document.querySelector(`#parable-${id} .jsu-parable-early`)!;
    assert.match(panel.textContent ?? "", /Uncorrected edition unavailable/);
    assert.equal(panel.querySelector('a[href="/early/library/shepherd-hermas/another-parable-part-2#p1"]')?.textContent, "Read the uncorrected continuation");
    assert.equal((panel.querySelector("p[style]") as HTMLElement | null)?.style.whiteSpace, "pre-line");
  });

  it("keeps the corrected excerpt and scan while a reader is unavailable", async () => {
    const earlyFigureTexts = await getEarlyFigureTexts();
    await act(async () => root.render(<ParablesRoom parables={getParables()} thomasStories={THOMAS_PARABLES} counts={{}} canons={canons} originalEditions={{}} earlyFigureTexts={earlyFigureTexts} earlyReaderAvailability={{ "first-clement-pillars": false }} />));
    await act(async () => head("first-clement-pillars").click());
    const panel = document.querySelector("#parable-first-clement-pillars .jsu-parable-early")!;
    assert.doesNotMatch(panel.textContent ?? "", /could not be loaded here/);
    assert.match(panel.textContent ?? "", /Uncorrected edition unavailable/);
    assert.ok(panel.querySelector('a[href^="https://archive.org/"]'));
    assert.equal(panel.querySelector('a[href^="/early/library/1-clement/1-clem-5"]'), null);
  });

  it("keeps the James reader link visible if its paragraph is unavailable", async () => {
    await act(async () => root.render(<ParablesRoom parables={getParables()} thomasStories={THOMAS_PARABLES} counts={{}} canons={canons} originalEditions={{}} />));
    await act(async () => head("james-grain-wheat").click());
    const panel = document.querySelector("#parable-james-grain-wheat .jsu-parable-james")!;
    assert.match(panel.textContent ?? "", /could not be loaded here/);
    assert.ok(panel.querySelector('a[href="/early/library/secret-book-james/prophecies-and-parables#p10"]'));
  });

  it("opens a James figure with its complete multi-paragraph passage", async () => {
    dom.window.history.replaceState({}, "", "/jesus/parables#parable-james-fullness-sobriety");
    await renderRoom();
    const panel = document.querySelector("#parable-james-fullness-sobriety .jsu-parable-james")!;
    assert.equal(head("james-fullness-sobriety").getAttribute("aria-expanded"), "true");
    assert.match(panel.textContent ?? "", /outside the canon/);
    assert.ok(panel.querySelector('a[href="/early/library/secret-book-james/being-filled#p1"]'));
    const texts = (await getJamesTexts())["james-fullness-sobriety"]!;
    for (const text of texts) assert.ok(panel.textContent?.includes(text));
  });

  it("opens Thomas-only stories without loading Scripture and preserves the full saying", async () => {
    let calls = 0;
    await renderRoom(async ref => { calls++; return echoLoader(ref); });
    for (const story of THOMAS_PARABLES) {
      await act(async () => head(story.id).click());
      assert.equal(head(story.id).getAttribute("aria-expanded"), "true");
      const panel = document.querySelector(`#parable-${story.id} .jsu-parable-thomas`)!;
      assert.match(panel.textContent ?? "", /outside the canon/);
      assert.equal(panel.querySelector("a")?.getAttribute("href"), `/early/library/gospel-thomas/saying-${story.saying}`);
      const source = await getLibraryPage("gospel-thomas", `saying-${story.saying}`);
      assert.ok(source);
      const text = [...panel.querySelectorAll(":scope > p")].slice(2).map(p => p.textContent);
      assert.deepEqual(text, source.blocks.filter(b => b.kind === "primary-text").map(b => b.text));
      if (story.saying === 21) assert.match(panel.textContent ?? "", /thief saying.*harvest image/i);
    }
    assert.equal(calls, 0);
  });

  it("opens Thomas-only hashes on arrival and on address changes", async () => {
    dom.window.history.replaceState({}, "", "/jesus/parables#parable-thomas-empty-jar");
    let calls = 0;
    await renderRoom(async ref => { calls++; return echoLoader(ref); });
    assert.equal(head("thomas-empty-jar").getAttribute("aria-expanded"), "true");
    await act(async () => {
      dom.window.history.replaceState({}, "", "/jesus/parables#parable-thomas-assassin");
      dom.window.dispatchEvent(new dom.window.HashChangeEvent("hashchange"));
    });
    assert.equal(head("thomas-empty-jar").getAttribute("aria-expanded"), "false");
    assert.equal(head("thomas-assassin").getAttribute("aria-expanded"), "true");
    assert.equal(calls, 0);
  });

  it("keeps the reader link when a Thomas-only saying is unavailable", async () => {
    await act(async () => root.render(<ParablesRoom parables={getParables()} thomasStories={THOMAS_PARABLES} counts={{}} canons={canons} originalEditions={{}} thomasTexts={{ 97: null }} />));
    await act(async () => head("thomas-empty-jar").click());
    const panel = document.querySelector("#parable-thomas-empty-jar .jsu-parable-thomas")!;
    assert.match(panel.textContent ?? "", /could not be loaded here/i);
    assert.equal(panel.querySelector("a")?.getAttribute("href"), "/early/library/gospel-thomas/saying-97");
  });

  it("lists every parable closed, and opens one with its setting, text and sources", async () => {
    await renderRoom();
    assert.equal(document.querySelectorAll(".jsu-pair-block").length, 38 + THOMAS_PARABLES.length + JAMES_PARABLES.length + EARLY_FIGURES.length + JOHN_FIGURES.length + SYNOPTIC_FIGURES.length);
    assert.ok([...document.querySelectorAll(".jsu-pair-block button")].every((b) => b.getAttribute("aria-expanded") === "false"));

    await act(async () => head("prodigal-son").dispatchEvent(new MouseEvent("click", { bubbles: true })));
    const panel = document.getElementById("parable-prodigal-son")!;
    assert.equal(head("prodigal-son").getAttribute("aria-expanded"), "true");
    assert.match(panel.textContent ?? "", /Text of LUK 15:1-3/);
    assert.match(panel.textContent ?? "", /Text of LUK 15:11-32/);
    assert.match(panel.textContent ?? "", /Called a parable in Luke 15:3/);
    assert.match(panel.textContent ?? "", /In Snodgrass as “The Compassionate Father and His Two Lost Sons”\. In Trench as “The Prodigal Son”\./);
  });

  it("opens John figures from a hash and displays the attributed speaker and source", async () => {
    await act(async () => root.unmount());
    dom.window.close();
    installDom("http://localhost/jesus/parables#parable-john-bridegrooms-friend");
    await renderRoom();
    const panel = document.getElementById("parable-john-bridegrooms-friend")!;
    assert.equal(head("john-bridegrooms-friend").getAttribute("aria-expanded"), "true");
    assert.match(panel.textContent ?? "", /John · John the Baptist/);
    assert.match(panel.textContent ?? "", /Text of JHN 3:29/);
    assert.doesNotMatch(panel.textContent ?? "", /Snodgrass|Trench/);
    assert.match(document.body.textContent ?? "", /Hunter’s sheepfold passage is John 10:1–5/);
  });

  it("opens both passages of a John figure and links to each reading", async () => {
    await renderRoom();
    await act(async () => head("john-bread-of-life").click());
    const panel = document.getElementById("parable-john-bread-of-life")!;
    assert.match(panel.textContent ?? "", /Text of JHN 6:32-40/);
    assert.match(panel.textContent ?? "", /Text of JHN 6:48-51/);
    assert.ok(panel.querySelector('a[href="/scriptures/protestant/JHN/6#v32"]'));
    assert.ok(panel.querySelector('a[href="/scriptures/protestant/JHN/6#v48"]'));
    assert.match(document.body.textContent ?? "", /Ruben Zimmermann/);
    assert.match(document.body.textContent ?? "", /Annang Asumang/);
  });

  it("opens the lamp from a hash with all four Gospel accounts and Thomas 33", async () => {
    await act(async () => root.unmount());
    dom.window.close();
    installDom("http://localhost/jesus/parables#parable-synoptic-lamp");
    await renderRoom();
    const entry = document.getElementById("parable-synoptic-lamp")!;
    assert.equal(head("synoptic-lamp").getAttribute("aria-expanded"), "true");
    for (const ref of ["MAT 5:15", "MRK 4:21", "LUK 8:16", "LUK 11:33"]) assert.match(entry.textContent ?? "", new RegExp(`Text of ${ref}`));
    assert.match(entry.textContent ?? "", /Gospel of Thomas · Saying 33 · outside the canon/);
    assert.match(entry.textContent ?? "", /No one lights a lamp/);
    assert.ok(entry.querySelector('a[href="/early/library/gospel-thomas/saying-33"]'));
  });

  it("shows the new Thomas comparisons beside their passages with their limitations", async () => {
    await renderRoom();
    const cases: [string, number, RegExp, RegExp][] = [
      ["synoptic-speck-plank", 26, /speck.*beam/i, /omits the question/i],
      ["synoptic-trees-fruit", 43, /love the tree.*hate its fruit/i, /different comparison/i],
      ["synoptic-trees-fruit", 45, /grapes.*thorns/i, /Luke 6:44–45/i],
      ["synoptic-wedding-guests", 104, /groom leaves.*fast and pray/i, /setting and wording differ/i],
      ["synoptic-physician", 31, /doctor heals those who know them/i, /different proverb.*Luke 4:24/i],
      ["synoptic-closed-door", 4, /first will be last/i, /Luke 13:30, not to the closed-door scene/i],
    ];
    let openId = "";
    for (const [id, saying, wording, note] of cases) {
      if (id !== openId) {
        await act(async () => head(id).click());
        openId = id;
      }
      const entry = document.getElementById(`parable-${id}`)!;
      const panel = [...entry.querySelectorAll(".jsu-parable-thomas")].find(p => p.querySelector(`a[href="/early/library/gospel-thomas/saying-${saying}"]`));
      assert.ok(panel, `${id}: Thomas ${saying} link`);
      assert.match(panel.textContent ?? "", /outside the canon/);
      assert.match(panel.textContent ?? "", wording);
      assert.match(panel.textContent ?? "", note);
      assert.ok(entry.querySelector(".jsu-parable-account"), `${id}: Gospel passage is shown`);
    }
  });

  it("opens related Mark and Luke images from Find with an explicit distinction", async () => {
    await renderRoom();
    await act(async () => window.dispatchEvent(new dom.window.CustomEvent("parables:open", { detail: "synoptic-doorkeeper" })));
    const entry = document.getElementById("parable-synoptic-doorkeeper")!;
    assert.match(entry.textContent ?? "", /scenes differ/);
    assert.match(entry.textContent ?? "", /Text of MRK 13:33-37/);
    assert.match(entry.textContent ?? "", /Text of LUK 12:35-38/);
  });

  it("opens a John figure from Find and retries a failed passage", async () => {
    let fail = true;
    await renderRoom(async ref => { if (fail) throw new Error("offline"); return echoLoader(ref); });
    await act(async () => window.dispatchEvent(new dom.window.CustomEvent("parables:open", { detail: "john-vine-branches" })));
    const panel = document.getElementById("parable-john-vine-branches")!;
    assert.match(panel.textContent ?? "", /couldn.t load/i);
    fail = false;
    await act(async () => panel.querySelector<HTMLButtonElement>("[role=alert] button")!.click());
    assert.match(panel.textContent ?? "", /Text of JHN 15:1-8/);
  });

  it("shows his own explanation where a Gospel records one", async () => {
    await renderRoom();
    await act(async () => head("sower").dispatchEvent(new MouseEvent("click", { bubbles: true })));
    const panels = document.querySelectorAll("#parable-sower .jsu-parable-account");
    assert.equal(panels.length, 3);
    assert.match(panels[0].textContent ?? "", /His explanation · Matthew 13:18–23/);
  });

  it("opens the parable named in the address", async () => {
    await act(async () => root.unmount());
    dom.window.close();
    installDom("http://localhost/jesus/parables#parable-good-samaritan");
    await renderRoom();
    assert.equal(head("good-samaritan").getAttribute("aria-expanded"), "true");
  });

  it("offers a retry when the passages fail to load", async () => {
    await renderRoom(async () => {
      throw new Error("offline");
    });
    await act(async () => head("net").dispatchEvent(new MouseEvent("click", { bubbles: true })));
    assert.match(document.getElementById("parable-net")?.textContent ?? "", /couldn.t load/i);
  });

  it("keeps Thomas links available through passage loading, failure, and retry", async () => {
    let rejectFirst: (reason?: unknown) => void = () => {};
    const first = new Promise<PassageVerses | null>((_resolve, reject) => { rejectFirst = reject; });
    const calls: string[] = [];
    let retry = false;
    await renderRoom((ref) => {
      calls.push(ref);
      return retry ? Promise.resolve(null) : first;
    });
    await act(async () => head("wicked-tenants").dispatchEvent(new MouseEvent("click", { bubbles: true })));
    const panel = document.getElementById("parable-wicked-tenants")!;
    const checkLinks = () => {
      assert.match(panel.textContent ?? "", /Gospel of Thomas · Saying 65 · outside the canon/);
      assert.match(panel.textContent ?? "", /Gospel of Thomas · Saying 66 · outside the canon/);
      assert.match(panel.textContent ?? "", /A \[creditor\] owned a vineyard/);
      for (const n of [65, 66]) assert.ok(panel.querySelector(`a[href="/early/library/gospel-thomas/saying-${n}"]`));
      assert.match(panel.textContent ?? "", /rejected stone that follows/);
    };
    assert.match(panel.textContent ?? "", /Turning to the passages/);
    checkLinks();
    await act(async () => rejectFirst(new Error("offline")));
    assert.match(panel.textContent ?? "", /couldn.t load/i);
    checkLinks();
    retry = true;
    await act(async () => panel.querySelector<HTMLButtonElement>("[role=alert] button")!.click());
    assert.match(panel.textContent ?? "", /No hosted text is available/);
    checkLinks();
    assert.ok(calls.length > 0 && calls.every(ref => GOSPELS.includes(parseRef(ref)?.book ?? "")));
  });

  it("folds complete Thomas text below the biblical accounts with distinct labels", async () => {
    await renderRoom();
    // The early writings wait until their group is chosen.
    assert.equal(document.querySelector('[data-parable-group="early"]')?.getAttribute("data-shown"), "false");
    assert.equal(head("wicked-tenants").querySelector(".jsu-pair-refs")?.textContent, "Matthew · Mark · Luke + 4 early writings");
    await act(async () => head("wicked-tenants").dispatchEvent(new MouseEvent("click", { bubbles: true })));
    const grid = document.querySelector("#parable-wicked-tenants .jsu-parable-accounts")!;
    assert.equal(grid.querySelectorAll(":scope > .jsu-parable-account").length, 3);
    assert.equal(grid.querySelectorAll(".jsu-parable-thomas").length, 0);
    const fold = document.querySelector<HTMLDetailsElement>("#parable-wicked-tenants details.jsu-parable-also")!;
    assert.equal(fold.open, false);
    assert.match(fold.querySelector("summary")?.textContent ?? "", /outside the canon.*Gospel of Thomas · Epistle to Diognetus · Epistle of Barnabas/);
    const thomas = fold.querySelectorAll(".jsu-parable-accounts > .jsu-parable-thomas");
    assert.equal(thomas.length, 2);
    assert.match(thomas[0].textContent ?? "", /Saying 65 · outside the canon/);
    assert.match(thomas[0].textContent ?? "", /Mark M\. Mattison/);
    assert.match(thomas[0].textContent ?? "", /A \[creditor\] owned a vineyard/);
    assert.match(thomas[1].textContent ?? "", /Saying 66 · outside the canon/);
    assert.match(thomas[1].textContent ?? "", /stone the builders rejected/);
  });

  it("makes an unavailable Thomas saying visible without hiding its reader link", async () => {
    await act(async () => root.render(<ParablesRoom parables={getParables()} thomasStories={THOMAS_PARABLES} counts={{}} canons={canons} originalEditions={{}} passageLoader={echoLoader} thomasTexts={{ 65: null, 66: ["Other saying"] }} />));
    await act(async () => head("wicked-tenants").click());
    const panels = document.querySelectorAll("#parable-wicked-tenants .jsu-parable-thomas");
    assert.match(panels[0].textContent ?? "", /could not be loaded here/);
    assert.ok(panels[0].querySelector('a[href="/early/library/gospel-thomas/saying-65"]'));
    assert.match(panels[1].textContent ?? "", /Other saying/);
  });

  it("states the Greek word counts it is given", async () => {
    await renderRoom();
    assert.match(document.body.textContent ?? "", /Matthew uses the Greek word for parable, parabolē, 17 times, Mark 13, and Luke 18\. John never uses it/);
  });

  it("shows one group at a time and switches with the group buttons", async () => {
    await renderRoom();
    const shown = () => [...document.querySelectorAll("[data-parable-group]")].filter((section) => section.getAttribute("data-shown") === "true").map((section) => section.getAttribute("data-parable-group"));
    assert.deepEqual(shown(), ["stories"]);
    const buttons = [...document.querySelectorAll<HTMLButtonElement>(".parables-rail button")];
    assert.deepEqual(buttons.map((button) => button.getAttribute("aria-pressed")), ["true", "false", "false", "false", "false"]);
    await act(async () => buttons[3].click());
    assert.deepEqual(shown(), ["john"]);
    assert.equal(buttons[3].getAttribute("aria-pressed"), "true");
    await act(async () => buttons[4].click());
    assert.deepEqual(shown(), ["early"]);
    const writings = [...document.querySelectorAll("[data-parable-writing]")].filter((section) => section.getAttribute("data-shown") === "true");
    assert.deepEqual(writings.map((section) => section.getAttribute("data-parable-writing")), ["Gospel of Thomas"]);
  });

  it("steps through a group from an open entry and closes back to its row", async () => {
    await renderRoom();
    await act(async () => head("sower").click());
    const step = document.querySelector("#parable-sower .parables-step")!;
    assert.match(step.textContent ?? "", /^2 of 31 · Stories/);
    const [previous, next, close] = [...step.querySelectorAll("button")];
    assert.equal(previous.getAttribute("aria-label"), "Previous: The two builders");
    assert.equal(next.getAttribute("aria-label"), "Next: The weeds among the wheat");
    await act(async () => next.click());
    assert.equal(head("sower").getAttribute("aria-expanded"), "false");
    assert.equal(head("weeds-among-wheat").getAttribute("aria-expanded"), "true");
    assert.equal(window.location.hash, "#parable-weeds-among-wheat");
    await act(async () => document.querySelector<HTMLButtonElement>("#parable-weeds-among-wheat .parables-step-close")!.click());
    assert.equal(head("weeds-among-wheat").getAttribute("aria-expanded"), "false");
    assert.equal(document.activeElement, head("weeds-among-wheat"));
    await act(async () => head("two-builders").click());
    assert.equal(document.querySelector<HTMLButtonElement>("#parable-two-builders .parables-step button")!.disabled, true);
  });

  it("lets search stand in for the group lists, then opens a result in its own group", async () => {
    await renderRoom();
    // Until a search runs, the pressed group button names the group; the status line stays empty and the heading is for screen readers.
    assert.equal(document.querySelector(".parables-results")?.textContent, "");
    assert.equal(document.querySelector("#parables-stories")?.textContent, "Stories");
    const input = document.querySelector<HTMLInputElement>("#parables-overview-search")!;
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!;
    // React loads before this file's DOM exists, so it watches typing through its keyup fallback.
    await act(async () => {
      input.focus();
      setter.call(input, "lost sheep");
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      input.dispatchEvent(new dom.window.KeyboardEvent("keyup", { bubbles: true, key: "p" }));
    });
    assert.ok([...document.querySelectorAll("[data-parable-group]")].every((section) => section.getAttribute("data-shown") === "false"));
    assert.match(document.querySelector(".parables-results")?.textContent ?? "", /^Searching all groups: \d+ entr/);
    const result = [...document.querySelectorAll<HTMLAnchorElement>(".parables-search-area a")].find((link) => link.textContent === "The shepherd seeks the lost sheep")!;
    await act(async () => result.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, button: 0 })));
    assert.equal(input.value, "");
    assert.equal(document.querySelector('[data-parable-group="early"]')?.getAttribute("data-shown"), "true");
    assert.equal(document.querySelector('[data-parable-writing="Eusebius, Theophany"]')?.getAttribute("data-shown"), "true");
    assert.equal(head("eusebius-lee-audit-shepherd-lost-sheep").getAttribute("aria-expanded"), "true");
  });

  it("compare links open the related entry in its own group", async () => {
    dom.window.history.replaceState({}, "", "/jesus/parables#parable-james-grain-wheat");
    await renderRoom();
    const toGospel = [...document.querySelectorAll<HTMLAnchorElement>("#parable-james-grain-wheat a")].find((link) => link.textContent?.startsWith("Compare the related Gospel passage"))!;
    await act(async () => toGospel.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })));
    assert.equal(window.location.hash, "#parable-sower");
    assert.equal(document.querySelector('[data-parable-group="stories"]')?.getAttribute("data-shown"), "true");
    assert.equal(head("sower").getAttribute("aria-expanded"), "true");

    dom.window.history.replaceState({}, "", "/jesus/parables#parable-barnabas-two-ways");
    await act(async () => window.dispatchEvent(new dom.window.HashChangeEvent("hashchange")));
    const toEarly = [...document.querySelectorAll<HTMLAnchorElement>("#parable-barnabas-two-ways a")].find((link) => link.textContent?.startsWith("Compare the related early passage"))!;
    await act(async () => toEarly.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })));
    assert.equal(window.location.hash, "#parable-didache-two-ways");
    assert.equal(document.querySelector('[data-parable-writing="The Didache"]')?.getAttribute("data-shown"), "true");
    assert.equal(head("didache-two-ways").getAttribute("aria-expanded"), "true");
  });
});
