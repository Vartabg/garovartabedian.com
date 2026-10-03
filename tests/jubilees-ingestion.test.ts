import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  appendFileSync, copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  manifest, normalizeWhitespace, parseChapter, reconstructJubilees,
  sourceDirectory, validateExcerpt,
} from "../scripts/scriptures/reconstruct-jubilees.mjs";

const root = process.cwd();
const emptyReview = { missingListMarkers: [], boundaryRepairs: [] };
const source = (chapter: number) => readFileSync(
  path.join(sourceDirectory, `${String(chapter).padStart(2, "0")}.html`), "utf8",
);
const html = (items: string[], chapter = 1, heading = "h5") =>
  `<title>Jubilees ${chapter}</title><${heading}>[Chapter ${chapter}]</${heading}><ol>${items.map((item) => `<li>${item}</li>`).join("")}</ol>`;
let reconstructed: ReturnType<typeof reconstructJubilees>;
const book = () => reconstructed ??= reconstructJubilees();
const excerpt = () => JSON.parse(readFileSync(
  path.join(root, "public/parallels/sources/jubilees-17-18.json"), "utf8",
)) as { sections: Record<string, string> };

test("the pinned offline sources deterministically reconstruct all 50 chapters and 1307 verses", () => {
  const first = book();
  assert.deepEqual({ trans: first.trans, book: first.book, name: first.name }, {
    trans: "charles", book: "JUB", name: "Jubilees",
  });
  assert.equal(first.chapters.length, 50);
  assert.equal(first.chapters.flat().length, 1307);
  assert.ok(first.chapters.every((chapter: string[]) =>
    chapter.length > 0 && chapter.every((verse) => verse.trim().length > 0)));
  assert.deepEqual(reconstructJubilees(), first);
});

test("reconstructed chapters retain every source word, editorial marker, date and punctuation mark", () => {
  for (let chapter = 1; chapter <= 50; chapter += 1) {
    const dom = new JSDOM(source(chapter));
    try {
      const original = [...dom.window.document.querySelectorAll("ol > li")]
        .map((item) => item.textContent?.replace(/\s+/gu, " ").trim()).join(" ");
      assert.equal(book().chapters[chapter - 1].join(" "), original, `Chapter ${chapter}`);
    } finally {
      dom.window.close();
    }
  }
  assert.match(book().chapters[0][0], /\[2450 Anno Mundi\]/);
  assert.ok(book().chapters[25][21].includes("<full>"));
});

test("lost list markers and reviewed boundary moves restore specific references", () => {
  assert.equal(book().chapters[0].length, 29);
  assert.match(book().chapters[0][8], /^For they will forget all My commandments/);
  assert.equal(book().chapters[10].length, 24);
  assert.match(book().chapters[10][3], /^And they made for themselves molten images/);
  assert.match(book().chapters[10][14], /^And in the seventh year of this week/);
  assert.match(book().chapters[25][5], /^And now, my son, obey my voice/);
  assert.match(book().chapters[38][1], /^These are the generations of Jacob\./);
  assert.match(book().chapters[43][5], /^I will go down with thee/);
  assert.match(book().chapters[47][9], /^the evils indeed we permitted them to work/);
  assert.doesNotMatch(book().chapters[43][4], /I will go down with thee/);
});

test("multiple missing markers use original entry numbers and preserve the full passage", () => {
  const result = parseChapter(html(["First. Second.", "Third. Fourth."]), 1, 4, {
    missingListMarkers: [
      { chapter: 1, entry: 1, before: "Second." },
      { chapter: 1, entry: 2, before: "Fourth." },
    ],
    boundaryRepairs: [],
  });
  assert.deepEqual(result, ["First.", "Second.", "Third.", "Fourth."]);
});

test("a boundary can move in either direction without changing passage text", () => {
  const result = parseChapter(html(["First.", "Second. Third.", "Fourth. Fifth.", "Sixth."]), 1, 4, {
    missingListMarkers: [],
    boundaryRepairs: [
      { chapter: 1, verse: 2, before: "Third." },
      { chapter: 1, verse: 4, before: "Fifth." },
    ],
  });
  assert.deepEqual(result, ["First. Second.", "Third.", "Fourth.", "Fifth. Sixth."]);
});

test("only the expected chapter heading and complete verse list are accepted", () => {
  assert.deepEqual(parseChapter(html(["One.", "Two."], 2, "p"), 2, 2, emptyReview), ["One.", "Two."]);
  for (const invalid of [
    html(["One."]).replace("Jubilees 1", "Jubilees 2"),
    html(["One."]).replace("[Chapter 1]", "[Chapter 2]"),
    html(["One."]).replace(/<h5>.*?<\/h5>/u, ""),
  ]) {
    assert.throws(() => parseChapter(invalid, 1, 1, emptyReview), /source heading does not match/);
  }
  assert.throws(() => parseChapter(html(["One."]), 1, 2, emptyReview), /expected 2 verses, received 1/);
  for (const invalid of ["", "\uFFFD"]) {
    assert.throws(() => parseChapter(html([invalid]), 1, 1, emptyReview), /empty or undecodable/);
  }
});

test("unexpected list content cannot be silently discarded by the conservation check", () => {
  for (const extra of ["Untracked words.", "<p>Untracked words.</p>", "<div>Untracked words.</div>"]) {
    const invalid = html(["One.", "Two."]).replace("</ol>", `${extra}</ol>`);
    assert.throws(() => parseChapter(invalid, 1, 2, emptyReview), /outside verse list items/);
  }
  for (const embedded of ["<script>hidden()</script>", "<style>.hidden{}</style>", "<img src='x'>", "<ol><li>Nested.</li></ol>"]) {
    assert.throws(() => parseChapter(html([`One. ${embedded}`]), 1, 1, emptyReview), /plain verse list/);
  }
});

test("missing-marker repairs reject absent, ambiguous and empty splits", () => {
  for (const [passage, before, message] of [
    ["First. Second.", "Absent.", /exactly once/],
    ["First. Second. Second.", "Second.", /exactly once/],
    ["First. Second.", "First.", /empty verse/],
    ["First. Second.", " ", /empty repair prefix/],
  ] as const) {
    assert.throws(() => parseChapter(html([passage]), 1, 2, {
      missingListMarkers: [{ chapter: 1, entry: 1, before }], boundaryRepairs: [],
    }), message);
  }
  assert.throws(() => parseChapter(html(["First. Second."]), 1, 2, {
    missingListMarkers: [{ chapter: 1, entry: 99, before: "Second." }], boundaryRepairs: [],
  }), /missing repair entry 99/);
});

test("invalid, duplicate, ambiguous and crossing verse boundaries fail closed", () => {
  const fixture = html(["First.", "Second.", "Third."]);
  for (const verse of [0, 1, 4, 2.5]) {
    assert.throws(() => parseChapter(fixture, 1, 3, {
      missingListMarkers: [], boundaryRepairs: [{ chapter: 1, verse, before: "Second." }],
    }), /invalid or duplicate repaired verse/);
  }
  assert.throws(() => parseChapter(fixture, 1, 3, {
    missingListMarkers: [], boundaryRepairs: [
      { chapter: 1, verse: 2, before: "Second." },
      { chapter: 1, verse: 2, before: "Third." },
    ],
  }), /invalid or duplicate repaired verse/);
  for (const before of ["Missing.", "."]) {
    assert.throws(() => parseChapter(fixture, 1, 3, {
      missingListMarkers: [], boundaryRepairs: [{ chapter: 1, verse: 2, before }],
    }), /exactly once/);
  }
  assert.throws(() => parseChapter(fixture, 1, 3, {
    missingListMarkers: [], boundaryRepairs: [
      { chapter: 1, verse: 2, before: "Third." },
      { chapter: 1, verse: 3, before: "Second." },
    ],
  }), /not in reading order/);
});

test("a source checksum mismatch prevents reconstruction", (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), "jubilees-checksum-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  writeFileSync(path.join(directory, "01.html"), `${source(1)}\n`);
  assert.throws(() => reconstructJubilees({ sources: directory }), /Chapter 1: archived source checksum mismatch/);
});

test("all 23 independent excerpt verses must match, including their precise wording", () => {
  const reviewed = excerpt();
  assert.doesNotThrow(() => validateExcerpt(book(), reviewed));
  const missing = structuredClone(reviewed);
  delete missing.sections["18:19"];
  assert.throws(() => validateExcerpt(book(), missing), /all 23/);
  const changed = structuredClone(reviewed);
  changed.sections["17:15"] = `Added wording. ${changed.sections["17:15"]}`;
  assert.throws(() => validateExcerpt(book(), changed), /17:15: does not match/);
  const spaced = structuredClone(reviewed);
  spaced.sections["17:15"] = spaced.sections["17:15"].replaceAll(" ", " \n ");
  assert.doesNotThrow(() => validateExcerpt(book(), spaced));
});

test("CLI validation failure and check mode leave existing publication untouched", (t) => {
  const fixture = mkdtempSync(path.join(tmpdir(), "jubilees-publication-"));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const scripts = path.join(fixture, "scripts/scriptures");
  const outputDirectory = path.join(fixture, "public/scriptures/text/charles");
  mkdirSync(scripts, { recursive: true });
  mkdirSync(path.join(fixture, "scripts/lib"), { recursive: true });
  mkdirSync(path.join(fixture, "public/parallels/sources"), { recursive: true });
  mkdirSync(outputDirectory, { recursive: true });
  symlinkSync(path.join(root, "node_modules"), path.join(fixture, "node_modules"), "dir");
  for (const name of ["ingest-jubilees.mjs", "reconstruct-jubilees.mjs"]) {
    copyFileSync(path.join(root, "scripts/scriptures", name), path.join(scripts, name));
  }
  copyFileSync(path.join(root, "scripts/lib/atomic-publication.mjs"), path.join(fixture, "scripts/lib/atomic-publication.mjs"));
  cpSync(sourceDirectory, path.join(scripts, "sources/charles-jubilees-1913"), { recursive: true });
  writeFileSync(path.join(fixture, "public/parallels/sources/jubilees-17-18.json"), JSON.stringify(excerpt()));
  const destination = path.join(outputDirectory, "JUB.json");
  const sentinel = "Existing publication must survive.\n";
  writeFileSync(destination, sentinel);
  const run = (args: string[]) => spawnSync(process.execPath, [path.join(scripts, "ingest-jubilees.mjs"), ...args], {
    cwd: fixture, encoding: "utf8", timeout: 30_000,
  });

  const checked = run(["--check"]);
  assert.ifError(checked.error);
  assert.notEqual(checked.status, 0);
  assert.match(checked.stderr, /Published Jubilees text differs/);
  assert.equal(readFileSync(destination, "utf8"), sentinel);

  appendFileSync(path.join(scripts, "sources/charles-jubilees-1913/01.html"), "\n");
  const rejected = run([]);
  assert.ifError(rejected.error);
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /archived source checksum mismatch/);
  assert.equal(readFileSync(destination, "utf8"), sentinel);
  assert.deepEqual(readdirSync(outputDirectory), ["JUB.json"]);
});

test("the source review records printed evidence and excludes the unresolved 20:9 move", () => {
  assert.equal(manifest.editionYear, 1913);
  for (const repair of [...manifest.missingListMarkers, ...manifest.boundaryRepairs]) {
    assert.ok(repair.printedPages.length > 0);
    assert.ok(repair.printedPages.every((page: number) => Number.isInteger(page) && page >= 11 && page <= 82));
    assert.equal(normalizeWhitespace(repair.before), repair.before);
  }
  assert.ok(!manifest.boundaryRepairs.some((repair: { chapter: number; verse: number }) =>
    repair.chapter === 20 && repair.verse === 9));
});
