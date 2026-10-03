import type { InlineMediaPlateMeta } from "@/app/_components/InlineMediaPlate";

/**
 * The approved illustrated subset of the giants room. Records without a brief
 * intentionally remain text-only until their own image has passed review.
 */
export const GIANT_PLATES = {
  athanasius: {
    src: "/church/giants/athanasius.jpg",
    alt: "Manuscript illustration of Athanasius writing in exile, with Alexandria and a distant armed faction beyond his doorway.",
    caption:
      "Interpretive manuscript illustration: the 367 festal letter at Athanasius's desk; faction violence held in the Alexandrian distance.",
  },
  augustine: {
    src: "/church/giants/augustine.jpg",
    alt: "Manuscript illustration of Augustine writing in his Hippo study as a woman walks away alone along the road outside.",
    caption:
      "Interpretive manuscript illustration: grace on Augustine's page; the woman he sent away on the road beyond.",
  },
  aquinas: {
    src: "/church/giants/aquinas.jpg",
    alt: "Manuscript illustration of Thomas Aquinas at the unfinished Summa, with scripture, an astrolabe, and a distant prisoner beyond the door.",
    caption:
      "Interpretive manuscript illustration: faith and reason in one light; the death Aquinas's own argument permitted at the door.",
  },
  luther: {
    src: "/church/giants/luther.jpg",
    alt: "Manuscript illustration of Martin Luther sharing printed gospel pages in a Wittenberg shop, with a dark pamphlet and distant smoke also visible.",
    caption:
      "Interpretive manuscript illustration: scripture into common hands; Luther's later pamphlet and its consequences kept in the same frame.",
  },
  calvin: {
    src: "/church/giants/calvin.jpg",
    alt: "Manuscript illustration of John Calvin writing beside the open Institutes while a thin column of smoke rises beyond Geneva.",
    caption:
      "Interpretive manuscript illustration: Calvin's ordered Geneva under his pen; the smoke of Servetus at Champel beyond the glass.",
  },
  barth: {
    src: "/church/giants/barth.jpg",
    alt: "Art Deco manuscript illustration of Karl Barth at his typewriter, Charlotte von Kirschbaum at a nearby desk, and Nelly Barth standing apart in the doorway.",
    caption:
      "Interpretive manuscript illustration: Barth's public No at the typewriter; Charlotte von Kirschbaum and Nelly Barth held in the unresolved room.",
  },
} satisfies Record<string, InlineMediaPlateMeta>;

export function giantPlateFor(id: string): InlineMediaPlateMeta | null {
  return GIANT_PLATES[id as keyof typeof GIANT_PLATES] ?? null;
}
