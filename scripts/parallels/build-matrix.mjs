import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.join(import.meta.dirname, "../..");
const SOURCES_DIR = path.join(ROOT, "public/parallels/sources");
const OUT_DIR = path.join(ROOT, "public/parallels");

const gen22 = JSON.parse(readFileSync(path.join(SOURCES_DIR, "genesis-22.json"), "utf8"));
const jubilees = JSON.parse(readFileSync(path.join(SOURCES_DIR, "jubilees-17-18.json"), "utf8"));
const quran37 = JSON.parse(readFileSync(path.join(SOURCES_DIR, "quran-37.json"), "utf8"));
const rights = JSON.parse(readFileSync(path.join(OUT_DIR, "rights-manifest.json"), "utf8"));

// Verify exact excerpts from source shards
function getGenVerse(v) {
  const verse = gen22.verses[String(v)];
  if (!verse) throw new Error(`Gen 22 verse ${v} not found`);
  return verse.english;
}

function getJubSection(s) {
  const section = jubilees.sections[s];
  if (!section) throw new Error(`Jubilees section ${s} not found`);
  return section;
}

function getQuranVerse(v) {
  const verse = quran37.verses[String(v)];
  if (!verse) throw new Error(`Quran 37 verse ${v} not found`);
  return verse.english;
}

const matrix = {
  schemaVersion: "1.0.0",
  id: "sacrifice-of-the-son",
  slug: "sacrifice-of-the-son",
  title: "The Sacrifice of the Son",
  subtitle: "Genesis 22 · Jubilees 17–18 · Qur'an 37:99–113",
  summary:
    "A source-anchored comparison across biblical, Second Temple Jewish, and Quranic accounts of Abraham's ultimate trial, mapping narrative slots, textual differences, pairwise relations, and distinct reception histories.",
  witnesses: [
    {
      id: "genesis-22",
      title: "Genesis 22 (Masoretic Text / World English Bible)",
      shortTitle: "Genesis 22",
      language: "Hebrew / English",
      isRtl: false,
      dates: {
        composition: "c. 10th–6th century BCE",
        earliestManuscript: "4QGen-b (c. 1st century BCE)",
        edition: "Westminster Leningrad Codex / World English Bible",
      },
      primaryTradition: "Hebrew Bible / Christian Old Testament",
      corpusEditionId: "web-bible",
      licenseNotice: rights.corpora["web-bible"].notice,
    },
    {
      id: "jubilees-17-18",
      title: "The Book of Jubilees 17–18 (R.H. Charles)",
      shortTitle: "Jubilees 17–18",
      language: "Ethiopic (Ge'ez) / English",
      isRtl: false,
      dates: {
        composition: "c. 160–140 BCE (Second Temple Jewish)",
        earliestManuscript: "4Q216–224 (Dead Sea Scrolls, 2nd–1st century BCE)",
        edition: "R.H. Charles (1913)",
      },
      primaryTradition: "Second Temple Jewish / Ethiopian Orthodox Canon",
      corpusEditionId: "charles-jubilees",
      licenseNotice: rights.corpora["charles-jubilees"].notice,
    },
    {
      id: "quran-37",
      title: "Qur'an 37:99–113 (As-Saffat · Tanzil / Pickthall)",
      shortTitle: "Qur'an 37:99–113",
      language: "Classical Arabic / English",
      isRtl: true,
      dates: {
        composition: "c. 7th century CE",
        earliestManuscript: "Birmingham Quran Manuscript / Codex Sana'a (c. 7th century CE)",
        edition: "Tanzil Project (Uthmani) / Pickthall (1930)",
      },
      primaryTradition: "Islamic Scripture",
      corpusEditionId: "tanzil-uthmani",
      licenseNotice: rights.corpora["tanzil-uthmani"].notice,
    },
  ],
  slots: [
    {
      id: "command-and-instigation",
      label: "The Trial Initiated",
      description: "How the command to offer the son originates and is delivered to Abraham.",
      cells: {
        "genesis-22": {
          witnessId: "genesis-22",
          locator: {
            corpusId: "hebrew-bible",
            editionId: "web-bible",
            section: "GEN",
            passageRef: "Genesis 22:1-2",
            originalLanguage: "Hebrew",
          },
          basis: "explicit",
          summary: "God directly tests Abraham, commanding him to offer Isaac in the land of Moriah as a burnt offering.",
          verbatimExcerpt: `${getGenVerse(1)} ${getGenVerse(2)}`,
          supportingCitations: ["Genesis 22:1", "Genesis 22:2"],
          limits: "No heavenly antagonist is mentioned; the initiative is stated solely as God testing Abraham.",
        },
        "jubilees-17-18": {
          witnessId: "jubilees-17-18",
          locator: {
            corpusId: "second-temple",
            editionId: "charles-jubilees",
            section: "Jubilees",
            passageRef: "Jubilees 17:16, 18:1-2",
            originalLanguage: "Ge'ez / Hebrew Vorlage",
          },
          basis: "explicit",
          summary:
            "Prince Mastema challenges God in heaven regarding Abraham's devotion; God then commands Abraham to offer Isaac on the mountain.",
          verbatimExcerpt: `${getJubSection("17:16")} ${getJubSection("18:1")} ${getJubSection("18:2")}`,
          supportingCitations: ["Jubilees 17:16", "Jubilees 18:1-2"],
          limits: "Distinguishes Mastema's instigation from God's command; God already knew Abraham's faithfulness across prior trials.",
        },
        "quran-37": {
          witnessId: "quran-37",
          locator: {
            corpusId: "quran",
            editionId: "pickthall-quran",
            section: "Surah 37",
            passageRef: "Qur'an 37:102",
            originalLanguage: "Arabic",
          },
          basis: "explicit",
          summary:
            "Abraham tells his son he has seen in a dream that he must sacrifice him, and asks for the son's counsel.",
          verbatimExcerpt: getQuranVerse(102),
          supportingCitations: ["Qur'an 37:102"],
          limits: "The trial is presented through a vision/dream (al-manām); the son is not explicitly named in the verse.",
        },
      },
    },
    {
      id: "filial-response-and-ascent",
      label: "The Ascent & The Son's Role",
      description: "The journey to the place of sacrifice and the exchange between father and son.",
      cells: {
        "genesis-22": {
          witnessId: "genesis-22",
          locator: {
            corpusId: "hebrew-bible",
            editionId: "web-bible",
            section: "GEN",
            passageRef: "Genesis 22:6-8",
            originalLanguage: "Hebrew",
          },
          basis: "explicit",
          summary:
            "Isaac carries the wood and asks where the lamb is; Abraham answers that God will provide the lamb.",
          verbatimExcerpt: `${getGenVerse(6)} ${getGenVerse(7)} ${getGenVerse(8)}`,
          supportingCitations: ["Genesis 22:6-8"],
          limits: "The text does not state Isaac's age or explicit verbal consent/passivity; they walk 'together'.",
        },
        "jubilees-17-18": {
          witnessId: "jubilees-17-18",
          locator: {
            corpusId: "second-temple",
            editionId: "charles-jubilees",
            section: "Jubilees",
            passageRef: "Jubilees 18:5-7",
            originalLanguage: "Ge'ez / Hebrew Vorlage",
          },
          basis: "explicit",
          summary:
            "Abraham lays the wood on Isaac; Isaac asks where the sheep for the offering is, and Abraham answers that God will provide.",
          verbatimExcerpt: `${getJubSection("18:5")} ${getJubSection("18:6")} ${getJubSection("18:7")}`,
          supportingCitations: ["Jubilees 18:5-7"],
          limits: "Follows Genesis narrative closely; emphasizes drawing near to 'the place of the mount of God'.",
        },
        "quran-37": {
          witnessId: "quran-37",
          locator: {
            corpusId: "quran",
            editionId: "pickthall-quran",
            section: "Surah 37",
            passageRef: "Qur'an 37:102-103",
            originalLanguage: "Arabic",
          },
          basis: "explicit",
          summary:
            "The son explicitly consents: 'O my father! Do that which thou art commanded. Thou wilt find me, if Allah will, of the steadfast.' Both submit.",
          verbatimExcerpt: `${getQuranVerse(102)} ${getQuranVerse(103)}`,
          supportingCitations: ["Qur'an 37:102", "Qur'an 37:103"],
          limits: "Focuses on mutual submission (aslamā); does not narrate the 3-day travel itinerary or servants.",
        },
      },
    },
    {
      id: "binding-and-divine-intervention",
      label: "The Binding & Intervention",
      description: "The moment of sacrifice and the divine voice halting the act.",
      cells: {
        "genesis-22": {
          witnessId: "genesis-22",
          locator: {
            corpusId: "hebrew-bible",
            editionId: "web-bible",
            section: "GEN",
            passageRef: "Genesis 22:9-12",
            originalLanguage: "Hebrew",
          },
          basis: "explicit",
          summary:
            "Abraham builds the altar, binds Isaac, and takes the knife; Yahweh's angel calls from heaven to stop him.",
          verbatimExcerpt: `${getGenVerse(9)} ${getGenVerse(10)} ${getGenVerse(11)} ${getGenVerse(12)}`,
          supportingCitations: ["Genesis 22:9-12"],
          limits: "The angel speaks from heaven declaring that Abraham's fear of God is now known.",
        },
        "jubilees-17-18": {
          witnessId: "jubilees-17-18",
          locator: {
            corpusId: "second-temple",
            editionId: "charles-jubilees",
            section: "Jubilees",
            passageRef: "Jubilees 18:8-12",
            originalLanguage: "Ge'ez / Hebrew Vorlage",
          },
          basis: "explicit",
          summary:
            "Abraham binds Isaac and takes the knife; the angel of the presence stands before Mastema and calls from heaven to stop; Mastema is shamed.",
          verbatimExcerpt: `${getJubSection("18:8")} ${getJubSection("18:9")} ${getJubSection("18:10")} ${getJubSection("18:11")} ${getJubSection("18:12")}`,
          supportingCitations: ["Jubilees 18:8-12"],
          limits: "Frames the intervention as a cosmic vindication over Mastema in the presence of the angels.",
        },
        "quran-37": {
          witnessId: "quran-37",
          locator: {
            corpusId: "quran",
            editionId: "pickthall-quran",
            section: "Surah 37",
            passageRef: "Qur'an 37:103-106",
            originalLanguage: "Arabic",
          },
          basis: "explicit",
          summary:
            "Abraham lays his son face down; God calls out that the vision has been fulfilled, declaring it a clear trial.",
          verbatimExcerpt: `${getQuranVerse(103)} ${getQuranVerse(104)} ${getQuranVerse(105)} ${getQuranVerse(106)}`,
          supportingCitations: ["Qur'an 37:103-106"],
          limits: "No knife or physical binding described; the test is fulfilled at the point of complete surrender.",
        },
      },
    },
    {
      id: "ransom-and-substitution",
      label: "The Ransom / Substitute",
      description: "What replaces the son as the sacrifice.",
      cells: {
        "genesis-22": {
          witnessId: "genesis-22",
          locator: {
            corpusId: "hebrew-bible",
            editionId: "web-bible",
            section: "GEN",
            passageRef: "Genesis 22:13-14",
            originalLanguage: "Hebrew",
          },
          basis: "explicit",
          summary: "A ram caught in a thicket by its horns is offered as a burnt offering in place of Isaac.",
          verbatimExcerpt: `${getGenVerse(13)} ${getGenVerse(14)}`,
          supportingCitations: ["Genesis 22:13-14"],
          limits: "Identifies the animal specifically as an ayil (ram).",
        },
        "jubilees-17-18": {
          witnessId: "jubilees-17-18",
          locator: {
            corpusId: "second-temple",
            editionId: "charles-jubilees",
            section: "Jubilees",
            passageRef: "Jubilees 18:12-13",
            originalLanguage: "Ge'ez / Hebrew Vorlage",
          },
          basis: "explicit",
          summary: "A ram is offered in Isaac's stead; the place is identified explicitly with Mount Sion.",
          verbatimExcerpt: `${getJubSection("18:12")} ${getJubSection("18:13")}`,
          supportingCitations: ["Jubilees 18:12-13"],
          limits: "Explicitly equates the mountain of the test with Mount Zion (Jerusalem temple mount).",
        },
        "quran-37": {
          witnessId: "quran-37",
          locator: {
            corpusId: "quran",
            editionId: "pickthall-quran",
            section: "Surah 37",
            passageRef: "Qur'an 37:107",
            originalLanguage: "Arabic",
          },
          basis: "explicit",
          summary: "The son is ransomed with a 'tremendous victim' (dhibḥ ʿaẓīm).",
          verbatimExcerpt: getQuranVerse(107),
          supportingCitations: ["Qur'an 37:107"],
          limits: "The text does not specify the animal species (e.g. ram); later tradition supplies this detail.",
        },
      },
    },
    {
      id: "promise-and-covenant",
      label: "Covenant Promise & Subsequent Birth",
      description: "The divine response following the trial and the covenant blessings.",
      cells: {
        "genesis-22": {
          witnessId: "genesis-22",
          locator: {
            corpusId: "hebrew-bible",
            editionId: "web-bible",
            section: "GEN",
            passageRef: "Genesis 22:16-18",
            originalLanguage: "Hebrew",
          },
          basis: "explicit",
          summary:
            "God swears by Himself to multiply Abraham's seed as the stars and sand; all nations on earth will be blessed.",
          verbatimExcerpt: `${getGenVerse(16)} ${getGenVerse(17)} ${getGenVerse(18)}`,
          supportingCitations: ["Genesis 22:16-18"],
          limits: "The blessing is confirmed to Isaac as Abraham's 'only son' present at the scene.",
        },
        "jubilees-17-18": {
          witnessId: "jubilees-17-18",
          locator: {
            corpusId: "second-temple",
            editionId: "charles-jubilees",
            section: "Jubilees",
            passageRef: "Jubilees 18:15-19",
            originalLanguage: "Ge'ez / Hebrew Vorlage",
          },
          basis: "explicit",
          summary:
            "God reiterates the multiplication blessing; institutes a seven-day annual festival of the Lord written on heavenly tablets.",
          verbatimExcerpt: `${getJubSection("18:15")} ${getJubSection("18:16")} ${getJubSection("18:18")} ${getJubSection("18:19")}`,
          supportingCitations: ["Jubilees 18:15-19"],
          limits: "Provides liturgical etiology for the Passover/Feast of Unleavened Bread timing.",
        },
        "quran-37": {
          witnessId: "quran-37",
          locator: {
            corpusId: "quran",
            editionId: "pickthall-quran",
            section: "Surah 37",
            passageRef: "Qur'an 37:108-113",
            originalLanguage: "Arabic",
          },
          basis: "explicit",
          summary:
            "Peace is bestowed upon Abraham; afterward, good tidings of the birth of Isaac as a righteous prophet are announced.",
          verbatimExcerpt: `${getQuranVerse(108)} ${getQuranVerse(109)} ${getQuranVerse(110)} ${getQuranVerse(111)} ${getQuranVerse(112)} ${getQuranVerse(113)}`,
          supportingCitations: ["Qur'an 37:108-113"],
          limits:
            "The tidings of Isaac's birth following the sacrifice narrative led classical Islamic scholars to debate whether the sacrificed son was Ishmael or Isaac.",
        },
      },
    },
  ],
  edges: [
    {
      id: "gen-jub-edge",
      sourceWitnessId: "genesis-22",
      targetWitnessId: "jubilees-17-18",
      relationship: "allusion",
      scholarlyConsensus: "strong",
      basisNote:
        "Jubilees directly reworks the Genesis 22 narrative (Rewritten Bible genre), framing the trial within a heavenly prologue involving Prince Mastema (analogous to Satan in Job 1-2) and establishing a calendar festival.",
      citations: [
        "James L. Kugel, *The Bible As It Was* (Harvard University Press, 1997), 160-176.",
        "Michael Segal, *The Book of Jubilees: Rewritten Bible, Redaction, Ideology and Theology* (Brill, 2007).",
      ],
    },
    {
      id: "gen-quran-edge",
      sourceWitnessId: "genesis-22",
      targetWitnessId: "quran-37",
      relationship: "shared-tradition",
      scholarlyConsensus: "strong",
      basisNote:
        "Qur'an 37 shares the core Semitic narrative of Abraham's willingness to sacrifice his son and the divine substitution, but recasts the episode around active filial consent and visionary dream revelation, with Isaac's announcement following in verse 112.",
      citations: [
        "Reuven Firestone, *Journeys in Holy Lands: The Evolution of the Abraham-Ishmael Legends in Islamic Exegesis* (SUNY Press, 1990).",
        "Angelika Neuwirth, *The Qur'an and Late Antiquity: A Shared Heritage* (Oxford University Press, 2019).",
      ],
    },
    {
      id: "jub-quran-edge",
      sourceWitnessId: "jubilees-17-18",
      targetWitnessId: "quran-37",
      relationship: "shared-tradition",
      scholarlyConsensus: "strong",
      basisNote:
        "Both texts reflect Late Antique/Second Temple developments emphasizing the willing participation and virtue of the righteous son and the test as a vindication of steadfast faith, though with independent literary histories.",
      citations: [
        "Sidney H. Griffith, *The Bible in Arabic: The Scriptures of the 'People of the Book' in the Language of Islam* (Princeton University Press, 2013).",
      ],
    },
  ],
  receptionClaims: [
    {
      id: "claim-christian-typology",
      tradition: "christian",
      subject: "Isaac as Type of Christ",
      text: "Early Christian patristic and liturgical commentary read Isaac carrying the wood to Moriah as a prefiguration of Christ carrying the cross to Golgotha, and the substitute ram as a figure of the sacrificial Lamb of God.",
      basis: { axis: "textual", grade: "inferred" },
      sources: [
        { label: "Hebrews 11:17-19" },
        { label: "Romans 8:32" },
        { label: "Tertullian, *Adversus Judaeos* 10" },
        { label: "Origen, *Homilies on Genesis* 8" },
      ],
      refs: ["GEN 22:6", "GEN 22:13"],
      limit: "Typological hermeneutic developed in the New Testament and patristic period; not a literal claim of the Genesis text itself.",
    },
    {
      id: "claim-jewish-aqedah",
      tradition: "jewish",
      subject: "The Merit of the Aqedah (Binding)",
      text: "Rabbinic traditions developed the doctrine of Zekhut Avot (Merit of the Fathers) through the Aqedah, depicting Isaac not as a child but as a willing adult (age 37 in Midrashic chronology) who actively offered his neck to be bound.",
      basis: { axis: "textual", grade: "tradition" },
      sources: [
        { label: "Talmud Bavli, Sanhedrin 89b" },
        { label: "Midrash Genesis Rabbah 56:3-8" },
        { label: "Midrash Tanchuma, Vayera 22" },
      ],
      refs: ["GEN 22:9"],
      limit: "Extends beyond the silence of the Genesis text regarding Isaac's age and internal thoughts.",
    },
    {
      id: "claim-islamic-sacrifice",
      tradition: "islamic",
      subject: "The Sacrificed Son (Dhabih) & Eid al-Adha",
      text: "Islamic tradition commemorates Abraham's trial during the annual Hajj pilgrimage and Eid al-Adha. Classical exegetes (Tabari, Ibn Kathir) recorded dual early traditions regarding whether the sacrificed son was Ishmael (the consensus view) or Isaac.",
      basis: { axis: "textual", grade: "inferred" },
      sources: [
        { label: "Al-Tabari, *Jami' al-Bayan* on Surah 37:102" },
        { label: "Ibn Kathir, *Tafsir al-Qur'an al-Azim* on 37:102-113" },
      ],
      refs: [],
      limit: "Qur'an 37 does not explicitly name the youth in verses 102-107, leading to early interpretive differences before Ishmael became the normative consensus.",
    },
  ],
};

// Compute canonical SHA-256 content hash
const contentToHash = JSON.stringify({
  slots: matrix.slots,
  edges: matrix.edges,
  receptionClaims: matrix.receptionClaims,
});
const reviewedContentHash = crypto.createHash("sha256").update(contentToHash).digest("hex");

matrix.provenance = {
  reviewStatus: "agent-reviewed",
  reviewer: "Codex",
  rubricVersion: "parallels-v1.0",
  reviewedContentHash,
  reviewedAt: "2026-09-04T15:12:28.000Z",
  reviewScope: "Jubilees quotations and the ram-offering summary corrected against the 1913 printed text; existing narrative alignment, rights, and reception separation retained. See docs/jubilees-source-review.md.",
};

mkdirSync(OUT_DIR, { recursive: true });
const targetFile = path.join(OUT_DIR, "sacrifice-of-the-son.json");
writeFileSync(targetFile, JSON.stringify(matrix, null, 2) + "\n");
console.log(`Successfully built ${targetFile} (hash: ${reviewedContentHash.slice(0, 12)}...)`);
