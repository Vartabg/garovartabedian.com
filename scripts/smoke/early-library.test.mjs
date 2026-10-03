import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ROOT, hash, PAGE_LIMIT, parseEdition, readManifest, readEditionSource } from "../early/import-library.mjs";
import { collectLibrary } from "../site/corpus-sources.mjs";

const read = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
const catalog = read("content/early-library/catalog.json");
const report = read("content/early-library/report.json");
const manifest = readManifest();

test("every acquired entry has one reviewed disposition; packs and unacquired texts are never ingested", () => {
  assert.equal(manifest.records.length, 122);
  assert.equal(manifest.records.filter(r => r.sourcePath || r.sourceRepositoryPath).length, 117);
  assert.equal(new Set(manifest.records.map(r => r.id)).size, 122);
  assert.equal(report.acquiredEntries, 117);
  assert.deepEqual([report.publishedEntries, report.newPrimaryEntries, report.reusedPrimaryEntries, report.referenceOnlyEntries, report.deferredEntries], [103, 100, 3, 14, 5]);
  for (const r of manifest.records) {
    assert.ok(manifest.rightsProfiles[r.rightsProfile]?.evidence.length);
    assert.equal(catalog.find(c => c.id === r.id)?.publicationStatus, r.publicationStatus);
    if (r.sourcePath) assert.ok(r.sourcePath.startsWith("2_Individual_Books/"));
    if (r.publicationStatus !== "published") {
      assert.equal(catalog.find(c => c.id === r.id).sections.length, 0);
      assert.equal(fs.existsSync(path.join(ROOT, "content/early-library/readings", r.id)), false);
    }
  }
});

test("new editions preserve source hashes, selected coverage and synoptic witness identities", () => {
  const acquisitions = read("scripts/early/sources/acquisitions.json");
  const extraction = read("scripts/early/sources/extraction-audit.json");
  assert.equal(acquisitions.length, 14);
  for (const input of acquisitions) {
    const record = manifest.records.find(r => r.id === input.id);
    const source = readEditionSource(record, undefined);
    assert.equal(hash(source), extraction.find(a => a.id === record.id).editionSha256);
    assert.equal(input.sha256, extraction.find(a => a.id === record.id).sourceSha256);
    assert.ok(catalog.find(r => r.id === record.id).primaryCharacters > 5000, record.id);
    assert.doesNotMatch(source, /\{[^{}]+:\d+\}|«[^»]+»|\*\*/);
  }
  assert.deepEqual(catalog.filter(r => r.group === "gnostic").map(r => r.id).sort(), ["gospel-philip", "gospel-truth", "hypostasis-archons", "origin-world", "secret-book-john", "treatise-resurrection"]);
  assert.equal(catalog.find(r => r.id === "gospel-thomas").group, "apocrypha");
  assert.equal(catalog.find(r => r.id === "gospel-mary").group, "apocrypha");
  const sections = id => catalog.find(r => r.id === id).sections.filter(s => s.kind === "primary-text");
  for (const [id, count] of [["hypostasis-archons", 10], ["origin-world", 28], ["treatise-resurrection", 11]]) assert.equal(sections(id).length, count);
  const john = sections("secret-book-john");
  assert.ok(john.some(s => s.id === "chapter-1-berlin-codex"));
  assert.ok(john.some(s => s.id === "chapter-1-codex-ii-iv"));
  assert.ok(john.some(s => s.id === "chapter-21-codex-iii"));
  assert.ok(john.every(s => /Codex/.test(s.label)));
  const headings = id => report.audits.find(a => a.id === id).sourceHeadings;
  for (const id of ["clement-alexandria-instructor", "athenagoras-plea"]) {
    assert.ok(sections(id).some(s => read(`content/early-library/readings/${id}/${s.id}.json`).blocks.some(b => b.kind === "primary-text" && b.text.includes("\n"))), `${id}: supplied verse lines`);
  }
  assert.equal(headings("athanasius-incarnation").filter(h => /^### Section \d+\b/.test(h)).length, 57);
  assert.equal(headings("cyril-catechetical-lectures").filter(h => /^### (?:Mystagogical )?Lecture \d+\b/.test(h)).length, 23);
  for (const name of ["Nisibene Hymns", "Hymns on the Nativity", "Hymns for Epiphany", "The Pearl"]) assert.ok(headings("ephrem-hymns").some(h => h.includes(name)), name);
});

test("repository sources fail closed on hash drift, ambiguous inputs and escaping paths", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "early-source-"));
  try {
    const dir = path.join(root, "scripts/early/sources");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "edition.md"), "reviewed text");
    const r = { id: "example", sourceRepositoryPath: "scripts/early/sources/edition.md", sourceSha256: hash("reviewed text") };
    assert.equal(readEditionSource(r, undefined, root), "reviewed text");
    assert.throws(() => readEditionSource({ ...r, sourceSha256: "changed" }, undefined, root), /hash mismatch/);
    assert.throws(() => readEditionSource({ ...r, sourcePath: "2_Individual_Books/a.md" }, root, root), /Ambiguous/);
    for (const file of ["scripts/early/sources/../secret.md", "public/edition.md", "scripts/early/sources/..\\secret.md"]) assert.throws(() => readEditionSource({ ...r, sourceRepositoryPath: file }, undefined, root), /Invalid edition source/);
    fs.writeFileSync(path.join(root, "outside.md"), "reviewed text");
    fs.symlinkSync(path.join(root, "outside.md"), path.join(dir, "link.md"));
    assert.throws(() => readEditionSource({ ...r, sourceRepositoryPath: "scripts/early/sources/link.md" }, undefined, root), /escapes edition directory/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("published output hashes, complete accounting and all legacy content stay intact", () => {
  assert.equal(report.importManifestSha256, hash(fs.readFileSync(path.join(ROOT, "scripts/early/library-import-manifest.json"))));
  for (const { path: file, sha256: digest } of report.outputs) assert.equal(hash(fs.readFileSync(path.join(ROOT, "content/early-library", file))), digest, file);
  for (const { path: file, sha256: digest } of manifest.legacyHashes) assert.equal(hash(fs.readFileSync(path.join(ROOT, file))), digest, file);
  assert.equal(report.audits.length, 103);
  for (const audit of report.audits) assert.equal(audit.bodySha256, audit.accountedSha256, audit.id);
});

test("complete Clement, multi-book works, recensions and fragment limits have concrete evidence", () => {
  const headings = id => report.audits.find(a => a.id === id).sourceHeadings;
  assert.equal(headings("1-clement").filter(h => /^### 1 Clem\. \d+$/.test(h)).length, 65);
  assert.equal(headings("2-clement").filter(h => /^### 2 Clem\. \d+$/.test(h)).length, 20);
  assert.equal(headings("josephus-antiquities-1-10").filter(h => /^### BOOK [IVX]+\./.test(h)).length, 10);
  assert.equal(headings("josephus-antiquities-11-20").filter(h => /^### BOOK [IVX]+\./.test(h)).length, 10);
  assert.ok(headings("testament-abraham").includes("### Version I."));
  assert.ok(headings("testament-abraham").includes("### Version II."));
  assert.equal(catalog.filter(r => r.id.startsWith("philo-")).length, 45);
  assert.equal(catalog.filter(r => r.id.startsWith("ignatius-") && r.provenance.some(p => p.includes("middle recension"))).length, 7);
  assert.equal(catalog.find(r => r.id === "josephus-antiquities-1-10").editionId, catalog.find(r => r.id === "josephus-antiquities-11-20").editionId);
  assert.ok(catalog.find(r => r.id === "josephus-antiquities-1-10").sections.some(s => s.id === "book-i-chapter-1"));
  assert.ok(catalog.find(r => r.id === "josephus-antiquities-11-20").sections.some(s => s.id === "book-xi-chapter-1"));
  assert.match(catalog.find(r => r.id === "2-baruch").provenance.join(" "), /524–526/);
  assert.match(catalog.find(r => r.id === "gospel-mary").coverage, /missing pages/);
  assert.equal(catalog.filter(r => r.rightsProfile === "dss-noncommercial").reduce((n, r) => n + r.witnesses.length, 0), 12);
  assert.match(catalog.find(r => r.id === "sinodos-horner-ethiopic").coverage, /not a complete edition/);
});

test("every page is bounded, has a unique citation, and points to real commentary anchors", () => {
  for (const r of catalog) {
    assert.equal(new Set(r.sections.map(s => s.id)).size, r.sections.length, r.id);
    for (const section of r.sections) {
      const p = read(`content/early-library/readings/${r.id}/${section.id}.json`);
      assert.equal(p.id, section.id);
      assert.ok(p.chars <= PAGE_LIMIT, `${r.id}/${p.id}`);
      assert.ok(Object.values(p.notes).reduce((n, note) => n + (note.text?.length ?? 0), 0) <= 8000);
      for (const [id, note] of Object.entries(p.notes)) {
        const [route, anchor] = note.href.split("#");
        const targetId = route.split("/").at(-1);
        assert.equal(anchor, `note-${id}`);
        const target = read(`content/early-library/readings/${r.id}/${targetId}.json`);
        assert.ok(target.blocks.some(b => b.noteId === id));
      }
    }
  }
});

test("search covers each text/commentary page separately and never includes restricted bodies", () => {
  const search = read("content/early-library/search.json");
  assert.equal(new Set(search.map(r => r.id)).size, search.length);
  for (const r of catalog) {
    const rows = search.filter(row => row.recordId === r.id);
    for (const s of r.sections) assert.ok(rows.some(row => row.href === `/early/library/${r.id}/${s.id}`));
    if (r.publicationStatus !== "published") assert.deepEqual(rows.map(row => row.kind), ["reference-only"]);
    if (r.reuseExistingText) assert.ok(rows.every(row => row.kind !== "primary-text"));
  }
  const note = fs.readFileSync(path.join(ROOT, "src/lib/early/library.ts"), "utf8").match(/LIBRARY_MEANING_NOTE = "([^"]+)"/)[1];
  assert.equal(report.semanticSearch, note);
  assert.match(fs.readFileSync(path.join(ROOT, "scripts/early/import-library.mjs"), "utf8"), new RegExp(note.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(report.allusions, /Existing editions only/);
});

test("meaning entries cover new translated sections and skip commentary-only pages", () => {
  const entries = collectLibrary(ROOT).entries;
  const reused = new Set(catalog.filter(r => r.publicationStatus !== "published" || r.reuseExistingText).map(r => r.id));
  assert.equal(entries.length, 4773);
  const ids = new Set();
  for (const entry of entries) {
    assert.equal(ids.has(entry.id), false);
    ids.add(entry.id);
    assert.equal(reused.has(entry.recordId), false);
    assert.equal(entry.href, `/early/library/${entry.recordId}/${entry.sectionId}`);
    assert.match(entry.sourcePath, /^content\/early-library\/readings\/[a-z0-9-]+\/[a-z0-9-]+\.json$/);
    const page = read(entry.sourcePath);
    assert.ok(page.blocks.some(block => block.kind === "primary-text" && !block.noteId));
    assert.equal(entry.text.includes("\n"), false);
  }
});

test("parser handles interleaved footnotes and nested book numbering without losing text", () => {
  const record = { id: "sample", parser: "structured" };
  const input = "# Metadata\n\n---\n\n### Book I\n\n### Chapter I\n\nFirst text [^n1].\n\n## Translator and historical edition notes\n\nThese notes belong to the source edition; they are not part of the ancient work.\n\n[^n1]: Historical commentary.\n\n### Book II\n\n### Chapter I\n\nSecond text.";
  const parsed = parseEdition(input, record);
  assert.equal(parsed.audit.bodySha256, parsed.audit.accountedSha256);
  assert.ok(parsed.pages.some(p => p.label.includes("Book I — Chapter I")));
  assert.ok(parsed.pages.some(p => p.label.includes("Book II — Chapter I")));
  assert.ok(parsed.pages.some(p => p.blocks.some(b => b.kind === "commentary")));
  assert.throws(() => parseEdition(input.replace("[^n1]: Historical commentary.", ""), record), /unresolved note/);
});
