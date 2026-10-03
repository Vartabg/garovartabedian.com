import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import type { Canons } from "../scriptures/types";
import { chapterAnchors } from "../early/citations";

export type PublicSource =
  | {
      kind: "scripture";
      translation: "web" | "kjv" | "drb" | "brenton";
      book: string;
      chapter: number;
      verse: number;
    }
  | { kind: "early"; id: string; section: number; paragraph: number };
export type PublicPassage = {
  source: PublicSource;
  text: string;
  context: string;
  title: string;
  edition: string;
  role: string;
  href: string;
  sourceHash: string;
  textHash: string;
  start: number;
  end: number;
};
export const digest = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
const index = (n: unknown, min: number) =>
  typeof n === "number" && Number.isSafeInteger(n) && n >= min && n < 10000;
const identifier = (v: unknown) =>
  typeof v === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(v);

/** Public requests select hosted text. They cannot supply paths, context or prose. */
export function parsePublicSource(value: unknown): PublicSource {
  const s = value as PublicSource;
  if (
    s?.kind === "scripture" &&
    ["web", "kjv", "drb", "brenton"].includes(s.translation) &&
    identifier(s.book) &&
    index(s.chapter, 1) &&
    index(s.verse, 1)
  )
    return {
      kind: s.kind,
      translation: s.translation,
      book: s.book,
      chapter: s.chapter,
      verse: s.verse,
    };
  if (
    s?.kind === "early" &&
    identifier(s.id) &&
    index(s.section, 0) &&
    index(s.paragraph, 0)
  )
    return {
      kind: s.kind,
      id: s.id,
      section: s.section,
      paragraph: s.paragraph,
    };
  throw new Error("Choose a hosted verse or early-writing paragraph.");
}

export function resolvePublicSource(
  value: unknown,
  root = process.cwd(),
): PublicPassage {
  const source = parsePublicSource(value);
  let bytes: Buffer,
    text: string,
    context: string,
    title: string,
    edition: string,
    role: string,
    href: string;
  if (source.kind === "scripture") {
    const { translation, book, chapter, verse } = source;
    const canons = JSON.parse(
      fs.readFileSync(path.join(root, "public/scriptures/canons.json"), "utf8"),
    ) as Canons;
    if (!canons.books[book]?.trans.includes(translation))
      throw new Error("Edition unavailable for this book.");
    bytes = fs.readFileSync(
      path.join(root, "public/scriptures/text", translation, `${book}.json`),
    );
    const data = JSON.parse(bytes.toString()) as {
      book: string;
      trans: string;
      chapters: string[][];
    };
    if (data.book !== book || data.trans !== translation)
      throw new Error("Source identity mismatch.");
    const verses = data.chapters[chapter - 1];
    text = verses?.[verse - 1];
    title = `${canons.books[book].name} ${chapter}:${verse}`;
    edition = canons.translations[translation].name;
    role = "translated-scripture";
    context = (verses ?? [])
      .slice(Math.max(0, verse - 2), verse + 1)
      .map((t, i) => `${book} ${chapter}:${Math.max(1, verse - 1) + i}: ${t}`)
      .join("\n");
    const tradition = canons.traditions.find((t) => t.books.includes(book));
    if (!tradition) throw new Error("Source location unavailable.");
    href = `/scriptures/${tradition.id}/${book}/${chapter}?t=${translation}#v${verse}`;
  } else {
    bytes = fs.readFileSync(
      path.join(root, "public/early/texts", `${source.id}.json`),
    );
    const data = JSON.parse(bytes.toString()) as {
      title: string;
      translator: string;
      sections: { heading?: string; paragraphs: string[] }[];
    };
    const section = data.sections[source.section];
    if (/latin/i.test(section?.heading ?? ""))
      throw new Error("Non-English assessment is unvalidated.");
    text = section?.paragraphs[source.paragraph];
    title = `${data.title} — ${section?.heading ?? `section ${source.section + 1}`} ¶${source.paragraph + 1}`;
    edition = data.translator || "Hosted early-writing edition";
    role = "legacy-edition; may include translator/editorial material";
    context = (section?.paragraphs ?? [])
      .slice(Math.max(0, source.paragraph - 1), source.paragraph + 2)
      .join("\n\n");
    href = `/early/${source.id}#${chapterAnchors(data.sections)[source.section] ?? `s${source.section}`}`;
  }
  if (typeof text !== "string" || !text.trim())
    throw new Error("Source passage unavailable.");
  if (Buffer.byteLength(text) > 8000 || Buffer.byteLength(context) > 16000)
    throw new Error(
      "Passage or context exceeds the public assessment limit; no text was truncated.",
    );
  return {
    source,
    text,
    context,
    title,
    edition,
    role,
    href,
    sourceHash: digest(bytes),
    textHash: digest(text),
    start: 0,
    end: text.length,
  };
}
