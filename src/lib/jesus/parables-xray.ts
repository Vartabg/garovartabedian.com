import type { XrayTagSpec } from "@/lib/scriptures/xray-types";
import type { Parable, ScriptureFigure, ThomasParable } from "./types";

/**
 * The Engineer lens on /jesus/parables: three tags, each counted from the
 * data the page already loads. Nothing here is typed by hand.
 */
export type ParablesXrayInput = {
  parables: Parable[];
  synoptic: ScriptureFigure[];
  john: ScriptureFigure[];
  thomas: ThomasParable[];
  /** Passage id to its checked paragraphs, or null when the check withheld it. */
  checked: Record<string, string[] | null>;
  /** Writings the checked passages come from. */
  writings: number;
  counts: Record<string, { parabole: number; paroimia: number }>;
  scanned: { words: number; chapters: number };
};

export type ParablesXrayTags = { built: XrayTagSpec; checked: XrayTagSpec; counted: XrayTagSpec };

const n = (value: number) => value.toLocaleString("en-US");
const plural = (count: number, one: string, many = `${one}s`) => `${n(count)} ${count === 1 ? one : many}`;

/** Distinct Gospel of Thomas sayings any entry on the page links to. */
export function linkedThomasSayings(input: Pick<ParablesXrayInput, "parables" | "synoptic" | "john" | "thomas">, more: { thomas?: { saying: number }[] }[] = []): number {
  const sayings = new Set<number>(input.thomas.map((story) => story.saying));
  for (const entry of [...input.parables, ...input.synoptic, ...input.john, ...more]) {
    for (const link of entry.thomas ?? []) sayings.add(link.saying);
  }
  return sayings.size;
}

export function parablesXrayTags(input: ParablesXrayInput, thomasSayings: number): ParablesXrayTags {
  const stories = input.parables.filter((p) => p.kind === "story").length;
  const sayings = input.parables.filter((p) => p.kind === "saying").length;
  const gospel = [...input.parables, ...input.synoptic, ...input.john];
  const accounts = gospel.reduce((sum, entry) => sum + (entry.accounts?.length ?? 0), 0);
  const multi = gospel.filter((entry) => (entry.accounts?.length ?? 0) > 1).length;
  const results = Object.values(input.checked);
  const shown = results.filter((value) => value !== null).length;
  const withheld = results.length - shown;
  const c = (book: string) => input.counts[book] ?? { parabole: 0, paroimia: 0 };

  return {
    built: {
      id: "parables",
      label: "Built from",
      facts: [
        `${n(input.parables.length)} Gospel parables: ${plural(stories, "story", "stories")}, ${plural(sayings, "saying")} the text calls parables`,
        `${n(input.synoptic.length)} more from Matthew, Mark and Luke`,
        `${plural(input.john.length, "figure")} in John`,
        `${plural(accounts, "Gospel account")}, ${n(multi)} entries told in more than one Gospel`,
        `${plural(input.thomas.length + results.length, "passage")} from early writings outside the canon`,
      ],
      detail: [
        "The list is sent with the page. Each Gospel passage's verses load from the hosted text when it is opened.",
        `Entries link ${plural(thomasSayings, "Gospel of Thomas saying")}. The build fails if the packaged page is missing any of them.`,
      ],
    },
    checked: {
      id: "checksums",
      label: "Checked",
      facts: [
        `${plural(results.length, "passage")} from ${plural(input.writings, "writing")} matched against a SHA-256 fingerprint of their source paragraphs`,
        `${n(shown)} shown, ${n(withheld)} withheld`,
      ],
      detail: [
        "Each passage stores a fingerprint of the paragraphs it quotes. The server recomputes it from the hosted edition when the page is built.",
        "A passage whose text no longer matches, or whose source is missing, is withheld rather than shown.",
      ],
    },
    counted: {
      id: "counts",
      label: "Counted",
      facts: [
        `parabolē: Matthew ${n(c("MAT").parabole)}, Mark ${n(c("MRK").parabole)}, Luke ${n(c("LUK").parabole)}, John ${n(c("JHN").parabole)}`,
        `paroimia in John: ${n(c("JHN").paroimia)}`,
        `from ${plural(input.scanned.words, "Greek word")} in ${plural(input.scanned.chapters, "chapter")}`,
      ],
      detail: [
        "Counted when the page is built, from the dictionary form tagged on every word of the four Gospels in the hosted SBL Greek New Testament.",
      ],
    },
  };
}
