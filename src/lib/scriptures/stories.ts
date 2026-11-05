export type StoryCite = {
  chapter: number;
  verse: number;
};

export type StoryPlace = {
  /** Percent across the picture. */
  x: number;
  /** Percent down the picture. Larger means lower, the pit. */
  y: number;
  side: "left" | "right";
};

export type StoryStop = {
  id: string;
  title: string;
  /** Short name drawn on the picture. */
  mark: string;
  /** One short guide line. The verse itself stays on the cite. */
  line: string;
  cites: readonly StoryCite[];
  place: StoryPlace;
  /** Show the hosted words of the first cite on the path. */
  words?: boolean;
};

export type StoryMove = {
  id: string;
  label: string;
  stops: readonly StoryStop[];
};

export type ScriptureStory = {
  slug: string;
  title: string;
  reference: string;
  book: "GEN";
  fromChapter: number;
  toChapter: number;
  summary: string;
  moves: readonly StoryMove[];
};

/**
 * Joseph as a short path. Each stop is one plain line. The cites point at
 * the hosted World English Bible. Only the last stop prints the verse,
 * because that sentence is the message of the story.
 */
export const SCRIPTURE_STORIES: readonly ScriptureStory[] = [
  {
    slug: "joseph",
    title: "Joseph",
    reference: "Genesis 37–50",
    book: "GEN",
    fromChapter: 37,
    toChapter: 50,
    summary: "Tap a point. One stop at a time.",
    moves: [
      {
        id: "down",
        label: "Down",
        stops: [
          {
            id: "tunic",
            title: "The tunic",
            mark: "Tunic",
            line: "His father loved him more. His brothers hated him.",
            cites: [{ chapter: 37, verse: 3 }],
            place: { x: 4, y: 20, side: "left" },
          },
          {
            id: "sold",
            title: "Sold",
            mark: "Sold",
            line: "They sold him for twenty pieces of silver.",
            cites: [{ chapter: 37, verse: 28 }],
            place: { x: 4, y: 42, side: "left" },
          },
          {
            id: "prison",
            title: "Prison",
            mark: "Prison",
            line: "He refused Potiphar's wife. He was put in prison.",
            cites: [{ chapter: 39, verse: 20 }],
            place: { x: 4, y: 64, side: "left" },
          },
          {
            id: "forgotten",
            title: "Forgotten",
            mark: "Forgotten",
            line: "The cupbearer forgot him.",
            cites: [{ chapter: 40, verse: 23 }],
            place: { x: 4, y: 86, side: "left" },
          },
        ],
      },
      {
        id: "up",
        label: "Up",
        stops: [
          {
            id: "egypt",
            title: "Over Egypt",
            mark: "Egypt",
            line: "Pharaoh set him over all of Egypt.",
            cites: [{ chapter: 41, verse: 41 }],
            place: { x: 52, y: 20, side: "right" },
          },
        ],
      },
      {
        id: "meeting",
        label: "Face to face",
        stops: [
          {
            id: "bow",
            title: "They bowed",
            mark: "Bowed",
            line: "His brothers bowed down. They did not know him.",
            cites: [{ chapter: 42, verse: 6 }],
            place: { x: 52, y: 42, side: "right" },
          },
          {
            id: "name",
            title: "I am Joseph",
            mark: "Joseph",
            line: "He told them who he was.",
            cites: [{ chapter: 45, verse: 4 }],
            place: { x: 52, y: 62, side: "right" },
          },
          {
            id: "good",
            title: "What he said",
            mark: "His words",
            line: "Then he said this.",
            cites: [{ chapter: 50, verse: 20 }],
            place: { x: 52, y: 82, side: "right" },
            words: true,
          },
        ],
      },
    ],
  },
];

export function getScriptureStory(slug: string): ScriptureStory | undefined {
  return SCRIPTURE_STORIES.find((story) => story.slug === slug);
}

export function scriptureStoryPath(slug: string): string {
  return `/scriptures/stories/${slug}`;
}

export function storyStops(story: ScriptureStory): StoryStop[] {
  return story.moves.flatMap((move) => [...move.stops]);
}
