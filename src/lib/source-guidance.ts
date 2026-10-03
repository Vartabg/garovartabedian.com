import evidenceData from "../../public/evidence/cases.json";

export type SourceGroupLink = {
  label: string;
  href: string;
  note: string;
  kind:
    | "primary text"
    | "dataset"
    | "rights holder"
    | "court record"
    | "reference"
    | "consensus report"
    | "research agency"
    | "philosophy reference"
    | "ecumenical creed"
    | "confessional source";
};

export type SourceGroup = {
  id: string;
  title: string;
  summary: string;
  method: string[];
  links: SourceGroupLink[];
};

export type SourceBasisId =
  | "scripture-reader"
  | "jesus-history"
  | "early-text"
  | "church-road"
  | "angels-order"
  | "evidence-method"
  | "word-ledger"
  | "word-cases"
  | "word-free";

export type SourceBasis = {
  id: SourceBasisId;
  title: string;
  body: string;
  items: { label: string; value: string }[];
  href: string;
  hrefLabel: string;
};

const EVIDENCE_SOURCE_LINKS: SourceGroupLink[] = evidenceData.sources.map(
  (source) => ({
    label: source.label,
    href: source.href,
    note: `${source.organization}. ${source.note}`,
    kind: source.kind as SourceGroupLink["kind"],
  }),
);

export const SOURCE_GROUPS: SourceGroup[] = [
  {
    id: "scripture-texts",
    title: "Scripture texts and indexes",
    summary:
      "The hosted Bible reader uses public-domain English texts, open original-language editions, and locally generated indexes. The raw manifests remain under public/scriptures; this page gives readers a human entry point.",
    method: [
      "Verse text is taken from public-domain source files and kept unmodified except for markup stripping and whitespace cleanup.",
      "Book codes, verse numbering, cross-references, and topic links are generated locally so links resolve into the hosted reader.",
      "Translations that are not public domain are discussed in the Word room, not hosted as scripture text.",
      "Original-language mode identifies its critical edition rather than calling any modern reconstruction a surviving authorial manuscript.",
    ],
    links: [
      {
        label: "Open Scriptures Hebrew Bible",
        href: "https://github.com/openscriptures/morphhb",
        note: "Westminster Leningrad Codex text (public domain) with CC BY 4.0 Hebrew and Aramaic lemma and morphology data.",
        kind: "primary text",
      },
      {
        label: "SBL Greek New Testament",
        href: "https://www.sblgnt.com/",
        note: "CC BY 4.0 critical Greek New Testament used for the New Testament source-text layer.",
        kind: "primary text",
      },
      {
        label: "MorphGNT: SBLGNT Edition",
        href: "https://github.com/morphgnt/sblgnt",
        note: "CC BY-SA 3.0 lemmatization and morphological parsing displayed in the word inspector.",
        kind: "dataset",
      },
      {
        label: "Rahlfs Septuagint (1935) + lxx-morph",
        href: "https://git.sr.ht/~sethkush/lxx-morph",
        note: "Public-domain Rahlfs Greek text from the Eliran Wong digital edition with morphology data by Seth Kushniryk. This site adapts and filters the data into chapter-level reader records, renames fields, and omits verbose per-token reasoning from the distributed files; that reasoning remains at pinned revision c91f6b1e8fb3ba37df701e6ae31f675ace71a2b2.",
        kind: "dataset",
      },
      {
        label: "lxx-morph data license (CC BY 4.0)",
        href: "https://creativecommons.org/licenses/by/4.0/",
        note: "Direct license for Seth Kushniryk's morphology dataset; adaptations must retain attribution and indicate that changes were made.",
        kind: "reference",
      },
      {
        label: "World English Bible",
        href: "https://ebible.org/Scriptures/eng-web_vpl.zip",
        note: "Public-domain source text for the main Protestant and Apocrypha reader.",
        kind: "primary text",
      },
      {
        label: "King James Version, eBible 2006 edition",
        href: "https://ebible.org/Scriptures/eng-kjv2006_vpl.zip",
        note: "Public-domain 1769 Blayney text used for KJV shelves.",
        kind: "primary text",
      },
      {
        label: "Douay-Rheims 1899 American",
        href: "https://ebible.org/Scriptures/engDRA_vpl.zip",
        note: "Public-domain Challoner text for Catholic coverage.",
        kind: "primary text",
      },
      {
        label: "Brenton Septuagint 1851",
        href: "https://ebible.org/Scriptures/eng-Brenton_vpl.zip",
        note: "Public-domain Septuagint translation used where its canon is relevant.",
        kind: "primary text",
      },
      {
        label: "Jubilees, R. H. Charles (1913)",
        href: "https://www.ccel.org/c/charles/otpseudepig/jubilee/index.htm",
        note: "CCEL's transcription, scanned and edited by Joshua Williams, Northwest Nazarene College, supplies the wording for all 50 hosted chapters. Verse boundaries were checked against the printed edition and Charles's 1917 numbering; the 1913 wording and editorial dates are retained.",
        kind: "primary text",
      },
      {
        label: "Charles, Apocrypha and Pseudepigrapha, volume II (Oxford, 1913)",
        href: "https://archive.org/details/apocryphapseudep02char",
        note: "The original Clarendon Press volume containing Jubilees, used to check the transcription and printed marginal verse numbers.",
        kind: "primary text",
      },
      {
        label: "Treasury of Scripture Knowledge cross-references",
        href: "https://raw.githubusercontent.com/ariseshinestudio/TSK/master/tskxref.txt",
        note: "Public-domain cross-reference dataset parsed into local reader links.",
        kind: "dataset",
      },
      {
        label: "Nave's Topical Bible CSV",
        href: "https://raw.githubusercontent.com/BradyStephenson/bible-data/main/NavesTopicalDictionary.csv",
        note: "Public-domain topical index parsed and verified against hosted verses.",
        kind: "dataset",
      },
    ],
  },
  {
    id: "jesus-history",
    title: "Jesus history and artifacts",
    summary:
      "The Jesus history room separates Christian texts, non-Christian literary witnesses, and archaeological objects. Each record keeps its own source line next to the claim it supports.",
    method: [
      "Early Christian letters and Gospels are dated first, with literary dependence kept distinct from independent attestation.",
      "Non-Christian witnesses are quoted from public-domain translations or public source records.",
      "Artifacts are used to establish setting, offices, places, and practices; the page does not make those objects mention Jesus when they do not.",
    ],
    links: [
      {
        label: "Yale Open Courses, historical study of the New Testament",
        href: "https://oyc.yale.edu/religious-studies/rlst-152",
        note: "Academic orientation used for source dating, literary dependence, and historical-method boundaries.",
        kind: "reference",
      },
      {
        label: "Josephus, Antiquities of the Jews",
        href: "https://www.gutenberg.org/cache/epub/2848/pg2848.txt",
        note: "Public-domain translation used for the Josephus records.",
        kind: "primary text",
      },
      {
        label: "Pliny and Trajan, Letters 10.96-97",
        href: "https://www.gutenberg.org/cache/epub/2811/pg2811.txt",
        note: "Public-domain letters describing early Christian worship and Roman policy.",
        kind: "primary text",
      },
      {
        label: "Tacitus, Annals 15.44",
        href: "https://en.wikisource.org/wiki/The_Annals_(Tacitus)/Book_15",
        note: "Public text cited for the Nero persecution record.",
        kind: "primary text",
      },
      {
        label: "Pilate Stone record",
        href: "https://www.imj.org.il/en/exhibitions/cradle-christianity",
        note: "Israel Museum object record used to ground Pontius Pilate in the archaeological setting.",
        kind: "reference",
      },
    ],
  },
  {
    id: "apostles",
    title: "The apostles' records and roads",
    summary:
      "The Apostles world keeps three layers apart: what the New Testament states, what early sources within about a century add, and what only later tradition supplies. Every claim wears its grade on the page.",
    method: [
      "Scripture refs use the hosted public-domain reader, so every citation resolves to the verse itself.",
      "Mission and death claims name the earliest surviving source that states them — not the fullest or most famous retelling.",
      "Where the earliest sources conflict or fall silent, the page shows the conflict or the blank instead of choosing a legend.",
    ],
    links: [
      {
        label: "Eusebius, Church History",
        href: "https://www.newadvent.org/fathers/2501.htm",
        note: "Carries the earliest mission list (Origen, book 3.1) and the Papias, Polycrates, and Abgar records used for the roads.",
        kind: "primary text",
      },
      {
        label: "1 Clement",
        href: "https://www.newadvent.org/fathers/1010.htm",
        note: "First-century Roman letter used for the Peter and Paul martyrdom records.",
        kind: "primary text",
      },
      {
        label: "Irenaeus, Against Heresies",
        href: "https://www.newadvent.org/fathers/0103.htm",
        note: "Second-century witness for John at Ephesus and the apostolic succession claims.",
        kind: "primary text",
      },
      {
        label: "Acts of Thomas",
        href: "https://en.wikisource.org/wiki/The_Apocryphal_New_Testament_(1924)",
        note: "M. R. James's Oxford translation of the early apocryphal romance behind the India tradition — used as tradition, graded as such.",
        kind: "primary text",
      },
      {
        label: "Armenian Monastic Ensembles of Iran (UNESCO)",
        href: "https://whc.unesco.org/en/list/1262/",
        note: "Object record for the St. Thaddeus Monastery shrine tradition.",
        kind: "reference",
      },
    ],
  },
  {
    id: "early-writings",
    title: "Early Christian writings",
    summary:
      "Hosted early writings are public-domain translations. Each text page names its date range, translator, source link, and survival notes where the data has them.",
    method: [
      "The hosted text is presented as a witness to early Christian memory, not as canon unless a tradition receives it as canon.",
      "Translator and source are shown above the text before commentary or visual material.",
      "Survival notes distinguish manuscript evidence from later reception claims.",
    ],
    links: [
      {
        label: "The Didache, Ante-Nicene Fathers VII",
        href: "https://en.wikisource.org/wiki/Ante-Nicene_Fathers/Volume_VII/The_Teaching_of_the_Twelve_Apostles/The_Teaching_of_the_Twelve_Apostles",
        note: "Public-domain M. B. Riddle translation used for the hosted Didache.",
        kind: "primary text",
      },
      {
        label: "1 Clement, Ante-Nicene Fathers I",
        href: "https://en.wikisource.org/wiki/Ante-Nicene_Fathers/Volume_I/First_Epistle_to_the_Corinthians",
        note: "Public-domain Roberts and Donaldson translation used for 1 Clement.",
        kind: "primary text",
      },
      {
        label: "The Book of Enoch, R. H. Charles",
        href: "https://en.wikisource.org/wiki/The_Book_of_Enoch_(Charles)",
        note: "Public-domain 1917 translation used for 1 Enoch.",
        kind: "primary text",
      },
      {
        label: "Ascension of Isaiah, R. H. Charles",
        href: "https://earlychurch.org.uk/pdf/e-books/charles_r-h/ascension-of-isaiah_charles_r-h.pdf",
        note: "Public-domain translation source used for the hosted text.",
        kind: "primary text",
      },
    ],
  },
  {
    id: "church-history",
    title: "Church history records",
    summary:
      "The Church road uses dated events with inline source links and public-domain quotations where possible. Broad reference sources are used for orientation; primary texts carry the quotation load.",
    method: [
      "Every road step has a source URL in the data.",
      "When an era speaks in its own words, the quote has its own source line.",
      "Dark chapters are sourced beside bright ones rather than separated into a disclaimer.",
    ],
    links: [
      {
        label: "Acts 15 in the hosted reader",
        href: "/scriptures/protestant/ACT/15#v28",
        note: "Internal text basis for the Jerusalem council quotation.",
        kind: "primary text",
      },
      {
        label: "Edict of Milan in Lactantius",
        href: "https://en.wikisource.org/wiki/Ante-Nicene_Fathers/Volume_VII/Lactantius/Of_the_Manner_in_Which_the_Persecutors_Died/Chap._XLVIII",
        note: "Public-domain source used for the imperial toleration quote.",
        kind: "primary text",
      },
      {
        label: "Urban II at Clermont, Fulcher of Chartres",
        href: "https://sourcebooks.fordham.edu/source/urban2-fulcher.asp",
        note: "Primary-source classroom edition used for the Crusade-era quotation.",
        kind: "primary text",
      },
      {
        label: "The Apostolic Faith, September 1906",
        href: "https://www.loc.gov/item/sn90005481/",
        note: "Library of Congress newspaper record used for Azusa Street context.",
        kind: "primary text",
      },
    ],
  },
  {
    id: "angels-demons",
    title: "Angels and demons",
    summary:
      "The Angels room is intentionally narrow: ranks, names, enemy titles, and encounters come from scripture references that resolve into the hosted reader.",
    method: [
      "The order page counts linked references across bands, names, and enemy titles.",
      "Deuterocanonical names appear only where that canon contains them.",
      "Later angelology is identified as later tradition rather than blended into the core order.",
    ],
    links: [
      {
        label: "Isaiah 6, throne and seraphim",
        href: "/scriptures/protestant/ISA/6#v1",
        note: "Hosted reader reference for the throne-room source band.",
        kind: "primary text",
      },
      {
        label: "Revelation 12, Michael and the dragon",
        href: "/scriptures/protestant/REV/12#v7",
        note: "Hosted reader reference for Michael and the heavenly conflict.",
        kind: "primary text",
      },
      {
        label: "Tobit 12, Raphael",
        href: "/scriptures/catholic/TOB/12#v15",
        note: "Deuterocanonical reference used only in traditions that carry Tobit.",
        kind: "primary text",
      },
      {
        label: "Search the hosted text for angel",
        href: "/scriptures/search?q=angel",
        note: "Internal search view across the public-domain scripture corpus.",
        kind: "dataset",
      },
    ],
  },
  {
    id: "how-we-know",
    title: "How We Know: evidence and inference",
    summary:
      "This world is the site's connective method: it does not place text, artifact, witness, experiment, philosophy, tradition, and theology on one undifferentiated ladder. Each record is labeled by evidence class and used only for the kind of question it can answer.",
    method: [
      "Cross-world cases link back to the source groups above, preserving the provenance rules of the world where each record originated.",
      "Scientific claims begin with research agencies, consensus reports, or peer-reviewed literature; observations remain separate from metaphysical conclusions.",
      "Philosophical arguments expose their assumptions and serious alternatives rather than presenting one interpretation as measured fact.",
      "Theological and traditional claims are grounded in scripture, ecumenical confession, and clearly named communities; confessional sources are labeled as confessional.",
      "Every case ends with a limit statement describing what its evidence cannot establish.",
    ],
    links: EVIDENCE_SOURCE_LINKS,
  },
  {
    id: "word-ownership",
    title: "Bible ownership and copyright",
    summary:
      "The Word room treats ownership claims as documentary claims. It cites rights-holder permission pages, public license pages, court records, and publisher notices.",
    method: [
      "Owned translations cite the owner or publisher permission page beside the card.",
      "Case studies cite court records, public statements, or the best available public account when a private licensing dispute is the only record.",
      "Free translations cite their own copyright or licensing statements before they are linked as hosted texts.",
    ],
    links: [
      {
        label: "Biblica NIV permissions",
        href: "https://www.biblica.com/resources/bible-faqs/do-i-have-to-notify-biblica-to-use-a-bible-verse-from-the-niv/",
        note: "Rights-holder policy source for NIV usage allowances.",
        kind: "rights holder",
      },
      {
        label: "Crossway ESV permissions",
        href: "https://www.crossway.org/permissions/",
        note: "Rights-holder policy source for ESV usage allowances.",
        kind: "rights holder",
      },
      {
        label: "Lockman quotation and trademark information",
        href: "https://www.lockman.org/permission-to-quote-copyright-trademark-information/",
        note: "Rights-holder source for NASB permissions and current AI-related policy.",
        kind: "rights holder",
      },
      {
        label: "F.E.L. Publications v. Catholic Bishop of Chicago",
        href: "https://law.justia.com/cases/federal/appellate-courts/F2/754/216/451303/",
        note: "Court record for one copyright-enforcement case study.",
        kind: "court record",
      },
      {
        label: "CrossWire ESV removal thread",
        href: "https://www.crosswire.org/pipermail/sword-devel/2019-June/047095.html",
        note: "Public project record for the ESV open-source app licensing reversal.",
        kind: "reference",
      },
      {
        label: "World English Bible copyright statement",
        href: "https://ebible.org/web/copyright.htm",
        note: "Public-domain license basis for one hosted free translation.",
        kind: "primary text",
      },
    ],
  },
];

export const SOURCE_BASIS: Record<SourceBasisId, SourceBasis> = {
  "scripture-reader": {
    id: "scripture-reader",
    title: "Text basis",
    body:
      "This reader hosts public-domain scripture text and generated indexes. The raw manifest remains available, and the human source page explains how those files were processed.",
    items: [
      { label: "Texts", value: "WEB, KJV, Douay-Rheims, Brenton Septuagint" },
      { label: "Indexes", value: "TSK cross-references and Nave topics" },
      { label: "Boundary", value: "Modern copyrighted translations are discussed, not hosted" },
    ],
    href: "/sources#scripture-texts",
    hrefLabel: "See scripture sources",
  },
  "jesus-history": {
    id: "jesus-history",
    title: "What counts as evidence here",
    body:
      "This page dates committed Christian testimony first, then compares it with Jewish and Roman witnesses and objects from the ground. Every item states what it can and cannot establish.",
    items: [
      { label: "Early Christian", value: "Paul and the Gospels, with source distance and dependence visible" },
      { label: "Jewish and Roman", value: "Josephus, Pliny, Trajan, Tacitus, Suetonius" },
      { label: "Artifacts", value: "Objects that ground names, places, offices, or practices" },
      { label: "Boundary", value: "Belief, outside report, and physical context are not flattened into one kind of proof" },
    ],
    href: "/sources#jesus-history",
    hrefLabel: "See Jesus history sources",
  },
  "early-text": {
    id: "early-text",
    title: "How this text is sourced",
    body:
      "Each hosted early writing names its translator and source before the text. Date ranges and survival notes are presented as historical context, not upgraded into certainty.",
    items: [
      { label: "Text", value: "Public-domain translation linked at the top of the page" },
      { label: "Context", value: "Date range, translator, and manuscript survival where available" },
      { label: "Boundary", value: "Reception and canon status are not flattened across traditions" },
    ],
    href: "/sources#early-writings",
    hrefLabel: "See early-writing sources",
  },
  "church-road": {
    id: "church-road",
    title: "How the road is sourced",
    body:
      "The road is built from dated steps with their own source URLs. Primary quotations carry separate source links so the era can speak for itself where possible.",
    items: [
      { label: "Events", value: "Every road step has a source in the data" },
      { label: "Quotes", value: "Primary or public-domain text where the page quotes directly" },
      { label: "Boundary", value: "Dark chapters are included in the same sourced timeline" },
    ],
    href: "/sources#church-history",
    hrefLabel: "See church-history sources",
  },
  "angels-order": {
    id: "angels-order",
    title: "Why the order stays narrow",
    body:
      "This room uses scripture references as its control. Later systems are named when relevant, but the order below is limited to ranks, names, and titles the hosted text supplies.",
    items: [
      { label: "Core refs", value: "Every band and name links back into the reader" },
      { label: "Canon boundary", value: "Tobit and 2 Esdras appear only where those books apply" },
      { label: "Excluded", value: "Later nine-choir schemes are not blended into the base order" },
    ],
    href: "/sources#angels-demons",
    hrefLabel: "See angel sources",
  },
  "evidence-method": {
    id: "evidence-method",
    title: "How claims enter this world",
    body:
      "The How We Know dataset keeps records, observations, inferences, interpretations, traditions, alternatives, and limits in separate fields. Material from another world links back to its original evidence trail instead of silently changing that world's data.",
    items: [
      {
        label: "Records",
        value: "Text, stone, witness, experiment, policy, and primary documents",
      },
      {
        label: "Provenance",
        value: "Every cross-world case returns to the sources already supporting it",
      },
      {
        label: "Reasoning",
        value: "Assumptions, inference, interpretation, and alternatives stay visible",
      },
      {
        label: "Boundary",
        value: "Every case states what its evidence cannot establish",
      },
    ],
    href: "/sources#how-we-know",
    hrefLabel: "See the evidence sources",
  },
  "word-ledger": {
    id: "word-ledger",
    title: "What this page treats as evidence",
    body:
      "Ownership and permission claims are taken from rights-holder pages, publisher records, and public license statements. The cards keep those source links beside the claim.",
    items: [
      { label: "Owned texts", value: "Rights-holder or publisher permission pages" },
      { label: "Free texts", value: "Copyright and license pages from the translation projects" },
      { label: "Reader basis", value: "Only public-domain texts are hosted as scripture here" },
    ],
    href: "/sources#word-ownership",
    hrefLabel: "See ownership sources",
  },
  "word-cases": {
    id: "word-cases",
    title: "How these cases are checked",
    body:
      "Case studies use public court records, rights-holder statements, project archives, and clearly labeled single-source public accounts where no court file exists.",
    items: [
      { label: "Court files", value: "Justia and public federal case records where available" },
      { label: "Policy shifts", value: "Rights-holder statements and archived project records" },
      { label: "Boundary", value: "Private disputes stay labeled by the public record available" },
    ],
    href: "/sources#word-ownership",
    hrefLabel: "See ownership sources",
  },
  "word-free": {
    id: "word-free",
    title: "How each chain is checked",
    body:
      "Every hosted text links the archive the site ingested, the rights page that says it is free, and the processing notes. Counts and shelf placement are read from the reader's own data at build time, not typed by hand.",
    items: [
      { label: "Texts", value: "eBible archives and public-domain transcriptions, unmodified" },
      { label: "Rights", value: "The hosting project's copyright page or the dated printed volume" },
      { label: "Apparatus", value: "Open licenses are named as open licenses, not called public domain" },
      { label: "Boundary", value: "A broken link means an unverified claim, not a quiet one" },
    ],
    href: "/sources#scripture-texts",
    hrefLabel: "See scripture sources",
  },
};
