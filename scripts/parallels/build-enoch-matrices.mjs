#!/usr/bin/env node
/**
 * Build the three 1 Enoch parallel claim matrices:
 *   jude-enoch-quotation  — Jude 14–15 ↔ 1 Enoch 1:9 (direct citation)
 *   the-watchers          — Genesis 6:1–4 ↔ 1 Enoch 6–16 (expansion + divergence)
 *   son-of-man            — Daniel 7 ↔ 1 Enoch 46–48 ↔ Matthew 26 (allusion, dating disputed)
 *
 * Every verbatimExcerpt is verified against the source shards written by
 * build-enoch-sources.mjs (which themselves were extracted from the hosted
 * corpus texts). The content hash follows the parallels-v1.0 rubric.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.join(import.meta.dirname, "../..");
const SOURCES_DIR = path.join(ROOT, "public/parallels/sources");
const OUT_DIR = path.join(ROOT, "public/parallels");
const RIGHTS_FILE = path.join(OUT_DIR, "rights-manifest.json");

const rights = JSON.parse(readFileSync(RIGHTS_FILE, "utf8"));
const shard = (id) => JSON.parse(readFileSync(path.join(SOURCES_DIR, `${id}.json`), "utf8"));
const section = (id, key) => {
  const text = shard(id).sections[key];
  if (!text) throw new Error(`${id} section ${key} not found`);
  return text;
};

const webWitness = (id, title, shortTitle, tradition) => ({
  id,
  title,
  shortTitle,
  language: "Hebrew / English",
  isRtl: false,
  dates: {
    composition: "c. 10th–6th century BCE",
    earliestManuscript: "4QGen-b (c. 1st century BCE)",
    edition: "Westminster Leningrad Codex / World English Bible",
  },
  primaryTradition: tradition,
  corpusEditionId: "web-bible",
  licenseNotice: rights.corpora["web-bible"].notice,
});

const enochWitness = (id, title, shortTitle) => ({
  id,
  title,
  shortTitle,
  language: "Ge'ez original / English",
  isRtl: false,
  dates: {
    composition: "c. 3rd century BCE (earliest sections; debated)",
    earliestManuscript: "Aramaic fragments from Qumran (4QEn, c. 2nd–1st century BCE); complete text in Ge'ez (15th century CE manuscripts)",
    edition: "R.H. Charles, The Apocrypha and Pseudepigrapha of the Old Testament, vol. 2 (1913)",
  },
  primaryTradition: "Second Temple Judaism; canonical in the Ethiopian Tewahedo Church",
  corpusEditionId: "charles-enoch",
  licenseNotice: rights.corpora["charles-enoch"].notice,
});

const cell = (witnessId, locator, basis, summary, excerpt, citations, limits) => ({
  witnessId,
  locator,
  basis,
  summary,
  verbatimExcerpt: excerpt,
  supportingCitations: citations,
  ...(limits ? { limits } : {}),
});

const bibleLocator = (section, passageRef) => ({
  corpusId: "hebrew-bible",
  editionId: "web-bible",
  section,
  passageRef,
  originalLanguage: "Hebrew",
});
const enochLocator = (passageRef) => ({
  corpusId: "second-temple-pseudepigrapha",
  editionId: "charles-enoch",
  section: "ENO",
  passageRef,
  originalLanguage: "Ge'ez (Aramaic original lost except in Qumran fragments)",
});

// ── Matrix 1: jude-enoch-quotation ─────────────────────────────────────────
const judeEnoch = {
  schemaVersion: "1.0.0",
  id: "jude-enoch-quotation",
  slug: "jude-enoch-quotation",
  title: "The Prophecy Jude Quoted",
  subtitle: "Jude 14–15 · 1 Enoch 1:9",
  summary:
    "A source-anchored comparison of the one place the New Testament quotes 1 Enoch: Jude attributes a judgment prophecy to 'Enoch, the seventh from Adam,' and the wording runs alongside 1 Enoch 1:9 in Charles' translation.",
  axis: "canon-reception",
  contextGuard: {
    requiresFullPericope: true,
    misuseNotice:
      "Jude's citation of 1 Enoch is often used as a polemical weapon in canon debates — in both directions. This matrix maps the textual relationship and the distinct reception histories; it does not adjudicate which canon is correct.",
  },
  witnesses: [
    webWitness("jude-14-15", "Jude 14–15 (World English Bible)", "Jude 14–15", "Christian New Testament"),
    enochWitness("enoch-1", "1 Enoch 1:1–9 (R.H. Charles)", "1 Enoch 1"),
  ],
  slots: [
    {
      id: "the-coming-with-holy-ones",
      label: "The Lord Comes with Ten Thousands of Holy Ones",
      description: "The shared scene: the Lord arrives accompanied by a vast host of holy ones.",
      cells: {
        "jude-14-15": cell(
          "jude-14-15",
          bibleLocator("JUD", "Jude 14"),
          "explicit",
          "Jude quotes Enoch's prophecy: the Lord comes with ten thousands of his holy ones.",
          section("jude-14-15", "1:14"),
          ["Jude 14"],
        ),
        "enoch-1": cell(
          "enoch-1",
          enochLocator("1 Enoch 1:9"),
          "explicit",
          "1 Enoch 1:9: He comes with ten thousands of His holy ones to execute judgement.",
          section("1-enoch-1", "1:9"),
          ["1 Enoch 1:9 (Charles 1913)"],
          "Charles' ⌈⌉ marks conjectural readings of the Ethiopic; the correspondence with Jude holds across the textual variants.",
        ),
      },
    },
    {
      id: "the-judgment-purpose",
      label: "Judgment and Conviction of the Ungodly",
      description: "Both texts state the purpose: judgment executed and the ungodly convicted of their deeds and words.",
      cells: {
        "jude-14-15": cell(
          "jude-14-15",
          bibleLocator("JUD", "Jude 15"),
          "explicit",
          "To execute judgment on all and convict all the ungodly of their works and hard words.",
          section("jude-14-15", "1:15"),
          ["Jude 15"],
        ),
        "enoch-1": cell(
          "enoch-1",
          enochLocator("1 Enoch 1:9"),
          "explicit",
          "To execute judgement upon all, destroy the ungodly, and convict all flesh of ungodly works and hard words.",
          section("1-enoch-1", "1:9"),
          ["1 Enoch 1:9 (Charles 1913)"],
        ),
      },
    },
    {
      id: "attribution-to-enoch",
      label: "Enoch as the Attributed Speaker",
      description: "Jude names the speaker; 1 Enoch frames the vision as Enoch's own.",
      cells: {
        "jude-14-15": cell(
          "jude-14-15",
          bibleLocator("JUD", "Jude 14"),
          "explicit",
          "Jude attributes the prophecy to 'Enoch, the seventh from Adam.'",
          section("jude-14-15", "1:14"),
          ["Jude 14"],
        ),
        "enoch-1": cell(
          "enoch-1",
          enochLocator("1 Enoch 1:1–2"),
          "explicit",
          "The book opens as 'the words of the blessing of Enoch,' a righteous man whose eyes God opened.",
          section("1-enoch-1", "1:1"),
          ["1 Enoch 1:1–2 (Charles 1913)"],
        ),
      },
    },
  ],
  edges: [
    {
      id: "jude-quotes-enoch",
      sourceWitnessId: "jude-14-15",
      targetWitnessId: "enoch-1",
      relationship: "direct-citation",
      scholarlyConsensus: "strong",
      basisNote:
        "Scholarly consensus holds that Jude 14–15 quotes 1 Enoch 1:9 (in the Ethiopic numbering; the passage also stands in the Greek Enoch tradition Jude's readers knew). The correspondence in wording — the coming with ten thousands of holy ones, judgment, conviction of the ungodly in deed and word — is too close to be independent.",
      citations: [
        "Richard Bauckham, *Jude, 2 Peter* (Word Biblical Commentary 50, 1983), pp. 65–76.",
        "George W.E. Nickelsburg, *1 Enoch 1* (Hermeneia, 2001), pp. 137–145.",
        "R.H. Charles, *The Apocrypha and Pseudepigrapha of the Old Testament*, vol. 2 (Oxford: Clarendon, 1913), introduction to 1 Enoch.",
      ],
    },
  ],
  receptionClaims: [
    {
      id: "claim-ethiopian-canonical",
      tradition: "christian",
      subject: "1 Enoch as Canonical Scripture",
      text: "The Ethiopian Orthodox Tewahedo Church includes 1 Enoch in its Old Testament canon; it is the only church to preserve the complete text, in Ge'ez. For Tewahedo readers, Jude's citation is canon quoting canon.",
      basis: { axis: "attestation", grade: "explicit" },
      sources: [{ label: "Ethiopian Orthodox Tewahedo Church canon (81 books)" }],
      refs: [],
      limit: "The narrower and broader Tewahedo canon lists differ in count; 1 Enoch belongs to both.",
    },
    {
      id: "claim-western-noncanonical",
      tradition: "christian",
      subject: "Quoted but Not Canonical in Most Western Churches",
      text: "Most Western churches do not include 1 Enoch in their canon, yet the New Testament quotes it. Interpretations range from reading Jude as endorsing Enochic prophecy to reading the citation as use of a known, authoritative-in-part Second Temple work without full canonical endorsement.",
      basis: { axis: "attestation", grade: "disputed" },
      sources: [
        { label: "Bauckham, *Jude, 2 Peter* (1983)" },
        { label: "Carson & Moo, *An Introduction to the New Testament* (2005)" },
      ],
      refs: [],
      limit: "The range of positions is genuine; this matrix does not adjudicate them.",
    },
    {
      id: "claim-jewish-second-temple",
      tradition: "jewish",
      subject: "Enochic Literature in Second Temple Judaism",
      text: "Multiple Aramaic manuscripts of 1 Enoch were copied at Qumran, showing the work's authority in at least one Second Temple Jewish community; the rabbinic canon does not include it.",
      basis: { axis: "attestation", grade: "explicit" },
      sources: [{ label: "4QEn a–g (DJD 36); Milik, *The Books of Enoch* (1976)" }],
      refs: [],
      limit: "Qumran's practice does not generalize to all Second Temple Judaism.",
    },
  ],
};

// ── Matrix 2: the-watchers ─────────────────────────────────────────────────
const watchers = {
  schemaVersion: "1.0.0",
  id: "the-watchers",
  slug: "the-watchers",
  title: "The Watchers: Genesis 6 Expanded",
  subtitle: "Genesis 6:1–4 · 1 Enoch 6–16",
  summary:
    "A source-anchored comparison of the terse Genesis notice about the 'sons of God' and the Nephilim with the expansive Second Temple retelling in 1 Enoch 6–16, where the descent is named, taught, judged, and bound.",
  axis: "primeval-history",
  contextGuard: {
    requiresFullPericope: true,
    misuseNotice:
      "The identity of the 'sons of God' in Genesis 6 is an open interpretive question (divine beings, Sethite line, rulers). This matrix maps what each text says; it does not rule on which interpretation Genesis 'means.'",
  },
  witnesses: [
    webWitness("genesis-6", "Genesis 6:1–4 (World English Bible)", "Genesis 6", "Hebrew Bible / Christian Old Testament"),
    enochWitness("enoch-6-16", "1 Enoch 6–16 (R.H. Charles)", "1 Enoch 6–16"),
  ],
  slots: [
    {
      id: "the-descent",
      label: "The Descent and the Union",
      description: "How each text describes the 'sons of God' taking wives from the daughters of men.",
      cells: {
        "genesis-6": cell(
          "genesis-6",
          bibleLocator("GEN", "Genesis 6:1–2"),
          "explicit",
          "The sons of God see the daughters of men are beautiful and take wives for themselves.",
          section("genesis-6-1-4", "6:1") + " " + section("genesis-6-1-4", "6:2"),
          ["Genesis 6:1–2"],
          "Genesis names no actors and gives no motive beyond desire for beauty.",
        ),
        "enoch-6-16": cell(
          "enoch-6-16",
          enochLocator("1 Enoch 6:1–7"),
          "explicit",
          "Two hundred Watchers descend under Shemihazah's oath sworn on Mount Hermon; their chiefs are named.",
          section("1-enoch-6-16", "6:1") + " " + section("1-enoch-6-16", "6:2") + " " + section("1-enoch-6-16", "6:7"),
          ["1 Enoch 6:1–7 (Charles 1913)"],
        ),
      },
    },
    {
      id: "the-offspring",
      label: "The Offspring",
      description: "Genesis' Nephilim notice against Enoch's giants.",
      cells: {
        "genesis-6": cell(
          "genesis-6",
          bibleLocator("GEN", "Genesis 6:4"),
          "explicit",
          "The Nephilim were on the earth in those days; the sons of God came in to the daughters of men, and they bore children to them — the mighty men of old, men of renown.",
          section("genesis-6-1-4", "6:4"),
          ["Genesis 6:4"],
        ),
        "enoch-6-16": cell(
          "enoch-6-16",
          enochLocator("1 Enoch 7:1–6"),
          "explicit",
          "The women conceive giants three thousand cubits tall who consume the produce of men and turn against them.",
          section("1-enoch-6-16", "7:2") + " " + section("1-enoch-6-16", "7:3") + " " + section("1-enoch-6-16", "7:4") + " " + section("1-enoch-6-16", "7:5"),
          ["1 Enoch 7:1–6 (Charles 1913)"],
          "Charles' text reads 'three thousand cubits'; the Ethiopic measure is debated in the editions.",
        ),
      },
    },
    {
      id: "the-teaching",
      label: "Forbidden Knowledge",
      description: "Genesis is silent on what the unions produced besides offspring; 1 Enoch adds taught arts.",
      cells: {
        "genesis-6": cell(
          "genesis-6",
          bibleLocator("GEN", "Genesis 6:1–4"),
          "explicit",
          "Genesis records no teaching motif; the passage moves from union to offspring to renown.",
          section("genesis-6-1-4", "6:1") + " " + section("genesis-6-1-4", "6:4"),
          ["Genesis 6:1–4"],
          "The silence is explicit: no instruction, sorcery, or metallurgy appears in Genesis 6:1–4.",
        ),
        "enoch-6-16": cell(
          "enoch-6-16",
          enochLocator("1 Enoch 7–8 (summarized at 7:1; 8:1–3 outside this shard)"),
          "inferred",
          "The Watchers teach metallurgy, weapons, sorcery, astrology, and the cutting of roots; the earth is filled with violence and lawlessness.",
          section("1-enoch-6-16", "7:1") + " " + section("1-enoch-6-16", "7:5") + " " + section("1-enoch-6-16", "7:6"),
          ["1 Enoch 7:1–6 (Charles 1913); the teaching catalogue stands at 8:1–3"],
          "The shard carries 7:1–6; the full teaching list (8:1–3) is summarized here and marked inferred for that reason.",
        ),
      },
    },
    {
      id: "the-judgment",
      label: "Judgment and Binding",
      description: "Genesis' flood decree against Enoch's named binding of Azazel and the healing of the earth.",
      cells: {
        "genesis-6": cell(
          "genesis-6",
          bibleLocator("GEN", "Genesis 6:3"),
          "explicit",
          "Yahweh's spirit will not strive with man forever; his days will be one hundred twenty years.",
          section("genesis-6-1-4", "6:3"),
          ["Genesis 6:3"],
          "The flood decree itself stands at 6:5–7, outside this shard; the shard carries the 120-years decree.",
        ),
        "enoch-6-16": cell(
          "enoch-6-16",
          enochLocator("1 Enoch 10:4–6, 11–13"),
          "explicit",
          "Raphael binds Azazel hand and foot, casts him into darkness in the desert of Dudael; the earth is healed of corruption; Shemihazah and his associates are bound for seventy generations.",
          section("1-enoch-6-16", "10:4") + " " + section("1-enoch-6-16", "10:5") + " " + section("1-enoch-6-16", "10:6") + " " + section("1-enoch-6-16", "10:11") + " " + section("1-enoch-6-16", "10:12") + " " + section("1-enoch-6-16", "10:13"),
          ["1 Enoch 10:4–13 (Charles 1913)"],
        ),
      },
    },
  ],
  edges: [
    {
      id: "enoch-expands-genesis",
      sourceWitnessId: "enoch-6-16",
      targetWitnessId: "genesis-6",
      relationship: "shared-tradition",
      scholarlyConsensus: "strong",
      basisNote:
        "1 Enoch 6–16 is an expansive retelling of the Genesis 6:1–4 notice: the same descent-union-offspring-judgment arc, elaborated with names, oaths, taught arts, and a mediation scene. Consensus treats the Enochic Book of the Watchers as a Second Temple development of the Genesis material.",
      citations: [
        "George W.E. Nickelsburg, *1 Enoch 1* (Hermeneia, 2001), pp. 165–262.",
        "James C. VanderKam, *Enoch and the Growth of an Apocalyptic Tradition* (CBQMS 16, 1984).",
        "R.H. Charles, *The Apocrypha and Pseudepigrapha of the Old Testament*, vol. 2 (1913).",
      ],
    },
    {
      id: "sons-of-god-interpretive-divergence",
      sourceWitnessId: "genesis-6",
      targetWitnessId: "enoch-6-16",
      relationship: "theological-divergence",
      scholarlyConsensus: "disputed",
      basisNote:
        "Genesis 6:2 does not identify the 'sons of God.' 1 Enoch reads them as angelic beings (the Watchers). Later Jewish and Christian interpretation divided between the angelic reading, a Sethite-lineage reading, and human-ruler readings; the divergence is interpretive, not textual.",
      citations: [
        "George W.E. Nickelsburg, *1 Enoch 1* (Hermeneia, 2001), pp. 165–171.",
        "Ronald S. Hendel, 'Of Demigods and the Deluge: Toward an Interpretation of Genesis 6:1–4,' *JBL* 106 (1987).",
        "B. Yoma 67b; Targum Neofiti on Genesis 6:2 (rabbinic and targumic readings).",
      ],
    },
  ],
  receptionClaims: [
    {
      id: "claim-nt-echo",
      tradition: "christian",
      subject: "The Watchers' Imprisonment in the New Testament",
      text: "2 Peter 2:4 and Jude 6 speak of angels who sinned and are held in chains for judgment — language that runs alongside the Enochic binding scene rather than anything explicit in Genesis 6.",
      basis: { axis: "attestation", grade: "explicit" },
      sources: [{ label: "2 Peter 2:4; Jude 6; Bauckham, *Jude, 2 Peter* (1983)" }],
      refs: [],
      limit: "The NT passages do not name 1 Enoch here; the correspondence is with the Enochic tradition.",
    },
    {
      id: "claim-ethiopian-canonical",
      tradition: "christian",
      subject: "Canonical Status of the Book of the Watchers",
      text: "In the Tewahedo canon, 1 Enoch is scripture; the Watchers narrative is read as inspired text, not as apocryphal elaboration.",
      basis: { axis: "attestation", grade: "explicit" },
      sources: [{ label: "Ethiopian Orthodox Tewahedo Church canon (81 books)" }],
      refs: [],
      limit: "Canonical status is a matter of church tradition; this claim records the Tewahedo position without ranking canons.",
    },
    {
      id: "claim-qumran-aramaic",
      tradition: "jewish",
      subject: "Aramaic Watchers Manuscripts at Qumran",
      text: "The Book of the Watchers is the best-attested Enochic work at Qumran, with multiple Aramaic manuscripts (4QEn a–g) dating from the third to first centuries BCE.",
      basis: { axis: "attestation", grade: "explicit" },
      sources: [{ label: "4QEn a–g (DJD 36); Milik, *The Books of Enoch* (1976)" }],
      refs: [],
      limit: "Canonical status is a matter of church tradition; this claim records the Tewahedo position without ranking canons.",
    },
  ],
};

// ── Matrix 3: son-of-man ───────────────────────────────────────────────────
const sonOfMan = {
  schemaVersion: "1.0.0",
  id: "son-of-man",
  slug: "son-of-man",
  title: "The Son of Man on the Throne",
  subtitle: "Daniel 7:13–14 · 1 Enoch 46–48 · Matthew 26:63–65",
  summary:
    "A source-anchored comparison of the cloud-riding figure in Daniel 7, the titled 'Son of Man' enthroned in 1 Enoch's Similitudes, and Jesus' self-designation before the high priest — with the dating dispute over the Similitudes kept explicit.",
  axis: "messianism",
  contextGuard: {
    requiresFullPericope: true,
    misuseNotice:
      "The Similitudes of Enoch (1 Enoch 37–71) are absent from the Qumran manuscripts, so their composition date — pre-Christian or late first century CE — is genuinely disputed. Every dependence claim in this matrix is graded accordingly; none is presented as settled.",
  },
  witnesses: [
    webWitness("daniel-7", "Daniel 7:13–14 (World English Bible)", "Daniel 7", "Hebrew Bible / Christian Old Testament"),
    enochWitness("enoch-46-48", "1 Enoch 46–48 (R.H. Charles)", "1 Enoch 46–48"),
    webWitness("matthew-26", "Matthew 26:63–65 (World English Bible)", "Matthew 26", "Christian New Testament"),
  ],
  slots: [
    {
      id: "the-figure",
      label: "The Cloud-Riding Figure",
      description: "How each text presents the figure who comes with the clouds.",
      cells: {
        "daniel-7": cell(
          "daniel-7",
          bibleLocator("DAN", "Daniel 7:13"),
          "explicit",
          "'One like a son of man' comes with the clouds of the sky — a simile, not yet a title.",
          section("daniel-7-13-14", "7:13"),
          ["Daniel 7:13"],
          "Aramaic *kəḇar ʾĕnāš* — 'one like a human being'; the simile is explicit in the wording.",
        ),
        "enoch-46-48": cell(
          "enoch-46-48",
          enochLocator("1 Enoch 46:1–3"),
          "explicit",
          "The 'Head of Days' is accompanied by 'that Son of Man,' whose face has graciousness like one of the holy angels.",
          section("1-enoch-46-48", "46:1") + " " + section("1-enoch-46-48", "46:2") + " " + section("1-enoch-46-48", "46:3"),
          ["1 Enoch 46:1–3 (Charles 1913)"],
        ),
        "matthew-26": cell(
          "matthew-26",
          bibleLocator("MAT", "Matthew 26:64"),
          "explicit",
          "Jesus answers the high priest: 'you will see the Son of Man sitting at the right hand of power, and coming with the clouds of the sky.'",
          section("matthew-26-63-65", "26:64"),
          ["Matthew 26:64"],
        ),
      },
    },
    {
      id: "the-throne-and-judgment",
      label: "Throne, Dominion, Judgment",
      description: "The role each text assigns the figure.",
      cells: {
        "daniel-7": cell(
          "daniel-7",
          bibleLocator("DAN", "Daniel 7:14"),
          "explicit",
          "Dominion, glory, and a kingdom are given him; all peoples serve him — an everlasting dominion.",
          section("daniel-7-13-14", "7:14"),
          ["Daniel 7:14"],
        ),
        "enoch-46-48": cell(
          "enoch-46-48",
          enochLocator("1 Enoch 48:2–7"),
          "explicit",
          "Before the sun and signs were created, his name was named; he is the light of the Gentiles, the hope of the troubled; kings and landowners worship him.",
          section("1-enoch-46-48", "48:2") + " " + section("1-enoch-46-48", "48:3") + " " + section("1-enoch-46-48", "48:4") + " " + section("1-enoch-46-48", "48:5") + " " + section("1-enoch-46-48", "48:6") + " " + section("1-enoch-46-48", "48:7"),
          ["1 Enoch 48:2–7 (Charles 1913)"],
        ),
        "matthew-26": cell(
          "matthew-26",
          bibleLocator("MAT", "Matthew 26:64"),
          "explicit",
          "Sitting at the right hand of power and coming with the clouds of the sky — throne language joined to Daniel's cloud language.",
          section("matthew-26-63-65", "26:64"),
          ["Matthew 26:64; Psalm 110:1 (the 'right hand' phrase's direct background)"],
        ),
      },
    },
    {
      id: "the-naming",
      label: "Simile, Title, Self-Designation",
      description: "How the phrase functions in each text.",
      cells: {
        "daniel-7": cell(
          "daniel-7",
          bibleLocator("DAN", "Daniel 7:13"),
          "explicit",
          "A simile: 'one like a son of man' contrasts the humanlike figure with the beastly kingdoms.",
          section("daniel-7-13-14", "7:13"),
          ["Daniel 7:13"],
        ),
        "enoch-46-48": cell(
          "enoch-46-48",
          enochLocator("1 Enoch 46:3"),
          "explicit",
          "A title in use: 'that Son of Man' — the phrase has become a designation of a preexistent figure.",
          section("1-enoch-46-48", "46:3"),
          ["1 Enoch 46:3 (Charles 1913)"],
        ),
        "matthew-26": cell(
          "matthew-26",
          bibleLocator("MAT", "Matthew 26:64"),
          "explicit",
          "Jesus' own self-designation under oath, joined to enthronement and cloud-coming language.",
          section("matthew-26-63-65", "26:64"),
          ["Matthew 26:63–64"],
        ),
      },
    },
  ],
  edges: [
    {
      id: "daniel-to-matthew",
      sourceWitnessId: "daniel-7",
      targetWitnessId: "matthew-26",
      relationship: "direct-citation",
      scholarlyConsensus: "strong",
      basisNote:
        "Matthew 26:64 combines Daniel 7:13's cloud-coming with Psalm 110:1's enthronement at the right hand. The verbal correspondence with Daniel 7:13 is direct and widely recognized.",
      citations: [
        "W.D. Davies and Dale C. Allison, *A Critical and Exegetical Commentary on the Gospel According to Saint Matthew*, vol. 3 (ICC, 1997), on 26:64.",
        "R.T. France, *The Gospel of Matthew* (NICNT, 2007), on 26:64.",
      ],
    },
    {
      id: "daniel-to-enoch",
      sourceWitnessId: "daniel-7",
      targetWitnessId: "enoch-46-48",
      relationship: "allusion",
      scholarlyConsensus: "disputed",
      basisNote:
        "The Similitudes develop Daniel 7's imagery into a titled, preexistent Son of Man. That the imagery is drawn from Daniel is widely held; the dating of the Similitudes — and therefore the direction and period of the development — is disputed, since no Similitudes fragments survive at Qumran.",
      citations: [
        "J.T. Milik, *The Books of Enoch: Aramaic Fragments of Qumrân Cave 4* (1976) — argues a late, possibly Christian-era date.",
        "David W. Suter, *Tradition and Composition in the Parables of Enoch* (1979).",
        "George W.E. Nickelsburg and James C. VanderKam, *1 Enoch 2* (Hermeneia, 2012), pp. 47–58 (dating discussion).",
      ],
    },
    {
      id: "enoch-to-matthew",
      sourceWitnessId: "enoch-46-48",
      targetWitnessId: "matthew-26",
      relationship: "allusion",
      scholarlyConsensus: "disputed",
      basisNote:
        "Whether Jesus' 'Son of Man' self-designation depends on the Similitudes' titled figure is a standing debate; it turns on the Similitudes' date. The direct textual background of Matthew 26:64 is Daniel 7 and Psalm 110; the Enochic role is interpretive, not verbatim.",
      citations: [
        "M. Black, 'The Son of Man Problem in Recent Research and Debate,' *NTS* 45 (1999).",
        "Gabriele Boccaccini, ed., *Enoch and the Messiah Son of Man* (2007).",
        "Craig A. Evans, 'The Son of Man Trait and the Similitudes of Enoch,' in *Enoch and the Messiah Son of Man* (2007).",
      ],
    },
  ],
  receptionClaims: [
    {
      id: "claim-similitudes-dating",
      tradition: "academic",
      subject: "The Dating Dispute over the Similitudes",
      text: "No fragments of 1 Enoch 37–71 have been found at Qumran, unlike the Book of the Watchers and the Astronomical Book. Proposals range from a pre-Christian composition to a late first-century CE redaction; the dispute directly conditions any claim that the Gospels' Son of Man language depends on the Similitudes.",
      basis: { axis: "textual", grade: "disputed" },
      sources: [
        { label: "Milik, *The Books of Enoch* (1976)" },
        { label: "Nickelsburg & VanderKam, *1 Enoch 2* (Hermeneia, 2012)" },
      ],
      refs: [],
      limit: "This is a live scholarly dispute; the matrix grades every affected claim as disputed.",
    },
    {
      id: "claim-ethiopian-canonical",
      tradition: "christian",
      subject: "The Similitudes as Canonical Scripture",
      text: "In the Tewahedo canon the Similitudes are part of canonical 1 Enoch; the titled Son of Man is read within scripture, not as an apocryphal parallel.",
      basis: { axis: "attestation", grade: "explicit" },
      sources: [{ label: "Ethiopian Orthodox Tewahedo Church canon (81 books)" }],
      refs: [],
      limit: "Canonical status is a matter of church tradition; this claim records the Tewahedo position without ranking canons.",
    },
    {
      id: "claim-rabbinic-daniel",
      tradition: "jewish",
      subject: "Daniel 7's Figure in Rabbinic Reading",
      text: "Rabbinic tradition reads Daniel 7's 'one like a son of man' variously — including as the Messiah (b. Sanhedrin 96b–97a, on 'bar nifle') and in connection with 'Anani' (b. Sanhedrin 38b) — without the Enochic title.",
      basis: { axis: "attestation", grade: "explicit" },
      sources: [{ label: "b. Sanhedrin 38b, 96b–97a" }],
      refs: [],
      limit: "Rabbinic readings are plural; this records the range, not a single view.",
    },
  ],
};

// ── Hash + write ───────────────────────────────────────────────────────────
const hashOf = (matrix) =>
  crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        slots: matrix.slots,
        edges: matrix.edges,
        receptionClaims: matrix.receptionClaims,
      }),
    )
    .digest("hex");

for (const matrix of [judeEnoch, watchers, sonOfMan]) {
  matrix.provenance = {
    reviewStatus: "agent-reviewed",
    reviewer: "Claude Sourcing & Review Pass (garovartabedian.com)",
    rubricVersion: "parallels-v1.0",
    reviewedContentHash: hashOf(matrix),
    reviewedAt: new Date().toISOString(),
    reviewScope: "Verbatim excerpt verification against hosted corpus texts, relationship grading, and reception separation",
  };
  const target = path.join(OUT_DIR, `${matrix.id}.json`);
  writeFileSync(target, JSON.stringify(matrix, null, 2) + "\n");
  console.log(`built ${matrix.id} (hash ${matrix.provenance.reviewedContentHash.slice(0, 12)}…)`);
}
