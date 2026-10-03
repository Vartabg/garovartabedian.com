export type ParallelLookup = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  traditionBadges: string[];
};

const CHAPTER_MAP: Record<string, ParallelLookup> = {
  "GEN:22": {
    id: "sacrifice-of-the-son",
    title: "The Sacrifice of the Son",
    subtitle: "Genesis 22 · Jubilees 17–18 · Qur'an 37:99–113",
    href: "/scriptures/parallels/sacrifice-of-the-son",
    traditionBadges: ["Hebrew Bible", "Jubilees (Second Temple)", "Qur'an 37"],
  },
  "GEN:3": {
    id: "adam-fall-and-iblis",
    title: "Creation, Rebellion of Iblis & The Fall",
    subtitle: "Genesis 3 · Vita Adae 12–16 · Qur'an 2:30–39 & 7:11–27",
    href: "/scriptures/parallels/adam-fall-and-iblis",
    traditionBadges: ["Genesis 3", "Vita Adae (Second Temple)", "Qur'an 2 & 7"],
  },
  "GEN:4": {
    id: "sanctity-of-human-life",
    title: "The Blood of Abel & The Value of One Life",
    subtitle: "Genesis 4:8–10 · Mishnah Sanhedrin 4:5 · Qur'an 5:32",
    href: "/scriptures/parallels/sanctity-of-human-life",
    traditionBadges: ["Genesis 4", "Mishnah Sanhedrin 4:5", "Qur'an 5:32"],
  },
  "EXO:32": {
    id: "the-golden-calf-and-samiri",
    title: "The Golden Calf Apostasy: Aaron and Al-Samiri",
    subtitle: "Exodus 32 · Qur'an 20:83–98",
    href: "/scriptures/parallels/the-golden-calf-and-samiri",
    traditionBadges: ["Exodus 32", "Qur'an 20 (Ta-Ha)"],
  },
  "LUK:1": {
    id: "infancy-and-clay-birds",
    title: "The Annunciation & Nativity under the Palm",
    subtitle: "Luke 1–2 · Protoevangelium of James · Qur'an 3 & 19",
    href: "/scriptures/parallels/infancy-and-clay-birds",
    traditionBadges: ["Luke 1–2", "Protoevangelium of James", "Qur'an 3 & 19"],
  },
  "LUK:2": {
    id: "infancy-and-clay-birds",
    title: "The Nativity under the Palm & Childhood Signs",
    subtitle: "Luke 1–2 · Infancy Gospel of Thomas · Qur'an 3 & 19",
    href: "/scriptures/parallels/infancy-and-clay-birds",
    traditionBadges: ["Luke 1–2", "Infancy Gospel of Thomas", "Qur'an 3 & 19"],
  },
  "MAT:2": {
    id: "infancy-and-clay-birds",
    title: "Childhood Signs & The Flight to Egypt",
    subtitle: "Matthew 2 · Gospel of Pseudo-Matthew · Qur'an 19",
    href: "/scriptures/parallels/infancy-and-clay-birds",
    traditionBadges: ["Matthew 2", "Early Apocrypha", "Qur'an 19"],
  },
  "GEN:6": {
    id: "the-watchers",
    title: "The Watchers: Genesis 6 Expanded",
    subtitle: "Genesis 6:1–4 · 1 Enoch 6–16",
    href: "/scriptures/parallels/the-watchers",
    traditionBadges: ["Genesis 6", "1 Enoch (Second Temple)"],
  },
  "2PE:2": {
    id: "the-watchers",
    title: "The Watchers & The Bound Angels",
    subtitle: "2 Peter 2:4 · 1 Enoch 10–12 · Jude 6",
    href: "/scriptures/parallels/the-watchers",
    traditionBadges: ["2 Peter 2", "1 Enoch", "Jude 6"],
  },
  "JUD:1": {
    id: "jude-enoch-quotation",
    title: "The Prophecy Jude Quoted",
    subtitle: "Jude 14–15 · 1 Enoch 1:9",
    href: "/scriptures/parallels/jude-enoch-quotation",
    traditionBadges: ["Jude 14–15", "1 Enoch 1:9 (Ge'ez / Greek)"],
  },
  "DAN:7": {
    id: "son-of-man",
    title: "The Son of Man on the Throne",
    subtitle: "Daniel 7:13–14 · 1 Enoch 46 / 71 · Matthew 26:64",
    href: "/scriptures/parallels/son-of-man",
    traditionBadges: ["Daniel 7", "1 Enoch Similitudes", "Matthew 26"],
  },
  "MAT:26": {
    id: "son-of-man",
    title: "The Son of Man at the Right Hand of Power",
    subtitle: "Matthew 26:63–65 · Daniel 7:13–14 · 1 Enoch 46",
    href: "/scriptures/parallels/son-of-man",
    traditionBadges: ["Matthew 26", "Daniel 7", "1 Enoch Similitudes"],
  },
  "MRK:14": {
    id: "son-of-man",
    title: "The High Priest's Trial: The Son of Man",
    subtitle: "Mark 14:61–62 · Daniel 7:13–14 · 1 Enoch 46",
    href: "/scriptures/parallels/son-of-man",
    traditionBadges: ["Mark 14", "Daniel 7", "1 Enoch Similitudes"],
  },
};

export function getParallelForChapter(bookId: string, chapter: number): ParallelLookup | null {
  const key = `${bookId.toUpperCase()}:${chapter}`;
  return CHAPTER_MAP[key] ?? null;
}
