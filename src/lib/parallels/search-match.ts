export type MatchedParallel = {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  href: string;
  witnesses: string[];
};

const MATRIX_KEYWORDS: Array<{
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  href: string;
  witnesses: string[];
  patterns: RegExp[];
}> = [
  {
    id: "sacrifice-of-the-son",
    title: "The Sacrifice of the Son",
    subtitle: "Genesis 22 · Jubilees 17–18 · Qur'an 37:99–113",
    summary: "Compare the binding of the son across the Hebrew Bible, Second Temple Jubilees, and the Qur'an.",
    href: "/scriptures/parallels/sacrifice-of-the-son",
    witnesses: ["Genesis 22", "Jubilees 17–18", "Qur'an 37"],
    patterns: [
      /\bsacrifice\b.*\b(son|isaac|ishmael)\b/i,
      /\bbinding\b.*\b(isaac|son)\b/i,
      /\bmoriah\b/i,
      /\bakedah\b/i,
      /\beid\s+al-adha\b/i,
      /\bibrahim\b/i,
      /\bisaac\b/i,
    ],
  },
  {
    id: "adam-fall-and-iblis",
    title: "Creation, Rebellion of Iblis & The Fall",
    subtitle: "Genesis 3 · Vita Adae 12–16 · Qur'an 2:30–39 & 7:11–27",
    summary: "The primeval fall, Satan refusing to bow to clay, and the origins of human sin across three witnesses.",
    href: "/scriptures/parallels/adam-fall-and-iblis",
    witnesses: ["Genesis 3", "Vita Adae", "Qur'an 2 & 7"],
    patterns: [
      /\biblis\b/i,
      /\badam\b.*\b(fall|sin|iblis|clay)\b/i,
      /\btree\s+of\s+(the\s+)?knowledge\b/i,
      /\bbow\s+to\s+adam\b/i,
      /\boriginal\s+sin\b/i,
      /\bserpent\b.*\bgarden\b/i,
    ],
  },
  {
    id: "infancy-and-clay-birds",
    title: "The Annunciation, Nativity & Childhood Signs",
    subtitle: "Luke 1–2 · Protoevangelium of James · Infancy Thomas · Qur'an 3 & 19",
    summary: "Mary's temple childhood, birth under the palm tree, cradle speech, and the clay birds miracle.",
    href: "/scriptures/parallels/infancy-and-clay-birds",
    witnesses: ["Luke 1–2", "Protoevangelium", "Infancy Thomas", "Qur'an 3 & 19"],
    patterns: [
      /\bclay\s+birds?\b/i,
      /\bcradle\b/i,
      /\bpalm\s+tree\b.*\b(mary|birth|jesus)\b/i,
      /\bprotoevangelium\b/i,
      /\binfancy\s+gospel\b/i,
    ],
  },
  {
    id: "the-golden-calf-and-samiri",
    title: "The Golden Calf Apostasy: Aaron & Al-Samiri",
    subtitle: "Exodus 32 · Qur'an 20:83–98",
    summary: "Aaron's role under pressure vs. Al-Samiri's deception and the doctrine of prophetic infallibility.",
    href: "/scriptures/parallels/the-golden-calf-and-samiri",
    witnesses: ["Exodus 32", "Qur'an 20"],
    patterns: [
      /\bgolden\s+calf\b/i,
      /\bsamiri\b/i,
      /\baaron\b.*\bcalf\b/i,
      /\bmolten\s+calf\b/i,
    ],
  },
  {
    id: "sanctity-of-human-life",
    title: "The Blood of Abel & The Value of One Human Life",
    subtitle: "Genesis 4:8–10 · Mishnah Sanhedrin 4:5 · Qur'an 5:32",
    summary: "Cosmic justice for murder and the maxim that saving a single soul saves the entire world.",
    href: "/scriptures/parallels/sanctity-of-human-life",
    witnesses: ["Genesis 4", "Mishnah Sanhedrin 4:5", "Qur'an 5:32"],
    patterns: [
      /\bsanctity\s+of\s+life\b/i,
      /\bsave(s|d)?\s+(a\s+)?(single\s+)?(life|soul|world)\b/i,
      /\bkill(s|ed|ing)?\s+all\s+mankind\b/i,
      /\bblood(s)?\s+of\s+abel\b/i,
      /\bmishnah\s+sanhedrin\b/i,
      /\bcain\s+and\s+abel\b/i,
    ],
  },
  {
    id: "the-watchers",
    title: "The Watchers: Genesis 6 Expanded",
    subtitle: "Genesis 6:1–4 · 1 Enoch 6–16",
    summary: "The terse Genesis notice about the sons of God and Nephilim compared to the expansive Enochic account.",
    href: "/scriptures/parallels/the-watchers",
    witnesses: ["Genesis 6", "1 Enoch 6–16"],
    patterns: [
      /\bwatchers\b/i,
      /\bnephilim\b/i,
      /\bsons\s+of\s+god\b/i,
      /\bazazel\b/i,
      /\bgenesis\s+6\b/i,
    ],
  },
  {
    id: "jude-enoch-quotation",
    title: "The Prophecy Jude Quoted",
    subtitle: "Jude 14–15 · 1 Enoch 1:9",
    summary: "Verbatim textual comparison of Jude citing the Seventh from Adam against the Ge'ez and Greek Enoch texts.",
    href: "/scriptures/parallels/jude-enoch-quotation",
    witnesses: ["Jude 14–15", "1 Enoch 1:9"],
    patterns: [
      /\bjude\b.*\benoch\b/i,
      /\bten\s+thousands\s+of\s+(his\s+)?holy\s+ones\b/i,
      /\bseventh\s+from\s+adam\b/i,
      /\bprophecy\s+of\s+enoch\b/i,
    ],
  },
  {
    id: "son-of-man",
    title: "The Son of Man on the Throne",
    subtitle: "Daniel 7:13–14 · 1 Enoch 46 / 71 · Matthew 26:64",
    summary: "The apocalyptic Son of Man title from Daniel 7, Enoch's Similitudes, and Jesus' trial before the Sanhedrin.",
    href: "/scriptures/parallels/son-of-man",
    witnesses: ["Daniel 7", "1 Enoch 46/71", "Matthew 26", "Mark 14"],
    patterns: [
      /\bson\s+of\s+man\b/i,
      /\bancient\s+of\s+days\b/i,
      /\bclouds\s+of\s+heaven\b/i,
      /\bthrone\s+of\s+glory\b/i,
      /\bright\s+hand\s+of\s+power\b/i,
    ],
  },
];

export function findMatchingParallels(query: string): MatchedParallel[] {
  const q = query.trim();
  if (!q || q.length < 3) return [];
  return MATRIX_KEYWORDS.filter(
    (entry) =>
      entry.patterns.some((pattern) => pattern.test(q)) ||
      entry.title.toLowerCase().includes(q.toLowerCase()),
  ).map((entry) => ({
    id: entry.id,
    title: entry.title,
    subtitle: entry.subtitle,
    summary: entry.summary,
    href: entry.href,
    witnesses: entry.witnesses,
  }));
}
