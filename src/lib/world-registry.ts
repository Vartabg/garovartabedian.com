export const WORLD_REGISTRY = [
  {
    id: "scriptures",
    label: "Scriptures",
    href: "/scriptures",
    hint: "hosted scripture · search the text",
    description:
      "Hosted public-domain Scripture across five traditions, with cross-references, topics, and exact-word search.",
    bg: "#f0e2c5",
    ink: "#2b241d",
    accent: "#765416",
    toneInk: "#fdf9ee",
    image: "/worlds/scriptures.jpg",
  },
  {
    id: "jesus",
    label: "Jesus Christ",
    href: "/jesus",
    hint: "words · life · prophecy · the record",
    description:
      "His words, his life on the map, prophecy and fulfillment, the record in ink and stone.",
    bg: "#f2e2d6",
    ink: "#2b241d",
    accent: "#7a3328",
    toneInk: "#fbf9f2",
    image: "/worlds/jesus.jpg",
  },
  {
    id: "apostles",
    label: "The Apostles",
    href: "/apostles",
    hint: "the twelve · the roads · the cost",
    description:
      "The twelve he chose — who each man was, where his road went, and what it cost him.",
    bg: "#f1e3d2",
    ink: "#2b241d",
    accent: "#8d3e1f",
    toneInk: "#fdf4ea",
    image: "/worlds/apostles.jpg",
  },
  {
    id: "early",
    label: "The Writings",
    href: "/early",
    hint: "the church's writing outside the canon",
    description:
      "Everything the early church read outside the canon — the texts whole, grouped by era, their stories drawn.",
    bg: "#e8e1cf",
    ink: "#2b241d",
    accent: "#3f6658",
    toneInk: "#faf5e7",
    image: "/worlds/early.jpg",
  },
  {
    id: "church",
    label: "The Church",
    href: "/church",
    hint: "from the upper room to today",
    description:
      "From the upper room to today — every step, every fork, and who held the power.",
    bg: "#e9e2eb",
    ink: "#2b241d",
    accent: "#5d3a7a",
    toneInk: "#faf9f5",
    image: "/worlds/church.jpg",
  },
  {
    id: "angels",
    label: "Angels & Demons",
    href: "/angels",
    hint: "the unseen order · the fall · the encounters",
    description:
      "The unseen order, the fall traced text by text, and collected encounters with angels and demons.",
    bg: "#10131f",
    ink: "#e8e6db",
    accent: "#d2a94f",
    toneInk: "#10131f",
    image: "/worlds/angels.jpg",
  },
  {
    id: "word",
    label: "Who Owns the Word?",
    href: "/word",
    hint: "the fences · the free way",
    description:
      "Modern translations are owned. The facts, the fences, and the ones given free.",
    bg: "#e6e9e7",
    ink: "#2b2c2d",
    accent: "#24446b",
    toneInk: "#fcfcfa",
    image: "/worlds/word.jpg",
  },
  {
    id: "evidence",
    label: "How We Know",
    href: "/evidence",
    hint: "text · stone · witness · inference",
    description:
      "Follow a claim from source to observation, inference, interpretation, and limit.",
    bg: "#dfe8e5",
    ink: "#172b31",
    accent: "#1f6771",
    toneInk: "#f6fbf8",
    image: "/worlds/evidence.jpg",
  },
] as const;

export type WorldId = (typeof WORLD_REGISTRY)[number]["id"];

export const WORLD_BY_ID = Object.fromEntries(
  WORLD_REGISTRY.map((world) => [world.id, world]),
) as { [Id in WorldId]: Extract<(typeof WORLD_REGISTRY)[number], { id: Id }> };
