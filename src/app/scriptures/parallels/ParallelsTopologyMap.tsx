"use client";

import { useMemo } from "react";

export type FilterCategory =
  | "all"
  | "quranic"
  | "enochic"
  | "christological"
  | "primeval"
  | "prophetic-law";

export type TraditionId = "tanakh" | "second-temple" | "new-testament" | "quran";

type TraditionMeta = {
  id: TraditionId;
  name: string;
  short: string;
  era: string;
  color: string;
  borderColor: string;
  bg: string;
  description: string;
};

const TRADITIONS: TraditionMeta[] = [
  {
    id: "tanakh",
    name: "Hebrew Bible / Tanakh",
    short: "Hebrew Canon",
    era: "c. 1200 – 200 BCE",
    color: "#60a5fa",
    borderColor: "#1d4ed8",
    bg: "rgba(30, 58, 138, 0.25)",
    description: "Genesis, Exodus, Daniel, and the Prophets in the Masoretic / Leningrad text",
  },
  {
    id: "second-temple",
    name: "Second Temple & Rabbinic",
    short: "2nd Temple / Mishnah",
    era: "c. 300 BCE – 200 CE",
    color: "#c084fc",
    borderColor: "#7e22ce",
    bg: "rgba(88, 28, 135, 0.25)",
    description: "1 Enoch, Jubilees, Vita Adae, and Mishnah Sanhedrin",
  },
  {
    id: "new-testament",
    name: "New Testament & Apostolic",
    short: "Gospels & Epistles",
    era: "c. 50 – 150 CE",
    color: "#fbbf24",
    borderColor: "#b45309",
    bg: "rgba(120, 53, 15, 0.25)",
    description: "Matthew, Luke, Mark, Jude, and early Infancy traditions",
  },
  {
    id: "quran",
    name: "Qur'an & Islamic Witness",
    short: "Qur'anic Arabic",
    era: "c. 610 – 632 CE",
    color: "#34d399",
    borderColor: "#047857",
    bg: "rgba(6, 78, 59, 0.25)",
    description: "Surahs 2 (Al-Baqarah), 3 (Ali 'Imran), 5 (Al-Ma'idah), 7, 19, 20, 37",
  },
];

const FILTER_BUTTONS: { id: FilterCategory; label: string; count: number }[] = [
  { id: "all", label: "All 8 Matrices", count: 8 },
  { id: "quranic", label: "Biblical ↔ Qur'anic Bridges", count: 5 },
  { id: "enochic", label: "Enochic & Second Temple", count: 3 },
  { id: "christological", label: "Christology & Nativity", count: 2 },
  { id: "primeval", label: "Creation, Fall & Blood of Abel", count: 3 },
  { id: "prophetic-law", label: "Prophets, Covenant & Law", count: 3 },
];

const BRIDGES: Array<{
  id: string;
  slug: string;
  title: string;
  category: FilterCategory[];
  traditions: TraditionId[];
  fromLabel: string;
  bridgeLabel: string;
  toLabel: string;
  flowDescription: string;
}> = [
  {
    id: "adam-fall-and-iblis",
    slug: "adam-fall-and-iblis",
    title: "The Fall & The Refusal of Iblis",
    category: ["all", "quranic", "primeval"],
    traditions: ["tanakh", "second-temple", "quran"],
    fromLabel: "Genesis 3 (Eden & Serpent)",
    bridgeLabel: "Vita Adae (Satan refusing to bow to clay)",
    toLabel: "Qur'an 2 & 7 (Iblis's refusal & expulsion)",
    flowDescription: "Genesis records the temptation and fall; Vita Adae expands the Accuser's jealousy of Adam's image; the Qur'an mirrors the angelic command to bow.",
  },
  {
    id: "the-watchers",
    slug: "the-watchers",
    title: "The Watchers & Nephilim",
    category: ["all", "enochic", "primeval"],
    traditions: ["tanakh", "second-temple", "new-testament"],
    fromLabel: "Genesis 6:1–4 (Sons of God & Nephilim)",
    bridgeLabel: "1 Enoch 6–16 (Descent on Mt Hermon & Azazel)",
    toLabel: "2 Peter 2:4 / Jude 6 (Angels kept in darkness)",
    flowDescription: "Terse primeval notice in Genesis 6 expanded dramatically in 1 Enoch's Book of the Watchers, shaping the apostolic letters.",
  },
  {
    id: "sanctity-of-human-life",
    slug: "sanctity-of-human-life",
    title: "The Blood of Abel & Sanctity of Life",
    category: ["all", "quranic", "primeval", "prophetic-law"],
    traditions: ["tanakh", "second-temple", "quran"],
    fromLabel: "Genesis 4:8–10 (Abel's bloods crying from ground)",
    bridgeLabel: "Mishnah Sanhedrin 4:5 (Destroys a single soul)",
    toLabel: "Qur'an 5:32 (Killing one is killing all mankind)",
    flowDescription: "The rabbinic exegetical midrash on the plural 'bloods' of Abel in Genesis 4 is directly cited in Surah 5:32 as a decree for the Children of Israel.",
  },
  {
    id: "sacrifice-of-the-son",
    slug: "sacrifice-of-the-son",
    title: "The Sacrifice of the Son (Akedah)",
    category: ["all", "quranic", "prophetic-law"],
    traditions: ["tanakh", "second-temple", "quran"],
    fromLabel: "Genesis 22 (Testing of Abraham & Isaac)",
    bridgeLabel: "Jubilees 17–18 (Prince Mastema instigates test)",
    toLabel: "Qur'an 37:99–113 (Gentle son consents to dream)",
    flowDescription: "Genesis emphasizes paternal obedience; Jubilees introduces the demonic prosecutor Mastema; the Qur'an highlights filial submission.",
  },
  {
    id: "son-of-man",
    slug: "son-of-man",
    title: "The Son of Man on the Throne",
    category: ["all", "enochic", "christological"],
    traditions: ["tanakh", "second-temple", "new-testament"],
    fromLabel: "Daniel 7:13–14 (One like a Son of Man with clouds)",
    bridgeLabel: "1 Enoch 46 / 71 (Elect One named on throne of glory)",
    toLabel: "Matthew 26:64 / Mark 14:62 (Jesus before Sanhedrin)",
    flowDescription: "The apocalyptic visionary figure of Daniel 7 is personalized as the eschatological judge in the Similitudes of Enoch, claimed by Jesus at his trial.",
  },
  {
    id: "infancy-and-clay-birds",
    slug: "infancy-and-clay-birds",
    title: "Annunciation & Childhood Signs",
    category: ["all", "quranic", "christological"],
    traditions: ["new-testament", "second-temple", "quran"],
    fromLabel: "Luke 1–2 / Matthew 2 (Virginal Annunciation)",
    bridgeLabel: "Protoevangelium & Infancy Thomas (Clay birds)",
    toLabel: "Qur'an 3 & 19 (Palm tree nativity & birds miracle)",
    flowDescription: "Canonical Gospel annunciation narratives converge with early Christian non-canonical infancy tales (breathing life into clay birds) in Surahs 3 and 19.",
  },
  {
    id: "the-golden-calf-and-samiri",
    slug: "the-golden-calf-and-samiri",
    title: "The Golden Calf & Al-Samiri",
    category: ["all", "quranic", "prophetic-law"],
    traditions: ["tanakh", "quran"],
    fromLabel: "Exodus 32 (Aaron casts molten calf under pressure)",
    bridgeLabel: "Pirkei De-Rabbi Eliezer (Samael inside calf)",
    toLabel: "Qur'an 20:83–98 (Al-Samiri crafts lowing calf; Aaron blameless)",
    flowDescription: "Exodus presents Aaron succumbing to the mob; Islamic theology safeguards Aaron's prophetic impeccability by assigning the apostasy to Al-Samiri.",
  },
  {
    id: "jude-enoch-quotation",
    slug: "jude-enoch-quotation",
    title: "The Prophecy Jude Quoted",
    category: ["all", "enochic"],
    traditions: ["second-temple", "new-testament"],
    fromLabel: "1 Enoch 1:9 (Behold, he comes with ten thousands)",
    bridgeLabel: "Aramaic 4QEn & Greek Codex Panopolitanus",
    toLabel: "Jude 14–15 (Enoch, seventh from Adam, prophesied)",
    flowDescription: "Direct verbatim quotation of pseudepigraphal 1 Enoch inside the canonical New Testament text of the Epistle of Jude.",
  },
];

export default function ParallelsTopologyMap({
  activeFilter,
  onFilterChange,
  highlightedMatrixId,
  onSelectMatrix,
}: {
  activeFilter: FilterCategory;
  onFilterChange: (cat: FilterCategory) => void;
  highlightedMatrixId?: string | null;
  onSelectMatrix?: (slug: string) => void;
}) {
  const visibleBridges = useMemo(() => {
    if (activeFilter === "all") return BRIDGES;
    return BRIDGES.filter((b) => b.category.includes(activeFilter));
  }, [activeFilter]);

  return (
    <section
      className="mb-16 rounded-3xl bg-neutral-950 border border-neutral-800/90 p-6 sm:p-8 shadow-2xl overflow-hidden"
      aria-label="Comparative Abrahamic tradition flow and network topology"
    >
      {/* Top Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono bg-neutral-900 border border-neutral-700 text-amber-300 mb-2">
            <span>MULTI-TRADITION TOPOLOGY</span>
            <span>·</span>
            <span>Transmission Web</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-white">
            Comparative Lineage &amp; Literary Flow
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
            Explore how key theological themes, narratives, and prophetic motifs traveled across ancient Near Eastern, Second Temple, Christian, and Islamic textual witnesses.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {FILTER_BUTTONS.map((btn) => {
            const isActive = activeFilter === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => onFilterChange(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-2 border ${
                  isActive
                    ? "bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm"
                    : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                }`}
              >
                <span>{btn.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-amber-400 text-neutral-950 font-bold" : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {btn.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Pillars Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 pb-8">
        {TRADITIONS.map((trad) => (
          <div
            key={trad.id}
            className="p-4 rounded-xl border flex flex-col justify-between transition"
            style={{
              borderColor: trad.borderColor,
              backgroundColor: trad.bg,
            }}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-mono font-bold tracking-wide" style={{ color: trad.color }}>
                  {trad.short}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">{trad.era}</span>
              </div>
              <h3 className="text-sm font-serif font-medium text-white mb-2">{trad.name}</h3>
              <p className="text-[11px] text-neutral-300 leading-snug">{trad.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Transmission Bridges Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-500 uppercase tracking-wider pb-1">
          <span>Active Textual &amp; Doctrinal Bridges ({visibleBridges.length})</span>
          <span>Click bridge to view slot-diff matrix</span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {visibleBridges.map((bridge) => {
            const isHighlighted = highlightedMatrixId === bridge.slug;
            return (
              <div
                key={bridge.id}
                onClick={() => onSelectMatrix?.(bridge.slug)}
                className={`p-4 sm:p-5 rounded-2xl border transition cursor-pointer ${
                  isHighlighted
                    ? "bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500"
                    : "bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/70"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <h4 className="text-base font-serif font-medium text-white">{bridge.title}</h4>
                  </div>
                  <span className="text-xs font-mono text-amber-300 hover:underline inline-flex items-center gap-1">
                    Open Matrix View →
                  </span>
                </div>

                {/* 3-Step Flow Diagram */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-black/50 border border-neutral-800/60 mb-3">
                  <div className="flex flex-col text-xs">
                    <span className="text-[10px] font-mono text-blue-400 mb-0.5">Origin / Primary Anchor</span>
                    <span className="text-neutral-200 font-medium">{bridge.fromLabel}</span>
                  </div>

                  <div className="flex flex-col text-xs md:border-l md:border-neutral-800/80 md:pl-3">
                    <span className="text-[10px] font-mono text-purple-400 mb-0.5">Transmission / Exegetical Bridge</span>
                    <span className="text-neutral-200 font-medium">{bridge.bridgeLabel}</span>
                  </div>

                  <div className="flex flex-col text-xs md:border-l md:border-neutral-800/80 md:pl-3">
                    <span className="text-[10px] font-mono text-emerald-400 mb-0.5">Comparative Reception</span>
                    <span className="text-neutral-200 font-medium">{bridge.toLabel}</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">{bridge.flowDescription}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
