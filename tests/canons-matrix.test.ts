import test from "node:test";
import assert from "node:assert/strict";
import {
  CANONICAL_BOOKS,
  HISTORICAL_MILESTONES,
  compareTwoTraditions,
} from "@/lib/scriptures/canons-matrix";
import { parseCanonQuery, assembleFindGroups } from "@/lib/site/find-query";
import { FIND_CATALOG } from "@/lib/site/find-catalog";

test("Multi-Canonicity & Tradition Matrix", async (t) => {
  await t.test("indexes all 86 hosted canonical and deuterocanonical books", () => {
    assert.equal(CANONICAL_BOOKS.length, 86);

    for (const book of CANONICAL_BOOKS) {
      assert.ok(book.id.length > 0, "id is not empty");
      assert.ok(book.name.length > 0, `name is not empty for ${book.id}`);
      assert.ok(book.chapters > 0, `chapters > 0 for ${book.id}`);
      assert.ok(book.category.length > 0, `category is not empty for ${book.id}`);
      assert.ok(book.categoryName.length > 0, `categoryName is not empty for ${book.id}`);
      assert.ok(book.manuscripts.length > 0, `manuscripts not empty for ${book.id}`);
      assert.ok(book.historicalNote.length > 0, `historicalNote not empty for ${book.id}`);
      assert.ok(book.href.startsWith("/scriptures/"), `href is valid for ${book.id}`);
    }
  });

  await t.test("confirms canonical book counts across traditions", () => {
    const protBooks = CANONICAL_BOOKS.filter((b) => b.inTraditions.protestant);
    assert.equal(protBooks.length, 66, "Protestant canon has exactly 66 books");

    const cathBooks = CANONICAL_BOOKS.filter((b) => b.inTraditions.catholic);
    assert.equal(cathBooks.length, 73, "Catholic canon has 73 books (plus Greek additions)");

    const orthBooks = CANONICAL_BOOKS.filter((b) => b.inTraditions.orthodox);
    assert.ok(orthBooks.length >= 76, "Orthodox canon has 76+ books");

    const ethBooks = CANONICAL_BOOKS.filter((b) => b.inTraditions.ethiopian);
    assert.ok(ethBooks.length >= 78, "Ethiopian hosted overlap includes 78+ books");

    const tanakhBooks = CANONICAL_BOOKS.filter((b) => b.inTraditions.tanakh);
    assert.equal(tanakhBooks.length, 39, "Tanakh covers the 39 Hebrew books");
  });

  await t.test("verifies key deuterocanonical and pseudepigraphal books", () => {
    const enoch = CANONICAL_BOOKS.find((b) => b.id === "ENO");
    assert.ok(enoch, "1 Enoch is present in matrix");
    assert.equal(enoch.inTraditions.ethiopian, true);
    assert.equal(enoch.inTraditions.protestant, false);
    assert.ok(enoch.manuscripts.includes("DSS"));
    assert.ok(enoch.manuscripts.includes("Ge'ez"));

    const jubilees = CANONICAL_BOOKS.find((b) => b.id === "JUB");
    assert.ok(jubilees, "Jubilees is present in matrix");
    assert.equal(jubilees.inTraditions.ethiopian, true);
    assert.equal(jubilees.inTraditions.protestant, false);

    const tobit = CANONICAL_BOOKS.find((b) => b.id === "TOB");
    assert.ok(tobit);
    assert.equal(tobit.inTraditions.catholic, true);
    assert.equal(tobit.inTraditions.orthodox, true);
    assert.equal(tobit.inTraditions.protestant, false);

    const mac3 = CANONICAL_BOOKS.find((b) => b.id === "3MA");
    assert.ok(mac3);
    assert.equal(mac3.inTraditions.orthodox, true);
    assert.equal(mac3.inTraditions.catholic, false);
    assert.equal(mac3.inTraditions.protestant, false);
  });

  await t.test("correctly computes pairwise tradition diffs in comparator", () => {
    // Catholic vs Protestant
    const diffCP = compareTwoTraditions("catholic", "protestant");
    assert.equal(diffCP.shared.length, 66, "Catholic and Protestant share 66 books");
    assert.ok(diffCP.onlyInA.length >= 7, "Catholic has deuterocanon not in Protestant");
    assert.equal(diffCP.onlyInB.length, 0, "Protestant has 0 books absent in Catholic");
    const catholicOnlyIds = diffCP.onlyInA.map((b) => b.id);
    assert.ok(catholicOnlyIds.includes("TOB"));
    assert.ok(catholicOnlyIds.includes("JDT"));
    assert.ok(catholicOnlyIds.includes("WIS"));
    assert.ok(catholicOnlyIds.includes("SIR"));
    assert.ok(catholicOnlyIds.includes("1MA"));
    assert.ok(catholicOnlyIds.includes("2MA"));

    // Orthodox vs Catholic
    const diffOC = compareTwoTraditions("orthodox", "catholic");
    const orthOnlyIds = diffOC.onlyInA.map((b) => b.id);
    assert.ok(orthOnlyIds.includes("1ES"), "1 Esdras is Orthodox but not Roman Catholic");
    assert.ok(orthOnlyIds.includes("3MA"), "3 Maccabees is Orthodox but not Roman Catholic");
    assert.ok(orthOnlyIds.includes("PS2"), "Psalm 151 is Orthodox but not Roman Catholic");
    assert.ok(orthOnlyIds.includes("MAN"), "Prayer of Manasseh is Orthodox but not Roman Catholic");

    // Ethiopian vs Protestant
    const diffEP = compareTwoTraditions("ethiopian", "protestant");
    const ethOnlyIds = diffEP.onlyInA.map((b) => b.id);
    assert.ok(ethOnlyIds.includes("ENO"), "1 Enoch is unique to Ethiopian canon");
    assert.ok(ethOnlyIds.includes("JUB"), "Jubilees is unique to Ethiopian canon");
  });

  await t.test("includes major historical conciliar milestones", () => {
    assert.ok(HISTORICAL_MILESTONES.length >= 6);
    const years = HISTORICAL_MILESTONES.map((m) => m.year);
    assert.ok(years.includes(382), "Council of Rome");
    assert.ok(years.includes(397), "Council of Carthage");
    assert.ok(years.includes(1546), "Council of Trent");
    assert.ok(years.includes(1563), "39 Articles");
    assert.ok(years.includes(1646), "Westminster Confession");
    assert.ok(years.includes(1672), "Synod of Jerusalem");
  });

  await t.test("parses canon query commands and Find actions", () => {
    const q1 = parseCanonQuery("canon catholic");
    assert.ok(q1);
    assert.equal(q1.href, "/scriptures/canons#canons-matrix");

    const q2 = parseCanonQuery("compare catholic and protestant");
    assert.ok(q2);
    assert.equal(q2.href, "/scriptures/canons#canons-matrix");

    const q3 = parseCanonQuery("canons");
    assert.ok(q3);
    assert.equal(q3.href, "/scriptures/canons");

    const groups = assembleFindGroups({
      query: "> canon ethiopian",
      catalog: [],
      canons: null,
      exact: null,
      related: null,
    });
    assert.equal(groups.length, 1);
    assert.equal(groups[0].id, "canons");
  });

  await t.test("indexes /scriptures/canons in find catalog", () => {
    const place = FIND_CATALOG.find((p) => p.href === "/scriptures/canons");
    assert.ok(place, "FIND_CATALOG should contain /scriptures/canons");
    assert.ok(place.keywords.includes("canon"));
    assert.ok(place.keywords.includes("deuterocanon"));
    assert.ok(place.keywords.includes("tanakh"));
  });
});
