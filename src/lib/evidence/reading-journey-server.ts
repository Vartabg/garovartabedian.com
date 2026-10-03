import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadIsaiahClementInvestigation } from "./investigation-server";
import { sha256 } from "./verify-investigation";
import { resolveEarlyChapter } from "../early/citations";
import type { EarlyText } from "../early/types";
import type { BookText } from "../scriptures/types";
import type { ReadingJourney } from "./reading-journey";

export async function loadReadingJourney(): Promise<ReadingJourney> {
  const packet = await loadIsaiahClementInvestigation();
  const bytes = await Promise.all(packet.sources.map(source => readFile(join(process.cwd(), source.artifact))));
  bytes.forEach((value, i) => {
    if (sha256(value) !== packet.sources[i].sha256) throw new Error("Reading source changed after verification.");
  });
  const scripture = (JSON.parse(bytes[0].toString()) as BookText).chapters[52];
  const early = JSON.parse(bytes[1].toString()) as EarlyText;
  const section = resolveEarlyChapter(early.sections, 16);
  return {
    packet, scripture, early: section.paragraphs,
    anchor: { kind: "scripture", translation: "web", book: "ISA", chapter: 53, verse: 5 },
    candidate: { kind: "early", id: "1clement", section: early.sections.indexOf(section), paragraph: 0 },
  };
}
