import type { Canons } from "@/lib/scriptures/types";
import { parseScriptureQueryRef } from "@/lib/scriptures/refs";
import {
  getCatenaEntriesForVerse,
  getCatenaEntriesForBook,
  searchCatena,
  type CatenaEntry,
} from "@/lib/scriptures/catena";
import { HEXAPLA_PRESETS, type HexaplaPreset } from "@/lib/scriptures/polyglot";

export type DossierTargetType = "passage" | "topic" | "preset";

export type NotebookLMDossier = {
  title: string;
  targetType: DossierTargetType;
  markdown: string;
  audioHostPrompt: string;
  sourceWitnessCount: number;
  wordCount: number;
  catenaEntries: CatenaEntry[];
  preset?: HexaplaPreset;
};

export type DossierPreset = {
  id: string;
  title: string;
  category: "textual-criticism" | "patristic-theology" | "pericope";
  query: string;
  description: string;
};

export const DOSSIER_PRESETS: DossierPreset[] = [
  {
    id: "isaiah-53",
    title: "Isaiah 53: The Suffering Servant & The Great Isaiah Scroll",
    category: "textual-criticism",
    query: "Isaiah 53",
    description:
      "Comparison notes on the Masoretic text, the Old Greek tradition, and 1QIsa alongside 1 Clement's reception of the passage.",
  },
  {
    id: "psalm-22",
    title: "Psalm 22: The Pierced Sufferer & Ancient Collation",
    category: "textual-criticism",
    query: "Psalm 22",
    description:
      "The disputed 'like a lion' and verbal readings across the Masoretic text, Greek tradition, and 5/6ḤevPs, with early Christian reception notes.",
  },
  {
    id: "genesis-1",
    title: "Genesis 1: Primordial Creation & The Ruach Elohim",
    category: "pericope",
    query: "Genesis 1",
    description:
      "Genesis 1 in a named Hebrew edition and public-domain English translations, with selected early Christian reception notes.",
  },
  {
    id: "john-1",
    title: "John 1: The Incarnation of the Eternal Logos",
    category: "pericope",
    query: "John 1",
    description:
      "The prologue of John in the hosted SBLGNT and English translations, with selected reception notes from Ignatius.",
  },
  {
    id: "romans-3",
    title: "Romans 3: Righteousness, Justification, and Atonement",
    category: "pericope",
    query: "Romans 3",
    description:
      "Paul's thesis of justification through faith in Jesus Christ collated with Clement of Rome on righteousness without works of pride.",
  },
  {
    id: "deut-32",
    title: "Deuteronomy 32: Sons of God vs Sons of Israel",
    category: "textual-criticism",
    query: "Deuteronomy 32",
    description:
      "The verse 8 reading problem: 4Q37 and Greek 'sons/angels of God' traditions beside the Masoretic 'sons of Israel.'",
  },
  {
    id: "exodus-3",
    title: "Exodus 3: The Burning Bush & The Ineffable Name",
    category: "pericope",
    query: "Exodus 3",
    description:
      "Ehyeh Asher Ehyeh beside the Old Greek ego eimi ho ōn and selected later reception questions.",
  },
  {
    id: "matthew-6",
    title: "Matthew 6: The Lord's Prayer & Epiousios",
    category: "pericope",
    query: "Matthew 6",
    description:
      "The Lord's Prayer text collated with the Didache §8 liturgical recitation and Jerome's supersubstantialem rendering.",
  },
  {
    id: "topic-eucharist",
    title: "The Eucharist in the Apostolic Fathers",
    category: "patristic-theology",
    query: "Eucharist",
    description:
      "Source-attributed early Christian excerpts from Didache §9, §10, and Ignatius of Antioch on communion and the flesh of Christ.",
  },
  {
    id: "topic-atonement",
    title: "Sacrificial Atonement & Blood in Early Christian Thought",
    category: "patristic-theology",
    query: "Atonement",
    description:
      "How Clement of Rome, Ignatius, and Barnabas synthesized Isaiah 53, the Passover lamb, and Christ's self-offering.",
  },
];

export function buildNotebookLMDossier(args: {
  target: string;
  canons?: Canons;
  primaryVerses?: {
    ref: string;
    original?: string;
    brenton?: string;
    drb?: string;
    kjv?: string;
    web?: string;
  }[];
  theologicalContext?: string;
}): NotebookLMDossier {
  const { target, canons, primaryVerses = [], theologicalContext } = args;
  const lines: string[] = [];

  const cleanTarget = target.trim();
  const parsedRef = canons ? parseScriptureQueryRef(cleanTarget, canons) : null;
  const normalizedTarget = cleanTarget.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  // Check if target matches one of the Hexapla landmark presets
  const presetMatch = cleanTarget && !parsedRef
    ? HEXAPLA_PRESETS.find(
        (p) => {
          const normalizedId = p.id.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
          const normalizedTitle = p.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
          const normalizedReference = `${p.bookName} ${p.chapter}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
          return (
            normalizedTarget === normalizedId ||
            normalizedTarget === normalizedTitle ||
            normalizedTarget === normalizedReference
          );
        },
      )
    : undefined;

  const title = presetMatch
    ? presetMatch.title
    : parsedRef
      ? `${canons?.books[parsedRef.book]?.name || parsedRef.book} ${parsedRef.chapter}${
          parsedRef.verse ? `:${parsedRef.verse}` : ""
        }`
      : cleanTarget;

  const targetType: DossierTargetType = presetMatch
    ? "preset"
    : parsedRef
      ? "passage"
      : "topic";

  lines.push(`# Grounded Research Dossier: ${title}`);
  lines.push("");
  lines.push(`> **Corpus Provenance**: Garo Vartabedian Classical Scholarship Platform.`);
  lines.push(
    `> **Source Boundary**: Hosted Scripture comes from the named editions below. Curated comparison and reception notes identify their sources and should be checked against a critical edition before quotation or publication.`,
  );
  lines.push(`> **Designed for**: Google NotebookLM source ingestion and dialectical Audio Overview generation.`);
  lines.push("");

  // Executive Research Summary
  lines.push(`## 1. Executive Research Summary`);
  if (presetMatch) {
    lines.push(presetMatch.summary);
    lines.push("");
    lines.push(`### Theological & Historical Significance`);
    lines.push(presetMatch.theologicalSignificance);
  } else if (theologicalContext) {
    lines.push(theologicalContext);
  } else if (parsedRef) {
    lines.push(
      `This dossier collates hosted scriptural editions and early Christian reception notes for **${title}**. It may include original-language surface text from OSHB or SBLGNT, Brenton's English translation of the Septuagint, the hosted Douay-Rheims Challoner text, the 1769 King James text, and the World English Bible.`,
    );
  } else {
    lines.push(
      `This dossier gathers selected hosted scriptural passages and source-attributed early Christian reception entries associated with **${title}**. The selection is a research starting point rather than a complete history of the concept.`,
    );
  }
  lines.push("");

  // Textual Divergence Section if preset exists
  if (presetMatch) {
    lines.push(`## 2. Critical Textual Divergence Apparatus`);
    lines.push(`**Key Divergence Verse**: Verse ${presetMatch.textualDivergence.verse}`);
    lines.push(`**Hebrew / Greek Source**: \`${presetMatch.textualDivergence.hebrewOrGreekRef}\``);
    lines.push("");
    for (const diff of presetMatch.textualDivergence.readingDifferences) {
      lines.push(`- **${diff.witness}** — reading or source note: ${diff.reading} — ${diff.explanation}`);
    }
    lines.push("");
  }

  // Primary Multilingual Verses
  if (primaryVerses.length > 0) {
    lines.push(`## 3. Multi-Witness Scriptural Text`);
    lines.push("");
    for (const pv of primaryVerses) {
      lines.push(`### ${pv.ref}`);
      if (pv.original?.trim()) lines.push(`- **Original-language surface text (OSHB Hebrew/Aramaic or SBLGNT Greek)**: \`${pv.original}\``);
      if (pv.brenton?.trim()) lines.push(`- **Brenton Septuagint, English translation (1851)**: ${pv.brenton}`);
      if (pv.drb?.trim()) lines.push(`- **Douay-Rheims (Challoner revision; hosted 1899 edition)**: ${pv.drb}`);
      if (pv.kjv?.trim()) lines.push(`- **King James Version (1769 text)**: ${pv.kjv}`);
      if (pv.web?.trim()) lines.push(`- **World English Bible (2020)**: ${pv.web}`);
      lines.push("");
    }
  }

  // Catena Aurea Patristic Reception Section
  let catenaEntries: CatenaEntry[] = [];
  if (parsedRef) {
    catenaEntries = parsedRef.verse
      ? getCatenaEntriesForVerse(`${parsedRef.book}.${parsedRef.chapter}.${parsedRef.verse}`)
      : getCatenaEntriesForBook(parsedRef.book).filter((e) => e.chapter === parsedRef.chapter);
  }

  if (catenaEntries.length === 0 && cleanTarget) {
    catenaEntries = searchCatena(cleanTarget);
  }

  if (catenaEntries.length > 0) {
    lines.push(`## 4. Source-Attributed Early Christian Reception`);
    lines.push(
      `Hosted reception entries associated with this text or search term:`,
    );
    lines.push("");
    for (const ce of catenaEntries) {
      lines.push(`### ${ce.father} (${ce.date}) — *${ce.workTitle} §${ce.section}*`);
      lines.push(`**Linked Scripture**: ${ce.scriptureDisplay} · **Theme**: ${ce.theologicalTheme}`);
      lines.push(`**Father's Role**: ${ce.fatherRole}`);
      lines.push("");
      lines.push(`> "${ce.excerpt}"`);
      lines.push("");
      lines.push(`*Historical Analysis*: ${ce.commentaryNote}`);
      lines.push("");
    }
  }

  // Dialectical Inquiry Prompts for NotebookLM Audio Overviews
  lines.push(`## 5. Dialectical Inquiry Prompts for NotebookLM Synthesis`);
  lines.push(
    `When generating an Audio Overview or deep-dive briefing document in NotebookLM, prompt the model to examine:`,
  );
  if (targetType === "topic") {
    lines.push(
      `1. **Text and Vocabulary**: Which words and passages in the supplied sources are associated with ${title}, and what does their immediate context support?`,
    );
    lines.push(
      `2. **Reception and Practice**: How do the supplied early Christian entries discuss or apply ${title}, and how representative is this small selection?`,
    );
    lines.push(
      `3. **Genre and Setting**: What pastoral or polemical setting does each cited work disclose, and which historical claims remain outside the supplied evidence?`,
    );
  } else {
    lines.push(
      `1. **Textual Comparison**: Which differences among the supplied editions are textual, and which may reflect translation or editorial presentation in ${title}?`,
    );
    lines.push(
      `2. **Translation**: How do the named English translations render key Hebrew or Greek phrases, and where does the supplied material leave uncertainty?`,
    );
    lines.push(
      `3. **Reception**: How do the selected early Christian entries use this text, and what can their dates and genres establish?`,
    );
  }
  lines.push("");
  lines.push(`---`);
  lines.push(
    `*Source note: Hosted text is reproduced from the named editions. Curated summaries and comparison notes are editorial aids; verify them against the cited sources before reuse.*`,
  );

  const fullMarkdown = lines.join("\n");
  const words = fullMarkdown.trim().split(/\s+/).length;

  const audioHostPrompt =
    targetType === "topic"
      ? `Historical theology discussion exploring "${title}" in early Christian sources. Host 1 analyzes the hosted scriptural texts and their language. Host 2 examines the cited reception entries. Distinguish source text from editorial notes, state uncertainty, and avoid claims the dossier does not support.`
      : `Historical and textual discussion focusing on ${title}. Host 1 compares the named scriptural editions. Host 2 examines the cited reception entries. Distinguish translations from original-language text, state uncertainty, and avoid claims the dossier does not support.`;

  const primarySourceEntryCount = primaryVerses.reduce(
    (count, verse) =>
      count +
      [verse.original, verse.brenton, verse.drb, verse.kjv, verse.web].filter(
        (value) => typeof value === "string" && value.trim().length > 0,
      ).length,
    0,
  );

  return {
    title,
    targetType,
    markdown: fullMarkdown,
    audioHostPrompt,
    sourceWitnessCount:
      primarySourceEntryCount +
      catenaEntries.length +
      (presetMatch?.textualDivergence.readingDifferences.length ?? 0),
    wordCount: words,
    catenaEntries,
    preset: presetMatch,
  };
}
