#!/usr/bin/env node
/** Deterministic, fail-closed import. Raw archives and restricted texts never enter public/. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const json = value => JSON.stringify(value) + "\n";
const normalized = text => text.replace(/\s+/g, " ").trim();
const accounted = text => text.replace(/\s+/g, "");
const slug = text => text.toLowerCase().replace(/\[\^[^\]]+\]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 110);
export const PAGE_LIMIT = 14000; // Unicode characters of source text, never a whole long work.

export function readManifest(root = ROOT) {
  return JSON.parse(fs.readFileSync(path.join(root, "scripts/early/library-import-manifest.json"), "utf8"));
}

/** Newly acquired reusable editions are pinned in the repository, outside public/. */
export function readEditionSource(record, sourceRoot, root = ROOT) {
  if (record.sourcePath && record.sourceRepositoryPath) throw new Error(`Ambiguous source: ${record.id}`);
  const file = record.sourceRepositoryPath || record.sourcePath;
  if (!file) return undefined;
  const prefix = record.sourceRepositoryPath ? "scripts/early/sources/" : "2_Individual_Books/";
  if (!file.startsWith(prefix) || file.split(/[\\/]/).includes("..") || file.includes("\\")) throw new Error(`Invalid edition source: ${record.id}`);
  const base = record.sourceRepositoryPath ? root : sourceRoot;
  const resolved = fs.realpathSync(path.join(base, file));
  if (!resolved.startsWith(fs.realpathSync(path.join(base, prefix)) + path.sep)) throw new Error(`Source escapes edition directory: ${record.id}`);
  const source = fs.readFileSync(resolved, "utf8");
  if (hash(source) !== record.sourceSha256) throw new Error(`Source hash mismatch: ${record.id}`);
  return source;
}

/** Preserve every source block, including headings and interventions, with an explicit role. */
export function parseEdition(source, record) {
  const boundary = source.indexOf("\n---\n");
  if (boundary < 0) throw new Error(`${record.id}: missing catalog/text boundary`);
  const body = source.slice(boundary + 5).trim();
  const blocks = body.split(/\n\s*\n/).map(block => block.trim()).filter(Boolean);
  const units = [];
  const notes = {};
  let heading = "Opening", context = "", role = "primary-text";
  let philoSection = "", footnotes = false;
  const add = (text, kind = role, extra = {}) => units.push({ text, kind, heading, context, ...extra });

  for (const block of blocks) {
    // Notes may occur between books/works, not just at the end of the file.
    const footnote = /^\[\^([^\]]+)\]:\s*([\s\S]*)$/.exec(block);
    if (footnote) {
      if (notes[footnote[1]]) throw new Error(`${record.id}: duplicate note ${footnote[1]}`);
      notes[footnote[1]] = footnote[2];
      add(block, "commentary", { noteId: footnote[1] });
      continue;
    }
    if (block === "## Translator and historical edition notes") {
      footnotes = true;
      heading = "Translator and historical edition notes";
      add(block, "catalog-note", { structural: true });
      continue;
    }
    if (block === "These notes belong to the source edition; they are not part of the ancient work.") {
      add(block, "catalog-note", { structural: true });
      continue;
    }
    const h = /^#{2,6}\s+([^\n]+)$/.exec(block);
    if (h) {
      heading = h[1];
      footnotes = false;
      // Authorial prefaces remain primary. Modern introductions and elucidations do not.
      role = /^(?:FOOTNOTES|Introductory|Introduction|Elucidation|Translator|Editorial)/i.test(heading) ? "commentary" : "primary-text";
      if (/\bBook\s+[IVXLC\d]+\b/i.test(heading) && !/^Chapter/i.test(heading) || /^Version [IVX]+\./.test(heading) || /^The Testament of /i.test(heading) || /^Collection: /.test(heading)) context = heading;
      add(block, "catalog-note", { structural: true });
      continue;
    }
    if (record.parser === "philo") {
      const section = /^([IVXLCDM]+)\.\s/.exec(block);
      if (section) philoSection = `Section ${section[1]}`;
      if (philoSection) heading = philoSection;
      // Brace-enclosed notes are visibly separate from Yonge's translated prose.
      let cursor = 0;
      const braces = /\{[^{}]*\}/g;
      for (const match of block.matchAll(braces)) {
        if (match.index > cursor) add(block.slice(cursor, match.index));
        add(match[0], "commentary");
        cursor = match.index + match[0].length;
      }
      if (cursor < block.length) add(block.slice(cursor));
      continue;
    }
    if (record.id === "gospel-thomas" && /^(?:Saying \d+:|Prologue$)/.test(block)) {
      heading = block;
      add(block, "catalog-note", { structural: true });
      continue;
    }
    const numbered = /^([IVXLCDM]+|\d+)\.\s/.exec(block);
    if (["testament-abraham", "irenaeus-demonstration"].includes(record.id) && numbered) heading = `Section ${numbered[1]}`;
    // An edition's plain-text introductions are not words of the ancient author.
    const editorial = /^Symbols\b|^Pages \d+ through \d+ are missing\.|^\[a\.d\.|^Remains of the Second|^From the Apology|^The first four leaves of the Coptic MS\.|^Scanned and Edited by /i.test(block)
      || record.id === "quadratus-fragment" && !block.startsWith("Our Saviour’s works");
    add(block, editorial ? "commentary" : footnotes ? "commentary" : role);
  }
  // Check against omission/duplication independently of page boundaries and roles.
  if (accounted(units.map(unit => unit.text).join(" ")) !== accounted(body)) {
    throw new Error(`${record.id}: source content was dropped or duplicated`);
  }
  const references = [...body.matchAll(/\[\^([^\]]+)\](?!:)/g)].map(match => match[1]);
  for (const ref of references) if (!notes[ref]) throw new Error(`${record.id}: unresolved note ${ref}`);

  const pages = [];
  let current;
  const occurrences = new Map();
  function start(unit) {
    const rawLocator = [unit.context, unit.heading].filter((v, i, a) => v && a.indexOf(v) === i).join(" — ");
    const headingNoteRefs = [...rawLocator.matchAll(/\[\^[^\]]+\]/g)].map(m => m[0]).join(" ");
    const locator = rawLocator.replace(/\[\^[^\]]+\]/g, "").trim();
    // Long Victorian book/chapter titles must not truncate the chapter number
    // out of the URL or make an unrelated chapter look like a continuation.
    const contextKey = /\b(Book|Version)\s+([IVXLCDM\d]+)\b/i.exec(unit.context);
    const headingKey = /^(Chapter|Section|Saying)\s+([IVXLCDM\d]+)\b/i.exec(unit.heading);
    const contextSlug = slug(contextKey ? `${contextKey[1]} ${contextKey[2]}` : unit.context);
    // Synoptic editions distinguish witnesses within the same numbered chapter.
    const headingSlug = slug(headingKey && record.parser !== "synoptic" ? `${headingKey[1]} ${headingKey[2]}` : unit.heading);
    const base = [contextSlug, headingSlug].filter((v, i, a) => v && a.indexOf(v) === i).join("-") || "opening";
    const n = (occurrences.get(base) ?? 0) + 1;
    occurrences.set(base, n);
    current = { id: `${base}${n > 1 ? `-part-${n}` : ""}`, label: `${locator}${n > 1 ? ` (part ${n})` : ""}`, headingNoteRefs, context: unit.context, kind: unit.kind, blocks: [], chars: 0 };
    pages.push(current);
  }
  // Display headings via the navigation label. Keep their source text in the audit, not duplicated in prose.
  for (const unit of units.filter(u => !u.structural)) {
    let rest = unit.text;
    while (rest.length) {
      const location = [unit.context, unit.heading].join("|");
      if (!current || current.location !== location || current.chars >= PAGE_LIMIT - 200) {
        start(unit); current.location = location;
      }
      let length = Math.min(rest.length, PAGE_LIMIT - current.chars);
      if (length < rest.length) {
        const space = rest.lastIndexOf(" ", length - 1);
        if (space > 0) length = space + 1;
      }
      const text = rest.slice(0, length);
      current.blocks.push({ text, kind: unit.kind, ...(unit.noteId ? { noteId: unit.noteId } : {}) });
      current.chars += text.length;
      rest = rest.slice(length);
    }
  }
  // A note belongs on the page which cites it, with a return link. Its own commentary page remains searchable.
  for (const page of pages) {
    delete page.location;
    page.kind = page.blocks.every(b => b.kind === "commentary") ? "commentary" : page.blocks.some(b => b.kind === "commentary") ? "mixed-edition" : "primary-text";
    page.notes = Object.fromEntries([...new Set([...([page.headingNoteRefs, ...page.blocks.map(b => b.text)].join(" ")).matchAll(/\[\^([^\]]+)\](?!:)/g)].map(m => m[1]))].map(id => [id, notes[id]]));
  }
  const notePages = new Map();
  for (const page of pages) for (const block of page.blocks) if (block.noteId && !notePages.has(block.noteId)) notePages.set(block.noteId, page.id);
  for (const page of pages) {
    let noteBudget = 8000;
    page.notes = Object.fromEntries(Object.entries(page.notes).map(([id, text]) => {
      const inline = text.length <= noteBudget;
      if (inline) noteBudget -= text.length;
      return [id, { ...(inline ? { text } : {}), href: `/early/library/${record.id}/${notePages.get(id)}#note-${id}` }];
    }));
  }
  return { pages, audit: { bodySha256: hash(accounted(body)), accountedSha256: hash(accounted(units.map(u => u.text).join(" "))), sourceBodyCharacters: body.length, sourceBlocks: blocks.length, sourceHeadings: units.filter(u => u.structural).map(u => u.text), notes: Object.keys(notes).length } };
}

export function buildLibrary(sourceRoot, root = ROOT, check = false) {
  const manifest = readManifest(root);
  const output = new Map();
  const catalog = [];
  const search = [];
  const audits = [];
  for (const { path: file, sha256: digest } of manifest.legacyHashes) {
    if (hash(fs.readFileSync(path.join(root, file))) !== digest) throw new Error(`Legacy content changed: ${file}`);
  }
  if (hash(fs.readFileSync(path.join(sourceRoot, "3_Source_Records/SOURCE_MANIFEST.json"))) !== manifest.sourceManifestSha256) throw new Error("Source manifest changed; review the import decisions before reimporting");
  for (const record of manifest.records) {
    if (!manifest.rightsProfiles[record.rightsProfile]) throw new Error(`Missing rights review: ${record.id}`);
    const source = readEditionSource(record, sourceRoot, root);
    const metadata = { ...record };
    delete metadata.sourcePath; delete metadata.sourceRepositoryPath; delete metadata.parser;
    const entry = { ...metadata, rightsReview: manifest.rightsProfiles[record.rightsProfile], sections: [], primaryCharacters: 0, commentaryCharacters: 0 };
    if (record.publicationStatus === "published") {
      if (!source || ["wesley-restricted", "dss-noncommercial", "unproofread-scan", "unacquired"].includes(record.rightsProfile)) throw new Error(`Publication gate: ${record.id}`);
      const parsed = parseEdition(source, record);
      const reusePages = parsed.pages.map(page => record.reuseExistingText ? { ...page, blocks: page.blocks.filter(b => b.kind === "commentary"), kind: "commentary" } : page).filter(page => page.blocks.length);
      for (const page of reusePages) {
        page.chars = page.blocks.reduce((n, b) => n + b.text.length, 0);
        const href = `/early/library/${record.id}/${page.id}`;
        output.set(`readings/${record.id}/${page.id}.json`, json(page));
        entry.sections.push({ id: page.id, label: page.label, context: page.context, kind: page.kind, chars: page.chars });
        for (const block of page.blocks) entry[block.kind === "primary-text" ? "primaryCharacters" : "commentaryCharacters"] += block.text.length;
        // Search snippets never combine translated text and commentary.
        for (const kind of [...new Set(page.blocks.map(b => b.kind))]) {
          search.push({ id: `${record.id}/${page.id}/${kind}`, recordId: record.id, title: record.title, edition: record.editionLabel, kind, label: page.label, href, text: normalized(page.blocks.filter(b => b.kind === kind).map(b => b.text).join(" ")) });
        }
      }
      audits.push({ id: record.id, ...parsed.audit });
    }
    search.push({ id: record.id, recordId: record.id, title: record.title, edition: record.editionLabel, kind: record.publicationStatus === "published" ? "catalog-note" : "reference-only", label: record.publicationReason, href: `/early/library/${record.id}`, text: normalized([record.title, record.edition, record.coverage, record.caution, record.publicationReason, ...record.witnesses, ...record.provenance].join(" ")) });
    catalog.push(entry);
  }
  // Existing passages participate in exact search without changing their source or anchors.
  for (const file of fs.readdirSync(path.join(root, "public/early/texts")).filter(f => f.endsWith(".json")).sort()) {
    const text = JSON.parse(fs.readFileSync(path.join(root, "public/early/texts", file), "utf8"));
    text.sections.forEach((section, index) => search.push({ id: `${text.id}#${index}`, recordId: `legacy:${text.id}`, title: text.title, edition: text.translator, kind: "legacy-edition", label: section.heading || "Opening", href: `/early/${text.id}#s${index}`, text: normalized(section.paragraphs.join(" ")) }));
  }
  const report = { schemaVersion: 1, reviewedAt: manifest.reviewedAt, sourceManifestSha256: manifest.sourceManifestSha256, importManifestSha256: hash(fs.readFileSync(path.join(root, "scripts/early/library-import-manifest.json"))), acquiredEntries: manifest.records.filter(r => r.sourcePath || r.sourceRepositoryPath).length, publishedEntries: catalog.filter(r => r.publicationStatus === "published").length, referenceOnlyEntries: catalog.filter(r => r.publicationStatus === "reference-only").length, deferredEntries: catalog.filter(r => r.publicationStatus === "deferred").length, works: new Set(catalog.map(r => r.workId)).size, newPrimaryEntries: catalog.filter(r => r.publicationStatus === "published" && !r.reuseExistingText).length, reusedPrimaryEntries: catalog.filter(r => r.reuseExistingText).length, readingSections: catalog.reduce((n, r) => n + r.sections.length, 0), primaryCharacters: catalog.reduce((n, r) => n + r.primaryCharacters, 0), commentaryCharacters: catalog.reduce((n, r) => n + r.commentaryCharacters, 0), exactSearch: "All published sections, edition commentary and reference metadata; legacy editions separately labelled. Server-side excerpts only.", semanticSearch: "Expanded editions: translated text is embedded for meaning search. Commentary, reference records, and editions that reuse the original shelf are not embedded again. Similarity is not evidence of historical dependence.", allusions: "Existing editions only; no allusion claims added for the expansion.", audits };
  output.set("catalog.json", json(catalog));
  output.set("search.json", json(search));
  report.outputs = [...output].map(([file, data]) => ({ sha256: hash(data), path: file }));
  output.set("report.json", json(report));
  const destination = path.join(root, "content/early-library");
  if (check) {
    for (const [file, data] of output) if (!fs.existsSync(path.join(destination, file)) || fs.readFileSync(path.join(destination, file), "utf8") !== data) throw new Error(`Generated file drift: ${file}`);
  } else {
    // Remove only this generator's owned output, after every source and publication gate has passed.
    fs.rmSync(destination, { recursive: true, force: true });
    for (const [file, data] of output) {
      fs.mkdirSync(path.dirname(path.join(destination, file)), { recursive: true });
      fs.writeFileSync(path.join(destination, file), data);
    }
  }
  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sourceArg = process.argv.find(arg => arg.startsWith("--source="));
  if (!sourceArg) throw new Error("Pass --source=/absolute/path/to/NotebookLM-Sources (source archive is never committed)");
  const report = buildLibrary(sourceArg.slice(9), ROOT, process.argv.includes("--check"));
  console.log(`${report.publishedEntries} published edition entries, ${report.referenceOnlyEntries} reference-only, ${report.deferredEntries} deferred; ${report.readingSections} bounded sections`);
}
