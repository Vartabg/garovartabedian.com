export type StudyReference = {
  ref: string;
  label: string;
  note: string;
};

export type WordStudy = {
  id: string;
  theme: string;
  themeLabel: string;
  title: string;
  saying: string;
  anchor: { book: string; chapter: number; verse: number; label: string };
  scene: string;
  parallels: StudyReference[];
  roots: StudyReference[];
  /**
   * The Greek behind the saying, pointed at this site's own hosted critical
   * edition rather than an outside lookup. `verse` is where the word actually
   * occurs, which is not always the anchor: the prayer is anchored at Matthew
   * 6:9 but ἐπιούσιος is in 6:11. Checked at test time against the lemmas in
   * public/scriptures/original, so a term the hosted Greek does not contain
   * fails the build instead of linking a reader somewhere it isn't.
   */
  language: {
    term: string;
    transliteration: string;
    note: string;
    /** Defaults to the anchor verse. */
    verse?: number;
  };
  thread: StudyReference[];
  question: string;
};

export const WORD_STUDIES: WordStudy[] = [
  {
    id: "mustard-seed",
    theme: "kingdom",
    themeLabel: "The kingdom",
    title: "The mustard seed",
    saying: "The Kingdom of Heaven is like a grain of mustard seed.",
    anchor: { book: "MAT", chapter: 13, verse: 31, label: "Matthew 13:31" },
    scene: "Matthew places this image in a sequence of lakeside parables. Jesus addresses the crowd publicly, then explains selected images to the disciples in private.",
    parallels: [
      { ref: "MRK 4:30", label: "Mark 4:30–32", note: "Mark asks what image can describe God's kingdom." },
      { ref: "LUK 13:18", label: "Luke 13:18–19", note: "Luke pairs the seed with the leaven." },
    ],
    roots: [
      { ref: "EZK 17:22", label: "Ezekiel 17:22–24", note: "A planted sprig becomes a tree where birds shelter." },
      { ref: "DAN 4:12", label: "Daniel 4:12", note: "A great tree shelters creatures beneath its branches." },
    ],
    language: {
      term: "βασιλεία",
      transliteration: "basileia",
      note: "Usually rendered “kingdom”; the word can point to royal rule as well as a realm. Read the image as a claim about God's reign, not only a place.",
    },
    thread: [
      { ref: "MAT 4:17", label: "Matthew 4:17", note: "The announcement" },
      { ref: "MAT 6:10", label: "Matthew 6:10", note: "The prayer" },
      { ref: "MAT 25:34", label: "Matthew 25:34", note: "The inheritance" },
    ],
    question: "What does the contrast between a tiny beginning and a sheltering result ask the hearer to notice?",
  },
  {
    id: "lords-prayer",
    theme: "prayer",
    themeLabel: "Prayer",
    title: "Teach us to pray",
    saying: "Our Father in heaven, may your name be kept holy.",
    anchor: { book: "MAT", chapter: 6, verse: 9, label: "Matthew 6:9" },
    scene: "In the Sermon on the Mount, the prayer follows warnings against performing devotion for an audience and against piling up empty phrases.",
    parallels: [
      { ref: "LUK 11:1", label: "Luke 11:1–4", note: "A shorter form follows a disciple's direct request for instruction." },
    ],
    roots: [
      { ref: "ISA 63:16", label: "Isaiah 63:16", note: "God is addressed as Father and Redeemer." },
      { ref: "1CH 29:11", label: "1 Chronicles 29:11", note: "Kingdom, power, and glory belong to God." },
    ],
    language: {
      term: "ἐπιούσιος",
      transliteration: "epiousios",
      verse: 11,
      note: "The unusual word translated “daily” appears in the New Testament only in the two forms of this prayer. Its rarity is one reason translations vary.",
    },
    thread: [
      { ref: "MAT 6:5", label: "Matthew 6:5–8", note: "How not to pray" },
      { ref: "MAT 6:14", label: "Matthew 6:14–15", note: "Forgiveness after the prayer" },
      { ref: "MAT 26:39", label: "Matthew 26:39", note: "Jesus prays in crisis" },
    ],
    question: "How do the prayer's God-facing requests reshape the needs that follow them?",
  },
  {
    id: "love-enemies",
    theme: "love",
    themeLabel: "Love and mercy",
    title: "Love your enemies",
    saying: "Love your enemies, bless those who curse you.",
    anchor: { book: "MAT", chapter: 5, verse: 44, label: "Matthew 5:44" },
    scene: "This saying closes a series in which Jesus cites familiar commands and presses beyond retaliation toward active goodwill, prayer, and undiscriminating generosity.",
    parallels: [
      { ref: "LUK 6:27", label: "Luke 6:27–36", note: "Luke expands the command with concrete actions and ends with mercy." },
    ],
    roots: [
      { ref: "EXO 23:4", label: "Exodus 23:4–5", note: "Return an enemy's animal and help under its burden." },
      { ref: "PRO 25:21", label: "Proverbs 25:21–22", note: "Feed an enemy who is hungry." },
    ],
    language: {
      term: "ἐχθρός",
      transliteration: "echthros",
      note: "The noun means an enemy or hostile person. The next line makes “love” concrete: pray for the people who persecute you.",
    },
    thread: [
      { ref: "MAT 5:38", label: "Matthew 5:38–42", note: "Refusing retaliation" },
      { ref: "MAT 7:12", label: "Matthew 7:12", note: "The Golden Rule" },
      { ref: "MAT 22:37", label: "Matthew 22:37–40", note: "Love as the law's center" },
    ],
    question: "Which verbs around “love” turn an inward feeling into a practice?",
  },
  {
    id: "take-up-cross",
    theme: "discipleship",
    themeLabel: "Discipleship",
    title: "Take up the cross",
    saying: "Whoever wants to come after me, let him deny himself, and take up his cross, and follow me.",
    anchor: { book: "MRK", chapter: 8, verse: 34, label: "Mark 8:34" },
    scene: "The call comes immediately after Peter names Jesus as the Christ, Jesus predicts rejection and death, and Peter resists that path. Jesus then summons both the disciples and the crowd.",
    parallels: [
      { ref: "MAT 16:24", label: "Matthew 16:24–26", note: "Matthew preserves the same sequence after Peter's confession." },
      { ref: "LUK 9:23", label: "Luke 9:23–25", note: "Luke adds “daily” to taking up the cross." },
    ],
    roots: [
      { ref: "MRK 8:31", label: "Mark 8:31–33", note: "The first passion prediction gives the saying its immediate frame." },
      { ref: "ISA 50:6", label: "Isaiah 50:6–9", note: "A servant faces shame and violence while trusting God's vindication." },
    ],
    language: {
      term: "ἀκολουθέω",
      transliteration: "akoloutheō",
      note: "The verb means to follow or accompany. Here it is the final movement in a sequence: deny, take up, follow.",
    },
    thread: [
      { ref: "MRK 1:17", label: "Mark 1:17–20", note: "The first call to follow" },
      { ref: "MRK 9:35", label: "Mark 9:35", note: "Last and servant of all" },
      { ref: "MRK 10:42", label: "Mark 10:42–45", note: "Greatness as service" },
    ],
    question: "How does the surrounding argument with Peter change what “follow me” means here?",
  },
  {
    id: "before-abraham",
    theme: "identity",
    themeLabel: "Identity",
    title: "Before Abraham was",
    saying: "Most certainly, I tell you, before Abraham came into existence, I am.",
    anchor: { book: "JHN", chapter: 8, verse: 58, label: "John 8:58" },
    scene: "The statement ends a long temple dispute about ancestry, freedom, truth, and who can rightly claim Abraham as father. The crowd's attempt to stone Jesus shows how sharply they hear it.",
    parallels: [
      { ref: "JHN 8:24", label: "John 8:24", note: "An earlier “I am” saying inside the same dispute." },
      { ref: "JHN 13:19", label: "John 13:19", note: "Jesus says events will lead the disciples to believe “I am.”" },
    ],
    roots: [
      { ref: "EXO 3:14", label: "Exodus 3:14", note: "God's answer to Moses is the central scriptural comparison readers bring to this wording." },
      { ref: "ISA 43:10", label: "Isaiah 43:10–13", note: "Isaiah frames divine identity with repeated first-person declarations that readers compare with this language." },
    ],
    language: {
      term: "ἐγώ εἰμι",
      transliteration: "egō eimi",
      note: "Literally “I am.” The phrase can be ordinary Greek; in John's repeated pattern and this pre-Abraham contrast, its context carries the interpretive weight.",
    },
    thread: [
      { ref: "JHN 6:35", label: "John 6:35", note: "Bread of life" },
      { ref: "JHN 10:11", label: "John 10:11", note: "Good shepherd" },
      { ref: "JHN 11:25", label: "John 11:25", note: "Resurrection and life" },
    ],
    question: "Which earlier claims in the argument make this final sentence more than a stand-alone slogan?",
  },
  {
    id: "new-commandment",
    theme: "last-night",
    themeLabel: "The last night",
    title: "A new commandment",
    saying: "Just as I have loved you, you also love one another.",
    anchor: { book: "JHN", chapter: 13, verse: 34, label: "John 13:34" },
    scene: "Jesus speaks after washing the disciples' feet, identifying the betrayer, and telling the group that he is going away. The command interprets what he has just enacted.",
    parallels: [
      { ref: "JHN 15:12", label: "John 15:12–17", note: "The command returns with friendship and self-giving love in view." },
    ],
    roots: [
      { ref: "LEV 19:18", label: "Leviticus 19:18", note: "The command to love one's neighbor is not new; Jesus gives it a new measure: “as I have loved you.”" },
      { ref: "JHN 13:1", label: "John 13:1–17", note: "The footwashing supplies the immediate enacted pattern." },
    ],
    language: {
      term: "καθώς",
      transliteration: "kathōs",
      note: "Rendered “just as” or “as.” This small linking word makes Jesus' own action the pattern and measure of the command.",
    },
    thread: [
      { ref: "JHN 13:14", label: "John 13:14–15", note: "The enacted example" },
      { ref: "JHN 15:13", label: "John 15:13", note: "Love that lays down life" },
      { ref: "JHN 17:20", label: "John 17:20–23", note: "Unity as public witness" },
    ],
    question: "What in the footwashing and farewell gives the old command its new standard?",
  },
];

export const WORD_STUDY_THEMES = WORD_STUDIES.map(({ theme, themeLabel }) => ({
  id: theme,
  label: themeLabel,
}));
