import fs from "node:fs";
import path from "node:path";
import { chunkText } from "../site/token-chunks.mjs";
import { loadCorpusTokenizer } from "../site/build-corpus-embeddings.mjs";
import { chapterNumber } from "../../src/lib/early/citations";
import type { EarlyText } from "../../src/lib/early/types";
import type { LibraryRecord, LibraryPage } from "../../src/lib/early/library";
import type { Canons, TranslationId } from "../../src/lib/scriptures/types";
import type { SourceSpec, TextBlock } from "./types";
import { ROOT, hash, fingerprint, readJson } from "./storage";

type Tokenizer = { encode(text: string): number[] };
let tokenizer: Promise<Tokenizer> | undefined;
export function getTokenizer(): Promise<Tokenizer> { return tokenizer ??= loadCorpusTokenizer(ROOT); }
const slug = (s: string) => { if (!/^[a-zA-Z0-9_-]+$/.test(s)) throw new Error("Invalid source identifier"); return s; };
const positive = (n: number | undefined) => n !== undefined && Number.isSafeInteger(n) && n > 0;
type Raw = { text: string; pointer: (string | number)[]; title: string; edition: string; role: string; language: string; href?: string; range?: [number, number]; selected?: boolean };

export function parseSource(value: string): SourceSpec {
  const parts = value.split(":");
  if (parts[0] === "scripture") {
    if (parts.length < 3 || parts.length > 5) throw new Error("Use scripture:translation:BOOK[:chapter[:verse-endVerse]]");
    const [verse, endVerse] = (parts[4] ?? "").split("-").map(Number);
    return { kind: "scripture", translation: parts[1], book: parts[2], ...(parts[3] ? { chapter: Number(parts[3]) } : {}), ...(parts[4] ? { verse, endVerse: endVerse || verse } : {}) };
  }
  if (parts[0] === "early") {
    if (parts.length < 2 || parts.length > 3) throw new Error("Use early:id[:chapter]");
    return { kind: "early", id: parts[1], ...(parts[2] ? { chapter: Number(parts[2]) } : {}) };
  }
  if (parts[0] === "library") {
    if (parts.length < 2 || parts.length > 3) throw new Error("Use library:id[:section]");
    return { kind: "library", id: parts[1], ...(parts[2] ? { section: parts[2] } : {}) };
  }
  return { kind: "file", path: value.startsWith("file:") ? value.slice(5) : value };
}

/** Offsets always address unchanged decoded source text, never normalized embedding text. */
export async function loadSource(spec: SourceSpec, root = ROOT, counter?: Tokenizer): Promise<TextBlock[]> {
  const count = counter ?? await getTokenizer();
  const files: { file: string; rows: Raw[] }[] = [];
  if (spec.kind === "file") {
    const file = path.resolve(root, spec.path);
    if (!/\.(txt|md)$/i.test(file)) throw new Error("Local sources must be .txt or .md");
    const text = new TextDecoder("utf-8", { fatal: true }).decode(fs.readFileSync(file));
    if (text.includes("\0")) throw new Error("Binary input is not supported");
    const start = spec.start ?? 0, end = spec.end ?? text.length;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end <= start || end > text.length) throw new Error("Invalid file selection offsets");
    if ([start, end].some(i => i > 0 && /[\uD800-\uDBFF]/.test(text[i - 1]) && /[\uDC00-\uDFFF]/.test(text[i] ?? ""))) throw new Error("File selection offsets split a Unicode character");
    files.push({ file, rows: [{ text, pointer: [], title: path.basename(file), edition: "User-supplied text; edition unspecified", role: "user-supplied", language: spec.language ?? "en", range: [start, end] }] });
  } else if (spec.kind === "scripture") {
    const translation = slug(spec.translation ?? "web"), book = slug(spec.book);
    const canons = readJson<Canons>(path.join(root, "public/scriptures/canons.json"));
    const edition = canons.translations[translation as TranslationId];
    if (!edition || !canons.books[book]?.trans.includes(translation as TranslationId)) throw new Error("Scripture edition is not hosted for this book");
    const tradition = canons.traditions.find(t => t.books.includes(book));
    if (spec.chapter !== undefined && !positive(spec.chapter) || spec.verse !== undefined && (!positive(spec.verse) || !positive(spec.chapter)) || spec.endVerse !== undefined && (!positive(spec.endVerse) || !positive(spec.verse))) throw new Error("Invalid Scripture locator");
    const file = path.join(root, "public/scriptures/text", translation, `${book}.json`);
    const data = readJson<{ chapters: string[][] }>(file);
    if (spec.chapter && !data.chapters[spec.chapter - 1]) throw new Error("Missing Scripture chapter");
    if (spec.verse && (spec.endVerse ?? spec.verse) < spec.verse) throw new Error("Reversed verse range");
    if (spec.verse && !data.chapters[spec.chapter! - 1]?.[(spec.endVerse ?? spec.verse) - 1]) throw new Error("Missing Scripture verse");
    const rows: Raw[] = [];
    data.chapters.forEach((verses, c) => {
      if (spec.chapter && spec.chapter !== c + 1) return;
      verses.forEach((text, v) => {
        rows.push({ text, pointer: ["chapters", c, v], title: `${book} ${c + 1}:${v + 1}`, edition: `${edition.name} (${edition.year}; ${translation})`, role: "translated-scripture", language: "en", href: tradition ? `/scriptures/${tradition.id}/${book}/${c + 1}?t=${translation}#v${v + 1}` : undefined });
      });
    });
    files.push({ file, rows });
  } else if (spec.kind === "early") {
    const file = path.join(root, "public/early/texts", `${slug(spec.id)}.json`);
    const data = readJson<EarlyText>(file);
    if (spec.chapter !== undefined && (!positive(spec.chapter) || data.sections.filter(s => chapterNumber(s.heading) === spec.chapter).length !== 1)) throw new Error("Early chapter must resolve exactly once");
    const rows: Raw[] = [];
    data.sections.forEach((s, i) => s.paragraphs.forEach((text, j) => {
      const selected = !(spec.chapter && chapterNumber(s.heading) !== spec.chapter || spec.section !== undefined && i !== spec.section || spec.paragraph !== undefined && j !== spec.paragraph);
      rows.push({ text, pointer: ["sections", i, "paragraphs", j], selected, title: `${data.title} — ${s.heading ?? `section ${i}`} ¶${j + 1}`, edition: data.translator || "Hosted early-writing edition", role: "legacy-edition", language: /latin/i.test(s.heading ?? "") ? "la" : "en", href: `/early/${spec.id}${chapterNumber(s.heading) ? `#chapter-${chapterNumber(s.heading)}` : ""}` });
    }));
    files.push({ file, rows });
  } else if (spec.kind === "library") {
    const record = readJson<LibraryRecord[]>(path.join(root, "content/early-library/catalog.json")).find(r => r.id === spec.id);
    if (!record || record.publicationStatus !== "published") throw new Error("Library text is not hosted");
    if (record.reuseExistingText && record.existingTextId) {
      if (spec.section || spec.block !== undefined) throw new Error("Use an early: locator for a reused legacy edition");
      return loadSource({ kind: "early", id: record.existingTextId }, root, count);
    }
    for (const section of record.sections) {
      if (spec.section && section.id !== spec.section) continue;
      const file = path.join(root, "content/early-library/readings", slug(spec.id), `${slug(section.id)}.json`);
      const page = readJson<LibraryPage>(file);
      files.push({ file, rows: page.blocks.map((b, i) => ({ text: b.text, pointer: ["blocks", i, "text"], selected: spec.block === undefined || i === spec.block, title: `${record.title} — ${section.label} ¶${i + 1}`, edition: record.edition, role: b.kind, language: record.language.toLowerCase().includes("english") ? "en" : record.language, href: `/early/library/${record.id}/${section.id}` })) });
    }
  } else throw new Error("Unknown source kind");

  const blocks: TextBlock[] = [];
  for (const { file, rows } of files) {
    const artifactHash = hash(fs.readFileSync(file));
    const relative = path.relative(root, file);
    const storedPath = relative.startsWith("..") ? file : relative;
    rows.forEach((row, rowIndex) => {
      if (row.selected === false) return;
      if (spec.kind === "scripture" && spec.verse && (Number(row.pointer[2]) + 1 < spec.verse || Number(row.pointer[2]) + 1 > (spec.endVerse ?? spec.verse))) return;
      const [selectedStart, selectedEnd] = row.range ?? [0, row.text.length];
      const selection = row.text.slice(selectedStart, selectedEnd);
      const pieces = [...selection.matchAll(/[^\r\n]+(?:\r?\n(?!\r?\n|#{1,6}\s)[^\r\n]+)*/g)];
      for (const piece of pieces) {
        if (!piece[0].trim()) continue;
        for (const chunk of chunkText(piece[0], (s: string) => count.encode(s).length, { maxTokens: 384, overlapTokens: 48, specialTokens: 2 })) {
          const start = selectedStart + piece.index! + chunk.start, end = selectedStart + piece.index! + chunk.end;
          const text = row.text.slice(start, end);
          const neighbor = (r: Raw | undefined, before: boolean) => r ? `[${r.role}: ${r.title}]\n${before ? r.text.slice(-1000) : r.text.slice(0, 1000)}` : undefined;
          const context = [neighbor(rows[rowIndex - 1], true), `[${row.role}: ${row.title}]\n${row.text.slice(Math.max(0, start - 1500), Math.min(row.text.length, end + 1500))}`, neighbor(rows[rowIndex + 1], false)].filter(Boolean).join("\n\n");
          const id = fingerprint({ path: storedPath, artifactHash, pointer: row.pointer, start, end });
          blocks.push({ id, source: spec, path: storedPath, artifactHash, pointer: row.pointer, start, end, text, textHash: hash(text), context, title: row.title, edition: row.edition, role: row.role, language: row.language, href: row.href });
        }
      }
    });
  }
  if (!blocks.length) throw new Error("Source selection contains no hosted text");
  blocks.forEach(b => verifyBlock(b, root));
  return blocks;
}

export function verifyBlock(block: TextBlock, root = ROOT): void {
  const bytes = fs.readFileSync(path.resolve(root, block.path));
  if (hash(bytes) !== block.artifactHash) throw new Error(`Stale source: ${block.title}`);
  let text: unknown = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (block.pointer.length) {
    text = JSON.parse(text as string);
    for (const key of block.pointer) text = (text as Record<string | number, unknown>)?.[key];
  }
  if (typeof text !== "string" || !Number.isInteger(block.start) || !Number.isInteger(block.end) || block.start < 0 || block.end <= block.start || text.slice(block.start, block.end) !== block.text || hash(block.text) !== block.textHash) throw new Error(`Invalid source span: ${block.title}`);
}
