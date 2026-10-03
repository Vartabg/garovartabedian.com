import rawAfterlifeSchema from "../../../public/evidence/afterlife-schema.json";
import rawAfterlifeIndex from "../../../public/evidence/afterlife-index.json";

export const TRADITION_FAMILIES = [
  "ancient-near-east",
  "classical",
  "abrahamic",
  "gnostic",
  "dharmic",
  "east-asian",
  "european-folk",
  "african",
  "indigenous-americas",
  "oceania",
  "modern",
] as const;

export type TraditionFamily = (typeof TRADITION_FAMILIES)[number];

export const TRADITION_FAMILY_LABELS: Record<TraditionFamily, string> = {
  "ancient-near-east": "Ancient Near East",
  classical: "Classical Greco-Roman",
  abrahamic: "Abrahamic",
  gnostic: "Gnostic & Mystery",
  dharmic: "Dharmic (Indic)",
  "east-asian": "East Asian",
  "european-folk": "European Folk & Myth",
  african: "African Traditions",
  "indigenous-americas": "Indigenous Americas",
  oceania: "Oceania & Pacific",
  modern: "Modern & Secular",
};

export const AFTERLIFE_PATTERNS = [
  "judgment",
  "no-judgment",
  "rebirth",
  "underworld",
  "paradise",
  "ascent",
  "ancestral",
  "annihilation",
  "liberation",
] as const;

export type AfterlifePattern = (typeof AFTERLIFE_PATTERNS)[number];

export const AFTERLIFE_PATTERN_LABELS: Record<AfterlifePattern, string> = {
  judgment: "Moral Judgment",
  "no-judgment": "No Moral Sorting",
  rebirth: "Rebirth / Reincarnation",
  underworld: "Chthonic Underworld",
  paradise: "Paradise / Golden Realm",
  ascent: "Planetary / Mystical Ascent",
  ancestral: "Ancestral Communion",
  annihilation: "Cessation / Oblivion",
  liberation: "Moksha / Total Liberation",
};

export const CONNECTION_TYPES = [
  "historicalInfluence",
  "sharedDoctrine",
  "theologicalContrast",
  "cyclicalParallel",
  "theologicalMirror",
  "structuralSimilarity",
] as const;

export type ConnectionType = (typeof CONNECTION_TYPES)[number];

export const CONNECTION_LABELS: Record<ConnectionType, string> = {
  historicalInfluence: "Historical Influence",
  sharedDoctrine: "Shared Doctrine",
  theologicalContrast: "Theological Contrast",
  cyclicalParallel: "Cyclical Parallel",
  theologicalMirror: "Theological Mirror",
  structuralSimilarity: "Structural Similarity",
};

export type KeyFigure = {
  name: string;
  role: string;
  color?: string;
};

export type BeliefSystem = {
  id: string;
  name: string;
  coordinates: [number, number];
  description: string;
  essay?: string;
  story?: string;
  visualAssets: {
    thumbnail: string;
    immersiveView: string;
    journeyMap?: string;
  };
  aestheticTheme: {
    primaryColor: string;
    atmosphereTone: string;
    lightingIntensity: "low" | "medium" | "high" | "blinding";
  };
  primaryDoctrine: string;
  keyFigures: KeyFigure[];
  geography: {
    description: string;
    features: string[];
  };
  visualMotifs: string[];
  metadata: {
    origin: string;
    keyTexts: string[];
    structuralTaxonomy: string;
  };
  taxonomy: {
    family: TraditionFamily;
    patterns: AfterlifePattern[];
  };
  tactics: {
    yields: {
      karma: number;
      agony: number;
      enlightenment: number;
    };
    karmicWeight: number;
    antiquityAge: number;
    relatedNodes: string[];
  };
  connections?: Array<{
    targetId: string;
    type: ConnectionType;
    strength: number;
    description: string;
  }>;
};

export type AfterlifeIndexEntry = {
  id: string;
  name: string;
  description: string;
  origin: string;
  antiquityAge: number;
  taxonomy: BeliefSystem["taxonomy"];
  searchText: string;
};

const beliefSystems = rawAfterlifeSchema as BeliefSystem[];
const afterlifeIndex = rawAfterlifeIndex as AfterlifeIndexEntry[];
const beliefByIdMap = new Map<string, BeliefSystem>(
  beliefSystems.map((b) => [b.id, b]),
);

export function getAllBeliefSystems(): BeliefSystem[] {
  return beliefSystems;
}

export function getBeliefSystem(id: string): BeliefSystem | undefined {
  return beliefByIdMap.get(id);
}

export function getAfterlifeIndex(): AfterlifeIndexEntry[] {
  return afterlifeIndex;
}

export type AfterlifeCardSummary = {
  id: string;
  name: string;
  description: string;
  origin: string;
  antiquityAge: number;
  family: TraditionFamily;
  patterns: AfterlifePattern[];
  thumbnail: string;
  searchText: string;
};

export function getAfterlifeCardSummaries(): AfterlifeCardSummary[] {
  return afterlifeIndex.map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    origin: entry.origin,
    antiquityAge: entry.antiquityAge,
    family: entry.taxonomy.family,
    patterns: entry.taxonomy.patterns,
    thumbnail: `/afterlife/generated/v2/${entry.id}.webp`,
    searchText: entry.searchText,
  }));
}

export type ComparatorPreset = {
  id: string;
  title: string;
  description: string;
  traditionIds: [string, string, string];
};

export const COMPARATOR_PRESETS: ComparatorPreset[] = [
  {
    id: "ancient-underworlds",
    title: "The Ancient Underworlds",
    description: "Chthonic realms of shade, weighing, and subterranean rivers across Mesopotamia, the Nile, and the Aegean.",
    traditionIds: ["mesopotamian-kur", "egyptian-duat", "greek-hades"],
  },
  {
    id: "second-temple-roots",
    title: "Second Temple Roots & Christian Hope",
    description: "From Enochian judgment and shadowy Sheol to the embodied general resurrection.",
    traditionIds: ["enochian-watchers", "judaism-gehinnom", "christianity-last-things"],
  },
  {
    id: "rebirth-cycles",
    title: "Cycles of Rebirth & Transmigration",
    description: "The mechanics of karmic retribution, intermediate bardo states, and liberation from samsara.",
    traditionIds: ["tibetan-buddhism-bardo", "hinduism-garuda-purana", "jainism-gatis"],
  },
  {
    id: "the-moral-ladder",
    title: "The Moral Ladder & Purification",
    description: "Ascent through purgatorial terraces, razor-thin bridges, and trials of the dead.",
    traditionIds: ["christianity-purgatorio", "islam-barzakh-sirat", "zoroastrian-chinvat"],
  },
  {
    id: "death-as-horizon",
    title: "Death as Boundary & Mortalism",
    description: "Conditional immortality, ancient Indian materialism, and modern naturalist dissolution.",
    traditionIds: ["conditionalism-soul-sleep", "carvaka-lokayata", "naturalist-oblivion"],
  },
];

export function formatAntiquityAge(age: number): string {
  if (age < 0) return `${Math.abs(age)} BCE`;
  if (age === 0) return "1st c. CE";
  if (age < 100) return `c. ${age} CE`;
  return `${age} CE`;
}

export type BereanDossierLayers = {
  observed: {
    texts: string[];
    features: string[];
    geography: string;
  };
  inferred: {
    patterns: string[];
    structure: string;
    journey: string;
  };
  interpreted: {
    doctrine: string;
    figures: KeyFigure[];
    motifs: string[];
  };
  limit: string;
};

export function getBereanDossierLayers(b: BeliefSystem): BereanDossierLayers {
  return {
    observed: {
      texts: b.metadata.keyTexts,
      features: b.geography.features,
      geography: b.geography.description,
    },
    inferred: {
      patterns: b.taxonomy.patterns.map((p) => AFTERLIFE_PATTERN_LABELS[p] || p),
      structure: b.metadata.structuralTaxonomy,
      journey: b.description,
    },
    interpreted: {
      doctrine: b.primaryDoctrine,
      figures: b.keyFigures,
      motifs: b.visualMotifs,
    },
    limit: `The historical record establishes what adherents of ${b.metadata.origin} documented, built, and buried. The post-mortem reality described in ${b.metadata.keyTexts[0] || "its sacred texts"} remains an article of religious confession, not an empirically verified state.`,
  };
}

export type CrossWorldLink = {
  world: string;
  label: string;
  href: string;
  rationale: string;
};

export const CROSS_WORLD_AFTERLIFE_LINKS: Record<string, CrossWorldLink[]> = {
  "enochian-watchers": [
    {
      world: "Scriptures",
      label: "The Watchers Parallel Dossier",
      href: "/scriptures/parallels/the-watchers",
      rationale: "Comparative analysis of Genesis 6, 1 Enoch, and Second Temple demonology.",
    },
    {
      world: "Scriptures",
      label: "Jude's Quotation of Enoch",
      href: "/scriptures/parallels/jude-enoch-quotation",
      rationale: "How apostolic letters cite and incorporate Enochian judgment tradition.",
    },
    {
      world: "Early Writings",
      label: "Second Temple Apocrypha",
      href: "/early/era/apocrypha",
      rationale: "Preserved apocalyptic manuscripts from Qumran and Hellenistic Judaism.",
    },
    {
      world: "Angels & Demons",
      label: "The Fall Behind the Taunt",
      href: "/angels/fall",
      rationale: "Ancient Near Eastern background of fallen celestial entities.",
    },
  ],
  "judaism-gehinnom": [
    {
      world: "Scriptures",
      label: "Scripture Topic: Heaven & The Age to Come",
      href: "/scriptures/topics/HEAVEN",
      rationale: "Canonical biblical vocabulary for Sheol, Gehenna, and the resurrection.",
    },
    {
      world: "Who Owns the Word?",
      label: "Translation Disputes: Sheol vs Hades vs Hell",
      href: "/word/cases",
      rationale: "How modern and historical translations render chthonic realm vocabulary.",
    },
    {
      world: "Early Writings",
      label: "Second Temple Jewish Literature",
      href: "/early/era/jewish",
      rationale: "Writings documenting the transition from shadowy Sheol to moral resurrection.",
    },
  ],
  "christianity-last-things": [
    {
      world: "Jesus",
      label: "The Risen Christ",
      href: "/jesus/risen",
      rationale: "The physical bodily resurrection as the foundational prototype of Christian hope.",
    },
    {
      world: "The Church",
      label: "Ecumenical Councils",
      href: "/church/councils",
      rationale: "Creedal definitions of the resurrection of the body and judgment.",
    },
    {
      world: "Scriptures",
      label: "Scripture Topic: Resurrection",
      href: "/scriptures/topics/RESURRECTION",
      rationale: "Pauline theology of the spiritual body (1 Cor 15).",
    },
  ],
  "orthodox-toll-houses": [
    {
      world: "The Church",
      label: "Patristic Fathers & Theologians",
      href: "/church/faces",
      rationale: "Eastern monastic and patristic writings on post-mortem aerial trial.",
    },
    {
      world: "Angels & Demons",
      label: "Demonic Hierarchy & Opposition",
      href: "/angels/demons",
      rationale: "The role of adversarial powers in Patristic cosmology.",
    },
  ],
  "christianity-purgatorio": [
    {
      world: "The Church",
      label: "Council of Florence & Trent",
      href: "/church/councils",
      rationale: "Doctrinal formalization of post-mortem purification and intermediate state.",
    },
    {
      world: "The Church",
      label: "The Giants: Aquinas & Medieval Scholasticism",
      href: "/church/giants",
      rationale: "Scholastic distinctions on temporal punishment and suffrages for the dead.",
    },
  ],
  "conditionalism-soul-sleep": [
    {
      world: "Scriptures",
      label: "Scripture Topic: Death & Mortality",
      href: "/scriptures/topics/DEATH",
      rationale: "Old and New Testament texts describing death as sleep awaiting resurrection.",
    },
    {
      world: "Who Owns the Word?",
      label: "Mortalism & Translation Nuance",
      href: "/word/cases",
      rationale: "How Bible committees handle words like nephesh, psyche, and aionios.",
    },
  ],
  "gnostic-pleroma": [
    {
      world: "Early Writings",
      label: "Early Apocryphal & Nag Hammadi Context",
      href: "/early/era/apocrypha",
      rationale: "Second-century Gnostic gospels, archon lists, and planetary ascent texts.",
    },
    {
      world: "The Church",
      label: "Irenaeus of Lyons: Against Heresies",
      href: "/church/giants",
      rationale: "The proto-orthodox critique of archontic barriers and secret passwords.",
    },
  ],
  "mesopotamian-kur": [
    {
      world: "Scriptures",
      label: "The Adam & Fall Comparative Parallels",
      href: "/scriptures/parallels/adam-fall-and-iblis",
      rationale: "Comparative Near Eastern mythic horizons (Gilgamesh, Inanna, Atrahasis).",
    },
    {
      world: "How We Know",
      label: "The Source Map: Ancient Near Eastern Soil",
      href: "/sources#jesus-history",
      rationale: "Epistemological boundaries between cuneiform myth and biblical history.",
    },
  ],
  "plato-myth-of-er": [
    {
      world: "Early Writings",
      label: "Greco-Roman Apologists",
      href: "/early/era/apologists",
      rationale: "How Justin Martyr and Clement of Alexandria engaged Platonic immortality.",
    },
    {
      world: "The Church",
      label: "Patristic Synthesis: Athens and Jerusalem",
      href: "/church/giants",
      rationale: "Augustine's integration and critique of Platonic eschatology.",
    },
  ],
  "egyptian-duat": [
    {
      world: "How We Know",
      label: "The Archaeological Stone & Witness Method",
      href: "/evidence#method",
      rationale: "Separating material funerary artifacts from theological inferences of the afterlife.",
    },
  ],
};

export function getCrossWorldLinks(beliefId: string): CrossWorldLink[] {
  return CROSS_WORLD_AFTERLIFE_LINKS[beliefId] || [];
}
