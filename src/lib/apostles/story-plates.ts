import type { InlineMediaPlateMeta } from "@/app/_components/InlineMediaPlate";

/** Symbolic reading illustrations; the sending map owns geographic claims. */
export const APOSTLES_STORY_PLATES = {
  call: {
    src: "/apostles/plates/from-the-nets.jpg",
    alt: "Manuscript illustration of four fishermen leaving a boat and nets beside the lake and turning toward a path through ochre hills",
    caption: "Four fishermen, two pairs of brothers: the call begins at the water’s edge.",
  },
  sending: {
    src: "/apostles/plates/the-sending.jpg",
    alt: "Symbolic manuscript illustration of a lamplit stone room and pairs of travelers on unmarked paths fading into parchment",
    caption: "A symbolic sending: the lamp, the open door, the roads ahead. The map above follows the sources.",
  },
} satisfies Record<string, InlineMediaPlateMeta>;
