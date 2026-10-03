/**
 * The Diachronic Semantic Comparison Tracker
 *
 * Compares selected linguistic and theological uses of core sacred concepts:
 * Biblical Hebrew / Aramaic (first millennium BCE)
 *   → Septuagint Greek (third–first centuries BCE)
 *   → Second Temple Jewish texts (third century BCE–first century CE)
 *   → New Testament Greek (first century CE)
 *   → Ante-Nicene Christian texts (late first–third centuries CE)
 *   → Jerome's Latin Vulgate (late fourth–early fifth centuries CE)
 *
 * Runs on-device and exports a source-attributed worksheet for Google NotebookLM.
 */

export type DiachronicStage = {
  era: string;
  century: string;
  language: string;
  term: string;
  transliteration: string;
  literalMeaning: string;
  theologicalShift: string;
  primaryWitnesses: {
    ref: string;
    text: string;
    historicalContext: string;
  }[];
};

export type DiachronicConcept = {
  id: string;
  title: string;
  hebrewTerm: string;
  greekTerm: string;
  latinTerm: string;
  coreParadox: string;
  summary: string;
  whyItMatters: string;
  stages: DiachronicStage[];
  divergenceTraps: string[];
};

export const DIACHRONIC_CONCEPTS: DiachronicConcept[] = [
  {
    id: "ruach-spirit",
    title: "Ruach / Pneuma / Spiritus (Wind, Breath, and Spirit)",
    hebrewTerm: "רוּחַ (rūaḥ)",
    greekTerm: "πνεῦμα (pneuma)",
    latinTerm: "spiritus (spirit)",
    coreParadox:
      "The related terms can denote wind, breath, life, disposition, and divine agency; later Christian texts also describe the Spirit as teacher, advocate, and intercessor.",
    summary:
      "Biblical Hebrew rūaḥ has a wide contextual range that includes moving air, creaturely breath, human disposition, and divine activity. The Septuagint regularly uses pneuma, a Greek term that also appears in philosophical and medical discourse, but lexical overlap alone does not prove philosophical influence on a given translation. New Testament and early Christian witnesses use pneuma in several ways, including Johannine language about the Paraclete and communal language about one Spirit.",
    whyItMatters:
      "The English word 'spirit' can conceal the physical and figurative range of rūaḥ and pneuma. Comparing individual passages helps readers avoid imposing one sense on every occurrence.",
    stages: [
      {
        era: "Ancient Israel & Iron Age Hebrew",
        century: "c. 1000–500 BCE",
        language: "Biblical Hebrew",
        term: "רוּחַ",
        transliteration: "rūaḥ",
        literalMeaning: "Wind, breath, dynamic blast, respiration",
        theologicalShift:
          "These texts use rūaḥ for wind and for divine activity. Genesis 1:2 describes it hovering or moving over the waters, Exodus 14:21 names the wind that drives back the sea, and 1 Samuel 16:14 says the spirit of YHWH departed Saul while a harmful spirit terrified him.",
        primaryWitnesses: [
          {
            ref: "Genesis 1:2",
            text: "וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל־פְּנֵי הַמָּיִם",
            historicalContext: "The rūaḥ of God hovering or moving over the primeval waters.",
          },
          {
            ref: "Ezekiel 37:9",
            text: "מֵאַרְבַּע רוּחוֹת בֹּאִי הָרוּחַ וּפְחִי בַּהֲרוּגִים הָאֵלֶּה",
            historicalContext: "The four winds called to breathe life into the slain dry bones.",
          },
        ],
      },
      {
        era: "Alexandrian Septuagint (LXX)",
        century: "c. 250–100 BCE",
        language: "Koine Greek",
        term: "πνεῦμα",
        transliteration: "pneuma",
        literalMeaning: "Air in motion, breath, vapor, spirit",
        theologicalShift:
          "The Septuagint commonly renders rūaḥ with pneuma. The Greek word also had medical and philosophical uses, including Stoic accounts of breath, but any effect of those uses on a biblical passage must be argued from its context rather than inferred from the word alone.",
        primaryWitnesses: [
          {
            ref: "Genesis 1:2 LXX",
            text: "καὶ πνεῦμα θεοῦ ἐπεφέρετο ἐπάνω τοῦ ὕδατος",
            historicalContext: "Rendering Hebrew rūaḥ directly as pneuma theou.",
          },
          {
            ref: "Psalm 103:4 LXX (104:4)",
            text: "ὁ ποιῶν τοὺς ἀγγέλους αὐτοῦ πνεύματα",
            historicalContext: "The plural pneumata can be read as winds or spirits in this poetic rendering.",
          },
        ],
      },
      {
        era: "Second Temple & Dead Sea Scrolls (Qumran)",
        century: "c. 150 BCE – 68 CE",
        language: "Hebrew & Aramaic",
        term: "רוּחַ אֱמֶת / רוּחַ עַוֶל",
        transliteration: "rūaḥ ’emet / rūaḥ ‘awel",
        literalMeaning: "Spirit of Truth / Spirit of Deceit",
        theologicalShift:
          "The Community Rule (1QS) presents two spirits through which humanity walks until a final visitation and relates purification to a holy spirit. Its relationship to other Jewish and Christian spirit language must be argued rather than presumed.",
        primaryWitnesses: [
          {
            ref: "1QS 3:18–25 (Community Rule)",
            text: "He created humanity to rule the world and assigned two spirits to them: the Spirit of Truth and the Spirit of Injustice.",
            historicalContext: "The Community Rule's ethical account of the spirits of truth and injustice.",
          },
        ],
      },
      {
        era: "New Testament Witnesses",
        century: "c. 50–95 CE",
        language: "Koine Greek",
        term: "Πνεῦμα Ἅγιον / Παράκλητος",
        transliteration: "Pneuma Hagion / Paraklētos",
        literalMeaning: "Holy Spirit / Advocate, Comforter, One called alongside",
        theologicalShift:
          "John portrays the Holy Spirit as the Paraclete sent by the Father in Jesus' name, while Romans 8:26 depicts the Spirit interceding in prayer. Later Christian accounts of the Spirit's personhood draw on passages such as these.",
        primaryWitnesses: [
          {
            ref: "John 14:26",
            text: "ὁ δὲ παράκλητος, τὸ πνεῦμα τὸ ἅγιον ὃ πέμψει ὁ πατὴρ ἐν τῷ ὀνόματί μου",
            historicalContext: "John identifies the Holy Spirit as the Advocate and Teacher in this discourse.",
          },
          {
            ref: "Romans 8:26",
            text: "τὸ πνεῦμα ὑπερεντυγχάνει στεναγμοῖς ἀλαλήτοις",
            historicalContext: "The Spirit interceding through wordless groans.",
          },
        ],
      },
      {
        era: "Ante-Nicene Patristics (Apostolic Fathers)",
        century: "c. 70–150 CE",
        language: "Early Christian Greek",
        term: "τὸ ἓν πνεῦμα τῆς χάριτος",
        transliteration: "to hen pneuma tēs charitos",
        literalMeaning: "The one Spirit of grace",
        theologicalShift:
          "First Clement 46 appeals to one Spirit of grace while urging unity in Corinth, and Didache 11 regulates the reception of people who claim prophetic speech. These pastoral uses do not by themselves supply a complete doctrine of the Spirit.",
        primaryWitnesses: [
          {
            ref: "1 Clement 46:6",
            text: "Have we not one God, and one Christ, and one Spirit of grace poured out upon us?",
            historicalContext: "Appealing to the unity of the Spirit to rebuke the revolt against the presbyters in Corinth.",
          },
          {
            ref: "The Didache 7:1",
            text: "Baptize into the name of the Father, and of the Son, and of the Holy Spirit, in living water.",
            historicalContext: "An early baptismal formula; the Didache's date and compositional history remain debated.",
          },
        ],
      },
      {
        era: "Latin Vulgate (St. Jerome)",
        century: "c. 382–405 CE",
        language: "Late Latin",
        term: "Spiritus Sanctus",
        transliteration: "Spiritus Sanctus",
        literalMeaning: "Holy Breath / Holy Spirit",
        theologicalShift:
          "The Vulgate uses Latin spiritus, a word connected with breathing, for these passages. Augustine's later language about the Spirit and the love of Father and Son belongs to theological reception and should be distinguished from Jerome's lexical choice.",
        primaryWitnesses: [
          {
            ref: "Genesis 1:2 Vulg.",
            text: "et Spiritus Dei ferebatur super aquas",
            historicalContext: "Jerome's influential Latin rendering of the creation passage.",
          },
        ],
      },
    ],
    divergenceTraps: [
      "Compare physical, anthropological, and theological uses of rūaḥ instead of importing a single later mind–body model.",
      "Note that Exodus 14:21 and Genesis 1:2 use the same lexeme without assuming that the referent is identical.",
      "Treat claims that pneuma 'bridged' Hebrew and Greek thought as hypotheses requiring contextual and historical evidence.",
    ],
  },
  {
    id: "sheol-afterlife",
    title: "Sheol / Hades / Infernus (The Underworld and Realm of the Dead)",
    hebrewTerm: "שְׁאוֹל (šə’ōl)",
    greekTerm: "ᾅδης (Haidēs) / γέεννα (Geenna)",
    latinTerm: "infernus (the lower realm)",
    coreParadox:
      "The selected witnesses use overlapping images of grave, underworld, judgment, and postmortem fate without presenting one uniform map of the afterlife.",
    summary:
      "Several Hebrew poems portray Sheol as dark, silent, and outside ordinary communal praise, while other passages supply different emphases. First Enoch 22 gives a more differentiated scene in which spirits await judgment in separate hollows. New Testament uses of Hades and Gehenna occur in distinct literary settings; those uses should be compared passage by passage rather than assembled automatically into one fixed sequence of temporary and final realms.",
    whyItMatters:
      "The King James Version renders Hebrew Sheol as 'hell' in some passages and as 'grave' or 'pit' in others; it also uses 'hell' for several Greek terms. That English choice can obscure distinctions among the underlying words for modern readers.",
    stages: [
      {
        era: "Biblical Hebrew Poetry",
        century: "first millennium BCE (individual texts dated differently)",
        language: "Biblical Hebrew",
        term: "שְׁאוֹל / בּוֹר",
        transliteration: "šə’ōl / bôr",
        literalMeaning: "The Pit, the Grave, the Underworld",
        theologicalShift:
          "Several poetic passages associate Sheol with darkness, silence, dust, and the absence of ordinary praise. These texts do not by themselves establish a universal, systematic doctrine or the eternal condition of every dead person.",
        primaryWitnesses: [
          {
            ref: "Psalm 6:5",
            text: "כִּי אֵין בַּמָּוֶת זִכְרֶךָ בִּשְׁאוֹל מִי יוֹדֶה־לָּךְ",
            historicalContext: "Plea for physical healing on the grounds that no one praises YHWH in Sheol.",
          },
          {
            ref: "Job 10:21–22",
            text: "A land of darkness and deep shadow, a land of gloom like darkness itself.",
            historicalContext: "Job describing the dark land to which he expects to go.",
          },
        ],
      },
      {
        era: "Septuagint & Second Temple Apocrypha",
        century: "c. 250–100 BCE",
        language: "Koine Greek & Aramaic",
        term: "ᾅδης / 1 Enoch 22",
        transliteration: "Haidēs",
        literalMeaning: "The Unseen Realm (Greek god of the underworld / abode of shades)",
        theologicalShift:
          "The Septuagint frequently maps Sheol onto Hades. First Enoch 22 depicts hollow places in which spirits await judgment, differentiating their conditions; the work's complex dating and textual transmission counsel against treating it as a simple next step in a single evolution.",
        primaryWitnesses: [
          {
            ref: "1 Enoch 22:1–13",
            text: "These hollow places have been created that the spirits of the dead might be gathered into them until the day of their judgment.",
            historicalContext: "A detailed early Jewish witness to differentiated postmortem holding places.",
          },
        ],
      },
      {
        era: "Gospels & New Testament Writings",
        century: "c. 50–90 CE",
        language: "Koine Greek",
        term: "ᾅδης vs γέεννα vs κόλπος Ἀβραάμ",
        transliteration: "Haidēs vs Geenna vs kolpos Abraam",
        literalMeaning: "Hades / Gehenna (Valley of Hinnom) / Abraham's Bosom",
        theologicalShift:
          "Luke 16 places the rich man in Hades and Lazarus at Abraham's side, separated by an uncrossable chasm, within a parable. Gehenna takes its name from the Valley of Hinnom, which biblical texts associate with condemned child sacrifice and judgment; the often-repeated claim that it was a continuously burning Jerusalem garbage dump is not established by those texts.",
        primaryWitnesses: [
          {
            ref: "Luke 16:22–23",
            text: "ἐν τῷ ᾅδῃ ἐπάρας τοὺς ὀφθαλμοὺς αὐτοῦ... ὁρᾷ Ἀβραὰμ ἀπὸ μακρόθεν",
            historicalContext: "The rich man in Hades seeing Lazarus in Abraham's bosom across the gulf.",
          },
          {
            ref: "Matthew 10:28",
            text: "φοβεῖσθε δὲ μᾶλλον τὸν δυνάμενον καὶ ψυχὴν καὶ σῶμα ἀπολέσαι ἐν γεέννῃ",
            historicalContext: "Warning to fear Him who can destroy both soul and body in Gehenna.",
          },
        ],
      },
      {
        era: "Sub-Apostolic Witness to Passion and Resurrection",
        century: "c. 100–180 CE",
        language: "Early Christian Greek",
        term: "ἀληθῶς ἠγέρθη ἀπὸ νεκρῶν",
        transliteration: "alēthōs ēgerthē apo nekrōn",
        literalMeaning: "He was truly raised from the dead",
        theologicalShift:
          "Ignatius, Trallians 9 stresses Jesus' real birth, suffering, death, and resurrection against docetic claims. The cited passage does not say that Christ descended into Hades or liberated patriarchs; that later motif requires different witnesses.",
        primaryWitnesses: [
          {
            ref: "Ignatius to the Trallians 9:2",
            text: "He was also truly raised from the dead, His Father having raised Him up, whose Father also will raise up us who believe in Him.",
            historicalContext: "Ignatius affirming a real death and resurrection; the shorter Greek text does not mention a descent into Hades.",
          },
        ],
      },
      {
        era: "Latin Vulgate & Later Western Reception",
        century: "late fourth century CE and later reception",
        language: "Late Latin",
        term: "Infernus / Inferi",
        transliteration: "infernus / inferi",
        literalMeaning: "Those below, the subterranean realm",
        theologicalShift:
          "The Vulgate uses infernus or related forms in a number of passages about Sheol and Hades. Those Latin terms accrued further senses in later Western reception, but a single causal line from Jerome's word choice to one medieval doctrine cannot be assumed.",
        primaryWitnesses: [
          {
            ref: "Psalm 15:10 Vulg. (16:10)",
            text: "quoniam non derelinques animam meam in inferno",
            historicalContext: "Vulgate rendering of 'You will not leave my soul in Sheol/Hades'.",
          },
        ],
      },
    ],
    divergenceTraps: [
      "Ask what Sheol denotes in each Hebrew passage before importing a later literary picture of hell.",
      "Compare Hades and Gehenna in their immediate contexts without presuming that every author supplies the same temporal scheme.",
      "Treat literary dependence between 1 Enoch and New Testament afterlife language as a historical question, not a demonstrated causal chain.",
    ],
  },
  {
    id: "tzedakah-righteousness",
    title: "Tzedakah / Dikaiosyne / Iustitia (Righteousness and Justice)",
    hebrewTerm: "צְדָקָה (ṣədāqāh)",
    greekTerm: "δικαιοσύνη (dikaiosynē)",
    latinTerm: "iustitia / iustificare",
    coreParadox:
      "Hebrew, Greek, and Latin righteousness terms overlap across relational, ethical, distributive, and forensic settings, but none is exhausted by a single English gloss.",
    summary:
      "The Hebrew ṣ-d-q word group can concern right conduct, justice, vindication, and God's saving action. Greek dikaiosynē likewise ranges across ethical, civic, and legal discourse, and the Septuagint's use of it must be read in each translated context. Latin iustitia and iustificare supplied influential Western vocabulary, but their morphology did not mechanically determine later doctrines of justification.",
    whyItMatters:
      "Luther's later autobiographical account describes a struggle with 'the righteousness of God' and a changed reading of Romans. That testimony does not by itself show that Latin legalism caused the struggle or that one recovered 'Semitic sense' settles the passage's interpretation.",
    stages: [
      {
        era: "Hebrew Prophetic Texts",
        century: "c. 900–500 BCE",
        language: "Biblical Hebrew",
        term: "צְדָקָה / צֶדֶק",
        transliteration: "ṣədāqāh / ṣeḏeq",
        literalMeaning: "Rightness, justice, righteous conduct, vindication",
        theologicalShift:
          "Selected prophetic passages connect righteousness with just conduct and divine deliverance. Isaiah 51:5, for example, places God's righteousness beside salvation; this parallel supports a saving sense there without defining every use of the lexeme.",
        primaryWitnesses: [
          {
            ref: "Isaiah 51:5",
            text: "קָרוֹב צִדְקִי יָצָא יִשְׁעִי",
            historicalContext: "Righteousness paired symmetrically with divine salvation.",
          },
          {
            ref: "Amos 5:24",
            text: "וְיִגַּל כַּמַּיִם מִשְׁפָּט וּצְדָקָה כְּנַחַל אֵיתָן",
            historicalContext: "Justice and righteousness flowing like a mighty, unceasing river.",
          },
        ],
      },
      {
        era: "Classical & Hellenistic Greek (LXX)",
        century: "c. 250–100 BCE",
        language: "Koine Greek",
        term: "δικαιοσύνη",
        transliteration: "dikaiosynē",
        literalMeaning: "Justice, righteousness, right conduct, civic virtue",
        theologicalShift:
          "Greek philosophical discussions give dikaiosynē several accounts; Plato's Republic emphasizes order within a person and city, while other traditions discuss distribution and law. The Septuagint uses the term for the Hebrew ṣ-d-q family, a translation choice that neither erases Hebrew context nor imports a complete Greek theory automatically.",
        primaryWitnesses: [
          {
            ref: "Genesis 15:6 LXX",
            text: "καὶ ἐλογίσθη αὐτῷ εἰς δικαιοσύνην",
            historicalContext: "Abraham's trust in God reckoned to him as righteousness.",
          },
        ],
      },
      {
        era: "Pauline Epistles",
        century: "c. 50–65 CE",
        language: "Koine Greek",
        term: "δικαιοσύνη θεοῦ",
        transliteration: "dikaiosynē theou",
        literalMeaning: "Righteousness of God (the genitive's force is debated)",
        theologicalShift:
          "Romans 3 coordinates God's righteousness, law, faith, and the inclusion of Jews and gentiles. Interpreters dispute the scope of 'works of law' and whether pistis Christou means faith in Christ, Christ's faithfulness, or carries a related nuance; the data should present those readings as alternatives.",
        primaryWitnesses: [
          {
            ref: "Romans 3:21–22",
            text: "νυνὶ δὲ χωρὶς νόμου δικαιοσύνη θεοῦ πεφανέρωται... διὰ πίστεως Ἰησοῦ Χριστοῦ",
            historicalContext: "God's righteousness unveiled apart from the Law through faith in/of Jesus Christ.",
          },
        ],
      },
      {
        era: "First Clement (Roman Church)",
        century: "late first or early second century CE (commonly dated)",
        language: "Early Christian Greek",
        term: "οὐ δι᾽ ἑαυτῶν δικαιούμεθα",
        transliteration: "ou di' heautōn dikaioumetha",
        literalMeaning: "We are not justified through ourselves",
        theologicalShift:
          "First Clement 32 attributes justification to God's call and faith rather than human wisdom or piety, while the letter also exhorts its readers to obedience. The juxtaposition is an early witness, not a resolution of later Reformation debates.",
        primaryWitnesses: [
          {
            ref: "1 Clement 32:4",
            text: "And so we, having been called through His will in Christ Jesus, are not justified through ourselves, or through our own wisdom, or understanding, or piety, but through faith, by which Almighty God has justified all men from the beginning.",
            historicalContext: "An early post-New Testament statement connecting divine calling, faith, and justification.",
          },
        ],
      },
      {
        era: "Latin Vulgate & Western Reception",
        century: "c. 382–405 CE",
        language: "Late Latin",
        term: "iustitia / iustificare",
        transliteration: "iustitia / iustificare",
        literalMeaning: "Justice or righteousness / to justify",
        theologicalShift:
          "The Vulgate uses iustificare for Greek dikaioō. Later Western traditions developed both declarative and transformative accounts of justification; the Latin verb's apparent components do not, by themselves, decide between those theological readings.",
        primaryWitnesses: [
          {
            ref: "Romans 3:24 Vulg.",
            text: "iustificati gratis per gratiam ipsius",
            historicalContext: "An influential Latin rendering in later Western discussions of justification.",
          },
        ],
      },
    ],
    divergenceTraps: [
      "Compare ethical, relational, distributive, and forensic uses before selecting one gloss for righteousness.",
      "Do not infer a complete doctrine of justification from the morphology of Latin iustificare.",
      "Read Paul's scriptural citations and Jewish context while keeping disputed constructions such as pistis Christou explicit.",
    ],
  },
  {
    id: "berith-covenant",
    title: "Berith / Diatheke / Testamentum (Covenant and Testament)",
    hebrewTerm: "בְּרִית (bərîṯ)",
    greekTerm: "διαθήκη (diathēkē)",
    latinTerm: "testamentum (will / testament)",
    coreParadox:
      "Hebrew bərîṯ, Greek diathēkē, and Latin testamentum overlap in covenant discourse while carrying different associations in other legal and literary settings.",
    summary:
      "Hebrew regularly says that a covenant is 'cut', and Genesis 15 depicts a covenant ceremony involving divided animals, but biblical covenants take more than one form. The Septuagint commonly renders bərîṯ as diathēkē rather than synthēkē. The translators' exact motive is not recoverable from the choice alone, and diathēkē can denote more than a last will. Latin testamentum contributed to the later titles 'Old Testament' and 'New Testament' as part of a longer reception history.",
    whyItMatters:
      "The familiar biblical titles preserve one line of Greek and Latin reception. Readers should still distinguish the covenants described in the source texts from both a modern contract and a modern probate document.",
    stages: [
      {
        era: "Ancient Near Eastern Treaties & Pentateuch",
        century: "first-millennium BCE texts with earlier comparative backgrounds",
        language: "Biblical Hebrew",
        term: "בְּרִית (כָּרַת בְּרִית)",
        transliteration: "bərîṯ (kāraṯ bərîṯ)",
        literalMeaning: "Binding pact, kinship bond ('to cut a covenant')",
        theologicalShift:
          "Covenants can establish obligations, promises, and communal bonds. In Genesis 15 the smoking firepot and torch pass between the pieces; reading that action as God accepting a treaty curse is a common interpretation, not an explanation stated explicitly by the verse.",
        primaryWitnesses: [
          {
            ref: "Genesis 15:18",
            text: "בַּיּוֹם הַהוּא כָּרַת יְהוָה אֶת־אַבְרָם בְּרִית",
            historicalContext: "The formal cutting of the Abrahamic covenant of land and seed.",
          },
          {
            ref: "Exodus 24:8",
            text: "הִנֵּה דַם־הַבְּרִית אֲשֶׁר כָּרַת יְהוָה עִמָּכֶם",
            historicalContext: "Moses sprinkling the blood of the covenant upon the people of Israel.",
          },
        ],
      },
      {
        era: "Septuagint Greek",
        century: "c. 250–100 BCE",
        language: "Koine Greek",
        term: "διαθήκη (not συνθήκη)",
        transliteration: "diathēkē",
        literalMeaning: "Arrangement, disposition, covenant; in some contexts, testament",
        theologicalShift:
          "The Septuagint's consistent preference for diathēkē over synthēkē is significant, but proposals about divine sovereignty or non-negotiability are explanations offered by interpreters rather than an intention stated by the translators.",
        primaryWitnesses: [
          {
            ref: "Exodus 24:8 LXX",
            text: "ἰδοὺ τὸ αἷμα τῆς διαθήκης ἧς διέθετο κύριος πρὸς ὑμᾶς",
            historicalContext: "The blood of the diatheke which the Lord has established with you.",
          },
        ],
      },
      {
        era: "Epistle to the Hebrews",
        century: "first century CE",
        language: "Koine Greek",
        term: "κρείττων διαθήκη",
        transliteration: "kreittōn diathēkē",
        literalMeaning: "Better Covenant / Better Testament",
        theologicalShift:
          "Many interpreters read Hebrews 9:16–17 as testamentary wordplay on diathēkē, while others retain a covenantal sense and relate the required death to covenant sacrifice. The translation should expose that dispute rather than present one reading as certain.",
        primaryWitnesses: [
          {
            ref: "Hebrews 9:16–17",
            text: "ὅπου γὰρ διαθήκη, θάνατον ἀνάγκη φέρεσθαι τοῦ διαθεμένου",
            historicalContext: "A disputed passage relating diathēkē, death, and the promised inheritance.",
          },
        ],
      },
      {
        era: "Latin Vulgate & Later Biblical Titles",
        century: "late fourth century CE and later reception",
        language: "Late Latin",
        term: "Vetus Testamentum / Novum Testamentum",
        transliteration: "Vetus Testamentum / Novum Testamentum",
        literalMeaning: "Old Testament / New Testament",
        theologicalShift:
          "Latin testamentum became influential in Western biblical vocabulary and book titles. That reception encouraged testamentary associations without permanently fixing the meaning of every covenant passage.",
        primaryWitnesses: [
          {
            ref: "1 Corinthians 11:25 Vulg.",
            text: "hic calix novum testamentum est in meo sanguine",
            historicalContext: "This cup is the new testament in my blood.",
          },
        ],
      },
    ],
    divergenceTraps: [
      "Compare each bərîṯ narrative with relevant ancient practices instead of equating it with one modern contract form.",
      "Discuss diathēkē and synthēkē as lexical evidence without assigning an undocumented motive to anonymous translators.",
      "Distinguish the phrase 'new covenant' in early Christian texts from the later use of 'New Testament' as a collection title.",
    ],
  },
  {
    id: "logos-word",
    title: "Dabar / Memra / Logos / Verbum (Word and Divine Speech)",
    hebrewTerm: "דָּבָר (dāḇār) / מֵימְרָא (Memrā)",
    greekTerm: "λόγος (Logos)",
    latinTerm: "verbum (word)",
    coreParadox:
      "Biblical speech, Targumic Memra language, Greek accounts of logos, and John's incarnate Word offer related motifs whose historical connections remain questions for comparison.",
    summary:
      "Hebrew dāḇār can mean word, matter, or event, and biblical texts portray God's speech as effective. Targumic witnesses sometimes use Memra in paraphrastic constructions, but describing it uniformly as a mediating buffer overstates a varied corpus. Logos has a broad Greek history, including philosophical uses for account or cosmic reason. John 1 declares that the Logos became flesh; whether and how the prologue depends on particular Hebrew, Targumic, Philonic, or other traditions remains debated.",
    whyItMatters:
      "John's prologue invites comparison with both Jewish creation language and Greek logos discourse. Similar vocabulary is evidence for interpretation, while direct dependence and rejection of a specific philosophical system require further argument.",
    stages: [
      {
        era: "Biblical Hebrew & Later Targumic Aramaic",
        century: "c. eighth century BCE–late antiquity",
        language: "Biblical Hebrew & Aramaic",
        term: "דְּבַר יְהוָה / מֵימְרָא דַיְיָ",
        transliteration: "dəḇar YHWH / Mēmrā da-Adonai",
        literalMeaning: "The Word of the Lord / The Memra",
        theologicalShift:
          "Isaiah 55 depicts God's word accomplishing its purpose. Targumic texts use Memra in several constructions, but their extant textual forms are later than Isaiah and should not be folded into one eighth-to-first-century stage.",
        primaryWitnesses: [
          {
            ref: "Isaiah 55:11",
            text: "כֵּן יִהְיֶה דְבָרִי אֲשֶׁר יֵצֵא מִפִּי לֹא־יָשׁוּב אֵלַי רֵיקָם",
            historicalContext: "The word of God as an efficacious agent that accomplishes divine purpose.",
          },
          {
            ref: "Targum Onkelos Gen 3:8",
            text: "And they heard the voice of the Memra of the Lord God moving in the garden.",
            historicalContext: "Onkelos attaches Memra to 'voice'; the construction does not simply replace every reference to the divine subject.",
          },
        ],
      },
      {
        era: "Hellenistic Jewish Philosophy (Philo of Alexandria)",
        century: "c. 20 BCE – 50 CE",
        language: "Philosophical Greek",
        term: "ὁ θεῖος λόγος",
        transliteration: "ho theios logos",
        literalMeaning: "The Divine Reason / Cosmic Archetype",
        theologicalShift:
          "Philo interprets creation through Greek philosophical categories alongside Jewish scripture, and his corpus gives the Logos several functions, including intelligible pattern and divine instrument. Labels such as 'eldest Son' occur elsewhere in that corpus and should not all be assigned to this one passage.",
        primaryWitnesses: [
          {
            ref: "Philo, De Opificio Mundi 24",
            text: "He would not call the world, which is perceptible only to the intellect, anything else but the reason of God, already occupied in the creation of the world.",
            historicalContext: "A witness to Hellenistic Jewish cosmology, not by itself proof of a direct bridge to John.",
          },
        ],
      },
      {
        era: "Johannine Prologue",
        century: "late first century CE (commonly dated)",
        language: "Koine Greek",
        term: "ὁ λόγος σὰρξ ἐγένετο",
        transliteration: "ho logos sarx egeneto",
        literalMeaning: "The Word became flesh",
        theologicalShift:
          "The prologue says that the Logos became flesh and dwelt among the community. Christian interpreters relate eskēnōsen to tabernacle imagery, while the text itself foregrounds embodied mortal existence rather than an abstract principle alone.",
        primaryWitnesses: [
          {
            ref: "John 1:1, 14",
            text: "Ἐν ἀρχῇ ἦν ὁ λόγος... καὶ ὁ λόγος σὰρξ ἐγένετο καὶ ἐσκήνωσεν ἐν ἡμῖν",
            historicalContext: "A central witness for later Christian accounts of incarnation.",
          },
        ],
      },
      {
        era: "Early Christian & Latin Reception",
        century: "c. 100–400 CE",
        language: "Early Greek & Latin",
        term: "Verbum / Sermo",
        transliteration: "Verbum / Sermo",
        literalMeaning: "Word / Spoken Discourse",
        theologicalShift:
          "Tertullian can discuss logos with Latin sermo and ratio, while the Vulgate text of John uses verbum. This is a history of varied Latin renderings and reception, not a documented debate between Tertullian and Jerome in which one word simply 'won'.",
        primaryWitnesses: [
          {
            ref: "Ignatius to the Magnesians 8:2",
            text: "Jesus Christ His Son, who is His Word proceeding from silence, who in all things pleased Him that sent Him.",
            historicalContext: "In a commonly printed recension, Ignatius calls the Son God's Word from silence; this Greek witness predates Jerome and does not establish the Vulgate's lexical choice.",
          },
        ],
      },
    ],
    divergenceTraps: [
      "Compare Greek philosophical, biblical Jewish, and later Targumic parallels without making any one source of John automatic.",
      "Determine dāḇār's sense from each passage rather than reducing every use to speech or treating every use as a cosmic agent.",
      "Render sarx as 'flesh' and explain its embodied, mortal associations without sensationalizing it as raw meat.",
    ],
  },
  {
    id: "son-of-man",
    title: "Bar Enash / Huios tou Anthropou / Filius Hominis (The Son of Man)",
    hebrewTerm: "בֶּן־אָדָם (ben ’āḏām) / בַּר אֱנָשׁ (bar ’ĕnāš)",
    greekTerm: "ὁ υἱὸς τοῦ ἀνθρώπου",
    latinTerm: "filius hominis",
    coreParadox:
      "The expression can identify a mortal human, Daniel's human-like figure who receives dominion, or a Gospel self-reference with several possible scriptural associations.",
    summary:
      "Ezekiel repeatedly receives the address 'ben adam', an idiom marking him as human. Daniel 7:13 instead presents 'one like a son of man' coming with the clouds and receiving dominion. The Parables of Enoch use Son of Man language for an exalted judge, although the section's date and the figure's precise identity remain debated. The Gospels place the expression frequently on Jesus' lips; explanations of why the title was used or how audiences heard it are historical interpretations, not recoverable intent stated by the phrase itself.",
    whyItMatters:
      "The expressions 'Son of God' and 'Son of Man' carry several scriptural and ancient Jewish associations. Mark 14 combines imagery from Psalm 110 and Daniel 7 and narrates a blasphemy accusation, but that scene alone does not establish a simple reversal of the titles' meanings or the sole historical cause of Jesus' execution.",
    stages: [
      {
        era: "Old Testament Hebrew (Ezekiel & Psalms)",
        century: "first millennium BCE",
        language: "Biblical Hebrew",
        term: "בֶּן־אָדָם",
        transliteration: "ben ’āḏām",
        literalMeaning: "Son of Adam / Mortal, human being",
        theologicalShift:
          "In these passages the expression identifies a human being or mortal. Ezekiel's repeated address distinguishes the prophetic addressee from the divine speaker without requiring a later messianic sense.",
        primaryWitnesses: [
          {
            ref: "Psalm 8:4",
            text: "מָה־אֱנוֹשׁ כִּי־תִזְכְּרֶנּוּ וּבֶן־אָדָם כִּי תִפְקְדֶנּוּ",
            historicalContext: "What is mortal man that You are mindful of him?",
          },
          {
            ref: "Ezekiel 2:1",
            text: "וַיֹּאמֶר אֵלָי בֶּן־אָדָם עֲמֹד עַל־רַגְלֶיךָ",
            historicalContext: "The divine speaker addresses Ezekiel as a human being before commissioning him.",
          },
        ],
      },
      {
        era: "Danielic Vision & Enochic Apocalyptic",
        century: "second century BCE–first century CE (texts dated separately)",
        language: "Biblical Aramaic & Ge'ez/Greek",
        term: "כְּבַר אֱנָשׁ",
        transliteration: "kəḇar ’ĕnāš",
        literalMeaning: "One like a Son of Man / Heavenly human-like figure",
        theologicalShift:
          "Daniel contrasts the human-like figure who comes with the clouds with beasts that rise from the sea; identifications of the four beasts and of the human-like figure vary among interpreters. The Parables of Enoch apply related language to an exalted agent of judgment.",
        primaryWitnesses: [
          {
            ref: "Daniel 7:13–14",
            text: "וַאֲרוּ עִם־עֲנָנֵי שְׁמַיָּא כְּבַר אֱנָשׁ אָתֵה הֲוָה",
            historicalContext: "The Ancient of Days gives the human-like figure dominion described as everlasting and universal in scope.",
          },
          {
            ref: "1 Enoch 46:1–3 (Parables of Enoch)",
            text: "This is the Son of Man who has righteousness, and with whom righteousness dwells.",
            historicalContext: "An exalted champion of the righteous; readings of the figure's pre-existence and the passage's date are debated.",
          },
        ],
      },
      {
        era: "Markan Gospel Tradition & Trial Scene",
        century: "first century CE",
        language: "Koine Greek (with a possible Aramaic background)",
        term: "ὁ υἱὸς τοῦ ἀνθρώπου",
        transliteration: "ho huios tou anthrōpou",
        literalMeaning: "The Son of Man",
        theologicalShift:
          "Mark 10:45 juxtaposes Son of Man language with service and ransom; many interpreters hear an allusion to Isaiah 53, though the verse does not cite it explicitly. Mark 14:62 combines enthronement and cloud-coming imagery commonly related to Psalm 110:1 and Daniel 7:13.",
        primaryWitnesses: [
          {
            ref: "Mark 14:62",
            text: "ὄψεσθε τὸν υἱὸν τοῦ ἀνθρώπου ἐκ δεξιῶν καθήμενον τῆς δυνάμεως καὶ ἐρχόμενον μετὰ τῶν νεφελῶν τοῦ οὐρανοῦ",
            historicalContext: "Mark's narrative applies scriptural enthronement imagery to Jesus and then reports the high priest's blasphemy judgment.",
          },
        ],
      },
    ],
    divergenceTraps: [
      "Test whether each Gospel saying uses a mortal idiom, Danielic imagery, a self-reference, or more than one association.",
      "Identify Daniel 7 echoes from wording and context instead of assuming that every Son of Man saying carries the full vision.",
      "Present links among suffering, service, vindication, and glory as literary readings supported by particular passages.",
    ],
  },
  {
    id: "kadosh-holy",
    title: "Kadosh / Hagios / Sanctus (The Holy and Consecrated)",
    hebrewTerm: "קָדוֹשׁ (qāḏôš)",
    greekTerm: "ἅγιος (hagios)",
    latinTerm: "sanctus (sacred / inviolable)",
    coreParadox:
      "The holiness vocabulary can mark God, people, times, places, and objects as holy while joining ritual boundaries, ethical conduct, communal identity, and divine presence.",
    summary:
      "The Hebrew Bible applies q-d-š vocabulary to God and to consecrated people, objects, places, and times. Its uses include ritual and ethical demands as well as scenes of dangerous proximity to the sanctuary, such as Leviticus 10 and 2 Samuel 6. The Septuagint commonly uses hagios for this word group, and New Testament texts apply the same Greek vocabulary to God, the Spirit, communities, and temple imagery. That continuity is more precise than a simple shift from lethal otherness to morality.",
    whyItMatters:
      "A definition limited to private moral strictness misses cultic, communal, and relational uses of 'holy'. Isaiah 6, Leviticus 19, and 1 Corinthians 3 illustrate different emphases that should be held together rather than reduced to one essence.",
    stages: [
      {
        era: "Levitical Tabernacle & Temple Cult",
        century: "first millennium BCE (textual dates debated)",
        language: "Biblical Hebrew",
        term: "קָדוֹשׁ / קֹדֶשׁ",
        transliteration: "qāḏôš / qōḏeš",
        literalMeaning: "Holy, sacred, consecrated, set apart",
        theologicalShift:
          "God is called holy, and biblical texts also call people, days, places, offerings, vestments, and vessels holy in relation to divine command and presence. The precise balance of ritual status and ethical conduct varies by passage.",
        primaryWitnesses: [
          {
            ref: "Isaiah 6:3",
            text: "קָדוֹשׁ קָדוֹשׁ קָדוֹשׁ יְהוָה צְבָאוֹת מְלֹא כָל־הָאָרֶץ כְּבוֹדוֹ",
            historicalContext: "The threefold acclamation in Isaiah's throne-room vision.",
          },
          {
            ref: "Leviticus 19:2",
            text: "קְדֹשִׁים תִּהְיוּ כִּי קָדוֹשׁ אֲנִי יְהוָה אֱלֹהֵיכֶם",
            historicalContext: "The covenantal imperative: You shall be holy, for I am holy.",
          },
        ],
      },
      {
        era: "Koine Greek Septuagint & New Testament",
        century: "c. 250 BCE – 95 CE",
        language: "Koine Greek",
        term: "ἅγιος / οἱ ἅγιοι",
        transliteration: "hagios / hoi hagioi",
        literalMeaning: "Consecrated, set apart, the saints",
        theologicalShift:
          "Early Christian letters address communities as 'holy ones', and 1 Corinthians depicts the community as God's temple. These uses extend earlier communal and sanctuary language rather than demonstrating an abrupt democratization caused by translation.",
        primaryWitnesses: [
          {
            ref: "1 Corinthians 3:16–17",
            text: "ὁ γὰρ ναὸς τοῦ θεοῦ ἅγιός ἐστιν, οἵτινές ἐστε ὑμεῖς",
            historicalContext: "For the temple of God is holy, and that temple you are.",
          },
          {
            ref: "1 Peter 1:15–16",
            text: "κατὰ τὸν καλέσαντα ὑμᾶς ἅγιον καὶ αὐτοὶ ἅγιοι ἐν πάσῃ ἀναστροφῇ γενήθητε",
            historicalContext: "An adaptation of the Levitical holiness refrain applied to Christian conduct.",
          },
        ],
      },
    ],
    divergenceTraps: [
      "Compare moral, ritual, spatial, and communal uses instead of reducing holiness to one category.",
      "Read narratives of dangerous sanctuary contact in their literary and legal settings rather than treating holiness as a physical substance.",
      "Note that New Testament communities are called hagioi while asking how that designation relates to Israel's earlier communal holiness.",
    ],
  },
  {
    id: "goel-redeemer",
    title: "Go'el / Lytrōtēs / Redemptor (Redemption and Kinship)",
    hebrewTerm: "גֹּאֵל (gō’ēl)",
    greekTerm: "λυτρωτής (lytrōtēs) / ἀπολύτρωσις",
    latinTerm: "redemptor (redeemer)",
    coreParadox:
      "Kin-based redemption, property recovery, blood-avenger law, divine deliverance, and New Testament ransom language overlap without forming one automatic legal formula.",
    summary:
      "Hebrew gōʾēl language covers related roles whose requirements depend on the legal setting: Leviticus 25 discusses recovery of family land and persons, while Numbers 35 regulates the avenger of blood through asylum and adjudication. In Ruth, Boaz acts only after a nearer redeemer declines. Job 19's living gōʾēl is a hoped-for vindicator whose identity is disputed. Greek redemption terms add ransom and release associations, but translation alone does not prove a one-directional semantic shift from kinship to a slave market.",
    whyItMatters:
      "Christian interpreters often connect Hebrew kinship and divine-redemption texts with Mark's ransom saying, Hebrews' shared-flesh language, and Pauline redemption. Those connections are theological readings to document, not a legal requirement stated by the lexeme itself.",
    stages: [
      {
        era: "Hebrew Legal, Narrative, & Poetic Texts",
        century: "first millennium BCE (textual dates debated)",
        language: "Biblical Hebrew",
        term: "גֹּאֵל / גְּאֻלָּה",
        transliteration: "gō’ēl / gə’ullāh",
        literalMeaning: "Kinsman-redeemer, claimant, avenger of blood",
        theologicalShift:
          "Exodus and prophetic texts apply the verb 'redeem' to YHWH's deliverance of Israel. Describing that use through the analogy of a near kinsman can illuminate the metaphor, but Exodus 6:6 does not state that God held a literal clan office.",
        primaryWitnesses: [
          {
            ref: "Exodus 6:6",
            text: "וְגָאַלְתִּי אֶתְכֶם בִּזְרוֹעַ נְטוּיָה וּבִשְׁפָטִים גְּדֹלִים",
            historicalContext: "I will redeem you with an outstretched arm and great acts of judgment.",
          },
          {
            ref: "Job 19:25",
            text: "וַאֲנִי יָדַעְתִּי גֹּאֲלִי חָי וְאַחֲרוֹן עַל־עָפָר יָקוּם",
            historicalContext: "Job's expectation of a living vindicator; interpreters dispute whether the figure is human, divine, or eschatological.",
          },
        ],
      },
      {
        era: "Koine Greek Septuagint & New Testament Writings",
        century: "c. 250 BCE – 95 CE",
        language: "Koine Greek",
        term: "λυτρωτής / ἀπολύτρωσις",
        transliteration: "lytrōtēs / apolytrōsis",
        literalMeaning: "Redeemer, ransom, release, redemption",
        theologicalShift:
          "Mark 10:45 uses ransom language for the Son of Man's life, and Ephesians 1:7 connects redemption through blood with forgiveness. Later theories specify how that imagery works, but these verses do not name a payment recipient or by themselves define the scope as every human being.",
        primaryWitnesses: [
          {
            ref: "Mark 10:45",
            text: "δοῦναι τὴν ψυχὴν αὐτοῦ λύτρον ἀντὶ πολλῶν",
            historicalContext: "The Son of Man giving His life as a ransom in exchange for many.",
          },
          {
            ref: "Ephesians 1:7",
            text: "ἐν ᾧ ἔχομεν τὴν ἀπολύτρωσιν διὰ τοῦ αἵματος αὐτοῦ",
            historicalContext: "In whom we have redemption through His blood, the forgiveness of trespasses.",
          },
        ],
      },
    ],
    divergenceTraps: [
      "Distinguish the legal qualifications for each gōʾēl setting before using kinship as an argument about incarnation.",
      "Read the avenger-of-blood rules together with their limits, including cities of refuge and communal judgment in Numbers 35.",
      "Compare financial, familial, political, and theological redemption metaphors without reducing them to one transaction model.",
    ],
  },
];

export function getAllDiachronicConcepts(): DiachronicConcept[] {
  return DIACHRONIC_CONCEPTS;
}

export function getDiachronicConceptById(id: string): DiachronicConcept | undefined {
  return DIACHRONIC_CONCEPTS.find((c) => c.id === id);
}

export function searchDiachronicConcepts(query: string): DiachronicConcept[] {
  const q = query.trim().toLowerCase();
  if (!q) return DIACHRONIC_CONCEPTS;

  return DIACHRONIC_CONCEPTS.filter(
    (c) =>
      c.id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.hebrewTerm.toLowerCase().includes(q) ||
      c.greekTerm.toLowerCase().includes(q) ||
      c.latinTerm.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      c.stages.some(
        (s) =>
          s.term.toLowerCase().includes(q) ||
          s.transliteration.toLowerCase().includes(q) ||
          s.theologicalShift.toLowerCase().includes(q),
      ),
  );
}

export function generateDiachronicDossier(concept: DiachronicConcept): string {
  const lines: string[] = [];

  lines.push(`# Diachronic Semantic Comparison: ${concept.title}`);
  lines.push("");
  lines.push(`> **Corpus Provenance**: Garo Vartabedian Classical Scholarship Platform.`);
  lines.push(`> **Linguistic Scope**: Selected Biblical Hebrew, Septuagint Greek, Second Temple Jewish, early Christian, and Latin witnesses.`);
  lines.push(`> **Source Boundary**: Hosted texts and editorial notes are labeled separately; verify manuscript claims against the cited critical editions.`);
  lines.push("");

  lines.push(`## 1. The Core Semantic Question`);
  lines.push(concept.coreParadox);
  lines.push("");

  lines.push(`## 2. Overview & Historical Significance`);
  lines.push(concept.summary);
  lines.push("");
  lines.push(`**Why This Comparison Matters Today**: ${concept.whyItMatters}`);
  lines.push("");

  lines.push(`## 3. Selected Witnesses and Reception Stages`);
  lines.push("");

  for (let i = 0; i < concept.stages.length; i++) {
    const s = concept.stages[i];
    lines.push(`### Era ${i + 1}: ${s.era} (${s.century})`);
    lines.push(`- **Language**: ${s.language}`);
    lines.push(`- **Term**: \`${s.term}\` (*${s.transliteration}*)`);
    lines.push(`- **Literal Semitic / Classical Sense**: "${s.literalMeaning}"`);
    lines.push(`- **Textual / Reception Note**: ${s.theologicalShift}`);
    lines.push("");
    lines.push(`**Cited Primary-Text Witnesses**:`);
    for (const pw of s.primaryWitnesses) {
      lines.push(`- **${pw.ref}**: \`${pw.text}\` — *${pw.historicalContext}*`);
    }
    lines.push("");
  }

  lines.push(`## 4. Interpretive Questions & Translation Checks`);
  for (const trap of concept.divergenceTraps) {
    lines.push(`- ⚠️ ${trap}`);
  }
  lines.push("");

  lines.push(`## 5. NotebookLM Dialectical Audio Overview Prompt`);
  lines.push(
    `Create a source-critical discussion of ${concept.title}. Host 1 compares the attested senses in the cited Semitic passages. Host 2 tests proposed Greek and Latin translation effects against the cited contexts and later reception, clearly distinguishing lexical evidence from historical influence and theological interpretation. Use this dossier as a starting set of evidence, flag disputed claims, and verify quotations, dates, and manuscript assertions in appropriate editions before presenting them as facts.`,
  );
  lines.push("");
  lines.push(`---`);
  lines.push(`*Source note: Hosted text excerpts and editorial historical notes are distinct. Verify the notes against the cited works and critical editions before reuse.*`);

  return lines.join("\n");
}
