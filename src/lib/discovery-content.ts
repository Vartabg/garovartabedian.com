import type { WorldId } from "./world-registry";

/** Curated discovery copy. These describe shipped tools, never inferred capabilities. */
export const DISCOVERY = {
  heading: "Follow your curiosity.",
  intro: "Compare a word. Question an argument. Go back to the source.",
  engineeringIntro: "The research is also the demonstration: named editions, explicit connections, and source notes you can inspect.",
  lensLabel: "Choose your lens",
  readerLabel: "Reader",
  engineerLabel: "Engineer",
  lensHint: "Read the record. Inspect the craft.",
  notesLabel: "Behind this page",
  sourceLabel: "Explore the case study",
  compassHeading: "Pull this thread",
  compassNote: "Another way into the question. Each tool opens with its own selection.",
  bridge: "Built by Garo Vartabedian. Explore the research, then inspect the engineering behind it.",
} as const;

export const RESEARCH_TOOLS = [
  {
    id: "polyglot", href: "/scriptures/polyglot", title: "One passage. Five witnesses.",
    label: "Compare the text", mark: "א / Ω", category: "01 · THE POLYGLOT",
    description: "Read a named Hebrew or Greek edition beside four English translations.",
    engineering: "Edition-aware loaders align hosted text, with morphology and passage-specific Psalm numbering.",
    source: "src/lib/scriptures/polyglot.ts",
  },
  {
    id: "catena", href: "/scriptures/catena", title: "Who read it before you?",
    label: "Trace early readers", mark: "↳", category: "02 · THE CATENA",
    description: "Follow selected biblical passages into the writings of the early church.",
    engineering: "A curated reception index separates hosted excerpts, source references, and editorial notes.",
    source: "src/lib/scriptures/catena.ts",
  },
  {
    id: "disputation", href: "/scriptures/disputation", title: "Let the voices disagree.",
    label: "Open a debate", mark: "⇄", category: "03 · THE DISPUTATIONS",
    description: "Set Job beside Proverbs, or Paul beside James. Examine the argument.",
    engineering: "Structured positions connect arguments, passages, and editorial synthesis in exportable debate dossiers.",
    source: "src/lib/scriptures/disputation.ts",
  },
  {
    id: "dossier", href: "/scriptures/dossier", title: "Take the sources with you.",
    label: "Prepare a dossier", mark: "≡", category: "04 · THE RESEARCH DESK",
    description: "Gather a research worksheet with source notes and prompts for NotebookLM.",
    engineering: "A Markdown compiler gathers hosted editions and reception notes into a portable research worksheet.",
    source: "src/lib/site/notebooklm.ts",
  },
  {
    id: "graph", href: "/scriptures/graph", title: "Follow the connections.",
    label: "Explore cross-references", mark: "⋈", category: "THE CROSS-REFERENCES",
    description: "Move between linked passages and follow a thread across books.",
    engineering: "A generated Scripture graph makes cross-reference relationships navigable.",
    source: "scripts/site/build-scripture-graph.mjs",
  },
  {
    id: "word-bridge", href: "/scriptures/word-bridge", title: "What stands behind a word?",
    label: "Word Bridge", mark: "A ↔ Ω", category: "WORD BRIDGE",
    description: "Connect World English Bible words with Hebrew and Greek. Inspect dictionary entries, grammar, and alignment checks.",
    engineering: "Published word alignments retain source attribution, dictionary checks, and links that need review.",
    source: "src/lib/scriptures/word-bridge.ts",
  },
  {
    id: "diachronic", href: "/scriptures/diachronic", title: "Words have a history.",
    label: "Explore word histories", mark: "α → ω", category: "WORD HISTORIES",
    description: "Examine selected terms and their changing use across textual traditions.",
    engineering: "Curated lexical histories keep textual traditions and editorial interpretation visible.",
    source: "src/app/scriptures/diachronic/page.tsx",
  },
] as const;

export type ResearchToolId = (typeof RESEARCH_TOOLS)[number]["id"];

const WORLD_THREADS: Record<WorldId, readonly ResearchToolId[]> = {
  scriptures: ["polyglot", "catena", "dossier"],
  jesus: ["polyglot", "disputation", "catena"],
  apostles: ["catena", "graph", "dossier"],
  early: ["catena", "disputation", "dossier"],
  church: ["catena", "disputation", "diachronic"],
  angels: ["diachronic", "polyglot", "dossier"],
  word: ["polyglot", "dossier", "graph"],
  evidence: ["catena", "polyglot", "dossier"],
};

/** Exact path boundaries prevent false matches such as /catena-notes. */
export function researchToolForPath(pathname: string) {
  return RESEARCH_TOOLS.find((tool) => pathname === tool.href || pathname.startsWith(`${tool.href}/`));
}

export function discoveryThreads(world: WorldId, pathname: string) {
  const current = researchToolForPath(pathname);
  const ids = current
    ? RESEARCH_TOOLS.filter((tool) => tool.id !== current.id).map((tool) => tool.id)
    : WORLD_THREADS[world];
  return ids.slice(0, 3).map((id) => RESEARCH_TOOLS.find((tool) => tool.id === id)!);
}

export function engineeringNote(pathname: string) {
  const tool = researchToolForPath(pathname);
  if (tool) return { title: tool.category, text: tool.engineering, source: tool.source };
  if (/^\/scriptures\/[^/]+\/[^/]+\/\d+\/?$/.test(pathname)) {
    return {
      title: "THE CHAPTER READER",
      text: "Hosted chapter data, original-language resources, and reading controls meet here. Availability depends on the book and edition; source notes identify the text.",
      source: "src/app/scriptures/[tradition]/[book]/[chapter]/page.tsx",
    };
  }
  return {
    title: "THE RESEARCH & THE CRAFT",
    text: "This Next.js site brings hosted texts, curated research, and browser interactions together. The case study explains the architecture and its limits.",
    source: "src/app/work/garovartabedian/page.tsx",
  };
}
