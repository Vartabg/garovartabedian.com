/**
 * Angels & Demons Universal NotebookLM Research Dossier Engine.
 *
 * Compiles multi-source Markdown research worksheets with structured YAML
 * frontmatter, textual-critical notes, and thematic prompts for Google
 * NotebookLM source ingestion and Audio Overview exploration.
 *
 * Hosted Scripture is reproduced from identified editions under their recorded
 * licenses. Curated historical
 * notes identify the work and section they summarize so readers can verify
 * them before quoting or publishing the generated worksheet.
 */

import type { Canons } from "@/lib/scriptures/types";
import { parseScriptureQueryRef } from "@/lib/scriptures/refs";

export type AngelsDossierCategory =
  | "cosmic-order"
  | "demonology"
  | "christological-warfare"
  | "textual-criticism";

export type AngelsDossierPreset = {
  id: string;
  title: string;
  category: AngelsDossierCategory;
  query: string;
  description: string;
  summary: string;
  theologicalSignificance: string;
  textualDivergence?: {
    keyVerse: string;
    originalRef: string;
    readingDifferences: {
      witness: string;
      reading: string;
      explanation: string;
    }[];
  };
  ancientWitnesses: {
    source: string;
    date: string;
    period: string;
    excerpt: string;
    analysis: string;
  }[];
  dialecticalPrompts: string[];
  audioHostPrompt: string;
};

export type AngelsNotebookLMDossier = {
  title: string;
  targetType: "preset" | "passage" | "topic";
  markdown: string;
  audioHostPrompt: string;
  sourceEntryCount: number;
  wordCount: number;
  preset?: AngelsDossierPreset;
};

export const ANGELS_DOSSIER_PRESETS: AngelsDossierPreset[] = [
  {
    id: "divine-council-deut32",
    title: "The Divine Council & Cosmic Allotment (Deuteronomy 32:8–9, Psalm 82 & Job 1)",
    category: "textual-criticism",
    query: "Deuteronomy 32:8",
    description:
      "Witness divergence between 4QDeutj (4Q37), the Septuagint, and the Masoretic Text on the division of the nations, considered alongside Psalm 82's judgment scene in the divine assembly.",
    summary:
      "On a common divine-council reading, Deuteronomy 32:8–9 portrays the nations as allotted in relation to heavenly beings while Jacob remains YHWH's portion; interpreters debate how directly this should be joined to Psalm 82 and later territorial-power language.",
    theologicalSignificance:
      "Some Christian interpreters read the Great Commission as the reclamation of the nations; that synthesis is theological interpretation, not an explicit claim of Deuteronomy 32.",
    textualDivergence: {
      keyVerse: "Deuteronomy 32:8",
      originalRef: "DEU 32:8",
      readingDifferences: [
        {
          witness: "Dead Sea Scrolls 4QDeutj (4Q37; normalized transcription)",
          reading: "למספר בני אלהים (according to the number of the sons of God/gods)",
          explanation:
            "This is a normalized, unpointed representation of 4Q37's reading, not a diplomatic transcription; consult a diplomatic edition for the manuscript's spelling and layout. The Septuagint supports a related divine-being reading. Many textual critics prefer this reading, although 'original' is a text-critical judgment rather than a manuscript fact.",
        },
        {
          witness: "Septuagint Greek (Rahlfs 1935 / lxx-morph)",
          reading: "κατὰ ἀριθμὸν ἀγγέλων θεοῦ (according to the number of the angels of God)",
          explanation:
            "The Greek Jewish translation renders the phrase as 'angels of God,' supporting a divine-being reading alongside the Qumran witness.",
        },
        {
          witness: "Masoretic Text (Open Scriptures Hebrew Bible)",
          reading: "לְמִסְפַּר בְּנֵי יִשְׂרָאֵל (according to the number of the children of Israel)",
          explanation:
            "The Masoretic Text and Samaritan Pentateuch read 'sons of Israel.' Some scholars explain this as a theological or scribal development; the motive cannot be demonstrated.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "Justin Martyr, Second Apology §5",
        date: "c. AD 150",
        period: "Ante-Nicene Patristic",
        excerpt:
          "Editorial summary: Justin says that God entrusted care of humanity and earthly affairs to angels, some of whom transgressed their appointment, coupled with women, and produced offspring associated with demons.",
        analysis:
          "Justin combines angelic oversight with an angelic-fall account. Relating this passage specifically to Deuteronomy 32's allotment of the nations is an interpretive comparison, because Justin does not cite Deuteronomy 32 here.",
      },
      {
        source: "Clement of Alexandria, Stromata VII.2",
        date: "c. AD 200",
        period: "Ante-Nicene Patristic",
        excerpt:
          "Clement says that angels are distributed among the nations and contrasts this with the Lord's portion.",
        analysis:
          "Clement uses the Septuagint form of Deuteronomy 32:8–9 in discussing angels associated with nations; the passage documents his interpretation rather than establishing a single interpretation for all readers.",
      },
    ],
    dialecticalPrompts: [
      "What comparisons have interpreters proposed between the 4Q37 reading 'sons of God/gods' and Paul's rulers-and-powers vocabulary, and what evidence supports or limits a historical or conceptual link?",
      "What textual or theological developments might explain the MT reading, and what evidence limits any claim about motive?",
      "In Psalm 82, does Yahweh judge human judges or celestial beings? What does the Hebrew phrase 'adat El' ('council of God') signify in ancient Semitic literature?",
    ],
    audioHostPrompt:
      "Historical-critical discussion of Deuteronomy 32:8. Compare 4Q37, the Septuagint, and the Masoretic reading, distinguish manuscript evidence from judgments about priority or scribal motive, and present the Great Commission reclamation theme as a later theological synthesis.",
  },
  {
    id: "watchers-nephilim-enoch",
    title: "The Fall of the Watchers & The Origin of Demons (Genesis 6, 1 Enoch 6–16 & Jubilees 10)",
    category: "demonology",
    query: "Genesis 6:1-4",
    description:
      "Collates the Watcher tradition across Genesis 6, 1 Enoch, and Jubilees, a prominent Second Temple interpretation adopted by several early Christian writers.",
    summary:
      "The Book of the Watchers traces evil spirits to the dead giant offspring of fallen Watchers. Several early Christian writers adopted related readings of Genesis 6, while others did not.",
    theologicalSignificance:
      "Jude 14–15 quotes 1 Enoch 1:9 directly. Jude 6 and 2 Peter 2:4 share Watcher-judgment traditions, but 2 Peter does not directly quote 1 Enoch.",
    textualDivergence: {
      keyVerse: "Genesis 6:2",
      originalRef: "GEN 6:2",
      readingDifferences: [
        {
          witness: "1 Enoch 6:2, 6 (R. H. Charles, 1913; selected excerpt, editorial brackets omitted)",
          reading: "And the angels, the children of the heaven, saw and lusted after them... And they were in all two hundred; who descended in the days of Jared on the summit of Mount Hermon.",
          explanation:
            "Begins the Book of the Watchers' expanded account of the angelic descent. Jude 14–15 quotes 1 Enoch 1:9, not this passage; similarities between Jude 6 and the Watcher story are broader literary and traditional relationships.",
        },
        {
          witness: "Jubilees 10:8–9 (R. H. Charles, 1913; selected excerpt)",
          reading: "And the chief of the spirits, Mastêmâ, came and said: 'Lord, Creator, let some of them remain before me... let the tenth part of them remain before him, and let nine parts descend into the place of condemnation.'",
          explanation:
            "Describes Mastema's request and the decision to leave one tenth of the spirits under his authority while nine tenths are condemned. This excerpt does not itself state the spirits' exact origin; relating them to 1 Enoch 15's dead-giant spirits requires comparison with the wider traditions.",
        },
        {
          witness: "Sethite Interpretation (Julius Africanus; later Augustine)",
          reading: "'Sons of God' = righteous descendants of Seth; 'Daughters of men' = wicked line of Cain.",
          explanation:
            "The Sethite interpretation is already attested in Julius Africanus in the early third century and became more influential in later Christianity, especially through Augustine.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "1 Enoch 15:8, 11–12 (R. H. Charles, 1913; selected excerpt, editorial brackets omitted)",
        date: "c. 200 BC",
        period: "Second Temple Pseudepigrapha",
        excerpt:
          "And now, the giants, who are produced from the spirits and flesh, shall be called evil spirits upon the earth, and on the earth shall be their dwelling... And the spirits of the giants afflict, oppress, destroy, attack, do battle, and work destruction on the earth, and cause trouble: they take no food, but nevertheless hunger and thirst, and cause offences. And these spirits shall rise up against the children of men and against the women, because they have proceeded from them.",
        analysis:
          "Within the Book of the Watchers, this passage identifies the dead giants' surviving spirits as evil spirits active on earth. Its relationship to every later use of 'unclean spirits' must be argued rather than assumed.",
      },
      {
        source: "Tertullian, Apology §22",
        date: "c. AD 197",
        period: "Ante-Nicene Patristic",
        excerpt:
          "Editorial summary: Tertullian says that certain angels fell voluntarily and produced a corrupt demonic brood condemned together with them.",
        analysis:
          "Tertullian is one early Latin witness to an angelic-fall account.",
      },
    ],
    dialecticalPrompts: [
      "Why did Justin, Irenaeus, and Tertullian use Watcher traditions, while an early writer such as Julius Africanus also transmitted a Sethite reading?",
      "How do Jude 6 and 2 Peter 2:4 share imprisonment imagery with Watcher traditions, and what differences remain? Note that the Greek verb tartarōsas occurs in 2 Peter, not Jude.",
      "How does Jubilees 10 portray hostile spirits, Noah's remedies, and Mastema, and which details come from this chapter rather than from 1 Enoch?",
    ],
    audioHostPrompt:
      "Historical-theological discussion of Genesis 6, 1 Enoch, and Jubilees. Compare the Watcher and Sethite interpretations, identify which writers adopted each, and distinguish Jude's direct quotation of 1 Enoch 1:9 from broader shared judgment traditions.",
  },
  {
    id: "adversary-evolution",
    title: "The Evolution of the Adversary: From Court Accuser to Cosmic Dragon",
    category: "cosmic-order",
    query: "Job 1:6-12",
    description:
      "Traces uses of satan language from the accuser or adversary (ha-satan) in the heavenly court scenes of Job and Zechariah, through the article-less form in Chronicles, to Revelation 12's identification of the dragon with the devil and Satan.",
    summary:
      "In Job and Zechariah, Hebrew ha-satan carries the article and functions as an accuser or adversary within the heavenly court, operating within divine permission. In 1 Chronicles 21:1 the noun appears without the article and may function as a proper name. Revelation 12 explicitly identifies the dragon with 'the ancient serpent,' the devil, and Satan.",
    theologicalSignificance:
      "The comparison shows changing ways biblical texts describe agency for evil; it should not be reduced to a simple move from monism to dualism.",
    textualDivergence: {
      keyVerse: "1 Chronicles 21:1 vs 2 Samuel 24:1",
      originalRef: "1CH 21:1",
      readingDifferences: [
        {
          witness: "World English Bible, 2 Samuel 24:1",
          reading: "Again Yahweh’s anger burned against Israel, and he moved David against them, saying, “Go, count Israel and Judah.”",
          explanation:
            "In Samuel's account, the incitement is narrated in connection with YHWH's anger; conclusions about the relative dates and motives of the two accounts require a separate historical argument.",
        },
        {
          witness: "World English Bible, 1 Chronicles 21:1",
          reading: "Satan stood up against Israel, and moved David to take a census of Israel.",
          explanation:
            "Chronicles assigns the incitement to satan/adversary where Samuel attributes it to YHWH's anger; scholars debate whether this reflects lexical, narrative, or theological development.",
        },
        {
          witness: "Septuagint Greek, Zechariah 3:1 (Rahlfs 1935 / lxx-morph)",
          reading: "καὶ ὁ διάβολος εἱστήκει ἐκ δεξιῶν αὐτοῦ τοῦ ἀντικεῖσθαι αὐτῷ (and the devil stood at his right hand to resist him)",
          explanation:
            "The Septuagint uses diabolos here to render Hebrew satan, an important part of the Greek vocabulary's later reception.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "Wisdom of Solomon 2:24",
        date: "c. first century BC–first century AD (disputed)",
        period: "Second Temple Deuterocanon",
        excerpt:
          "Editorial summary: Wisdom 2:24 says that death entered the world through the devil's envy and associates those belonging to him with its experience.",
        analysis:
          "Wisdom 2:24 links death with the devil's envy. Whether it specifically identifies the Genesis serpent is debated.",
      },
      {
        source: "Irenaeus, Against Heresies V.21.2",
        date: "c. AD 180",
        period: "Ante-Nicene Patristic",
        excerpt:
          "Editorial summary: Irenaeus describes the devil as an apostate angel who deceives human beings and leads them toward transgression.",
        analysis:
          "This section supports Irenaeus's description of Satan as an apostate angel. His broader Adam–Christ and temptation arguments require evidence from their respective passages rather than being attributed wholly to this excerpt.",
      },
    ],
    dialecticalPrompts: [
      "How does the grammatical presence of the definite article ('ha-satan') in Job 1 and Zechariah 3 differ from its absence in 1 Chronicles 21:1?",
      "Why does Chronicles attribute David's census to satan/adversary while Samuel attributes the incitement to God's anger? How have scholars interpreted the narrative difference, and what limits those reconstructions?",
      "In Revelation 12:7-9, when is Satan cast out of heaven: at the primordial beginning, during the cross and resurrection, or at the end of days?",
    ],
    audioHostPrompt:
      "Scholarly podcast discussion tracing the linguistic and historical development of Satan. Host 1 analyzes the Hebrew philology of ha-satan in Job 1–2 and Zechariah 3 as an accuser in the divine courtroom. Host 2 compares 1 Chronicles 21 with later Jewish and Christian portrayals represented in the Gospels and Revelation 12. Discuss the evidence and limits involved when readers interpret earlier texts through Revelation's later identifications.",
  },
  {
    id: "celestial-hierarchy",
    title: "The Celestial Hierarchy: Scriptural Restraint vs Dionysian Order",
    category: "cosmic-order",
    query: "Colossians 1:16",
    description:
      "Examines biblical depictions of Seraphim, Cherubim, Thrones, Dominions, and Archangels alongside Pseudo-Dionysius's influential late-antique nine-choir hierarchy.",
    summary:
      "Scripture names several classes and offices of celestial beings but does not construct a fixed chain of command. Michael is the only named figure explicitly called an archangel in the canonical New Testament (Jude 9); 1 Thessalonians 4:16 mentions an archangel's voice without naming the speaker. An anonymous late-fifth- or early-sixth-century Christian author conventionally called Pseudo-Dionysius systematized biblical titles into three triads of nine orders in dialogue with late-antique Neoplatonic categories; the scheme became highly influential in medieval theology.",
    theologicalSignificance:
      "The comparison distinguishes the varied celestial beings and powers named in biblical texts from Pseudo-Dionysius's later systematization; readers differ on the theological authority they assign to that reception history.",
    textualDivergence: {
      keyVerse: "Colossians 1:16",
      originalRef: "COL 1:16",
      readingDifferences: [
        {
          witness: "Greek Critical Text (SBLGNT)",
          reading: "εἴτε θρόνοι εἴτε κυριότητες εἴτε ἀρχαὶ εἴτε ἐξουσίαι (whether thrones or lordships or rulers or authorities)",
          explanation:
            "The verse places thrones, lordships, rulers, and authorities within the scope of creation through and for Christ. Whether the list classifies distinct celestial orders or supplies a rhetorical sweep remains debated.",
        },
        {
          witness: "Pseudo-Dionysius, Celestial Hierarchy §6",
          reading: "Summary: Triad 1: Seraphim, Cherubim, Thrones; Triad 2: Dominions, Virtues, Powers; Triad 3: Principalities, Archangels, Angels.",
          explanation:
            "Organizes biblical titles into three ordered triads through which Pseudo-Dionysius describes divine illumination and mediation.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "Ignatius of Antioch, Letter to the Trallians §5",
        date: "c. AD 110",
        period: "Apostolic Fathers",
        excerpt:
          "Ignatius says he can speak of heavenly things and angelic arrangements, but warns against overconfidence.",
        analysis:
          "Ignatius refers to angelic arrangements while warning that such knowledge does not by itself make a person a mature disciple.",
      },
      {
        source: "Gregory the Great, Homilies on the Gospels 34",
        date: "c. AD 590",
        period: "Latin Patristic",
        excerpt:
          "Editorial summary: Gregory enumerates nine angelic orders—Angels, Archangels, Virtues, Powers, Principalities, Dominions, Thrones, Cherubim, and Seraphim—and argues for the list from biblical names.",
        analysis:
          "Gregory is an influential Latin witness to the nine-order scheme and supports it by assembling terms from several biblical texts.",
      },
    ],
    dialecticalPrompts: [
      "Did Paul intend 'thrones, dominions, principalities, and powers' as a classification of angelic species or as a rhetorical sweep of all political and cosmic authority?",
      "What textual and philosophical parallels support claims that Proclus influenced Pseudo-Dionysius's tripartite angelic hierarchy, and where does direct dependence remain uncertain?",
      "The canonical New Testament explicitly names only Michael as an archangel (Jude 9); how do Tobit 12:15 and 1 Enoch 20 attest related seven-angel traditions, and how do different canons and later interpreters receive them?",
    ],
    audioHostPrompt:
      "Scholarly conversation comparing biblical depictions with the historical development of the nine choirs of angels. Host 1 examines Cherubim in Ezekiel, Seraphim in Isaiah 6, and Paul's vocabulary in Colossians 1:16. Host 2 investigates Pseudo-Dionysius and the role of late antique Neoplatonic categories in his ordered hierarchy, then traces its medieval reception. Distinguish textual description, historical reconstruction, and theological judgment.",
  },
  {
    id: "synoptic-exorcisms",
    title: "The Synoptic Exorcisms & The Inbreaking Kingdom (Mark 5, Matthew 12 & Luke 11)",
    category: "christological-warfare",
    query: "Mark 5:1-20",
    description:
      "Examines Synoptic exorcism narratives: Legion in the Gerasene or Gadarene region, the Beelzebul controversy, and casting out demons 'by the finger of God.'",
    summary:
      "The Synoptics give exorcism a prominent role in Jesus's public ministry. Mark says the spirits begged not to be sent out of the region; Luke's parallel says they begged not to be sent into the abyss. Matthew attributes Jesus's exorcisms to the Spirit of God, while Luke uses 'the finger of God.'",
    theologicalSignificance:
      "The Synoptics present exorcism as a sign of God's kingdom overcoming hostile powers.",
    textualDivergence: {
      keyVerse: "Matthew 12:28 vs Luke 11:20",
      originalRef: "MAT 12:28",
      readingDifferences: [
        {
          witness: "Matthew 12:28 (SBLGNT)",
          reading: "εἰ δὲ ἐν πνεύματι θεοῦ ἐγὼ ἐκβάλλω τὰ δαιμόνια (But if I cast out demons by the Spirit of God)",
          explanation:
            "Matthew attributes Jesus's exorcisms to the Spirit of God; further claims about messianic or prophetic typology are interpretations of that wording.",
        },
        {
          witness: "Luke 11:20 (SBLGNT)",
          reading: "εἰ δὲ ἐν δακτύλῳ θεοῦ [ἐγὼ] ἐκβάλλω τὰ δαιμόνια (But if I cast out demons by the finger of God)",
          explanation:
            "Luke's 'finger of God' wording can evoke the same phrase in Exodus 8:19. Reading the echo as a deliberate new-Moses portrayal is plausible but interpretive.",
        },
        {
          witness: "Mark 5:9 (SBLGNT; Gerasene demoniac)",
          reading: "Λεγιὼν ὄνομά μοι, ὅτι πολλοί ἐσμεν (My name is Legion, for we are many)",
          explanation:
            "The name evokes the scale and force of a Roman legion. Proposed links among Roman occupation, Legio X Fretensis, its boar imagery, and the swine episode remain debated.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "Athanasius, Life of Antony §23",
        date: "c. AD 357–360",
        period: "Nicene Patristic",
        excerpt:
          "Athanasius describes demons using fear and deception against ascetics and urges confidence rather than panic.",
        analysis:
          "This fourth-century ascetic account shows how Athanasius applies Christian demonology to Antony's trials. Any connection to a particular Gospel wilderness scene should be demonstrated from Athanasius's argument rather than assumed.",
      },
    ],
    dialecticalPrompts: [
      "How does Mark's prohibition on demonic speech function in the narrative, and how do proposed explanations relate to the spirits' recognition of Jesus?",
      "What historical and political readings have been proposed for the name 'Legion' in the Decapolis, what does the text say about the spirits' request to enter the pigs, and where does the evidence remain uncertain?",
      "What verbal evidence connects Luke's phrase 'by the finger of God' with Exodus 8:19, and how far should the typological comparison be pressed?",
    ],
    audioHostPrompt:
      "Theological and historical exploration of Jesus's exorcisms. Host 1 examines the first-century settings of Galilee and the Decapolis, including Roman military connotations of 'Legion' and the limits of proposed occupation symbolism. Host 2 analyzes the interpretation of exorcism as eschatological kingdom conflict through the strong-man saying. Compare the Synoptic commands with documented Greco-Roman magical and Jewish incantation practices without flattening their differences.",
  },
  {
    id: "territorial-princes",
    title: "Territorial Spirits & Angelic Conflict (Daniel 10–12 & Ephesians 6)",
    category: "cosmic-order",
    query: "Daniel 10:13",
    description:
      "Investigates the Prince of Persia, the Prince of Greece, Michael the chief prince, and Paul's rulers-and-powers language in Ephesians 6.",
    summary:
      "Daniel 10 portrays national 'princes' in conflict; many interpreters understand them as heavenly beings associated with empires.",
    theologicalSignificance:
      "This passage became an important source for later accounts of heavenly conflict behind empires.",
    textualDivergence: {
      keyVerse: "Daniel 10:13",
      originalRef: "DAN 10:13",
      readingDifferences: [
        {
          witness: "Hebrew Masoretic Text (MT)",
          reading: "וְשַׂר מַלְכוּת פָּרַס עֹמֵד לְנֶגְדִּי עֶשְׂרִים וְאֶחָד יוֹם (And the prince of the kingdom of Persia stood against me twenty-one days)",
          explanation:
            "The Hebrew sar designates a prince or commander and is often understood here as a nonhuman prince associated with Persia who opposes the speaker.",
        },
        {
          witness: "Theodotion Greek Daniel",
          reading: "καὶ ὁ ἄρχων βασιλείας Περσῶν εἱστήκει ἐξ ἐναντίας μου (and the archon of the kingdom of the Persians stood against me)",
          explanation:
            "Theodotion uses archōn ('ruler'), vocabulary comparable to Greek discourse about powers. Because Theodotion's version postdates Paul, it cannot historically anticipate Paul.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "Origen, On First Principles III.3.2",
        date: "c. AD 230",
        period: "Ante-Nicene Patristic",
        excerpt:
          "Origen reads Daniel's princes of Persia and Greece as nonhuman powers set over nations.",
        analysis:
          "Origen brings Daniel's national princes into a wider interpretation of powers associated with nations. This documents one influential reception rather than establishing a uniform patristic doctrine.",
      },
    ],
    dialecticalPrompts: [
      "How does Daniel 10 portray the messenger's delay and opposition, and what interpretations of heavenly conflict have readers drawn from that portrayal?",
      "Why is Michael called 'your prince' for Israel in Daniel 10:21 and 12:1? What role does he play as guardian of the covenant people?",
      "How have interpreters compared Daniel's national princes with Paul's rulers-and-powers language and Colossians 2:15, and what textual evidence supports or limits that synthesis?",
    ],
    audioHostPrompt:
      "Dialectical podcast discussing territorial spirits and angelic conflict in Daniel 10 and Ephesians 6. Host 1 evaluates the ancient Persian and Hellenistic historical backdrop, examining how Daniel portrays the spirit-princes of Persia and Greece. Host 2 analyzes Paul's theology of principalities and powers, discussing how early Christians navigated living under pagan imperial rule while believing Christ was already enthroned above every power. Ground the discussion in biblical and historical texts.",
  },
  {
    id: "azazel-scapegoat",
    title: "Azazel, The Yom Kippur Scapegoat & The Desert Pit (Leviticus 16 & 1 Enoch 10)",
    category: "demonology",
    query: "Leviticus 16:8-10",
    description:
      "Explores the enigmatic ritual of the scapegoat for Azazel on the Day of Atonement and its vivid expansion in 1 Enoch 10.",
    summary:
      "1 Enoch later associates Azazel with a desert place of punishment. This creates a suggestive reception-history parallel with Leviticus 16, but Leviticus itself does not narrate the Enochic Watcher story.",
    theologicalSignificance:
      "One influential interpretation sees the goat as carrying impurity outside the holy community; interpretations of Azazel as removal, place, goat, or personal being remain disputed.",
    textualDivergence: {
      keyVerse: "Leviticus 16:8",
      originalRef: "LEV 16:8",
      readingDifferences: [
        {
          witness: "Hebrew Masoretic Text (MT)",
          reading: "גּוֹרָל אֶחָד לַיהוָה וְגוֹרָל אֶחָד לַעֲזָאזֵל (one lot for Yahweh and one lot for Azazel)",
          explanation:
            "The parallel 'for YHWH / for Azazel' construction is one reason some scholars take Azazel as a destination or personal being, but it does not settle the lexical debate.",
        },
        {
          witness: "Septuagint Greek (Rahlfs 1935 / lxx-morph)",
          reading: "κλῆρον ἕνα τῷ κυρίῳ καὶ κλῆρον ἕνα τῷ ἀποπομπαίῳ (one lot for the Lord, and one for the scapegoat/sent-away one)",
          explanation:
            "Renders Azazel with apopompaios ('sent-away one'). Tyndale later introduced the English term 'scapegoat' in his 1530 Pentateuch; the histories of the Greek rendering and the English coinage should be kept distinct.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "1 Enoch 10:4–5 (R. H. Charles, 1913; selected excerpt)",
        date: "c. 200 BC",
        period: "Second Temple Pseudepigrapha",
        excerpt:
          "Bind Azâzêl hand and foot, and cast him into the darkness: and make an opening in the desert, which is in Dûdâêl, and cast him therein. And place upon him rough and jagged rocks, and cover him with darkness, and let him abide there for ever, and cover his face that he may not see light.",
        analysis:
          "1 Enoch locates Azazel's punishment in Dudael. Comparisons with later rabbinic scapegoat geography are interpretive and should not be called an exact identification.",
      },
    ],
    dialecticalPrompts: [
      "Does the Hebrew text of Leviticus 16:8 treat 'Azazel' as a personal being, a place or destination, a goat, or an expression of removal, and what evidence limits each view?",
      "How does 1 Enoch 8 portray Azazel's teaching about weapons, metallurgy, and adornment, and how is responsibility distributed among the Watchers elsewhere in the work?",
      "Which named early Christian sources, if any, interpret the two Yom Kippur goats christologically, and how do their readings differ? Do not infer a consensus without primary-text support.",
    ],
    audioHostPrompt:
      "Scholarly discussion on Leviticus 16 and the enigma of Azazel. Host 1 evaluates the linguistic debate: is Azazel a place name, an expression of removal, or a personal being? Host 2 examines the Second Temple Enochic tradition in which Raphael is commanded to imprison Azazel in Dudael and then assesses named later Christian atonement readings as reception history. Ground each conclusion in the hosted witnesses or an identified primary source.",
  },
  {
    id: "angel-of-the-lord",
    title: "The Angel of the LORD (Malakh Yahweh): The Unseen Presence",
    category: "textual-criticism",
    query: "Genesis 16:7-13",
    description:
      "Investigates a messenger who sometimes speaks with divine authority, bears the divine Name in Exodus 23, and was interpreted christologically by several early Christian writers.",
    summary:
      "These narratives shift between messenger language and divine speech. Christian interpreters have often read this as a Christophany; other Jewish and Christian readings distinguish agency, representation, and identity differently.",
    theologicalSignificance:
      "Justin and Novatian are included here as influential Ante-Nicene witnesses to christological readings; other ancient Jewish and Christian interpretations distinguish agency and identity differently.",
    textualDivergence: {
      keyVerse: "Exodus 23:20-21",
      originalRef: "EXO 23:20-21",
      readingDifferences: [
        {
          witness: "Hebrew Masoretic Text (MT)",
          reading: "הִנֵּה אָנֹכִי שֹׁלֵחַ מַלְאָךְ לְפָנֶיךָ... כִּי שְׁמִי בְּקִרְבּוֹ (Behold, I send an angel before you... for my Name is in him)",
          explanation:
            "'My Name is in him' conveys delegated divine authority or presence; whether it establishes identity with the pre-incarnate Logos is an interpretive question.",
        },
        {
          witness: "Septuagint Greek (Rahlfs 1935 / lxx-morph)",
          reading: "καὶ ἰδοὺ ἐγὼ ἀποστέλλω τὸν ἄγγελόν μου πρὸ προσώπου σου... τὸ γὰρ ὄνομά μού ἐστιν ἐπ’ αὐτῷ (Behold, I am sending my angel before you... for my name is upon him)",
          explanation:
            "The Greek likewise associates the messenger with God's name. Claims about the messenger's precise identity go beyond the wording and belong to its interpretation and reception.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "Justin Martyr, Dialogue with Trypho §56",
        date: "c. AD 160",
        period: "Ante-Nicene Patristic",
        excerpt:
          "Editorial summary: Justin argues that the figure called God, Lord, and Angel in biblical appearances is distinct from and subordinate to the Maker, and is called Angel because he announces the Maker's will.",
        analysis:
          "Justin uses appearances of the Angel of the LORD in Genesis and Exodus as evidence in his christological argument.",
      },
      {
        source: "Novatian, On the Trinity §18",
        date: "c. AD 250",
        period: "Ante-Nicene Patristic",
        excerpt:
          "Novatian argues that the figure called both Angel and God should be understood as Christ.",
        analysis:
          "Novatian is an influential Ante-Nicene witness to a christological reading of these passages.",
      },
    ],
    dialecticalPrompts: [
      "How do the cited messenger narratives move between third-person reference to God and first-person divine speech, and what explanations have Jewish and Christian interpreters offered?",
      "How do later Metatron traditions in 3 Enoch and Babylonian Talmud Sanhedrin 38b compare with Exodus 23's messenger, and what chronological and conceptual differences argue against assuming they are identical?",
      "Which specific Ante-Nicene writers use Old Testament messenger or theophany texts to argue for Christ's pre-existence, how do their arguments differ, and what alternative ancient readings should be considered?",
    ],
    audioHostPrompt:
      "Scholarly podcast on the Angel of the LORD (malakh YHWH). Host 1 investigates Genesis 16, Exodus 3, and Exodus 23, describing how messenger language, divine speech, the divine Name, and delegated authority interact in each context. Host 2 explores how second-century apologists such as Justin used these appearances in christological argument before Nicaea, while distinguishing their reception from what each biblical passage explicitly states.",
  },
];

export function findAngelsDossierPreset(
  target: string,
): AngelsDossierPreset | undefined {
  const normalized = target.trim().toLowerCase();
  if (!normalized) return undefined;
  const exact = ANGELS_DOSSIER_PRESETS.find(
    (preset) =>
      preset.id.toLowerCase() === normalized ||
      preset.title.toLowerCase().includes(normalized),
  );
  if (exact) return exact;

  const aliases: Array<[RegExp, string]> = [
    [/watchers?|nephilim|semjaza|mastema|1 enoch/, "watchers-nephilim-enoch"],
    [/azazel|scapegoat|yom kippur/, "azazel-scapegoat"],
    [/territorial|persia|greece|daniel 10/, "territorial-princes"],
    [/exorcis|legion|beelzebul|strong man/, "synoptic-exorcisms"],
    [/angel of (?:the )?lord|malakh|christophany/, "angel-of-the-lord"],
    [/divine council|cosmic allotment|deuteronomy 32|psalm 82/, "divine-council-deut32"],
    [/hierarchy|seraphim|cherubim|angelic order/, "celestial-hierarchy"],
    [/satan|adversary|accuser|demon/, "adversary-evolution"],
  ];
  const matchedId = aliases.find(([pattern]) => pattern.test(normalized))?.[1];
  return ANGELS_DOSSIER_PRESETS.find((preset) => preset.id === matchedId);
}

export function buildAngelsNotebookLMDossier(args: {
  target: string;
  canons?: Canons;
  primaryVerses?: {
    ref: string;
    original?: string;
    brenton?: string;
    drb?: string;
    kjv?: string;
    web?: string;
    charles?: string;
  }[];
  theologicalContext?: string;
}): AngelsNotebookLMDossier {
  const { target, canons, primaryVerses = [], theologicalContext } = args;
  const hasText = (value: string | undefined): value is string =>
    Boolean(value?.trim());
  const resolvedVerses = primaryVerses.filter((verse) =>
    [
      verse.original,
      verse.brenton,
      verse.drb,
      verse.kjv,
      verse.web,
      verse.charles,
    ].some(hasText),
  );
  const lines: string[] = [];

  const cleanTarget = target.trim();
  const parsedRef = canons ? parseScriptureQueryRef(cleanTarget, canons) : null;
  const exactPreset = ANGELS_DOSSIER_PRESETS.find(
    (preset) => preset.id.toLowerCase() === cleanTarget.toLowerCase(),
  );
  const presetMatch = exactPreset ?? (!parsedRef
    ? findAngelsDossierPreset(cleanTarget)
    : undefined);

  const title = presetMatch
    ? presetMatch.title
    : parsedRef
      ? `${canons?.books[parsedRef.book]?.name || parsedRef.book} ${parsedRef.chapter}${
          parsedRef.verse ? `:${parsedRef.verse}` : ""
        } (Angels & Demons Synthesis)`
      : `Angels & Demons Dossier: ${cleanTarget}`;

  const targetType: "preset" | "passage" | "topic" = presetMatch
    ? "preset"
    : parsedRef
      ? "passage"
      : "topic";

  // YAML Frontmatter for clean LLM source indexing
  lines.push(`---`);
  lines.push(`title: "${title.replace(/"/g, '\\"')}"`);
  lines.push(`corpus: "Garo Vartabedian Classical Scholarship Platform"`);
  lines.push(`world: "Angels & Demons"`);
  lines.push(`category: "${presetMatch ? presetMatch.category : "angelology-demonology"}"`);
  lines.push(`target_type: "${targetType}"`);
  lines.push(`grounding: "hosted Scripture from identified editions plus curated historical source notes"`);
  lines.push(`export_target: "Google NotebookLM / Audio Deep Dive"`);
  lines.push(`---`);
  lines.push("");

  lines.push(`# Grounded Research Dossier: ${title}`);
  lines.push("");
  lines.push(`> **Corpus Provenance**: Garo Vartabedian Classical Scholarship Platform · Angels & Demons World.`);
  lines.push(`> **Source Standard**: Hosted Scripture lines are reproduced from identified editions under their recorded licenses. Historical source notes may summarize the named work and should be checked before quotation or publication.`);
  lines.push(`> **Designed for**: Google NotebookLM source ingestion and dialectical Audio Overview generation.`);
  lines.push("");

  // 1. Executive Research Summary
  lines.push(`## 1. Executive Research Summary`);
  if (presetMatch) {
    lines.push(presetMatch.summary);
    lines.push("");
    lines.push(`### Theological & Historical Significance`);
    lines.push(presetMatch.theologicalSignificance);
  } else if (theologicalContext) {
    lines.push(theologicalContext);
  } else if (parsedRef && resolvedVerses.length > 0) {
    lines.push(
      `This worksheet collates the hosted source editions that resolved for **${title}**. Only the editions shown in the text section below were loaded; use the named reader editions and source notes to verify the comparison.`,
    );
  } else if (parsedRef) {
    lines.push(
      `The reference **${title}** parsed, but no hosted verse was loaded. Check the book, chapter, and verse before using this worksheet as evidence.`,
    );
  } else {
    lines.push(
      `This worksheet organizes research questions about **${title}**. No source passage was resolved from this free-form topic, so add and verify primary material before treating the worksheet as evidence.`,
    );
  }
  lines.push("");

  // 2. Textual comparison notes
  if (presetMatch && presetMatch.textualDivergence) {
    const td = presetMatch.textualDivergence;
    lines.push(`## 2. Textual Comparison Notes`);
    lines.push(`**Key passage or record**: ${td.keyVerse} (\`${td.originalRef}\`)`);
    lines.push("");
    for (const diff of td.readingDifferences) {
      lines.push(`### Witness: ${diff.witness}`);
      lines.push(`- **Reading or source note**: ${diff.reading}`);
      lines.push(`- **Critical Explanation**: ${diff.explanation}`);
      lines.push("");
    }
  }

  // 3. Multi-Witness Scriptural & Ancient Text Collation
  if (resolvedVerses.length > 0) {
    lines.push(`## 3. Multi-Witness Ancient Texts`);
    lines.push("");
    for (const pv of resolvedVerses) {
      lines.push(`### ${pv.ref}`);
      if (hasText(pv.original)) lines.push(`- **Original-language surface text (OSHB Hebrew/Aramaic or SBLGNT Greek)**: \`${pv.original}\``);
      if (hasText(pv.brenton)) lines.push(`- **Brenton Septuagint, English translation (1851)**: ${pv.brenton}`);
      if (hasText(pv.drb)) lines.push(`- **Douay-Rheims (Challoner revision; hosted 1899 edition)**: ${pv.drb}`);
      if (hasText(pv.kjv)) lines.push(`- **King James Version (1769 text)**: ${pv.kjv}`);
      if (hasText(pv.web)) lines.push(`- **World English Bible (2020)**: ${pv.web}`);
      if (hasText(pv.charles)) {
        const edition = pv.ref.startsWith("Jubilees ")
          ? "R. H. Charles, The Book of Jubilees (1913 hosted wording)"
          : "R. H. Charles translation of 1 Enoch (1913 hosted wording)";
        lines.push(`- **${edition}**: ${pv.charles}`);
      }
      lines.push("");
    }
  }

  // 4. Second Temple & Ante-Nicene reception notes
  if (presetMatch && presetMatch.ancientWitnesses.length > 0) {
    lines.push(`## 4. Second Temple & Patristic Reception Notes`);
    lines.push(
      `Curated excerpts and editorial summaries keyed to named ancient Jewish and Ante-Nicene works. Consult the cited work before quoting this wording:`,
    );
    lines.push("");
    for (const w of presetMatch.ancientWitnesses) {
      lines.push(`### ${w.source} (${w.date}) — [${w.period}]`);
      lines.push(`- **Excerpt or editorial summary**: ${w.excerpt}`);
      lines.push("");
      lines.push(`*Scholarly Analysis*: ${w.analysis}`);
      lines.push("");
    }
  }

  // 5. Dialectical Inquiry Prompts for NotebookLM Audio Overviews
  lines.push(`## 5. Dialectical Inquiry Prompts for NotebookLM Synthesis`);
  lines.push(
    `When generating an Audio Overview or deep-dive briefing document in NotebookLM, prompt the model to examine:`,
  );
  if (presetMatch) {
    presetMatch.dialecticalPrompts.forEach((prompt, index) => {
      lines.push(`${index + 1}. **${prompt.split("?")[0]}?**: ${prompt}`);
    });
  } else {
    lines.push(
      `1. **Original Semantic Core**: How do the classical Hebrew terms (malakh, cherub, saraph, shedim, se'irim) and Greek terms (angelos, daimonion, archon) define ${title}?`,
    );
    lines.push(
      `2. **Second Temple Expansion vs Canonical Restraint**: How does the biblical account contrast with extra-canonical Jewish texts and later medieval angelology?`,
    );
    lines.push(
      `3. **Eschatological Overthrow**: How does Christ's ministry (exorcisms, the cross, resurrection) alter the cosmic status and authority of these unseen figures?`,
    );
  }
  lines.push("");
  lines.push(`---`);
  lines.push(
    `*Source boundary: Scripture lines loaded by the tool come from the named hosted editions. Preset readings and historical notes are curated research aids, not a critical edition; verify them against the named source before quotation or publication. Generated AI output can still contain errors.*`,
  );

  const fullMarkdown = lines.join("\n");
  const words = fullMarkdown.trim().split(/\s+/).length;

  const audioHostPrompt = presetMatch
    ? presetMatch.audioHostPrompt
    : `Deep-dive historical theology podcast on "${title}" from the Angels & Demons corpus. Host 1 acts as the linguistic and textual critic examining the ancient Semitic and Greek manuscript variants. Host 2 acts as the church historian exploring how Second Temple Judaism and the early Christians interpreted and engaged with these unseen spiritual powers. Strictly ground all dialogue in the provided source dossier without introducing modern speculative fiction.`;

  const sourceEntries = new Set<string>();
  for (const verse of resolvedVerses) {
    if (hasText(verse.original)) sourceEntries.add("OSHB/SBLGNT original-language text");
    if (hasText(verse.brenton)) sourceEntries.add("Brenton Septuagint");
    if (hasText(verse.drb)) sourceEntries.add("Douay-Rheims");
    if (hasText(verse.kjv)) sourceEntries.add("King James Version");
    if (hasText(verse.web)) sourceEntries.add("World English Bible");
    if (hasText(verse.charles)) sourceEntries.add("R. H. Charles translation");
  }
  for (const reading of presetMatch?.textualDivergence?.readingDifferences ?? []) {
    sourceEntries.add(reading.witness);
  }
  for (const witness of presetMatch?.ancientWitnesses ?? []) {
    sourceEntries.add(witness.source);
  }

  return {
    title,
    targetType,
    markdown: fullMarkdown,
    audioHostPrompt,
    sourceEntryCount: sourceEntries.size,
    wordCount: words,
    preset: presetMatch,
  };
}
