/**
 * Editorial indexes over the sourced encounter record.
 * Every appearance belongs to one primary function so the guide remains
 * navigable without pretending the episodes fit only one theological category.
 */
export type EncounterFunction = {
  id: string;
  label: string;
  note: string;
  refs: string[];
};

export const ENCOUNTER_FUNCTIONS: EncounterFunction[] = [
  {
    id: "announce-direct",
    label: "Announce & direct",
    note: "Births are announced, callings are given, and people are sent toward the next act in the story.",
    refs: [
      "GEN 16:7-13",
      "2KI 1:3-4",
      "JDG 6:11-22",
      "JDG 13:17-20",
      "DAN 9:21",
      "LUK 1:11-20",
      "LUK 1:26-38",
      "MAT 1:20-21",
      "MAT 2:13",
      "MAT 2:19-20",
      "MAT 28:2-7",
      "JHN 20:11-13",
      "ACT 8:26",
      "ACT 10:3-7",
      "ACT 27:23-24",
    ],
  },
  {
    id: "guard-deliver",
    label: "Guard & deliver",
    note: "The vulnerable are pulled from danger, a sacrifice is stayed, and prisons or death traps lose their hold.",
    refs: [
      "GEN 19:1-11",
      "GEN 21:17-19",
      "GEN 22:11-12",
      "EXO 14:19-20",
      "DAN 3:24-25",
      "DAN 6:22",
      "ACT 5:19-20",
      "ACT 12:7-10",
    ],
  },
  {
    id: "judge-war",
    label: "Judge & wage war",
    note: "Drawn swords, fiery armies, halted plagues, and judgment scenes show that messenger is not the only angelic office.",
    refs: [
      "NUM 22:22-31",
      "JOS 5:13-15",
      "JDG 2:1-5",
      "2SA 24:16-17",
      "2KI 6:17",
      "2KI 19:35",
      "EZK 9:1-6",
      "ACT 12:23",
    ],
  },
  {
    id: "reveal-interpret",
    label: "Reveal & interpret",
    note: "The boundary opens through dreams, visions, sacred fire, and figures whose identity the text sometimes leaves unresolved.",
    refs: [
      "GEN 18:1-8",
      "GEN 28:12",
      "GEN 31:11-13",
      "GEN 32:1-2",
      "GEN 32:24-30",
      "EXO 3:2",
      "ISA 6:1-7",
      "DAN 8:15-19",
      "DAN 10:4-14",
      "ZEC 1:9-14",
    ],
  },
  {
    id: "worship-strengthen",
    label: "Worship & strengthen",
    note: "The host praises, serves, feeds, heals, guides, and strengthens without becoming the center of the scene.",
    refs: [
      "1KI 19:5-8",
      "TOB 12:15",
      "LUK 2:8-14",
      "MAT 4:11",
      "LUK 22:43",
    ],
  },
];

export type RecognitionInsight = {
  id: string;
  label: string;
  note: string;
  refs: string[];
};

export const DEMON_RECOGNITION_INSIGHTS: RecognitionInsight[] = [
  {
    id: "identity",
    label: "They recognize identity",
    note: "Before the crowds reach a verdict, hostile spirits name Jesus as the Holy One, the Christ, and the Son of the Most High God.",
    refs: ["MRK 1:23-27", "LUK 4:40-41", "MRK 5:1-20"],
  },
  {
    id: "judgment",
    label: "They anticipate judgment",
    note: "Their questions are about destruction, torment, timing, and where they may be sent—not whether Jesus can command them.",
    refs: ["MRK 1:23-27", "MRK 5:1-20"],
  },
  {
    id: "delegated-authority",
    label: "Authority is delegated",
    note: "The Twelve, the seventy, Philip, and Paul act under a received authority; the record never treats power as their possession.",
    refs: [
      "MAT 10:7-8",
      "LUK 10:17-20",
      "ACT 8:7",
      "ACT 16:16-18",
      "ACT 19:11-12",
    ],
  },
  {
    id: "not-formula",
    label: "A name is not a formula",
    note: "The sons of Sceva repeat the right name without the right authority, and the spirit exposes the difference.",
    refs: ["ACT 19:13-16"],
  },
];
