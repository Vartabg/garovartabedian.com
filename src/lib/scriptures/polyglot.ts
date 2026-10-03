import type { OriginalChapter, OriginalEditionId, OriginalVerse } from "./types";

export type PolyglotWitnessId = "original" | "brenton" | "drb" | "kjv" | "web";

export type PolyglotWitnessMeta = {
  id: PolyglotWitnessId;
  label: string;
  sublabel: string;
  editionLabel: string;
  language: string;
  provenance: string;
  badge: string;
};

export const HEXAPLA_WITNESSES: Record<PolyglotWitnessId, PolyglotWitnessMeta> = {
  original: {
    id: "original",
    label: "Original-language edition",
    sublabel: "Hebrew / Aramaic / Greek",
    editionLabel: "Open Scriptures Hebrew Bible / SBLGNT / Rahlfs Septuagint (1935) + lxx-morph",
    language: "he / grc",
    provenance:
      "Pointed Westminster Leningrad Codex text through OSHB, SBL Greek New Testament text through MorphGNT, or Rahlfs 1935 Septuagint Greek through lxx-morph, according to the selected book.",
    badge: "Source Edition",
  },
  brenton: {
    id: "brenton",
    label: "Brenton Septuagint",
    sublabel: "English translation from Greek",
    editionLabel: "Lancelot C. L. Brenton (1851)",
    language: "en (from Greek)",
    provenance:
      "Brenton's nineteenth-century English translation of the Greek Septuagint; this column is not the underlying Greek text.",
    badge: "English Translation",
  },
  drb: {
    id: "drb",
    label: "Douay-Rheims",
    sublabel: "English translation in the Vulgate tradition",
    editionLabel: "Douay-Rheims (Challoner revision; hosted 1899 edition)",
    language: "en (from Latin)",
    provenance:
      "The hosted public-domain English Challoner text descends from the Douay-Rheims translation of the Latin Vulgate; it is not Latin text.",
    badge: "English Translation",
  },
  kjv: {
    id: "kjv",
    label: "King James Version",
    sublabel: "Early Modern English",
    editionLabel: "King James Version (1769 Blayney text)",
    language: "en (Early Modern)",
    provenance:
      "The hosted public-domain 1769 text of the 1611 English translation, produced from Hebrew and Aramaic sources and early modern Greek editions commonly grouped under the Textus Receptus label.",
    badge: "English Translation",
  },
  web: {
    id: "web",
    label: "World English Bible",
    sublabel: "Contemporary English",
    editionLabel: "World English Bible (2020)",
    language: "en (Contemporary)",
    provenance:
      "The hosted public-domain 2020 English text. Its project documentation identifies the Biblia Hebraica Stuttgartensia and Byzantine Majority Text among its textual bases.",
    badge: "English Translation",
  },
};

export type HexaplaPreset = {
  id: string;
  book: string;
  bookName: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  title: string;
  summary: string;
  theologicalSignificance: string;
  textualDivergence: {
    verse: number;
    hebrewOrGreekRef: string;
    readingDifferences: {
      witness: string;
      reading: string;
      explanation: string;
    }[];
  };
};

export const HEXAPLA_PRESETS: HexaplaPreset[] = [
  {
    id: "genesis-1",
    book: "GEN",
    bookName: "Genesis",
    chapter: 1,
    startVerse: 1,
    endVerse: 5,
    title: "Genesis 1:1–5 — Creation & the Ruach Elohim",
    summary:
      "The opening creation account describes heaven and earth, darkness over the deep, and the ruach elohim moving over the waters.",
    theologicalSignificance:
      "Ruach can be rendered wind, breath, or spirit. Jewish and Christian interpreters, including several patristic writers, have differed over whether Genesis 1:2 denotes a wind, God's spirit, or the Holy Spirit in a later Trinitarian reading.",
    textualDivergence: {
      verse: 2,
      hebrewOrGreekRef: "וְר֣וּחַ אֱלֹהִ֔ים מְרַחֶ֖פֶת עַל־פְּנֵ֥י הַמָּֽיִם",
      readingDifferences: [
        {
          witness: "Masoretic Hebrew (Open Scriptures Hebrew Bible)",
          reading: "ruach elohim merachefet (a wind/spirit of God hovering)",
          explanation: "The same Hebrew root is used of an eagle hovering in Deuteronomy 32:11; that parallel informs, but does not determine, the image here.",
        },
        {
          witness: "Septuagint Greek (Rahlfs 1935 / lxx-morph)",
          reading: "πνεῦμα θεοῦ ἐπεφέρετο ἐπάνω τοῦ ὕδατος (a spirit/wind of God was moving over the water)",
          explanation: "The Greek uses pneuma and a verb of movement; identifying the referent as the Holy Spirit is a reception-history judgment rather than a grammatical requirement.",
        },
        {
          witness: "Douay-Rheims English (Challoner revision; hosted 1899 edition)",
          reading: "the spirit of God moved over the waters",
          explanation: "This is the hosted English translation in the Vulgate tradition, not the Latin text; later Trinitarian interpretation should be distinguished from the translation itself.",
        },
      ],
    },
  },
  {
    id: "exodus-3",
    book: "EXO",
    bookName: "Exodus",
    chapter: 3,
    startVerse: 13,
    endVerse: 15,
    title: "Exodus 3:13–15 — The Revelation of the Ineffable Name",
    summary:
      "Moses before the burning bush on Horeb receiving the covenantal self-disclosure of God: 'I AM WHO I AM'.",
    theologicalSignificance:
      "The Hebrew verbal form permits several present- and future-oriented renderings, while the Septuagint uses 'the one who is.' Later Jewish and Christian interpretation developed covenantal and philosophical readings from these forms, but the translation alone does not establish a single ontology.",
    textualDivergence: {
      verse: 14,
      hebrewOrGreekRef: "אֶֽהְיֶ֖ה אֲשֶׁ֣ר אֶֽהְיֶ֑ה",
      readingDifferences: [
        {
          witness: "Masoretic Hebrew (Open Scriptures Hebrew Bible)",
          reading: "Ehyeh Asher Ehyeh (I will be what I will be / I am who I am)",
          explanation: "The Hebrew imperfect forms allow more than one temporal nuance; readings centered on divine presence or covenant faithfulness are interpretive conclusions.",
        },
        {
          witness: "Septuagint Greek (Rahlfs 1935 / lxx-morph)",
          reading: "ἐγώ εἰμι ὁ ὤν (I am the one who is)",
          explanation:
            "Uses the Greek present participle of 'to be.' Later Christian writers drew metaphysical arguments from this wording, but those arguments are part of its reception history.",
        },
        {
          witness: "Douay-Rheims English (Challoner revision; hosted 1899 edition)",
          reading: "I AM WHO AM",
          explanation: "The hosted English reflects the Vulgate tradition's ego sum qui sum. Aquinas's later use of that wording belongs to reception history, not to this English witness itself.",
        },
      ],
    },
  },
  {
    id: "deuteronomy-32",
    book: "DEU",
    bookName: "Deuteronomy",
    chapter: 32,
    startVerse: 7,
    endVerse: 9,
    title: "Deuteronomy 32:7–9 — The Nations & the Verse 8 Textual Variant",
    summary:
      "The Song of Moses describes the Most High assigning the peoples their inheritances and fixing their boundaries.",
    theologicalSignificance:
      "The Masoretic Text reads 'sons of Israel,' 4QDeutj reads 'sons of God/gods,' and the Septuagint reads 'angels of God.' Many textual critics prefer a divine-being reading, but priority is a text-critical judgment rather than something any surviving witness can prove by itself.",
    textualDivergence: {
      verse: 8,
      hebrewOrGreekRef: "למספר בני ישראל / למספר בני אלהים / κατὰ ἀριθμὸν ἀγγέλων θεοῦ",
      readingDifferences: [
        {
          witness: "Masoretic Hebrew (Open Scriptures Hebrew Bible)",
          reading: "לְמִסְפַּר בְּנֵי יִשְׂרָאֵל (according to the number of the children of Israel)",
          explanation: "The Masoretic Text reads 'sons/children of Israel.' Proposed reasons for the difference are reconstructions of transmission history, not demonstrated scribal motives.",
        },
        {
          witness: "4QDeutj (4Q37; normalized transcription)",
          reading: "למספר בני אלהים (according to the number of the sons of God/gods)",
          explanation: "This normalized, unpointed form represents 4Q37's reading; consult a diplomatic edition for the fragment's spelling and layout. A divine-council interpretation is common but is distinct from the manuscript transcription.",
        },
        {
          witness: "Septuagint Greek (Rahlfs 1935 / lxx-morph)",
          reading: "κατὰ ἀριθμὸν ἀγγέλων θεοῦ (according to the number of the angels of God)",
          explanation: "The Greek has 'angels of God,' supporting a related divine-being reading. Reconstructing its Hebrew Vorlage and its relationship to 4Q37 requires text-critical argument.",
        },
      ],
    },
  },
  {
    id: "psalm-22",
    book: "PSA",
    bookName: "Psalms",
    chapter: 22,
    startVerse: 14,
    endVerse: 18,
    title: "Psalm 22:14–18 — The Suffering Righteous & the Hands-and-Feet Crux",
    summary:
      "A lament attributed to David in its superscription, whose opening line is placed on Jesus's lips in the Synoptic crucifixion narratives.",
    theologicalSignificance:
      "The difficult hands-and-feet clause has several ancient forms and a long Jewish and Christian reception history. The Masoretic reading, the Nahal Hever form, and the Greek and Latin translations should be compared without treating any one witness as self-interpreting.",
    textualDivergence: {
      verse: 16,
      hebrewOrGreekRef: "כארי / כארו / ὤρυξαν (Hebrew Psalm 22:17; common English numbering 22:16)",
      readingDifferences: [
        {
          witness: "Masoretic Hebrew (Open Scriptures Hebrew Bible)",
          reading: "ka'ari yaday v'raglay (Like a lion my hands and my feet)",
          explanation: "Consonantal text reads 'like a lion' (noun with k- prefix), lacking an explicit verb.",
        },
        {
          witness: "Nahal Hever Psalms scroll (5/6HevPs; commonly dated c. AD 50–68)",
          reading: "כארו ידיה ורגלי (common normalized transcription of the preserved line)",
          explanation: "The scroll is not securely pre-Christian. The readings of the final letter in כארו, the anomalous ידיה that follows it, and the form's morphology all require evaluation; the fragment does not by itself settle 'like a lion,' 'dug,' or 'pierced.'",
        },
        {
          witness: "Septuagint Greek, Psalm 21:17 (Rahlfs 1935 / lxx-morph)",
          reading: "ὤρυξαν χεῖράς μου καὶ πόδας (they dug my hands and feet)",
          explanation: "The Greek verb ordinarily means 'dug.' Brenton's 1851 English translation renders the line 'they pierced my hands and my feet'; that English choice should not be mistaken for the underlying Greek wording.",
        },
        {
          witness: "Douay-Rheims English, Psalm 21:17 (Challoner revision; hosted 1899 edition)",
          reading: "They have dug my hands and feet.",
          explanation: "The hosted English in the Vulgate tradition reads 'dug,' not 'pierced,' and follows the Greek/Latin Psalm numbering here.",
        },
      ],
    },
  },
  {
    id: "isaiah-7",
    book: "ISA",
    bookName: "Isaiah",
    chapter: 7,
    startVerse: 10,
    endVerse: 15,
    title: "Isaiah 7:10–15 — The Sign of Immanuel & the Maiden/Virgin",
    summary:
      "The prophetic sign delivered by Isaiah to King Ahaz in the Syro-Ephraimite crisis: 'The Lord himself will give you a sign'.",
    theologicalSignificance:
      "Matthew 1:23 cites the Greek form of Isaiah 7:14, making the relationship between Hebrew almah and Greek parthenos important in Christian reception. Neither word's nuance should be reduced to a one-word lexical proof.",
    textualDivergence: {
      verse: 14,
      hebrewOrGreekRef: "הִנֵּ֣ה הָעַלְמָ֗ה הָרָה֙ וְיֹלֶ֣דֶת בֵּ֔ן",
      readingDifferences: [
        {
          witness: "Masoretic Hebrew (Open Scriptures Hebrew Bible)",
          reading: "hinneh ha'almah harah veyoledet ben (Look, the young woman is pregnant and is bearing a son; temporal rendering debated)",
          explanation: "The Hebrew noun almah denotes a young woman and does not by itself specify sexual status; whether virginity is implied in this context is debated.",
        },
        {
          witness: "Septuagint Greek (Rahlfs 1935 / lxx-morph)",
          reading: "ἰδοὺ ἡ παρθένος ἐν γαστρὶ ἕξει καὶ τέξεται υἱόν (behold, the parthenos will conceive and bear a son)",
          explanation: "The pre-Christian Greek translation uses parthenos, a term often rendered 'virgin' but not mechanically exclusive in every Greek context. Its date and the translator's intended nuance should not be stated more precisely than the evidence permits.",
        },
        {
          witness: "Douay-Rheims English (Challoner revision; hosted 1899 edition)",
          reading: "Behold a virgin shall conceive, and bear a son",
          explanation: "This is the hosted English translation in the Vulgate tradition, not the Latin text. Its Marian reception is historically important but does not settle the Hebrew lexeme's range.",
        },
      ],
    },
  },
  {
    id: "isaiah-53",
    book: "ISA",
    bookName: "Isaiah",
    chapter: 53,
    startVerse: 3,
    endVerse: 11,
    title: "Isaiah 53:3–11 — The Suffering Servant",
    summary:
      "The Fourth Servant Song depicts a rejected servant suffering in relation to the transgressions and iniquities of others.",
    theologicalSignificance:
      "New Testament writers quote and allude to Isaiah's servant language in several contexts, and later Christians read the song christologically. The precise relationships among those texts and later atonement doctrines require argument rather than the label 'blueprint.'",
    textualDivergence: {
      verse: 11,
      hebrewOrGreekRef: "יראה ישבע / יראה אור וישבע (1QIsaa)",
      readingDifferences: [
        {
          witness: "Masoretic Hebrew (Open Scriptures Hebrew Bible)",
          reading: "יִרְאֶה יִשְׂבָּע (he shall see; he shall be satisfied)",
          explanation: "The written Masoretic text has no explicit word for 'light'; English translations must construe the syntax and context.",
        },
        {
          witness: "Great Isaiah Scroll (1QIsaa; normalized transcription)",
          reading: "יראה אור וישבע (he shall see light and be satisfied)",
          explanation: "1QIsaa includes 'light.' This supports a textual variant but does not by itself establish a resurrection interpretation; consult a diplomatic edition for the scroll's exact orthography and layout.",
        },
        {
          witness: "Septuagint Greek (Rahlfs 1935 / lxx-morph)",
          reading: "δεῖξαι αὐτῷ φῶς (to show him light)",
          explanation: "The Greek also contains light imagery but differs syntactically from 1QIsaa, so the two witnesses should not be presented as an identical reading.",
        },
      ],
    },
  },
  {
    id: "matthew-6",
    book: "MAT",
    bookName: "Matthew",
    chapter: 6,
    startVerse: 9,
    endVerse: 13,
    title: "Matthew 6:9–13 — The Lord's Prayer & the Liturgical Doxology",
    summary:
      "Matthew presents Jesus teaching the prayer commonly called the Lord's Prayer within the Sermon on the Mount.",
    theologicalSignificance:
      "The SBLGNT ends after 'the evil one,' while the Textus Receptus and the hosted KJV include the familiar kingdom-power-glory doxology. Didache 8 attests a related, shorter doxology in early Christian prayer practice without functioning as a manuscript of Matthew.",
    textualDivergence: {
      verse: 13,
      hebrewOrGreekRef: "ἀλλὰ ῥῦσαι ἡμᾶς ἀπὸ τοῦ πονηροῦ",
      readingDifferences: [
        {
          witness: "Greek critical text (SBLGNT)",
          reading: "ἀλλὰ ῥῦσαι ἡμᾶς ἀπὸ τοῦ πονηροῦ (but deliver us from evil/the evil one; the SBLGNT ends here)",
          explanation: "Codices including Sinaiticus (א), Vaticanus (B), and Bezae (D) omit the doxology. Papyrus P1 does not preserve Matthew 6 and therefore supplies no evidence for this variant; the hosted WEB includes the doxology and must not be grouped with the SBLGNT reading.",
        },
        {
          witness: "King James Version (1769 hosted text; reflecting the Textus Receptus form)",
          reading: "For thine is the kingdom, and the power, and the glory, for ever. Amen.",
          explanation: "Many later Byzantine manuscripts include the longer doxology, which also became prominent in Christian liturgical use.",
        },
        {
          witness: "Didache 8 (late first or early second century; date disputed)",
          reading: "Editorial summary: a shorter power-and-glory doxology follows the prayer, and the chapter directs readers to pray it three times daily.",
          explanation: "The Didache documents an early related liturgical form. It does not establish the wording or date of the longer doxology within Matthew's manuscript tradition.",
        },
      ],
    },
  },
  {
    id: "john-1",
    book: "JHN",
    bookName: "John",
    chapter: 1,
    startVerse: 1,
    endVerse: 5,
    title: "John 1:1–5 — The Cosmic Prologue: The Eternal Word",
    summary:
      "The Fourth Gospel opens with the Word in the beginning, with God, and described as God, before associating the Word with creation and life.",
    theologicalSignificance:
      "The prologue invites comparison with Genesis 1, Jewish Wisdom traditions, and Hellenistic Jewish Logos discourse such as Philo's. The degree of direct dependence on any particular philosophical source remains debated.",
    textualDivergence: {
      verse: 1,
      hebrewOrGreekRef: "Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν, καὶ θεὸς ἦν ὁ λόγος",
      readingDifferences: [
        {
          witness: "Greek (SBLGNT)",
          reading: "καὶ θεὸς ἦν ὁ λόγος (and the Word was God / and God was the Word)",
          explanation: "Theos is an anarthrous predicate preceding the verb. The construction can carry qualitative and definite force; the missing article alone neither makes the noun indefinite nor settles later doctrinal formulation.",
        },
        {
          witness: "Douay-Rheims English (Challoner revision; hosted 1899 edition)",
          reading: "In the beginning was the Word, and the Word was with God, and the Word was God.",
          explanation: "This is an English translation in the Vulgate tradition. Its use of 'Word' reflects Latin Verbum indirectly and should not be labeled as Latin text.",
        },
        {
          witness: "World English Bible (2020)",
          reading: "In the beginning was the Word, and the Word was with God, and the Word was God",
          explanation: "The contemporary English translation repeats 'the Word' across the verse and renders the final clause 'the Word was God.'",
        },
      ],
    },
  },
  {
    id: "romans-3",
    book: "ROM",
    bookName: "Romans",
    chapter: 3,
    startVerse: 21,
    endVerse: 26,
    title: "Romans 3:21–26 — Justification & Hilastērion",
    summary:
      "Paul discusses God's righteousness, sin, grace, redemption, faith, and the difficult term hilastērion in a densely argued passage.",
    theologicalSignificance:
      "In the Septuagint Pentateuch, hilastērion names the ark's atonement cover, while interpreters of Romans 3:25 also propose senses such as means or place of atonement and propitiatory sacrifice. The lexical link does not by itself choose among those readings.",
    textualDivergence: {
      verse: 25,
      hebrewOrGreekRef: "ὃν προέθετο ὁ θεὸς ἱλαστήριον διὰ [τῆς] πίστεως",
      readingDifferences: [
        {
          witness: "Greek (SBLGNT)",
          reading: "ὃν προέθετο ὁ θεὸς ἱλαστήριον (whom God presented as hilastērion)",
          explanation: "The Septuagint Pentateuch uses hilastērion for the atonement cover, but the term's function in Romans 3:25 remains debated.",
        },
        {
          witness: "Douay-Rheims English (Challoner revision; hosted 1899 edition)",
          reading: "Whom God hath proposed to be a propitiation, through faith in his blood",
          explanation: "The hosted English uses 'propitiation,' reflecting its Latin source tradition; a direct causal line from this rendering to a particular medieval atonement theory is not established by the wording alone.",
        },
        {
          witness: "World English Bible (2020)",
          reading: "whom God sent to be an atoning sacrifice through faith in his blood",
          explanation: "The WEB chooses 'atoning sacrifice,' presenting one interpretive rendering of hilastērion rather than explicitly preserving the possible place/image sense.",
        },
      ],
    },
  },
  {
    id: "psalm-110",
    book: "PSA",
    bookName: "Psalms",
    chapter: 110,
    startVerse: 1,
    endVerse: 4,
    title: "Psalm 110:1–4 — The Royal Priest After the Order of Melchizedek",
    summary:
      "A royal psalm that joins enthronement language with priesthood after the order of Melchizedek and was read messianically in the New Testament and later Christianity.",
    theologicalSignificance:
      "Psalm 110 is among the Old Testament passages most frequently quoted or alluded to in the New Testament. Counts vary according to whether verbal echoes and repeated quotations are included.",
    textualDivergence: {
      verse: 3,
      hebrewOrGreekRef: "מֵרֶחֶם מִשְׁחָר לְךָ טַל יַלְדֻתֶיךָ / ἐκ γαστρὸς πρὸ ἑωσφόρου ἐξεγέννησά σε",
      readingDifferences: [
        {
          witness: "Masoretic Hebrew (Open Scriptures Hebrew Bible)",
          reading: "merechem mishchar lekha tal yaldutekha (from the womb of dawn, to you is the dew of your youth/youths)",
          explanation: "The poetic syntax is difficult and is often understood as comparing the king's youthful troops or youthfulness to morning dew.",
        },
        {
          witness: "Septuagint Greek, Psalm 109:3 (Rahlfs 1935 / lxx-morph)",
          reading: "ἐκ γαστρὸς πρὸ ἑωσφόρου ἐξεγέννησά σε (from the womb before the morning star I begot you)",
          explanation: "The Greek differs substantially from the Masoretic Hebrew. Later pro-Nicene writers, including Athanasius, used this wording in arguments about the Son's generation; that is reception history rather than a neutral lexical gloss.",
        },
        {
          witness: "Douay-Rheims English, Psalm 109:3 (Challoner revision; hosted 1899 edition)",
          reading: "from the womb before the day star I begot thee",
          explanation: "The hosted English follows the Vulgate tradition and its Psalm numbering. It is not the underlying Latin text.",
        },
      ],
    },
  },
];

export type PolyglotAlignedVerse = {
  number: number;
  originalVerse: OriginalVerse | null;
  originalEdition?: OriginalEditionId;
  originalDirection?: "ltr" | "rtl";
  brentonText?: string;
  drbText?: string;
  kjvText?: string;
  webText?: string;
  divergence?: {
    hebrewOrGreekRef: string;
    differences: {
      witness: string;
      reading: string;
      explanation: string;
    }[];
  };
};

export function alignPolyglotVerses(args: {
  originalChapter: OriginalChapter | null;
  brentonVerses: string[] | null;
  drbVerses: string[] | null;
  kjvVerses: string[] | null;
  webVerses: string[] | null;
  startVerse?: number;
  endVerse?: number;
  presetDivergence?: HexaplaPreset["textualDivergence"] | null;
}): PolyglotAlignedVerse[] {
  const {
    originalChapter,
    brentonVerses,
    drbVerses,
    kjvVerses,
    webVerses,
    startVerse = 1,
    endVerse = 200,
    presetDivergence,
  } = args;

  const originalVerseMap = new Map<number, OriginalVerse>();
  if (originalChapter?.verses) {
    for (const v of originalChapter.verses) {
      originalVerseMap.set(v.number, v);
    }
  }

  const maxLen = Math.max(
    originalChapter?.verses?.length ? Math.max(...originalChapter.verses.map((v) => v.number)) : 0,
    brentonVerses?.length ?? 0,
    drbVerses?.length ?? 0,
    kjvVerses?.length ?? 0,
    webVerses?.length ?? 0,
  );

  const results: PolyglotAlignedVerse[] = [];

  for (let num = 1; num <= maxLen; num++) {
    if (num < startVerse || num > endVerse) continue;

    const originalVerse = originalVerseMap.get(num) ?? null;
    const brentonText = brentonVerses?.[num - 1] || undefined;
    const drbText = drbVerses?.[num - 1] || undefined;
    const kjvText = kjvVerses?.[num - 1] || undefined;
    const webText = webVerses?.[num - 1] || undefined;

    // Check if there is text in at least one witness
    if (!originalVerse && !brentonText && !drbText && !kjvText && !webText) {
      continue;
    }

    let divergence: PolyglotAlignedVerse["divergence"] = undefined;
    if (presetDivergence && presetDivergence.verse === num) {
      divergence = {
        hebrewOrGreekRef: presetDivergence.hebrewOrGreekRef,
        differences: presetDivergence.readingDifferences,
      };
    }

    results.push({
      number: num,
      originalVerse,
      originalEdition: originalChapter?.edition,
      originalDirection: originalChapter?.direction,
      brentonText,
      drbText,
      kjvText,
      webText,
      divergence,
    });
  }

  return results;
}

/**
 * Formats aligned polyglot verses into a self-contained Markdown research
 * worksheet for ingestion into Google NotebookLM.
 */
export function generateHexaplaDossier(args: {
  book: string;
  bookName: string;
  chapter: number;
  verses: PolyglotAlignedVerse[];
  preset?: HexaplaPreset;
}): string {
  const { book, bookName, chapter, verses, preset } = args;
  const lines: string[] = [];

  lines.push(`# Grounded Research Dossier: ${bookName} ${chapter} (Digital Polyglot)`);
  lines.push("");
  lines.push(`> Source-aware research worksheet prepared for Google NotebookLM.`);
  lines.push(`> Edition alignment: the original-language column uses OSHB, SBLGNT, or Rahlfs/lxx-morph as available. Brenton and Douay-Rheims are hosted English translations from Greek and Latin traditions, not the underlying Greek or Latin texts.`);
  if (book === "PSA") {
    lines.push(`> Psalm numbering warning: the Masoretic/modern English and Septuagint/Vulgate traditions can differ by one chapter and sometimes by verse. Verify each displayed Psalm reference before treating rows as aligned.`);
  }
  lines.push("");

  if (preset) {
    lines.push(`## Historical & Theological Context`);
    lines.push(preset.theologicalSignificance);
    lines.push("");
    lines.push(`### Curated Textual Comparison Notes`);
    lines.push(`**Key Verse**: ${bookName} ${chapter}:${preset.textualDivergence.verse}`);
    lines.push(`**Reference reading or readings**: \`${preset.textualDivergence.hebrewOrGreekRef}\``);
    lines.push("");
    for (const diff of preset.textualDivergence.readingDifferences) {
      lines.push(`- **${diff.witness}**: ${diff.reading} — ${diff.explanation}`);
    }
    lines.push("");
  }

  lines.push(`## Comparative Multi-Witness Text`);
  lines.push("");

  for (const v of verses) {
    lines.push(`### ${bookName} ${chapter}:${v.number}`);
    lines.push("");

    if (v.originalVerse) {
      const origText = v.originalVerse.words.map((w) => w.text).join(" ");
      lines.push(`- **Original-language surface text (${v.originalEdition?.toUpperCase() || "named edition"})**: \`${origText}\``);
    }
    if (v.brentonText) {
      lines.push(`- **Brenton Septuagint, English translation (1851)**: ${v.brentonText}`);
    }
    if (v.drbText) {
      lines.push(`- **Douay-Rheims (Challoner revision; hosted 1899 edition)**: ${v.drbText}`);
    }
    if (v.kjvText) {
      lines.push(`- **King James Version (1769 text)**: ${v.kjvText}`);
    }
    if (v.webText) {
      lines.push(`- **World English Bible (2020)**: ${v.webText}`);
    }

    if (v.divergence) {
      lines.push("");
      lines.push(`  > [!NOTE]`);
      lines.push(`  > **Curated comparison note**: \`${v.divergence.hebrewOrGreekRef}\``);
      for (const diff of v.divergence.differences) {
        lines.push(`  > - *${diff.witness}*: ${diff.reading} (${diff.explanation})`);
      }
    }
    lines.push("");
  }

  lines.push(`## Dialectical Inquiry Prompts for NotebookLM Synthesis`);
  lines.push(`1. Which differences here are textual variants, translation choices, interpretive glosses, or numbering effects? What evidence would be needed before assigning a theological or scribal motive?`);
  lines.push(`2. Compare how the hosted Douay-Rheims and King James English translations render specific phrases, while keeping their source traditions distinct.`);
  lines.push(`3. Where an original-language edition is present, which grammatical or lexical nuances are represented differently in the English translations, and which conclusions remain uncertain?`);
  lines.push("");
  lines.push(`---`);
  lines.push(`*Source note: Hosted text is reproduced from the named editions. Curated divergence and interpretation notes are editorial aids; verify them against a critical edition before reuse.*`);

  return lines.join("\n");
}
