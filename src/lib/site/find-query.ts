import { parseTranslationPrefix } from "./find-text";
/**
 * Rank a Find query into grouped, labeled jumps.
 *
 * Nothing here generates an answer. A parsed reference is a door into the
 * hosted reader; everything else is a scored label from the static catalog
 * or a concordance/topic hit from the hosted indexes.
 */

import { traditionFor } from "@/lib/scriptures/client";
import { parseScriptureQueryRef } from "@/lib/scriptures/refs";
import type { RelatedSearchResult } from "@/lib/scriptures/related";
import type { SearchResult } from "@/lib/scriptures/search";
import { wordingLabel } from "@/lib/scriptures/search-wording";
import type { Canons, TranslationId } from "@/lib/scriptures/types";
import { earlyAllusionsForVerse } from "@/lib/early/allusions-lookup";
import { WORD_STUDIES } from "@/lib/jesus/word-studies";
import { HEXAPLA_PRESETS } from "@/lib/scriptures/polyglot";
import { findAngelsDossierPreset } from "@/lib/angels/notebooklm";
import { findJesusDossierPreset } from "@/lib/jesus/notebooklm";
import type { FindKind, FindPlace } from "./find-catalog";
import { rankActions } from "./find-actions";
import { LIBRARY_FIND } from "../early/library-find";

export type FindItem = {
  id: string;
  href: string;
  title: string;
  note: string;
  kind: FindKind | "ref" | "ask" | "verse" | "topic" | "action";
  score?: number;
  snippet?: string;
};

export type FindGroup = {
  id: string;
  label: string;
  note?: string;
  items: FindItem[];
};

export type FindRefHit = {
  book: string;
  chapter: number;
  verse?: number;
  href: string;
  title: string;
};

const PLACE_CAP = 8;
export const FIND_EXACT_CAP = 8;
const FIND_TOPIC_CAP = 4;
const FIND_RELATED_PASSAGE_CAP = 4;

export function passageHref(
  canons: Canons,
  book: string,
  chapter: number,
  verse?: number,
): string {
  const tradition = traditionFor(canons, book);
  const href = `/scriptures/${tradition}/${book}/${chapter}`;
  return verse ? `${href}#v${verse}` : href;
}

export function bookDisplayName(canons: Canons, book: string): string {
  return canons.books[book]?.name ?? book;
}

/**
 * Human-typed Scripture: "John 3:16", "1 Cor 13:4-7", or chapter-only
 * "John 3" / "Mk 14". Verse form wins when both could apply.
 */
export function parseFindRef(query: string, canons: Canons, preferredTranslation?: TranslationId): FindRefHit | null {
  const parsed = parseTranslationPrefix(query.trim(), preferredTranslation);
  const trimmed = parsed.text;
  const translation = preferredTranslation || parsed.text !== query.trim() ? parsed.translation : undefined;
  const hrefFor = (book: string, chapter: number, verse?: number) => {
    const href = passageHref(canons, book, chapter, verse);
    if (!translation) return href;
    const [base, anchor] = href.split("#");
    return `${base}?t=${translation}${anchor ? "#" + anchor : ""}`;
  };
  if (!trimmed) return null;

  const verse = parseScriptureQueryRef(trimmed, canons);
  if (verse) {
    if (translation && !canons.books[verse.book]?.trans.includes(translation)) return null;
    const name = bookDisplayName(canons, verse.book);
    const title = `${name} ${verse.chapter}:${verse.verse}${
      verse.endVerse ? `-${verse.endVerse}` : ""
    }`;
    return {
      book: verse.book,
      chapter: verse.chapter,
      verse: verse.verse,
      href: hrefFor(verse.book, verse.chapter, verse.verse),
      title,
    };
  }

  const chapterOnly = trimmed.match(/^(.+?)\s+(\d+)$/);
  if (!chapterOnly) return null;

  const synthetic = parseScriptureQueryRef(
    `${chapterOnly[1]} ${chapterOnly[2]}:1`,
    canons,
  );
  if (!synthetic || (translation && !canons.books[synthetic.book]?.trans.includes(translation))) return null;

  const name = bookDisplayName(canons, synthetic.book);
  return {
    book: synthetic.book,
    chapter: synthetic.chapter,
    href: hrefFor(synthetic.book, synthetic.chapter),
    title: `${name} ${synthetic.chapter}`,
  };
}

export function scorePlace(place: FindPlace, query: string): number {
  const q = query
    .trim()
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae");
  if (!q) return 0;

  const title = place.title
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae");
  const note = place.note
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae");
  const keys = place.keywords.map((key) =>
    key
      .toLowerCase()
      .replace(/œ/g, "oe")
      .replace(/æ/g, "ae"),
  );
  const hay = `${title} ${note} ${keys.join(" ")}`;

  if (title === q) return 100;
  if (keys.includes(q)) return 90;
  if (title.startsWith(q)) return 80;
  if (title.includes(q)) return 60;
  if (keys.some((key) => key.startsWith(q))) return 50;
  if (keys.some((key) => key.includes(q))) return 40;

  const tokens = q.split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length > 1 && tokens.every((token) => hay.includes(token))) return 35;
  if (note.includes(q)) return 20;
  return 0;
}

export function rankPlaces(catalog: FindPlace[], query: string, limit = PLACE_CAP): FindItem[] {
  return catalog
    .map((place) => ({ place, score: scorePlace(place, query) }))
    .filter((row) => row.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.place.title.localeCompare(b.place.title),
    )
    .slice(0, limit)
    .map(({ place, score }) => ({
      id: place.id,
      href: place.href,
      title: place.title,
      note: place.note,
      kind: place.kind,
      score,
    }));
}

export function rankFindQuery(
  query: string,
  catalog: FindPlace[],
  canons: Canons | null,
  translation?: TranslationId,
): FindGroup[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const groups: FindGroup[] = [];
  const ref = canons ? parseFindRef(trimmed, canons, translation) : null;
  if (ref) {
    const allusions = earlyAllusionsForVerse(ref.book, ref.chapter, ref.verse);
    const allusionNote =
      allusions.length > 0
        ? ` · Suggested matches in ${allusions.map((a) => `${a.textTitle} §${a.section}`).join(", ")}`
        : "";

    const items: FindItem[] = [
      {
        id: `ref-${ref.book}-${ref.chapter}-${ref.verse ?? 0}`,
        href: ref.href,
        title: ref.title,
        note: ref.verse
          ? `Jump to this verse in the reader.${allusionNote}`
          : `Jump to this chapter in the reader.${allusionNote}`,
        kind: "ref",
      },
    ];

    for (const a of allusions) {
      items.push({
        id: `allusion-${ref.book}-${ref.chapter}-${ref.verse}-${a.textId}-${a.section}`,
        href: a.href,
        title: `${a.textTitle} §${a.section}`,
        note: `Suggested match with ${ref.title} · The Writings`,
        kind: "section",
      });
    }

    groups.push({
      id: "ref",
      label: "Open a passage",
      note: "A hosted chapter. The words on the page are the text, not a summary.",
      items,
    });
  }

  const places = rankPlaces(catalog, trimmed);
  if (places.length > 0) {
    groups.push({
      id: "places",
      label: "Places in the record",
      items: places,
    });
  }

  const library = rankPlaces(LIBRARY_FIND, trimmed, 5);
  if (library.length) groups.push({ id: "library", label: "Library editions and sources", items: library });

  return groups;
}

export function topicLabel(topicId: string): string {
  return topicId
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function actionGroup(query: string): FindGroup | null {
  const items = rankActions(query);
  if (items.length === 0) return null;
  return {
    id: "actions",
    label: "Quick actions",
    note: "Directly adjust reading preferences without leaving this page.",
    items,
  };
}

export function exactWordGroup(
  result: SearchResult,
  canons: Canons,
  snippets?: Record<string, string>,
): FindGroup | null {
  if (result.hits.length === 0) return null;

  const trans = result.translation ?? "web";
  const transName =
    canons.translations[trans]?.name ?? trans.toUpperCase();

  const items: FindItem[] = result.hits.slice(0, FIND_EXACT_CAP).map((hit) => {
    const name = bookDisplayName(canons, hit.book);
    const note = `${wordingLabel(hit)} · ${transName}.`;
    const snippetKey = `${trans}:${hit.book}:${hit.chapter}:${hit.verse}`;
    return {
      id: `verse-${hit.book}-${hit.chapter}-${hit.verse}`,
      href: passageHref(canons, hit.book, hit.chapter, hit.verse).replace("#", `?t=${trans}#`),
      title: `${name} ${hit.chapter}:${hit.verse}`,
      note,
      kind: "verse",
      score: hit.matched,
      snippet: snippets?.[snippetKey],
    };
  });

  return {
    id: "exact",
    label: `Words and phrases (${trans.toUpperCase()})`,
    note:
      result.totalHits > FIND_EXACT_CAP
        ? `${result.totalHits.toLocaleString()} matching verses. The first ${FIND_EXACT_CAP} are here.`
        : `Concordance over the hosted ${transName} — not a generated answer.`,
    items,
  };
}

export function relatedTopicGroup(
  result: RelatedSearchResult,
  canons: Canons,
  exactKeys: Set<string>,
  trans = "web",
): FindGroup | null {
  const items: FindItem[] = [];

  for (const topic of result.topics.slice(0, FIND_TOPIC_CAP)) {
    items.push({
      id: `topic-${topic.id}`,
      href: `/scriptures/topics/${encodeURIComponent(topic.id)}`,
      title: topicLabel(topic.id),
      note: "Nave’s Topical Bible, 1897.",
      kind: "topic",
      score: topic.score,
    });
  }

  let passages = 0;
  for (const hit of result.hits) {
    if (passages >= FIND_RELATED_PASSAGE_CAP) break;
    const key = `${hit.book}:${hit.chapter}:${hit.verse}`;
    if (trans === "kjv" && exactKeys.has(key)) continue;
    const name = bookDisplayName(canons, hit.book);
    items.push({
      id: `related-${hit.book}-${hit.chapter}-${hit.verse}`,
      href: passageHref(canons, hit.book, hit.chapter, hit.verse).replace("#", "?t=kjv#"),
      title: `${name} ${hit.chapter}:${hit.verse}${
        hit.endVerse ? `–${hit.endVerse}` : ""
      }`,
      note: `Via ${topicLabel(hit.topicId)} — KJV source reference; an index connection, not a generated answer.`,
      kind: "verse",
      score: hit.score,
    });
    passages += 1;
  }

  if (items.length === 0) return null;

  return {
    id: "related",
    label: "Related topics (Nave 1897)",
    note: "Curated subject connections from 1897. They are places to look, not a judgement about meaning.",
    items,
  };
}

function askGroup(query: string, exact: SearchResult | null): FindGroup {
  query = parseTranslationPrefix(query).text;
  const total = exact?.totalHits ?? 0;
  const trans = exact?.translation ?? "web";
  const title =
    total > FIND_EXACT_CAP
      ? `See all ${total.toLocaleString()} word matches`
      : `Search Scripture for “${query}”`;
  const href =
    trans !== "web"
      ? `/scriptures/search?q=${encodeURIComponent(query)}&trans=${trans}`
      : `/scriptures/search?q=${encodeURIComponent(query)}`;
  return {
    id: "ask",
    label: "Ask the text",
    note: "Full concordance and patristic search, with shareable URLs.",
    items: [
      {
        id: "ask-scripture",
        href,
        title,
        note: "Words, phrases and related topics — no generated answer.",
        kind: "ask",
      },
      {
        id: "ask-early",
        href: `/early?q=${encodeURIComponent(query)}`,
        title: `Search early writings for “${query}”`,
        note: "Filter titles on the original 23-text shelf.",
        kind: "ask",
      },
      {
        id: "ask-early-library",
        href: `/early/search?q=${encodeURIComponent(query)}`,
        title: `Search all editions for “${query}”`,
        note: "Translated text, historical commentary and reference records, separately labelled.",
        kind: "ask",
      },
      {
        id: "ask-early-meaning",
        href: `/early?ask=${encodeURIComponent(query)}`,
        title: `Ask the writings (by meaning): “${query}”`,
        note: "Original shelf only. Expanded editions have a separate meaning search. Similarity does not prove dependence.",
        kind: "ask",
      },
      {
        id: "ask-library-meaning",
        href: `/early/search?q=${encodeURIComponent(query)}`,
        title: `Ask the expanded editions (by meaning): “${query}”`,
        note: "Translated text in the expanded editions. Similarity does not prove dependence.",
        kind: "ask",
      },
      {
        id: "ask-resonance",
        href: `/scriptures/resonance?q=${encodeURIComponent(query)}`,
        title: `7-Horizon conceptual resonance: “${query}”`,
        note: "Scan Torah, Prophets, Gospels, Epistles, Fathers, and Antiquity.",
        kind: "ask",
      },
    ],
  };
}

export function parseResonanceQuery(
  query: string,
): { concept: string; title: string; href: string } | null {
  const match = query.trim().match(/^(?:radar|resonance|concept|spectrum)\s+(.+)$/i);
  if (!match) return null;
  const concept = match[1].trim();
  if (!concept) return null;
  return {
    concept,
    title: `Compare corpus similarity: “${concept}”`,
    href: `/scriptures/resonance?q=${encodeURIComponent(concept)}`,
  };
}

export function parseCanonQuery(
  query: string,
): { title: string; href: string; note: string } | null {
  const trimmed = query.trim();
  const compareMatch = trimmed.match(/^compare\s+(\w+)\s+(?:and|to|vs\.?)\s+(\w+)$/i);
  if (compareMatch) {
    const [, t1, t2] = compareMatch;
    return {
      title: `Compare canons: ${t1.toUpperCase()} vs. ${t2.toUpperCase()}`,
      href: `/scriptures/canons#canons-matrix`,
      note: `Inspect differences and shared books between ${t1} and ${t2}.`,
    };
  }

  const canonMatch = trimmed.match(/^canons?(?:\s+(\w+))?$/i);
  if (canonMatch) {
    const tradition = canonMatch[1]?.toLowerCase();
    if (tradition) {
      return {
        title: `Explore ${tradition.toUpperCase()} Canon`,
        href: `/scriptures/canons#canons-matrix`,
        note: `Inspect canonical books, manuscript witnesses, and history.`,
      };
    }
    return {
      title: `Explore Multi-Canonicity Matrix`,
      href: `/scriptures/canons`,
      note: `Compare Protestant, Catholic, Orthodox, Ethiopian, and Jewish canons.`,
    };
  }

  return null;
}

export function parsePathQuery(
  query: string,
  canons: Canons | null,
): { fromId: string; toId: string; fromTitle: string; toTitle: string } | null {
  if (!canons) return null;
  const match = query.trim().match(/^path\s+(.+?)\s+(?:to|->|—)\s+(.+)$/i);
  if (!match) return null;

  const [, rawFrom, rawTo] = match;
  const from = parseScriptureQueryRef(rawFrom.trim(), canons);
  const to = parseScriptureQueryRef(rawTo.trim(), canons);
  if (!from || !to || from.endVerse !== undefined || to.endVerse !== undefined) return null;

  const fromId = `${from.book}.${from.chapter}.${from.verse}`;
  const toId = `${to.book}.${to.chapter}.${to.verse}`;
  const fromName = bookDisplayName(canons, from.book);
  const toName = bookDisplayName(canons, to.book);

  return {
    fromId,
    toId,
    fromTitle: `${fromName} ${from.chapter}:${from.verse}`,
    toTitle: `${toName} ${to.chapter}:${to.verse}`,
  };
}

export const CONSOLE_COMMANDS: Array<{
  command: string;
  example: string;
  description: string;
  href: string;
}> = [
  {
    command: "path [ref] to [ref]",
    example: "path Gen 1:1 to Rev 22:21",
    description: "Bounded route through the indexed cross-reference graph.",
    href: "/scriptures/graph?from=GEN.1.1&to=REV.22.21",
  },
  {
    command: "radar [concept]",
    example: "radar living water",
    description: "Compare similarity across indexed Scripture and early-text collections.",
    href: "/scriptures/resonance?q=living+water",
  },
  {
    command: "compare [t1] and [t2]",
    example: "compare catholic and protestant",
    description: "Multi-canonicity comparison across traditions.",
    href: "/scriptures/canons#canons-matrix",
  },
  {
    command: "diff [pericope]",
    example: "diff beatitudes",
    description: "Word-level synoptic harmony diffing across the Gospels.",
    href: "/jesus/harmony",
  },
  {
    command: "hexapla [passage]",
    example: "hexapla psalm 22",
    description: "Digital Hexapla: collate original languages, Septuagint, and Vulgate.",
    href: "/scriptures/polyglot",
  },
  {
    command: "catena [passage]",
    example: "catena isaiah 53",
    description: "Catena Aurea: Ante-Nicene patristic reception chain.",
    href: "/scriptures/catena",
  },
  {
    command: "dossier [passage/topic]",
    example: "dossier isaiah 53",
    description: "NotebookLM: generate source-grounded research dossier & audio prompt.",
    href: "/scriptures/dossier",
  },
  {
    command: "diachronic [concept]",
    example: "diachronic ruach",
    description: "Semantic evolution: 1,500-year linguistic shift across Hebrew, Greek, and Latin.",
    href: "/scriptures/diachronic",
  },
  {
    command: "dispute [topic]",
    example: "dispute suffering",
    description: "Sacred disputation: stage great dialectical debates across Scripture and Tradition.",
    href: "/scriptures/disputation",
  },
  {
    command: "study [word/root]",
    example: "study epiousios",
    description: "Greek/Hebrew critical underlay and original language lexical study.",
    href: "/jesus/words?study=lords-prayer",
  },
  {
    command: "allusion [ref]",
    example: "allusion Psalm 22:1",
    description: "Ante-Nicene patristic quotations of biblical verses.",
    href: "/scriptures/protestant/PSA/22#v1",
  },
];

export function parseConsoleHelpQuery(
  query: string,
): { title: string; items: FindItem[] } | null {
  const trimmed = query.trim().toLowerCase();
  if (
    trimmed !== "?" &&
    trimmed !== "help" &&
    trimmed !== "console" &&
    trimmed !== "commands" &&
    trimmed !== "> help" &&
    trimmed !== "/help"
  ) {
    return null;
  }

  const items: FindItem[] = CONSOLE_COMMANDS.map((cmd) => ({
    id: `cmd-help-${cmd.example.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    href: cmd.href,
    title: "> " + cmd.example,
    note: `${cmd.command} · ${cmd.description}`,
    kind: "action",
    score: 1000,
  }));

  return {
    title: "Classical Knowledge Console Commands",
    items,
  };
}

export function parseHarmonyQuery(
  query: string,
): { pericopeId?: string; title: string; href: string; note: string } | null {
  const trimmed = query.trim();
  const match = trimmed.match(/^(?:diff|harmony|synoptic)(?:\s+(.+))?$/i);
  if (!match) return null;
  const rawTarget = match[1]?.trim().toLowerCase();
  if (!rawTarget) {
    return {
      title: "Open Synoptic Harmony & Pericope Diffing Engine",
      href: "/jesus/harmony",
      note: "Multi-gospel alignment highlighting Triple Tradition, Q-material, and Sondergut.",
    };
  }

  const PERICOPE_ALIASES: Record<string, { id: string; title: string }> = {
    beatitudes: { id: "beatitudes", title: "The Beatitudes" },
    blessed: { id: "beatitudes", title: "The Beatitudes" },
    "lords prayer": { id: "lords-prayer", title: "The Lord's Prayer" },
    "lord's prayer": { id: "lords-prayer", title: "The Lord's Prayer" },
    prayer: { id: "lords-prayer", title: "The Lord's Prayer" },
    temptation: { id: "temptation", title: "The Temptation in the Wilderness" },
    wilderness: { id: "temptation", title: "The Temptation in the Wilderness" },
    storm: { id: "stilling-the-storm", title: "Stilling the Storm" },
    "stilling the storm": { id: "stilling-the-storm", title: "Stilling the Storm" },
    paralytic: { id: "healing-paralytic", title: "Healing of the Paralytic" },
    healing: { id: "healing-paralytic", title: "Healing of the Paralytic" },
    feeding: { id: "feeding-5000", title: "Feeding of the Five Thousand" },
    "5000": { id: "feeding-5000", title: "Feeding of the Five Thousand" },
    "feeding 5000": { id: "feeding-5000", title: "Feeding of the Five Thousand" },
    "peters confession": { id: "peters-confession", title: "Peter's Confession of Christ" },
    "peter's confession": { id: "peters-confession", title: "Peter's Confession of Christ" },
    transfiguration: { id: "transfiguration", title: "The Transfiguration" },
    commandment: { id: "greatest-commandment", title: "The Greatest Commandment" },
    "greatest commandment": { id: "greatest-commandment", title: "The Greatest Commandment" },
    supper: { id: "last-supper", title: "The Institution of the Lord's Supper" },
    "last supper": { id: "last-supper", title: "The Institution of the Lord's Supper" },
    "lords supper": { id: "last-supper", title: "The Institution of the Lord's Supper" },
    gethsemane: { id: "gethsemane", title: "The Agony in Gethsemane" },
    tomb: { id: "empty-tomb", title: "The Empty Tomb at Dawn" },
    "empty tomb": { id: "empty-tomb", title: "The Empty Tomb at Dawn" },
    resurrection: { id: "empty-tomb", title: "The Empty Tomb at Dawn" },
  };

  const matched = Object.entries(PERICOPE_ALIASES).find(([alias]) =>
    rawTarget.includes(alias) || alias.includes(rawTarget),
  );

  if (matched) {
    return {
      pericopeId: matched[1].id,
      title: `Compare pericope: ${matched[1].title}`,
      href: `/jesus/harmony`,
      note: `Word-level diff across parallel Gospel accounts for ${matched[1].title}.`,
    };
  }

  return {
    title: `Search Synoptic Harmony for “${rawTarget}”`,
    href: `/jesus/harmony`,
    note: `Explore gospel pericopes and parallel accounts.`,
  };
}

export function parseHexaplaQuery(
  query: string,
): { title: string; href: string; note: string; presetId?: string } | null {
  const trimmed = query.trim();
  const match = trimmed.match(/^(?:hexapla|polyglot|interlinear|collate)(?:\s+(.+))?$/i);
  if (!match) return null;
  const rawTarget = match[1]?.trim().toLowerCase();
  if (!rawTarget) {
    return {
      title: "Open The Living Digital Hexapla & Multi-Witness Polyglot",
      href: "/scriptures/polyglot",
      note: "Collate named Hebrew/Greek editions with Brenton, Douay-Rheims, KJV, and WEB English translations.",
    };
  }

  const foundPreset = HEXAPLA_PRESETS.find(
    (p) =>
      p.id.includes(rawTarget) ||
      p.book.toLowerCase() === rawTarget ||
      p.bookName.toLowerCase().includes(rawTarget) ||
      p.title.toLowerCase().includes(rawTarget),
  );

  if (foundPreset) {
    return {
      presetId: foundPreset.id,
      title: `Hexapla: ${foundPreset.title}`,
      href: `/scriptures/polyglot?preset=${encodeURIComponent(foundPreset.id)}`,
      note: `5-witness alignment and critical divergence apparatus for ${foundPreset.bookName} ${foundPreset.chapter}.`,
    };
  }

  return {
    title: `Hexapla: Collate ancient witnesses for “${rawTarget}”`,
    href: `/scriptures/polyglot`,
    note: `Compare ancient manuscript traditions with word-level morphology.`,
  };
}

export function parseCatenaQuery(
  query: string,
): { title: string; href: string; note: string } | null {
  const trimmed = query.trim();
  const match = trimmed.match(/^(?:catena|patristic|fathers|reception)(?:\s+(.+))?$/i);
  if (!match) return null;
  const rawTarget = match[1]?.trim();
  if (!rawTarget) {
    return {
      title: "Open The Computational Catena Aurea",
      href: "/scriptures/catena",
      note: "Trace the unbroken golden chain linking Scripture to 1st–3rd century Church Fathers.",
    };
  }

  return {
    title: `Catena Aurea: Patristic reception of “${rawTarget}”`,
    href: `/scriptures/catena`,
    note: `Explore Ante-Nicene patristic citations, commentary, and theological reception.`,
  };
}

export function parseDossierQuery(
  query: string,
): { title: string; href: string; note: string } | null {
  const trimmed = query.trim();
  const match = trimmed.match(/^(?:dossier|notebooklm|audio-prompt|dossiers)(?:\s+(.+))?$/i);
  if (!match) return null;
  const rawTarget = match[1]?.trim();
  if (!rawTarget) {
    return {
      title: "Open Universal NotebookLM Research Dossier Engine",
      href: "/scriptures/dossier",
      note: "Collate multi-witness manuscripts and patristic reception into NotebookLM dossiers.",
    };
  }

  const angelsMatch = rawTarget.match(
    /^(?:angels?|demons?|watchers?)(?:\s+(.+))?$/i,
  );
  if (angelsMatch) {
    const target = angelsMatch[1]?.trim() || rawTarget;
    const preset = findAngelsDossierPreset(target);
    return {
      title: `NotebookLM Dossier: Angels & Demons research collation for “${rawTarget}”`,
      href: preset
        ? `/angels/dossier?preset=${encodeURIComponent(preset.id)}`
        : `/angels/dossier?target=${encodeURIComponent(target)}`,
      note: "Build a worksheet from hosted Scripture, named source notes, and an Audio Overview prompt on unseen realities.",
    };
  }

  const jesusMatch = rawTarget.match(/^(?:jesus|christ)(?:\s+(.+))?$/i);
  const isKnownJesusTopic =
    /^(?:testimonium|josephus|messiah|isaiah\s*53|resurrection|synoptic|son of man|tacitus|pliny|seven sayings|temple cleansing)/i.test(
      rawTarget,
    );
  if (jesusMatch || isKnownJesusTopic) {
    const target = jesusMatch?.[1]?.trim() || rawTarget;
    const preset = findJesusDossierPreset(target);
    return {
      title: `NotebookLM Dossier: Historical Jesus research collation for “${rawTarget}”`,
      href: preset
        ? `/jesus/dossier?preset=${encodeURIComponent(preset.id)}`
        : `/jesus/dossier?target=${encodeURIComponent(target)}`,
      note: "Build a worksheet from hosted Scripture, named historical source notes, and an Audio Overview prompt.",
    };
  }

  return {
    title: `NotebookLM Dossier: Research collation for “${rawTarget}”`,
    href: `/scriptures/dossier`,
    note: `Build a source-aware worksheet and dialectical Audio Overview prompt.`,
  };
}

export function parseDiachronicQuery(
  query: string,
): { title: string; href: string; note: string } | null {
  const trimmed = query.trim();
  const match = trimmed.match(/^(?:diachronic|evolution|semantic|etymology)(?:\s+(.+))?$/i);
  if (!match) return null;
  const rawTarget = match[1]?.trim();
  if (!rawTarget) {
    return {
      title: "Open The Diachronic Semantic Evolution Tracker",
      href: "/scriptures/diachronic",
      note: "Trace 1,500 years of linguistic migration across Hebrew, Greek, and Latin.",
    };
  }

  return {
    title: `Diachronic Evolution: Linguistic migration for “${rawTarget}”`,
    href: `/scriptures/diachronic`,
    note: `Analyze ancient semantic shifts from Semitic roots to Hellenistic philosophy and Roman law.`,
  };
}

export function parseDisputationQuery(
  query: string,
): { title: string; href: string; note: string } | null {
  const trimmed = query.trim();
  const match = trimmed.match(/^(?:dispute|disputation|debate|dialectic)(?:\s+(.+))?$/i);
  if (!match) return null;
  const rawTarget = match[1]?.trim();
  if (!rawTarget) {
    return {
      title: "Open The Polyphonic Sacred Disputation Engine",
      href: "/scriptures/disputation",
      note: "Stage the foundational theological debates across Scripture and Tradition.",
    };
  }

  return {
    title: `Sacred Disputation: Dialectical debate on “${rawTarget}”`,
    href: `/scriptures/disputation`,
    note: `Compare opposing and complementary scriptural horizons and patristic synthesis.`,
  };
}

export function parseWordStudyQuery(
  query: string,
): { title: string; href: string; note: string } | null {
  const trimmed = query.trim();
  const match = trimmed.match(/^(?:root|study|lemma|greek|hebrew)\s+(.+)$/i);
  if (!match) return null;
  const rawTarget = match[1].trim();
  if (!rawTarget) return null;

  const targetLower = rawTarget.toLowerCase();

  const foundStudy = WORD_STUDIES.find(
    (s) =>
      s.id.toLowerCase() === targetLower ||
      s.title.toLowerCase().includes(targetLower) ||
      s.language.term.toLowerCase() === targetLower ||
      s.language.transliteration.toLowerCase() === targetLower ||
      s.theme.toLowerCase() === targetLower,
  );

  if (foundStudy) {
    return {
      title: `Word study: ${foundStudy.language.term} (${foundStudy.language.transliteration}) · “${foundStudy.title}”`,
      href: `/jesus/words?study=${foundStudy.id}`,
      note: `${foundStudy.saying} · ${foundStudy.anchor.label} critical underlay`,
    };
  }

  return {
    title: `Original language study: “${rawTarget}”`,
    href: `/scriptures/search?q=${encodeURIComponent(rawTarget)}`,
    note: `Search critical edition lemmas and biblical occurrences for “${rawTarget}”.`,
  };
}

export function parseAllusionQuery(
  query: string,
  canons: Canons | null,
): { title: string; href: string; note: string; items: FindItem[] } | null {
  if (!canons) return null;
  const trimmed = query.trim();
  const match = trimmed.match(/^(?:allusions?|quotes?|cited)\s+(.+)$/i);
  if (!match) return null;
  const rawRef = match[1].trim();
  const ref = parseScriptureQueryRef(rawRef, canons);
  if (!ref || !ref.verse) return null;

  const allusions = earlyAllusionsForVerse(ref.book, ref.chapter, ref.verse);
  const refName = bookDisplayName(canons, ref.book);
  const refTitle = `${refName} ${ref.chapter}:${ref.verse}`;

  if (allusions.length === 0) {
    return {
      title: `Early allusions to ${refTitle}`,
      href: passageHref(canons, ref.book, ref.chapter, ref.verse),
      note: `No direct early patristic quotations found for ${refTitle} in the Ante-Nicene index.`,
      items: [
        {
          id: `allusion-empty-${ref.book}-${ref.chapter}-${ref.verse}`,
          href: passageHref(canons, ref.book, ref.chapter, ref.verse),
          title: `Open ${refTitle} in reader`,
          note: `No Ante-Nicene citations recorded for this specific verse.`,
          kind: "ref",
          score: 1000,
        },
      ],
    };
  }

  const items: FindItem[] = allusions.map((a) => ({
    id: `allusion-${ref.book}-${ref.chapter}-${ref.verse}-${a.textId}-${a.section}`,
    href: a.href,
    title: `${a.textTitle} §${a.section}`,
    note: `Quotes ${refTitle} · The Writings (Ante-Nicene)`,
    kind: "section",
    score: 1000,
  }));

  return {
    title: `Ante-Nicene Quotations of ${refTitle} (${allusions.length})`,
    href: items[0]?.href ?? passageHref(canons, ref.book, ref.chapter, ref.verse),
    note: `Early patristic citations of ${refTitle}.`,
    items,
  };
}

/** Only explicit command mode may bypass text search. */
export function findCommand(query: string): string | null {
  const trimmed = query.trim();
  if (trimmed === "?") return "help";
  return /^[>/]/.test(trimmed) ? trimmed.slice(1).trim() : null;
}

function commandGroups(command: string, canons: Canons | null): FindGroup[] {
  const trimmed = command;
  const helpMatch = parseConsoleHelpQuery(trimmed);
  if (helpMatch) {
    return [
      {
        id: "console-help",
        label: "Classical Knowledge Console",
        note: "Domain-aware scholarly commands: path, radar, compare, diff, hexapla, catena, dossier, diachronic, dispute, study, allusion.",
        items: helpMatch.items,
      },
    ];
  }

  const canonMatch = parseCanonQuery(trimmed);
  if (canonMatch) {
    return [
      {
        id: "canons",
        label: "Multi-Canonicity & Tradition Matrix",
        note: "Compare biblical canons across traditions and manuscript witnesses.",
        items: [
          {
            id: `canon-${trimmed.toLowerCase().replace(/\s+/g, "-")}`,
            href: canonMatch.href,
            title: canonMatch.title,
            note: canonMatch.note,
            kind: "action",
            score: 1000,
          },
        ],
      },
    ];
  }

  const resonanceMatch = parseResonanceQuery(trimmed);
  if (resonanceMatch) {
    return [
      {
        id: "resonance",
        label: "Conceptual Resonance Matrix",
        note: "Compare Scripture chapters, early texts, and editorial framework summaries.",
        items: [
          {
            id: `resonance-${resonanceMatch.concept.toLowerCase().replace(/\s+/g, "-")}`,
            href: resonanceMatch.href,
            title: resonanceMatch.title,
            note: `Trace how “${resonanceMatch.concept}” reverberates from the Torah to Ante-Nicene writings.`,
            kind: "action",
            score: 1000,
          },
        ],
      },
    ];
  }

  const pathMatch = parsePathQuery(trimmed, canons);
  if (pathMatch) {
    return [
      {
        id: "path",
        label: "Scripture Path Tracer",
        note: "A bounded route through the indexed cross-reference graph.",
        items: [
          {
            id: `path-${pathMatch.fromId}-${pathMatch.toId}`,
            href: `/scriptures/graph?from=${encodeURIComponent(pathMatch.fromId)}&to=${encodeURIComponent(pathMatch.toId)}`,
            title: `Trace path: ${pathMatch.fromTitle} → ${pathMatch.toTitle}`,
            note: `Follow indexed cross-reference links between ${pathMatch.fromTitle} and ${pathMatch.toTitle}.`,
            kind: "action",
            score: 1000,
          },
        ],
      },
    ];
  }

  const harmonyMatch = parseHarmonyQuery(trimmed);
  if (harmonyMatch) {
    return [
      {
        id: "harmony",
        label: "Synoptic Gospel Harmony",
        note: "Word-level diff across parallel Gospel accounts.",
        items: [
          {
            id: `harmony-${(harmonyMatch.pericopeId || "index")}`,
            href: harmonyMatch.href,
            title: harmonyMatch.title,
            note: harmonyMatch.note,
            kind: "action",
            score: 1000,
          },
        ],
      },
    ];
  }

  const hexaplaMatch = parseHexaplaQuery(trimmed);
  if (hexaplaMatch) {
    return [
      {
        id: "hexapla",
        label: "Digital Hexapla & Multi-Witness Apparatus",
        note: "Side-by-side collation across ancient manuscript traditions.",
        items: [
          {
            id: `hexapla-${(hexaplaMatch.presetId || "index")}`,
            href: hexaplaMatch.href,
            title: hexaplaMatch.title,
            note: hexaplaMatch.note,
            kind: "action",
            score: 1000,
          },
        ],
      },
    ];
  }

  const catenaMatch = parseCatenaQuery(trimmed);
  if (catenaMatch) {
    return [
      {
        id: "catena",
        label: "Catena Aurea Patristic Reception",
        note: "Ante-Nicene Church Fathers citing and expounding Scripture.",
        items: [
          {
            id: "catena-target",
            href: catenaMatch.href,
            title: catenaMatch.title,
            note: catenaMatch.note,
            kind: "action",
            score: 1000,
          },
        ],
      },
    ];
  }

  const dossierMatch = parseDossierQuery(trimmed);
  if (dossierMatch) {
    return [
      {
        id: "dossier",
        label: "NotebookLM Research Dossier Engine",
        note: "Compile multi-witness collation and Ante-Nicene patristic reception.",
        items: [
          {
            id: "dossier-target",
            href: dossierMatch.href,
            title: dossierMatch.title,
            note: dossierMatch.note,
            kind: "action",
            score: 1000,
          },
        ],
      },
    ];
  }

  const diachronicMatch = parseDiachronicQuery(trimmed);
  if (diachronicMatch) {
    return [
      {
        id: "diachronic",
        label: "Diachronic Semantic Evolution",
        note: "1,500-year linguistic and theological migration tracker.",
        items: [
          {
            id: "diachronic-target",
            href: diachronicMatch.href,
            title: diachronicMatch.title,
            note: diachronicMatch.note,
            kind: "action",
            score: 1000,
          },
        ],
      },
    ];
  }

  const disputationMatch = parseDisputationQuery(trimmed);
  if (disputationMatch) {
    return [
      {
        id: "disputation",
        label: "Polyphonic Sacred Disputation",
        note: "Dialectical debates across biblical and patristic witnesses.",
        items: [
          {
            id: "disputation-target",
            href: disputationMatch.href,
            title: disputationMatch.title,
            note: disputationMatch.note,
            kind: "action",
            score: 1000,
          },
        ],
      },
    ];
  }

  const wordStudyMatch = parseWordStudyQuery(trimmed);
  if (wordStudyMatch) {
    return [
      {
        id: "word-study",
        label: "Original Language Word Study",
        note: "Greek critical edition and lexical studies.",
        items: [
          {
            id: `word-study-${trimmed.toLowerCase().replace(/\s+/g, "-")}`,
            href: wordStudyMatch.href,
            title: wordStudyMatch.title,
            note: wordStudyMatch.note,
            kind: "action",
            score: 1000,
          },
        ],
      },
    ];
  }

  const allusionMatch = parseAllusionQuery(trimmed, canons);
  if (allusionMatch) {
    return [
      {
        id: "allusions",
        label: allusionMatch.title,
        note: allusionMatch.note,
        items: allusionMatch.items,
      },
    ];
  }

  const actions = actionGroup("> " + command);
  return actions ? [actions] : [];
}

export function assembleFindGroups({
  query,
  catalog,
  canons,
  exact,
  related,
  exactFailed = false,
  snippets,
  translation,
}: {
  query: string;
  catalog: FindPlace[];
  canons: Canons | null;
  exact: SearchResult | null;
  related: RelatedSearchResult | null;
  exactFailed?: boolean;
  snippets?: Record<string, string>;
  translation?: TranslationId;
}): FindGroup[] {
  const trimmed = query.trim();
  const command = findCommand(trimmed);
  if (command !== null) return commandGroups(command, canons);

  const groups = rankFindQuery(trimmed, catalog, canons, translation);

  const ref = canons ? parseFindRef(trimmed, canons, translation) : null;
  if (!trimmed || ref) return groups;

  if (!exactFailed && exact && canons) {
    const group = exactWordGroup(exact, canons, snippets);
    if (group) groups.push(group);
  }

  if (related && canons) {
    const exactKeys = new Set(
      (exact?.hits ?? []).map((hit) => `${hit.book}:${hit.chapter}:${hit.verse}`),
    );
    const group = relatedTopicGroup(related, canons, exactKeys, exact?.translation ?? parseTranslationPrefix(trimmed, translation).translation);
    if (group) groups.push(group);
  }

  groups.push(askGroup(trimmed, exactFailed ? null : exact));
  return groups;
}

export function flattenGroups(groups: FindGroup[]): FindItem[] {
  return groups.flatMap((group) => group.items);
}
