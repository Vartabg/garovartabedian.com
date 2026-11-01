import { SYNOPTIC_FIGURES } from "@/lib/jesus/synoptic-figures";
import { JOHN_FIGURES } from "@/lib/jesus/john-figures";
/**
 * Every place Find can jump to without asking a model or a server.
 *
 * Assembled at module load from registries the site already publishes:
 * worlds, rooms, early texts, apostle records, church giants, named walks,
 * and the hire cluster. Duplicate hrefs keep the first entry so a room is
 * not listed twice under two labels.
 */

import twelveJson from "../../../public/apostles/twelve.json";
import giantsJson from "../../../public/church/giants.json";
import readingPathsJson from "../../../public/meta/reading-paths.json";
import councilsJson from "../../../public/church/councils.json";
import propheciesJson from "../../../public/jesus/prophecies.json";
import parablesJson from "../../../public/jesus/parables.json";
import { THOMAS_PARABLES } from "@/lib/jesus/thomas-parables";
import { JAMES_PARABLES } from "@/lib/jesus/james-parables";
import { EARLY_FIGURES } from "@/lib/jesus/early-figures";
import casesJson from "../../../public/word/cases.json";
import lifeJson from "../../../public/jesus/life.json";
import type { Apostle, TwelveData } from "@/lib/apostles/types";
import type { Giant, GiantsData } from "@/lib/church/types";
import earlySectionsJson from "../../../public/early/catalog.json";
import { EARLY_TEXTS, TEXT_ERA, eraById } from "@/lib/early/client";
import { WORLD_GUIDES, type WorldId } from "@/lib/world-guidance";
import { WORLD_REGISTRY } from "@/lib/world-registry";
import { getWorldRoutes } from "@/lib/site-navigation";

export type FindKind =
  | "world"
  | "room"
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
  keywords: string[];
};

export type ReadingPathStep = { href: string; label: string; note: string };
export type ReadingPath = {
  id: string;
  title: string;
  line: string;
  steps: ReadingPathStep[];
};

const WORLD_ALIASES: Record<WorldId, string[]> = {
  scriptures: ["bible", "text", "canon", "reader", "tanakh", "torah", "ketuvim"],
  jesus: ["christ", "gospel", "lord"],
  apostles: ["twelve", "disciples"],
  early: ["fathers", "writings", "patristic", "apocrypha", "apologists"],
  church: ["history", "councils"],
  angels: ["demons", "satan", "unseen"],
  word: ["copyright", "translation", "license", "fences"],
  evidence: ["claims", "method", "how we know"],
};

const ROOM_ALIASES: Record<string, string[]> = {
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

const PAGES: Array<{ href: string; title: string; note: string; keywords: string[] }> = [
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
    keywords: ["hexapla", "polyglot", "interlinear", "brenton", "vulgate", "masoretic", "apparatus", "divergence", "witnesses", "origen", "walton"],
  },
  {
    href: "/scriptures/catena",
    title: "Computational Catena Aurea (Patristic Reception Chain)",
    note: "Unbroken golden chain linking biblical verses to 1st–3rd century Church Fathers (Clement, Ignatius, Polycarp, Didache).",
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
    keywords: ["diachronic", "linguistics", "semantic shift", "ruach", "pneuma", "sheol", "hades", "tzedakah", "evolution", "etymology"],
  },
  {
    href: "/scriptures/disputation",
    title: "The Polyphonic Sacred Disputation Engine",
    note: "Stage the foundational theological debates: Job vs Proverbs, Paul vs James, Mark vs John with NotebookLM debate dossiers.",
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
    keywords: ["harmony", "synoptic", "synoptic harmony", "word by word", "diff", "pericope", "gospels", "sondergut", "triple", "tradition"],
  },
  {
    href: "/hire",
    title: "For recruiters",
    note: "Hiring overview and proof of the work.",
    keywords: ["jobs", "resume", "cv", "recruiter"],
  },
  {
    href: "/about",
    title: "About this site",
    note: "Who built it, and why it exists.",
    keywords: ["garo", "author"],
  },
  {
    href: "/work",
    title: "Work & case studies",
    note: "JobPilot, this site, EYE, atxbro.",
    keywords: ["portfolio", "projects"],
  },
  {
    href: "/resume",
    title: "Résumé",
    note: "The résumé page and the PDF.",
    keywords: ["cv"],
  },
  {
    href: "/contact",
    title: "Contact",
    note: "Email and the ways to reach Garo.",
    keywords: ["email"],
  },
  {
    href: "/sources",
    title: "Sources & method",
    note: "The audit trail for every world.",
    keywords: ["citations", "bibliography"],
  },
  {
    href: "/services",
    title: "Services",
    note: "What the independent practice offers.",
    keywords: ["consulting"],
  },
];

function tokens(...parts: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    const normalized = part
      .toLowerCase()
      .replace(/œ/g, "oe")
      .replace(/æ/g, "ae");
    for (const token of normalized.split(/[^a-z0-9]+/)) {
      if (token.length < 2 || seen.has(token)) continue;
      seen.add(token);
      out.push(token);
    }
  }
  return out;
}

export const READING_PATHS: ReadingPath[] = (
  readingPathsJson as { paths: ReadingPath[] }
).paths;

function buildCatalog(): FindPlace[] {
  const places: FindPlace[] = [];
  const seen = new Set<string>();
  const scriptureRoutes = new Map(getWorldRoutes("scriptures").filter(route => route.href !== "/scriptures").map(route => [route.href, route]));

  const add = (place: FindPlace) => {
    if (seen.has(place.href)) return;
    seen.add(place.href);
    const canonical = scriptureRoutes.get(place.href);
    places.push(canonical ? { ...place, title: canonical.label, note: canonical.note ?? place.note,
      keywords: tokens(...place.keywords, canonical.label, canonical.note) } : place);
  };

  for (const world of WORLD_REGISTRY) {
    add({
      id: `world-${world.id}`,
      href: world.href,
      title: world.label,
      note: world.hint,
      kind: "world",
      world: world.id,
      keywords: tokens(world.id, world.label, world.hint, ...(WORLD_ALIASES[world.id] ?? [])),
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
        keywords: tokens(link.label, link.note, world.label, ...(ROOM_ALIASES[link.href] ?? [])),
      });
    }
  }

  for (const text of EARLY_TEXTS) {
    add({
      id: `text-${text.id}`,
      href: `/early/${text.id}`,
      title: text.title,
      note: `${text.date}. ${text.blurb}`,
      kind: "text",
      world: "early",
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
    keywords: tokens(
      "neviim",
      "prophets",
      "tanakh",
      "isaiah",
      "jeremiah",
      "ezekiel",
    ),
  });

  const apostles = (twelveJson as TwelveData).apostles as Apostle[];
  for (const apostle of apostles) {
    add({
      id: `apostle-${apostle.id}`,
      href: `/apostles/twelve#${apostle.id}`,
      title: apostle.name,
      note: apostle.glanceCall,
      kind: "person",
      world: "apostles",
      keywords: tokens(apostle.id, apostle.name, apostle.aka, apostle.meaning),
    });
  }

  const giants = (giantsJson as GiantsData).giants as Giant[];
  for (const giant of giants) {
    add({
      id: `giant-${giant.id}`,
      href: `/church/giants#${giant.id}`,
      title: giant.name,
      note: giant.stands,
      kind: "person",
      world: "church",
      keywords: tokens(giant.id, giant.name, giant.stands, giant.place),
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
      keywords: tokens(figure.id, figure.title, ...refs, "Matthew", "Mark", "Luke", "figure of speech", "parable", "parables", ...(figure.thomas ?? []).map((entry) => `Thomas ${entry.saying}`)),
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
      keywords: tokens(figure.id, figure.title, figure.work, figure.locator, "parable", "figures of speech", ...(figure.thomas ?? []).map(item => `Thomas ${item.saying}`)),
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
    add({
      id: `path-${path.id}`,
      href: path.steps[0]?.href ?? "/",
      title: path.title,
      note: path.line,
      kind: "path",
      keywords: tokens(path.id, path.title, path.line),
    });
  }

  for (const page of PAGES) {
    add({
      id: `page-${page.href}`,
      href: page.href,
      title: page.title,
      note: page.note,
      kind: "page",
      keywords: tokens(page.title, page.note, ...page.keywords),
    });
  }

  for (const route of scriptureRoutes.values()) {
    add({ id: `page-${route.href}`, href: route.href, title: route.label, note: route.note ?? "",
      kind: "page", world: "scriptures", keywords: tokens(route.label, route.note, ...(ROOM_ALIASES[route.href] ?? [])) });
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
