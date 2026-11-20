/**
 * One shelf for every told story on the site, and the situations a visitor can
 * enter it by.
 *
 * Nothing here is new narration. Titles, references, pictures and tag lines are
 * read by key from the five modules that already publish them. A `quote` tag is
 * a word-for-word cut from the hosted World English Bible;
 * tests/scripture-stories.test.ts checks each cut against the verse it cites
 * and re-derives every other tag from its source.
 *
 * A tag says what happens in the story. It never says what the story will do
 * for the reader.
 *
 * This module imports the five story modules and the short parables list. It
 * must not import `jesus/server` or `scriptures/story-text`: those carry whole
 * hosted books.
 */
import parablesJson from "../../public/jesus/parables.json";
import { angelStories } from "./angel-stories";
import { APOSTLE_STORIES } from "./apostles/stories";
import { PARABLE_WALKS } from "./jesus/parable-walks";
import { WORD_STUDIES } from "./jesus/word-studies";
import { SCRIPTURE_STORIES, scriptureStoryPath, storyStops } from "./scriptures/stories";

export type ShelfCite = { book: string; chapter: number; verse: number };

export type ShelfStory = {
  id: string;
  title: string;
  reference: string;
  /** The story's existing page. */
  href: string;
  /** A picture the story already publishes, as a path under /public. */
  picture: string;
};

/** Where a tag's line comes from. No other wording is allowed in a tag. */
export type ShelfTagSource =
  | { kind: "stop"; stopId: string }
  | { kind: "saying" }
  | { kind: "invitation" }
  | { kind: "opening" }
  | { kind: "quote" };

export type ShelfTag = {
  source: ShelfTagSource;
  line: string;
  cite: ShelfCite;
};

export type ShelfSituation = {
  id: string;
  /** Completes the sentence “The people in these stories were …”. */
  label: string;
  /** Story id to the line and verse that put the story under this word. */
  tags: Record<string, ShelfTag>;
};

const BOOK_NAMES: Record<string, string> = {
  GEN: "Genesis",
  EXO: "Exodus",
  RUT: "Ruth",
  "1SA": "1 Samuel",
  "1KI": "1 Kings",
  "2KI": "2 Kings",
  EST: "Esther",
  DAN: "Daniel",
  JON: "Jonah",
  MAT: "Matthew",
  MRK: "Mark",
  LUK: "Luke",
  JHN: "John",
  ACT: "Acts",
};

export function shelfBookName(book: string): string {
  const name = BOOK_NAMES[book];
  if (!name) throw new Error(`No book name for ${book}`);
  return name;
}

export function shelfCiteLabel(cite: ShelfCite): string {
  return `${shelfBookName(cite.book)} ${cite.chapter}:${cite.verse}`;
}

export const SAMARITAN_ID = "good-samaritan";

/** Where a path story's stop picture lives under /public: one file per stop, named by the stop's id. */
export function shelfStopPicture(slug: string, stopId: string): string {
  return `/scriptures/stories/${slug}/${stopId}.jpg`;
}

/**
 * The stop whose picture stands for the story on the shelf. The first stop by
 * default; named here where another stop shows what the title names (the first
 * picture of "The manger" is a Roman clerk).
 */
const COVER_STOP: Record<string, string> = {
  sea: "walls",
  ruth: "stay",
  david: "name",
  fire: "fell",
  furnace: "four",
  lions: "angel",
  jonah: "fish",
  manger: "trough",
  tomb: "risen",
};

function pathStories(): ShelfStory[] {
  return SCRIPTURE_STORIES.map((story) => {
    const stops = storyStops(story);
    const cover = COVER_STOP[story.slug] ?? stops[0].id;
    if (!stops.some((item) => item.id === cover)) throw new Error(`No cover stop ${story.slug}:${cover}`);
    return {
      id: story.slug,
      title: story.title,
      reference: story.reference,
      href: scriptureStoryPath(story.slug),
      picture: shelfStopPicture(story.slug, cover),
    };
  });
}

/** The parables list owns each walked parable's title and passage. */
const LISTED_PARABLES = parablesJson as { id: string; title: string; accounts: { ref: string }[] }[];

/** "LUK 10:30-37" as "Luke 10:30–37". */
function accountLabel(ref: string): string {
  const match = /^(\S+) (\d+):(\d+)(?:-(\d+))?$/.exec(ref);
  if (!match) throw new Error(`Unreadable parable reference ${ref}`);
  const [, book, chapter, start, end] = match;
  return `${shelfBookName(book)} ${chapter}:${start}${end ? `–${end}` : ""}`;
}

/** The stop whose picture stands for a walked parable; the first stop unless named here. */
const WALK_COVER_STOP: Record<string, string> = { [SAMARITAN_ID]: "inn" };

/**
 * Every walked parable, by id. Only the walk's ids and pictures are read here,
 * so a walk may change how it names its verses without touching the shelf.
 */
function parableStories(): ShelfStory[] {
  return PARABLE_WALKS.map((walk) => {
    const listed = LISTED_PARABLES.find((item) => item.id === walk.id);
    if (!listed) throw new Error(`The parables list has no entry for the walk ${walk.id}`);
    const cover = WALK_COVER_STOP[walk.id] ?? walk.stops[0].id;
    const coverStop = walk.stops.find((item) => item.id === cover);
    if (!coverStop) throw new Error(`No cover stop ${walk.id}:${cover}`);
    return {
      id: walk.id,
      title: listed.title,
      reference: accountLabel(listed.accounts[0].ref),
      href: `/jesus/parables?story=${walk.id}`,
      picture: coverStop.picture.src,
    };
  });
}

function sayingStories(): ShelfStory[] {
  return WORD_STUDIES.map((study) => ({
    id: study.id,
    title: study.title,
    reference: study.anchor.label,
    href: `/jesus/words?study=${study.id}`,
    picture: study.picture.src,
  }));
}

function angelShelfStories(): ShelfStory[] {
  return angelStories.map((story) => ({
    id: story.slug,
    title: story.title,
    reference: story.reference,
    href: `/angels/stories/${story.slug}`,
    picture: story.image,
  }));
}

function apostleShelfStories(): ShelfStory[] {
  return APOSTLE_STORIES.map((story) => ({
    id: story.slug,
    // These titles are sentences on their own pages; in a list the full stop goes.
    title: story.title.replace(/\.$/, ""),
    reference: story.reference,
    href: `/apostles/stories/${story.slug}`,
    picture: story.image,
  }));
}

/**
 * From Genesis to Acts. Old Testament stories by book, then chapter. Then the
 * birth; teaching by Gospel (Matthew, Mark, Luke, John) and chapter; the
 * supper, cross and resurrection; Acts by chapter.
 */
export const SHELF_ORDER = [
  "noah",
  "mountain",
  "i-am-with-you",
  "joseph",
  "sea",
  "ruth",
  "david",
  "fire",
  "open-his-eyes",
  "esther",
  "furnace",
  "lions",
  "jonah",
  "manger",
  "love-enemies",
  "lords-prayer",
  "mustard-seed",
  "take-up-cross",
  "good-samaritan",
  "lost-son",
  "before-abraham",
  "new-commandment",
  "tomb",
  "peace-be-with-you",
  "come-and-eat",
  "every-language",
  "the-gate-opened",
] as const;

function buildShelf(): ShelfStory[] {
  const all = [
    ...pathStories(),
    ...parableStories(),
    ...sayingStories(),
    ...angelShelfStories(),
    ...apostleShelfStories(),
  ];
  const byId = new Map(all.map((story) => [story.id, story]));
  if (byId.size !== all.length) throw new Error("Two shelf stories share an id");
  const order: readonly string[] = SHELF_ORDER;
  const missing = all.filter((story) => !order.includes(story.id));
  if (missing.length) {
    throw new Error(`Stories missing from the shelf order: ${missing.map((story) => story.id).join(", ")}`);
  }
  return order.map((id) => {
    const story = byId.get(id);
    if (!story) throw new Error(`The shelf order names a story that does not exist: ${id}`);
    return story;
  });
}

export const SHELF_STORIES: readonly ShelfStory[] = buildShelf();

type TagEntry = [storyId: string, tag: ShelfTag];

/** A stop line a path story already publishes, with the verse that stop cites. */
function stop(slug: string, stopId: string): TagEntry {
  const story = SCRIPTURE_STORIES.find((item) => item.slug === slug);
  const found = story ? storyStops(story).find((item) => item.id === stopId) : undefined;
  if (!story || !found) throw new Error(`No stop ${slug}:${stopId}`);
  const cite = found.cites[0];
  return [
    slug,
    {
      source: { kind: "stop", stopId },
      line: found.line,
      cite: { book: story.book, chapter: cite.chapter, verse: cite.verse },
    },
  ];
}

/** The saying a word study already publishes, at its anchor verse. */
function saying(id: string): TagEntry {
  const study = WORD_STUDIES.find((item) => item.id === id);
  if (!study) throw new Error(`No word study ${id}`);
  const { book, chapter, verse } = study.anchor;
  return [id, { source: { kind: "saying" }, line: study.saying, cite: { book, chapter, verse } }];
}

/** The invitation an angel story already publishes. */
function invitation(slug: string, cite: ShelfCite): TagEntry {
  const story = angelStories.find((item) => item.slug === slug);
  if (!story) throw new Error(`No angel story ${slug}`);
  return [slug, { source: { kind: "invitation" }, line: story.invitation, cite }];
}

/** The opening title an apostle story already publishes. */
function opening(slug: string, cite: ShelfCite): TagEntry {
  const story = APOSTLE_STORIES.find((item) => item.slug === slug);
  if (!story) throw new Error(`No apostle story ${slug}`);
  return [slug, { source: { kind: "opening" }, line: story.opening.title, cite }];
}

/** A word-for-word cut from the hosted verse. The unit test proves the cut. */
function quote(storyId: string, book: string, chapter: number, verse: number, line: string): TagEntry {
  return [storyId, { source: { kind: "quote" }, line, cite: { book, chapter, verse } }];
}

function situation(id: string, label: string, entries: TagEntry[]): ShelfSituation {
  const tags: Record<string, ShelfTag> = {};
  for (const [storyId, tag] of entries) {
    if (tags[storyId]) throw new Error(`${id} lists ${storyId} twice`);
    if (!SHELF_STORIES.some((story) => story.id === storyId)) {
      throw new Error(`${id} names a story that is not on the shelf: ${storyId}`);
    }
    tags[storyId] = tag;
  }
  return { id, label, tags };
}

export const SHELF_SITUATIONS: readonly ShelfSituation[] = [
  situation("afraid", "afraid", [
    stop("sea", "afraid"),
    stop("david", "afraid"),
    quote("open-his-eyes", "2KI", 6, 15, "Alas, my master! What shall we do?"),
  ]),
  situation("grieving", "grieving", [stop("ruth", "loss"), stop("tomb", "stone")]),
  situation("hurt", "hurt by someone", [
    stop("joseph", "sold"),
    quote(SAMARITAN_ID, "LUK", 10, 30, "stripped him and beat him, and departed, leaving him half dead."),
    saying("love-enemies"),
  ]),
  situation("far", "far from home", [
    invitation("i-am-with-you", { book: "GEN", chapter: 28, verse: 11 }),
    stop("ruth", "stay"),
    stop("jonah", "fled"),
    stop("lost-son", "far"),
    quote("every-language", "ACT", 2, 8, "How do we hear, everyone in our own native language?"),
  ]),
  situation("stuck", "stuck or waiting", [
    stop("noah", "rain"),
    stop("joseph", "forgotten"),
    opening("come-and-eat", { book: "JHN", chapter: 21, verse: 3 }),
    invitation("the-gate-opened", { book: "ACT", chapter: 12, verse: 6 }),
  ]),
  situation("pressure", "under pressure", [
    stop("esther", "decree"),
    stop("furnace", "refuse"),
    stop("lions", "decree"),
  ]),
  situation("doubting", "doubting", [
    stop("fire", "two"),
    quote("before-abraham", "JHN", 8, 57, "You are not yet fifty years old! Have you seen Abraham?"),
    quote(
      "peace-be-with-you",
      "JHN",
      20,
      25,
      "Unless I see in his hands the print of the nails, put my finger into the print of the nails, and put my hand into his side, I will not believe.",
    ),
  ]),
  situation("over", "starting over", [
    quote("jonah", "JON", 3, 1, "Yahweh’s word came to Jonah the second time"),
    stop("lost-son", "himself"),
  ]),
  situation("asked", "asked for a lot", [
    stop("mountain", "isaac"),
    saying("take-up-cross"),
    saying("new-commandment"),
    stop("tomb", "cup"),
  ]),
  situation("small", "starting small", [stop("manger", "trough"), saying("mustard-seed")]),
  situation("praying", "praying", [stop("lions", "prayed"), saying("lords-prayer")]),
];
