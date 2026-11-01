import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { getLibraryPage, getLibraryRecord } from "../src/lib/early/library-server";
import { sectionHref } from "../src/lib/early/library";
import Reading from "../src/app/early/library/[edition]/[section]/page";
import Edition from "../src/app/early/library/[edition]/page";
import { routes } from "../scripts/a11y/config.mjs";

const SAYINGS = 114;
const render = async (element: Promise<React.ReactElement>) => new JSDOM(renderToStaticMarkup(await element)).window.document;

test("every saying of Thomas keeps its own stable library URL", async () => {
  const record = (await getLibraryRecord("gospel-thomas"))!;
  assert.equal(record.reuseExistingText, false, "the library edition stays the reading text");
  const ids = ["prologue", ...Array.from({ length: SAYINGS }, (_, i) => `saying-${i + 1}`)];
  for (const id of ids) {
    const section = record.sections.find(s => s.id === id);
    assert.ok(section, `missing ${id}`);
    assert.equal(sectionHref(record, section), `/early/library/gospel-thomas/${id}`);
    if (id !== "prologue") assert.match(section.label, new RegExp(`^Saying ${id.slice(7)}: `));
    const page = await getLibraryPage("gospel-thomas", id);
    assert.ok(page?.blocks.some(b => b.kind === "primary-text"), `${id} has no translated text`);
  }
  // Snodgrass's Stories with Intent cites these for the Banquet and the Wicked Tenants.
  const text = async (id: string) => (await getLibraryPage("gospel-thomas", id))!.blocks.map(b => b.text).join(" ");
  assert.match(await text("saying-64"), /Someone was planning on having guests/);
  assert.match(await text("saying-65"), /vineyard/);
  assert.match(await text("saying-66"), /the stone the builders rejected/);
});

test("a saying page renders the canon label above the saying", async () => {
  const document = await render(Reading({ params: Promise.resolve({ edition: "gospel-thomas", section: "saying-64" }) }));
  const label = document.querySelector(".ew-canon-status");
  assert.match(label?.textContent ?? "", /^Outside the canon\./);
  assert.equal(label?.querySelector("a")?.getAttribute("href"), "/scriptures");
  assert.match(document.querySelector("#reading-heading")?.textContent ?? "", /^Saying 64: The Parable of the Dinner Party/);
  assert.ok(label!.compareDocumentPosition(document.querySelector("#reading-heading")!) & 4, "label comes before the saying");
  // Editions inside the canon's orbit carry no label.
  const other = await render(Reading({ params: Promise.resolve({ edition: "1-clement", section: (await getLibraryRecord("1-clement"))!.sections[0].id }) }));
  assert.equal(other.querySelector(".ew-canon-status"), null);
});

test("the edition page states the license, dating and witnesses with their sources", async () => {
  const record = (await getLibraryRecord("gospel-thomas"))!;
  assert.match(record.sourceRights, /https:\/\/www\.gospels\.net\/thomas, checked \d{4}-\d{2}-\d{2}: “The following translation has been committed to the public domain and may be freely copied and used, changed or unchanged, for any purpose\.”/);
  assert.deepEqual(record.witnesses.map(w => w.split(" — ")[0]), ["Nag Hammadi Codex II,2", "P.Oxy. 1", "P.Oxy. 654", "P.Oxy. 655"]);
  assert.match(record.compositionDate ?? "", /^Debated\./);
  assert.ok(record.provenance.some(p => p.includes("https://www.gospels.net/manuscript")));
  assert.ok(record.provenance.some(p => p.includes("Simon Gathercole, The Composition of the Gospel of Thomas (Cambridge University Press, 2012")));
  const document = await render(Edition({ params: Promise.resolve({ edition: "gospel-thomas" }) }));
  const text = document.body.textContent ?? "";
  for (const expected of [record.canonStatus!, record.compositionDate!, "P.Oxy. 654", "Gathercole", "freely copied and used"]) assert.ok(text.includes(expected), expected);
  // The label must stay true of the Scriptures shelf it points to.
  const canons = JSON.parse(readFileSync("public/scriptures/canons.json", "utf8")) as { books: Record<string, { name: string }> };
  assert.ok(Object.values(canons.books).every(book => !/Thomas/.test(book.name)));
  assert.ok(routes.includes("/early/library/gospel-thomas/saying-64"));
});

test("Thomas puts the reading entry and all saying links before its source notes", async () => {
  const document = await render(Edition({ params: Promise.resolve({ edition: "gospel-thomas" }) }));
  const start = [...document.querySelectorAll("a")].filter(a => a.textContent === "Start reading →");
  assert.equal(start.length, 1);
  assert.equal(start[0].getAttribute("href"), "/early/library/gospel-thomas/prologue");
  const page = await getLibraryPage("gospel-thomas", "prologue");
  assert.ok(page?.blocks.some(b => b.kind === "primary-text" && b.text.includes("hidden sayings")));
  const contents = document.querySelector("#contents")!;
  const sources = document.querySelector("#edition-source")!;
  const caution = document.querySelector('[aria-label="Edition limitations"]')!;
  assert.ok(start[0].compareDocumentPosition(contents) & 4, "Start reading precedes contents");
  assert.ok(contents.compareDocumentPosition(caution) & 4, "contents precede editorial cautions");
  assert.ok(contents.compareDocumentPosition(sources) & 4, "contents precede sources");
  for (let saying = 1; saying <= SAYINGS; saying++) {
    assert.ok(contents.querySelector(`a[href="/early/library/gospel-thomas/saying-${saying}"]`));
  }
});
