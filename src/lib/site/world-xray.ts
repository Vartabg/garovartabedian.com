import type { TwelveData, SentData } from "@/lib/apostles/types";
import type { TimelineData } from "@/lib/early/types";
import type { LibraryRecord } from "@/lib/early/library";
import type { Claim } from "@/lib/evidence/claims";
import type { EvidenceData } from "@/lib/evidence/types";
import type { LifeLensesIndex } from "@/lib/jesus/life-lenses";
import type { XrayTagSpec } from "@/lib/scriptures/xray-types";
import type { WordData } from "@/lib/word/types";
import { RESEARCH_TOOLS } from "@/lib/discovery-content";
import { SHELF_STORIES } from "@/lib/story-shelf";
import type { CorpusHealth } from "./corpus-health";
import { SITE_XRAY } from "./site-xray";

/**
 * The Engineer lens on a world home: one tag, "Built from", whose facts are
 * counted from the data the home already loads. Nothing here is typed by
 * hand, and every line says only what was counted; the last line comes from
 * the site snapshot.
 */
export type WorldXrayId = "scriptures" | "jesus" | "apostles" | "early" | "church" | "word" | "angels" | "evidence";
export type WorldFacts = { facts: string[]; detail: string[] };

const n = (value: number) => value.toLocaleString("en-US");
const plural = (count: number, one: string, many = `${one}s`) => `${n(count)} ${count === 1 ? one : many}`;

/** The standard line: JSON files under public/<world>, script files under scripts/<world>. */
export function worldSnapshotLine(id: WorldXrayId, worlds: Record<string, { publicJson: number; scripts: number }> = SITE_XRAY.worlds ?? {}): string {
  const counts = worlds[id] ?? { publicJson: 0, scripts: 0 };
  const files = counts.publicJson > 0 ? `${plural(counts.publicJson, "JSON file")} published under its public folder` : "no JSON files published under its public folder";
  const scripts = counts.scripts > 0 ? `${plural(counts.scripts, "script file")} under its scripts folder` : "no scripts folder of its own";
  return `${files}; ${scripts}.`;
}

export function worldXrayTag(id: WorldXrayId, built: WorldFacts): XrayTagSpec {
  return { id: "world", label: "Built from", facts: built.facts, detail: [...built.detail, worldSnapshotLine(id)] };
}

export function homeXrayTag(
  counts = {
    worlds: Object.keys(SITE_XRAY.worlds).length,
    stories: SHELF_STORIES.length,
    tools: RESEARCH_TOOLS.length,
    publicJson: SITE_XRAY.counts.publicJson,
  },
): XrayTagSpec {
  return {
    id: "world",
    label: "Built from",
    facts: [
      plural(counts.worlds, "world"),
      plural(counts.stories, "illustrated story", "illustrated stories"),
      plural(counts.tools, "research tool"),
      plural(counts.publicJson, "JSON file"),
    ],
    detail: ["Counted from the shelf, tool registry, and site snapshot."],
  };
}

export function scripturesFacts(health: CorpusHealth): WorldFacts {
  const c = health.corpus;
  return {
    facts: [
      plural(c.books.hostedIds, "hosted book"),
      plural(c.traditions.count, "tradition"),
      plural(c.translations.count, "translation"),
      plural(c.books.unionChapterSlots, "chapter slot"),
      `${plural(c.crossReferences.targets, "cross-reference target")} from ${plural(c.crossReferences.sourceVerses, "verse")}`,
      plural(c.topics.count, "topic"),
    ],
    detail: [
      `Chapter guides: ${n(c.guides.review.agentReviewed)} agent-reviewed, ${n(c.guides.review.humanReviewed)} human-reviewed, ${n(c.guides.review.untracked)} untracked; ${n(c.guides.batchTemplateGuides)} still on the batch template.`,
      "Editions and licenses are listed on the Sources page.",
    ],
  };
}

export function jesusFacts(lenses: Pick<LifeLensesIndex, "moments" | "places" | "eras">): WorldFacts {
  return {
    facts: [`${plural(lenses.moments.length, "moment")} on the life map`, plural(lenses.places.length, "place"), plural(lenses.eras.length, "era")],
    detail: ["Each moment names its Gospel passages; the map places are drawn in one fixed frame."],
  };
}

export function apostlesFacts(twelve: Pick<TwelveData, "apostles" | "lists">, sent: Pick<SentData, "rays" | "cities" | "routes" | "unplaced">): WorldFacts {
  const later = twelve.apostles.length - 12;
  return {
    facts: [
      later > 0 ? `${plural(twelve.apostles.length, "record")}: the Twelve and ${n(later)} chosen later` : plural(twelve.apostles.length, "record"),
      plural(twelve.lists.length, "New Testament list"),
      `${plural(sent.rays.length, "sending")} placed on the map, ${n(sent.unplaced.length)} unplaced`,
      plural(sent.cities.length, "city", "cities"),
      plural(sent.routes.length, "route"),
    ],
    detail: ["Every record carries its own evidence grade next to the claim it grades."],
  };
}

export function earlyFacts(shelfTexts: number, timeline: Pick<TimelineData, "items">, library: Pick<LibraryRecord, "workId" | "sourceWords" | "sourceSha256">[]): WorldFacts {
  const works = new Set(library.map((record) => record.workId)).size;
  const words = library.reduce((sum, record) => sum + (record.sourceWords || 0), 0);
  const withChecksum = library.filter((record) => record.sourceSha256).length;
  return {
    facts: [
      plural(shelfTexts, "shelf text"),
      `${plural(timeline.items.length, "dated item")} on the timeline`,
      `${plural(library.length, "library edition")} of ${plural(works, "work")}`,
      `${n(words)} source words`,
      `${n(withChecksum)} editions carry a source checksum, ${n(library.length - withChecksum)} do not`,
    ],
    detail: ["Timeline bars are scholarly date ranges, not certainties; library editions keep their edition notes and coverage limits."],
  };
}

export function churchFacts(
  road: { eras: { steps: unknown[] }[] },
  forks: number[],
  links: { method: string; steps: { refs: unknown[]; textIds: unknown[] }[] },
): WorldFacts {
  const scripture = links.steps.filter((step) => step.refs.length > 0).length;
  const writings = links.steps.filter((step) => step.textIds.length > 0).length;
  return {
    facts: [
      plural(road.eras.length, "era"),
      `${plural(road.eras.reduce((sum, era) => sum + era.steps.length, 0), "step")} on the road`,
      `${plural(forks.length, "fork")} from the tree`,
      `checked links on ${plural(links.steps.length, "step")}: Scripture on ${n(scripture)}, hosted writings on ${n(writings)}`,
    ],
    detail: [links.method.endsWith(".") ? links.method : `${links.method}.`],
  };
}

export function wordFacts(data: Pick<WordData, "fenced" | "free" | "hosted" | "ledger">): WorldFacts {
  const statuses = new Map<string, number>();
  for (const entry of data.ledger.entries) statuses.set(entry.status, (statuses.get(entry.status) ?? 0) + 1);
  const byStatus = [...statuses.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([status, count]) => `${n(count)} ${status}`).join(", ");
  return {
    facts: [
      `${plural(data.ledger.entries.length, "translation")} in the ledger, ${byStatus}`,
      `${n(data.fenced.length)} fenced, ${n(data.free.length)} free`,
      plural(data.ledger.sources.length, "source"),
      `${n(data.hosted.count)} hosted on this site`,
    ],
    detail: ["A placeholder entry has a name and a status but no researched terms yet."],
  };
}

export function angelsFacts(stats: { fallFragments: number; appearances: number; confrontations: number; namedDemons: number; vocabularyTerms: number; vocabularyOccurrences: number }): WorldFacts {
  return {
    facts: [
      plural(stats.fallFragments, "fall fragment"),
      plural(stats.appearances, "appearance"),
      plural(stats.confrontations, "confrontation"),
      // The page itself says "source entries" for the named ones, never "demons" by count.
      `${plural(stats.namedDemons, "named source entry", "named source entries")}`,
      `${plural(stats.vocabularyTerms, "vocabulary term")} in ${plural(stats.vocabularyOccurrences, "occurrence")}`,
    ],
    detail: ["Vocabulary is counted by machine from the tagged Hebrew and Greek; encounters and names are read from the text by hand."],
  };
}

export function evidenceFacts(data: Pick<EvidenceData, "rooms" | "claimLab" | "sources">, claims: Pick<Claim, "basis">[], generatedBy?: string): WorldFacts {
  // Each axis has its own grade vocabulary, so grades are listed under their axis.
  const axes = new Map<string, Map<string, number>>();
  for (const claim of claims) {
    const grades = axes.get(claim.basis.axis) ?? new Map<string, number>();
    grades.set(claim.basis.grade, (grades.get(claim.basis.grade) ?? 0) + 1);
    axes.set(claim.basis.axis, grades);
  }
  const byAxis = [...axes.entries()]
    .sort(([, a], [, b]) => sum(b) - sum(a))
    .map(([axis, grades]) => `${axis} ${n(sum(grades))} (${[...grades.entries()].sort(([, a], [, b]) => b - a).map(([grade, count]) => `${grade} ${n(count)}`).join(", ")})`);
  return {
    facts: [
      `${plural(claims.length, "claim")} in the registry`,
      ...byAxis,
      plural(data.rooms.length, "room"),
      plural(data.claimLab.length, "claim-lab case"),
      plural(data.sources.length, "source"),
    ],
    detail: generatedBy ? [`The registry is generated by ${generatedBy.split("/").pop()}.`] : [],
  };
}

const sum = (grades: Map<string, number>) => [...grades.values()].reduce((total, count) => total + count, 0);
