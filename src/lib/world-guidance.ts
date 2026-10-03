import { WORLD_BY_ID, type WorldId } from "./world-registry";

export type { WorldId } from "./world-registry";

export type WorldGuideLink = {
  href: string;
  label: string;
  note?: string;
};

export type WorldGuideConfig = {
  id: WorldId;
  label: string;
  base: string;
  deepLabel: string;
  source: {
    label: string;
    text: string;
    href?: string;
    hrefLabel?: string;
  };
  nav: WorldGuideLink[];
  journey: WorldGuideLink[];
};

export const WORLD_GUIDES: Record<WorldId, WorldGuideConfig> = {
  scriptures: {
    id: "scriptures",
    label: WORLD_BY_ID.scriptures.label,
    base: WORLD_BY_ID.scriptures.href,
    deepLabel: "Reader",
    source: {
      label: "Text basis",
      text:
        "Hosted scripture uses public-domain translations and local canon data; chapter links stay inside the source text.",
      href: "/sources#scripture-texts",
      hrefLabel: "Sources",
    },
    nav: [
      { href: "/scriptures", label: "Overview" },
      { href: "/scriptures/polyglot", label: "Polyglot" },
      { href: "/scriptures/catena", label: "Catena" },
      { href: "/scriptures/search", label: "Ask" },
      { href: "/scriptures/topics", label: "Topics" },
    ],
    journey: [
      {
        href: "/jesus",
        label: "Start with Jesus",
        note: "Words, life, prophecy, and witnesses.",
      },
      {
        href: "/scriptures/search",
        label: "Search the text",
        note: "Find exact WEB words or open a hosted reference.",
      },
      {
        href: "/word",
        label: "Who owns the Bible?",
        note: "Why the free text matters.",
      },
    ],
  },
  jesus: {
    id: "jesus",
    label: WORLD_BY_ID.jesus.label,
    base: WORLD_BY_ID.jesus.href,
    deepLabel: "Room",
    source: {
      label: "Source basis",
      text:
        "Gospel text links into the hosted reader; history, prophecy, and world-perspective pages cite records inline and separate evidence from belief or lore.",
      href: "/sources#jesus-history",
      hrefLabel: "Sources",
    },
    nav: [
      { href: "/jesus", label: "Overview" },
      { href: "/jesus/words", label: "His words" },
      { href: "/jesus/harmony", label: "Synoptic Harmony" },
      { href: "/jesus/life", label: "His life" },
      { href: "/jesus/risen", label: "Cross to ascension" },
      { href: "/jesus/prophecy", label: "Prophecy" },
      { href: "/jesus/history", label: "History" },
      { href: "/jesus/lens", label: "World views" },
      { href: "/jesus/dossier", label: "NotebookLM Dossiers" },
    ],
    journey: [
      {
        href: "/jesus/words",
        label: "Read his words",
        note: "Red-letter sayings linked to context.",
      },
      {
        href: "/jesus/life",
        label: "Walk the map",
        note: "Events placed in first-century geography.",
      },
      {
        href: "/jesus/risen",
        label: "Cross to ascension",
        note: "The three days and the forty days, source by source.",
      },
      {
        href: "/jesus/dossier",
        label: "NotebookLM studio",
        note: "Hosted-text worksheets & Audio Overview prompts.",
      },
      {
        href: "/apostles",
        label: "Meet the twelve",
        note: "The men he chose, record by record.",
      },
    ],
  },
  apostles: {
    id: "apostles",
    label: WORLD_BY_ID.apostles.label,
    base: WORLD_BY_ID.apostles.href,
    deepLabel: "Record",
    source: {
      label: "Source basis",
      text:
        "Scripture refs resolve into the hosted reader; every mission and death claim names its earliest source and wears a grade — scripture, early source, or later tradition.",
      href: "/sources#apostles",
      hrefLabel: "Sources",
    },
    nav: [
      { href: "/apostles", label: "Overview" },
      { href: "/apostles/twelve", label: "The twelve" },
      { href: "/apostles/sent", label: "The sending" },
    ],
    journey: [
      {
        href: "/apostles/twelve",
        label: "Open the records",
        note: "One record per man — call, fault, road, cost.",
      },
      {
        href: "/apostles/sent",
        label: "Follow the roads",
        note: "Every sending drawn as far as the evidence reaches.",
      },
      {
        href: "/early",
        label: "What they wrote next",
        note: "The first generations after the apostles.",
      },
    ],
  },
  early: {
    id: "early",
    label: WORLD_BY_ID.early.label,
    base: WORLD_BY_ID.early.href,
    deepLabel: "Text",
    source: {
      label: "Source basis",
      text:
        "Each hosted writing names its date, translator, source link, and manuscript survival notes where available.",
      href: "/sources#early-writings",
      hrefLabel: "Sources",
    },
    nav: [
      { href: "/early", label: "Overview" },
      { href: "/early/era/jewish", label: "Jewish apocalyptic" },
      { href: "/early/era/fathers", label: "Apostolic Fathers" },
      { href: "/early/era/apologists", label: "Apologists" },
      { href: "/early/era/apocrypha", label: "Apocrypha" },
      { href: "/early/ignatius", label: "Ignatius' road" },
    ],
    journey: [
      {
        href: "/early/era/fathers",
        label: "Open the Fathers",
        note: "Didache, Clement, Ignatius, Hermas, and more.",
      },
      {
        href: "/early/enoch",
        label: "Read 1 Enoch",
        note: "The oldest book in this room — Jude quotes it.",
      },
      {
        href: "/early/ignatius",
        label: "Walk Ignatius' road",
        note: "Seven letters on the way to Rome.",
      },
      {
        href: "/church",
        label: "Follow the church",
        note: "From the upper room to today.",
      },
    ],
  },
  church: {
    id: "church",
    label: WORLD_BY_ID.church.label,
    base: WORLD_BY_ID.church.href,
    deepLabel: "Record",
    source: {
      label: "Source basis",
      text:
        "Road steps, councils, faces, and claims cite their source records inline; dark chapters are stated beside bright ones.",
      href: "/sources#church-history",
      hrefLabel: "Sources",
    },
    nav: [
      { href: "/church", label: "The road" },
      { href: "/church/tree", label: "The tree" },
      { href: "/church/faces", label: "The faces" },
      { href: "/church/councils", label: "The councils" },
      { href: "/church/giants", label: "The giants" },
    ],
    journey: [
      {
        href: "/church/tree",
        label: "See the tree",
        note: "The whole branch structure at once.",
      },
      {
        href: "/church/councils",
        label: "Map the councils",
        note: "Places, callers, and decisions.",
      },
      {
        href: "/word",
        label: "Who owns the Word?",
        note: "The factual record of Bible fences.",
      },
    ],
  },
  angels: {
    id: "angels",
    label: WORLD_BY_ID.angels.label,
    base: WORLD_BY_ID.angels.href,
    deepLabel: "Record",
    source: {
      label: "Source basis",
      text:
        "Ranks, names, enemy titles, and encounters link back to scripture references; later tradition is not blended into the order.",
      href: "/sources#angels-demons",
      hrefLabel: "Sources",
    },
    nav: [
      { href: "/angels", label: "The order" },
      { href: "/angels/fall", label: "The fall" },
      { href: "/angels/encounters", label: "The encounters" },
      { href: "/angels/demons", label: "The demons" },
      { href: "/angels/vocabulary", label: "The vocabulary" },
    ],
    journey: [
      {
        href: "/angels/fall",
        label: "Trace the fall",
        note: "From Genesis to the final judgment.",
      },
      {
        href: "/angels/encounters",
        label: "Open the encounters",
        note: "When the unseen stepped into view.",
      },
      {
        href: "/angels/vocabulary",
        label: "Count the words",
        note: "Selected Hebrew and Greek terms for the unseen, linked to their verses.",
      },
    ],
  },
  word: {
    id: "word",
    label: WORLD_BY_ID.word.label,
    base: WORLD_BY_ID.word.href,
    deepLabel: "Record",
    source: {
      label: "Source basis",
      text:
        "Translation ownership, permissions, cases, and policies are taken from rights-holder pages and linked source records.",
      href: "/sources#word-ownership",
      hrefLabel: "Sources",
    },
    nav: [
      { href: "/word", label: "The fences" },
      { href: "/word/free", label: "The free way" },
      { href: "/word/cases", label: "The cases" },
      { href: "/scriptures", label: "Read free texts" },
    ],
    journey: [
      {
        href: "/word#fenced",
        label: "See the fences",
        note: "Owners, policies, and allowances.",
      },
      {
        href: "/word/cases",
        label: "Test the fence",
        note: "Lawsuits, licensing fights, and reversals.",
      },
      {
        href: "/word/free",
        label: "Check the chain",
        note: "Every hosted text, from source file to license to reader.",
      },
      {
        href: "/scriptures",
        label: "Read the free texts",
        note: "The public-domain reader this makes possible.",
      },
    ],
  },
  evidence: {
    id: "evidence",
    label: WORLD_BY_ID.evidence.label,
    base: WORLD_BY_ID.evidence.href,
    deepLabel: "Claim",
    source: {
      label: "Evidence basis",
      text:
        "Texts, artifacts, witnesses, experiments, arguments, and traditions remain visibly separated; every case shows the bridge to its conclusion and states what the evidence cannot establish.",
      href: "/sources#how-we-know",
      hrefLabel: "Sources",
    },
    nav: [
      { href: "/evidence", label: "Overview" },
      { href: "/evidence#claim-lab", label: "Claim Lab" },
      { href: "/evidence#method", label: "The method" },
      { href: "/evidence#rooms", label: "Eight lenses" },
      { href: "/evidence#source-map", label: "Source map" },
      { href: "/evidence#faith-science", label: "Faith & Science" },
    ],
    journey: [
      {
        href: "/evidence#claim-lab",
        label: "Enter the Claim Lab",
        note: "Six cases already operating across the site.",
      },
      {
        href: "/evidence#rooms",
        label: "Walk the eight rooms",
        note: "Change the question by changing the evidence lens.",
      },
      {
        href: "/evidence#method",
        label: "Read the charter",
        note: "The rules every claim must obey.",
      },
    ],
  },
};
