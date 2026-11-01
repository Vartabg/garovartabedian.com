import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { getLibrary } from "../src/lib/early/library-server";
import Reading from "../src/app/early/library/[edition]/[section]/page";
import { ShelfCanonStatus } from "../src/app/early/library/CanonStatus";

const render = async (element: Promise<React.ReactElement>) => new JSDOM(renderToStaticMarkup(await element)).window.document;
const LABEL = /^Outside the canon\. (.+) is not in the Bible of any tradition on the Scriptures shelf\. It is hosted here as a historical record\.$/;

test("every readable gnostic and apocryphal edition says plainly that it is outside the canon, with its canon check", async () => {
  const library = await getLibrary();
  const canons = JSON.parse(readFileSync("public/scriptures/canons.json", "utf8")) as { books: Record<string, { name: string }> };
  const books = new Set(Object.values(canons.books).map(book => book.name.toLowerCase()));
  const labelled = library.filter(record => record.canonStatus);
  assert.deepEqual(
    labelled.map(record => record.id).sort(),
    library.filter(record => ["gnostic", "apocrypha"].includes(record.group) && record.publicationStatus === "published").map(record => record.id).sort(),
    "only checked gnostic and apocryphal editions carry the label",
  );
  assert.equal(labelled.length, 15);
  for (const record of labelled) {
    const work = LABEL.exec(record.canonStatus!)?.[1];
    assert.ok(work, `${record.id} label wording`);
    assert.equal(books.has(work.replace(/^(The work|This|The) /, "").toLowerCase()), false, `${record.id} is a book on the Scriptures shelf`);
    const check = record.provenance.find(note => note.startsWith("Canon check, "));
    assert.ok(check?.includes("ethiopianorthodox.org") && check.includes("Cowley") && check.includes("Stone"), `${record.id} canon check sources`);
  }
});

test("the label renders on library reading pages and on shelf texts a labelled edition reuses", async () => {
  const library = await getLibrary();
  const mary = library.find(record => record.id === "gospel-mary")!;
  const reading = await render(Reading({ params: Promise.resolve({ edition: "gospel-mary", section: mary.sections.find(s => s.kind !== "commentary")!.id }) }));
  assert.match(reading.querySelector(".ew-canon-status")?.textContent ?? "", /^Outside the canon\. The Gospel of Mary /);
  const ascension = await render(ShelfCanonStatus({ textId: "ascension-isaiah" }) as Promise<React.ReactElement>);
  assert.match(ascension.querySelector(".ew-canon-status")?.textContent ?? "", /^Outside the canon\. The Ascension of Isaiah /);
  const epistula = await render(ShelfCanonStatus({ textId: "epistula-apostolorum" }) as Promise<React.ReactElement>);
  assert.match(epistula.querySelector(".ew-canon-status")?.textContent ?? "", /^Outside the canon\. The Epistula Apostolorum /);
  assert.equal(await ShelfCanonStatus({ textId: "1clement" }), null);
});
