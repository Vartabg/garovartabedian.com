import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256 } from "../scriptures/index-publication.mjs";
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
/** Collapse whitespace so the embedded string matches what a reader sees. */
export const flatten = (value) => String(value).replace(/\s+/g, " ").trim();

/** Public JSON for the older corpora, plus one reading file per library section. */
export const CORPUS_SOURCE_PATH = /^(?:public\/[a-zA-Z0-9/_-]+|content\/early-library\/readings\/[a-z0-9-]+\/[a-z0-9-]+)\.json$/;

/**
 * Every saying selected by the hosted words catalog, using whitespace-folded WEB text.
 */
export function collectWords(root = ROOT) {
  const canons = JSON.parse(fs.readFileSync(path.join(root, "public/scriptures/canons.json"), "utf8"));
  const counts = JSON.parse(
    fs.readFileSync(path.join(root, "public/jesus/words.json"), "utf8"),
  ).counts;
  const entries = [];
  for (const book of canons.bookOrder) {
    if (!counts[book]) continue;
    const file = path.join(root, "public/jesus/words", `${book}.json`);
    if (!fs.existsSync(file)) throw new Error(`Missing sayings source: ${book}`);
    const verses = JSON.parse(fs.readFileSync(file, "utf8"));
    if (Object.keys(verses).length !== counts[book] || Object.values(verses).some((text) => !flatten(text))) {
      throw new Error(`Sayings coverage mismatch: ${book}`);
    }
    for (const [ref, text] of Object.entries(verses)) {
      const [chapter, verse] = ref.split(":").map(Number);
      const flat = flatten(text);
      if (!flat) continue;
      entries.push({
        sourcePath: `public/jesus/words/${book}.json`,
        id: `${book} ${ref}`,
        book,
        chapter,
        verse,
        label: `${canons.books[book]?.name ?? book} ${ref}`,
        text: flat,
      });
    }
  }
  return { corpus: "words", outDir: "public/jesus/semantic", entries };
}

/**
 * Every headed section of every hosted early writing. The heading is embedded
 * with the body because a section's heading is part of how it reads.
 */
export function collectEarly(root = ROOT) {
  const textsDir = path.join(root, "public/early/texts");
  const entries = [];
  for (const file of fs.readdirSync(textsDir).sort()) {
    if (!file.endsWith(".json")) continue;
    const text = JSON.parse(fs.readFileSync(path.join(textsDir, file), "utf8"));
    text.sections.forEach((section, index) => {
      const body = flatten(
        [section.heading ?? "", ...section.paragraphs].join(" "),
      );
      if (!body) return;
      entries.push({
        sourcePath: `public/early/texts/${file}`,
        id: `${text.id}#${index}`,
        textId: text.id,
        section: index,
        label: section.heading
          ? `${text.title} — ${flatten(section.heading)}`
          : text.title,
        text: body,
      });
    });
  }
  return { corpus: "early", outDir: "public/early/semantic", entries };
}

/**
 * Translated text of published editions that are not already on the original shelf.
 * Commentary, reference records, and reused shelf editions stay out of this index.
 */
export function collectLibrary(root = ROOT) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, "content/early-library/catalog.json"), "utf8"));
  const entries = [];
  for (const record of catalog) {
    if (record.publicationStatus !== "published" || record.reuseExistingText) continue;
    for (const section of record.sections) {
      const sourcePath = `content/early-library/readings/${record.id}/${section.id}.json`;
      if (!CORPUS_SOURCE_PATH.test(sourcePath)) throw new Error(`Unsafe library source path: ${sourcePath}`);
      const page = JSON.parse(fs.readFileSync(path.join(root, sourcePath), "utf8"));
      const primary = (page.blocks ?? [])
        .filter((block) => block.kind === "primary-text" && !block.noteId)
        .map((block) => flatten(block.text))
        .filter(Boolean);
      if (!primary.length) continue;
      const body = flatten([section.label ?? "", ...primary].join(" "));
      entries.push({
        sourcePath,
        id: `${record.id}#${section.id}`,
        recordId: record.id,
        sectionId: section.id,
        label: section.label ? `${record.title} — ${flatten(section.label)}` : record.title,
        edition: record.editionLabel,
        href: `/early/library/${record.id}/${section.id}`,
        text: body,
      });
    }
  }
  if (!entries.length) throw new Error("Library meaning corpus is empty");
  return { corpus: "library", outDir: "public/semantic-corpora", entries };
}

/**
 * All 54 world afterlife traditions and eschatological frameworks.
 * Embeds synthesis: name, family, description, primary doctrine, key figures,
 * motifs, primary texts, and eschatological patterns.
 */
export function collectAfterlife(root = ROOT) {
  const schemaPath = path.join(root, "public/evidence/afterlife-schema.json");
  const traditions = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const entries = [];
  for (const t of traditions) {
    const figures = (t.keyFigures ?? []).map((f) => `${f.name} (${f.role})`).join(", ");
    const motifs = (t.visualMotifs ?? []).join(", ");
    const texts = (t.metadata?.keyTexts ?? []).join("; ");
    const patterns = (t.taxonomy?.patterns ?? []).join(", ");

    const body = flatten(
      [
        t.name,
        t.taxonomy?.family ? `Family: ${t.taxonomy.family}` : "",
        t.description ?? "",
        t.primaryDoctrine ?? "",
        figures ? `Key figures: ${figures}` : "",
        motifs ? `Motifs: ${motifs}` : "",
        texts ? `Key texts: ${texts}` : "",
        patterns ? `Patterns: ${patterns}` : "",
        t.geography?.description ?? "",
      ]
        .filter(Boolean)
        .join(". "),
    );

    entries.push({
      sourcePath: "public/evidence/afterlife-schema.json",
      id: t.id,
      name: t.name,
      family: t.taxonomy?.family ?? "other",
      description: t.description,
      primaryDoctrine: t.primaryDoctrine,
      label: t.name,
      href: `/evidence/frameworks/${t.id}`,
      text: body,
    });
  }
  return { corpus: "afterlife", outDir: "public/evidence/semantic", entries };
}

export const COLLECTORS = {
  words: collectWords,
  early: collectEarly,
  afterlife: collectAfterlife,
  library: collectLibrary,
};


export function collectCorpora(root = ROOT) {
  return Object.fromEntries(Object.entries(COLLECTORS).map(([id, collect]) => {
    const collection = collect(root);
    const paths = new Set(collection.entries.map((entry) => entry.sourcePath));
    if (id === "words") { paths.add("public/scriptures/canons.json"); paths.add("public/jesus/words.json"); }
    const sources = [...paths].sort().map((file) => ({ path: file, sha256: sha256(fs.readFileSync(path.join(root, file))) }));
    return [id, { entries: collection.entries, sources }];
  }));
}
