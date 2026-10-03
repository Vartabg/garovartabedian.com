import type { InvestigationDefinition } from "../investigation-types";

export const CLEMENT_ISAIAH_QUOTE =
  "But He was wounded for our transgressions, and bruised for our iniquities. The chastisement of our peace was upon Him, and by His stripes we were healed.";

export const ISAIAH_CLEMENT_INVESTIGATION: InvestigationDefinition = {
  schemaVersion: "1.0.0",
  id: "isaiah-53-clement-16",
  title: "Isaiah 53 in 1 Clement 16",
  question: "How does 1 Clement use the suffering servant passage to teach humility in Christ?",
  scope: "A close reading of two hosted English translations, centered on Isaiah 53:5 and the opening and conclusion of 1 Clement 16. The full hosted paragraph is included with every Clement excerpt so its argument remains visible.",
  sources: [
    {
      id: "bible:web:ISA",
      kind: "scripture",
      translation: "web",
      book: "ISA",
      edition: "World English Bible — hosted Isaiah text",
      language: "English",
      attribution: "World English Bible. Hosted corpus catalog labels this edition 2020; the byte hash identifies the actual local snapshot.",
      rights: "Public domain (World English Bible text).",
      upstreamUrl: "https://ebible.org/engwebp/ISA53.htm",
      artifact: "public/scriptures/text/web/ISA.json",
      sha256: "6d1c086b1ba125123443511c7d8ee4709a02136ee1161e81bbb314f329c4cf24",
    },
    {
      id: "early:anf-1885:1clement",
      kind: "early-writing",
      work: "1clement",
      edition: "1 Clement — Ante-Nicene Fathers, Volume I (1885)",
      language: "English",
      attribution: "Alexander Roberts and James Donaldson, Ante-Nicene Fathers Vol. I (1885); hosted transcription sourced from Wikisource.",
      rights: "Public domain translation (1885).",
      upstreamUrl: "https://en.wikisource.org/wiki/Ante-Nicene_Fathers/Volume_I/First_Epistle_to_the_Corinthians",
      artifact: "public/early/texts/1clement.json",
      sha256: "36721482f5884c549b30c676dec02f84c2141b1ed506533eedca02d90228e28b",
    },
  ],
  excerpts: [
    {
      id: "isaiah-suffering",
      sourceId: "bible:web:ISA",
      label: "Isaiah 53:5 · World English Bible",
      locator: { kind: "verse", chapter: 53, verse: 5 },
      exact: "But he was pierced for our transgressions. He was crushed for our iniquities. The punishment that brought our peace was on him; and by his wounds we are healed.",
    },
    {
      id: "clement-suffering",
      sourceId: "early:anf-1885:1clement",
      label: "1 Clement 16 · the suffering passage",
      locator: { kind: "paragraph", chapter: 16, paragraph: 1 },
      exact: CLEMENT_ISAIAH_QUOTE,
    },
    {
      id: "clement-introduction",
      sourceId: "early:anf-1885:1clement",
      label: "1 Clement 16 · introduction to the quotation",
      locator: { kind: "paragraph", chapter: 16, paragraph: 1 },
      exact: "Our Lord Jesus Christ, the Sceptre of the majesty of God, did not come in the pomp of pride or arrogance, although He might have done so, but in a lowly condition, as the Holy Spirit had declared regarding Him. For He says, “Lord, who hath believed our report, and to whom is the arm of the Lord revealed?",
    },
    {
      id: "clement-conclusion",
      sourceId: "early:anf-1885:1clement",
      label: "1 Clement 16 · application to the readers",
      locator: { kind: "paragraph", chapter: 16, paragraph: 1 },
      exact: "Ye see, beloved, what is the example which has been given us; for if the Lord thus humbled Himself, what shall we do who have through Him come under the yoke of His grace?",
    },
  ],
  claims: [
    {
      id: "suffering-and-healing",
      statement: "Both English passages connect the sufferer's wounds with others' transgressions, peace, and healing.",
      basis: "textual-observation",
      evidenceIds: ["isaiah-suffering", "clement-suffering"],
      limits: "The English wording differs. This comparison does not identify a Greek manuscript or establish a Hebrew variant.",
    },
    {
      id: "christological-reception",
      statement: "1 Clement 16 presents the first extended scriptural quotation, which tracks Isaiah 53, as referring to Jesus Christ, whom the introduction names explicitly.",
      basis: "reception-interpretation",
      evidenceIds: ["clement-introduction", "clement-suffering"],
      limits: "This describes the letter's Christian reception of the passage. It does not by itself settle the servant's identity in Isaiah's earlier historical setting.",
    },
    {
      id: "humility-application",
      statement: "The chapter uses Christ's humility as an example for its readers to follow.",
      basis: "textual-observation",
      evidenceIds: ["clement-introduction", "clement-conclusion"],
      limits: "The conclusion follows quotations from Isaiah and then a psalm. It applies the chapter's combined scriptural argument; it is not a comment solely on Isaiah 53:5.",
    },
  ],
  relationship: {
    kind: "direct-citation",
    basis: "reception-identification",
    citingWork: "1 Clement 16",
    receivedPassage: "Isaiah 53:5",
    evidenceIds: ["isaiah-suffering", "clement-introduction", "clement-suffering"],
    limits: "1 Clement's introduction attributes the words to the Holy Spirit without naming Isaiah. Identifying Isaiah 53:5 within the letter's first extended quotation is an editorial judgment based on the supplied wording. The relationship concerns reception of Isaiah, not dependence on the modern World English Bible. These are distinct English translations; their differences alone do not establish textual variants or identify a Greek or Hebrew source edition. No Greek or Hebrew text has been collated in this packet, and the relationship does not certify the extent of the full quotation.",
  },
  editorialReview: {
    status: "draft",
    author: "GPT-6 Astra",
    scope: "Source-bound editorial reading. Exact-source checks do not constitute historical, theological, or human approval.",
  },
  openQuestions: [
    "Which Greek readings appear in 1 Clement 16 when checked against a named critical edition?",
    "How does the following psalm quotation contribute to the chapter's argument about humility?",
    "Which claims need revision after an independent review of the same source packet?",
  ],
};
