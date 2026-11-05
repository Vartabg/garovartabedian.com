export type VerseSpan = {
  chapter: number;
  start: number;
  end: number;
};

export type VersePart = {
  id: string;
  title: string;
  kind: "verses";
  spans: readonly VerseSpan[];
  /** Verses omitted between spans, still available in the chapter. */
  between?: { text: string; chapter: number; verse: number };
};

export type BridgePart = {
  id: string;
  title: string;
  kind: "bridge";
  text: string;
  href: string;
  label: string;
};

export type StoryPart = VersePart | BridgePart;

export type ScriptureStory = {
  slug: string;
  title: string;
  reference: string;
  book: "GEN";
  /** First and last chapter of the account, including bridges. */
  fromChapter: number;
  toChapter: number;
  summary: string;
  parts: readonly StoryPart[];
};

const chapter = (id: string, title: string, n: number, end: number): VersePart => ({
  id,
  title,
  kind: "verses",
  spans: [{ chapter: n, start: 1, end }],
});

/**
 * Joseph, told in the hosted World English Bible. Chapter 38 and the
 * household list in Genesis 46 stay linked rather than pasted into his story.
 */
export const SCRIPTURE_STORIES: readonly ScriptureStory[] = [
  {
    slug: "joseph",
    title: "Joseph",
    reference: "Genesis 37–50",
    book: "GEN",
    fromChapter: 37,
    toChapter: 50,
    summary:
      "From the tunic his father made him, through Egypt, to the words he spoke to his brothers after Jacob died.",
    parts: [
      chapter("coat", "A tunic of many colors", 37, 36),
      {
        id: "judah",
        title: "Judah went down from his brothers",
        kind: "bridge",
        text: "The book follows Judah before it returns to Joseph in Egypt.",
        href: "/scriptures/protestant/GEN/38?t=web#v1",
        label: "Read Genesis 38",
      },
      chapter("potiphar", "Yahweh was with Joseph", 39, 23),
      chapter("prison", "The cupbearer and the baker", 40, 23),
      chapter("pharaoh", "God will give Pharaoh an answer", 41, 57),
      chapter("brothers", "They bowed themselves down", 42, 38),
      chapter("benjamin", "Is this your youngest brother", 43, 34),
      chapter("cup", "The cup was found in Benjamin's sack", 44, 34),
      chapter("reveal", "I am Joseph", 45, 28),
      {
        id: "goshen",
        title: "Joseph is still alive",
        kind: "verses",
        spans: [
          { chapter: 46, start: 1, end: 7 },
          { chapter: 46, start: 28, end: 34 },
        ],
        between: {
          text: "The names of the household who went into Egypt are listed between these passages.",
          chapter: 46,
          verse: 8,
        },
      },
      chapter("settled", "A possession in the land of Egypt", 47, 31),
      chapter("hands", "Ephraim and Manasseh", 48, 22),
      chapter("blessing", "Listen to Israel your father", 49, 33),
      chapter("good", "God meant it for good", 50, 26),
    ],
  },
];

export function getScriptureStory(slug: string): ScriptureStory | undefined {
  return SCRIPTURE_STORIES.find((story) => story.slug === slug);
}

export function scriptureStoryPath(slug: string): string {
  return `/scriptures/stories/${slug}`;
}
