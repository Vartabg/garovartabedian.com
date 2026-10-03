import { CLEMENT_ISAIAH_QUOTE } from "@/lib/evidence/investigations/isaiah-53-clement-16";

export type CatenaCentury =
  | "1st Century"
  | "1st–2nd Century"
  | "2nd Century"
  | "3rd Century";

export type CatenaEntry = {
  id: string;
  scriptureRef: string;
  book: string;
  chapter: number;
  verse: number;
  scriptureDisplay: string;
  father: string;
  fatherRole: string;
  workTitle: string;
  workId: string;
  section: number;
  date: string;
  century: CatenaCentury;
  excerpt: string;
  theologicalTheme: string;
  commentaryNote: string;
  href: string;
  investigationHref?: string;
};

export const CATENA_RECEPTION: CatenaEntry[] = [
  {
    id: "catena-gen-1-26-barnabas",
    scriptureRef: "GEN.1.26",
    book: "GEN",
    chapter: 1,
    verse: 26,
    scriptureDisplay: "Genesis 1:26",
    father: "Epistle of Barnabas",
    fatherRole: "Anonymous early Christian tract",
    workTitle: "The Epistle of Barnabas",
    workId: "barnabas",
    section: 5,
    date: "c. AD 70–132",
    century: "1st–2nd Century",
    excerpt:
      "And for this cause the Lord endured to suffer for our souls, though He was the Lord of the whole world, unto whom God said from the foundation of the world, 'Let us make man after our image and likeness.'",
    theologicalTheme: "Pre-existence of Christ & Creation",
    commentaryNote:
      "Barnabas applies Genesis 1:26 to Christ's pre-existence. The entry records that reception reading; it does not settle the plural's meaning in Genesis.",
    href: "/early/barnabas#chapter-5",
  },
  {
    id: "catena-gen-1-26-clement",
    scriptureRef: "GEN.1.26",
    book: "GEN",
    chapter: 1,
    verse: 26,
    scriptureDisplay: "Genesis 1:26",
    father: "Clement of Rome",
    fatherRole: "Early Christian letter traditionally associated with Rome",
    workTitle: "1 Clement",
    workId: "1clement",
    section: 33,
    date: "c. AD 95–96",
    century: "1st Century",
    excerpt:
      "Above all, with His holy and unblemished hands He formed man, the most excellent of His creatures and truly great through the impress of His image.",
    theologicalTheme: "The Dignity of the Imago Dei",
    commentaryNote:
      "The letter invokes humanity as God's handiwork while exhorting its audience to good works and order.",
    href: "/early/1clement#chapter-33",
  },
  {
    id: "catena-gen-15-6-clement",
    scriptureRef: "GEN.15.6",
    book: "GEN",
    chapter: 15,
    verse: 6,
    scriptureDisplay: "Genesis 15:6",
    father: "Clement of Rome",
    fatherRole: "Early Christian letter traditionally associated with Rome",
    workTitle: "1 Clement",
    workId: "1clement",
    section: 10,
    date: "c. AD 95–96",
    century: "1st Century",
    excerpt:
      "Abraham, who was called 'the friend,' was found faithful in that he rendered obedience to the words of God... he believed God, and it was counted to him for righteousness.",
    theologicalTheme: "Faith & Obedience of Abraham",
    commentaryNote:
      "The letter presents Abraham's faith together with obedience. Its relation to the arguments of Romans and James is a later comparative question.",
    href: "/early/1clement#chapter-10",
  },
  {
    id: "catena-exo-3-14-diognetus",
    scriptureRef: "EXO.3.14",
    book: "EXO",
    chapter: 3,
    verse: 14,
    scriptureDisplay: "Exodus 3:14",
    father: "Letter to Diognetus",
    fatherRole: "Anonymous early Christian apologist",
    workTitle: "The Epistle to Diognetus",
    workId: "diognetus",
    section: 8,
    date: "c. AD 130–200",
    century: "2nd Century",
    excerpt:
      "For who among men understood what God was before He came Himself? ... He manifested Himself by faith, by which alone it is given to behold God.",
    theologicalTheme: "The Transcendent Divine Nature",
    commentaryNote:
      "The section contrasts human speculation with knowledge of God through revelation and faith. Its association with Exodus 3 is thematic rather than an explicit citation.",
    href: "/early/diognetus#chapter-8",
  },
  {
    id: "catena-exo-20-13-didache",
    scriptureRef: "EXO.20.13",
    book: "EXO",
    chapter: 20,
    verse: 13,
    scriptureDisplay: "Exodus 20:13",
    father: "The Didache",
    fatherRole: "Early Christian church-order text",
    workTitle: "The Didache",
    workId: "didache",
    section: 2,
    date: "c. AD 50–120",
    century: "1st–2nd Century",
    excerpt:
      "And the second commandment of the Teaching is: You shall not commit murder; you shall not commit adultery; you shall not corrupt boys; you shall not commit fornication; you shall not steal; you shall not practice magic...",
    theologicalTheme: "The Two Ways: Ancient Ethic",
    commentaryNote:
      "The Didache's Two Ways section places the command against murder among a wider set of ethical prohibitions. The link to Exodus 20 is a reception comparison, not a direct quotation claim for every rule.",
    href: "/early/didache#chapter-2",
  },
  {
    id: "catena-psa-22-1-clement",
    scriptureRef: "PSA.22.1",
    book: "PSA",
    chapter: 22,
    verse: 1,
    scriptureDisplay: "Psalm 22:1",
    father: "Clement of Rome",
    fatherRole: "Early Christian letter traditionally associated with Rome",
    workTitle: "1 Clement",
    workId: "1clement",
    section: 16,
    date: "c. AD 95–96",
    century: "1st Century",
    excerpt:
      "For Christ is of those who are humble-minded, and not of those who exalt themselves over His flock... as the Holy Spirit spoke of Him: 'I am a worm, and no man; a reproach of men, and despised of the people.'",
    theologicalTheme: "The Humility of the Crucified",
    commentaryNote:
      "The letter applies language from Psalm 22 and Isaiah 53 to Christ as part of an exhortation to humility.",
    href: "/early/1clement#chapter-16",
  },
  {
    id: "catena-psa-110-1-barnabas",
    scriptureRef: "PSA.110.1",
    book: "PSA",
    chapter: 110,
    verse: 1,
    scriptureDisplay: "Psalm 110:1",
    father: "Epistle of Barnabas",
    fatherRole: "Anonymous early Christian tract",
    workTitle: "The Epistle of Barnabas",
    workId: "barnabas",
    section: 12,
    date: "c. AD 70–132",
    century: "1st–2nd Century",
    excerpt:
      "See how David calls Him Lord, and does not call Him Son... 'The Lord said to my Lord, Sit on my right hand, until I make your enemies your footstool.'",
    theologicalTheme: "Messianic Lordship over David",
    commentaryNote:
      "Barnabas reads Psalm 110 christologically. Similar New Testament uses provide comparison, but this entry does not establish a single line of dependence.",
    href: "/early/barnabas#chapter-12",
  },
  {
    id: "catena-isa-1-11-barnabas",
    scriptureRef: "ISA.1.11",
    book: "ISA",
    chapter: 1,
    verse: 11,
    scriptureDisplay: "Isaiah 1:11",
    father: "Epistle of Barnabas",
    fatherRole: "Anonymous early Christian tract",
    workTitle: "The Epistle of Barnabas",
    workId: "barnabas",
    section: 2,
    date: "c. AD 70–132",
    century: "1st–2nd Century",
    excerpt:
      "He has declared to us by all the prophets that He requires neither sacrifices nor burnt-offerings nor oblations, saying: 'What to me is the multitude of your sacrifices? says the Lord. I am full of burnt-offerings of rams...'",
    theologicalTheme: "The Spiritual Sacrifice of the Heart",
    commentaryNote:
      "Barnabas cites Isaiah's critique of sacrifice while arguing for a Christian reading of acceptable worship.",
    href: "/early/barnabas#chapter-2",
  },
  {
    id: "catena-isa-53-5-clement",
    investigationHref: "/scriptures/investigations/isaiah-53-clement-16",
    scriptureRef: "ISA.53.5",
    book: "ISA",
    chapter: 53,
    verse: 5,
    scriptureDisplay: "Isaiah 53:5",
    father: "Clement of Rome",
    fatherRole: "Early Christian letter traditionally associated with Rome",
    workTitle: "1 Clement",
    workId: "1clement",
    section: 16,
    date: "c. AD 95–96",
    century: "1st Century",
    excerpt:
      CLEMENT_ISAIAH_QUOTE,
    theologicalTheme: "Vicarious Atonement & The Sceptre of Majesty",
    commentaryNote:
      "The letter presents Christ as an example of humility, introducing an extended quotation of Isaiah 53. This excerpt matches the hosted Ante-Nicene Fathers translation; the investigation distinguishes that text check from interpretation.",
    href: "/early/1clement#chapter-16",
  },
  {
    id: "catena-isa-53-9-polycarp",
    scriptureRef: "ISA.53.9",
    book: "ISA",
    chapter: 53,
    verse: 9,
    scriptureDisplay: "Isaiah 53:9",
    father: "Polycarp of Smyrna",
    fatherRole: "Bishop of Smyrna and early Christian letter writer",
    workTitle: "Polycarp to the Philippians",
    workId: "polycarp-philippians",
    section: 8,
    date: "c. AD 110–140",
    century: "2nd Century",
    excerpt:
      "Let us then continually persevere in our hope, and the earnest of our righteousness, which is Jesus Christ, who bore our sins in His own body on the tree, who did no sin, neither was guile found in His mouth...",
    theologicalTheme: "Endurance & The Sinless Sufferer",
    commentaryNote:
      "Polycarp uses language shared with Isaiah 53 and 1 Peter 2 while exhorting the Philippian church to endurance.",
    href: "/early/polycarp-philippians#chapter-8",
  },
  {
    id: "catena-mat-5-3-polycarp",
    scriptureRef: "MAT.5.3",
    book: "MAT",
    chapter: 5,
    verse: 3,
    scriptureDisplay: "Matthew 5:3",
    father: "Polycarp of Smyrna",
    fatherRole: "Bishop of Smyrna and early Christian letter writer",
    workTitle: "Polycarp to the Philippians",
    workId: "polycarp-philippians",
    section: 2,
    date: "c. AD 110–140",
    century: "2nd Century",
    excerpt:
      "Remembering what the Lord said teaching: 'Judge not, that you be not judged; forgive, and you shall be forgiven; be merciful, that you may obtain mercy... and, Blessed are the poor, and they that are persecuted for righteousness' sake, for theirs is the kingdom of God.'",
    theologicalTheme: "The Living Words of the Lord",
    commentaryNote:
      "Polycarp presents sayings also found in the Synoptic tradition as the Lord's teaching. The passage alone does not determine whether he used oral or written sources.",
    href: "/early/polycarp-philippians#chapter-2",
  },
  {
    id: "catena-mat-6-9-didache",
    scriptureRef: "MAT.6.9",
    book: "MAT",
    chapter: 6,
    verse: 9,
    scriptureDisplay: "Matthew 6:9–13",
    father: "The Didache",
    fatherRole: "Early Christian church-order text",
    workTitle: "The Didache",
    workId: "didache",
    section: 8,
    date: "c. AD 50–120",
    century: "1st–2nd Century",
    excerpt:
      "Neither pray as the hypocrites; but as the Lord commanded in His Gospel, thus pray: 'Our Father who art in heaven, hallowed be Thy name. Thy kingdom come. Thy will be done on earth, as it is in heaven... And forgive us our debt as we also forgive our debtors... but deliver us from evil; for Thine is the power and the glory forever.' Three times in the day pray thus.",
    theologicalTheme: "Liturgical Life & The Lord's Prayer",
    commentaryNote:
      "Didache 8 gives a form of the Lord's Prayer with a doxology and directs readers to pray it three times daily; the size and practice of its original community are not specified.",
    href: "/early/didache#chapter-8",
  },
  {
    id: "catena-mat-26-26-didache",
    scriptureRef: "MAT.26.26",
    book: "MAT",
    chapter: 26,
    verse: 26,
    scriptureDisplay: "Matthew 26:26",
    father: "The Didache",
    fatherRole: "Early Christian church-order text",
    workTitle: "The Didache",
    workId: "didache",
    section: 9,
    date: "c. AD 50–120",
    century: "1st–2nd Century",
    excerpt:
      "Now concerning the Eucharist, give thanks this way: First, concerning the cup: 'We thank thee, our Father, for the holy vine of David Thy servant, which Thou madest known to us through Jesus Thy Servant...' And concerning the broken bread: 'We thank Thee, our Father, for the life and knowledge...'",
    theologicalTheme: "Early Eucharistic Thanksgiving",
    commentaryNote:
      "Didache 9 supplies thanksgiving prayers over the cup and broken bread with Davidic and gathering imagery. Its precise relationship to Gospel meal traditions remains a subject of interpretation.",
    href: "/early/didache#chapter-9",
  },
  {
    id: "catena-mat-26-26-ignatius",
    scriptureRef: "MAT.26.26",
    book: "MAT",
    chapter: 26,
    verse: 26,
    scriptureDisplay: "Matthew 26:26",
    father: "Ignatius of Antioch",
    fatherRole: "Bishop of Antioch and early Christian letter writer",
    workTitle: "Ignatius — To the Smyrnaeans",
    workId: "ignatius-smyrnaeans",
    section: 7,
    date: "c. AD 105–115",
    century: "2nd Century",
    excerpt:
      "They abstain from the Eucharist and from prayer, because they confess not the Eucharist to be the flesh of our Savior Jesus Christ, which suffered for our sins, and which the Father, of His goodness, raised up again.",
    theologicalTheme: "Eucharistic Realism vs. Docetism",
    commentaryNote:
      "Ignatius links his opponents' abstention from the Eucharist to their denial that Jesus truly suffered in flesh; later traditions differ in how they frame the passage's eucharistic implications.",
    href: "/early/ignatius-smyrnaeans#chapter-7",
  },
  {
    id: "catena-jhn-1-1-ignatius",
    scriptureRef: "JHN.1.1",
    book: "JHN",
    chapter: 1,
    verse: 1,
    scriptureDisplay: "John 1:1",
    father: "Ignatius of Antioch",
    fatherRole: "Bishop of Antioch and early Christian letter writer",
    workTitle: "Ignatius — To the Magnesians",
    workId: "ignatius-magnesians",
    section: 8,
    date: "c. AD 105–115",
    century: "2nd Century",
    excerpt:
      "There is one God, who has manifested Himself by Jesus Christ His Son, who is His eternal Word (Logos), not proceeding from silence, who in all things pleased Him that sent Him.",
    theologicalTheme: "Christ as the Eternal Word",
    commentaryNote:
      "Ignatius calls Christ God's eternal Word and says he did not proceed from silence. The identity of the opponents or concepts addressed by that phrase is debated.",
    href: "/early/ignatius-magnesians#chapter-8",
  },
  {
    id: "catena-rom-3-28-clement",
    scriptureRef: "ROM.3.28",
    book: "ROM",
    chapter: 3,
    verse: 28,
    scriptureDisplay: "Romans 3:28",
    father: "Clement of Rome",
    fatherRole: "Early Christian letter traditionally associated with Rome",
    workTitle: "1 Clement",
    workId: "1clement",
    section: 32,
    date: "c. AD 95–96",
    century: "1st Century",
    excerpt:
      "And we, too, being called by His will in Christ Jesus, are not justified by ourselves, nor by our own wisdom, or understanding, or godliness, or works which we have done in holiness of heart; but by that faith through which, from the beginning, Almighty God has justified all men; to whom be glory for ever and ever. Amen.",
    theologicalTheme: "Divine Calling, Faith, and Justification",
    commentaryNote:
      "The letter denies self-justification by wisdom, piety, or holy works and attributes justification to God's call and faith. How this relates to later faith-and-works formulas requires broader context.",
    href: "/early/1clement#chapter-32",
  },
  {
    id: "catena-jas-2-24-clement",
    scriptureRef: "JAS.2.24",
    book: "JAS",
    chapter: 2,
    verse: 24,
    scriptureDisplay: "James 2:24",
    father: "Clement of Rome",
    fatherRole: "Early Christian letter traditionally associated with Rome",
    workTitle: "1 Clement",
    workId: "1clement",
    section: 30,
    date: "c. AD 95–96",
    century: "1st Century",
    excerpt:
      "Let us clothe ourselves with concord and humility, ever exercising self-control, standing far off from all whispering and evil-speaking, being justified by works, and not by words.",
    theologicalTheme: "Works, Speech, and Community Conduct",
    commentaryNote:
      "The letter contrasts being justified by works with being justified by words in an exhortation to communal conduct. Verbal similarity to James 2 invites comparison but does not by itself prove direct citation.",
    href: "/early/1clement#chapter-30",
  },
  {
    id: "catena-1pe-2-9-clement",
    scriptureRef: "1PE.2.9",
    book: "1PE",
    chapter: 2,
    verse: 9,
    scriptureDisplay: "1 Peter 2:9",
    father: "Clement of Rome",
    fatherRole: "Early Christian letter traditionally associated with Rome",
    workTitle: "1 Clement",
    workId: "1clement",
    section: 29,
    date: "c. AD 95–96",
    century: "1st Century",
    excerpt:
      "Let us then approach Him in holiness of soul, lifting up pure and undefiled hands unto Him... seeing that He has made us an elect portion for Himself.",
    theologicalTheme: "The Holy Priesthood of the Church",
    commentaryNote:
      "The letter describes its audience as God's chosen portion using language associated with Israel's election. Connections with Exodus, Deuteronomy, and 1 Peter should be evaluated as intertextual parallels.",
    href: "/early/1clement#chapter-29",
  },
  {
    id: "catena-rev-22-12-clement",
    scriptureRef: "REV.22.12",
    book: "REV",
    chapter: 22,
    verse: 12,
    scriptureDisplay: "Revelation 22:12",
    father: "Clement of Rome",
    fatherRole: "Early Christian letter traditionally associated with Rome",
    workTitle: "1 Clement",
    workId: "1clement",
    section: 34,
    date: "c. AD 95–96",
    century: "1st Century",
    excerpt:
      "For He warns us: 'Behold, the Lord comes, and His reward is before His face, to render to every man according to his work.' He exhorts us therefore with our whole heart to attend to this, that we be not slothful or remiss in any good work.",
    theologicalTheme: "The Parousia & Final Reward",
    commentaryNote:
      "The passage combines scriptural reward language also found in Isaiah 40, Proverbs 24, and Revelation 22; the direction of literary dependence is not established here.",
    href: "/early/1clement#chapter-34",
  },
];

export function getCatenaEntriesForVerse(ref: string): CatenaEntry[] {
  const norm = ref.trim().toUpperCase().replace(/\s+/g, ".");
  return CATENA_RECEPTION.filter((entry) => {
    if (entry.scriptureRef === norm) return true;
    const parts = norm.split(".");
    if (parts.length >= 2 && entry.book === parts[0] && entry.chapter === Number(parts[1])) {
      return parts.length === 2 || entry.verse === Number(parts[2]);
    }
    return false;
  });
}

export function getCatenaEntriesForBook(bookId: string): CatenaEntry[] {
  const norm = bookId.trim().toUpperCase();
  return CATENA_RECEPTION.filter((entry) => entry.book === norm);
}

export function searchCatena(query: string): CatenaEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return CATENA_RECEPTION;

  return CATENA_RECEPTION.filter((entry) => {
    return (
      entry.scriptureDisplay.toLowerCase().includes(q) ||
      entry.father.toLowerCase().includes(q) ||
      entry.fatherRole.toLowerCase().includes(q) ||
      entry.workTitle.toLowerCase().includes(q) ||
      entry.theologicalTheme.toLowerCase().includes(q) ||
      entry.commentaryNote.toLowerCase().includes(q) ||
      entry.excerpt.toLowerCase().includes(q)
    );
  });
}

/**
 * Formats patristic reception entries into a structured, citation-grounded
 * research dossier tailored for ingestion into Google NotebookLM.
 */
export function generateCatenaDossier(args: {
  target: string;
  entries: CatenaEntry[];
}): string {
  const { target, entries } = args;
  const lines: string[] = [];

  lines.push(`# Catena Aurea Research Dossier: Patristic Reception of ${target}`);
  lines.push("");
  lines.push(`> Source-Grounded Scholarly Dossier prepared for Google NotebookLM.`);
  lines.push(`> Reception Index: Mapping selected biblical verses to source-attributed early Christian passages and editorial comparison notes.`);
  lines.push(`> Total Reception Links: ${entries.length}`);
  lines.push("");

  lines.push(`## Historical Scope & Overview`);
  lines.push(
    `Thomas Aquinas's medieval *Catena Aurea* linked Gospel passages with earlier commentary. This digital index uses the catena idea more broadly: it places selected hosted early Christian excerpts beside biblical passages and labels the connecting commentary as editorial analysis.`,
  );
  lines.push("");

  lines.push(`## Chronological Patristic Reception Chain`);
  lines.push("");

  for (const entry of entries) {
    lines.push(`### ${entry.scriptureDisplay} — ${entry.father} (${entry.date})`);
    lines.push(`**Work**: *${entry.workTitle}* (Section §${entry.section}) · [View Chapter](https://garovartabedian.com${entry.href})`);
    lines.push(`**Theological Theme**: ${entry.theologicalTheme}`);
    lines.push(`**Father's Role**: ${entry.fatherRole}`);
    lines.push("");
    lines.push(`> "${entry.excerpt}"`);
    lines.push("");
    lines.push(`**Historical Commentary & Analysis**:`);
    lines.push(entry.commentaryNote);
    lines.push("");
    lines.push(`---`);
    lines.push("");
  }

  lines.push(`## Dialectical Inquiry Prompts for NotebookLM Synthesis`);
  lines.push(
    `1. How do the selected early Christian texts use ${target}, and what can their dates and genres establish about reception?`,
  );
  lines.push(
    `2. Compare how ${entries[0]?.father || "the Church Fathers"} used scripture for immediate community ethics and unity versus doctrinal apologetics.`,
  );
  lines.push(
    `3. What pastoral crises (e.g. division in Corinth, martyrdom under Trajan, Docetism) shaped the way these verses were cited and applied?`,
  );
  lines.push("");
  lines.push(`---`);
  lines.push(`*Source note: Hosted excerpts are labeled by work and section. Editorial commentary is an aid; verify wording and interpretation against the cited edition before reuse.*`);

  return lines.join("\n");
}
