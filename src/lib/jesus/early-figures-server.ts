import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { EARLY_FIGURES, earlyFigureParts, type EarlyFigure } from "./early-figures";
import { EARLY_TEXTS } from "@/lib/early/client";

export type EarlyFigureTexts = Record<string, string[] | null>;

function partIsInvalidExcerpt(figure: EarlyFigure): boolean {
  return !["eusebius-talents", "acts-thomas-hymn", "acts-thomas-bride", "acts-thomas-palace", "acts-thomas-prayer", "acts-thomas-marriage", "acts-thomas-bride-response", "acts-thomas-shepherd", "acts-thomas-crowd", "acts-thomas-bitter-tree", "acts-thomas-yoke", "acts-thomas-seed", "acts-thomas-mygdonia-marriage", "acts-thomas-soldiers", "acts-thomas-tower", "acts-thomas-oil", "acts-thomas-physician-10", "acts-thomas-birds", "acts-thomas-wealth", "acts-thomas-ask", "acts-thomas-physician-95", "acts-thomas-physician-143", "acts-thomas-physician-156", "acts-thomas-wedding-invitation", "acts-thomas-old-new-48", "acts-thomas-lost-sheep", "acts-thomas-old-new-58", "acts-thomas-heat-day", "acts-thomas-flock-wolves", "acts-thomas-wolves-clothing", "acts-thomas-stolen-thoughts"].includes(figure.edition) || figure.legacy === true || figure.section !== "excerpt" || figure.start !== 1 || figure.end !== 1;
}

/** Each literal path is deliberate: the Parables trace must not package unrelated editions. */
const sourceFiles: Record<string, string> = {
  "acts-thomas-wedding-invitation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-wedding-invitation.json"),
  "acts-thomas-old-new-48/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-old-new-48.json"),
  "acts-thomas-lost-sheep/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-lost-sheep.json"),
  "acts-thomas-old-new-58/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-old-new-58.json"),
  "acts-thomas-heat-day/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-heat-day.json"),
  "acts-thomas-flock-wolves/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-flock-wolves.json"),
  "acts-thomas-wolves-clothing/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-wolves-clothing.json"),
  "acts-thomas-stolen-thoughts/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-stolen-thoughts.json"),
  "barnabas/barn-4": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-4.json"),
  "barnabas/barn-5": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-5.json"),
  "barnabas/barn-8": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-8.json"),
  "barnabas/barn-9": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-9.json"),
  "1-clement/1-clem-8": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-8.json"),
  "1-clement/1-clem-12": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-12.json"),
  "didache/did-10": path.join(process.cwd(), "content/early-library/readings/didache/did-10.json"),
  "diognetus/diogn-5": path.join(process.cwd(), "content/early-library/readings/diognetus/diogn-5.json"),
  "acts-thomas-physician-10/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-physician-10.json"),
  "acts-thomas-birds/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-birds.json"),
  "acts-thomas-wealth/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-wealth.json"),
  "acts-thomas-ask/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-ask.json"),
  "acts-thomas-physician-95/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-physician-95.json"),
  "acts-thomas-physician-143/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-physician-143.json"),
  "acts-thomas-physician-156/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-physician-156.json"),
  "barnabas/s5": path.join(process.cwd(), "public/early/texts/barnabas.json"),
  "1-clement/1-clem-34": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-34.json"),
  "1-clement/1-clem-36": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-36.json"),
  "barnabas/barn-6": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-6.json"),
  "barnabas/barn-7": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-7.json"),
  "diognetus/diogn-10": path.join(process.cwd(), "content/early-library/readings/diognetus/diogn-10.json"),

  "didache/s13": path.join(process.cwd(), "public/early/texts/didache.json"),
  "1-clement/s19": path.join(process.cwd(), "public/early/texts/1clement.json"),
  "1-clement/s45": path.join(process.cwd(), "public/early/texts/1clement.json"),
  "1-clement/1-clem-13": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-13.json"),
  "1-clement/1-clem-6": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-6.json"),
  "1-clement/1-clem-7": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-7.json"),
  "1-clement/1-clem-38": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-38.json"),
  "barnabas/barn-12": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-12.json"),
  "diognetus/diogn-9": path.join(process.cwd(), "content/early-library/readings/diognetus/diogn-9.json"),
  "acts-thomas-marriage/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-marriage.json"),
  "acts-thomas-bride-response/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-bride-response.json"),
  "acts-thomas-shepherd/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-shepherd.json"),
  "acts-thomas-crowd/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-crowd.json"),
  "acts-thomas-bitter-tree/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-bitter-tree.json"),
  "acts-thomas-yoke/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-yoke.json"),
  "acts-thomas-seed/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-seed.json"),
  "acts-thomas-mygdonia-marriage/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-mygdonia-marriage.json"),
  "acts-thomas-soldiers/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-soldiers.json"),
  "acts-thomas-tower/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-tower.json"),
  "acts-thomas-oil/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-oil.json"),

  "didache/s16": path.join(process.cwd(), "public/early/texts/didache.json"),
  "barnabas/s9": path.join(process.cwd(), "public/early/texts/barnabas.json"),
  "barnabas/barn-11": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-11.json"),
  "barnabas/barn-16": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-16.json"),
  "1-clement/1-clem-25": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-25.json"),
  "1-clement/1-clem-26": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-26.json"),
  "1-clement/1-clem-48": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-48.json"),
  "diognetus/diogn-7": path.join(process.cwd(), "content/early-library/readings/diognetus/diogn-7.json"),
  "diognetus/diogn-12": path.join(process.cwd(), "content/early-library/readings/diognetus/diogn-12.json"),
  "acts-thomas-bride/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-bride.json"),
  "acts-thomas-palace/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-palace.json"),
  "acts-thomas-prayer/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-prayer.json"),
  "didache/s1": path.join(process.cwd(), "public/early/texts/didache.json"),
  "didache/s2": path.join(process.cwd(), "public/early/texts/didache.json"),
  "didache/s3": path.join(process.cwd(), "public/early/texts/didache.json"),
  "didache/s4": path.join(process.cwd(), "public/early/texts/didache.json"),
  "didache/s5": path.join(process.cwd(), "public/early/texts/didache.json"),
  "didache/s6": path.join(process.cwd(), "public/early/texts/didache.json"),
  "didache/did-9": path.join(process.cwd(), "content/early-library/readings/didache/did-9.json"),
  "barnabas/barn-18": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-18.json"),
  "barnabas/barn-19": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-19.json"),
  "barnabas/barn-20": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-20.json"),
  "1-clement/1-clem-23": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-23.json"),
  "1-clement/1-clem-24": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-24.json"),
  "1-clement/1-clem-37": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-37.json"),
  "diognetus/diogn-6": path.join(process.cwd(), "content/early-library/readings/diognetus/diogn-6.json"),
  "eusebius-talents/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-talents.json"),
  "acts-thomas-hymn/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-hymn.json"),
  "2-clement/2-clem-7": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-7.json"),
  "2-clement/2-clem-8": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-8.json"),
  "2-clement/2-clem-11": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-11.json"),
  "2-clement/2-clem-12": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-12.json"),
  "gospel-philip/spiritual-growth": path.join(process.cwd(), "content/early-library/readings/gospel-philip/spiritual-growth.json"),
  "gospel-philip/life-death-light-and-darkness": path.join(process.cwd(), "content/early-library/readings/gospel-philip/life-death-light-and-darkness.json"),
  "gospel-philip/uprooting-evil": path.join(process.cwd(), "content/early-library/readings/gospel-philip/uprooting-evil.json"),
  "gospel-truth/the-gospel": path.join(process.cwd(), "content/early-library/readings/gospel-truth/the-gospel.json"),
  "gospel-truth/doing-the-father-s-will": path.join(process.cwd(), "content/early-library/readings/gospel-truth/doing-the-father-s-will.json"),
  "shepherd-hermas/parables-which-he-spake-with-me": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parables-which-he-spake-with-me.json"),
  "shepherd-hermas/parable-6": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-6.json"),
  "shepherd-hermas/parable-8": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-8.json"),
  "shepherd-hermas/parable-8-part-2": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-8-part-2.json"),
  "shepherd-hermas/parable-9": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-9.json"),
  "shepherd-hermas/parable-9-part-2": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-9-part-2.json"),
  "shepherd-hermas/parable-9-part-3": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-9-part-3.json"),
  "shepherd-hermas/parable-9-part-4": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-9-part-4.json"),
  "shepherd-hermas/mandate-5": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/mandate-5.json"),
  "shepherd-hermas/mandate-11": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/mandate-11.json"),
  "epistula-apostolorum/chapter-32": path.join(process.cwd(), "public/early/texts/epistula-apostolorum.json"),
  "epistula-apostolorum/chapter-44": path.join(process.cwd(), "public/early/texts/epistula-apostolorum.json"),
  "epistula-apostolorum/chapter-45": path.join(process.cwd(), "public/early/texts/epistula-apostolorum.json"),
  "epistula-apostolorum/chapter-47": path.join(process.cwd(), "public/early/texts/epistula-apostolorum.json"),
  "epistula-apostolorum/chapter-43": path.join(process.cwd(), "public/early/texts/epistula-apostolorum.json"),
  "2-clement/2-clem-5": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-5.json"),
  "gospel-philip/becoming-christians": path.join(process.cwd(), "content/early-library/readings/gospel-philip/becoming-christians.json"),
  "gospel-truth/the-parable-of-the-sheep": path.join(process.cwd(), "content/early-library/readings/gospel-truth/the-parable-of-the-sheep.json"),
  "gospel-truth/the-parable-of-the-jars": path.join(process.cwd(), "content/early-library/readings/gospel-truth/the-parable-of-the-jars.json"),
  "gospel-truth/the-parable-of-the-nightmares": path.join(process.cwd(), "content/early-library/readings/gospel-truth/the-parable-of-the-nightmares.json"),
  "shepherd-hermas/another-parable": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/another-parable.json"),
  "shepherd-hermas/vision-3": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/vision-3.json"),
};

export async function getEarlyFigureTexts(
  figures: EarlyFigure[] = EARLY_FIGURES,
  load: (file: string) => Promise<string> = file => readFile(file, "utf8"),
  report: (message: string) => void = console.error,
): Promise<EarlyFigureTexts> {
  const result: EarlyFigureTexts = Object.fromEntries(figures.map(figure => [figure.id, null]));
  try {
    const catalog = JSON.parse(await load(path.join(process.cwd(), "content/early-library/catalog.json")));
    if (!Array.isArray(catalog)) throw new Error("invalid catalog");
    for (const figure of figures) {
      try {
        const parts = earlyFigureParts(figure);
        if (!parts.length || parts[0].section !== figure.section || parts[0].start !== figure.start || parts[0].end !== figure.end || parts[0].joinPrevious || !/^[a-f0-9]{64}$/.test(figure.sha256)) throw new Error("invalid mapping");
        const records = catalog.filter(record => record?.id === figure.edition);
        if (!figure.excerpt && (records.length !== 1 || records[0].publicationStatus !== "published")) throw new Error("edition unavailable");
        if (figure.excerpt && (parts.length !== 1 || partIsInvalidExcerpt(figure))) throw new Error("invalid excerpt");
        const paragraphs: string[] = [];
        for (const part of parts) {
          const file = sourceFiles[`${figure.edition}/${part.section}`];
          if (!file || !Number.isSafeInteger(part.start) || part.start < 1 || !Number.isSafeInteger(part.end) || part.end < part.start) throw new Error("invalid part");
          const page = JSON.parse(await load(file));
          let blocks: string[];
          if (figure.excerpt) {
            if (page.id !== figure.edition || part.section !== "excerpt" || !Array.isArray(page.blocks) || page.blocks.length !== 1 || page.blocks.some((block: {kind?: unknown; text?: unknown}) => block.kind !== "primary-text" || typeof block.text !== "string" || !block.text.trim())) throw new Error("invalid excerpt source");
            blocks = page.blocks.slice(part.start - 1, part.end).map((block: {text: string}) => block.text);
          } else if (figure.legacy && figure.edition === "1-clement" && figure.legacyText === "1clement" && /^(?:s19|s45)$/.test(part.section)) {
            const index = Number(part.section.slice(1));
            const heading = index === 19 ? "Chapter XX." : "Chapter XLVI.";
            if (page.id !== "1clement" || !Array.isArray(page.sections) || !page.sections[index]?.heading?.startsWith(heading) || !Array.isArray(page.sections[index]?.paragraphs) || page.sections[index].paragraphs.some((text: unknown) => typeof text !== "string" || !text.trim())) throw new Error("invalid 1 Clement source");
            blocks = page.sections[index].paragraphs.slice(part.start - 1, part.end);
          } else if (figure.legacy && figure.edition === "barnabas" && /^(?:s5|s9)$/.test(part.section)) {
            const index = Number(part.section.slice(1));
            const heading = index === 5 ? "Chapter VI." : "Chapter X.";
            if (page.id !== "barnabas" || !Array.isArray(page.sections) || !page.sections[index]?.heading?.startsWith(heading) || !Array.isArray(page.sections[index]?.paragraphs) || page.sections[index].paragraphs.some((text: unknown) => typeof text !== "string" || !text.trim())) throw new Error("invalid Barnabas source");
            blocks = page.sections[index].paragraphs.slice(part.start - 1, part.end);
          } else if (figure.legacy && figure.edition === "didache") {
            const index = /^(?:s[1-6]|s13|s16)$/.test(part.section) ? Number(part.section.slice(1)) : -1;
            const headings = ["", "Chapter I.", "Chapter II.", "Chapter III.", "Chapter IV.", "Chapter V.", "Chapter VI.", ...Array(6).fill(""), "Chapter XIII.", ...Array(2).fill(""), "Chapter XVI."];
            if (page.id !== "didache" || !Array.isArray(page.sections) || index < 1 || typeof page.sections[index]?.heading !== "string" || !page.sections[index].heading.startsWith(headings[index]) || !Array.isArray(page.sections[index]?.paragraphs) || page.sections[index].paragraphs.some((text: unknown) => typeof text !== "string" || !text.trim())) throw new Error("invalid Didache source");
            blocks = page.sections[index].paragraphs.slice(part.start - 1, part.end);
          } else if (figure.legacy) {
            if (figure.edition !== "epistula-apostolorum" || !/^chapter-(32|43|44|45|47)$/.test(part.section) || records[0].reuseExistingText !== true || !EARLY_TEXTS.some(text => text.id === figure.edition) || page.id !== figure.edition || !Array.isArray(page.sections)) throw new Error("invalid legacy edition");
            const heading = `Chapter ${part.section.slice(8)}`;
            const chapters = page.sections.filter((section: { heading?: unknown }) => section.heading === heading);
            if (chapters.length !== 1 || !Array.isArray(chapters[0].paragraphs) || chapters[0].paragraphs.some((text: unknown) => typeof text !== "string" || !text.trim())) throw new Error("invalid chapter");
            blocks = chapters[0].paragraphs.slice(part.start - 1, part.end);
          } else {
            const matches = Array.isArray(records[0].sections) ? records[0].sections.filter((section: { id?: unknown }) => section.id === part.section) : [];
            if (matches.length !== 1 || matches[0].kind !== "primary-text" || page.id !== part.section || page.kind !== "primary-text" || !Array.isArray(page.blocks) || page.chars !== matches[0].chars ||
                page.blocks.some((block: { kind?: unknown; text?: unknown }) => block.kind !== "primary-text" || typeof block.text !== "string" || !block.text.trim()) ||
                page.chars !== page.blocks.reduce((sum: number, block: { text: string }) => sum + block.text.length, 0)) throw new Error("invalid section");
            blocks = page.blocks.slice(part.start - 1, part.end).map((block: { text: string }) => block.text);
          }
          if (blocks.length !== part.end - part.start + 1) throw new Error("invalid range");
          paragraphs.push(...blocks);
        }
        if (createHash("sha256").update(paragraphs.join("\n\n")).digest("hex") !== figure.sha256) throw new Error("paragraph identity mismatch");
        result[figure.id] = paragraphs;
      } catch (error) {
        report(`[parables] ${figure.id}: ${error instanceof Error ? error.message : "source unavailable"}`);
      }
    }
  } catch (error) {
    report(`[parables] Early catalog: ${error instanceof Error ? error.message : "source unavailable"}`);
  }
  return result;
}
