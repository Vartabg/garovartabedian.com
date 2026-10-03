/**
 * The Polyphonic Sacred Disputation Engine
 *
 * Staging the great dialectical debates across biblical books, authors,
 * and early Church Fathers:
 * - Suffering: Proverbs vs Job vs Qoheleth
 * - Faith & Works: Romans vs James vs 1 Clement
 * - Christology: Kenotic Mark vs High Pre-existent John vs Ignatius
 * - The Law: Matthew 5 vs Galatians 3 & Hebrews 8
 * - Eschatology: Imminent Apocalyptic vs Realized Present Kingdom
 * - Sovereignty & Agency: Romans 9 vs Ezekiel 18 & 1 Timothy 2
 *
 * Runs on-device and exports a source-attributed worksheet for Google NotebookLM.
 */

export type DisputationVoice = {
  id: string;
  name: string;
  traditionOrAuthor: string;
  historicalPeriod: string;
  perspectiveBadge: string;
  coreThesis: string;
  scripturalWitnesses: {
    ref: string;
    text: string;
    exegeticalNote: string;
  }[];
  pastoralContext: string;
};

export type SacredDisputation = {
  id: string;
  title: string;
  thematicCategory: "theodicy" | "soteriology" | "christology" | "torah" | "eschatology" | "sovereignty";
  theologicalQuestion: string;
  coreTension: string;
  summary: string;
  voices: DisputationVoice[];
  historicalSynthesis: {
    title: string;
    patristicAndClassicalView: string;
    howTheCanonHoldsBoth: string;
  };
  audioHostRolePrompt: {
    host1Role: string;
    host2Role: string;
    inquiryFocus: string;
  };
};

export const SACRED_DISPUTATIONS: SacredDisputation[] = [
  {
    id: "suffering-theodicy",
    title: "The Problem of Suffering: Retribution vs Cosmic Mystery vs Transience",
    thematicCategory: "theodicy",
    theologicalQuestion: "Why do the righteous suffer while the wicked prosper in God's created order?",
    coreTension:
      "Selected sayings in Proverbs associate righteousness with well-being; Job's speeches protest innocent suffering; and Qoheleth describes life 'under the sun' as hebel, a vapor or enigma.",
    summary:
      "Proverbs, Job, and Ecclesiastes remain separate books but are often studied together as biblical wisdom literature. This disputation places selected passages in conversation: Proverbs commends patterns of wise living, Job challenges a mechanical account of retribution, and Qoheleth stresses mortality, contingency, and the limits of wisdom.",
    voices: [
      {
        id: "proverbs-traditional",
        name: "Traditional Wisdom",
        traditionOrAuthor: "Solomonic and other collections within Proverbs",
        historicalPeriod: "Composite collection; dates of its strata and final form are debated",
        perspectiveBadge: "Moral Retribution",
        coreThesis:
          "Many sayings present wisdom, diligence, and righteousness as paths that ordinarily tend toward life and stability, while folly and wickedness tend toward ruin; they need not be read as exceptionless guarantees.",
        scripturalWitnesses: [
          {
            ref: "Proverbs 3:1–2",
            text: "My son, do not forget my teaching, but let your heart keep my commandments, for length of days and years of life and peace they will add to you.",
            exegeticalNote: "This parental saying links keeping instruction with length of days and peace.",
          },
          {
            ref: "Proverbs 11:31",
            text: "If the righteous is repaid on earth, how much more the wicked and the sinner!",
            exegeticalNote: "The proverb voices an expectation of recompense on earth.",
          },
        ],
        pastoralContext:
          "The book's headings and instructional forms associate parts of the collection with royal, scribal, and household settings; the settings of individual sayings remain uncertain.",
      },
      {
        id: "job-protest",
        name: "The Protest of Innocence",
        traditionOrAuthor: "Job & The Voice from the Whirlwind",
        historicalPeriod: "Often dated within the 7th–4th centuries BCE; debated",
        perspectiveBadge: "Innocent Suffering & Cosmic Decentering",
        coreThesis:
          "Job's protest and the divine speeches challenge a simple debit-credit ledger of guilt: the protagonist suffers despite being called blameless, and the Behemoth and Leviathan poems portray a world larger than his moral calculus.",
        scripturalWitnesses: [
          {
            ref: "Job 9:22",
            text: "It is all one; therefore I say, He destroys both the blameless and the wicked.",
            exegeticalNote: "Job's speech rejects the retributive explanation pressed by his friends.",
          },
          {
            ref: "Job 38:4",
            text: "Where were you when I laid the foundation of the earth? Tell me, if you have understanding.",
            exegeticalNote: "The whirlwind speech questions the limits of Job's knowledge of creation.",
          },
        ],
        pastoralContext:
          "The book gives literary space to undeserved loss and to debate over inherited explanations; its original audience and social setting are not securely known.",
      },
      {
        id: "qoheleth-skeptic",
        name: "The Existential Realist",
        traditionOrAuthor: "Qoheleth (Ecclesiastes)",
        historicalPeriod: "Often dated to the 3rd century BCE; debated",
        perspectiveBadge: "Hebel (Vapor / Enigma)",
        coreThesis:
          "Life under the sun is 'hebel'—a fleeting, enigmatic mist where time and chance happen to all, the righteous die young, and the wicked live long; therefore, receive today's food, wine, and labor as an unearned gift from God.",
        scripturalWitnesses: [
          {
            ref: "Ecclesiastes 7:15",
            text: "In my vain life I have seen everything. There is a righteous man who perishes in his righteousness, and there is a wicked man who prolongs his life in his evildoing.",
            exegeticalNote: "Qoheleth reports an observation that complicates a simple retribution rule.",
          },
          {
            ref: "Ecclesiastes 9:11",
            text: "The race is not to the swift, nor the battle to the strong... but time and chance happen to them all.",
            exegeticalNote: "Qoheleth emphasizes that skill and strength do not guarantee outcomes.",
          },
        ],
        pastoralContext:
          "A Hellenistic-period setting is a common proposal; the text itself repeatedly tests the limits of toil, pleasure, and human wisdom.",
      },
    ],
    historicalSynthesis: {
      title: "An Editorial Wisdom Triad",
      patristicAndClassicalView:
        "Gregory of Nyssa's Homilies on the Song of Songs 1 orders Proverbs, Ecclesiastes, and the Song of Songs—not Job—as successive stages of instruction. Substituting Job in that ascending scheme is an editorial comparison for this disputation; the cited Gregory passage does not make it, and no work by Thomas Aquinas was identified to support it.",
      howTheCanonHoldsBoth:
        "A constructive canonical reading can treat Proverbs as instruction in durable patterns, Job as a challenge to mechanical retribution, and Qoheleth as a warning about wisdom's limits.",
    },
    audioHostRolePrompt: {
      host1Role:
        "Host 1 champions Job's honest, agonizing protest against simplistic theological clichés and Qoheleth's stark realism about life's enigmas.",
      host2Role:
        "Host 2 explores Proverbs' confidence in moral order and asks how later readers may hold all three books in creative tension.",
      inquiryFocus:
        "Compare this editorial triad with Gregory of Nyssa's different sequence in Homilies on the Song of Songs 1, and identify where the analogy fits or breaks down.",
    },
  },
  {
    id: "faith-and-works",
    title: "Faith and Works: Apart from Works of Law and Faith Made Complete by Works",
    thematicCategory: "soteriology",
    theologicalQuestion: "How do Paul and James use justification, faith, and works in their different arguments?",
    coreTension:
      "Paul's 'justified by faith apart from works of the law' (Rom 3:28), James's 'a person is justified by works and not by faith alone' (James 2:24), and the juxtaposition of faith and deeds in 1 Clement 30–32.",
    summary:
      "Christian interpreters, especially in later Western debates, have offered competing reconciliations of Romans 3:28 and James 2:24. One influential contextual reading relates Paul's argument to Gentile inclusion and disputes over works of the law, while James challenges a claimed faith that withholds necessities from a poorly clothed or hungry sibling (James 2:14–17). Neither reconstruction settles every lexical or theological question.",
    voices: [
      {
        id: "paul-romans",
        name: "The Apostle of Grace",
        traditionOrAuthor: "Paul of Tarsus (Romans & Galatians)",
        historicalPeriod: "Galatians c. 48–55 / Romans c. 56–58 CE; approximate",
        perspectiveBadge: "Justification by Faith Apart from Torah Works",
        coreThesis:
          "On one influential reading, Paul grounds justification and covenant membership in faith in—or the faithfulness of—Jesus Christ rather than works of law, with circumcision and table fellowship central in Galatians. The scope of 'works of law' and the translation of pistis Christou remain disputed.",
        scripturalWitnesses: [
          {
            ref: "Romans 3:28",
            text: "For we hold that one is justified by faith apart from works of the law.",
            exegeticalNote: "Romans 3:29–30 immediately connects the claim with one God's justification of Jews and Gentiles.",
          },
          {
            ref: "Galatians 2:16",
            text: "Yet we know that a person is not justified by works of the law but through faith in Jesus Christ.",
            exegeticalNote: "The statement follows Paul's account of his confrontation with Cephas over mixed table fellowship at Antioch.",
          },
        ],
        pastoralContext:
          "Addressing Gentile inclusion and Jewish-Gentile relations in Galatia and Rome; the opponents, circumstances, and practices differ between the two letters.",
      },
      {
        id: "james-jerusalem",
        name: "The Wisdom Teacher",
        traditionOrAuthor: "The Epistle of James (traditionally attributed to James the Just)",
        historicalPeriod: "Commonly dated within c. 50–100 CE; authorship and date disputed",
        perspectiveBadge: "Faith Vindicated by Embodied Mercy",
        coreThesis:
          "James 2 argues that a claimed faith which does not act for a poorly clothed or hungry sibling is dead, and uses Abraham and Rahab to connect faith with enacted allegiance.",
        scripturalWitnesses: [
          {
            ref: "James 2:14",
            text: "What good is it, my brothers, if someone says he has faith but does not have works? Can that faith save him?",
            exegeticalNote: "The rhetorical question tests whether a stated faith without actions can save.",
          },
          {
            ref: "James 2:24",
            text: "You see that a person is justified by works and not by faith alone.",
            exegeticalNote: "James applies 'justify' to Abraham's offering of Isaac and Rahab's reception of the messengers; interpreters dispute the term's precise relation to Paul.",
          },
        ],
        pastoralContext:
          "James 2:1–7 rebukes status-based favoritism toward a richly dressed visitor, and 2:15–16 tests professions of faith against unmet bodily need.",
      },
      {
        id: "clement-synthesis",
        name: "The Sub-Apostolic Pastor",
        traditionOrAuthor: "1 Clement (traditionally associated with Clement of Rome)",
        historicalPeriod: "Late 1st or early 2nd century CE; exact date disputed",
        perspectiveBadge: "Apostolic Unity & Lived Harmony",
        coreThesis:
          "1 Clement places a call to be 'justified by works and not by words' (30:3) near a denial of self-justification by piety or works and an affirmation of justification through faith (32:4). It does not quote James by name; treating the pairing as a Pauline-Jacobean synthesis is an interpretation.",
        scripturalWitnesses: [
          {
            ref: "1 Clement 32:4",
            text: "And we, too, being called by His will in Christ Jesus, are not justified by ourselves, nor by our own wisdom, or understanding, or godliness, or works which we have wrought in holiness of heart; but by that faith through which, from the beginning, Almighty God has justified all men.",
            exegeticalNote: "The passage denies self-justification by wisdom, piety, or works and assigns justification to faith within God's call.",
          },
          {
            ref: "1 Clement 30:3",
            text: "Let us be clothed with concord, being humble, self-controlled... being justified by works and not by words.",
            exegeticalNote: "The wording resembles James 2:24, although direct literary dependence is uncertain.",
          },
        ],
        pastoralContext:
          "The Roman church's letter addresses factional conflict at Corinth and the removal of presbyters, as described in 1 Clement 3 and 44.",
      },
    ],
    historicalSynthesis: {
      title: "Root vs Fruit: The Complementary Horizons",
      patristicAndClassicalView:
        "Augustine's Enchiridion 67 appeals to Paul's 'faith working through love' (Gal 5:6) and argues that James would be contradicted if a workless faith saved. Later 'root and fruit' explanations offer a harmonizing model; they should not be presented as proof that Paul and James invariably use 'justify' in two different senses.",
      howTheCanonHoldsBoth:
        "Reading Romans and James together invites interpreters to distinguish the ground, meaning, and visible consequences of faith without assigning a demonstrable single motive to their canonical inclusion.",
    },
    audioHostRolePrompt: {
      host1Role:
        "Host 1 presents Paul's rejection of justification by works of law and asks how Gentile inclusion shapes the argument.",
      host2Role:
        "Host 2 champions James's cutting moral realism: demanding to see the food and clothing given to the poor before recognizing any claim of faith.",
      inquiryFocus:
        "Assess how 1 Clement 30 and 32 can be read together, while testing rather than assuming direct dependence on James or a consensus among the Apostolic Fathers.",
    },
  },
  {
    id: "christology-paradox",
    title: "Christology: Markan Agony & Concealment vs Johannine Pre-existence",
    thematicCategory: "christology",
    theologicalQuestion: "How do Mark's passion narrative and John's Logos and self-giving language contribute to Christological interpretation?",
    coreTension:
      "Mark's secrecy commands, emotional distress, and cry of dereliction on the cross alongside John's 'In the beginning was the Word' and emphasis on Jesus laying down his life of his own accord.",
    summary:
      "Mark, widely treated by modern scholars as the earliest extant Gospel, and John present distinct narrative emphases. Mark includes secrecy commands, agony in Gethsemane, and a dying citation of Psalm 22:1; John includes 'Before Abraham was, I am' (8:58), Jesus carrying his cross, and 'It is finished' (19:30). Calling the latter a conquering king is a theological reading rather than the wording of the verse.",
    voices: [
      {
        id: "mark-kenosis",
        name: "The Suffering Servant Gospel",
        traditionOrAuthor: "The Gospel of Mark",
        historicalPeriod: "Commonly dated c. 65–75 CE; date and provenance debated",
        perspectiveBadge: "Concealment, Misunderstanding & Agony",
        coreThesis:
          "In a passion-centered reading, Mark tells the reader Jesus' identity from 1:1 while many human characters misunderstand him; the cross and the centurion's confession in 15:39 form a narrative climax. The claim that God is revealed only in suffering goes beyond what this narrative pattern alone establishes.",
        scripturalWitnesses: [
          {
            ref: "Mark 14:34",
            text: "My soul is very sorrowful, even to death. Remain here and watch.",
            exegeticalNote: "Raw emotional anguish and vulnerability in Gethsemane.",
          },
          {
            ref: "Mark 15:34",
            text: "My God, my God, why have you forsaken me?",
            exegeticalNote: "The lone dying utterance of Jesus in Mark: quoting Psalm 22:1 in Aramaic.",
          },
        ],
        pastoralContext:
          "A Roman provenance and a setting near or after the events of 64–70 CE are common hypotheses, but Mark does not identify its audience; its repeated teaching about suffering discipleship is textual evidence.",
      },
      {
        id: "john-logos",
        name: "The Sovereign Logos Gospel",
        traditionOrAuthor: "The Gospel of John",
        historicalPeriod: "Commonly dated c. 90–100 CE; compositional history debated",
        perspectiveBadge: "Cosmic Pre-existence & Sovereign Glory",
        coreThesis:
          "In a high-Christology reading, John's Logos is the agent through whom all things came to be (1:3), and Jesus interprets his death through voluntary self-giving (10:18) and being 'lifted up' (12:32–33). Calling him the High Priest here is a later synthesis with other New Testament imagery.",
        scripturalWitnesses: [
          {
            ref: "John 1:1, 14",
            text: "In the beginning was the Word, and the Word was with God, and the Word was God... and the Word became flesh and dwelt among us.",
            exegeticalNote: "The prologue identifies the Word as present with God in the beginning and as becoming flesh.",
          },
          {
            ref: "John 10:18",
            text: "No one takes it from me, but I lay it down of my own accord. I have authority to lay it down, and I have authority to take it up again.",
            exegeticalNote: "A Johannine emphasis on Jesus' agency in his death and reception of authority from the Father.",
          },
        ],
        pastoralContext:
          "John 9:22 and 16:2 reflect conflict involving expulsion from synagogues, but reconstructions of a bounded 'Johannine community' remain debated. Linking the Gospel directly to fully developed Gnosticism is also historically uncertain.",
      },
      {
        id: "ignatius-two-natures",
        name: "The Martyr Bishop",
        traditionOrAuthor: "Ignatius of Antioch",
        historicalPeriod: "Letters commonly dated c. 110 CE; precise date debated",
        perspectiveBadge: "The God Who Truly Suffered",
        coreThesis:
          "Ignatius combines divine and human predicates for Christ and repeatedly opposes teachers who deny that Jesus truly suffered in the flesh, especially in To the Smyrnaeans 1–2.",
        scripturalWitnesses: [
          {
            ref: "Ignatius to the Ephesians 7:2",
            text: "There is one Physician, who is both flesh and spirit, generate and not generate, God in man, true Life in death, both of Mary and of God, first passible and then impassible, even Jesus Christ our Lord.",
            exegeticalNote: "An early compact pairing of divine/human and passible/impassible predicates; claims of absolute priority are difficult to prove.",
          },
          {
            ref: "Ignatius to the Smyrnaeans 1:2",
            text: "He was truly nailed for our sake in the flesh under Pontius Pilate and Herod the tetrarch.",
            exegeticalNote: "Ignatius insists that Jesus was nailed in the flesh under named rulers.",
          },
        ],
        pastoralContext:
          "Ignatius writes as a prisoner en route to Rome and anticipates death by beasts in To the Romans 4–5; the letters do not identify the Colosseum as the venue.",
      },
    ],
    historicalSynthesis: {
      title: "Fourfold Gospel Reception",
      patristicAndClassicalView:
        "Irenaeus, Against Heresies 3.11.8, defends a fourfold Gospel against groups he says privilege particular Gospel forms. Later orthodox readers can set Mark's passion emphasis beside John's Logos theology, but claims that either Gospel by itself necessarily yields Docetism or adoptionism are retrospective warnings, not demonstrated outcomes.",
      howTheCanonHoldsBoth:
        "Irenaeus attests a fourfold Gospel around 180 CE, while Tatian's Diatessaron shows that harmonized use also circulated, especially in Syriac Christianity. The evidence does not support a single churchwide decision simply rejecting Tatian in favor of four separate books.",
    },
    audioHostRolePrompt: {
      host1Role:
        "Host 1 explores Mark's secrecy commands, human grief, and the cry of dereliction in its Psalm 22 setting.",
      host2Role:
        "Host 2 traces John's Logos language and examines readings of the cross as exaltation or royal enthronement.",
      inquiryFocus:
        "Compare Irenaeus, Against Heresies 3.11.8, with Eusebius, Ecclesiastical History 4.29, on Tatian's Diatessaron, and ask what each source does and does not establish about Gospel reception.",
    },
  },
  {
    id: "torah-law",
    title: "The Law of Moses: Perpetual Divine Statute vs Temporary Pedagogue",
    thematicCategory: "torah",
    theologicalQuestion: "How do Matthew 5, Galatians 3, and Hebrews 8 relate Torah's authority to Christ and the new covenant?",
    coreTension:
      "Matthew 5:17–18 ('not an iota will pass from the Law until all is fulfilled') vs Galatians 3:24–25 ('now that faith has come, we are no longer under a guardian') and Hebrews 8:13.",
    summary:
      "In the Greek text of the Sermon on the Mount, Jesus says that not one iota or one stroke (`keraia`) will pass from the Law until all takes place. Galatians calls the law a guardian (`paidagōgos`) until Christ, and Hebrews 8:13 calls the first covenant obsolete. Acts 15 records a Jerusalem decision that Gentile believers need not be circumcised or commanded to keep the whole law; Acts 21:20–25 still distinguishes Torah-observant Jewish believers from Gentile believers.",
    voices: [
      {
        id: "matthew-torah",
        name: "The New Moses",
        traditionOrAuthor: "The Gospel of Matthew",
        historicalPeriod: "Commonly dated c. 75–95 CE; date and provenance debated",
        perspectiveBadge: "Torah Fulfillment & Deepening",
        coreThesis:
          "Matthew's Jesus denies abolishing the Law and Prophets, speaks of fulfilling them, and demands a righteousness exceeding that of the scribes and Pharisees. Interpreters differ over how fulfillment relates to continuing observance.",
        scripturalWitnesses: [
          {
            ref: "Matthew 5:17–18",
            text: "Do not think that I have come to abolish the Law or the Prophets; I have not come to abolish them but to fulfill them.",
            exegeticalNote: "A strong affirmation of the Law and Prophets whose terms 'fulfill' and 'until' require interpretation in Matthew's wider narrative.",
          },
          {
            ref: "Matthew 5:21–22",
            text: "You have heard that it was said to those of old... But I say to you that everyone who is angry with his brother will be liable to judgment.",
            exegeticalNote: "Matthew extends the prohibition of murder to anger and insulting speech; whether this is intensification, interpretation, or something else is debated.",
          },
        ],
        pastoralContext:
          "The Gospel shows sustained engagement with Torah and conflict with scribal and Pharisaic interpreters. Antioch and a mixed Jewish-Gentile audience are common proposals, not facts stated by the text.",
      },
      {
        id: "galatians-pedagogue",
        name: "The Herald of Liberty",
        traditionOrAuthor: "Paul (Galatians & Romans)",
        historicalPeriod: "Galatians c. 48–55 / Romans c. 56–58 CE; approximate",
        perspectiveBadge: "The Ended Custody of the Law",
        coreThesis:
          "Galatians 3 presents the law as added after the Abrahamic promise and as a guardian until Christ; Paul then argues that believers are no longer under that guardian. How far this claim governs Jewish as well as Gentile Torah practice remains disputed.",
        scripturalWitnesses: [
          {
            ref: "Galatians 3:24–25",
            text: "So then, the law was our guardian until Christ came, in order that we might be justified by faith. But now that faith has come, we are no longer under a guardian.",
            exegeticalNote: "A paidagōgos supervised a child in an ancient household; the common gloss 'schoolmaster' can misstate the role.",
          },
          {
            ref: "Romans 10:4",
            text: "For Christ is the end (telos) of the law for righteousness to everyone who believes.",
            exegeticalNote: "Telos can denote an end or goal; interpreters dispute the nuance and theological force in Romans 10:4.",
          },
        ],
        pastoralContext:
          "Galatians responds to pressure on Gentile believers to accept circumcision (5:2–12) and separately criticizes observance of days and seasons (4:10); the identity and full program of Paul's rivals remain debated.",
      },
    ],
    historicalSynthesis: {
      title: "Letter vs Spirit: The Internalized Torah",
      patristicAndClassicalView:
        "The Epistle of Barnabas 2 and 9–10 allegorizes sacrifice, circumcision, and food laws. Augustine, Contra Faustum 6.2, instead distinguishes moral precepts from symbolic observances that Christians no longer perform. These are distinct arguments, not a single patristic formula.",
      howTheCanonHoldsBoth:
        "Reading Matthew and Galatians together keeps their different claims about fulfillment, law, and Gentile inclusion in view. The historical reason each book entered and remained in the canon cannot be reduced to these theological safeguards.",
    },
    audioHostRolePrompt: {
      host1Role:
        "Host 1 explores Matthew's strong affirmation of Torah, the disputed force of 'fulfill,' and the demands of the antitheses.",
      host2Role:
        "Host 2 champions Paul's fiery epistle to the Galatians: freedom from the guardian, anti-circumcision polemic, and walking by the Spirit.",
      inquiryFocus:
        "Ask what Acts 15 settles about Gentile circumcision and law observance, what it leaves open, and how Barnabas 2 and 9–10 and Augustine, Contra Faustum 6.2, construct different later readings.",
    },
  },
  {
    id: "eschatology-kingdom",
    title: "Eschatology: Apocalyptic Rupture vs Realized Present Kingdom",
    thematicCategory: "eschatology",
    theologicalQuestion: "Do these texts emphasize a future divine intervention, a kingdom already present among Jesus' hearers, or both?",
    coreTension:
      "1 Thessalonians 4's descending Lord and trumpet and Revelation 19's warrior-judge imagery alongside Luke 17:21 ('the kingdom of God is in your midst') and Ephesians 2:6 ('seated with him in heavenly places').",
    summary:
      "These texts support both future and present eschatological emphases: 1 Thessalonians describes the Lord's descent and the resurrection of the dead, Revelation depicts judgment and new creation, Luke locates the kingdom 'in your midst,' and Ephesians describes believers as already raised and seated with Christ. How imminent, realized, or symbolic each passage is remains a matter of interpretation.",
    voices: [
      {
        id: "apocalyptic-futurist",
        name: "The Apocalyptic Seer",
        traditionOrAuthor: "1 Thessalonians & Revelation",
        historicalPeriod: "1 Thessalonians c. 49–51 / Revelation often c. 90–100 CE; Revelation's date debated",
        perspectiveBadge: "Future Cataclysmic Rupture",
        coreThesis:
          "On a futurist reading, 1 Thessalonians 4 anticipates Christ's descent and the resurrection of the dead, while Revelation anticipates Babylon's fall, judgment, and a new heaven and earth. The texts do not themselves state a general rule that reform in the present age is impossible.",
        scripturalWitnesses: [
          {
            ref: "1 Thessalonians 4:16",
            text: "For the Lord himself will descend from heaven with a cry of command, with the voice of an archangel, and with the sound of the trumpet of God.",
            exegeticalNote: "A descent and gathering scene; the separate 'thief in the night' image occurs in 1 Thessalonians 5:2.",
          },
          {
            ref: "Revelation 19:11",
            text: "Then I saw heaven opened, and behold, a white horse! The one sitting on it is called Faithful and True, and in righteousness he judges and makes war.",
            exegeticalNote: "An apocalyptic warrior-judge image that readers relate differently to the Lamb and martyr imagery elsewhere in Revelation.",
          },
        ],
        pastoralContext:
          "1 Thessalonians 4 addresses grief over believers who have died. Revelation addresses seven assemblies in Roman Asia and names faithful witnesses who were killed; the scale and form of imperial pressure behind the visions are debated.",
      },
      {
        id: "realized-present",
        name: "The Present Kingdom",
        traditionOrAuthor: "Luke & Ephesians",
        historicalPeriod: "Luke often c. 80–90 / Ephesians c. 60–100 CE; authorship and dates debated",
        perspectiveBadge: "Inaugurated / Present Reality",
        coreThesis:
          "On a realized or inaugurated reading, Luke 17:20–21 locates the kingdom among Jesus' hearers, and Ephesians 2:6 describes believers' participation in resurrection life in the past tense. Neither passage by itself cancels these writings' future expectations.",
        scripturalWitnesses: [
          {
            ref: "Luke 17:20–21",
            text: "The kingdom of God is not coming in ways that can be observed... for behold, the kingdom of God is in the midst of you.",
            exegeticalNote: "The phrase can be translated 'among you,' 'in your midst,' or 'within you'; its reference to Jesus' presence or an interior reality is debated.",
          },
          {
            ref: "Ephesians 2:6",
            text: "And raised us up with him and seated us with him in the heavenly places in Christ Jesus.",
            exegeticalNote: "Past-tense language portrays believers as already participating in Christ's exalted life.",
          },
        ],
        pastoralContext:
          "Luke and Ephesians address communal conduct and present participation in salvation, but a program of preparing for a delayed return is an inference rather than an identified authorial occasion.",
      },
    ],
    historicalSynthesis: {
      title: "The 'Already and Not Yet' Tension",
      patristicAndClassicalView:
        "Oscar Cullmann popularized the D-Day/V-Day analogy in Christ and Time: Christ's resurrection is the decisive event and the final consummation remains future. Earlier Christian texts combine present participation with future hope, but they did not formulate Cullmann's modern military analogy.",
      howTheCanonHoldsBoth:
        "An editorial reading can use the juxtaposition to ask how present participation and future hope correct each other's excesses; claims that either emphasis inevitably causes complacency, despair, or escapism should be tested rather than assumed.",
    },
    audioHostRolePrompt: {
      host1Role:
        "Host 1 explores the apocalyptic urgency of 1 Thessalonians and Revelation: trumpet, judgment, and Revelation's imagery of Babylon's fall.",
      host2Role:
        "Host 2 examines Luke's kingdom 'in your midst' and Ephesians' past-tense participation language without erasing their future expectations.",
      inquiryFocus:
        "Compare present and future language in the cited passages, then test the common 'delay of the Parousia' account against named sources such as 2 Peter 3 and Didache 16.",
    },
  },
  {
    id: "sovereignty-agency",
    title: "Divine Sovereignty vs Human Agency: The Potter's Clay vs Universal Invitation",
    thematicCategory: "sovereignty",
    theologicalQuestion: "How do Romans 9's election imagery, Ezekiel 18's call to turn, and 1 Timothy 2's desire for all relate?",
    coreTension:
      "Romans 9 ('He has mercy on whomever he wills, and he hardens whomever he wills') vs Ezekiel 18 ('I have no pleasure in the death of the wicked') and 1 Timothy 2:4 ('desires all people to be saved').",
    summary:
      "The relation between divine election and human responsibility recurs in disputes involving Augustine and Pelagius, Aquinas, Calvin, Arminius, and Barth. Romans 9 uses potter-and-clay language for God's freedom, while Ezekiel 18 calls hearers to turn and live and 1 Timothy 2:4 says God desires all people to be saved. Their relation depends on disputed questions of scope, genre, and theological framework.",
    voices: [
      {
        id: "sovereign-potter",
        name: "The Sovereign Potter",
        traditionOrAuthor: "Exodus & Romans 9",
        historicalPeriod: "Exodus has a traditional 2nd-millennium BCE narrative setting; its composition is debated / Romans c. 56–58 CE",
        perspectiveBadge: "Unconditioned Divine Election",
        coreThesis:
          "On an unconditional-election reading, Romans 9:6–24 emphasizes that God's purpose and mercy do not depend on human will or exertion, using Jacob, Esau, Pharaoh, and the potter as examples. Corporate, historical, and individual-salvation readings contest the passage's scope.",
        scripturalWitnesses: [
          {
            ref: "Romans 9:16, 18",
            text: "So then it depends not on human will or exertion, but on God, who has mercy... He has mercy on whomever he wills, and he hardens whomever he wills.",
            exegeticalNote: "A strong statement of divine initiative whose referents and place within Romans 9–11 remain disputed.",
          },
          {
            ref: "Romans 9:20–21",
            text: "Will what is molded say to its molder, 'Why have you made me like this?' Has the potter no right over the clay?",
            exegeticalNote: "The potter imagery recalls Isaiah 29:16 and 45:9 and Jeremiah 18; Paul applies it within his argument about Israel and mercy.",
          },
        ],
        pastoralContext:
          "Romans 9–11 begins with Paul's grief over Israel's unbelief and asks how God's promise stands; it does not supply a demographic measure of rejection.",
      },
      {
        id: "universal-plea",
        name: "The Call to Turn",
        traditionOrAuthor: "Ezekiel & Pastoral Epistles",
        historicalPeriod: "Ezekiel's ministry c. 593–571 BCE / 1 Timothy c. mid-1st–early-2nd century CE; authorship and date disputed",
        perspectiveBadge: "Accountability & Desire for All to Be Saved",
        coreThesis:
          "Ezekiel 18 says God takes no pleasure in anyone's death and commands hearers to turn and live; 1 Timothy 2:4 says God desires all people to be saved. Moving from those statements to a complete theory of universal salvific will and human freedom requires further argument.",
        scripturalWitnesses: [
          {
            ref: "Ezekiel 18:23, 32",
            text: "Have I any pleasure in the death of the wicked, declares the Lord God, and not rather that he should turn from his way and live? … For I have no pleasure in the death of anyone, declares the Lord God; so turn, and live.",
            exegeticalNote: "The oracle denies divine pleasure in death and ends with an imperative to turn and live.",
          },
          {
            ref: "1 Timothy 2:3–4",
            text: "This is good, and it is pleasing in the sight of God our Savior, who desires all people to be saved and to come to the knowledge of the truth.",
            exegeticalNote: "The verse's 'all people' grounds prayer for all in 2:1; interpreters dispute how it relates to later doctrines of salvation.",
          },
        ],
        pastoralContext:
          "Ezekiel 18 answers an exilic proverb about children bearing consequences for their parents and insists on each person's accountability; labeling the proverb 'fatalistic despair' is one possible diagnosis.",
      },
    ],
    historicalSynthesis: {
      title: "Providence and Creaturely Agency",
      patristicAndClassicalView:
        "These interpreters should not be collapsed into one doctrine: Origen, On First Principles 3.1, defends free will while treating texts that seem to deny it; John Chrysostom, Homily 16 on Romans, reads the potter image without abolishing free choice; C. S. Lewis develops a modern free-will defense in The Problem of Pain.",
      howTheCanonHoldsBoth:
        "Reading Romans 9 beside Romans 10:13 ('Everyone who calls on the name of the Lord will be saved') keeps divine initiative and an open proclamation in the same argument. The juxtaposition does not by itself resolve later predestination debates.",
    },
    audioHostRolePrompt: {
      host1Role:
        "Host 1 presents an unconditional-election reading of Romans 9, then tests it against corporate and salvation-historical readings.",
      host2Role:
        "Host 2 explores Ezekiel's call to turn and 1 Timothy's desire for all to be saved, while distinguishing their wording from later theories of free choice.",
      inquiryFocus:
        "Compare Origen, On First Principles 3.1, and John Chrysostom, Homily 16 on Romans, with later predestinarian readings instead of treating 'classical theology' as a single position.",
    },
  },
];

export function getAllDisputations(): SacredDisputation[] {
  return SACRED_DISPUTATIONS;
}

export function getDisputationById(id: string): SacredDisputation | undefined {
  return SACRED_DISPUTATIONS.find((d) => d.id === id);
}

export function searchDisputations(query: string): SacredDisputation[] {
  const q = query.trim().toLowerCase();
  if (!q) return SACRED_DISPUTATIONS;

  return SACRED_DISPUTATIONS.filter(
    (d) =>
      d.id.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.theologicalQuestion.toLowerCase().includes(q) ||
      d.thematicCategory.toLowerCase().includes(q) ||
      d.coreTension.toLowerCase().includes(q) ||
      d.voices.some(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.traditionOrAuthor.toLowerCase().includes(q) ||
          v.coreThesis.toLowerCase().includes(q),
      ),
  );
}

export function generateDisputationDossier(disputation: SacredDisputation): string {
  const lines: string[] = [];

  lines.push(`# Sacred Disputation: ${disputation.title}`);
  lines.push("");
  lines.push(`> **Corpus Provenance**: Garo Vartabedian Classical Scholarship Platform.`);
  lines.push(`> **Theological Category**: ${disputation.thematicCategory.toUpperCase()}`);
  lines.push(`> **Central Question**: "${disputation.theologicalQuestion}"`);
  lines.push(`> **Source Boundary**: Hosted texts and editorial notes are labeled separately; verify manuscript and reception claims against cited editions, and flag missing edition metadata.`);
  lines.push("");

  lines.push(`## 1. Executive Theological Summary`);
  lines.push(disputation.summary);
  lines.push("");
  lines.push(`**Core Tension**: ${disputation.coreTension}`);
  lines.push("");

  lines.push(`## 2. Dialectical Voices in Direct Collation`);
  lines.push("");

  for (let i = 0; i < disputation.voices.length; i++) {
    const v = disputation.voices[i];
    lines.push(`### Voice ${i + 1}: ${v.name} (${v.perspectiveBadge})`);
    lines.push(`- **Author / Tradition**: ${v.traditionOrAuthor}`);
    lines.push(`- **Historical Period**: ${v.historicalPeriod}`);
    lines.push(`- **Core Thesis**: ${v.coreThesis}`);
    lines.push(`- **Pastoral Context**: ${v.pastoralContext}`);
    lines.push("");
    lines.push(`**Quoted Source Excerpts with Editorial Notes**:`);
    for (const w of v.scripturalWitnesses) {
      lines.push(`- **${w.ref}**: \`${w.text}\` — *${w.exegeticalNote}*`);
    }
    lines.push("");
  }

  lines.push(`## 3. Historical & Canonical Synthesis`);
  lines.push(`### ${disputation.historicalSynthesis.title}`);
  lines.push(`**Editorial Summary of Patristic & Classical Reception**:`);
  lines.push(disputation.historicalSynthesis.patristicAndClassicalView);
  lines.push("");
  lines.push(`**Canonical Juxtaposition (Editorial Reading)**:`);
  lines.push(disputation.historicalSynthesis.howTheCanonHoldsBoth);
  lines.push("");

  lines.push(`## 4. NotebookLM Dialectical Audio Overview Prompt`);
  lines.push(
    `Use this module as a starting evidence set for a theological debate podcast on the sacred disputation: "${disputation.title}". Central question: "${disputation.theologicalQuestion}". ${disputation.audioHostRolePrompt.host1Role} ${disputation.audioHostRolePrompt.host2Role} ${disputation.audioHostRolePrompt.inquiryFocus} Distinguish quoted source excerpts from editorial theses and syntheses. Flag disputed authorship, dating, translation, historical reconstruction, and theological interpretation as disputed. Verify quotations and historical or reception claims against cited editions; when no edition is identified, flag that gap rather than presenting the claim as established.`,
  );
  lines.push("");
  lines.push(`---`);
  lines.push(`*Source note: This module is a starting evidence set. Hosted excerpts and editorial position summaries are distinct; verify quotations, attribution, dating, and reception claims against cited editions—or flag missing edition metadata—before reuse.*`);

  return lines.join("\n");
}
