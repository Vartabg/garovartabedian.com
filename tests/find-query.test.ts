import assert from "node:assert/strict";
import { describe, it } from "node:test";
import canonsData from "../public/scriptures/canons.json";
import { FIND_CATALOG } from "../src/lib/site/find-catalog";
import type { RelatedSearchResult } from "../src/lib/scriptures/related";
import type { SearchResult } from "../src/lib/scriptures/search";
import {
  assembleFindGroups,
  exactWordGroup,
  parseAllusionQuery,
  parseCanonQuery,
  parseCatenaQuery,
  parseConsoleHelpQuery,
  parseDossierQuery,
  parseFindRef,
  parseHarmonyQuery,
  parseHexaplaQuery,
  parsePathQuery,
  parseResonanceQuery,
  parseWordStudyQuery,
  rankFindQuery,
  rankPlaces,
  relatedTopicGroup,
} from "../src/lib/site/find-query";
import type { Canons } from "../src/lib/scriptures/types";
import { parseTranslationPrefix } from "../src/lib/site/find-text";
import {
  ACTIONS,
  executeAction,
  rankActions,
} from "../src/lib/site/find-actions";

const canons = canonsData as Canons;

describe("parseFindRef", () => {
  it("preserves an explicit edition on reference navigation", () => {
    assert.equal(parseFindRef("kjv: John 3:16", canons)?.href, "/scriptures/protestant/JHN/3?t=kjv#v16");
    assert.equal(parseFindRef("kjv: John 3", canons)?.href, "/scriptures/protestant/JHN/3?t=kjv");
  });
  it("parses a human verse reference", () => {
    const hit = parseFindRef("John 3:16", canons);
    assert.equal(hit?.book, "JHN");
    assert.equal(hit?.chapter, 3);
    assert.equal(hit?.verse, 16);
    assert.equal(hit?.href, "/scriptures/protestant/JHN/3#v16");
    assert.equal(hit?.title, "John 3:16");
  });

  it("parses chapter-only references, including abbreviations", () => {
    const john = parseFindRef("John 3", canons);
    assert.equal(john?.href, "/scriptures/protestant/JHN/3");
    assert.equal(john?.title, "John 3");
    assert.equal(john?.verse, undefined);

    const mark = parseFindRef("Mk 14", canons);
    assert.equal(mark?.book, "MRK");
    assert.equal(mark?.href, "/scriptures/protestant/MRK/14");
  });

  it("parses a numbered-book range the way the search page does", () => {
    const hit = parseFindRef("1 Cor 13:4-7", canons);
    assert.equal(hit?.book, "1CO");
    assert.equal(hit?.href, "/scriptures/protestant/1CO/13#v4");
    assert.equal(hit?.title, "1 Corinthians 13:4-7");
  });

  it("rejects unknown books and empty queries", () => {
    assert.equal(parseFindRef("", canons), null);
    assert.equal(parseFindRef("not a place", canons), null);
    assert.equal(parseFindRef("John 99", canons), null);
  });
});

describe("rankPlaces", () => {
  it("finds an early text by its common name", () => {
    const hits = rankPlaces(FIND_CATALOG, "Didache");
    assert.ok(hits.some((hit) => hit.href === "/early/didache"));
    assert.equal(hits[0]?.href, "/early/didache");
  });

  it("finds Peter among the twelve", () => {
    const hits = rankPlaces(FIND_CATALOG, "Peter");
    assert.ok(hits.some((hit) => hit.href === "/apostles/twelve#peter"));
  });

  it("finds a named walk", () => {
    const hits = rankPlaces(FIND_CATALOG, "last week");
    assert.ok(hits.some((hit) => hit.title === "The last week"));
  });

  it("finds Athanasius in the giants room", () => {
    const hits = rankPlaces(FIND_CATALOG, "Athanasius");
    assert.ok(hits.some((hit) => hit.href === "/church/giants#athanasius"));
  });

  it("finds ecumenical councils in the catalog", () => {
    const hits = rankPlaces(FIND_CATALOG, "Nicaea");
    assert.ok(hits.some((hit) => hit.href.startsWith("/church/councils#nicaea")));
  });

  it("finds prophecies in the catalog", () => {
    const hits = rankPlaces(FIND_CATALOG, "seed of the woman");
    assert.ok(
      hits.some((hit) =>
        hit.href.includes("/jesus/prophecy#prophecy-pair-seed-of-woman"),
      ),
    );
  });

  it("finds translation cases in the catalog", () => {
    const hits = rankPlaces(FIND_CATALOG, "Crown patent");
    assert.ok(
      hits.some((hit) =>
        hit.href.startsWith("/word/cases#crown-patent-disputes"),
      ),
    );
  });

  it("finds life events in the catalog", () => {
    const hits = rankPlaces(FIND_CATALOG, "Annunciation");
    assert.ok(
      hits.some((hit) =>
        hit.href.startsWith("/jesus/life#life-event-annunciation"),
      ),
    );
  });

  it("finds early writing chapters and sections by theme", () => {
    const twoWays = rankPlaces(FIND_CATALOG, "Two Ways");
    assert.ok(
      twoWays.some(
        (hit) =>
          hit.href === "/early/didache#s1" && hit.kind === "section",
      ),
    );

    const phoenix = rankPlaces(FIND_CATALOG, "Phoenix");
    assert.ok(
      phoenix.some(
        (hit) =>
          hit.href === "/early/1clement#s24" && hit.kind === "section",
      ),
    );

    const watchers = rankPlaces(FIND_CATALOG, "Watchers");
    assert.ok(
      watchers.some(
        (hit) =>
          hit.href === "/early/enoch#s0" && hit.kind === "section",
      ),
    );
  });

  it("finds the Hebrew Tanakh canon divisions", () => {
    const ketuvim = rankPlaces(FIND_CATALOG, "Ketuvim");
    assert.ok(
      ketuvim.some(
        (hit) =>
          hit.title.includes("The Writings (Ketuvim") && hit.href === "/scriptures#ketuvim",
      ),
    );

    const torah = rankPlaces(FIND_CATALOG, "Torah");
    assert.ok(
      torah.some(
        (hit) =>
          hit.title.includes("The Law (Torah") && hit.href === "/scriptures#torah",
      ),
    );
  });
});

describe("dossier Find routing", () => {
  it("deep-links recognized Angels and Jesus aliases to their preset", () => {
    assert.equal(
      parseDossierQuery("dossier angels Mastema")?.href,
      "/angels/dossier?preset=watchers-nephilim-enoch",
    );
    assert.equal(
      parseDossierQuery("notebooklm angels Azazel")?.href,
      "/angels/dossier?preset=azazel-scapegoat",
    );
    assert.equal(
      parseDossierQuery("dossier Jesus Josephus")?.href,
      "/jesus/dossier?preset=testimonium-flavianum",
    );
    assert.equal(
      parseDossierQuery("audio-prompt Jesus resurrection")?.href,
      "/jesus/dossier?preset=resurrection-minimal-facts",
    );
  });

  it("keeps unknown and untargeted dossier commands on the universal builder", () => {
    assert.equal(parseDossierQuery("dossier")?.href, "/scriptures/dossier");
    assert.equal(
      parseDossierQuery("dossier unrelated research topic")?.href,
      "/scriptures/dossier",
    );
    assert.equal(parseDossierQuery("find Mastema"), null);
  });
});

describe("rankFindQuery", () => {
  it("leads with a parsed passage and does not send it to Ask the text", () => {
    const groups = rankFindQuery("John 3", FIND_CATALOG, canons);
    assert.equal(groups[0]?.id, "ref");
    assert.equal(groups[0]?.items[0]?.href, "/scriptures/protestant/JHN/3");
    assert.ok(!groups.some((group) => group.id === "ask"));
  });

  it("attaches early Christian quotation allusions when a passage is cited in early writings", () => {
    const groups = rankFindQuery("James 4:6", FIND_CATALOG, canons);
    assert.equal(groups[0]?.id, "ref");
    const refItem = groups[0]?.items[0];
    assert.ok(refItem?.note.includes("Suggested matches in 1 Clement §29"));

    const allusionItem = groups[0]?.items.find((item) =>
      item.href === "/early/1clement#s29",
    );
    assert.ok(allusionItem);
    assert.equal(allusionItem?.title, "1 Clement §29");
    assert.equal(allusionItem?.kind, "section");
  });

  it("still ranks places when canons have not loaded", () => {
    const groups = rankFindQuery("Didache", FIND_CATALOG, null);
    assert.ok(groups.some((group) => group.items[0]?.href === "/early/didache"));
  });
});

function exactResult(hits: SearchResult["hits"], totalHits = hits.length): SearchResult {
  return {
    hits,
    totalHits,
    books: [],
    translation: "web",
    searched: ["light", "world"],
    dropped: ["of", "the"],
    missing: [],
  };
}

describe("exactWordGroup", () => {
  it("caps verse hits and links each one into the reader", () => {
    const hits = Array.from({ length: 10 }, (_, index) => ({
      book: "JHN" as const,
      chapter: 8,
      verse: index + 1,
      matched: 2,
    }));
    const group = exactWordGroup(exactResult(hits, 42), canons);
    assert.equal(group?.items.length, 8);
    assert.equal(group?.items[0]?.href, "/scriptures/protestant/JHN/8?t=web#v1");
    assert.equal(group?.items[0]?.kind, "verse");
    assert.match(group?.note ?? "", /42/);
  });

  it("includes verse snippet when provided", () => {
    const hits = [{ book: "JHN" as const, chapter: 3, verse: 16, matched: 2 }];
    const group = exactWordGroup(exactResult(hits, 1), canons, {
      "web:JHN:3:16": "For God so loved the world...",
    });
    assert.equal(group?.items[0]?.snippet, "For God so loved the world...");
  });

  it("reflects translation in the group label", () => {
    const res: SearchResult = {
      ...exactResult([
        { book: "1CO" as const, chapter: 13, verse: 13, matched: 1 },
      ]),
      translation: "kjv",
    };
    const group = exactWordGroup(res, canons);
    assert.equal(group?.label, "Words and phrases (KJV)");
  });
});

describe("relatedTopicGroup", () => {
  it("skips passages already in the exact-word set", () => {
    const related: RelatedSearchResult = {
      topics: [{ id: "LIGHT", section: "L", refCount: 4, score: 2 }],
      hits: [
        {
          book: "JHN",
          chapter: 8,
          verse: 12,
          label: "JHN 8:12",
          topicId: "LIGHT",
          context: "Christ the light of the world",
          score: 3,
        },
        {
          book: "MAT",
          chapter: 5,
          verse: 14,
          label: "MAT 5:14",
          topicId: "LIGHT",
          context: "Ye are the light of the world",
          score: 2,
        },
      ],
    };
    const group = relatedTopicGroup(
      related,
      canons,
      new Set(["JHN:8:12"]),
      "kjv",
    );
    assert.ok(group?.items.some((item) => item.href === "/scriptures/topics/LIGHT"));
    assert.ok(group?.items.some((item) => item.href === "/scriptures/protestant/MAT/5?t=kjv#v14"));
    assert.ok(!group?.items.some((item) => item.href?.includes("JHN/8")));
  });
});

describe("assembleFindGroups", () => {
  it("ordinary phrases cannot be captured by scholarly commands", () => {
    for (const query of ["root of all evil", "compare love and fear", "study humility", "help", "commands", "? why suffering"]) {
      const groups = assembleFindGroups({ query, catalog: FIND_CATALOG, canons, exact: null, related: null });
      assert.ok(groups.some(g => g.id === "ask"), query);
      assert.ok(!groups.some(g => g.items.some(i => i.kind === "action")), query);
    }
  });
  it("explicit scholarly commands work with either prefix and outrank preference keywords", () => {
    for (const query of ["> root light of the world", "/root light of the world"]) {
      const groups = assembleFindGroups({ query, catalog: [], canons, exact: null, related: null });
      assert.equal(groups[0]?.id, "word-study");
      assert.match(groups[0].items[0].href, /q=light%20of%20the%20world/);
    }
  });

  it("offers Ask the text when the query is not a reference", () => {
    const groups = assembleFindGroups({
      query: "light of the world",
      catalog: FIND_CATALOG,
      canons,
      exact: null,
      related: null,
    });
    const ask = groups.find((group) => group.id === "ask");
    assert.ok(ask);
    assert.match(ask.items[0]?.href ?? "", /\/scriptures\/search\?q=/);
  });

  it("keeps places when exact-word search fails", () => {
    const groups = assembleFindGroups({
      query: "Didache",
      catalog: FIND_CATALOG,
      canons,
      exact: null,
      related: null,
      exactFailed: true,
    });
    assert.ok(groups.some((group) => group.id === "places"));
    assert.ok(groups.some((group) => group.items.some((item) => item.href === "/early/didache")));
    assert.ok(!groups.some((group) => group.id === "exact"));
    assert.ok(groups.some((group) => group.id === "ask"));
  });

  it("inserts exact-word hits ahead of Ask the text", () => {
    const groups = assembleFindGroups({
      query: "light of the world",
      catalog: FIND_CATALOG,
      canons,
      exact: exactResult(
        [{ book: "JHN", chapter: 8, verse: 12, matched: 2 }],
        12,
      ),
      related: null,
    });
    const ids = groups.map((group) => group.id);
    assert.ok(ids.indexOf("exact") < ids.indexOf("ask"));
    assert.equal(
      groups.find((group) => group.id === "exact")?.items[0]?.href,
      "/scriptures/protestant/JHN/8?t=web#v12",
    );
    assert.match(
      groups.find((group) => group.id === "ask")?.items[0]?.title ?? "",
      /12/,
    );
  });

  it("includes early writings exact and meaning search jumps under Ask the text", () => {
    const groups = assembleFindGroups({
      query: "resurrection",
      catalog: FIND_CATALOG,
      canons,
      exact: null,
      related: null,
    });
    const askItems = groups.find((group) => group.id === "ask")?.items ?? [];
    assert.ok(askItems.some((item) => item.id === "ask-early" && item.href === "/early?q=resurrection"));
    assert.ok(askItems.some((item) => item.id === "ask-early-meaning" && item.href === "/early?ask=resurrection"));
    assert.ok(askItems.some((item) => item.id === "ask-library-meaning" && item.href === "/early/search?q=resurrection"));
    assert.ok(askItems.some((item) => item.id === "ask-resonance" && item.href === "/scriptures/resonance?q=resurrection"));
  });

  it("returns only actions when query is a command", () => {
    const groups = assembleFindGroups({
      query: "> dark",
      catalog: FIND_CATALOG,
      canons,
      exact: null,
      related: null,
    });
    assert.equal(groups.length, 1);
    assert.equal(groups[0]?.id, "actions");
    assert.ok(
      groups[0]?.items.some((item) => item.id === "action-theme-dark"),
    );
  });

  it("returns Scripture Path Tracer action when query is a path command", () => {
    const groups = assembleFindGroups({
      query: "> path Genesis 1:1 to Revelation 21:1",
      catalog: FIND_CATALOG,
      canons,
      exact: null,
      related: null,
    });
    assert.equal(groups.length, 1);
    assert.equal(groups[0]?.id, "path");
    assert.ok(groups[0]?.items[0]?.href.includes("/scriptures/graph?from=GEN.1.1&to=REV.21.1"));
  });

  it("keeps path commands limited to a single verse at each end", () => {
    const groups = assembleFindGroups({
      query: "> path John 3:16-18 to Romans 8:28",
      catalog: FIND_CATALOG,
      canons,
      exact: null,
      related: null,
    });
    assert.notEqual(groups[0]?.id, "path");
  });

  it("returns Conceptual Resonance action when query is a radar command", () => {
    const groups = assembleFindGroups({
      query: "> radar living water",
      catalog: FIND_CATALOG,
      canons,
      exact: null,
      related: null,
    });
    assert.equal(groups.length, 1);
    assert.equal(groups[0]?.id, "resonance");
    assert.ok(groups[0]?.items[0]?.href.includes("/scriptures/resonance?q=living%20water"));
  });
});

describe("parseTranslationPrefix", () => {
  it("parses translation prefixes and strips them from the query", () => {
    assert.deepEqual(parseTranslationPrefix("kjv: love"), {
      translation: "kjv",
      text: "love",
    });
    assert.deepEqual(parseTranslationPrefix("drb: charity"), {
      translation: "drb",
      text: "charity",
    });
    assert.deepEqual(parseTranslationPrefix("brenton: soul"), {
      translation: "brenton",
      text: "soul",
    });
    assert.deepEqual(parseTranslationPrefix("web: light"), {
      translation: "web",
      text: "light",
    });
  });

  it("defaults to web when no prefix is given", () => {
    assert.deepEqual(parseTranslationPrefix("peace"), {
      translation: "web",
      text: "peace",
    });
  });
});

describe("rankActions", () => {
  it("returns actions when prefixed with > or /", () => {
    const darkActions = rankActions("> dark");
    assert.ok(darkActions.some((a) => a.id === "action-theme-dark"));

    const fontActions = rankActions("/dyslexic");
    assert.ok(fontActions.some((a) => a.id === "action-font-dyslexic"));
  });

  it("returns all actions when query is just > or /", () => {
    const allActions = rankActions(">");
    assert.equal(allActions.length, ACTIONS.length);
  });

  it("keeps ordinary text separate from preference-changing commands", () => {
    assert.deepEqual(rankActions("high contrast"), []);
    assert.deepEqual(rankActions("light of the world"), []);
    assert.deepEqual(rankActions('"light of the world"'), []);
  });

  it("executes an action without throwing", () => {
    const executed = executeAction("action-theme-dark");
    assert.equal(executed, true);
  });
});

describe("Classical Knowledge Console Grammar & Actions", () => {
  it("parses path tracer queries (path [refA] to [refB])", () => {
    const pathA = parsePathQuery("path Gen 1:1 to Rev 22:21", canons);
    assert.ok(pathA, "path query should parse");
    assert.equal(pathA.fromId, "GEN.1.1");
    assert.equal(pathA.toId, "REV.22.21");
    assert.equal(pathA.fromTitle, "Genesis 1:1");
    assert.equal(pathA.toTitle, "Revelation 22:21");

    const pathB = parsePathQuery("path John 1:1 -> Exod 3:14", canons);
    assert.ok(pathB, "path query with arrow should parse");
    assert.equal(pathB.fromId, "JHN.1.1");
    assert.equal(pathB.toId, "EXO.3.14");

    assert.equal(parsePathQuery("path invalid text", canons), null);
  });

  it("parses conceptual resonance radar queries", () => {
    const radar = parseResonanceQuery("radar living water");
    assert.ok(radar);
    assert.equal(radar.concept, "living water");
    assert.ok(radar.href.includes("/scriptures/resonance?q=living%20water"));

    const resonance = parseResonanceQuery("resonance divine council");
    assert.ok(resonance);
    assert.equal(resonance.concept, "divine council");

    assert.equal(parseResonanceQuery("something else"), null);
  });

  it("parses multi-canonicity queries", () => {
    const compare = parseCanonQuery("compare catholic and protestant");
    assert.ok(compare);
    assert.ok(compare.title.includes("CATHOLIC vs. PROTESTANT"));
    assert.equal(compare.href, "/scriptures/canons#canons-matrix");

    const single = parseCanonQuery("canon ethiopian");
    assert.ok(single);
    assert.ok(single.title.includes("ETHIOPIAN"));

    const allCanons = parseCanonQuery("canons");
    assert.ok(allCanons);
    assert.equal(allCanons.href, "/scriptures/canons");
  });

  it("parses synoptic harmony and pericope diff queries", () => {
    const beatitudes = parseHarmonyQuery("diff beatitudes");
    assert.ok(beatitudes);
    assert.equal(beatitudes.pericopeId, "beatitudes");
    assert.ok(beatitudes.title.includes("The Beatitudes"));
    assert.equal(beatitudes.href, "/jesus/harmony");

    const prayer = parseHarmonyQuery("harmony lords prayer");
    assert.ok(prayer);
    assert.equal(prayer.pericopeId, "lords-prayer");

    const generic = parseHarmonyQuery("harmony");
    assert.ok(generic);
    assert.equal(generic.href, "/jesus/harmony");
  });

  it("parses original language word study queries", () => {
    const epiousios = parseWordStudyQuery("study epiousios");
    assert.ok(epiousios);
    assert.ok(epiousios.title.includes("ἐπιούσιος"));
    assert.ok(epiousios.href.includes("/jesus/words?study=lords-prayer"));

    const basileia = parseWordStudyQuery("root basileia");
    assert.ok(basileia);
    assert.ok(basileia.title.includes("βασιλεία"));

    const generic = parseWordStudyQuery("greek logos");
    assert.ok(generic);
    assert.ok(generic.href.includes("/scriptures/search?q=logos"));
  });

  it("parses Ante-Nicene patristic allusion queries", () => {
    const allusion = parseAllusionQuery("allusion James 4:6", canons);
    assert.ok(allusion);
    assert.ok(allusion.items.length > 0);
    assert.ok(allusion.items.some((item) => item.kind === "section"));

    const quotes = parseAllusionQuery("quotes Psalm 22:1", canons);
    assert.ok(quotes);
    assert.ok(quotes.title.includes("Psalms 22:1"));
  });

  it("parses console help commands (?, help, console)", () => {
    const helpA = parseConsoleHelpQuery("?");
    assert.ok(helpA);
    assert.ok(helpA.items.length >= 5);

    const helpB = parseConsoleHelpQuery("help");
    assert.ok(helpB);

    const helpC = parseConsoleHelpQuery("console");
    assert.ok(helpC);
  });

  it("assembles dedicated action groups for console commands", () => {
    const pathGroups = assembleFindGroups({
      query: "> path Gen 1:1 to Rev 22:21",
      catalog: FIND_CATALOG,
      canons,
      exact: null,
      related: null,
    });
    assert.equal(pathGroups[0]?.id, "path");
    assert.equal(pathGroups[0]?.items[0]?.kind, "action");

    const radarGroups = assembleFindGroups({
      query: "> radar living water",
      catalog: FIND_CATALOG,
      canons,
      exact: null,
      related: null,
    });
    assert.equal(radarGroups[0]?.id, "resonance");

    const harmonyGroups = assembleFindGroups({
      query: "> diff beatitudes",
      catalog: FIND_CATALOG,
      canons,
      exact: null,
      related: null,
    });
    assert.equal(harmonyGroups[0]?.id, "harmony");

    const hexaplaGroups = assembleFindGroups({
      query: "> hexapla genesis 1",
      catalog: FIND_CATALOG,
      canons,
      exact: null,
      related: null,
    });
    assert.equal(hexaplaGroups[0]?.id, "hexapla");
    assert.equal(
      hexaplaGroups[0]?.items[0]?.href,
      "/scriptures/polyglot?preset=genesis-1",
    );

    const catenaGroups = assembleFindGroups({
      query: "> catena isaiah 53",
      catalog: FIND_CATALOG,
      canons,
      exact: null,
      related: null,
    });
    assert.equal(catenaGroups[0]?.id, "catena");
    assert.equal(catenaGroups[0]?.items[0]?.href, "/scriptures/catena");
  });

  it("parses hexapla and polyglot queries", () => {
    const defaultHex = parseHexaplaQuery("hexapla");
    assert.ok(defaultHex);
    assert.equal(defaultHex.href, "/scriptures/polyglot");

    const genHex = parseHexaplaQuery("polyglot genesis 1");
    assert.ok(genHex);
    assert.equal(genHex.presetId, "genesis-1");
    assert.equal(genHex.href, "/scriptures/polyglot?preset=genesis-1");

    const psalmHex = parseHexaplaQuery("hexapla psalm 22");
    assert.ok(psalmHex);
    assert.equal(psalmHex.presetId, "psalm-22");
    assert.equal(psalmHex.href, "/scriptures/polyglot?preset=psalm-22");
  });

  it("parses catena and patristic queries", () => {
    const defaultCat = parseCatenaQuery("catena");
    assert.ok(defaultCat);
    assert.equal(defaultCat.href, "/scriptures/catena");

    const targetedCat = parseCatenaQuery("patristic isaiah 53");
    assert.ok(targetedCat);
    assert.equal(targetedCat.href, "/scriptures/catena");
  });
});
