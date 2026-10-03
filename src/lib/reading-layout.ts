/** Presentation only. Offsets refer to the unchanged UTF-16 source string. */
export const READING_LAYOUT_VERSION = 1;
export type ReadingFragment = { text: string; start: number; end: number; boundary: "source" | "editorial" | "quotation" };
export type ReadingBlock = { kind: "prose" | "quotation"; fragments: ReadingFragment[] };

const sentences = new Intl.Segmenter("en", { granularity: "sentence" });
const TARGET = 500;
const MINIMUM = 250;

/** Only complete, substantial double-quoted spans. Never infer who is quoted,
 * repair punctuation, or turn an incomplete quotation into a block quotation. */
function quotations(text: string): [number, number][] {
  const ranges: [number, number][] = [];
  const stack: string[] = [];
  let start = 0;
  let bracketDepth = 0;
  for (let i = 0; i < text.length; i++) {
    const mark = text[i];
    if (mark === "[") bracketDepth++;
    if (mark === "]") bracketDepth = Math.max(0, bracketDepth - 1);
    if (bracketDepth && !stack.length) continue;
    if (mark === "“" || (mark === '"' && stack.at(-1) !== '"')) {
      if (!stack.length) start = i;
      stack.push(mark === "“" ? "”" : '"');
    } else if (mark === "”" || mark === '"') {
      if (stack.pop() !== mark) return []; // Ambiguous typography: keep inline.
      if (!stack.length && i + 1 - start >= 180) {
        // A citation attached to the closing mark belongs with the quotation.
        const note = /^(?:[\t ]*\[\^[^\]\r\n]+\])+/.exec(text.slice(i + 1));
        ranges.push([start, i + 1 + (note?.[0].length ?? 0)]);
        i += note?.[0].length ?? 0;
      }
    }
  }
  return stack.length ? [] : ranges;
}

function fragment(text: string, start: number, end: number, boundary: ReadingFragment["boundary"]): ReadingFragment {
  return { text: text.slice(start, end), start, end, boundary };
}

function prose(text: string, start: number, end: number, boundary: ReadingFragment["boundary"], english: boolean): ReadingFragment[] {
  const source = text.slice(start, end);
  // Retain supplied lineation. Without edition-specific evidence, do not invent
  // verse lines or apply English sentence rules to other languages.
  if (!english || /[\r\n]/.test(source.trimEnd()) || source.length <= TARGET + MINIMUM) return [fragment(text, start, end, boundary)];
  const result: ReadingFragment[] = [];
  let from = start;
  const parts = [...sentences.segment(source)];
  const notes = [...source.matchAll(/\[\^[^\]]+\]/g)];
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const to = start + part.index + part.segment.length;
    const next = parts[i + 1].segment;
    // Intl.Segmenter can attach the opening '[' to the previous sentence.
    // A presentation boundary must never cut through the citation itself.
    if (notes.some(note => to > start + note.index && to < start + note.index + note[0].length)) continue;
    // Avoid separating abbreviated names/titles, numbered list markers and
    // footnotes from their sentence. A very long single sentence stays intact.
    if (/\b(?:Mr|Mrs|Ms|Dr|St|Rev|Prof|Ch|Chap|Vol|No|cf|etc|e\.g|i\.e|[A-Z]|\d+)\.\s*$/i.test(part.segment) || /^\s*\[\^/.test(next)) continue;
    if (to - from >= TARGET && end - to >= MINIMUM) {
      result.push(fragment(text, from, to, from === start ? boundary : "editorial"));
      from = to;
    }
  }
  result.push(fragment(text, from, end, from === start ? boundary : "editorial"));
  return result;
}

function paragraphs(text: string, start: number, end: number, boundary: ReadingFragment["boundary"], english: boolean): ReadingFragment[] {
  const result: ReadingFragment[] = [];
  let from = start;
  // Blank lines are supplied boundaries; single newlines remain inside the
  // fragment and are displayed with pre-line. No whitespace is discarded.
  for (const match of text.slice(start, end).matchAll(/\r?\n[\t ]*\r?\n(?:[\t ]*\r?\n)*/g)) {
    const to = start + match.index + match[0].length;
    if (to < end) {
      result.push(...prose(text, from, to, from === start ? boundary : "source", english));
      from = to;
    }
  }
  result.push(...prose(text, from, end, from === start ? boundary : "source", english));
  return result;
}

export function formatReadingText(text: string, options: { language?: string; quotations?: boolean } = {}): ReadingBlock[] {
  if (!text) return [];
  const english = /^(en(?:-|$)|English$)/i.test(options.language ?? "en");
  const quotes = options.quotations !== false && english ? quotations(text) : [];
  const blocks: ReadingBlock[] = [];
  let start = 0;
  for (const [from, to] of quotes) {
    if (from > start) blocks.push({ kind: "prose", fragments: paragraphs(text, start, from, start === 0 ? "source" : "quotation", english) });
    blocks.push({ kind: "quotation", fragments: paragraphs(text, from, to, "quotation", english) });
    start = to;
  }
  if (start < text.length) blocks.push({ kind: "prose", fragments: paragraphs(text, start, text.length, start === 0 ? "source" : "quotation", english) });
  return blocks;
}

/** Slice existing rich-text runs without re-matching or losing glossary terms. */
export function sliceReadingRuns<T extends { text: string }>(runs: (string | T)[], start: number, end: number): (string | T)[] {
  let offset = 0;
  return runs.flatMap(run => {
    const text = typeof run === "string" ? run : run.text;
    const from = Math.max(0, start - offset), to = Math.min(text.length, end - offset);
    offset += text.length;
    return to > from ? [typeof run === "string" ? text.slice(from, to) : { ...run, text: text.slice(from, to) }] : [];
  });
}
