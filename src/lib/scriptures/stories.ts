export type StoryCite = {
  chapter: number;
  verse: number;
};

export type StoryStop = {
  id: string;
  title: string;
  /** One short guide line. The verse itself stays on the cite. */
  line: string;
  cites: readonly StoryCite[];
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
    summary: "Eight short stops. The verses stay one tap away.",
    moves: [
      {
        id: "down",
        label: "Down",
        stops: [
          {
            id: "tunic",
            title: "The tunic",
            line: "His father loved him more. His brothers hated him.",
            cites: [{ chapter: 37, verse: 3 }],
          },
          {
            id: "sold",
            title: "Sold",
            line: "They sold him for twenty pieces of silver.",
            cites: [{ chapter: 37, verse: 28 }],
          },
          {
            id: "prison",
            title: "Prison",
            line: "He refused Potiphar's wife. He was put in prison.",
            cites: [{ chapter: 39, verse: 20 }],
          },
          {
            id: "forgotten",
            title: "Forgotten",
            line: "The cupbearer forgot him.",
            cites: [{ chapter: 40, verse: 23 }],
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
            line: "Pharaoh set him over all of Egypt.",
            cites: [{ chapter: 41, verse: 41 }],
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
            line: "His brothers bowed down. They did not know him.",
            cites: [{ chapter: 42, verse: 6 }],
          },
          {
            id: "name",
            title: "I am Joseph",
            line: "He told them who he was.",
            cites: [{ chapter: 45, verse: 4 }],
          },
          {
            id: "good",
            title: "What he said",
            line: "Then he said this.",
            cites: [{ chapter: 50, verse: 20 }],
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
