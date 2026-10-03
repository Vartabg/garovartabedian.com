/**
 * Jesus Universal NotebookLM Research Dossier Engine.
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

export type JesusDossierCategory =
  | "historical-attestation"
  | "messianic-prophecy"
  | "synoptic-problem"
  | "christology-titles"
  | "passion-resurrection";

export type JesusDossierPreset = {
  id: string;
  title: string;
  category: JesusDossierCategory;
  query: string;
  description: string;
  summary: string;
  historicalSignificance: string;
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

export type JesusNotebookLMDossier = {
  title: string;
  targetType: "preset" | "passage" | "topic";
  markdown: string;
  audioHostPrompt: string;
  sourceEntryCount: number;
  wordCount: number;
  preset?: JesusDossierPreset;
};

export const JESUS_DOSSIER_PRESETS: JesusDossierPreset[] = [
  {
    id: "testimonium-flavianum",
    title: "The Testimonium Flavianum: Received Greek Text and Later Arabic/Syriac Forms",
    category: "historical-attestation",
    query: "Josephus Antiquities 18.3.3",
    description:
      "Compares the received Greek form of Antiquities 18.3.3 with much later Arabic and Syriac forms and with Origen's statement that Josephus did not accept Jesus as Christ.",
    summary:
      "The received Greek Testimonium contains overtly Christian clauses that many scholars regard as interpolation or editing. Agapius and Michael the Syrian transmit much later Arabic and Syriac forms with qualified Christ language; their relationship to Josephus's original text, a shared Syriac source, and Eusebius remains disputed. Many scholars accept some Josephan core, but its exact wording is not recoverable by simply substituting the later forms.",
    historicalSignificance:
      "The passage is important evidence for the transmission and reception of Josephus's notice about Jesus. Its received wording, possible Josephan core, and later forms must be distinguished rather than treated as independent confirmation of one reconstructable original.",
    textualDivergence: {
      keyVerse: "Antiquities of the Jews 18.3.3",
      originalRef: "JOSEPHUS_AJ_18_3_3",
      readingDifferences: [
        {
          witness: "Received Greek form (Whiston / Eusebius HE 1.11)",
          reading: "ὁ Χριστὸς οὗτος ἦν (He was the Christ / Messiah)",
          explanation:
            "This unconditional confession is one of the clauses many scholars regard as Christian interpolation or editing; Origen's statement complicates the received wording without recovering Josephus's exact text.",
        },
        {
          witness: "Arabic Chronicle of Agapius of Hierapolis (Kitab al-Unwan, 10th c.)",
          reading: "He was perhaps the Messiah (wa-la'allahu kana al-masih)",
          explanation:
            "Tenth-century Arabic paraphrase in a Christian chronicle; useful for transmission history, not an independent manuscript of Antiquities.",
        },
        {
          witness: "Syriac Chronicle of Michael the Syrian (12th c.)",
          reading: "He was believed to be the Christ (methhasheb hwa d-mshikha hwa)",
          explanation:
            "Twelfth-century Syriac chronicle probably related to Agapius through a common source; it does not independently demonstrate an earlier Josephus text.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "Flavius Josephus, Antiquities of the Jews 18.3.3",
        date: "c. AD 93–94",
        period: "First-Century Jewish Historiography",
        excerpt:
          "Now there was about this time Jesus, a wise man, if it be lawful to call him a man; for he was a doer of wonderful works, a teacher of such men as receive the truth with pleasure. He drew over to him both many of the Jews and many of the Gentiles. He was [the] Christ. And when Pilate, at the suggestion of the principal men amongst us, had condemned him to the cross, those that loved him at the first did not forsake him...",
        analysis:
          "The received form is central to the textual debate, but its overtly Christian clauses require source-critical evaluation.",
      },
      {
        source: "Origen of Alexandria, Contra Celsum 1.47",
        date: "c. AD 248",
        period: "Ante-Nicene Patristic",
        excerpt:
          "Now this writer [Josephus], although not believing in Jesus as the Christ, in seeking for the cause of the fall of Jerusalem and the destruction of the temple, ought to have said that the conspiracy against Jesus was the cause of these calamities...",
        analysis:
          "Origen says Josephus did not accept Jesus as Christ; this bears on the received confession but does not prove what Antiquities 18 in Origen's copy contained.",
      },
      {
        source: "Jerome, De Viris Illustribus (On Illustrious Men) §13",
        date: "c. AD 392",
        period: "Early Western Patristic",
        excerpt:
          "Josephus writes: 'He was believed to be Christ' (credebatur esse Christus).",
        analysis:
          "Jerome's credebatur esse Christus may preserve a variant or reflect his paraphrase; its relationship to the other forms is disputed.",
      },
    ],
    dialecticalPrompts: [
      "What can the late Agapius and Michael forms contribute to transmission history, and what can they not establish about Josephus's original wording?",
      "Why would an aristocratic Flavian court historian like Josephus choose to mention Jesus at all in his survey of Pilate's turbulent administration?",
      "How does Origen's statement bear on the received confession, and why does it not by itself reconstruct the text in his copy?",
    ],
    audioHostPrompt:
      "Historical-critical discussion of the Testimonium Flavianum. Compare the received Greek form, Origen's testimony, and the much later Arabic and Syriac forms. Distinguish evidence for transmission history from proposals about a Josephan core, and identify where the original wording remains disputed.",
  },
  {
    id: "messianic-servant-isaiah53",
    title: "The Suffering Servant & The Pierced One (Isaiah 52:13–53:12, Psalm 22 & Dead Sea Scroll 1QIsaᵃ)",
    category: "messianic-prophecy",
    query: "Isaiah 53:1-12",
    description:
      "Compares Isaiah 53 and Psalm 22 across the Great Isaiah Scroll, the Masoretic tradition, the Old Greek tradition, and the disputed Judean Desert Psalm fragment.",
    summary:
      "1QIsaᵃ shows that a substantially similar Isaiah 53 text existed before Christianity, while also preserving variants. Its 'light' reading at 53:11 is supported by other witnesses and the Greek tradition, but calling it the authorial original or a resurrection prediction is interpretation. The Judean Desert 5/6ḤevPs manuscript (c. AD 50–100) appears to read כארו; the exact spelling, lexeme, and translation remain debated, so it does not by itself settle Psalm 22:16.",
    historicalSignificance:
      "These witnesses document early textual forms used in later Jewish and Christian interpretation. They support close comparison while leaving the Psalm 22 reading and the identity and function of Isaiah's servant open to continuing debate.",
    textualDivergence: {
      keyVerse: "Psalm 22:16 & Isaiah 53:11",
      originalRef: "PSA 22:16",
      readingDifferences: [
        {
          witness: "Judean Desert manuscript 5/6ḤevPs (c. AD 50–100)",
          reading: "The damaged fragment appears to read כארו at the disputed word; consult a diplomatic edition for the full line.",
          explanation:
            "This reading aligns more readily with the Old Greek digging verb than MT כארי, but its interpretation and the earliest Hebrew form remain disputed.",
        },
        {
          witness: "Old Greek Psalms (Rahlfs 1935 / lxx-morph)",
          reading: "ὤρυξαν χεῖράς μου καὶ πόδας μου ('they pierced my hands and my feet')",
          explanation:
            "The Old Greek uses a digging verb; English renderings such as 'pierced' reflect interpretation of that Greek and its Hebrew Vorlage.",
        },
        {
          witness: "Masoretic Text (MT / Codex Leningradensis, AD 1008)",
          reading: "כָּאֲרִי יָדַי וְרַגְלָי (ka'ari yaday veraglay — 'like a lion my hands and my feet')",
          explanation:
            "A difficult reading, 'like a lion, my hands and feet'; its history is debated.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "Great Isaiah Scroll (1QIsaᵃ, Qumran Cave 1)",
        date: "c. 125–100 BC",
        period: "Dead Sea Scrolls / Second Temple Hebrew",
        excerpt:
          "Normalized Hebrew reflecting the 1QIsaᵃ 'light' reading at Isaiah 53:11; consult a diplomatic transcription for the unpointed manuscript text.",
        analysis:
          "The 'light' reading has support in 1QIsaᵃ and other witnesses. Its textual priority and theological force require argument rather than assumption.",
      },
      {
        source: "1 Clement 16:1–14",
        date: "c. AD 96",
        period: "Apostolic Fathers",
        excerpt:
          "For Christ is of those who are humble-minded, and not of those who exalt themselves over His flock... 'Lord, who has believed our report? And to whom is the arm of the Lord revealed?... He was wounded for our transgressions, and bruised for our iniquities...'",
        analysis:
          "Clement of Rome quotes Isaiah 53 extensively and applies the servant's humility and suffering to Christ.",
      },
      {
        source: "Justin Martyr, Dialogue with Trypho §13",
        date: "c. AD 155",
        period: "Ante-Nicene Apologist",
        excerpt:
          "Isaiah did not send you to a bath, there to wash away murder and other sins, which not even all the water of the ocean could cleanse; but, as may be supposed, it was that of old to which he referred, when he said: 'He was led as a sheep to the slaughter...'",
        analysis:
          "Justin presents a literary dialogue with Trypho over Christian and Jewish readings of prophetic passages, including the servant material.",
      },
    ],
    dialecticalPrompts: [
      "What do 1QIsaᵃ and 5/6ḤevPs contribute to these textual questions, and which questions remain unresolved?",
      "What semantic ranges do asham, nasa, and sabal have here, and how are they used in competing individual, corporate, and substitutionary readings?",
      "How did individual, messianic, and corporate Jewish readings of the servant develop?",
    ],
    audioHostPrompt:
      "Historical-critical discussion of Isaiah 53 and Psalm 22. Compare the Great Isaiah Scroll, 5/6ḤevPs, the Masoretic tradition, and the Old Greek tradition while distinguishing manuscript readings from translations and theological interpretations. Include individual and corporate readings of the servant.",
  },
  {
    id: "synoptic-problem-q",
    title: "The Synoptic Problem: Greek Agreement, Markan Priority, Q, and Farrer",
    category: "synoptic-problem",
    query: "Matthew 9:1-8, Mark 2:1-12, Luke 5:17-26",
    description:
      "Compares word-level Greek agreements and differences in the Synoptic Gospels across leading models of literary dependence.",
    summary:
      "The close Greek agreement among Matthew, Mark, and Luke strongly supports literary dependence. Markan priority is the dominant modern model, while the relationship of Matthew and Luke is disputed among Two-Source/Q, Farrer, and other hypotheses. The double tradition is evidence those models seek to explain; it does not itself reinforce Markan priority.",
    historicalSignificance:
      "The Synoptic Problem shows that Gospel composition involved literary relationships alongside oral and written traditions. The direction and number of those relationships remain matters of scholarly debate.",
    textualDivergence: {
      keyVerse: "Mark 2:10 || Matthew 9:6 || Luke 5:24",
      originalRef: "MRK 2:10",
      readingDifferences: [
        {
          witness: "Mark 2:10–11 (SBLGNT)",
          reading: "ἵνα δὲ εἰδῆτε ὅτι ἐξουσίαν ἔχει ὁ υἱὸς τοῦ ἀνθρώπου ἀφιέναι ἁμαρτίας ἐπὶ τῆς γῆς— λέγει τῷ παραλυτικῷ· Σοὶ λέγω, ἔγειρε...",
          explanation:
            "Mark shifts from Jesus's speech to a narrator's report that he speaks to the paralytic.",
        },
        {
          witness: "Matthew 9:6 (SBLGNT)",
          reading: "ἵνα δὲ εἰδῆτε ὅτι ἐξουσίαν ἔχει ὁ υἱὸς τοῦ ἀνθρώπου ἐπὶ τῆς γῆς ἀφιέναι ἁμαρτίας— τότε λέγει τῷ παραλυτικῷ· Ἐγερθεὶς ἆρον...",
          explanation:
            "Matthew has a closely related clause with different word order and the addition of τότε; its relationship to Mark is evaluated within competing Synoptic models.",
        },
        {
          witness: "Luke 5:24 (SBLGNT)",
          reading: "ἵνα δὲ εἰδῆτε ὅτι ὁ υἱὸς τοῦ ἀνθρώπου ἐξουσίαν ἔχει ἐπὶ τῆς γῆς ἀφιέναι ἁμαρτίας— εἶπεν τῷ παραλελυμένῳ· Σοὶ λέγω, ἔγειρε...",
          explanation:
            "Luke uses a closely related structure but substitutes a perfect passive participial expression for Mark's noun.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "Papias of Hierapolis, Exposition of the Oracles of the Lord (in Eusebius HE 3.39)",
        date: "c. AD 110",
        period: "Sub-Apostolic Testimony",
        excerpt:
          "Mark having become the interpreter of Peter, wrote down accurately whatsoever he remembered. It was not, however, in exact order that he related the sayings or deeds of Christ... Matthew put together the oracles [logia] in the Hebrew language, and each one interpreted them as best he could.",
        analysis:
          "Papias is an early reception report preserved by Eusebius; it records composition traditions but is not direct evidence for modern source hypotheses.",
      },
      {
        source: "Irenaeus of Lyons, Adversus Haereses 3.1.1",
        date: "c. AD 180",
        period: "Ante-Nicene Patristic",
        excerpt:
          "Matthew also issued a written Gospel among the Hebrews in their own dialect, while Peter and Paul were preaching at Rome, and laying the foundations of the Church. After their departure, Mark, the disciple and interpreter of Peter, did also hand down to us in writing what had been preached by Peter. Luke also, the companion of Paul, recorded in a book the Gospel preached by him.",
        analysis:
          "Irenaeus lists traditions about Gospel composition; this paragraph should not be made to establish every question about the fourfold canon or literary dependence.",
      },
      {
        source: "Augustine of Hippo, De Consensu Evangelistarum (Harmony of the Gospels) 1.2",
        date: "c. AD 400",
        period: "Classical Patristic Hermeneutics",
        excerpt:
          "Mark follows Matthew closely, and looks like his attendant and abbreviator (pedissequus et breviator).",
        analysis:
          "Augustine represents a historically influential Matthean-priority model; modern scholarship generally favors Markan priority while continuing to debate competing models.",
      },
    ],
    dialecticalPrompts: [
      "How do the close agreements and meaningful differences in Mark 2:10, Matthew 9:6, and Luke 5:24 support literary dependence without excluding oral tradition?",
      "What evidence leads modern scholars to hypothesize the Q document for the Double Tradition, and how does the alternative Farrer-Goulder hypothesis challenge it?",
      "How should Luke's use of a participial expression in place of Mark's noun be weighed alongside broader stylistic evidence?",
    ],
    audioHostPrompt:
      "Scholarly debate on the Synoptic Problem and gospel textual relationships. Host 1 champions Markan priority and the Two-Source Hypothesis, examining Greek verbatim sequences, editorial fatigue, and the Q sayings material. Host 2 acts as the skeptical historical critic assessing the Farrer hypothesis, Papias's testimony, and Augustine's view. Focus on the word-level Greek evidence and ancient composition methods.",
  },
  {
    id: "resurrection-minimal-facts",
    title: "Early Resurrection Tradition in 1 Corinthians 15:3–8",
    category: "passion-resurrection",
    query: "1 Corinthians 15:3-8",
    description:
      "Examines the early tradition Paul preserves in 1 Corinthians 15:3–8, its transmission language, manuscript witnesses, and later reception.",
    summary:
      "Most scholars identify traditional material in 1 Corinthians 15:3–7 that predates the letter; proposals often place at least part of it in the 30s, but the extent of the formula, its provenance, and when Paul received it are debated. The passage is the earliest surviving written list of claimed appearances.",
    historicalSignificance:
      "The passage is an early and influential witness to resurrection belief. It establishes what Paul reports and transmits while leaving the formula's precise date, shape, provenance, and relation to the Gospel narratives open to historical analysis.",
    textualDivergence: {
      keyVerse: "1 Corinthians 15:3–4",
      originalRef: "1CO 15:3-4",
      readingDifferences: [
        {
          witness: "1 Corinthians 15:3–5 (SBLGNT Greek text)",
          reading: "παρέδωκα γὰρ ὑμῖν ἐν πρώτοις, ὃ καὶ παρέλαβον, ὅτι Χριστὸς ἀπέθανεν ὑπὲρ τῶν ἁμαρτιῶν ἡμῶν κατὰ τὰς γραφάς ... καὶ ὅτι ὤφθη Κηφᾷ, εἶτα τοῖς δώδεκα",
          explanation:
            "P46, Codex Sinaiticus, and Codex Vaticanus witness the passage. This normalized SBLGNT line is supplied for comparison; it is not a diplomatic transcription or a claim that the manuscripts have distinct readings here. The name Cephas may inform provenance arguments but does not fix where or when the tradition formed.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "Apostle Paul, 1 Corinthians 15:3–8",
        date: "c. AD 53–55 (preserving earlier tradition of debated date and provenance)",
        period: "Earliest Christian Epistolary Record",
        excerpt:
          "For I delivered to you first of all that which I also received: that Christ died for our sins according to the Scriptures, that he was buried, that he was raised on the third day according to the Scriptures, and that he appeared to Cephas, then to the twelve...",
        analysis:
          "Paul's letter is the earliest surviving Christian writing to list claimed appearances; it reports what Paul says he received and transmitted without resolving the tradition's precise date or provenance.",
      },
      {
        source: "Ignatius of Antioch, Epistle to the Smyrnaeans §3",
        date: "c. AD 110",
        period: "Apostolic Fathers",
        excerpt:
          "For I know that after His resurrection also He was still in the flesh, and I believe that He is so now. When, for instance, He came to those who were with Peter, He said to them, 'Lay hold, handle Me, and see that I am not a bodiless demon.' And immediately they touched Him, and believed...",
        analysis:
          "Ignatius attests early embodied-resurrection belief against Docetic readings; the passage does not independently recover apostolic memories.",
      },
      {
        source: "Justin Martyr, Dialogue with Trypho §108",
        date: "c. AD 155",
        period: "Ante-Nicene Apologist",
        excerpt:
          "You have sent chosen and ordained men throughout the whole world to proclaim that a godless and lawless heresy had sprung from one Jesus, a Galilean deceiver, whom we crucified, but his disciples stole him by night from the tomb...",
        analysis:
          "Justin presents a mid-second-century Christian polemic that may depend on Matthew; it is not independent confirmation of an original Jewish concession about an empty tomb.",
      },
    ],
    dialecticalPrompts: [
      "What does Paul's language of receiving and delivering indicate about transmission, and why does it not supply a precise date or place?",
      "How should Matthew's stolen-body polemic and Justin's later use of it be weighed in arguments about the empty-tomb tradition?",
      "What can Paul's list establish about the claims concerning James and Paul, and which later biographical conclusions require separate evidence?",
    ],
    audioHostPrompt:
      "Historical-critical discussion of the early resurrection tradition in 1 Corinthians 15. Compare proposals about its date and provenance, its claimed appearances, and the distinct empty-tomb traditions in the Gospels. State the limits of each source and present competing explanations without assuming an apologetic package.",
  },
  {
    id: "son-of-man-daniel7",
    title: "The 'Son of Man' Title (Bar Enosh) & High Christology (Daniel 7, 1 Enoch & Mark 14)",
    category: "christology-titles",
    query: "Daniel 7:13-14, Mark 14:61-64",
    description:
      "Examines Gospel Son of Man sayings alongside Daniel 7, the Parables of Enoch, 4 Ezra, and the debated trial scene in Mark 14.",
    summary:
      "The Gospel 'Son of Man' sayings draw on Daniel 7 and remain central to debates about Jesus tradition and early Christology. Daniel's one-like-a-human figure has corporate, angelic, and individual interpretations; Mark 14 combines Daniel 7 with Psalm 110, while the historical status and intended force of the trial scene remain debated.",
    historicalSignificance:
      "The material shows how Danielic language contributed to early Christology, while the title's authenticity, referent, and force must be argued passage by passage.",
    textualDivergence: {
      keyVerse: "Daniel 7:13–14 & Mark 14:62",
      originalRef: "DAN 7:13",
      readingDifferences: [
        {
          witness: "Biblical Aramaic Text (Masoretic MT / Daniel 7:13–14)",
          reading: "וַאֲרוּ עִם־עֲנָנֵי שְׁמַיָּא כְּבַר אֱנָשׁ אָתֵה הֲוָא... וְכֹל עַמְמַיָּא אֻמַיָּא וְלִשָּׁנַיָּא לֵהּ יִפְלְחוּן",
          explanation:
            "The figure comes with the clouds and receives service. Pelach has cultic or divine-service usage in Daniel, but the verb alone does not settle the figure's identity or ontology.",
        },
        {
          witness: "Old Greek Daniel in Papyrus 967 (early third century AD)",
          reading: "καὶ ὡς υἱὸς ἀνθρώπου ἤρχετο, καὶ ὡς παλαιὸς ἡμερῶν παρῆν...",
          explanation:
            "Papyrus 967 is an early-third-century manuscript of an older Greek translation. The syntax and relation between the humanlike figure and the Ancient of Days are textually disputed and do not establish one early Jewish interpretation.",
        },
        {
          witness: "Mark 14:62 (SBLGNT)",
          reading: "ὁ δὲ Ἰησοῦς εἶπεν· Ἐγώ εἰμι, καὶ ὄψεσθε τὸν υἱὸν τοῦ ἀνθρώπου ἐκ δεξιῶν καθήμενον τῆς δυνάμεως καὶ ἐρχόμενον μετὰ τῶν νεφελῶν τοῦ οὐρανοῦ.",
          explanation:
            "Mark combines Daniel 7 cloud imagery with Psalm 110 enthronement language; the scene's historical status and the charge's intended force are debated.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "1 Enoch 46:1–3 (R. H. Charles English translation, hosted 1913 edition)",
        date: "Around the turn of the era or first century AD (date debated)",
        period: "Second Temple Apocalyptic Literature",
        excerpt:
          "There I saw one who had a 'Head of Days,' and His head was white like wool. And with Him was another whose countenance had the appearance of a man, and his face was full of graciousness, like one of the holy angels. And I asked the angel... 'Who is this, and whence is he, and why does he go with the Head of Days?' And he answered: 'This is the Son of Man who hath righteousness... who shall loosen the reins of the strong and break the teeth of the sinners...'",
        analysis:
          "The Parables depict an exalted eschatological judge. Their date and the figure's preexistence remain debated, and the Parables are absent from the surviving Qumran Enoch fragments.",
      },
      {
        source: "4 Ezra 13:1–4 (2 Esdras)",
        date: "c. AD 90–100",
        period: "Post-70 Jewish Apocalypse",
        excerpt:
          "Editorial summary: the vision depicts a humanlike deliverer rising from the sea and moving with heaven's clouds. The Latin witness has a lacuna in this part of the scene, so modern editions consult other ancient versions and differ in how they present its wording.",
        analysis:
          "4 Ezra 13 is a post-70 witness to a humanlike deliverer associated with cloud imagery.",
      },
      {
        source: "Babylonian Talmud, Sanhedrin 38b",
        date: "Late antique redaction reporting a debate attributed to Akiva and Yosi",
        period: "Rabbinic Tradition",
        excerpt:
          "Editorial summary: the late redaction attributes to Rabbi Akiva a messianic interpretation of the two thrones in Daniel 7 and attributes to Rabbi Yosi a rebuke and competing interpretation.",
        analysis:
          "The late redaction attributes competing interpretations of Daniel 7's thrones to earlier rabbis; it is not direct evidence for their exact second-century wording.",
      },
    ],
    dialecticalPrompts: [
      "How does the title's Gospel distribution inform authenticity arguments, and what limits those arguments?",
      "What range of service does pelach express in Daniel, and why does the verb not settle the figure's ontology by itself?",
      "How does Mark 14 combine Daniel 7 and Psalm 110, and what historical and literary questions surround the trial scene?",
    ],
    audioHostPrompt:
      "Historical and linguistic discussion of the Son of Man problem. Analyze Daniel 7, the Gospel sayings, the debated date and interpretation of the Parables of Enoch, 4 Ezra 13, and the literary and historical questions around Mark's trial scene.",
  },
  {
    id: "roman-historians-tacitus-pliny",
    title: "Roman and Other Non-Christian Witnesses (Tacitus, Pliny, Suetonius, and Mara)",
    category: "historical-attestation",
    query: "Tacitus Annals 15.44, Pliny Letters 10.96",
    description:
      "Examines Roman evidence for Christus and early Christian practice alongside disputed identifications in Suetonius and Mara bar Serapion.",
    summary:
      "Tacitus reports Christus's execution under Pilate and the movement's presence in Rome; Pliny documents Christian practice and Roman procedure in Bithynia-Pontus c. 112; Suetonius's 'Chrestus' is often connected with Christ but the identification is disputed; Mara's unnamed 'wise king of the Jews' is often identified with Jesus, but both date and identification remain debated.",
    historicalSignificance:
      "These records illuminate Roman knowledge of Christians in Rome and Bithynia-Pontus. Their dates, genres, locations, and disputed identifications must be kept distinct.",
    textualDivergence: {
      keyVerse: "Tacitus Annals 15.44 & Pliny Letters 10.96",
      originalRef: "TACITUS_ANN_15_44",
      readingDifferences: [
        {
          witness: "Tacitus Annals 15.44 (Second Medicean Manuscript, 11th c.)",
          reading: "auctor nominis eius Christus Tiberio imperitante per procuratorem Pontium Pilatum supplicio adfectus erat...",
          explanation:
            "Tacitus calls Pilate a procurator rather than the epigraphically attested prefect; this may reflect common later terminology, imprecision, or another feature of the report.",
        },
        {
          witness: "Pliny the Younger, Epistulae 10.96 (to Trajan)",
          reading: "affirmabant autem hanc fuisse summam vel culpae suae vel erroris, quod essent soliti stato die ante lucem convenire, carmenque Christo quasi deo dicere secum invicem...",
          explanation:
            "Pliny says the group met on a stated day before dawn and reports the defendants' account of a hymn to Christ and an ethical pledge; he does not name Sunday or independently verify their ethics.",
        },
        {
          witness: "Suetonius, De Vita Caesarum: Claudius 25.4",
          reading: "Iudaeos impulsore Chresto assidue tumultuantes Roma expulit...",
          explanation:
            "Suetonius reports unrest associated with 'Chrestus.' A connection with Christ and Acts 18 is common but disputed.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "Tacitus, Annals 15.44",
        date: "c. AD 116",
        period: "Roman Senatorial Historiography",
        excerpt:
          "Consequently, to get rid of the report, Nero fastened the guilt and inflicted the most exquisite tortures on a class hated for their abominations, called Christians by the populace. Christus, from whom the name had its origin, suffered the extreme penalty during the reign of Tiberius at the hands of one of our procurators, Pontius Pilatus...",
        analysis:
          "Tacitus reports the execution and attests the movement in Rome under Nero; the passage does not date an immediate spread.",
      },
      {
        source: "Pliny the Younger, Letters 10.96 (to Emperor Trajan)",
        date: "c. AD 112",
        period: "Roman Imperial Correspondence",
        excerpt:
          "They affirmed the whole of their guilt, or their error, was, that they met on a stated day before it was light, and addressed a form of prayer [hymn] to Christ, as to a divinity, binding themselves by a solemn oath, not for the purposes of any wicked design, but never to commit any fraud, theft, or adultery...",
        analysis:
          "The correspondence documents Roman provincial procedure and reported Christian practice in Bithynia-Pontus around AD 112.",
      },
      {
        source: "Mara bar Serapion, Syriac Letter to his Son",
        date: "After AD 72, perhaps late first to third century (disputed)",
        period: "Syriac Moral-Philosophical Letter",
        excerpt:
          "For what advantage did the Athenians gain by the murder of Socrates... or the Samians by the burning of Pythagoras... or the Jews by the death of their wise King, since from that very time their kingdom was taken away from them? For with justice did God make a recompense to the wisdom of all three of them... but the wise King lived on in the new laws which he had enacted.",
        analysis:
          "The letter says Jews killed a wise king and that his laws endured. Identification with Jesus, the author's identity, and the letter's date are disputed.",
      },
    ],
    dialecticalPrompts: [
      "How does Tacitus's reference to 'procurator' Pontius Pilate compare with the 'Pilate Stone' found at Caesarea Maritima, which titles him 'Praefectus Iudaeae'?",
      "In Pliny's letter 10.96, what does the Latin phrase 'carmen Christo quasi deo dicere' reveal about the early christological worship of the Bithynian churches?",
      "What supports identifying Mara's unnamed wise king with Jesus, and what uncertainty remains about that identification and the letter's date?",
    ],
    audioHostPrompt:
      "Classical Roman history podcast investigating pagan witnesses to early Christianity. Host 1 acts as the Roman imperial historian analyzing Tacitus's sources, senatorial attitudes toward foreign 'superstitio', and the Neronian persecutions. Host 2 analyzes provincial governance under Pliny and Trajan, the legal mechanisms of persecution, and the Syriac testimony of Mara bar Serapion. Emphasize historical context and non-Christian perspectives.",
  },
  {
    id: "seven-sayings-cross",
    title: "The Seven Last Words from the Cross across Four Gospel Witnesses",
    category: "passion-resurrection",
    query: "Matthew 27:46, Luke 23:34, John 19:30",
    description:
      "Compares the later harmonized Seven Last Words collection with the distinct passion narratives and the textual question at Luke 23:34.",
    summary:
      "The traditional Seven Last Words is a later harmonized collection assembled from distinct Gospel passion narratives. Luke 23:34 is textually disputed; the other sayings also need witness-specific treatment rather than a claim of uniform stability.",
    historicalSignificance:
      "The collection is useful for comparing each Gospel's literary and theological presentation, provided that a later harmony is not mistaken for a single ancient source and textual variants are stated openly.",
    textualDivergence: {
      keyVerse: "John 19:30 & Mark 15:34",
      originalRef: "JHN 19:30",
      readingDifferences: [
        {
          witness: "John 19:30 (SBLGNT Greek text)",
          reading: "ὅτε οὖν ἔλαβεν τὸ ὄξος ὁ Ἰησοῦς εἶπεν· Τετέλεσται, καὶ κλίνας τὴν κεφαλὴν παρέδωκεν τὸ πνεῦμα.",
          explanation:
            "P66 attests this passage, but the line shown is normalized SBLGNT rather than a diplomatic transcription of the papyrus. Τετέλεσται means 'it has been completed' or 'it is finished.' Its perfect aspect does not encode 'forever,' and a special receipt-stamp or priestly meaning is not established by the form.",
        },
        {
          witness: "Luke 23:34 textual variant",
          reading: "The saying is omitted by P75, the first hand of Sinaiticus, Vaticanus, and several other witnesses, but included in many others and known to Irenaeus.",
          explanation:
            "Both the early omission and early patristic attestation matter; the direction and history of the variant remain disputed.",
        },
        {
          witness: "Matthew 27:46 (SBLGNT)",
          reading: "Ἠλὶ ἠλί, λεμὰ σαβαχθάνι; τοῦτ' ἔστιν· Θεέ μου θεέ μου, ἱνατί με ἐγκατέλιπες;",
          explanation:
            "Preserves a Semitic expression in Greek transliteration followed by a Greek translation for the reader, citing Psalm 22:1.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "Melito of Sardis, Peri Pascha (On the Pascha) §96",
        date: "c. AD 165",
        period: "Second-Century Christian Homiletics",
        excerpt:
          "He who hung the earth in place is hanged. He who fixed the heavens is fixed upon the cross. He who made all things fast is fastened to the tree. The Master is insulted. God is murdered. The King of Israel is slain by an Israelite hand...",
        analysis:
          "An early poetic theological meditation on the crucifixion; it should not be treated as direct evidence for all seven sayings.",
      },
      {
        source: "Irenaeus of Lyons, Against Heresies III.18.5",
        date: "c. AD 180",
        period: "Ante-Nicene Patristic",
        excerpt:
          "And for this reason He said upon the cross: 'Father, forgive them, for they know not what they do.' Showing that the Son of God is long-suffering and full of mercy, since He prayed even for those who crucified Him...",
        analysis:
          "Provides second-century attestation for Luke 23:34 but does not by itself prove originality or explain omissions as deliberate deletion.",
      },
      {
        source: "Tertullian, Against Praxeas ch. 30",
        date: "c. AD 210",
        period: "Early Latin Patristic",
        excerpt:
          "Tertullian discusses the cry of dereliction while arguing about the relation of Father, Son, flesh, and spirit.",
        analysis:
          "Early Latin theological exposition explaining Jesus's cry of dereliction within a trinitarian framework.",
      },
    ],
    dialecticalPrompts: [
      "How do the distinct passion narratives in Mark, Matthew, Luke, and John present the sayings from the cross?",
      "What is the textual and theological significance of the omission of Luke 23:34 ('Father, forgive them') in papyri P75 and early Alexandrian codices?",
      "What does τετέλεσται mean in John 19:30, and why should the modern 'paid in full' receipt story be distinguished from the attested verb form?",
    ],
    audioHostPrompt:
      "Historical-critical discussion of the traditional Seven Last Words. Distinguish the later harmony from each Gospel's narrative, examine the Luke 23:34 variant, and explain τετέλεσται without relying on the modern receipt-stamp story.",
  },
  {
    id: "temple-cleansing-sign",
    title: "The Temple Incident as a Prophetic Sign (Mark 11, Jeremiah 7, and John 2)",
    category: "historical-attestation",
    query: "Mark 11:15-18, John 2:13-22",
    description:
      "Historiographical investigation into Jesus's direct prophetic action in the Herodian temple, the chronological divergence between the Synoptics and John, and Dead Sea Scroll temple expectations.",
    summary:
      "The Gospels portray Jesus disrupting activity in the temple precincts as a prophetic sign. Many historians treat the incident as an important contributor to his arrest, while its scale, exact location, chronology, and relationship to the trial traditions remain debated.",
    historicalSignificance:
      "The incident connects prophetic criticism, the Herodian temple setting, and the Passion narratives, but it does not by itself establish every legal or causal step leading to Jesus's execution.",
    textualDivergence: {
      keyVerse: "Mark 11:17 || John 2:19",
      originalRef: "MRK 11:17",
      readingDifferences: [
        {
          witness: "Mark 11:17 (citing Isaiah 56:7 & Jeremiah 7:11)",
          reading: "Οὐ γέγραπται ὅτι Ὁ οἶκός μου οἶκος προσευχῆς κληθήσεται πᾶσιν τοῖς ἔθνεσιν; ὑμεῖς δὲ πεποιήκατε αὐτὸν σπήλαιον λῃστῶν.",
          explanation:
            "Mark's 'for all the nations' clause evokes Isaiah's universal temple vision; it does not by itself prove the incident's exact location within the complex.",
        },
        {
          witness: "Matthew 21:13 & Luke 19:46",
          reading: "Matthew and Luke omit 'for all the nations' from the Isaiah quotation.",
          explanation:
            "Both Matthew and Luke abbreviate the quotation to focus purely on the indictment 'you have made it a den of robbers.'",
        },
        {
          witness: "John 2:19 (SBLGNT)",
          reading: "ἀπεκρίθη Ἰησοῦς καὶ εἶπεν αὐτοῖς· Λύσατε τὸν ναὸν τοῦτον καὶ ἐν τρισὶν ἡμέραις ἐγερῶ αὐτόν.",
          explanation:
            "John's narrator interprets Jesus's body as the temple; broader claims about replacement of the cultus are theological interpretation.",
        },
      ],
    },
    ancientWitnesses: [
      {
        source: "4QFlorilegium (4Q174, Qumran Cave 4)",
        date: "c. 50–25 BC",
        period: "Dead Sea Scrolls / Qumran Sectarian Literature",
        excerpt:
          "Editorial summary: this fragment joins scriptural citations in an interpretation of the promised latter-days house and a disputed phrase often transliterated miqdash adam. Published translations vary in how they construe the fragmentary wording.",
        analysis:
          "The fragmentary phrase miqdash adam is translated in several ways. Claims that it predicts a spiritual community replacing Jerusalem require argument.",
      },
      {
        source: "Babylonian Talmud, Yoma 39b",
        date: "Babylonian Talmud, late antique compilation",
        period: "Rabbinic Tradition",
        excerpt:
          "Editorial summary: the late antique compilation reports a cluster of unfavorable temple signs beginning forty years before the sanctuary's destruction, including traditions about the Yom Kippur lot, a crimson strip, a lamp, and doors opening by themselves.",
        analysis:
          "Yoma 39b reports unfavorable signs beginning roughly forty years before the destruction in AD 70. It does not say sacrifice lost efficacy or connect the signs to Jesus.",
      },
      {
        source: "Flavius Josephus, Jewish War 6.5.3",
        date: "c. AD 75",
        period: "First-Century Historiography",
        excerpt:
          "At the festival of Pentecost, as the priests were going by night into the inner court of the temple... they felt a quaking, and heard a great noise, and after that they heard a sound as of a great multitude, saying, 'Let us remove hence'...",
        analysis:
          "Josephus reports portents before the temple's destruction; interpreting them as divine abandonment is an additional theological judgment.",
      },
    ],
    dialecticalPrompts: [
      "How have reform, prophetic-sign, and judgment readings been argued, and what does the narrative itself establish?",
      "How do historians evaluate the chronological difference between the Synoptics (temple cleansing during Passion Week) and John (temple cleansing at the beginning of ministry)?",
      "How do the Gospel trial narratives use the temple saying, and what limits historical reconstruction?",
    ],
    audioHostPrompt:
      "Historical-critical discussion of the Gospel temple incident. Examine the Herodian setting, Jeremiah 7 background, Synoptic and Johannine chronology, the role of temple sayings in the trial narratives, 4Q174, and the limits of historical reconstruction.",
  },
];

export function findJesusDossierPreset(
  target: string,
): JesusDossierPreset | undefined {
  const normalized = target.trim().toLowerCase();
  if (!normalized) return undefined;

  const exact = JESUS_DOSSIER_PRESETS.find(
    (preset) =>
      preset.id.toLowerCase() === normalized ||
      preset.title.toLowerCase().includes(normalized),
  );
  if (exact) return exact;

  const aliases: Array<[RegExp, string]> = [
    [/josephus|testimonium|agapius/, "testimonium-flavianum"],
    [/isaiah\s*53|suffering servant|psalm\s*22|pierced/, "messianic-servant-isaiah53"],
    [/synoptic problem|markan priority|two.source|\bq\b/, "synoptic-problem-q"],
    [/resurrection|minimal facts|1 corinthians\s*15|empty tomb/, "resurrection-minimal-facts"],
    [/son of man|daniel\s*7|bar enosh/, "son-of-man-daniel7"],
    [/tacitus|pliny|roman historians?|annals/, "roman-historians-tacitus-pliny"],
    [/seven sayings|words from the cross|cross sayings/, "seven-sayings-cross"],
    [/temple cleansing|moneychangers|temple sign/, "temple-cleansing-sign"],
  ];
  const matchedId = aliases.find(([pattern]) => pattern.test(normalized))?.[1];
  return JESUS_DOSSIER_PRESETS.find((preset) => preset.id === matchedId);
}

export function splitJesusSourceQueries(query: string): string[] {
  return query
    .split(/\s*(?:,|;|\|\|)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildJesusNotebookLMDossier(params: {
  target: string;
  canons?: Canons;
  primaryVerses?: {
    ref: string;
    original?: string;
    brenton?: string;
    drb?: string;
    kjv?: string;
    web?: string;
  }[];
  theologicalContext?: string;
}): JesusNotebookLMDossier {
  const { target, canons, primaryVerses = [], theologicalContext } = params;
  const hasText = (value: string | undefined): value is string =>
    Boolean(value?.trim());
  const resolvedVerses = primaryVerses.filter((verse) =>
    [verse.original, verse.brenton, verse.drb, verse.kjv, verse.web].some(hasText),
  );

  const cleanTarget = target.trim();
  const targetParts = splitJesusSourceQueries(cleanTarget);
  const parsedTargetRefs = canons
    ? targetParts.map((part) => parseScriptureQueryRef(part, canons))
    : [];
  const targetIsScriptureQuery =
    parsedTargetRefs.length > 0 && parsedTargetRefs.every(Boolean);
  const parsedRef = targetIsScriptureQuery && parsedTargetRefs.length === 1
    ? parsedTargetRefs[0]
    : null;
  const exactPreset = JESUS_DOSSIER_PRESETS.find(
    (preset) => preset.id.toLowerCase() === cleanTarget.toLowerCase(),
  );
  const presetMatch = exactPreset ?? (!targetIsScriptureQuery
    ? findJesusDossierPreset(cleanTarget)
    : undefined);

  const title = presetMatch
    ? presetMatch.title
    : targetIsScriptureQuery
      ? parsedRef
        ? `${canons?.books[parsedRef.book]?.name || parsedRef.book} ${parsedRef.chapter}${
          parsedRef.verse ? `:${parsedRef.verse}` : ""
        } (Historical Jesus & Classical Scholarship Dossier)`
        : `${cleanTarget} (Historical Jesus & Classical Scholarship Dossier)`
      : `Jesus Research Dossier: ${cleanTarget}`;

  const targetType: "preset" | "passage" | "topic" = presetMatch
    ? "preset"
    : targetIsScriptureQuery
      ? "passage"
      : "topic";

  const lines: string[] = [];

  // YAML Frontmatter for clean LLM source indexing
  lines.push(`---`);
  lines.push(`title: "${title.replace(/"/g, '\\"')}"`);
  lines.push(`corpus: "Garo Vartabedian Classical Scholarship Platform"`);
  lines.push(`world: "Jesus Christ"`);
  lines.push(`category: "${presetMatch ? presetMatch.category : "christology-historical-jesus"}"`);
  lines.push(`target_type: "${targetType}"`);
  lines.push(`grounding: "hosted Scripture from identified editions plus curated historical source notes"`);
  lines.push(`export_target: "Google NotebookLM / Audio Deep Dive"`);
  lines.push(`---`);
  lines.push("");

  lines.push(`# Research Dossier: ${title}`);
  lines.push("");
  lines.push(`> **Corpus Provenance**: Garo Vartabedian Classical Scholarship Platform · Jesus World.`);
  lines.push(`> **Source Standard**: Hosted Scripture lines are reproduced from identified editions under their recorded licenses. Historical source notes may summarize the named work and should be checked before quotation or publication.`);
  lines.push(`> **Designed for**: Google NotebookLM source ingestion and dialectical Audio Overview podcast generation.`);
  lines.push("");

  // 1. Executive Research Summary
  lines.push(`## 1. Executive Research Summary`);
  if (presetMatch) {
    lines.push(presetMatch.summary);
    lines.push("");
    lines.push(`### Historical & Textual Significance`);
    lines.push(presetMatch.historicalSignificance);
  } else if (theologicalContext) {
    lines.push(theologicalContext);
  } else if (targetIsScriptureQuery && resolvedVerses.length > 0) {
    lines.push(
      `This worksheet collates the hosted source editions that resolved for **${title}**. Only the editions shown in the text section below were loaded; use the named reader editions and source notes to verify the comparison.`,
    );
  } else if (targetIsScriptureQuery) {
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
      lines.push("");
    }
  }

  // 4. Historical witnesses and reception notes
  if (presetMatch && presetMatch.ancientWitnesses.length > 0) {
    lines.push(`## 4. Historical Witnesses & Early Reception Notes`);
    lines.push(
      `Curated excerpts and editorial summaries keyed to named Roman, Jewish, and early Christian works. Consult the cited work before quoting this wording:`,
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
      `1. **Historical Evidence and Later Interpretation**: What does the loaded source establish concerning ${title}, and what depends on disputed historical criteria or later synthesis?`,
    );
    lines.push(
      `2. **Manuscript Variations**: How do the Greek manuscript readings (Alexandrian vs Western vs Byzantine) compare with ancient translations?`,
    );
    lines.push(
      `3. **First-Century Context**: How did first-century Jewish Second Temple apocalypticism and Roman provincial governance shape this record?`,
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
    : `Deep-dive historical-critical podcast on "${title}" from the Jesus corpus. Host 1 acts as the linguistic and textual critic examining the ancient Greek and Semitic manuscript variants. Host 2 acts as the classical historian analyzing the first-century Roman, Jewish, and patristic context. Strictly ground all dialogue in the provided source dossier without introducing theological speculation.`;

  const sourceEntries = new Set<string>();
  for (const verse of resolvedVerses) {
    if (hasText(verse.original)) sourceEntries.add("OSHB/SBLGNT original-language text");
    if (hasText(verse.brenton)) sourceEntries.add("Brenton Septuagint");
    if (hasText(verse.drb)) sourceEntries.add("Douay-Rheims");
    if (hasText(verse.kjv)) sourceEntries.add("King James Version");
    if (hasText(verse.web)) sourceEntries.add("World English Bible");
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

export function downloadJesusNotebookLMDossier(dossier: JesusNotebookLMDossier): void {
  const blob = new Blob([dossier.markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeFilename = dossier.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  a.download = `jesus-dossier-${safeFilename || "export"}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
