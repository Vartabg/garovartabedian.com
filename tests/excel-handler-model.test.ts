import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeRows,
  parseAmountCents,
  parseJobDate,
  type CellValue,
  type InputRow,
  type Mapping,
} from "../src/lib/excel-handler/model";

const mapping: Mapping = { date: 0, customer: 1, service: 2, amount: 3 };
const options = { dateFormat: "iso", excludeDuplicates: false } as const;
const row = (sourceRow: number, cells: CellValue[]): InputRow => ({ sourceRow, cells });
const validCells = (): CellValue[] => ["2026-10-20", "Maya", "Window cleaning", "$125.50"];

describe("Excel handler dates", () => {
  it("accepts strict Gregorian ISO dates without rollover or timezone parsing", () => {
    for (const date of ["0001-01-01", "2000-02-29", "2024-02-29", "9999-12-31"]) {
      assert.equal(parseJobDate(date), date);
    }
    for (const date of ["0000-01-01", "1900-02-29", "2026-02-29", "2026-04-31", "2026-00-10", "2026-13-01", "2026-1-01", "2026-01-1", "2026-01-01T00:00:00Z", "10/20/26"]) {
      assert.equal(parseJobDate(date), null, date);
    }
    assert.equal(parseJobDate(46_000), null);
    assert.equal(parseJobDate(null), null);
  });

  it("requires an explicit US setting for slash dates", () => {
    assert.equal(parseJobDate("03/04/2026"), null);
    assert.equal(parseJobDate("03/04/2026", "us"), "2026-03-04");
    assert.equal(parseJobDate("2026-03-04", "us"), "2026-03-04");
    assert.equal(parseJobDate("20/10/2026", "us"), null);
    assert.equal(parseJobDate("02/29/1900", "us"), null);
    assert.equal(parseJobDate("02/29/2000", "us"), "2000-02-29");
  });
});

describe("Excel handler money", () => {
  it("uses exact integer cents for numeric values, grouped USD and credits", () => {
    const cases: [CellValue, number][] = [
      [0, 0], [0.29, 29], [1.01, 101], [1.1, 110], [1234.56, 123456],
      ["$1,234.50", 123450], ["12", 1200], ["0012.5", 1250], ["  $12.50  ", 1250],
      ["-12.50", -1250], ["-$1,234.50", -123450], ["(12.50)", -1250], ["($12.50)", -1250],
      ["-0.00", 0], [1_000_000_000, 100_000_000_000], ["-1,000,000,000.00", -100_000_000_000],
    ];
    for (const [input, expected] of cases) assert.equal(parseAmountCents(input), expected, String(input));
  });

  it("rejects guesses, other currencies, precision loss and unsafe amounts", () => {
    for (const input of ["", "$", "1,23.45", "1234,567.00", "1,234,56", "USD 12.50", "€12.50", "£12.50", "1.234,50", "1e3", "1E+3", "+12.50", "--12", "(-12)", "12.000", ".50", "$ 12.50", "NaN", "Infinity", 1.001, 1.0000000000000002, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1_000_000_000.01, "9007199254740993", true, null]) {
      assert.equal(parseAmountCents(input), null, String(input));
    }
  });
});

describe("Excel handler normalization", () => {
  it("conserves input rows, retains exact originals and normalizes only whitespace", () => {
    const cells: CellValue[] = ["\u00852026-10-20\u00a0", "  =CUSTOMER(7)\u2003 ID 007  ", " Window\n\tcleaning ", "$125.50"];
    const inputs = [row(2, cells), row(3, [null, " ", "\u2003", "\u0085"]), row(4, ["bad date", "Alex", "Windows", "12.001"])];
    const before = structuredClone(inputs);
    const result = normalizeRows(inputs, mapping, options);
    assert.deepEqual(inputs, before);
    assert.deepEqual(result.originalRows, before);
    assert.notEqual(result.originalRows[0].cells, cells);
    assert.equal(result.readyRows[0].customer, "=CUSTOMER(7) ID 007");
    assert.equal(result.readyRows[0].service, "Window cleaning");
    assert.equal(result.readyRows[0].date, "2026-10-20");
    assert.equal(result.readyRows.length, 1);
    assert.equal(result.reviewRows.length, 1);
    assert.equal(result.reviewRows[0].reasons.length, 2);
    assert.deepEqual(result.reviewRows[0].cells, inputs[2].cells);
    assert.equal(result.blankCount, 1);
    assert.equal(result.inputCount, result.readyRows.length + result.reviewRows.length + result.blankCount);
    assert.equal(result.totalCents, 12550);
  });

  it("uses explicit column indexes when a worksheet is reordered or has extra fields", () => {
    const reordered: Mapping = { date: 3, customer: 4, service: 0, amount: 2 };
    const result = normalizeRows([row(10, ["Repair", "kept original", 20, "2026-10-20", "0007"]), row(11, ["Repair"])], reordered, options);
    assert.deepEqual(result.readyRows, [{ sourceRow: 10, date: "2026-10-20", customer: "0007", service: "Repair", amountCents: 2000, duplicate: false }]);
    assert.equal(result.reviewRows[0].sourceRow, 11);
    assert.equal(result.reviewRows[0].reasons.length, 3);
    assert.equal(result.originalRows[0].cells[1], "kept original");
  });

  it("keeps zero amounts and numeric customer IDs, and reviews missing required values", () => {
    const result = normalizeRows([row(2, ["2026-10-20", 0, "Inspection", 0]), row(3, ["2026-10-20", "", " ", null])], mapping, options);
    assert.equal(result.readyRows[0].customer, "0");
    assert.equal(result.readyRows[0].amountCents, 0);
    assert.equal(result.reviewRows.length, 1);
    assert.equal(result.reviewRows[0].reasons.length, 3);
  });

  it("reviews formulas in every mapped column, including formulas with cached values", () => {
    const inputs = [0, 1, 2, 3].map((column) => ({ ...row(column + 2, validCells()), formulaColumns: [column] }));
    const result = normalizeRows(inputs, mapping, options);
    assert.equal(result.readyRows.length, 0);
    assert.equal(result.reviewRows.length, 4);
    assert.ok(result.reviewRows.every((review) => review.reasons.some((reason) => reason.includes("formula"))));
    assert.equal(result.totalCents, 0);
    assert.deepEqual(result.byService, []);
    assert.deepEqual(result.byWeek, []);
    assert.notEqual(result.originalRows[0].formulaColumns, inputs[0].formulaColumns);
    assert.deepEqual(result.originalRows[0].formulaColumns, [0]);
  });

  it("does not mistake an unmapped formula for a selected formula", () => {
    const result = normalizeRows([{ ...row(2, [...validCells(), "=A1"]), formulaColumns: [4] }], mapping, options);
    assert.equal(result.readyRows.length, 1);
    assert.equal(result.readyRows[0].amountCents, 12550);
  });

  it("does not discard a formula row without a cached value as blank", () => {
    const result = normalizeRows([{ ...row(2, [null, null, null, null]), formulaColumns: [0] }], mapping, options);
    assert.equal(result.blankCount, 0);
    assert.equal(result.reviewRows.length, 1);
    assert.ok(result.reviewRows[0].reasons.some((reason) => reason.includes("formula")));
  });

  it("keeps and flags duplicates by default without hiding their contribution", () => {
    const inputs = [row(2, validCells()), row(3, ["2026-10-20", " Maya ", "Window\ncleaning", 125.5]), row(4, ["2026-10-20", "maya", "Window cleaning", 125.5])];
    const result = normalizeRows(inputs, mapping, options);
    assert.equal(result.duplicateCount, 1);
    assert.deepEqual(result.readyRows.map((ready) => ready.duplicate), [true, true, false]);
    assert.equal(result.totalCents, 37650);
    assert.equal(result.reviewRows.length, 0);
  });

  it("moves only extra duplicate occurrences to Review when requested", () => {
    const inputs = [row(5, validCells()), row(6, validCells()), row(7, ["bad", "Maya", "Windows", 10]), row(8, validCells())];
    const result = normalizeRows(inputs, mapping, { ...options, excludeDuplicates: true });
    assert.equal(result.duplicateCount, 2);
    assert.deepEqual(result.readyRows.map((ready) => ready.sourceRow), [5]);
    assert.equal(result.readyRows[0].duplicate, true);
    assert.deepEqual(result.reviewRows.map((review) => review.sourceRow), [6, 7, 8]);
    assert.match(result.reviewRows[0].reasons[0], /source row 5/);
    assert.deepEqual(result.reviewRows[0].cells, inputs[1].cells);
    assert.equal(result.totalCents, 12550);
    assert.deepEqual(result.byService, [{ key: "Window cleaning", count: 1, totalCents: 12550 }]);
    assert.equal(result.inputCount, result.readyRows.length + result.reviewRows.length + result.blankCount);
    assert.deepEqual(result, normalizeRows(inputs, mapping, { ...options, excludeDuplicates: true }));
  });

  it("keeps review rows in input order even when source row numbers repeat", () => {
    const inputs = [row(2, validCells()), row(2, validCells()), row(2, ["bad date", "Maya", "Repair", 10])];
    const result = normalizeRows(inputs, mapping, { ...options, excludeDuplicates: true });
    assert.match(result.reviewRows[0].reasons[0], /Duplicate/);
    assert.match(result.reviewRows[1].reasons[0], /Date/);
    assert.equal(result.inputCount, result.readyRows.length + result.reviewRows.length + result.blankCount);
  });

  it("groups by Monday across ISO week/year boundaries and sums credits exactly", () => {
    const inputs = [
      row(2, ["2021-01-01", "A", "Windows", "0.10"]),
      row(3, ["2021-01-03", "B", "Repair", "0.20"]),
      row(4, ["2021-01-04", "C", "Windows", "-0.05"]),
      row(5, ["2020-12-28", "D", "Repair", "1.00"]),
      row(6, ["2021-01-05", "E", "Repair", "bad"]),
    ];
    const result = normalizeRows(inputs, mapping, options);
    assert.deepEqual(result.byWeek, [{ key: "2020-12-28", count: 3, totalCents: 130 }, { key: "2021-01-04", count: 1, totalCents: -5 }]);
    assert.deepEqual(result.byService, [{ key: "Repair", count: 2, totalCents: 120 }, { key: "Windows", count: 2, totalCents: 5 }]);
    assert.equal(result.totalCents, 125);
    for (const summary of [result.byWeek, result.byService]) {
      assert.equal(summary.reduce((sum, group) => sum + group.totalCents, 0), result.totalCents);
      assert.equal(summary.reduce((sum, group) => sum + group.count, 0), result.readyRows.length);
    }
  });

  it("handles the earliest supported Gregorian date without an invalid week key", () => {
    const result = normalizeRows([row(2, ["0001-01-01", "A", "Inspection", 1]), row(3, ["2000-02-29", "B", "Inspection", 1])], mapping, options);
    assert.deepEqual(result.byWeek.map((group) => group.key), ["0001-01-01", "2000-02-28"]);
  });

  it("returns a deterministic empty result and counts truly empty rows", () => {
    const empty = normalizeRows([], mapping, options);
    assert.equal(empty.inputCount, 0);
    assert.equal(empty.totalCents, 0);
    assert.deepEqual(empty.originalRows, []);
    const blanks = normalizeRows([row(2, []), row(3, [])], mapping, options);
    assert.equal(blanks.blankCount, 2);
    assert.equal(blanks.reviewRows.length, 0);
  });

  it("rejects invalid mappings and unsupported options instead of guessing", () => {
    const inputs = [row(2, validCells())];
    for (const invalid of [{ ...mapping, amount: 2 }, { ...mapping, date: -1 }, { ...mapping, date: 0.5 }, { ...mapping, date: 50 }, { ...mapping, amount: 4 }]) {
      assert.throws(() => normalizeRows(inputs, invalid, options), /column/i);
    }
    assert.throws(() => normalizeRows(inputs, mapping, { ...options, dateFormat: "uk" } as never), /date format/);
  });

  it("enforces row, column and cell-text bounds before processing", () => {
    assert.throws(() => normalizeRows(Array.from({ length: 10_001 }, (_, index) => row(index + 2, validCells())), mapping, options), /10,000/);
    assert.throws(() => normalizeRows([row(2, Array(51).fill(null))], mapping, options), /50 columns/);
    assert.throws(() => normalizeRows([row(2, ["2026-10-20", "a".repeat(2001), "Inspection", 1])], mapping, options), /2,000/);
    assert.throws(() => normalizeRows([row(0, validCells())], mapping, options), /row number/);
    assert.throws(() => normalizeRows([{ ...row(2, validCells()), formulaColumns: [51] }], mapping, options), /formula column/);
  });

  it("accepts the complete bounded workload with safe exact totals", () => {
    const inputs = Array.from({ length: 10_000 }, (_, index) => row(index + 2, ["2026-10-20", `Customer ${index}`, "Inspection", 1_000_000_000]));
    const result = normalizeRows(inputs, mapping, options);
    assert.equal(result.totalCents, 1_000_000_000_000_000);
    assert.ok(Number.isSafeInteger(result.totalCents));
    assert.equal(result.readyRows.length, 10_000);
    assert.equal(result.duplicateCount, 0);
    assert.equal(result.byWeek[0].totalCents, result.totalCents);
  });
});
