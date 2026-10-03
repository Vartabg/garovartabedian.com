/**
 * Multi-Canonicity & Tradition Matrix.
 * Exhaustive canonical status, manuscript provenance, and historical council
 * metadata across Protestant, Catholic, Eastern Orthodox, Ethiopian Tewahedo,
 * Armenian Apostolic, and Jewish Tanakh traditions.
 */

import canonsData from "../../../public/scriptures/canons.json";
import type { Canons } from "./types";

export const canons = canonsData as Canons;

export type TraditionKey =
  | "protestant"
  | "catholic"
  | "orthodox"
  | "ethiopian"
  | "armenian"
  | "tanakh";

export type ManuscriptWitness = "DSS" | "LXX" | "MT" | "Vulg" | "Ge'ez" | "Peshitta";

export type BookCategory =
  | "torah"
  | "history"
  | "wisdom"
  | "prophets-major"
  | "prophets-minor"
  | "gospels"
  | "apostolic"
  | "epistles"
  | "apocalypse"
  | "deuterocanon"
  | "ethiopian-narrower";

export type CanonicalBook = {
  id: string;
  name: string;
  category: BookCategory;
  categoryName: string;
  testament: "OT" | "NT" | "Deutero" | "Pseudepigrapha";
  chapters: number;
  originalLanguage: "Hebrew" | "Aramaic" | "Hebrew/Aramaic" | "Greek" | "Ge'ez";
  manuscripts: ManuscriptWitness[];
  inTraditions: Record<TraditionKey, boolean>;
  tanakhCount?: string; // e.g. "One of The Twelve", "Combined with Ezra"
  historicalNote: string;
  href: string;
};

export type HistoricalMilestone = {
  year: number;
  dateStr: string;
  title: string;
  tradition: string;
  significance: string;
};

export const HISTORICAL_MILESTONES: HistoricalMilestone[] = [
  {
    year: 382,
    dateStr: "382 AD",
    title: "Council of Rome (Pope Damasus I)",
    tradition: "Western / Latin Church",
    significance:
      "Promulgated one of the earliest Western canonical decrees, receiving the 73 books including deuterocanonical works.",
  },
  {
    year: 391,
    dateStr: "c. 391 AD",
    title: "Jerome’s Prologus Galeatus (Helmed Preface)",
    tradition: "Latin Patristic",
    significance:
      "Distinguished Hebrew canon (24 books) from ecclesiastical books; praised Greek deuterocanon for edification but noted they were outside the Hebrew text.",
  },
  {
    year: 397,
    dateStr: "397 AD",
    title: "Third Council of Carthage",
    tradition: "North African Church",
    significance:
      "With Augustine presiding, published the 73-book biblical canon used consistently in the West for over a millennium.",
  },
  {
    year: 1546,
    dateStr: "April 8, 1546",
    title: "Council of Trent (Session IV)",
    tradition: "Roman Catholic",
    significance:
      "Issued a solemn dogmatic definition listing all 73 books of the Catholic Bible as sacred and canonical under anathema.",
  },
  {
    year: 1563,
    dateStr: "1563",
    title: "Thirty-Nine Articles (Article VI)",
    tradition: "Anglican / Reformed",
    significance:
      "Designated 66 books as canonical Scripture for doctrine; retained deuterocanon for life and manners but not to establish doctrine.",
  },
  {
    year: 1646,
    dateStr: "1646",
    title: "Westminster Confession of Faith",
    tradition: "Presbyterian / Reformed",
    significance:
      "Strictly confined canonical Scripture to 66 books, stating the Apocrypha is of no divine authority and no otherwise to be used than human writings.",
  },
  {
    year: 1672,
    dateStr: "1672",
    title: "Synod of Jerusalem (Confession of Dositheus)",
    tradition: "Eastern Orthodox",
    significance:
      "Affirmed the Greek Septuagint canon, specifically naming Wisdom, Judith, Tobit, Bel and the Dragon, Susanna, and Maccabees as genuine parts of Scripture.",
  },
];

// Helper to determine tradition presence from canons.json
function buildBookList(): CanonicalBook[] {
  const traditionsMap = new Map<string, Set<string>>();
  for (const t of canons.traditions) {
    traditionsMap.set(t.id, new Set(t.books));
  }

  const tanakh24Map: Record<string, string> = {
    GEN: "Torah 1/5",
    EXO: "Torah 2/5",
    LEV: "Torah 3/5",
    NUM: "Torah 4/5",
    DEU: "Torah 5/5",
    JOS: "Former Prophets 1/4",
    JDG: "Former Prophets 2/4",
    "1SA": "Former Prophets 3/4 (Samuel)",
    "2SA": "Former Prophets 3/4 (Samuel)",
    "1KI": "Former Prophets 4/4 (Kings)",
    "2KI": "Former Prophets 4/4 (Kings)",
    ISA: "Latter Prophets 1/4",
    JER: "Latter Prophets 2/4",
    EZK: "Latter Prophets 3/4",
    HOS: "The Twelve (Trei Asar) 1/12",
    JOL: "The Twelve (Trei Asar) 2/12",
    AMO: "The Twelve (Trei Asar) 3/12",
    OBA: "The Twelve (Trei Asar) 4/12",
    JON: "The Twelve (Trei Asar) 5/12",
    MIC: "The Twelve (Trei Asar) 6/12",
    NAM: "The Twelve (Trei Asar) 7/12",
    HAB: "The Twelve (Trei Asar) 8/12",
    ZEP: "The Twelve (Trei Asar) 9/12",
    HAG: "The Twelve (Trei Asar) 10/12",
    ZEC: "The Twelve (Trei Asar) 11/12",
    MAL: "The Twelve (Trei Asar) 12/12",
    PSA: "Writings: Sifrei Emet (Truth)",
    PRO: "Writings: Sifrei Emet (Truth)",
    JOB: "Writings: Sifrei Emet (Truth)",
    SNG: "Writings: Five Megillot",
    RUT: "Writings: Five Megillot",
    LAM: "Writings: Five Megillot",
    ECC: "Writings: Five Megillot",
    EST: "Writings: Five Megillot",
    DAN: "Writings: Daniel",
    EZR: "Writings: Ezra-Nehemiah (1 scroll)",
    NEH: "Writings: Ezra-Nehemiah (1 scroll)",
    "1CH": "Writings: Chronicles (1 scroll)",
    "2CH": "Writings: Chronicles (1 scroll)",
  };

  const getCategory = (id: string): { cat: BookCategory; name: string; test: "OT" | "NT" | "Deutero" | "Pseudepigrapha" } => {
    if (["GEN", "EXO", "LEV", "NUM", "DEU"].includes(id)) {
      return { cat: "torah", name: "Torah / Law", test: "OT" };
    }
    if (["JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST"].includes(id)) {
      return { cat: "history", name: "Old Testament Narrative", test: "OT" };
    }
    if (["JOB", "PSA", "PRO", "ECC", "SNG"].includes(id)) {
      return { cat: "wisdom", name: "Poetry & Wisdom", test: "OT" };
    }
    if (["ISA", "JER", "LAM", "EZK", "DAN"].includes(id)) {
      return { cat: "prophets-major", name: "Major Prophets", test: "OT" };
    }
    if (["HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL"].includes(id)) {
      return { cat: "prophets-minor", name: "Twelve Minor Prophets", test: "OT" };
    }
    if (["MAT", "MRK", "LUK", "JHN"].includes(id)) {
      return { cat: "gospels", name: "The Four Gospels", test: "NT" };
    }
    if (id === "ACT") {
      return { cat: "apostolic", name: "Apostolic History", test: "NT" };
    }
    if ([
      "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH",
      "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD",
    ].includes(id)) {
      return { cat: "epistles", name: "Apostolic Epistles", test: "NT" };
    }
    if (id === "REV") {
      return { cat: "apocalypse", name: "Apocalypse", test: "NT" };
    }
    if (["ENO", "JUB"].includes(id)) {
      return { cat: "ethiopian-narrower", name: "Ethiopian Narrower Canon", test: "Pseudepigrapha" };
    }
    return { cat: "deuterocanon", name: "Deuterocanon / Anagignoskomena", test: "Deutero" };
  };

  const getLanguage = (id: string): "Hebrew" | "Aramaic" | "Hebrew/Aramaic" | "Greek" | "Ge'ez" => {
    if (["DAN", "EZR"].includes(id)) return "Hebrew/Aramaic";
    if (["ENO", "JUB"].includes(id)) return "Ge'ez";
    if ([
      "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL",
      "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN",
      "3JN", "JUD", "REV", "WIS", "2MA", "3MA", "4MA", "ESG", "SUS", "BEL", "DAG",
    ].includes(id)) {
      return "Greek";
    }
    return "Hebrew";
  };

  const getWitnesses = (id: string): ManuscriptWitness[] => {
    if (["ENO", "JUB"].includes(id)) return ["DSS", "Ge'ez"];
    if ([
      "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL",
      "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN",
      "3JN", "JUD", "REV",
    ].includes(id)) {
      return ["Peshitta", "Vulg"];
    }
    if (["TOB", "SIR"].includes(id)) return ["DSS", "LXX", "Vulg"];
    if (["WIS", "1MA", "2MA", "3MA", "4MA", "JDT", "BAR", "LJE", "1ES", "MAN", "PS2", "ESG", "SUS", "BEL", "DAG"].includes(id)) {
      return ["LXX", "Vulg"];
    }
    if (id === "EST") return ["MT", "LXX", "Vulg"]; // Esther absent at Qumran
    return ["DSS", "MT", "LXX", "Vulg"];
  };

  const getHistoricalNote = (id: string): string => {
    if (id === "ENO") {
      return "Preserved completely in Ge'ez manuscripts in Ethiopia; extensive Aramaic fragments discovered among the Dead Sea Scrolls at Qumran. Quoted directly in Jude 1:14-15.";
    }
    if (id === "JUB") {
      return "Known as 'Lesser Genesis'; preserved completely in Ge'ez and attested in 15 Hebrew fragments among the Dead Sea Scrolls.";
    }
    if (["TOB", "JDT", "WIS", "SIR", "BAR", "1MA", "2MA"].includes(id)) {
      return "Affirmed as canonical Scripture by Council of Carthage (397), Trent (1546), and Synod of Jerusalem (1672). Placed in Apocrypha by 16th-century Protestant reformers.";
    }
    if (["1ES", "3MA", "MAN", "PS2"].includes(id)) {
      return "Received in the Eastern Orthodox Septuagint tradition (confirmed at Synod of Jerusalem 1672) and printed in the appendix to the Latin Vulgate.";
    }
    if (id === "4MA") {
      return "Philosophical discourse on the supremacy of devout reason over passions; printed in the appendix to the Greek Orthodox Bible.";
    }
    if (id === "HEB" || id === "REV" || id === "JAS" || id === "2PE") {
      return `One of the New Testament antilegomena ('spoken against') in early centuries; universally received in all major Christian canons by the 5th century.`;
    }
    return `Universally received across all major biblical traditions.`;
  };

  return canons.bookOrder.map((id) => {
    const bookData = canons.books[id];
    const { cat, name: catName, test } = getCategory(id);
    const inProt = traditionsMap.get("protestant")?.has(id) ?? false;
    const inCath = traditionsMap.get("catholic")?.has(id) ?? false;
    const inOrth = traditionsMap.get("orthodox")?.has(id) ?? false;
    const inEth = traditionsMap.get("ethiopian")?.has(id) ?? false;
    const inArm = traditionsMap.get("armenian")?.has(id) ?? false;
    const inTanakh = Boolean(tanakh24Map[id]);

    const defaultTrad = inProt ? "protestant" : inCath ? "catholic" : inOrth ? "orthodox" : "ethiopian";

    return {
      id,
      name: bookData?.name ?? id,
      category: cat,
      categoryName: catName,
      testament: test,
      chapters: bookData?.chapters ?? 1,
      originalLanguage: getLanguage(id),
      manuscripts: getWitnesses(id),
      inTraditions: {
        protestant: inProt,
        catholic: inCath,
        orthodox: inOrth,
        ethiopian: inEth,
        armenian: inArm,
        tanakh: inTanakh,
      },
      tanakhCount: tanakh24Map[id],
      historicalNote: getHistoricalNote(id),
      href: `/scriptures/${defaultTrad}/${id}`,
    };
  });
}

export const CANONICAL_BOOKS: CanonicalBook[] = buildBookList();

export const TRADITION_METADATA: Record<
  TraditionKey,
  { name: string; bookCount: number; canonLabel: string; blurb: string }
> = {
  protestant: {
    name: "Protestant",
    bookCount: 66,
    canonLabel: "66 Books (39 OT + 27 NT)",
    blurb:
      "Follows the Hebrew Masoretic Text for the 39 Old Testament books and the shared 27-book New Testament. Deuterocanonical works are regarded as Apocrypha.",
  },
  catholic: {
    name: "Roman Catholic",
    bookCount: 73,
    canonLabel: "73 Books (46 OT + 27 NT)",
    blurb:
      "Defined at Carthage (397) and Trent (1546); includes the 7 deuterocanonical books (Tobit, Judith, Wisdom, Sirach, Baruch, 1 & 2 Maccabees) and additions to Esther and Daniel.",
  },
  orthodox: {
    name: "Eastern Orthodox",
    bookCount: 76,
    canonLabel: "76+ Books (Septuagint OT + 27 NT)",
    blurb:
      "Follows the Greek Septuagint Old Testament, adding 1 Esdras, 3 Maccabees, Psalm 151, and Prayer of Manasseh beyond the Western Catholic deuterocanon.",
  },
  ethiopian: {
    name: "Ethiopian Tewahedo",
    bookCount: 81,
    canonLabel: "81 Books (Broad/Narrow Canon)",
    blurb:
      "The ancient Ethiopic Orthodox corpus uniquely includes 1 Enoch and the Book of Jubilees as canonical Old Testament Scripture.",
  },
  armenian: {
    name: "Armenian Apostolic",
    bookCount: 75,
    canonLabel: "75+ Books (Zohrab Bible)",
    blurb:
      "Follows the classical Armenian Septuagint translation tradition (translated from Greek and Syriac in the 5th century by Mesrop Mashtots and Sahak).",
  },
  tanakh: {
    name: "Jewish Tanakh",
    bookCount: 24,
    canonLabel: "24 Books (Torah, Nevi'im, Ketuvim)",
    blurb:
      "The traditional Hebrew Masoretic enumeration counting Samuel, Kings, Chronicles, Ezra-Nehemiah, and the Twelve Minor Prophets as single unified scrolls.",
  },
};

export function compareTwoTraditions(
  tradA: TraditionKey,
  tradB: TraditionKey,
): {
  tradAName: string;
  tradBName: string;
  shared: CanonicalBook[];
  onlyInA: CanonicalBook[];
  onlyInB: CanonicalBook[];
  summary: string;
} {
  const shared: CanonicalBook[] = [];
  const onlyInA: CanonicalBook[] = [];
  const onlyInB: CanonicalBook[] = [];

  for (const book of CANONICAL_BOOKS) {
    const inA = book.inTraditions[tradA];
    const inB = book.inTraditions[tradB];

    if (inA && inB) shared.push(book);
    else if (inA && !inB) onlyInA.push(book);
    else if (!inA && inB) onlyInB.push(book);
  }

  const nameA = TRADITION_METADATA[tradA].name;
  const nameB = TRADITION_METADATA[tradB].name;

  let summary = "";
  if (onlyInA.length === 0 && onlyInB.length === 0) {
    summary = `${nameA} and ${nameB} share identical hosted books in this matrix.`;
  } else if (onlyInA.length > 0 && onlyInB.length === 0) {
    summary = `${nameA} includes ${onlyInA.length} additional book(s) not received in ${nameB}.`;
  } else if (onlyInA.length === 0 && onlyInB.length > 0) {
    summary = `${nameB} includes ${onlyInB.length} additional book(s) not received in ${nameA}.`;
  } else {
    summary = `${nameA} includes ${onlyInA.length} book(s) absent in ${nameB}, while ${nameB} includes ${onlyInB.length} book(s) absent in ${nameA}.`;
  }

  return {
    tradAName: nameA,
    tradBName: nameB,
    shared,
    onlyInA,
    onlyInB,
    summary,
  };
}
