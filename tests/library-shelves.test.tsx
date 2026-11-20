import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { getLibrary } from "../src/lib/early/library-server";
import { LIBRARY_GROUPS } from "../src/lib/early/library";
import { buildShelves, filterShelves, shelfNames, shelfUnits } from "../src/lib/early/library-shelves";
import Library from "../src/app/early/library/page";

const render = async (params: { q?: string; group?: string; work?: string } = {}) =>
  new JSDOM(renderToStaticMarkup(await Library({ searchParams: Promise.resolve(params) }))).window.document;
const text = (node: Element | null) => (node?.textContent ?? "").replace(/\s+/g, " ").trim();

test("the library opens on its shelves, closed, with every entry inside exactly one of them", async () => {
  const catalog = await getLibrary();
  const page = await render();
  const shelves = [...page.querySelectorAll("details.ew-shelf")];

  assert.deepEqual(shelves.map((shelf) => shelf.id), LIBRARY_GROUPS.map((group) => `collection-${group.id}`));
  assert.equal(shelves.filter((shelf) => shelf.hasAttribute("open")).length, 0, "every shelf starts closed");
  assert.deepEqual(shelves.map((shelf) => text(shelf.querySelector("summary h2"))), LIBRARY_GROUPS.map((group) => group.label));
  assert.equal(
    shelves.reduce((sum, shelf) => sum + Number.parseInt(text(shelf.querySelector(".ew-shelf-count")), 10), 0),
    catalog.length,
    "the shelf counts add up to the catalog",
  );
  for (const record of catalog) {
    assert.equal(page.querySelectorAll(`.ew-shelves a[href="/early/library/${record.id}"]`).length, 1, `${record.id} has one row`);
  }

  // One find box and one count line above the shelves; nothing else before the list.
  const article = page.querySelector("article")!;
  assert.deepEqual(
    [...article.children].slice(0, 4).map((child) => `${child.tagName.toLowerCase()}.${child.className.split(" ").pop()}`),
    ["h1.", "p.ew-library-counts", "form.ew-library-find", "div.ew-shelves"],
  );
  assert.equal(
    text(page.querySelector(".ew-library-counts")),
    `${catalog.length} entries on 7 shelves · ${catalog.filter((r) => r.publicationStatus === "published").length} to read · ${catalog.filter((r) => r.publicationStatus === "reference-only").length} reference only · ${catalog.filter((r) => r.publicationStatus === "deferred").length} not yet acquired`,
  );
  assert.equal(page.querySelectorAll("form.ew-library-find input[type=search]").length, 1);
  assert.equal(page.querySelectorAll(".scr-card, nav.ew-era-nav, form.ew-library-find select, form.ew-library-find button").length, 0);

  // The other search tools and the care notes follow the list; none of them is dropped.
  const order = (selector: string) => [...article.querySelectorAll("*")].indexOf(article.querySelector(selector)!);
  assert.ok(order(".ew-shelves") < order('a[href="/early/search"]'));
  assert.ok(order('a[href="/early/search"]') < order(".meaning-rail"));
  assert.ok(order(".meaning-rail") < order("aside.world-survival"));
  assert.match(text(page.querySelector("aside.world-survival")), /These groupings describe a library, not a universal canon\./);
  assert.match(text(page.querySelector("aside.world-survival")), /Parts and editions can share a work\./);
});

test("a row says a status only when the entry cannot be read here", async () => {
  const catalog = await getLibrary();
  const page = await render();
  const flags = [...page.querySelectorAll(".ew-shelves .ew-shelf-row small em")].map(text);
  assert.equal(flags.filter((flag) => flag === "Reference only").length, catalog.filter((r) => r.publicationStatus === "reference-only").length);
  assert.equal(flags.filter((flag) => flag === "Not yet acquired").length, catalog.filter((r) => r.publicationStatus === "deferred").length);
  assert.equal(flags.length, catalog.filter((r) => r.publicationStatus !== "published").length);
  assert.doesNotMatch(text(page.querySelector(".ew-shelves")), /Read edition|Full text not acquired|Also on the original shelf/);
});

test("a name that leads three or more of a shelf's entries folds into one row", async () => {
  const shelves = buildShelves(await getLibrary());
  const folds = Object.fromEntries(
    shelves.map((shelf) => [
      shelf.id,
      shelfUnits(shelf.entries).flatMap((unit) => (unit.kind === "author" ? [`${unit.name} ${unit.entries.length} · ${unit.edition}`] : [])),
    ]),
  );
  // Pinned to the catalog: a new fold or a lost one is a visible change to the page.
  assert.deepEqual(folds, {
    jewish: [],
    fathers: ["Ignatius 7 · J. B. Lightfoot"],
    apocrypha: [],
    gnostic: [],
    interpreters: ["Justin Martyr 3 · ANF historical edition"],
    historical: ["Philo 45 · C. D. Yonge (1854–1855)", "Josephus 5 · William Whiston (1737)"],
    orders: [],
  });

  for (const shelf of shelves) {
    const units = shelfUnits(shelf.entries);
    const seen = units.flatMap((unit) => (unit.kind === "author" ? unit.entries.map((item) => item.entry.id) : [unit.entry.id]));
    assert.deepEqual([...seen].sort(), shelf.entries.map((entry) => entry.id).sort(), `${shelf.id} keeps every entry once`);
    for (const unit of units) {
      if (unit.kind !== "author") continue;
      for (const item of unit.entries) assert.equal(item.entry.title, `${unit.name}: ${item.title}`);
    }
    assert.equal(new Set(shelfNames(units)).size, shelfNames(units).length, `${shelf.id} names each thing once`);
  }
  const names = (id: string) => shelfNames(shelfUnits(shelves.find((shelf) => shelf.id === id)!.entries));
  assert.deepEqual(names("historical").slice(0, 2), ["Philo", "Josephus"]);
  assert.deepEqual(names("jewish").slice(0, 3), ["Testaments of the Twelve Patriarchs", "Testament of Abraham", "Community Rule"]);

  // A pair stays as two rows.
  const pair = shelfUnits([
    { id: "a", href: "/a", title: "Origen: On First Principles", edition: "x", status: "published", workId: "a" },
    { id: "b", href: "/b", title: "Origen: Against Celsus", edition: "x", status: "published", workId: "b" },
  ]);
  assert.deepEqual(pair.map((unit) => unit.kind), ["entry", "entry"]);

  // A fold names its edition only when every entry under it shares one.
  const mixed = shelfUnits(
    ["x", "x", "y"].map((edition, index) => ({ id: `m${index}`, href: `/m${index}`, title: `Origen: Book ${index}`, edition, status: "published" as const, workId: `m${index}` })),
  );
  assert.deepEqual(mixed.map((unit) => (unit.kind === "author" ? [unit.name, unit.edition, unit.entries.length] : null)), [["Origen", null, 3]]);
});

test("the address can open a shelf or list the matching rows without JavaScript", async () => {
  const shelves = buildShelves(await getLibrary());

  const gnostic = await render({ group: "gnostic" });
  assert.deepEqual([...gnostic.querySelectorAll("details.ew-shelf[open]")].map((shelf) => shelf.id), ["collection-gnostic"]);
  assert.equal(gnostic.querySelectorAll("#collection-gnostic > .ew-shelf-rows > li").length, 6);
  assert.match(text(gnostic.querySelector("#collection-gnostic .ew-shelf-note")), /inclusion does not assign canonical status\.$/);

  const found = await render({ q: "clem" });
  assert.deepEqual(
    [...found.querySelectorAll(".ew-shelf-results .ew-shelf-row strong")].map(text),
    ["1 Clement", "2 Clement", "Clement of Alexandria: The Instructor", "Ethiopic Clement / Qalementos"],
  );
  assert.match(text(found.querySelector(".ew-shelf-results [role=status]")), /^4 entries match\. Show all shelves$/);
  assert.ok(found.querySelector(".ew-shelves")!.hasAttribute("hidden"), "the shelves give way to the matches");
  assert.equal((found.querySelector("form.ew-library-find input[type=search]") as HTMLInputElement).value, "clem");

  const none = await render({ q: "zzzz" });
  assert.match(text(none.querySelector(".ew-shelf-results [role=status]")), /^No entries match\. Show all shelves$/);

  const work = await render({ work: "josephus-antiquities" });
  assert.equal(work.querySelectorAll(".ew-shelf-results .ew-shelf-row").length, 2);

  assert.equal(filterShelves(shelves, "WHISTON").flatMap((shelf) => shelf.entries).length, 5, "an edition name finds its entries, any case");
  assert.equal(filterShelves(shelves, "  ").flatMap((shelf) => shelf.entries).length, shelves.flatMap((shelf) => shelf.entries).length);
});
