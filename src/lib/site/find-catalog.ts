import { SYNOPTIC_FIGURES } from "@/lib/jesus/synoptic-figures";
import { JOHN_FIGURES } from "@/lib/jesus/john-figures";
/**
 * Every place Find can jump to without asking a model or a server.
 *
 * Assembled from structured registries the site already publishes across all
 * eight research worlds and the portfolio routes. Duplicate hrefs keep the
 * first canonical entry while merging secondary aliases and keywords so no
 * search term is lost.
 */

import canonsJson from "../../../public/scriptures/canons.json";
import twelveJson from "../../../public/apostles/twelve.json";
import sentJson from "../../../public/apostles/sent.json";
import giantsJson from "../../../public/church/giants.json";
import facesJson from "../../../public/church/faces.json";
import readingPathsJson from "../../../public/meta/reading-paths.json";
import councilsJson from "../../../public/church/councils.json";
import propheciesJson from "../../../public/jesus/prophecies.json";
import parablesJson from "../../../public/jesus/parables.json";
import stonesJson from "../../../public/jesus/stones.json";
import historyJson from "../../../public/jesus/history.json";
import angelsOrderJson from "../../../public/angels/order.json";
import demonsJson from "../../../public/angels/demons.json";
import ledgerJson from "../../../public/word/ledger.json";
import freeTextsJson from "../../../public/word/free.json";
import evidenceCasesJson from "../../../public/evidence/cases.json";
import afterlifeIndexJson from "../../../public/evidence/afterlife-index.json";
import { THOMAS_PARABLES } from "@/lib/jesus/thomas-parables";
import { JAMES_PARABLES } from "@/lib/jesus/james-parables";
import { EARLY_FIGURES } from "@/lib/jesus/early-figures";
import casesJson from "../../../public/word/cases.json";
import lifeJson from "../../../public/jesus/life.json";
import type { Apostle, TwelveData } from "@/lib/apostles/types";
import type { Giant, GiantsData } from "@/lib/church/types";
import type { Canons } from "@/lib/scriptures/types";
import { traditionFor } from "@/lib/scriptures/client";
import earlySectionsJson from "../../../public/early/catalog.json";
import { EARLY_TEXTS, TEXT_ERA, eraById } from "@/lib/early/client";
import { PARALLEL_MATRICES } from "@/lib/parallels/search-match";
import { SHELF_SITUATIONS, SHELF_STORIES } from "@/lib/story-shelf";
import { PROJECTS, STARTER_OFFERS } from "@/lib/portfolio-content";
import { WORLD_GUIDES, type WorldId } from "@/lib/world-guidance";
import { WORLD_REGISTRY } from "@/lib/world-registry";
import { getWorldRoutes } from "@/lib/site-navigation";

export type FindKind =
  | "world"
  | "room"
  | "book"
  | "story"
  | "framework"
  | "artifact"
  | "path"
  | "text"
  | "section"
  | "person"
  | "page"
  | "council"
  | "case"
  | "prophecy"
  | "parable"
  | "event"
  | "action";

export type FindPlace = {
  id: string;
  href: string;
  title: string;
  note: string;
  kind: FindKind;
  world?: WorldId;
  aliases?: string[];
  keywords: string[];
};

export type ReadingPathStep = { href: string; label: string; note: string };
export type ReadingPath = {
  id: string;
  title: string;
  line: string;
  steps: ReadingPathStep[];
};

/**
 * Shared Latin/diacritic folding for catalog indexing and place scoring.
 * Keeps ASCII queries ("resume", "Saraqael", "Avila", "Ragnarok", "Mictlan")
 * aligned with accented titles without mutating display strings or URL slugs.
 */
export function foldFindText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/ß/g, "ss");
}

const WORLD_TRUE_ALIASES: Partial<Record<WorldId, string[]>> = {
  scriptures: ["bible", "holy bible", "tanakh"],
  jesus: ["christ", "jesus christ", "messiah"],
  apostles: ["twelve apostles", "disciples"],
  early: ["early writings", "apostolic fathers", "church fathers", "patristics"],
  church: ["church history"],
  angels: ["angels and demons", "unseen realm"],
  word: ["bible copyright", "who owns the word"],
  evidence: ["how we know", "epistemology"],
};

const WORLD_KEYWORDS: Record<WorldId, string[]> = {
  scriptures: ["bible", "text", "canon", "reader", "tanakh", "torah", "ketuvim"],
  jesus: ["christ", "gospel", "lord"],
  apostles: ["twelve", "disciples"],
  early: ["fathers", "writings", "patristic", "apocrypha", "apologists"],
  church: ["history", "councils"],
  angels: ["demons", "satan", "unseen"],
  word: ["copyright", "translation", "license", "fences"],
  evidence: ["claims", "method", "how we know"],
};

const ROOM_TRUE_ALIASES: Record<string, string[]> = {
  "/scriptures/word-bridge": ["wordbridge", "word bridge", "strongs"],
  "/scriptures/topics": ["nave", "naves", "topical bible"],
  "/scriptures/polyglot": ["hexapla", "polyglot", "digital hexapla"],
  "/scriptures/catena": ["catena", "catena aurea", "golden chain"],
  "/scriptures/diachronic": ["diachronic", "semantic evolution"],
  "/scriptures/disputation": ["disputation", "sacred disputation"],
  "/scriptures/graph": ["path tracer", "cross reference graph", "six degrees"],
  "/scriptures/resonance": ["conceptual resonance", "thematic radar"],
  "/scriptures/canons": ["canon matrix", "deuterocanon"],
  "/jesus/harmony": ["synoptic harmony", "gospel harmony"],
  "/jesus/words": ["red letter", "sayings of jesus"],
  "/jesus/risen": ["resurrection", "empty tomb"],
  "/apostles/sent": ["paul", "saul", "apostle paul", "pauline journeys"],
  "/word/free": ["public domain bibles", "hosted texts"],
};

const ROOM_KEYWORDS: Record<string, string[]> = {
  "/scriptures/search": ["ask", "concordance", "find verse"],
  "/scriptures/word-bridge": ["wordbridge", "word bridge", "original words", "strongs", "grammar", "hebrew", "greek"],
  "/scriptures/topics": ["nave", "subjects"],
  "/scriptures/graph": ["path", "graph", "pagerank", "shortest path", "threads", "citation path", "six degrees"],
  "/scriptures/polyglot": ["hexapla", "polyglot", "interlinear", "brenton", "vulgate", "masoretic", "apparatus", "divergence", "witnesses", "origen"],
  "/scriptures/catena": ["catena", "patristic", "reception", "fathers", "golden chain", "tradition", "allusions"],
  "/scriptures/dossier": ["dossier", "notebooklm", "audio overview", "export", "synthesis", "prompt", "research", "apparatus"],
  "/angels/dossier": ["angels", "demons", "dossier", "notebooklm", "audio overview", "watchers", "divine council", "nephilim", "azazel", "exorcism"],
  "/jesus/dossier": ["jesus", "christ", "dossier", "notebooklm", "audio overview", "testimonium", "josephus", "isaiah 53", "son of man", "tacitus", "minimal facts", "seven sayings"],
  "/scriptures/diachronic": ["diachronic", "linguistics", "semantic shift", "ruach", "pneuma", "sheol", "hades", "tzedakah", "evolution", "etymology"],
  "/scriptures/disputation": ["disputation", "debate", "dialectics", "polyphony", "theodicy", "job", "suffering", "faith and works", "sovereignty"],
  "/scriptures/resonance": ["radar", "resonance", "omni", "spectrum", "horizons", "thematic radar"],
  "/scriptures/canons": ["canon", "traditions", "deuterocanon", "apocrypha", "tanakh", "septuagint", "qumran", "matrix"],
  "/jesus/harmony": ["synoptic", "harmony", "pericope", "diff", "gospels", "sondergut", "beatitudes"],
  "/jesus/words": ["sayings", "red letter"],
  "/jesus/life": ["map", "ministry"],
  "/jesus/risen": ["resurrection", "ascension", "empty tomb"],
  "/apostles/sent": ["paul", "saul", "roads", "mission"],
  "/church/giants": ["teachers", "fathers"],
  "/word/cases": ["lawsuit", "licensing"],
  "/word/free": ["public domain", "license chain", "hosted texts", "provenance", "ebible", "brenton", "charles", "wikisource", "manifest"],
};

const BOOK_ALIASES: Record<string, string[]> = {
  PSA: ["Psalm", "Psalter"],
  SNG: ["Song of Solomon", "Canticles"],
  SIR: ["Ecclesiasticus", "Ben Sira", "Wisdom of Sirach"],
  WIS: ["Wisdom of Solomon", "Book of Wisdom"],
  REV: ["Apocalypse", "Book of Revelation"],
  ACT: ["Acts of the Apostles"],
  ENO: ["Book of Enoch", "Enoch"],
  JUB: ["Book of Jubilees"],
  LJE: ["Epistle of Jeremiah"],
  DAG: ["Greek Daniel"],
  ESG: ["Greek Esther"],
};

const STORY_ALIASES: Record<string, string[]> = {
  noah: ["Noah's Ark", "Noah and the Flood", "The Flood", "Great Flood"],
  mountain: ["Abraham and Isaac", "Binding of Isaac", "Mount Moriah"],
  "i-am-with-you": ["Jacob's Ladder", "Jacob at Bethel"],
  joseph: ["Joseph and his brothers", "Coat of many colors"],
  sea: ["Crossing the Red Sea", "Parting of the Red Sea", "Red Sea"],
  ruth: ["Ruth and Naomi"],
  david: ["David and Goliath", "Goliath"],
  fire: ["Elijah on Mount Carmel", "Prophets of Baal", "Mount Carmel"],
  "open-his-eyes": ["Elisha and the chariots of fire", "Chariots of fire"],
  esther: ["Queen Esther", "For such a time as this"],
  furnace: ["Fiery Furnace", "Shadrach Meshach and Abednego"],
  lions: ["Daniel in the Lions' Den", "Lions' Den"],
  jonah: ["Jonah and the Great Fish", "Jonah and the Whale"],
  manger: ["Birth of Jesus", "Nativity"],
  "love-enemies": ["Love your enemies"],
  "lords-prayer": ["The Lord's Prayer", "Our Father"],
  "mustard-seed": ["Parable of the Mustard Seed", "Mustard Seed"],
  "take-up-cross": ["Take up your cross"],
  "good-samaritan": ["Good Samaritan", "Parable of the Good Samaritan"],
  "lost-son": ["Prodigal Son", "Parable of the Prodigal Son", "Lost Son"],
  "before-abraham": ["Before Abraham was, I am"],
  "new-commandment": ["A new commandment"],
  tomb: ["Empty Tomb", "Crucifixion and Resurrection"],
  "peace-be-with-you": ["Doubting Thomas"],
  "come-and-eat": ["Breakfast by the Sea", "Feed my sheep"],
  "every-language": ["Day of Pentecost", "Pentecost"],
  "the-gate-opened": ["Peter freed from prison", "Angel frees Peter"],
};

const PAGES: Array<{
  href: string;
  title: string;
  note: string;
  aliases?: string[];
  keywords: string[];
}> = [
  { href: "/", title: "Home", note: "The front door.", keywords: ["front", "start"] },
  {
    href: "/scriptures/read/isaiah-53-clement-16",
    title: "Isaiah and 1 Clement — Reading path",
    note: "Read the hosted passages, open nearby source notes, and optionally trace their connection. Preview.",
    keywords: ["isaiah", "clement", "humility", "wounds", "healing", "reading", "trace", "connection"],
  },
  {
    href: "/scriptures/investigations/isaiah-53-clement-16",
    title: "Isaiah 53 in 1 Clement 16 — Source Investigation",
    note: "Compare exact hosted excerpts, inspect the evidence behind editorial findings, and download a reproducible research dossier.",
    keywords: ["isaiah", "clement", "humility", "investigation", "evidence", "quotation", "source checks"],
  },
  {
    href: "/scriptures/polyglot",
    title: "Living Digital Hexapla & Multi-Witness Polyglot",
    note: "Side-by-side collation of named Hebrew/Greek editions, Brenton's English Septuagint, Douay-Rheims, King James, and WEB with word-level morphology.",
    aliases: ["Hexapla", "Polyglot"],
    keywords: ["hexapla", "polyglot", "interlinear", "brenton", "vulgate", "masoretic", "apparatus", "divergence", "witnesses", "origen", "walton"],
  },
  {
    href: "/scriptures/catena",
    title: "Computational Catena Aurea (Patristic Reception Chain)",
    note: "Unbroken golden chain linking biblical verses to 1st–3rd century Church Fathers (Clement, Ignatius, Polycarp, Didache).",
    aliases: ["Catena", "Catena Aurea"],
    keywords: ["catena", "patristic", "reception", "fathers", "golden chain", "tradition", "aquinas", "clement", "ignatius", "polycarp"],
  },
  {
    href: "/scriptures/dossier",
    title: "Universal NotebookLM Research Dossier Engine",
    note: "Compile multi-witness textual divergence and Ante-Nicene patristic reception into source-grounded NotebookLM dossiers.",
    keywords: ["dossier", "notebooklm", "audio overview", "export", "synthesis", "prompt", "research", "apparatus"],
  },
  {
    href: "/angels/dossier",
    title: "Angels & Demons NotebookLM Research Dossier Engine",
    note: "Build research worksheets from hosted Scripture and curated historical source notes for Google NotebookLM.",
    keywords: ["angels", "demons", "dossier", "notebooklm", "audio overview", "watchers", "divine council", "nephilim", "azazel", "exorcism"],
  },
  {
    href: "/jesus/dossier",
    title: "Jesus research worksheets",
    note: "Synthesize source-grounded research dossiers on the Historical Jesus, Messianic Prophecy, and Roman/Jewish historiography for Google NotebookLM.",
    keywords: ["jesus", "christ", "dossier", "worksheet", "notebooklm", "audio overview", "testimonium", "josephus", "isaiah 53", "son of man", "tacitus", "minimal facts", "seven sayings"],
  },
  {
    href: "/scriptures/diachronic",
    title: "The Diachronic Semantic Evolution Tracker",
    note: "Trace 1,500 years of linguistic migration across Hebrew Ruach, Greek Pneuma, Latin Spiritus, Sheol, and Tzedakah.",
    aliases: ["Diachronic"],
    keywords: ["diachronic", "linguistics", "semantic shift", "ruach", "pneuma", "sheol", "hades", "tzedakah", "evolution", "etymology"],
  },
  {
    href: "/scriptures/disputation",
    title: "The Polyphonic Sacred Disputation Engine",
    note: "Stage the foundational theological debates: Job vs Proverbs, Paul vs James, Mark vs John with NotebookLM debate dossiers.",
    aliases: ["Disputation"],
    keywords: ["disputation", "debate", "dialectics", "polyphony", "theodicy", "job", "suffering", "faith and works", "sovereignty"],
  },
  {
    href: "/scriptures/graph",
    title: "Cross-reference graph & path tracer",
    note: "PageRank centrality, citation flows, and a bounded cross-reference path tracer.",
    keywords: ["graph", "path", "threads", "pagerank", "centrality", "citation path", "six degrees", "shortest path"],
  },
  {
    href: "/scriptures/resonance",
    title: "Conceptual Resonance Matrix (7-Horizon Radar)",
    note: "Synchronized thematic radar across 2,000 years: Torah, Prophets, Wisdom, Gospels, Epistles, Fathers, and Antiquity.",
    keywords: ["resonance", "radar", "spectrum", "horizons", "concept", "omni", "thematic"],
  },
  {
    href: "/scriptures/canons",
    title: "Multi-Canonicity & Tradition Matrix",
    note: "Comparative canon explorer across Protestant, Catholic, Orthodox, Ethiopian, and Jewish traditions.",
    keywords: ["canon", "canons", "traditions", "deuterocanon", "apocrypha", "tanakh", "manuscripts", "qumran"],
  },
  {
    href: "/jesus/harmony",
    title: "Gospels word by word",
    note: "Side-by-side multi-gospel alignment with mathematical word-level diffing (Triple Tradition, Q-material, Sondergut).",
    aliases: ["Synoptic Harmony"],
    keywords: ["harmony", "synoptic", "synoptic harmony", "word by word", "diff", "pericope", "gospels", "sondergut", "triple", "tradition"],
  },
  {
    href: "/hire",
    title: "For recruiters",
    note: "Hiring overview and proof of the work.",
    aliases: ["Hire", "Hiring"],
    keywords: ["jobs", "resume", "cv", "recruiter"],
  },
  {
    href: "/about",
    title: "About this site",
    note: "Who built it, and why it exists.",
    aliases: ["About", "Garo Vartabedian"],
    keywords: ["garo", "author"],
  },
  {
    href: "/work",
    title: "Work & case studies",
    note: "JobPilot, this site, EYE, atxbro.",
    aliases: ["Portfolio", "Projects", "Case studies"],
    keywords: ["portfolio", "projects"],
  },
  {
    href: "/resume",
    title: "Résumé",
    note: "The résumé page and the PDF.",
    aliases: ["Resume", "CV"],
    keywords: ["cv", "resume"],
  },
  {
    href: "/contact",
    title: "Contact",
    note: "Email and the ways to reach Garo.",
    aliases: ["Email Garo"],
    keywords: ["email"],
  },
  {
    href: "/sources",
    title: "Sources & method",
    note: "The audit trail for every world.",
    aliases: ["Sources", "Bibliography"],
    keywords: ["citations", "bibliography"],
  },
  {
    href: "/services",
    title: "Services",
    note: "What the independent practice offers.",
    aliases: ["Consulting"],
    keywords: ["consulting"],
  },
];

function tokens(...parts: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    const normalized = foldFindText(part);
    for (const token of normalized.split(/[^a-z0-9]+/)) {
      if (token.length < 2 || seen.has(token)) continue;
      seen.add(token);
      out.push(token);
    }
  }
  return out;
}

function aliasesOf(...parts: Array<string | undefined>): string[] | undefined {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    const trimmed = part.trim();
    if (!trimmed) continue;
    const folded = foldFindText(trimmed).replace(/[^a-z0-9]+/g, " ").trim();
    if (folded.length < 2 || seen.has(folded)) continue;
    seen.add(folded);
    out.push(trimmed);
  }
  return out.length > 0 ? out : undefined;
}

function worldFromHref(href: string): WorldId | undefined {
  if (href.startsWith("/scriptures")) return "scriptures";
  if (href.startsWith("/jesus")) return "jesus";
  if (href.startsWith("/apostles")) return "apostles";
  if (href.startsWith("/early")) return "early";
  if (href.startsWith("/church")) return "church";
  if (href.startsWith("/angels")) return "angels";
  if (href.startsWith("/word")) return "word";
  if (href.startsWith("/evidence")) return "evidence";
  return undefined;
}

export const READING_PATHS: ReadingPath[] = (
  readingPathsJson as { paths: ReadingPath[] }
).paths;

function buildCatalog(): FindPlace[] {
  const places: FindPlace[] = [];
  const byHref = new Map<string, FindPlace>();
  const canons = canonsJson as Canons;
  const scriptureRoutes = new Map(
    getWorldRoutes("scriptures")
      .filter((route) => route.href !== "/scriptures")
      .map((route) => [route.href, route]),
  );

  const add = (place: FindPlace) => {
    const existing = byHref.get(place.href);
    if (existing) {
      existing.aliases = aliasesOf(...(existing.aliases ?? []), ...(place.aliases ?? []));
      existing.keywords = tokens(...existing.keywords, ...place.keywords);
      return;
    }
    const canonical = scriptureRoutes.get(place.href);
    const resolved: FindPlace = canonical
      ? {
          ...place,
          title: canonical.label,
          note: canonical.note ?? place.note,
          aliases: aliasesOf(...(place.aliases ?? []), place.title),
          keywords: tokens(...place.keywords, canonical.label, canonical.note),
        }
      : place;
    byHref.set(resolved.href, resolved);
    places.push(resolved);
  };

  for (const world of WORLD_REGISTRY) {
    add({
      id: `world-${world.id}`,
      href: world.href,
      title: world.label,
      note: world.hint,
      kind: "world",
      world: world.id,
      aliases: aliasesOf(...(WORLD_TRUE_ALIASES[world.id] ?? [])),
      keywords: tokens(world.id, world.label, world.hint, ...(WORLD_KEYWORDS[world.id] ?? [])),
    });

    const guide = WORLD_GUIDES[world.id];
    for (const link of guide.nav) {
      if (link.href.split("#")[0] === world.href) continue;
      add({
        id: `room-${link.href}`,
        href: link.href,
        title: link.label,
        note: `${world.label}${link.note ? ` · ${link.note}` : ""}`,
        kind: "room",
        world: world.id,
        aliases: aliasesOf(...(ROOM_TRUE_ALIASES[link.href] ?? [])),
        keywords: tokens(link.label, link.note, world.label, ...(ROOM_KEYWORDS[link.href] ?? [])),
      });
    }
  }

  for (const code of canons.bookOrder) {
    const book = canons.books[code];
    if (!book) continue;
    const tradition = traditionFor(canons, code);
    const traditionName =
      canons.traditions.find((t) => t.id === tradition)?.name ?? tradition;
    const chapterCount = `${book.chapters} chapter${book.chapters === 1 ? "" : "s"}`;
    add({
      id: `book-${code}`,
      href: `/scriptures/${tradition}/${code}/1`,
      title: book.name,
      note: `Scriptures · ${chapterCount} · ${traditionName} shelf`,
      kind: "book",
      world: "scriptures",
      aliases: aliasesOf(code, ...(BOOK_ALIASES[code] ?? [])),
      keywords: tokens(code, book.name, traditionName, ...(BOOK_ALIASES[code] ?? []), "book", "scripture"),
    });
  }

  const storySituationTerms = new Map<string, string[]>();
  for (const sit of SHELF_SITUATIONS) {
    for (const [storyId, tag] of Object.entries(sit.tags)) {
      const bucket = storySituationTerms.get(storyId) ?? [];
      bucket.push(sit.label, tag.line);
      storySituationTerms.set(storyId, bucket);
    }
  }

  for (const story of SHELF_STORIES) {
    const extra = storySituationTerms.get(story.id) ?? [];
    add({
      id: `story-${story.id}`,
      href: story.href,
      title: story.title,
      note: `Told story · ${story.reference}`,
      kind: "story",
      world: worldFromHref(story.href) ?? "scriptures",
      aliases: aliasesOf(...(STORY_ALIASES[story.id] ?? [])),
      keywords: tokens(
        story.id,
        story.title,
        story.reference,
        ...(STORY_ALIASES[story.id] ?? []),
        ...extra,
        "story",
        "stories",
      ),
    });
  }

  for (const text of EARLY_TEXTS) {
    const strippedThe = text.title.replace(/^The\s+/i, "");
    add({
      id: `text-${text.id}`,
      href: `/early/${text.id}`,
      title: text.title,
      note: `${text.date}. ${text.blurb}`,
      kind: "text",
      world: "early",
      aliases: aliasesOf(text.id, strippedThe !== text.title ? strippedThe : undefined),
      keywords: tokens(text.id, text.title, text.blurb),
    });
  }

  const earlyTextMap = new Map(EARLY_TEXTS.map((t) => [t.id, t]));
  const ROMAN_NUMS: Record<string, string> = {
    i: "1", ii: "2", iii: "3", iv: "4", v: "5",
    vi: "6", vii: "7", viii: "8", ix: "9", x: "10",
    xi: "11", xii: "12", xiii: "13", xiv: "14", xv: "15",
    xvi: "16", xvii: "17", xviii: "18", xix: "19", xx: "20",
    xxi: "21", xxii: "22", xxiii: "23", xxiv: "24", xxv: "25",
    xxvi: "26", xxvii: "27", xxviii: "28", xxix: "29", xxx: "30",
  };

  for (const entry of (earlySectionsJson as unknown as {
    entries: Array<{ id: string; textId: string; section: number; label: string }>;
  }).entries) {
    const text = earlyTextMap.get(entry.textId);
    const era = TEXT_ERA[entry.textId];
    const eraInfo = era ? eraById(era) : undefined;
    const eraLabel = eraInfo?.label ?? "The Writings";

    const parts = entry.label.split(" — ");
    const shortBook = text?.title ?? parts[0];
    const heading = parts.slice(1).join(" — ") || parts[0];
    const title = `${shortBook} · ${heading}`;
    const note = `${eraLabel} · The Writings`;

    const romanMatch = heading.match(/Chapter\s+([IVXLCDM]+|\d+)/i);
    let chapterWord = "";
    if (romanMatch) {
      const rawNum = romanMatch[1].toLowerCase();
      chapterWord = ROMAN_NUMS[rawNum] ?? rawNum;
    }

    add({
      id: `early-sec-${entry.textId}-${entry.section}`,
      href: `/early/${entry.textId}#s${entry.section}`,
      title,
      note,
      kind: "section",
      world: "early",
      keywords: tokens(
        entry.textId,
        entry.label,
        text?.title,
        text?.blurb,
        eraLabel,
        chapterWord,
        "section",
        "chapter",
      ),
    });
  }

  add({
    id: "canon-ketuvim",
    href: "/scriptures#ketuvim",
    title: "The Writings (Ketuvim · כְּתוּבִים)",
    note: "Scriptures · The third division of the Hebrew Tanakh: Psalms, Proverbs, Job, Song of Songs, Ruth, Lamentations, Ecclesiastes, Esther, Daniel, Ezra-Nehemiah, Chronicles.",
    kind: "room",
    world: "scriptures",
    aliases: aliasesOf("Ketuvim", "Hagiographa"),
    keywords: tokens(
      "writings",
      "ketuvim",
      "tanakh",
      "hebrew",
      "psalms",
      "proverbs",
      "job",
      "ruth",
      "ecclesiastes",
      "daniel",
      "hagiographa",
    ),
  });

  add({
    id: "canon-torah",
    href: "/scriptures#torah",
    title: "The Law (Torah · תּוֹרָה)",
    note: "Scriptures · The first division of the Hebrew Tanakh: Genesis, Exodus, Leviticus, Numbers, Deuteronomy.",
    kind: "room",
    world: "scriptures",
    aliases: aliasesOf("Torah", "Pentateuch"),
    keywords: tokens(
      "torah",
      "law",
      "pentateuch",
      "moses",
      "tanakh",
      "genesis",
      "exodus",
    ),
  });

  add({
    id: "canon-neviim",
    href: "/scriptures#neviim",
    title: "The Prophets (Nevi'im · נְבִיאִים)",
    note: "Scriptures · The second division of the Hebrew Tanakh: Joshua, Judges, Samuel, Kings, Isaiah, Jeremiah, Ezekiel, and the Twelve.",
    kind: "room",
    world: "scriptures",
    aliases: aliasesOf("Neviim", "Nevi'im"),
    keywords: tokens(
      "neviim",
      "prophets",
      "tanakh",
      "isaiah",
      "jeremiah",
      "ezekiel",
    ),
  });

  for (const matrix of PARALLEL_MATRICES) {
    add({
      id: `parallel-${matrix.id}`,
      href: matrix.href,
      title: matrix.title,
      note: `${matrix.subtitle} · Comparative parallel`,
      kind: "page",
      world: "scriptures",
      aliases: aliasesOf(...matrix.aliases),
      keywords: tokens(
        matrix.id,
        matrix.title,
        matrix.subtitle,
        matrix.summary,
        ...matrix.witnesses,
        ...matrix.aliases,
        "parallel",
        "parallels",
      ),
    });
  }

  const apostles = (twelveJson as TwelveData).apostles as Apostle[];
  for (const apostle of apostles) {
    add({
      id: `apostle-${apostle.id}`,
      href: `/apostles/twelve#${apostle.id}`,
      title: apostle.name,
      note: apostle.glanceCall,
      kind: "person",
      world: "apostles",
      aliases: aliasesOf(apostle.aka),
      keywords: tokens(apostle.id, apostle.name, apostle.aka, apostle.meaning),
    });
  }

  const sentData = sentJson as {
    rays: Array<{
      apostleId: string;
      name: string;
      to: string;
      claims: Array<{ claim: string; earliest: string }>;
    }>;
    unplaced: Array<{ apostleId: string; name: string; note: string }>;
    armenia: { title: string; text: string };
  };
  for (const ray of sentData.rays) {
    add({
      id: `sent-${ray.apostleId}`,
      href: `/apostles/sent#sent-${ray.apostleId}`,
      title: `${ray.name} — road to ${ray.to}`,
      note: ray.claims[0]?.claim ?? `Apostolic mission tradition · ${ray.to}`,
      kind: "section",
      world: "apostles",
      keywords: tokens(
        ray.apostleId,
        ray.name,
        ray.to,
        ...ray.claims.map((c) => `${c.claim} ${c.earliest}`),
        "road",
        "sent",
        "mission",
      ),
    });
  }
  for (const entry of sentData.unplaced) {
    add({
      id: `sent-${entry.apostleId}`,
      href: `/apostles/sent#sent-${entry.apostleId}`,
      title: `${entry.name} — unplaced road`,
      note: entry.note,
      kind: "section",
      world: "apostles",
      keywords: tokens(entry.apostleId, entry.name, entry.note, "unplaced", "sent"),
    });
  }
  add({
    id: "sent-armenia",
    href: "/apostles/sent#armenia-title",
    title: sentData.armenia.title,
    note: "The Apostles · Armenian Apostolic tradition (Thaddaeus, Bartholomew, Gregory the Illuminator).",
    kind: "section",
    world: "apostles",
    aliases: aliasesOf("Armenia", "Armenian Apostolic Church"),
    keywords: tokens("armenia", "armenian", sentData.armenia.title, sentData.armenia.text),
  });

  const giants = (giantsJson as GiantsData).giants as Giant[];
  for (const giant of giants) {
    add({
      id: `giant-${giant.id}`,
      href: `/church/giants#${giant.id}`,
      title: giant.name,
      note: giant.stands,
      kind: "person",
      world: "church",
      aliases: aliasesOf(giant.id.replace(/-/g, " ")),
      keywords: tokens(giant.id, giant.name, giant.stands, giant.place),
    });
  }

  const faces = (
    facesJson as {
      faces: Array<{
        id: string;
        culture: string;
        name: string;
        years: string;
        line: string;
      }>;
    }
  ).faces;
  for (const face of faces) {
    add({
      id: `face-${face.id}`,
      href: `/church/faces#${face.id}`,
      title: `${face.name} · ${face.culture}`,
      note: `${face.years} · The Church across cultures`,
      kind: "person",
      world: "church",
      aliases: aliasesOf(face.name, face.culture),
      keywords: tokens(face.id, face.culture, face.name, face.years, face.line, "faces", "church"),
    });
  }

  const councils = (
    councilsJson as unknown as {
      councils: Array<{
        id: string;
        name: string;
        year: string | number;
        place?: string;
        calledBy?: string;
        summary?: string;
      }>;
    }
  ).councils;
  for (const council of councils) {
    add({
      id: `council-${council.id}`,
      href: `/church/councils#${council.id}`,
      title: council.name,
      note: `${council.year}${council.place ? ` · ${council.place}` : ""}. Called by ${council.calledBy ?? "the Church"}.`,
      kind: "council",
      world: "church",
      aliases: aliasesOf(council.place),
      keywords: tokens(
        council.id,
        council.name,
        council.place,
        String(council.year),
        council.calledBy,
        "council",
        "councils",
      ),
    });
  }

  const stones = stonesJson as Array<{
    id: string;
    name: string;
    artifactDate: string;
    assessment: string;
    location: string;
    inscription?: string;
    note: string;
  }>;
  for (const stone of stones) {
    const strippedThe = stone.name.replace(/^The\s+/i, "");
    add({
      id: `stone-${stone.id}`,
      href: `/jesus/history#${stone.id}`,
      title: stone.name,
      note: `${stone.artifactDate} · ${stone.assessment}`,
      kind: "artifact",
      world: "jesus",
      aliases: aliasesOf(stone.id.replace(/-/g, " "), strippedThe !== stone.name ? strippedThe : undefined),
      keywords: tokens(
        stone.id,
        stone.name,
        stone.artifactDate,
        stone.assessment,
        stone.location,
        stone.inscription,
        stone.note,
        "archaeology",
        "artifact",
        "stone",
      ),
    });
  }

  const historyItems = historyJson as Array<{
    id: string;
    author: string;
    work: string;
    date: string;
    lane: string;
    assessment: string;
    note: string;
  }>;
  for (const item of historyItems) {
    add({
      id: `witness-${item.id}`,
      href: `/jesus/history#${item.id}`,
      title: `${item.author} — ${item.work}`,
      note: `${item.date} · ${item.lane} witness · ${item.assessment}`,
      kind: "text",
      world: "jesus",
      aliases: aliasesOf(item.author, item.id.replace(/-/g, " ")),
      keywords: tokens(
        item.id,
        item.author,
        item.work,
        item.date,
        item.lane,
        item.assessment,
        item.note,
        "witness",
        "history",
      ),
    });
  }

  const angelsOrder = angelsOrderJson as {
    bands: Array<{ id: string; name: string; realm: string; line: string }>;
    named: Array<{ name: string; meaning: string; line: string; quoteRef: string }>;
  };
  for (const angel of angelsOrder.named) {
    // Keep the exact DOM slug expression used by AngelsHome.tsx:403.
    const slug = angel.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const strippedThe = angel.name.replace(/^The\s+/i, "");
    add({
      id: `angel-${slug}`,
      href: `/angels#${slug}`,
      title: angel.name,
      note: `${angel.meaning} · Angels & Demons`,
      kind: "person",
      world: "angels",
      aliases: aliasesOf(strippedThe !== angel.name ? strippedThe : undefined),
      keywords: tokens(angel.name, angel.meaning, angel.line, angel.quoteRef, "angel", "archangel"),
    });
  }
  for (const band of angelsOrder.bands) {
    const strippedThe = band.name.replace(/^The\s+/i, "");
    add({
      id: `angel-band-${band.id}`,
      href: `/angels#band-${band.id}`,
      title: band.name,
      note: `Angels & Demons · ${band.realm} tier`,
      kind: "section",
      world: "angels",
      aliases: aliasesOf(band.id.replace(/-/g, " "), strippedThe !== band.name ? strippedThe : undefined),
      keywords: tokens(band.id, band.name, band.realm, band.line, "angels"),
    });
  }

  const demons = (
    demonsJson as {
      demons: Array<{
        id: string;
        name: string;
        altNames: string[];
        meaning: string;
        line: string;
        quoteRef: string;
      }>;
    }
  ).demons;
  for (const demon of demons) {
    const slashParts = demon.name.includes("/")
      ? demon.name.split("/").map((s) => s.trim())
      : [];
    add({
      id: `demon-${demon.id}`,
      href: `/angels/demons#${demon.id}`,
      title: demon.name,
      note: `Named demon / hostile figure · ${demon.quoteRef}`,
      kind: "person",
      world: "angels",
      aliases: aliasesOf(...demon.altNames, ...slashParts),
      keywords: tokens(
        demon.id,
        demon.name,
        ...demon.altNames,
        demon.meaning,
        demon.line,
        demon.quoteRef,
        "demon",
        "demons",
      ),
    });
  }

  const prophecies = propheciesJson as unknown as Array<{
    id: string;
    theme: string;
    line: string;
    prophecy: { ref: string };
    fulfillment: Array<{ ref: string }>;
    connection?: string;
  }>;
  for (const p of prophecies) {
    const fulfillments = p.fulfillment.map((f) => f.ref).join(", ");
    add({
      id: `prophecy-${p.id}`,
      href: `/jesus/prophecy#prophecy-pair-${p.id}`,
      title: `${p.theme}: ${p.prophecy.ref} → ${fulfillments}`,
      note: p.line,
      kind: "prophecy",
      world: "jesus",
      aliases: aliasesOf(p.theme),
      keywords: tokens(
        p.id,
        p.theme,
        p.line,
        p.prophecy.ref,
        ...p.fulfillment.map((f) => f.ref),
        "prophecy",
        "prophecies",
      ),
    });
  }

  const parables = parablesJson as unknown as Array<{
    id: string;
    title: string;
    snodgrass: string | null;
    trench: string[];
    accounts: Array<{ ref: string }>;
  }>;
  for (const p of parables) {
    add({
      id: `parable-${p.id}`,
      href: `/jesus/parables#parable-${p.id}`,
      title: `Parable: ${p.title}`,
      note: p.accounts.map((a) => a.ref).join(", "),
      kind: "parable",
      world: "jesus",
      aliases: aliasesOf(p.title),
      keywords: tokens(
        p.id,
        p.title,
        p.snodgrass ?? undefined,
        ...p.trench,
        ...p.accounts.map((a) => a.ref),
        "parable",
        "parables",
      ),
    });
  }

  for (const figure of SYNOPTIC_FIGURES) {
    const refs = figure.accounts.map((account) => account.ref);
    add({
      id: `parable-${figure.id}`,
      href: `/jesus/parables#parable-${figure.id}`,
      title: `Figure: ${figure.title}`,
      note: `${refs.join(", ")} · parable or figure of speech`,
      kind: "parable",
      world: "jesus",
      aliases: aliasesOf(figure.title, ...(figure.thomas ?? []).map((entry) => `Thomas ${entry.saying}`)),
      keywords: tokens(
        figure.id,
        figure.title,
        ...refs,
        "Matthew",
        "Mark",
        "Luke",
        "figure of speech",
        "parable",
        "parables",
        ...(figure.thomas ?? []).map((entry) => `Thomas ${entry.saying}`),
      ),
    });
  }

  for (const figure of JOHN_FIGURES) {
    const refs = figure.accounts.map((account) => account.ref);
    add({
      id: `parable-${figure.id}`,
      href: `/jesus/parables#parable-${figure.id}`,
      title: `John: ${figure.title}`,
      note: `${refs.join(", ")}${figure.speaker ? ` · ${figure.speaker}` : ""} · figure of speech`,
      kind: "parable",
      world: "jesus",
      aliases: aliasesOf(figure.title),
      keywords: tokens(figure.id, figure.title, ...refs, "John", "Gospel of John", "figure of speech", "parable", "parables"),
    });
  }

  for (const story of THOMAS_PARABLES) {
    add({
      id: `parable-${story.id}`,
      href: `/jesus/parables#parable-${story.id}`,
      title: `Parable: ${story.title}`,
      note: `Gospel of Thomas, saying ${story.saying} · outside the canon`,
      kind: "parable",
      world: "jesus",
      aliases: aliasesOf(story.title, `Thomas ${story.saying}`, `Saying ${story.saying}`),
      keywords: tokens(story.id, story.title, "Gospel of Thomas", `Thomas ${story.saying}`, `saying ${story.saying}`, "parable", "parables"),
    });
  }

  for (const story of JAMES_PARABLES) {
    add({
      id: `parable-${story.id}`,
      href: `/jesus/parables#parable-${story.id}`,
      title: `${story.kind === "figure" ? "Figure" : "Parable"}: ${story.title}`,
      note: `Secret Book of James ${story.locator} · outside the canon`,
      kind: "parable",
      world: "jesus",
      aliases: aliasesOf(story.title),
      keywords: tokens(story.id, story.title, "Secret Book of James", "Apocryphon of James", story.locator, "parable", "parables"),
    });
  }

  for (const figure of EARLY_FIGURES) {
    add({
      id: `parable-${figure.id}`,
      href: `/jesus/parables#parable-${figure.id}`,
      title: `Figure: ${figure.title}`,
      note: `${figure.work} · ${figure.speaker} · outside the canon`,
      kind: "parable",
      world: "jesus",
      aliases: aliasesOf(figure.title, ...(figure.thomas ?? []).map((item) => `Thomas ${item.saying}`)),
      keywords: tokens(
        figure.id,
        figure.title,
        figure.work,
        figure.locator,
        "parable",
        "figures of speech",
        ...(figure.thomas ?? []).map((item) => `Thomas ${item.saying}`),
      ),
    });
  }

  const wordLedgerEntries = (
    ledgerJson as {
      entries: Array<{
        id: string;
        abbr: string;
        name: string;
        category: string;
        owner: string;
        summary: string;
      }>;
    }
  ).entries;
  for (const entry of wordLedgerEntries) {
    add({
      id: `word-entry-${entry.id}`,
      href: `/word#word-entry-${entry.id}`,
      title: `${entry.name} (${entry.abbr})`,
      note: `${entry.owner} · ${entry.summary}`,
      kind: "case",
      world: "word",
      aliases: aliasesOf(entry.abbr, entry.name),
      keywords: tokens(
        entry.id,
        entry.abbr,
        entry.name,
        entry.owner,
        entry.category,
        entry.summary,
        "translation",
        "copyright",
        "permissions",
      ),
    });
  }

  const freeTexts = (
    freeTextsJson as {
      texts: Array<{
        id: string;
        abbr: string;
        name: string;
        edition: string;
        year: string;
      }>;
    }
  ).texts;
  for (const text of freeTexts) {
    add({
      id: `free-text-${text.id}`,
      href: `/word/free#text-${text.id}`,
      title: `${text.name} — provenance & license`,
      note: `${text.year} · ${text.edition}`,
      kind: "page",
      world: "word",
      aliases: aliasesOf(`${text.abbr} license`, `${text.abbr} provenance`),
      keywords: tokens(text.id, text.abbr, text.name, text.edition, text.year, "public domain", "provenance", "license"),
    });
  }

  const cases = (
    casesJson as {
      cases: Array<{
        id: string;
        title: string;
        parties?: string;
        date?: string;
        court?: string;
        issue?: string;
      }>;
    }
  ).cases;
  for (const c of cases) {
    add({
      id: `case-${c.id}`,
      href: `/word/cases#${c.id}`,
      title: c.title,
      note: `${c.date ? `${c.date} · ` : ""}${c.issue ?? c.parties ?? "Translation copyright case"}`,
      kind: "case",
      world: "word",
      keywords: tokens(
        c.id,
        c.title,
        c.parties,
        c.court,
        c.issue,
        "case",
        "lawsuit",
        "copyright",
      ),
    });
  }

  const claimLab = (
    evidenceCasesJson as {
      claimLab: Array<{
        id: string;
        world: string;
        mode: string;
        title: string;
        question: string;
      }>;
    }
  ).claimLab;
  for (const item of claimLab) {
    add({
      id: `claim-lab-${item.id}`,
      href: `/evidence#${item.id}`,
      title: `Claim Lab: ${item.title}`,
      note: `${item.world} · ${item.mode} · ${item.question}`,
      kind: "case",
      world: "evidence",
      keywords: tokens(item.id, item.title, item.world, item.mode, item.question, "claim", "evidence"),
    });
  }

  const afterlifeFrameworks = afterlifeIndexJson as Array<{
    id: string;
    name: string;
    description: string;
    origin: string;
    taxonomy: { family: string; patterns: string[] };
    searchText: string;
  }>;
  for (const fw of afterlifeFrameworks) {
    const parenMatch = fw.name.match(/^(.+?)\s*\((.+?)\)$/);
    add({
      id: `framework-${fw.id}`,
      href: `/evidence/frameworks/${fw.id}`,
      title: fw.name,
      note: `${fw.origin} · Comparative afterlife framework`,
      kind: "framework",
      world: "evidence",
      aliases: aliasesOf(
        fw.id.replace(/-/g, " "),
        parenMatch?.[1],
        parenMatch?.[2],
      ),
      keywords: tokens(
        fw.id,
        fw.name,
        fw.origin,
        fw.description,
        fw.taxonomy.family,
        ...fw.taxonomy.patterns,
        fw.searchText,
        "afterlife",
        "framework",
      ),
    });
  }

  const lifeEvents = (
    lifeJson as {
      events: Array<{
        id: string;
        era: string;
        title: string;
        place?: string;
        line: string;
        refs?: Array<{ ref: string }>;
      }>;
    }
  ).events;
  for (const ev of lifeEvents) {
    add({
      id: `life-${ev.id}`,
      href: `/jesus/life#life-event-${ev.id}`,
      title: ev.title,
      note: `${ev.place ? `${ev.place.charAt(0).toUpperCase() + ev.place.slice(1)} · ` : ""}${ev.line}`,
      kind: "event",
      world: "jesus",
      keywords: tokens(
        ev.id,
        ev.title,
        ev.place,
        ev.line,
        "life",
        "jesus",
        ...(ev.refs?.map((r) => r.ref) ?? []),
      ),
    });
  }

  for (const path of READING_PATHS) {
    const firstHref = path.steps[0]?.href ?? "/";
    const resolvedHref =
      byHref.has(firstHref) && /^\/scriptures\/[^/]+\/[A-Z0-9]+\/\d+$/.test(firstHref)
        ? `${firstHref}#v1`
        : firstHref;
    add({
      id: `path-${path.id}`,
      href: resolvedHref,
      title: path.title,
      note: path.line,
      kind: "path",
      keywords: tokens(path.id, path.title, path.line),
    });
  }

  for (const project of PROJECTS) {
    if (!project.href.startsWith("/")) continue;
    const slug = project.href.replace(/^\/work\//, "");
    add({
      id: `work-${slug}`,
      href: project.href,
      title: project.name,
      note: `Case study · ${project.tagline}`,
      kind: "page",
      aliases: aliasesOf(slug.replace(/-/g, " ")),
      keywords: tokens(slug, project.name, project.tagline, project.desc, ...project.stack, "work", "case study", "portfolio"),
    });
  }

  for (const offer of STARTER_OFFERS) {
    if (!offer.href.startsWith("/")) continue;
    add({
      id: `work-${offer.id}`,
      href: offer.href,
      title: offer.name,
      note: `Working demo · ${offer.deviceLabel}`,
      kind: "page",
      aliases: aliasesOf(offer.id.replace(/-/g, " ")),
      keywords: tokens(offer.id, offer.name, offer.deviceLabel, offer.description, "demo", "work", "services"),
    });
  }

  for (const page of PAGES) {
    add({
      id: `page-${page.href}`,
      href: page.href,
      title: page.title,
      note: page.note,
      kind: "page",
      aliases: aliasesOf(...(page.aliases ?? [])),
      keywords: tokens(page.title, page.note, ...(page.aliases ?? []), ...page.keywords),
    });
  }

  for (const route of scriptureRoutes.values()) {
    add({
      id: `page-${route.href}`,
      href: route.href,
      title: route.label,
      note: route.note ?? "",
      kind: "page",
      world: "scriptures",
      aliases: aliasesOf(...(ROOM_TRUE_ALIASES[route.href] ?? [])),
      keywords: tokens(route.label, route.note, ...(ROOM_KEYWORDS[route.href] ?? [])),
    });
  }
  return places;
}

export const FIND_CATALOG: FindPlace[] = buildCatalog();

export function placesForWorld(world: WorldId): FindPlace[] {
  const base = WORLD_GUIDES[world].base;
  return FIND_CATALOG.filter(
    (place) => place.world === world && place.kind === "room" && place.href !== base,
  );
}
