import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { LibraryPage, LibraryRecord, LibrarySearchRow } from "./library";

const directory = path.join(process.cwd(), "content/early-library");
let catalog: Promise<LibraryRecord[]> | undefined;


/** Server-only disk reads: neither catalog section maps nor corpus text enter client bundles. */
export function getLibrary(): Promise<LibraryRecord[]> {
  return catalog ??= readFile(path.join(directory, "catalog.json"), "utf8").then(JSON.parse);
}
export async function getLibraryRecord(id: string) {
  return (await getLibrary()).find(record => record.id === id) ?? null;
}
export async function getLibraryPage(recordId: string, sectionId: string): Promise<LibraryPage | null> {
  const record = await getLibraryRecord(recordId);
  if (!record || record.publicationStatus !== "published" || !record.sections.some(section => section.id === sectionId)) return null;
  return JSON.parse(await readFile(path.join(directory, "readings", record.id, `${sectionId}.json`), "utf8"));
}

// Source-backed paragraph index lives only in the Node process. A bounded
// number of file reads run at a time, and the successful index is reused.
let search: Promise<ReturnType<typeof buildLibrarySearchIndex>> | undefined;
import { buildLibrarySearchIndex } from "./library-search";
import type { EarlyText } from "./types";

export async function getLibrarySearchRows(): Promise<LibrarySearchRow[]> {
  const catalog = await getLibrary();
  const rows: LibrarySearchRow[] = catalog.map(record => ({
    id: record.id, recordId: record.id, title: record.title, edition: record.editionLabel,
    kind: record.publicationStatus === "published" ? "catalog-note" : "reference-only",
    label: record.publicationReason, href: `/early/library/${record.id}`,
    text: [record.title, record.edition, record.coverage, record.caution, record.publicationReason, ...record.witnesses, ...record.provenance].join(" "),
  }));
  const jobs = catalog.filter(record => record.publicationStatus === "published").flatMap(record => record.sections.map(section => ({ record, section })));
  let cursor = 0;
  await Promise.all(Array.from({ length: 16 }, async () => {
    while (cursor < jobs.length) {
      const { record, section } = jobs[cursor++];
      const page: LibraryPage = JSON.parse(await readFile(path.join(directory, "readings", record.id, `${section.id}.json`), "utf8"));
      page.blocks.forEach((block, index) => {
        const anchor = block.noteId ? `note-${block.noteId}` : `p${index + 1}`;
        rows.push({ id: `${record.id}/${section.id}#${anchor}`, recordId: record.id, title: record.title, edition: record.editionLabel,
          kind: block.kind, label: section.label, href: `/early/library/${record.id}/${section.id}#${anchor}`,
          text: block.noteId ? block.text.replace(/^\[\^[^\]]+\]:\s*/, "") : block.text });
      });
    }
  }));
  const legacy = path.join(process.cwd(), "public/early/texts");
  for (const file of (await readdir(legacy)).filter(file => file.endsWith(".json")).sort()) {
    const text: EarlyText = JSON.parse(await readFile(path.join(legacy, file), "utf8"));
    text.sections.forEach((section, index) => section.paragraphs.forEach((paragraph, part) => rows.push({
      id: `${text.id}#s${index}-p${part + 1}`, recordId: `legacy:${text.id}`, title: text.title, edition: text.translator,
      kind: "legacy-edition", label: section.heading || "Opening", href: `/early/${text.id}#s${index}-p${part + 1}`, text: paragraph,
    })));
  }
  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

export async function searchLibrary(query: string, kind = "all", recordId = "", page = 1, pageSize = 30) {
  if (query.trim().length < 2) return buildLibrarySearchIndex([])(query, [], [], page, pageSize);
  const record = recordId ? await getLibraryRecord(recordId) : null;
  const records = recordId ? [recordId, ...(record?.reuseExistingText ? [`legacy:${record.existingTextId}`] : [])] : [];
  search ??= getLibrarySearchRows().then(buildLibrarySearchIndex).catch(error => { search = undefined; throw error; });
  return (await search)(query, kind === "all" ? [] : [kind], records, page, pageSize);
}
