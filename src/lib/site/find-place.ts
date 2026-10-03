/**
 * Continue-from-here: doors computed from the current URL, not from what
 * a reader previously opened. No session history.
 */

import { WORLD_BY_ID, WORLD_REGISTRY, type WorldId } from "@/lib/world-registry";
import { WORLD_GUIDES } from "@/lib/world-guidance";
import { EARLY_TEXTS } from "@/lib/early/client";
import type { Canons } from "@/lib/scriptures/types";
import {
  FIND_CATALOG,
  READING_PATHS,
  placesForWorld,
  type FindPlace,
} from "./find-catalog";
import {
  bookDisplayName,
  passageHref,
  type FindGroup,
  type FindItem,
} from "./find-query";

export type ChapterPlace = {
  tradition: string;
  book: string;
  chapter: number;
};

export type HerePlace = {
  pathname: string;
  href: string;
  title: string;
  note: string;
  world?: WorldId;
  chapter?: ChapterPlace;
};

const CHAPTER_PATH =
  /^\/scriptures\/([^/]+)\/([A-Z0-9]{2,4})\/(\d+)$/;

export function cleanPath(pathname: string): string {
  const path = pathname.split("#")[0].split("?")[0] || "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function parseChapterPath(pathname: string): ChapterPlace | null {
  const match = cleanPath(pathname).match(CHAPTER_PATH);
  if (!match) return null;
  return {
    tradition: match[1],
    book: match[2],
    chapter: Number(match[3]),
  };
}

export function worldForPath(pathname: string): WorldId | undefined {
  const path = cleanPath(pathname);
  const match = [...WORLD_REGISTRY]
    .sort((a, b) => b.href.length - a.href.length)
    .find((world) => path === world.href || path.startsWith(`${world.href}/`));
  return match?.id;
}

export function describePlace(
  pathname: string,
  canons: Canons | null,
): HerePlace {
  const path = cleanPath(pathname);
  const chapter = parseChapterPath(path);
  if (chapter) {
    const name = canons ? bookDisplayName(canons, chapter.book) : chapter.book;
    const world = WORLD_BY_ID.scriptures;
    return {
      pathname: path,
      href: path,
      title: `${name} ${chapter.chapter}`,
      note: world.label,
      world: "scriptures",
      chapter,
    };
  }

  const early = EARLY_TEXTS.find((text) => path === `/early/${text.id}`);
  if (early) {
    return {
      pathname: path,
      href: path,
      title: early.title,
      note: "The Writings",
      world: "early",
    };
  }

  const exact = FIND_CATALOG.find((place) => cleanPath(place.href) === path);
  if (exact) {
    return {
      pathname: path,
      href: exact.href,
      title: exact.title,
      note: exact.note,
      world: exact.world,
    };
  }

  const worldId = worldForPath(path);
  if (worldId) {
    const world = WORLD_BY_ID[worldId];
    const guide = WORLD_GUIDES[worldId];
    const room = guide.nav.find((link) => cleanPath(link.href) === path);
    return {
      pathname: path,
      href: path,
      title: room?.label ?? world.label,
      note: world.hint,
      world: worldId,
    };
  }

  if (path === "/") {
    return {
      pathname: path,
      href: "/",
      title: "Home",
      note: "The front door.",
    };
  }

  return {
    pathname: path,
    href: path,
    title: path,
    note: "This page.",
  };
}

function itemFromPlace(place: FindPlace): FindItem {
  return {
    id: place.id,
    href: place.href,
    title: place.title,
    note: place.note,
    kind: place.kind,
  };
}

function chapterDoors(chapter: ChapterPlace, canons: Canons | null): FindItem[] {
  if (!canons?.books[chapter.book]) return [];
  const meta = canons.books[chapter.book];
  const items: FindItem[] = [];
  if (chapter.chapter > 1) {
    const prev = chapter.chapter - 1;
    items.push({
      id: `prev-${chapter.book}-${prev}`,
      href: passageHref(canons, chapter.book, prev),
      title: `${bookDisplayName(canons, chapter.book)} ${prev}`,
      note: "Previous chapter.",
      kind: "ref",
    });
  }
  if (chapter.chapter < meta.chapters) {
    const next = chapter.chapter + 1;
    items.push({
      id: `next-${chapter.book}-${next}`,
      href: passageHref(canons, chapter.book, next),
      title: `${bookDisplayName(canons, chapter.book)} ${next}`,
      note: "Next chapter.",
      kind: "ref",
    });
  }
  return items;
}

function walkDoors(pathname: string): FindItem[] {
  const path = cleanPath(pathname);
  const items: FindItem[] = [];
  for (const readingPath of READING_PATHS) {
    const index = readingPath.steps.findIndex(
      (step) => cleanPath(step.href) === path,
    );
    if (index < 0) continue;
    const next = readingPath.steps[index + 1];
    if (!next) continue;
    items.push({
      id: `walk-${readingPath.id}-${index + 1}`,
      href: next.href,
      title: next.label,
      note: `${readingPath.title}: ${next.note}`,
      kind: "path",
    });
  }
  return items;
}

export function continueFrom(
  pathname: string,
  canons: Canons | null,
  recents?: FindItem[],
): FindGroup[] {
  const here = describePlace(pathname, canons);
  const groups: FindGroup[] = [
    {
      id: "here",
      label: "You are here",
      items: [
        {
          id: "here-now",
          href: here.href,
          title: here.title,
          note: here.note,
          kind: here.world ? "world" : "page",
        },
      ],
    },
  ];

  if (recents && recents.length > 0) {
    const herePath = cleanPath(here.pathname);
    const validRecents = recents.filter(
      (item) => cleanPath(item.href) !== herePath,
    );
    if (validRecents.length > 0) {
      groups.push({
        id: "recent",
        label: "Recent places",
        note: "Stored only on this device — never sent to a server.",
        items: validRecents.slice(0, 3),
      });
    }
  }

  groups.push({
    id: "console",
    label: "Classical Knowledge Console",
    note: "Scholarly commands: path, radar, compare, diff, hexapla, catena, dossier, diachronic, dispute, study, allusion (type ? for help).",
    items: [
      {
        id: "cmd-path",
        href: "/scriptures/graph?from=GEN.1.1&to=REV.22.21",
        title: "path Gen 1:1 to Rev 22:21",
        note: "Trace a bounded route through the indexed cross-reference graph.",
        kind: "action",
      },
      {
        id: "cmd-radar",
        href: "/scriptures/resonance?q=living+water",
        title: "radar living water",
        note: "7-Horizon conceptual resonance across Torah, Prophets, Gospels, and Fathers.",
        kind: "action",
      },
      {
        id: "cmd-compare",
        href: "/scriptures/canons#canons-matrix",
        title: "compare catholic and protestant",
        note: "Multi-canonicity comparison across traditions and manuscript witnesses.",
        kind: "action",
      },
      {
        id: "cmd-diff",
        href: "/jesus/harmony",
        title: "diff beatitudes",
        note: "Word-level synoptic harmony diffing (Triple Tradition, Q, and Sondergut).",
        kind: "action",
      },
      {
        id: "cmd-hexapla",
        href: "/scriptures/polyglot?preset=genesis-1",
        title: "hexapla genesis 1",
        note: "Digital Hexapla · Collate original languages, Septuagint, and Vulgate.",
        kind: "action",
      },
      {
        id: "cmd-catena",
        href: "/scriptures/catena",
        title: "catena isaiah 53",
        note: "Catena Aurea · Unbroken Ante-Nicene patristic reception chain.",
        kind: "action",
      },
      {
        id: "cmd-dossier",
        href: "/scriptures/dossier",
        title: "dossier isaiah 53",
        note: "NotebookLM · Collate multi-witness dossier and Audio Overview prompt.",
        kind: "action",
      },
      {
        id: "cmd-diachronic",
        href: "/scriptures/diachronic",
        title: "diachronic ruach",
        note: "Diachronic Evolution · 1,500-year linguistic migration across Hebrew, Greek, and Latin.",
        kind: "action",
      },
      {
        id: "cmd-disputation",
        href: "/scriptures/disputation",
        title: "dispute suffering",
        note: "Sacred Disputation · The great dialectical debates across Scripture and Tradition.",
        kind: "action",
      },
      {
        id: "cmd-study",
        href: "/jesus/words?study=lords-prayer",
        title: "study epiousios",
        note: "Greek critical edition underlay and original language lexical study.",
        kind: "action",
      },
    ],
  });

  const fromHere: FindItem[] = [];
  if (here.chapter) fromHere.push(...chapterDoors(here.chapter, canons));
  fromHere.push(...walkDoors(here.pathname));
  if (fromHere.length > 0) {
    groups.push({
      id: "from-here",
      label: "From this page",
      note: "Next doors the record already computed — not a recommendation based on you.",
      items: fromHere,
    });
  }

  if (here.world) {
    const rooms = placesForWorld(here.world).map(itemFromPlace);
    if (rooms.length > 0) {
      groups.push({
        id: "this-world",
        label: `In ${WORLD_BY_ID[here.world].label}`,
        items: rooms,
      });
    }
  }

  groups.push({
    id: "walks",
    label: "Walks through the record",
    note: "Named sequences of pages that already exist.",
    items: READING_PATHS.map((path) => ({
      id: `path-${path.id}`,
      href: path.steps[0]?.href ?? "/",
      title: path.title,
      note: path.line,
      kind: "path" as const,
    })),
  });

  groups.push({
    id: "worlds",
    label: "Worlds",
    items: WORLD_REGISTRY.map((world) => ({
      id: `world-${world.id}`,
      href: world.href,
      title: world.label,
      note: world.hint,
      kind: "world" as const,
    })),
  });

  return groups;
}
