import data from "../../../public/jesus/early-figures.json";

export type EarlyFigurePart = { section: string; start: number; end: number; joinPrevious?: boolean };

export type EarlyFigure = {
  id: string; title: string; work: string; edition: string; section: string;
  locator: string; start: number; end: number; legacy?: boolean; legacyText?: "1clement"; speaker: string;
  translator: string; sha256: string; related?: string; relatedAlso?: string[]; note?: string;
  excerpt?: boolean; poetry?: boolean; preserveLines?: boolean; earlyComparisons?: string[]; compareFrom?: string;
  parts?: EarlyFigurePart[]; thomas?: { saying: number; note?: string }[];
};

export const EARLY_FIGURES: EarlyFigure[] = data as EarlyFigure[];
export const earlyFigureParts = (figure: EarlyFigure): EarlyFigurePart[] => figure.parts ?? [{ section: figure.section, start: figure.start, end: figure.end }];
export const EARLY_EXCERPT_URLS: Record<string, string> = {
  "acts-thomas-wedding-invitation": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-old-new-48": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-lost-sheep": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-old-new-58": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-heat-day": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-flock-wolves": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-wolves-clothing": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-stolen-thoughts": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-physician-10": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-birds": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-wealth": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-ask": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-physician-95": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-physician-143": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-physician-156": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",

  "eusebius-talents": "https://en.wikisource.org/wiki/Page:The_Apocryphal_New_Testament_(1924).djvu/41",
  "acts-thomas-bride": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-palace": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-prayer": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-marriage": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-bride-response": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-shepherd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-crowd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-bitter-tree": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-yoke": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-seed": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-mygdonia-marriage": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-soldiers": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-tower": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-oil": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-hymn": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
};
export const earlyFigureHref = (figure: EarlyFigure, part: EarlyFigurePart = earlyFigureParts(figure)[0]) => figure.excerpt
  ? EARLY_EXCERPT_URLS[figure.edition] ?? "#parables-early-figures"
  : figure.legacy
  ? `/early/${figure.legacyText ?? figure.edition}#${part.section}`
  : `/early/library/${figure.edition}/${part.section}#p${part.start}`;

/** Join only source blocks split in the middle of a sentence by the edition importer. */
export function earlyDisplayBlocks(figure: EarlyFigure, blocks: string[]): string[] {
  const result: string[] = []; let offset = 0;
  for (const part of earlyFigureParts(figure)) {
    for (let i = 0; i <= part.end - part.start; i++) {
      const text = blocks[offset++];
      if (i === 0 && part.joinPrevious && result.length) result[result.length - 1] += text;
      else result.push(text);
    }
  }
  return result;
}
