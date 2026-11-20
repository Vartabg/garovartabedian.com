import type { ScriptureStory } from "@/lib/scriptures/stories";

export type ParableWalkStop = {
  id: string;
  book: ScriptureStory["book"];
  chapter: number;
  start: number;
  end: number;
  /** Alt text does not include the illustration label. */
  picture: { src: string; alt: string };
};

export type ParableWalk = {
  /** Matches a parable id already in the hosted list. */
  id: string;
  stops: ParableWalkStop[];
};

/** One existing parable, walked one moment at a time. The words are the hosted verses. */
export const PARABLE_WALKS: ParableWalk[] = [
  {
    id: "good-samaritan",
    stops: [
      {
        id: "road",
        book: "LUK",
        chapter: 10,
        start: 30,
        end: 30,
        picture: {
          src: "/jesus/parables/samaritan-road.jpg",
          alt: "A man lies beside a desert road while two figures walk away.",
        },
      },
      {
        id: "passed",
        book: "LUK",
        chapter: 10,
        start: 31,
        end: 32,
        picture: {
          src: "/jesus/parables/samaritan-passed.jpg",
          alt: "Two travelers walk past a man lying against a rock.",
        },
      },
      {
        id: "inn",
        book: "LUK",
        chapter: 10,
        start: 33,
        end: 35,
        picture: {
          src: "/jesus/parables/samaritan-inn.jpg",
          alt: "One man binds another's arm, with a donkey and a small inn behind them.",
        },
      },
      {
        id: "likewise",
        book: "LUK",
        chapter: 10,
        start: 36,
        end: 37,
        picture: {
          src: "/jesus/parables/samaritan-likewise.jpg",
          alt: "An older man speaks with a younger man beside a road at dusk.",
        },
      },
    ],
  },
];

export function parableWalkFromQuery(value: string | string[] | undefined): ParableWalk | null {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) return null;
  return PARABLE_WALKS.find((walk) => walk.id === id) ?? null;
}
