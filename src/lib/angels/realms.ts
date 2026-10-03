import type { OrderBand } from "./types";

/** Editorial reading order, not a claim about a fixed heavenly hierarchy. */
export const ANGEL_REALMS: {
  id: OrderBand["realm"];
  number: string;
  label: string;
  note: string;
  anchor: string;
  plateId: string;
  encounter: { href: string; label: string };
}[] = [
  {
    id: "throne", number: "01", label: "The throne",
    note: "Wings, fire, and the presence of God.",
    anchor: "band-throne-seraphim", plateId: "appearance-isa-6-1-7",
    encounter: { href: "/angels/encounters#enc-ISA-6-1-7", label: "Isaiah’s vision · Isaiah 6" },
  },
  {
    id: "heavens", number: "02", label: "The heavens",
    note: "Messengers sent. Armies gathered.",
    anchor: "band-archangel-chief-princes", plateId: "appearance-luk-1-26-38",
    encounter: { href: "/angels/encounters#enc-LUK-1-26-38", label: "Gabriel’s announcement · Luke 1" },
  },
  {
    id: "earth", number: "03", label: "The earth between",
    note: "Where the unseen steps into human lives.",
    anchor: "band-earth-between", plateId: "appearance-2ki-6-17",
    encounter: { href: "/angels/encounters#enc-2KI-6-17", label: "The opened eyes · 2 Kings 6" },
  },
  {
    id: "deep", number: "04", label: "The deep",
    note: "The prison, the judgment, and the end.",
    anchor: "band-abyss", plateId: "fall-rev-20-abyss-end",
    encounter: { href: "/angels/fall#rev-20-abyss-end", label: "The final vision · Revelation 20" },
  },
];
