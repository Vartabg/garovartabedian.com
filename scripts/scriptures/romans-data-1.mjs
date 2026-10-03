export const ROMANS_CONTEXT = {
  author: "Paul the apostle, with Tertius transcribing as amanuensis (16:22).",
  audience: "Christian assemblies in Rome, encompassing returning Jewish believers and Gentile converts.",
  date: "Circa AD 56–58, near the close of Paul's third missionary journey.",
  setting: "Wintering in Corinth or Cenchreae, preparing to deliver the Jerusalem collection before journeying toward Spain.",
  literaryForm: "Apostolic letter and theological treatise employing diatribe dialogue, scriptural catena, and pastoral exhortation."
};

export const ROMANS_PART1 = [
  {
    book: "ROM",
    chapter: 1,
    bookName: "Romans",
    summary: "Paul opens his letter to the Roman assemblies with an apostolic salutation, expressing his long-held desire to visit and introduce his gospel. He announces the theme of the letter: the Good News as the power of God for salvation for everyone who believes, Jew first and Greek, revealing God's righteousness. He then diagnoses universal human disorder through the idolatry of the Gentile world, showing how suppressing truth leads to darkened minds and degradation.",
    whyItMatters: "Romans 1 lays the theological foundation of the entire letter. By beginning with a familiar Jewish-Hellenistic critique of pagan idolatry, Paul sets an intentional rhetorical trap that springs shut in chapter 2: those who judge others are themselves accountable before God's impartial justice.",
    context: ROMANS_CONTEXT,
    themes: ["Righteousness of God", "Universal Human Disorder", "Apostolic Mission", "Idolatry and Truth"],
    outline: [
      {
        heading: "Apostolic Salutation and Mutual Faith",
        verses: "1-15",
        note: "Paul identifies himself as a servant and apostle of Christ, celebrates the faith of the Roman assemblies, and shares his prayerful longing to preach among them."
      },
      {
        heading: "Theme: God's Righteousness Revealed",
        verses: "16-17",
        note: "The gospel is declared to be God's saving power for Jew and Greek alike, revealing God's righteousness from faith to faith as promised in Habakkuk."
      },
      {
        heading: "Idolatry and the Suppression of Truth",
        verses: "18-23",
        note: "Humanity perceives God's eternal power in creation but exchanges the incorruptible Creator for corruptible creaturely images."
      },
      {
        heading: "Divine Surrender and Moral Disorder",
        verses: "24-32",
        note: "God gives idolatrous humanity over to degraded passions and a reprobate mind, producing a comprehensive catalog of destructive social vices."
      }
    ],
    keyVerses: [
      {
        ref: "1:16",
        text: "For I am not ashamed of the Good News of Christ, because it is the power of God for salvation for everyone who believes, for the Jew first, and also for the Greek.",
        why: "This foundational verse frames the universal scope and ethnic order of the gospel that Paul defends throughout the letter."
      },
      {
        ref: "1:17",
        text: "For in it is revealed God’s righteousness from faith to faith. As it is written, “But the righteous shall live by faith.”",
        why: "The thematic thesis of Romans, linking the revelation of God's covenant faithfulness and saving justice to the prophetic witness of Habakkuk 2:4."
      },
      {
        ref: "1:20",
        text: "For the invisible things of him since the creation of the world are clearly seen, being perceived through the things that are made, even his everlasting power and divinity, that they may be without excuse.",
        why: "Grounds human accountability not in legal codes but in the clarity of God's witness woven into the fabric of the created order."
      }
    ],
    questions: [
      {
        id: "q1",
        category: "context",
        question: "Why does Paul introduce himself with such extensive christological titles in verses 1–4?",
        answer: "Unlike Galatia or Corinth, Paul did not found the church in Rome and had never visited. He establishes his apostolic credentials by anchoring his gospel in Davidic royal descent according to the flesh and divine power according to the Spirit through the resurrection.",
        verseRefs: ["1:1-4"],
        relatedVerses: [1, 2, 3, 4]
      },
      {
        id: "q2",
        category: "theology",
        question: "What does 'righteousness of God' (dikaiosynē theou) signify in verse 17?",
        answer: "In Pauline theology, 'righteousness of God' encompasses God's own covenant faithfulness, his saving justice in righting creation, and the gift of righteous standing granted to those who trust in Christ apart from status boasting.",
        verseRefs: ["1:17"],
        relatedVerses: [17]
      },
      {
        id: "q3",
        category: "word",
        question: "What is the significance of the phrase 'from faith to faith' in verse 17?",
        answer: "The Greek expression ek pisteōs eis pistin emphasizes that salvation is grounded entirely in faith from start to finish—originating in God's faithfulness and received through human trusting obedience.",
        verseRefs: ["1:17"],
        relatedVerses: [17]
      },
      {
        id: "q4",
        category: "history",
        question: "What historical reality is reflected in Paul's phrase 'to the Jew first, and also to the Greek' in verse 16?",
        answer: "Paul affirms the salvation-historical priority of Israel as the covenant people through whom the promises came, while insisting that the risen Messiah now gathers Gentiles into one multiethnic family without barrier.",
        verseRefs: ["1:16"],
        relatedVerses: [16]
      },
      {
        id: "q5",
        category: "hard_verse",
        question: "How does verse 24 ('God gave them up') function in Paul's argument without portraying God as malicious?",
        answer: "The Greek verb paredōken ('handed over') depicts divine judicial restraint being withdrawn: God honors human refusal by allowing them to experience the natural destructive consequences of worshiping creation rather than the Creator.",
        verseRefs: ["1:24"],
        relatedVerses: [24]
      },
      {
        id: "q6",
        category: "theology",
        question: "How does the vice list in verses 29–31 connect personal idolatry with communal destruction?",
        answer: "Paul shows that when humans distort their relationship with God, their relationships with one another collapse into envy, deceit, malice, and covenant-breaking, demonstrating that theology and social ethics are inseparable.",
        verseRefs: ["1:29-31"],
        relatedVerses: [29, 30, 31]
      },
      {
        id: "q7",
        category: "practical",
        question: "How should modern readers understand Paul's rhetorical setup in chapter 1 in light of chapter 2?",
        answer: "Readers must avoid weaponizing chapter 1 against outsiders. Paul deliberately employs Hellenistic Jewish polemic against pagan decadence to lead self-righteous moralists into nodding agreement before turning on them in 2:1.",
        verseRefs: ["1:32"],
        relatedVerses: [32]
      }
    ],
    glossary: [
      {
        term: "Good News",
        def: "The Greek euangelion, announcing the royal victory, enthronement, and saving reign of Jesus Christ over the cosmos."
      },
      {
        term: "Gentiles",
        def: "Non-Jewish nations (ethnē) now invited into the family of Abraham through faith in the Jewish Messiah."
      }
    ],
    generation: {
      attributedModel: "gemini-2.5-pro",
      promptHash: "",
      generatedAt: "2026-09-03T02:20:00.000Z",
      rubricVersion: "guide-v2",
      method: "review-bound"
    },
    reviewStatus: "agent-reviewed",
    reviewedAt: "2026-09-03",
    reviewer: "Antigravity editorial panel",
    sourceIds: ["web"]
  },
  {
    book: "ROM",
    chapter: 2,
    bookName: "Romans",
    summary: "Paul springs his rhetorical trap on the judging listener, declaring that anyone who condemns others while practicing the same offenses stands without excuse before God's impartial judgment. He argues that hearing the Torah provides no protection apart from doing it, revealing that Gentiles who obey God by nature possess the work of the law written on their hearts. True circumcision is an inward reality of the Spirit, not a mere outward mark in the flesh.",
    whyItMatters: "Romans 2 destroys all grounds for moral or ethnic superiority. It establishes that God judges according to truth and works without partiality, shifting the definition of covenant belonging from external heritage to inward regeneration.",
    context: ROMANS_CONTEXT,
    themes: ["Impartial Judgment", "Circumcision of the Heart", "Hearers and Doers", "Hypocrisy and Torah"],
    outline: [
      {
        heading: "Impartial Judgment on the Self-Righteous",
        verses: "1-11",
        note: "Paul confronts the hypocritical judge, warning that God's patience is meant for repentance and that divine retribution and glory will be given without ethnic favoritism."
      },
      {
        heading: "Hearers and Doers: Law Written on the Heart",
        verses: "12-16",
        note: "Possessing the law does not justify; doers will be justified, including Gentiles whose consciences witness to the law's work within them."
      },
      {
        heading: "The Challenge to Covenant Boasting",
        verses: "17-24",
        note: "Paul addresses the Jewish interlocutor who boasts in Torah, asking whether teaching against theft, adultery, and idolatry is matched by obedient personal practice."
      },
      {
        heading: "Circumcision of the Heart by the Spirit",
        verses: "25-29",
        note: "Physical circumcision becomes uncircumcision when Torah is broken, while obedient uncircumcised Gentiles judge hypocrites because true praise is from God in the Spirit."
      }
    ],
    keyVerses: [
      {
        ref: "2:1",
        text: "Therefore you are without excuse, O man, whoever you are who judge. For in that which you judge another, you condemn yourself. For you who judge practice the same things.",
        why: "The dramatic turning point of the diatribe, reversing the moral self-satisfaction built up during chapter 1's indictment of pagan vices."
      },
      {
        ref: "2:11",
        text: "For there is no partiality with God.",
        why: "A theological axiom foundational to Romans, asserting that God's court evaluates conduct without ethnic, social, or ritual privilege."
      },
      {
        ref: "2:29",
        text: "but he is a Jew who is one inwardly, and circumcision is that of the heart, in the spirit, not in the letter; whose praise is not from men, but from God.",
        why: "Redefines covenant membership in continuity with Old Testament prophetic hope (Deut 30:6; Jer 4:4), centering on Spirit transformation."
      }
    ],
    questions: [
      {
        id: "q1",
        category: "context",
        question: "Who is the 'O man, whoever you are who judge' addressed in verse 1?",
        answer: "Paul employs the ancient diatribe style to engage an imagined dialogue partner—specifically a morally observant person or Jewish interlocutor who feels exempt from the pagan vices cataloged in chapter 1.",
        verseRefs: ["2:1-3"],
        relatedVerses: [1, 2, 3]
      },
      {
        id: "q2",
        category: "theology",
        question: "How does verse 6 ('pay back to everyone according to their works') fit with justification by faith?",
        answer: "Paul maintains that final judgment is according to deeds, while justification by faith reveals the grace that produces those transformed works through the Spirit, excluding merit-based boasting while preserving moral accountability.",
        verseRefs: ["2:6-10"],
        relatedVerses: [6, 7, 8, 9, 10]
      },
      {
        id: "q3",
        category: "word",
        question: "What is the meaning of 'circumcision of the heart, in the spirit' in verse 29?",
        answer: "The phrase echoes Deuteronomy 10:16 and Jeremiah 31:33, signifying an inward surgical removal of self-will and moral callousness wrought by the Holy Spirit rather than external inscription in the written code (gramma).",
        verseRefs: ["2:29"],
        relatedVerses: [29]
      },
      {
        id: "q4",
        category: "hard_verse",
        question: "How can Gentiles 'do by nature the things of the law' in verse 14 if all humans are under sin?",
        answer: "Paul does not claim Gentiles achieve sinless perfection; rather, when Gentiles exhibit justice, charity, and honor, they demonstrate that God's moral order is stamped on human nature and conscience, leaving them without excuse.",
        verseRefs: ["2:14-15"],
        relatedVerses: [14, 15]
      },
      {
        id: "q5",
        category: "history",
        question: "Why does Paul cite Isaiah saying 'the name of God is blasphemed among the Gentiles because of you' in verse 24?",
        answer: "Quoting Isaiah 52:5 and Ezekiel 36:20, Paul reminds the Roman Jewish believers that moral compromise by covenant members causes the surrounding pagan empire to mock the God of Israel rather than worship him.",
        verseRefs: ["2:23-24"],
        relatedVerses: [23, 24]
      },
      {
        id: "q6",
        category: "theology",
        question: "How does verse 4 define the true purpose of God's patience and forbearance?",
        answer: "God's kindness and forbearance are not signs of indifference toward sin or stamps of approval on moral compromise; they are gracious spaces granted to lead sinners to genuine repentance.",
        verseRefs: ["2:4"],
        relatedVerses: [4]
      },
      {
        id: "q7",
        category: "practical",
        question: "What warning does Romans 2 offer to religious communities today?",
        answer: "It warns against assuming that doctrinal orthodoxy, religious heritage, or familiarity with Scripture grants immunity from ethical failure; God evaluates reality, not outward labels.",
        verseRefs: ["2:21-23"],
        relatedVerses: [21, 22, 23]
      }
    ],
    glossary: [
      {
        term: "partiality",
        def: "The Greek prosōpolēmpsia, literally 'receiving of faces', denoting unjust bias or favoritism in legal judgment."
      },
      {
        term: "conscience",
        def: "The inner moral witness (syneidēsis) that evaluates actions and thoughts before God's ultimate tribunal."
      }
    ],
    generation: {
      attributedModel: "gemini-2.5-pro",
      promptHash: "",
      generatedAt: "2026-09-03T02:20:00.000Z",
      rubricVersion: "guide-v2",
      method: "review-bound"
    },
    reviewStatus: "agent-reviewed",
    reviewedAt: "2026-09-03",
    reviewer: "Antigravity editorial panel",
    sourceIds: ["web"]
  },
  {
    book: "ROM",
    chapter: 3,
    bookName: "Romans",
    summary: "Paul addresses objections regarding Jewish heritage and God's faithfulness, denying that human unfaithfulness cancels God's covenant reliability. He marshals a chain of scriptural citations from Psalms and Isaiah to establish that all humanity—Jew and Greek alike—is enslaved under sin and silenced before God. Then comes the glorious pivot: apart from the law, God's righteousness is revealed through faith in Jesus Christ as an atoning sacrifice (hilastērion), justifying sinners freely by grace and excluding all boasting.",
    whyItMatters: "Romans 3 contains the theological core of the epistle. In verses 21–26, Paul articulates the heart of the Christian gospel: God remains entirely just while justifying the ungodly through the sacrificial redemption accomplished in Jesus Christ.",
    context: ROMANS_CONTEXT,
    themes: ["Universal Sin", "Justification by Grace", "Atoning Sacrifice", "Exclusion of Boasting"],
    outline: [
      {
        heading: "Objections and God's Faithfulness",
        verses: "1-8",
        note: "Paul engages diatribe objections regarding Israel's advantage and clarifies that human falsehood never impeaches God's righteous judgment."
      },
      {
        heading: "Universal Solidarity Under Sin",
        verses: "9-20",
        note: "A catena of Old Testament texts demonstrates that none is righteous, closing every mouth so that no flesh is justified by works of the law."
      },
      {
        heading: "The Righteousness of God Through Christ",
        verses: "21-26",
        note: "Apart from Torah, God's saving righteousness is revealed through faith in Christ, provided as an atoning sacrifice freely justifying all who believe."
      },
      {
        heading: "Boasting Excluded and the Law Established",
        verses: "27-31",
        note: "Because one God justifies circumcised and uncircumcised through faith alone, human boasting is excluded and the true purpose of the law is established."
      }
    ],
    keyVerses: [
      {
        ref: "3:20",
        text: "Because by the works of the law, no flesh will be justified in his sight; for through the law comes the knowledge of sin.",
        why: "Defines the boundary of Torah observance: the law reveals and clarifies transgression but possesses no power to acquit guilty humanity."
      },
      {
        ref: "3:23",
        text: "for all have sinned, and fall short of the glory of God;",
        why: "The universal verdict of human spiritual bankruptcy, establishing the equal need for grace across all ethnic and moral divisions."
      },
      {
        ref: "3:24",
        text: "being justified freely by his grace through the redemption that is in Christ Jesus,",
        why: "A concise summary of the gospel: justification is a free gift grounded entirely in the liberating ransom accomplished in Christ."
      },
      {
        ref: "3:25",
        text: "whom God sent to be an atoning sacrifice through faith in his blood, for a demonstration of his righteousness through the passing over of prior sins, in God’s forbearance;",
        why: "Introduces the temple mercy-seat metaphor (hilastērion), revealing how the cross satisfies divine justice while extending mercy."
      }
    ],
    questions: [
      {
        id: "q1",
        category: "theology",
        question: "What does Paul mean by the Greek term hilastērion in verse 25?",
        answer: "Hilastērion refers to the 'mercy seat' or cover of the Ark of the Covenant (Lev 16), the place where atoning blood was sprinkled. Paul depicts Jesus as the climactic site of divine reconciliation where sin is dealt with and mercy is poured out.",
        verseRefs: ["3:25"],
        relatedVerses: [25]
      },
      {
        id: "q2",
        category: "context",
        question: "Why does Paul string together multiple Old Testament verses in verses 10–18?",
        answer: "This rhetorical technique, known in rabbinic tradition as charaz ('stringing pearls'), draws from Psalms, Proverbs, and Isaiah to prove to his Jewish interlocutor that their own Scriptures proclaim universal human corruption.",
        verseRefs: ["3:10-18"],
        relatedVerses: [10, 11, 12, 13, 14, 15, 16, 17, 18]
      },
      {
        id: "q3",
        category: "word",
        question: "What does 'freely by his grace' (dōrean tē autou chariti) mean in verse 24?",
        answer: "The adverb dōrean means 'as a gift, without payment or cause', underscoring that justification is entirely unmerited and cannot be earned or purchased by human performance.",
        verseRefs: ["3:24"],
        relatedVerses: [24]
      },
      {
        id: "q4",
        category: "hard_verse",
        question: "How does faith 'establish the law' rather than nullify it in verse 31?",
        answer: "Faith establishes the law by acknowledging its righteous verdict against sin, fulfilling its prophetic witness to Christ (3:21), and producing the love that satisfies Torah's true spiritual aim (Rom 8:4; 13:8–10).",
        verseRefs: ["3:31"],
        relatedVerses: [31]
      },
      {
        id: "q5",
        category: "history",
        question: "What were the 'oracles of God' entrusted to Israel mentioned in verse 2?",
        answer: "They were the sacred Scriptures and covenant promises given through Moses and the prophets, which remain honored and true even when individual covenant recipients prove unfaithful.",
        verseRefs: ["3:1-3"],
        relatedVerses: [1, 2, 3]
      },
      {
        id: "q6",
        category: "theology",
        question: "How is God both 'just and the justifier' in verse 26?",
        answer: "God does not compromise his holiness by overlooking wickedness; rather, in Christ he absorbs the cost of human sin, simultaneously vindicating his moral justice and granting acquitting grace to the believer.",
        verseRefs: ["3:26"],
        relatedVerses: [26]
      },
      {
        id: "q7",
        category: "practical",
        question: "How does the doctrine of justification by faith exclude boasting in verse 27?",
        answer: "Since all have sinned and salvation is received solely as an unearned gift through faith, no individual or ethnic group can claim superior spiritual entitlement or look down upon another.",
        verseRefs: ["3:27-28"],
        relatedVerses: [27, 28]
      }
    ],
    glossary: [
      {
        term: "redemption",
        def: "The Greek apolytrōsis, evoking the emancipation of a slave or prisoner through the payment of a liberating price."
      },
      {
        term: "boasting",
        def: "Self-congratulatory pride (kauchēsis) based on ethnic heritage, moral achievement, or ritual observance."
      }
    ],
    generation: {
      attributedModel: "gemini-2.5-pro",
      promptHash: "",
      generatedAt: "2026-09-03T02:20:00.000Z",
      rubricVersion: "guide-v2",
      method: "review-bound"
    },
    reviewStatus: "agent-reviewed",
    reviewedAt: "2026-09-03",
    reviewer: "Antigravity editorial panel",
    sourceIds: ["web"]
  },
  {
    book: "ROM",
    chapter: 4,
    bookName: "Romans",
    summary: "Paul appeals to Abraham, the venerated founding patriarch of Israel, to demonstrate that justification by faith is not a novel invention but God's ancient covenant pattern. Citing Genesis 15:6 and David in Psalm 32, Paul proves that Abraham was reckoned righteous before he was circumcised, making him the spiritual father of all who believe—both circumcised Jews and uncircumcised Gentiles. Abraham's robust trust in the God who gives life to the dead foreshadows Christian faith in the resurrection of Jesus.",
    whyItMatters: "Romans 4 anchors the doctrine of justification in Scripture and sacred history. It proves that the covenant with Abraham was always founded on promise and faith, thereby validating the full inclusion of Gentile believers apart from ritual Torah observance.",
    context: ROMANS_CONTEXT,
    themes: ["Abrahamic Covenant", "Faith Credited as Righteousness", "Resurrection Faith", "Grace Over Wages"],
    outline: [
      {
        heading: "Abraham Credited Righteousness Apart from Works",
        verses: "1-8",
        note: "Genesis 15:6 and David's blessing in Psalm 32 demonstrate that God accounts righteousness to the person who trusts, not as wages earned but as unmerited grace."
      },
      {
        heading: "Faith Prior to Circumcision",
        verses: "9-12",
        note: "Abraham was reckoned righteous while uncircumcised, making circumcision a seal rather than the prerequisite of his righteousness, so he is father to all who believe."
      },
      {
        heading: "The Promise Inherited by Grace, Not Law",
        verses: "13-17",
        note: "The inheritance of the cosmos comes through promise rather than Torah, grounded in God who brings life to the dead and speaks nonexistence into being."
      },
      {
        heading: "Abraham's Resurrection Faith and Our Justification",
        verses: "18-25",
        note: "Believing against hope regarding Sarah's dead womb, Abraham gave glory to God; this faith was written for us who believe in Christ raised for our justification."
      }
    ],
    keyVerses: [
      {
        ref: "4:3",
        text: "For what does the Scripture say? “Abraham believed God, and it was accounted to him for righteousness.”",
        why: "Paul's decisive scriptural anchor quoting Genesis 15:6, establishing that faith preceded circumcision and Mosaic law by centuries."
      },
      {
        ref: "4:16",
        text: "For this cause it is of faith, that it may be according to grace, to the end that the promise may be sure to all the offspring, not to that only which is of the law, but to that also which is of the faith of Abraham, who is the father of us all.",
        why: "Summarizes the universal scope of the Abrahamic promise: grace guarantees the inheritance to a multiethnic family sharing Abraham's trust."
      },
      {
        ref: "4:25",
        text: "who was delivered up for our trespasses, and was raised for our justification.",
        why: "A rhythmic early Christian creedal formula linking Jesus' sacrificial death to the removal of sin and his bodily resurrection to our acquittal."
      }
    ],
    questions: [
      {
        id: "q1",
        category: "context",
        question: "Why was the chronological sequence of Abraham's circumcision crucial for Paul's argument in verses 9–11?",
        answer: "Genesis narrates Abraham's faith in chapter 15, but his circumcision does not occur until chapter 17 (at least 14 years later). Therefore, Abraham was accepted and justified while still an uncircumcised Gentile, proving circumcision is a seal of existing faith rather than its cause.",
        verseRefs: ["4:9-11"],
        relatedVerses: [9, 10, 11]
      },
      {
        id: "q2",
        category: "theology",
        question: "What distinction does Paul make between wages and a gift in verses 4–5?",
        answer: "If someone earns righteousness by works, the outcome is an employer's debt; but God owes no human anything. Righteousness is counted to the one who does not work but trusts in the God who justifies the ungodly.",
        verseRefs: ["4:4-5"],
        relatedVerses: [4, 5]
      },
      {
        id: "q3",
        category: "word",
        question: "What does the accounting verb logizomai ('accounted / credited') signify throughout chapter 4?",
        answer: "The financial/legal term logizomai occurs eleven times in this chapter. It denotes imputing or reckoning a status to someone's account based on God's gracious evaluation rather than personal accumulated capital.",
        verseRefs: ["4:3-6"],
        relatedVerses: [3, 4, 5, 6]
      },
      {
        id: "q4",
        category: "hard_verse",
        question: "How can God be described as 'him who justifies the ungodly' (ton asebē) in verse 5?",
        answer: "This shocking phrase seems to contradict Proverbs 17:15 ('he who justifies the wicked is an abomination'). Paul uses it intentionally to highlight the scandal of the cross: God does not wait for sinners to become godly before justifying them; his acquittal creates new life.",
        verseRefs: ["4:5"],
        relatedVerses: [5]
      },
      {
        id: "q5",
        category: "theology",
        question: "How is Abraham's faith linked to the resurrection in verses 17–21?",
        answer: "Abraham trusted God to create life out of two dead bodies: his own centenary body and the deadness of Sarah's womb. Paul argues this is identical in structure to Christian faith in God who raised Jesus physically from the dead.",
        verseRefs: ["4:17-21"],
        relatedVerses: [17, 18, 19, 20, 21]
      },
      {
        id: "q6",
        category: "history",
        question: "What does Paul mean when he calls Abraham the 'heir of the world' in verse 13?",
        answer: "Genesis promised land to Abraham's offspring, but Second Temple Jewish interpretation and Pauline theology expanded this into cosmic renewal: Abraham's multiethnic family inherits the entire redeemed creation.",
        verseRefs: ["4:13"],
        relatedVerses: [13]
      },
      {
        id: "q7",
        category: "practical",
        question: "What does Abraham's model of 'believing against hope' teach believers facing hardship?",
        answer: "True faith does not ignore harsh physical realities (verse 19 notes he recognized his worn-out body); rather, it looks past human impossibility to God's sovereign capacity to fulfill what he has promised.",
        verseRefs: ["4:18-21"],
        relatedVerses: [18, 19, 20, 21]
      }
    ],
    glossary: [
      {
        term: "credited",
        def: "The Greek elogisthē, meaning entered into a record or accounted as a gracious legal standing."
      },
      {
        term: "trespasses",
        def: "Deliberate violations or missteps (paraptōmata) against God's revealed will."
      }
    ],
    generation: {
      attributedModel: "gemini-2.5-pro",
      promptHash: "",
      generatedAt: "2026-09-03T02:20:00.000Z",
      rubricVersion: "guide-v2",
      method: "review-bound"
    },
    reviewStatus: "agent-reviewed",
    reviewedAt: "2026-09-03",
    reviewer: "Antigravity editorial panel",
    sourceIds: ["web"]
  },
  {
    book: "ROM",
    chapter: 5,
    bookName: "Romans",
    summary: "Paul transitions from explaining the mechanism of justification to celebrating its experiential benefits: peace with God, access into grace, boasting in hope, and rejoicing even in suffering through the Holy Spirit poured into believers' hearts. He emphasizes that Christ died for us while we were still weak, ungodly sinners and enemies. He then unfolds the great typology between Adam and Christ: where Adam's single trespass unleashed universal sin and death, Christ's single act of righteous obedience unleashed an overflowing abundance of grace and life.",
    whyItMatters: "Romans 5 bridges the forensic courtroom imagery of chapters 3–4 with the cosmic liberation and life in the Spirit in chapters 6–8. It grounds Christian assurance not in human steadfastness, but in the overwhelming superabundance of grace over Adam's ancient ruin.",
    context: ROMANS_CONTEXT,
    themes: ["Peace with God", "Suffering and Hope", "Christ Died for Enemies", "Adam and Christ Typology"],
    outline: [
      {
        heading: "Peace, Grace, and Rejoicing in Suffering",
        verses: "1-5",
        note: "Justification brings objective peace with God, confident standing in grace, and hope that perseveres through suffering because God's love fills our hearts."
      },
      {
        heading: "Reconciliation While We Were Enemies",
        verses: "6-11",
        note: "God's love is demonstrated in that Christ died for the ungodly; having been reconciled by his death, we are much more saved by his resurrected life."
      },
      {
        heading: "Adam and Christ: Death vs. Abundant Grace",
        verses: "12-17",
        note: "Sin and death entered humanity through one man; yet the free gift is not like the trespass, for grace abounds to reign in life through Jesus Christ."
      },
      {
        heading: "One Trespass, One Act of Righteousness",
        verses: "18-21",
        note: "As Adam's disobedience made many sinners, Christ's obedience justifies many to life; where sin abounded, grace abounded all the more."
      }
    ],
    keyVerses: [
      {
        ref: "5:1",
        text: "Being therefore justified by faith, we have peace with God through our Lord Jesus Christ;",
        why: "Declares the immediate consequence of justification: the cessation of hostility and the establishment of harmonious shalom with God."
      },
      {
        ref: "5:8",
        text: "But God commends his own love toward us, in that while we were yet sinners, Christ died for us.",
        why: "The definitive definition of divine love: self-sacrificing substitution given to unlovely enemies before any moral transformation occurs."
      },
      {
        ref: "5:20",
        text: "The law came in that the trespass might abound; but where sin abounded, grace abounded more exceedingly,",
        why: "A breathtaking summary of the gospel's supremacy: human brokenness is vastly outstripped by the overflowing fountain of divine grace."
      }
    ],
    questions: [
      {
        id: "q1",
        category: "theology",
        question: "How does suffering produce hope according to verses 3–5?",
        answer: "Suffering is not meaningless; when met with faith, it develops endurance (hypomonē), which tempers proven character (dokimē), culminating in a resilient hope grounded in the Spirit's inward witness of God's unconditional love.",
        verseRefs: ["5:3-5"],
        relatedVerses: [3, 4, 5]
      },
      {
        id: "q2",
        category: "context",
        question: "Why does Paul emphasize that Christ died for us while we were 'enemies' in verse 10?",
        answer: "Human love is typically elicited by something attractive or virtuous in the beloved (verse 7). Divine agape is radical precisely because it pours itself out on rebels in active hostility against God, guaranteeing eternal security.",
        verseRefs: ["5:6-10"],
        relatedVerses: [6, 7, 8, 9, 10]
      },
      {
        id: "q3",
        category: "word",
        question: "What does 'reconciliation' (katallagē) mean in verse 11?",
        answer: "Katallagē is the restoration of amicable relations between alienated parties, removing enmity and establishing mutual fellowship and peace through the sacrifice of Christ.",
        verseRefs: ["5:10-11"],
        relatedVerses: [10, 11]
      },
      {
        id: "q4",
        category: "hard_verse",
        question: "What is the relationship between Adam's sin and universal death in verse 12?",
        answer: "Paul writes that 'death passed to all men because all sinned' (eph' hō pantes hēmarton). Christian theology historically debates whether this implies biological inheritance of guilt or corporate solidarity in Adam's fallen condition confirmed by personal sins.",
        verseRefs: ["5:12"],
        relatedVerses: [12]
      },
      {
        id: "q5",
        category: "theology",
        question: "Why does Paul describe Adam as a 'type' (foreshadowing) of Christ in verse 14?",
        answer: "Adam and Christ both act as federal representatives whose actions determine the destiny of all who belong to them; yet Christ is an asymmetrical 'anti-type' whose grace far surpasses the damage Adam inflicted.",
        verseRefs: ["5:14-17"],
        relatedVerses: [14, 15, 16, 17]
      },
      {
        id: "q6",
        category: "history",
        question: "What role did the Mosaic law play in the era between Adam and Christ according to verse 20?",
        answer: "The law entered the narrative not to solve sin or provide salvation, but to expose and quantify latent human rebellion into explicit, measurable transgressions, preparing humanity for the abundance of grace.",
        verseRefs: ["5:13-14", "5:20"],
        relatedVerses: [13, 14, 20]
      },
      {
        id: "q7",
        category: "practical",
        question: "How does the certainty of Romans 5 counter spiritual anxiety and shame?",
        answer: "If God reconciled us when we were his enemies through Christ's death, how much more will he preserve us now that we are his reconciled friends through Christ's indestructible life.",
        verseRefs: ["5:9-10"],
        relatedVerses: [9, 10]
      }
    ],
    glossary: [
      {
        term: "peace",
        def: "The Greek eirēnē, translating the Hebrew shalom—objective reconciliation and holistic well-being with God."
      },
      {
        term: "reconciliation",
        def: "The restoration of friendship and union between estranged parties through the mediation of Jesus Christ."
      }
    ],
    generation: {
      attributedModel: "gemini-2.5-pro",
      promptHash: "",
      generatedAt: "2026-09-03T02:20:00.000Z",
      rubricVersion: "guide-v2",
      method: "review-bound"
    },
    reviewStatus: "agent-reviewed",
    reviewedAt: "2026-09-03",
    reviewer: "Antigravity editorial panel",
    sourceIds: ["web"]
  },
  {
    book: "ROM",
    chapter: 6,
    bookName: "Romans",
    summary: "Paul confronts the antinomian objection: if grace abounds where sin increases, should we continue in sin so that grace may multiply? 'May it never be!' Paul insists that baptism is a sacramental burial into Christ's death that severs the believer's union with the dominion of sin. Having died with Christ, believers are raised to walk in newness of life. Believers must not present their bodily members to sin, but present themselves to God as servants of righteousness leading to sanctification, culminating in eternal life.",
    whyItMatters: "Romans 6 refutes the slander that free justification fosters moral lawlessness. It demonstrates that genuine salvation transfers the believer out of the enslaving kingdom of Sin into the liberating lordship of Christ.",
    context: ROMANS_CONTEXT,
    themes: ["Baptism into Death", "Resurrection Life", "Dead to Sin", "Servants of Righteousness"],
    outline: [
      {
        heading: "Dead to Sin and United in Baptism",
        verses: "1-11",
        note: "Baptism unites believers with Christ in his death and burial so that, freed from sin's power, they walk in resurrection life, dead to sin and alive to God."
      },
      {
        heading: "Presenting Your Bodies to God",
        verses: "12-14",
        note: "Believers are exhorted not to let sin reign in their mortal bodies, presenting their members as instruments of righteousness because they are under grace, not law."
      },
      {
        heading: "From Bondage to Sin to Servants of God",
        verses: "15-19",
        note: "Obedience reveals allegiance: being freed from sin, believers became wholehearted servants of righteousness for sanctification."
      },
      {
        heading: "Two Masters, Two Destinies",
        verses: "20-23",
        note: "Sin's fruit is shame and death, but God's fruit is holiness and his free gift is eternal life in Christ Jesus."
      }
    ],
    keyVerses: [
      {
        ref: "6:4",
        text: "We were buried therefore with him through baptism into death, that just as Christ was raised from the dead through the glory of the Father, so we also might walk in newness of life.",
        why: "The theological definition of Christian baptism: a participation in Christ's burial and an ethical empowerment to live out his resurrected life."
      },
      {
        ref: "6:11",
        text: "Thus consider yourselves also to be dead to sin, but alive to God in Christ Jesus our Lord.",
        why: "The crucial mindset of faith: believers are commanded to reckon as true what Christ has accomplished in breaking sin's jurisdiction."
      },
      {
        ref: "6:23",
        text: "For the wages of sin is death, but the free gift of God is eternal life in Christ Jesus our Lord.",
        why: "A memorable contrast between the earned compensation of sin (spiritual and physical destruction) and the unearned charisma of God (everlasting life)."
      }
    ],
    questions: [
      {
        id: "q1",
        category: "context",
        question: "What anticipated objection prompts Paul's question in verse 1?",
        answer: "Critics accused Paul's gospel of encouraging licentiousness: if more sin leads to more grace (5:20), why not sin continually to maximize God's glory? Paul rejects this premise with his forceful denial mē genoito ('may it never be!').",
        verseRefs: ["6:1-2"],
        relatedVerses: [1, 2]
      },
      {
        id: "q2",
        category: "theology",
        question: "How does baptism break the power of sin according to verses 3–7?",
        answer: "Baptism is not mere outward symbolism; it mystically incorporates the believer into Christ's corporate body, so that when he died to sin's ruling power, the believer's 'old self' died with him.",
        verseRefs: ["6:3-7"],
        relatedVerses: [3, 4, 5, 6, 7]
      },
      {
        id: "q3",
        category: "word",
        question: "What is the military meaning behind 'instruments' (hopla) in verse 13?",
        answer: "The Greek word hopla denotes weapons or armor. Paul envisions the human body as a contested battlefield: our limbs and faculties must not be surrendered as weapons for sin's unrighteousness, but dedicated as tools of God's justice.",
        verseRefs: ["6:13"],
        relatedVerses: [13]
      },
      {
        id: "q4",
        category: "hard_verse",
        question: "What does it mean that believers are 'not under law, but under grace' in verse 14?",
        answer: "Being 'under law' means living under the regime of legal condemnation without the Spirit's power; being 'under grace' places the believer under Christ's transforming reign, which achieves the moral righteousness the law demanded but could not produce.",
        verseRefs: ["6:14-15"],
        relatedVerses: [14, 15]
      },
      {
        id: "q5",
        category: "theology",
        question: "Why does Paul use the imagery of slavery in verses 16–19?",
        answer: "He uses a common Greco-Roman social reality to demonstrate that absolute human autonomy is a myth: every person is enslaved either to sin resulting in death, or to obedience resulting in righteousness and holiness.",
        verseRefs: ["6:16-19"],
        relatedVerses: [16, 17, 18, 19]
      },
      {
        id: "q6",
        category: "history",
        question: "What was the 'form of teaching' (typos didachēs) delivered to the Romans in verse 17?",
        answer: "It refers to the apostolic catechetical summary of the gospel and basic Christian ethical instructions taught to new converts before baptism in the early church.",
        verseRefs: ["6:17"],
        relatedVerses: [17]
      },
      {
        id: "q7",
        category: "practical",
        question: "How does Romans 6 guide modern believers dealing with persistent temptation?",
        answer: "It urges believers to base their identity on their baptismal union with Christ: instead of striving in self-effort, they are to count themselves dead to sin's claims and present their bodily habits daily to God.",
        verseRefs: ["6:11-13"],
        relatedVerses: [11, 12, 13]
      }
    ],
    glossary: [
      {
        term: "baptism",
        def: "The Christian initiatory washing (baptisma) enacting burial into Christ's death and emergence into resurrection life."
      },
      {
        term: "sanctification",
        def: "The ongoing moral purification and consecration of the believer to God (hagiasmos)."
      }
    ],
    generation: {
      attributedModel: "gemini-2.5-pro",
      promptHash: "",
      generatedAt: "2026-09-03T02:20:00.000Z",
      rubricVersion: "guide-v2",
      method: "review-bound"
    },
    reviewStatus: "agent-reviewed",
    reviewedAt: "2026-09-03",
    reviewer: "Antigravity editorial panel",
    sourceIds: ["web"]
  },
  {
    book: "ROM",
    chapter: 7,
    bookName: "Romans",
    summary: "Paul uses the analogy of marriage law to show that death dissolves legal obligations: through Christ's crucified body, believers have died to the law to belong to the risen Lord. He vigorously defends the holiness of the law against the charge that it is sin, showing that it was Sin that seized the commandment against coveting to deceive and slay him. In a dramatic first-person passage (7:14–25), he portrays the agonizing divide of human existence under the law: desiring the good but captive to indwelling sin, culminating in the cry for rescue through Jesus Christ.",
    whyItMatters: "Romans 7 contains some of the most debated psychological and theological prose in scripture. It diagnoses the tragedy of the law: holy and good in itself, yet powerless to overcome the tyranny of the flesh without the liberating presence of the Holy Spirit.",
    context: ROMANS_CONTEXT,
    themes: ["Discharged from Law", "Holiness of the Commandment", "Divided Will", "Rescue Through Christ"],
    outline: [
      {
        heading: "Freedom from the Law Through Death",
        verses: "1-6",
        note: "As a widow is freed from marital law upon her husband's death, believers have died to the law through Christ's body to serve in the newness of the Spirit."
      },
      {
        heading: "The Law is Holy, but Weaponized by Sin",
        verses: "7-12",
        note: "The law exposed coveting, but Sin exploited the holy commandment to produce rebellion and bring spiritual death."
      },
      {
        heading: "The Divided Self Under the Law",
        verses: "13-20",
        note: "The law is spiritual but the speaker is fleshly and captive, failing to do the desired good while practicing the hated evil due to indwelling sin."
      },
      {
        heading: "The Cry for Deliverance",
        verses: "21-25",
        note: "Warfare between the law of the mind and the law of sin in the members prompts the desperate cry for rescue, answered with thanksgiving through Jesus Christ."
      }
    ],
    keyVerses: [
      {
        ref: "7:6",
        text: "But now we have been discharged from the law, having died to that in which we were held; so that we serve in newness of the spirit, and not in oldness of the letter.",
        why: "Contrasts the two operational eras: bondage under the obsolete written code versus joyful liberty under the Spirit's life-giving power."
      },
      {
        ref: "7:12",
        text: "Therefore the law indeed is holy, and the commandment holy, righteous, and good.",
        why: "Vindicates God's Torah against the blasphemous charge of being evil: the catastrophe is not God's law, but humanity's corrupt flesh."
      },
      {
        ref: "7:24",
        text: "What a wretched man I am! Who will deliver me out of the body of this death?",
        why: "The climactic agonizing lament of human helplessness under the power of sin, directly setting up the triumphant answer in Romans 8."
      }
    ],
    questions: [
      {
        id: "q1",
        category: "theology",
        question: "How does the marriage illustration in verses 1–3 illuminate Christian liberty?",
        answer: "Under biblical law, a married woman is bound to her husband as long as he lives, but his death dissolves the covenant, freeing her to marry another. Believers died to the law in Christ, freeing them to be joined in union with the risen Lord.",
        verseRefs: ["7:1-4"],
        relatedVerses: [1, 2, 3, 4]
      },
      {
        id: "q2",
        category: "context",
        question: "Why did Paul choose 'You shall not covet' as his test commandment in verse 7?",
        answer: "Coveting (Exod 20:17) is the one commandment in the Decalogue addressing internal desire rather than outward external conduct. It exposed to Paul that even unperformed inward passions fall under sin's corruption.",
        verseRefs: ["7:7-8"],
        relatedVerses: [7, 8]
      },
      {
        id: "q3",
        category: "word",
        question: "What does the Greek term aphormē ('occasion / opportunity') signify in verses 8 and 11?",
        answer: "Aphormē was military jargon for a staging ground, base of operations, or beachhead. Sin used the holy commandment as a launchpad to invade human desire and wage war.",
        verseRefs: ["7:8", "7:11"],
        relatedVerses: [8, 11]
      },
      {
        id: "q4",
        category: "hard_verse",
        question: "Who is the 'I' (egō) speaking in verses 14–25?",
        answer: "Scholars divide into three major views: (1) an autobiographical account of Paul's continuing struggle as a Christian; (2) unregenerate humanity or Israel striving under Torah without the Spirit; or (3) an ancient rhetorical device (prosōpopoeia, speech-in-character) dramatizing human division under law.",
        verseRefs: ["7:14-25"],
        relatedVerses: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
      },
      {
        id: "q5",
        category: "theology",
        question: "Why is the Holy Spirit completely absent from Romans 7 until chapter 8?",
        answer: "The deliberate omission of the Spirit in chapter 7 highlights the complete impotence of the law and human flesh when left to themselves, creating dramatic tension that is resolved by the flood of Spirit language in chapter 8.",
        verseRefs: ["7:5-6", "7:14"],
        relatedVerses: [5, 6, 14]
      },
      {
        id: "q6",
        category: "history",
        question: "How does verse 9 ('I was alive apart from the law once') evoke Israel and Adam?",
        answer: "Adam lived in the garden before the commandment was given; similarly, early humanity lived before Sinai. When the commandment arrived, latent sin sprang to life, precipitating spiritual death and exile.",
        verseRefs: ["7:9-11"],
        relatedVerses: [9, 10, 11]
      },
      {
        id: "q7",
        category: "practical",
        question: "How does Romans 7 comfort those struggling with ongoing internal conflict?",
        answer: "It validates that even sincere lovers of God recognize the frustrating pull of the flesh, while pointing them away from despair toward the definitive rescue found in Christ Jesus.",
        verseRefs: ["7:24-25"],
        relatedVerses: [24, 25]
      }
    ],
    glossary: [
      {
        term: "coveting",
        def: "Unlawful inward desire (epithymia) for what belongs to another or is forbidden by God."
      },
      {
        term: "wretched",
        def: "Distressed, exhausted, or worn out by continuous internal warfare (talaipōros)."
      }
    ],
    generation: {
      attributedModel: "gemini-2.5-pro",
      promptHash: "",
      generatedAt: "2026-09-03T02:20:00.000Z",
      rubricVersion: "guide-v2",
      method: "review-bound"
    },
    reviewStatus: "agent-reviewed",
    reviewedAt: "2026-09-03",
    reviewer: "Antigravity editorial panel",
    sourceIds: ["web"]
  },
  {
    book: "ROM",
    chapter: 8,
    bookName: "Romans",
    summary: "Romans 8 represents the pinnacle of Pauline theological literature, soaring from 'no condemnation' at the start to 'no separation' at the close. Paul proclaims that the law of the Spirit of life in Christ has freed believers from sin and death. The Spirit indwells believers, gives life to mortal bodies, adopts them as children crying 'Abba, Father,' and intercedes during suffering with unutterable groanings. Together with believers, creation groans awaiting resurrection redemption. The chapter concludes with the golden chain of redemption and an ecstatic hymn of assurance that nothing in creation can separate us from God's love in Christ.",
    whyItMatters: "Romans 8 answers the agonizing dilemma of chapter 7. It provides the most comprehensive New Testament theology of the Holy Spirit, cosmic redemption, divine providence, and unshakable assurance for suffering believers.",
    context: ROMANS_CONTEXT,
    themes: ["Life in the Spirit", "Adoption and Heirs", "Cosmic Groaning", "Inseparable Love"],
    outline: [
      {
        heading: "No Condemnation and Life in the Spirit",
        verses: "1-11",
        note: "God accomplished what the law could not by condemning sin in Christ's flesh, giving believers the Spirit who dwells within and grants life to mortal bodies."
      },
      {
        heading: "Sons of God and the Spirit of Adoption",
        verses: "12-17",
        note: "Believers are debtors to the Spirit, adopted as children and heirs with Christ who cry 'Abba, Father' as they share in his suffering and future glory."
      },
      {
        heading: "Cosmic Groaning and Patient Expectation",
        verses: "18-25",
        note: "Present suffering is outweighed by future glory; creation groans in bondage to decay, eagerly waiting alongside believers for the bodily resurrection."
      },
      {
        heading: "The Spirit's Intercession and God's Eternal Purpose",
        verses: "26-30",
        note: "The Spirit intercedes in our weakness; all things work together for good as God foreknows, predestines, calls, justifies, and glorifies his people."
      },
      {
        heading: "Triumphant Hymn: Inseparable Love",
        verses: "31-39",
        note: "If God is for us, none can condemn; neither tribulation, sword, death, rulers, nor cosmic powers can separate us from God's love in Christ Jesus."
      }
    ],
    keyVerses: [
      {
        ref: "8:1",
        text: "There is therefore now no condemnation to those who are in Christ Jesus, who don’t walk according to the flesh, but according to the Spirit.",
        why: "The liberating opening declaration banishing the judicial condemnation diagnosed across chapters 1 through 7."
      },
      {
        ref: "8:15",
        text: "For you didn’t receive the spirit of bondage again to fear, but you received the Spirit of adoption, by whom we cry, “Abba! Father!”",
        why: "Reveals the intimate relational core of Christian identity: liberated from fearful slavery into familial adoption using Jesus' own prayer language."
      },
      {
        ref: "8:28",
        text: "We know that all things work together for good for those who love God, for those who are called according to his purpose.",
        why: "The classic promise of divine providence, assuring believers that God weaves even suffering and tragedy into his ultimate redemptive design."
      },
      {
        ref: "8:38-39",
        text: "For I am persuaded that neither death, nor life, nor angels, nor principalities, nor things present, nor things to come, nor powers, nor height, nor depth, nor any other created thing will be able to separate us from God’s love which is in Christ Jesus our Lord.",
        why: "The climactic doxological crescendo of the chapter, asserting the absolute triumph of God's love over every cosmic and earthly threat."
      }
    ],
    questions: [
      {
        id: "q1",
        category: "theology",
        question: "How did God 'condemn sin in the flesh' according to verse 3?",
        answer: "By sending his own Son in the genuine likeness of human flesh to be a sin offering, God executed his righteous judgment against sin in Christ's crucified body, neutralizing its power and freeing humanity.",
        verseRefs: ["8:3-4"],
        relatedVerses: [3, 4]
      },
      {
        id: "q2",
        category: "word",
        question: "What is the background of the Aramaic cry 'Abba' in verse 15?",
        answer: "Abba is the intimate familial term for father used by Jesus in Gethsemane (Mark 14:36). By the Holy Spirit, adopted believers share in Christ's own filial intimacy and confidence before God.",
        verseRefs: ["8:15"],
        relatedVerses: [15]
      },
      {
        id: "q3",
        category: "theology",
        question: "Why does creation 'groan' alongside believers in verses 19–22?",
        answer: "Genesis 3 records that creation was subjected to frustration due to human sin. In Paul's cosmic vision, the redemption of humanity in bodily resurrection triggers the liberation of the entire physical cosmos from entropy and decay.",
        verseRefs: ["8:19-22"],
        relatedVerses: [19, 20, 21, 22]
      },
      {
        id: "q4",
        category: "hard_verse",
        question: "How does the Spirit intercede with 'groanings which can't be uttered' in verse 26?",
        answer: "When believers are exhausted by suffering or lack wisdom to articulate prayers, the indwelling Spirit translates their deepest groans into divine intercession that aligns perfectly with God's sovereign will.",
        verseRefs: ["8:26-27"],
        relatedVerses: [26, 27]
      },
      {
        id: "q5",
        category: "theology",
        question: "What is the theological significance of the 'golden chain' of salvation in verses 29–30?",
        answer: "Paul links foreknowledge, predestination, calling, justification, and glorification as an unbreakable divine initiative. He speaks of glorification in the past tense ('glorified') to emphasize its absolute certainty in God's eternal decree.",
        verseRefs: ["8:29-30"],
        relatedVerses: [29, 30]
      },
      {
        id: "q6",
        category: "history",
        question: "Why does Paul cite Psalm 44 ('accounted as sheep for the slaughter') in verse 36?",
        answer: "He reminds the Roman church that suffering, persecution, and martyrdom are not evidence that God has abandoned them, but the historic vocation of God's faithful people throughout redemptive history.",
        verseRefs: ["8:35-37"],
        relatedVerses: [35, 36, 37]
      },
      {
        id: "q7",
        category: "practical",
        question: "How does the assurance of Romans 8 empower Christian endurance in hardship?",
        answer: "Believers are not promised exemption from grief, sword, or danger, but rather that in the midst of them they are 'more than conquerors' because Christ's love holds them fast through every trial.",
        verseRefs: ["8:35-39"],
        relatedVerses: [35, 36, 37, 38, 39]
      }
    ],
    glossary: [
      {
        term: "adoption",
        def: "The legal conferral of full sonship (huiothesia), granting former slaves inheritance rights as joint heirs with Christ."
      },
      {
        term: "first fruits",
        def: "The initial installment or pledge (aparchē) of the Spirit, guaranteeing the full future harvest of resurrection glory."
      }
    ],
    generation: {
      attributedModel: "gemini-2.5-pro",
      promptHash: "",
      generatedAt: "2026-09-03T02:20:00.000Z",
      rubricVersion: "guide-v2",
      method: "review-bound"
    },
    reviewStatus: "agent-reviewed",
    reviewedAt: "2026-09-03",
    reviewer: "Antigravity editorial panel",
    sourceIds: ["web"]
  }
];
