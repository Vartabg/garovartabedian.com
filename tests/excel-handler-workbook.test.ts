import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import * as XLSX from "xlsx";
import { normalizeRows, type Mapping } from "../src/lib/excel-handler/model";
import { createSampleWorkbook, SAMPLE_FILENAME } from "../src/lib/excel-handler/sample";
import { exportWorkbook, parseWorkbook } from "../src/lib/excel-handler/workbook";

const mapping: Mapping = { date: 0, customer: 1, service: 2, amount: 3 };
const options = { dateFormat: "iso", excludeDuplicates: false } as const;
const headers = ["Date", "Client", "Service", "Amount"];
const validRow = ["2026-10-20", "Client A", "Document review", 125.5];
const asBuffer = (bytes: Uint8Array): ArrayBuffer => bytes.slice().buffer as ArrayBuffer;
const csv = (text: string): ArrayBuffer => asBuffer(strToU8(text));

function writeSheets(sheets: [string, XLSX.WorkSheet][], date1904 = false): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  workbook.Workbook = { WBProps: { date1904 } };
  for (const [name, sheet] of sheets) XLSX.utils.book_append_sheet(workbook, sheet, name);
  return XLSX.write(workbook, { type: "array", bookType: "xlsx", compression: true }) as ArrayBuffer;
}

function writeRows(rows: unknown[][]): ArrayBuffer {
  return writeSheets([["Client work", XLSX.utils.aoa_to_sheet(rows)]]);
}

function findSignature(bytes: Uint8Array, signature: number, from = 0): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let position = from; position + 4 <= bytes.length; position += 1) {
    if (view.getUint32(position, true) === signature) return position;
  }
  throw new Error("Test fixture ZIP signature missing");
}

function smallZip(extra: Record<string, Uint8Array> = {}, level: 0 | 6 = 0): Uint8Array {
  return zipSync({
    "[Content_Types].xml": strToU8('<Types><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>'),
    "xl/workbook.xml": strToU8("<workbook><sheets/></workbook>"),
    ...extra,
  }, { level });
}

describe("Excel handler CSV input", () => {
  it("parses UTF-8 BOM, quoted commas, escaped quotes, multiline values and blank records", () => {
    const input = '\uFEFFDate,Client,Service,Amount,Reference\r\n2026-10-20,"Client, A","Review ""brief""\nfollow-up","$1,234.50",00007\r\n\r\n2026-10-21,Client B,Analysis,10.00,=REFERENCE(7)\r\n';
    const sheet = parseWorkbook(csv(input), "work.CSV").sheets[0];
    assert.equal(sheet.name, "work");
    assert.deepEqual(sheet.headers, [...headers, "Reference"]);
    assert.equal(sheet.rows.length, 3);
    assert.deepEqual(sheet.rows[0], { sourceRow: 2, cells: ["2026-10-20", "Client, A", 'Review "brief"\nfollow-up', "$1,234.50", "00007"] });
    assert.deepEqual(sheet.rows[1], { sourceRow: 3, cells: ["", null, null, null, null] });
    assert.equal(sheet.rows[2].cells[4], "=REFERENCE(7)");
    assert.equal(sheet.rows[2].formulaColumns, undefined);
  });

  it("retains strings, literal formula-like text and empty quoted fields without inference", () => {
    const sheet = parseWorkbook(csv('Date,Client,Service,Amount\n2026-10-20,00007,=SERVICE(1),12.50\n2026-10-21,"",Analysis,0'), "work.csv").sheets[0];
    assert.deepEqual(sheet.rows[0].cells, ["2026-10-20", "00007", "=SERVICE(1)", "12.50"]);
    assert.equal(sheet.rows[1].cells[1], "");
    const result = normalizeRows(sheet.rows, mapping, options);
    assert.equal(result.readyRows[0].service, "=SERVICE(1)");
    assert.equal(result.reviewRows.length, 1);
  });

  it("rejects malformed quotes and invalid UTF-8 instead of making a partial table", () => {
    for (const input of ['Date,Client,Service,Amount\n2026-10-20,"Client A,Review,12', 'Date,Client,Service,Amount\n2026-10-20,Cl"ient,Review,12', 'Date,Client,Service,Amount\n2026-10-20,"Client"oops,Review,12']) {
      assert.throws(() => parseWorkbook(csv(input), "work.csv"), /quote/i);
    }
    assert.throws(() => parseWorkbook(asBuffer(new Uint8Array([0xff, 0xfe, 0x41])), "work.csv"), /UTF-8/);
    assert.throws(() => parseWorkbook(csv("<html><table><tr><td>hello</td></tr></table></html>"), "work.csv"), /HTML/);
    assert.throws(() => parseWorkbook(csv("Date,Client,Service,Amount\n2026-10-20,A,Review,\0"), "work.csv"), /binary/);
  });

  it("requires headers and bounds rows, columns and text during parsing", () => {
    assert.throws(() => parseWorkbook(csv(""), "work.csv"), /nonempty/);
    assert.throws(() => parseWorkbook(csv("A,B,C"), "work.csv"), /four columns/);
    assert.throws(() => parseWorkbook(csv(",,,\n2026-10-20,A,Review,10"), "work.csv"), /no column names in row 1/);
    assert.deepEqual(parseWorkbook(csv("Date,,Service,Amount\n2026-10-20,A,Review,10"), "work.csv").sheets[0].headers, ["Date", "Column B", "Service", "Amount"]);
    const straySeparator = parseWorkbook(csv("Date,Client,Service,Amount\n2026-10-20,A,Review,10,unexpected"), "work.csv").sheets[0];
    assert.deepEqual(straySeparator.headers, ["Date", "Client", "Service", "Amount", "Column E"]);
    assert.equal(straySeparator.rows[0].cells[4], "unexpected");
    assert.throws(() => parseWorkbook(csv(Array.from({ length: 51 }, (_, index) => `Column ${index}`).join(",")), "work.csv"), /50 columns/);
    assert.throws(() => parseWorkbook(csv(`Date,Client,Service,Amount\n2026-10-20,${"a".repeat(2001)},Review,10`), "work.csv"), /2,000/);
    assert.throws(() => parseWorkbook(csv(`Date,Client,Service,Amount\n${"2026-10-20,A,Review,10\n".repeat(10_001)}`), "work.csv"), /10,000/);
  });

  it("enforces the file cap and supported extensions", () => {
    assert.throws(() => parseWorkbook(new ArrayBuffer(5 * 1024 * 1024 + 1), "work.xlsx"), /5 MiB/);
    for (const filename of ["work.xls", "work.xlsm", "work.html", "work.csv.exe"]) assert.throws(() => parseWorkbook(csv("a,b,c,d"), filename), /\.csv or \.xlsx/);
    assert.throws(() => parseWorkbook(csv("a,b,c,d"), "work.xlsx"), /ZIP archive/);
  });
});

describe("Excel handler real XLSX input", () => {
  it("parses multiple worksheets and keeps numeric leading-zero IDs and blank rows", () => {
    const first = XLSX.utils.aoa_to_sheet([[...headers, "Reference"], [...validRow, 7], [null, null, null, null, null], ["2026-10-21", "Client B", "Analysis", 10, "00008"]]);
    first.E2 = { t: "n", v: 7, z: "00000" };
    const second = XLSX.utils.aoa_to_sheet([headers, validRow]);
    const parsed = parseWorkbook(writeSheets([["October", first], ["November", second]]), "work.xlsx");
    assert.deepEqual(parsed.sheets.map((sheet) => sheet.name), ["October", "November"]);
    assert.equal(parsed.sheets[0].rows[0].cells[4], "00007");
    assert.deepEqual(parsed.sheets[0].rows[1].cells, [null, null, null, null, null]);
    assert.equal(parsed.sheets[0].rows[2].sourceRow, 4);
    assert.equal(parsed.sheets[0].rows[2].cells[4], "00008");
  });

  it("converts real date cells using both Excel date systems and rejects the fake leap day", () => {
    const makeSheet = (serials: number[]) => {
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...serials.map((serial) => [serial, "Client A", "Review", 10])]);
      serials.forEach((serial, index) => { sheet[`A${index + 2}`] = { t: "n", v: serial, z: "yyyy-mm-dd" }; });
      return sheet;
    };
    const old = parseWorkbook(writeSheets([["Dates", makeSheet([1, 59, 60, 61, 1.5])]]), "dates.xlsx").sheets[0];
    assert.deepEqual(old.rows.map((row) => row.cells[0]), ["1900-01-01", "1900-02-28", "Invalid Excel date (serial 60)", "1900-03-01", "1900-01-01"]);
    assert.equal(normalizeRows(old.rows, mapping, options).reviewRows.length, 1);
    const modern = parseWorkbook(writeSheets([["Dates", makeSheet([0, 1, 1461])]], true), "dates.xlsx").sheets[0];
    assert.deepEqual(modern.rows.map((row) => row.cells[0]), ["1904-01-01", "1904-01-02", "1908-01-01"]);
  });

  it("preserves formula expressions as text and flags every formula column", () => {
    const sheet = XLSX.utils.aoa_to_sheet([[...headers, "Reference"], [...validRow, "literal"]]);
    sheet.A2 = { t: "n", v: 46315, z: "yyyy-mm-dd", f: "TODAY()" };
    sheet.D2 = { t: "n", v: 125.5, f: "SUM(100,25.5)" };
    sheet.E2 = { t: "s", v: "cached", f: 'HYPERLINK("https://example.com","x")' };
    const parsed = parseWorkbook(writeSheets([["Formulas", sheet]]), "formulas.xlsx").sheets[0];
    assert.deepEqual(parsed.rows[0].formulaColumns, [0, 3, 4]);
    assert.equal(parsed.rows[0].cells[0], "=TODAY()");
    assert.equal(parsed.rows[0].cells[3], "=SUM(100,25.5)");
    assert.equal(parsed.rows[0].cells[4], '=HYPERLINK("https://example.com","x")');
    assert.equal(normalizeRows(parsed.rows, mapping, options).reviewRows.length, 1);
  });

  it("rejects Excel errors in headers or data before treating their tokens as text", () => {
    for (const address of ["B1", "B2", "D2"]) {
      const sheet = XLSX.utils.aoa_to_sheet([headers, validRow]);
      sheet[address] = { t: "e", v: 0x07 };
      assert.throws(() => parseWorkbook(writeSheets([["Client work", sheet]]), "work.xlsx"), new RegExp(`Client work.*${address}.*Excel error.*Confirm`));
    }
    const formulaError = XLSX.utils.aoa_to_sheet([headers, validRow]);
    formulaError.B2 = { t: "e", v: 0x07, f: "1/0" };
    assert.throws(() => parseWorkbook(writeSheets([["Formula error", formulaError]]), "work.xlsx"), /B2.*Excel error/);
  });

  it("names unlabelled columns and bounds ranges, long cells and sheet count", () => {
    const unnamedColumn = XLSX.utils.aoa_to_sheet([["Date", null, "Service", "Amount"], validRow]);
    assert.deepEqual(parseWorkbook(writeSheets([["Missing", unnamedColumn]]), "work.xlsx").sheets[0].headers, ["Date", "Column B", "Service", "Amount"]);
    const tooTall = XLSX.utils.aoa_to_sheet([headers]);
    tooTall["!ref"] = "A1:D10002";
    assert.throws(() => parseWorkbook(writeSheets([["Tall", tooTall]]), "work.xlsx"), /10,000/);
    const tooWide = XLSX.utils.aoa_to_sheet([Array.from({ length: 51 }, (_, index) => `Column ${index}`)]);
    assert.throws(() => parseWorkbook(writeSheets([["Wide", tooWide]]), "work.xlsx"), /50 columns/);
    assert.throws(() => parseWorkbook(writeRows([headers, ["2026-10-20", "a".repeat(2001), "Review", 10]]), "work.xlsx"), /2,000/);
    const nine = Array.from({ length: 9 }, (_, index) => [`Sheet ${index}`, XLSX.utils.aoa_to_sheet([headers, validRow])] as [string, XLSX.WorkSheet]);
    assert.throws(() => parseWorkbook(writeSheets(nine), "work.xlsx"), /eight worksheets|one to eight/);
  });

  it("bounds the aggregate data row count across worksheets", () => {
    const sheet = XLSX.utils.aoa_to_sheet([headers]);
    sheet["!ref"] = "A1:D7001";
    assert.throws(() => parseWorkbook(writeSheets([["One", sheet], ["Two", sheet], ["Three", sheet]]), "work.xlsx"), /20,000/);
  });
});

describe("Excel handler XLSX archive preflight", () => {
  it("rejects an ordinary valid ZIP archive comment before reading", () => {
    const base = new Uint8Array(writeRows([headers, validRow]));
    const end = findSignature(base, 0x06054b50);
    const comment = strToU8("Generated locally");
    const commented = new Uint8Array(base.length + comment.length);
    commented.set(base);
    commented.set(comment, base.length);
    new DataView(commented.buffer).setUint16(end + 20, comment.length, true);
    assert.throws(() => parseWorkbook(asBuffer(commented), "work.xlsx"), /archive comments/);
  });

  it("rejects a second workbook hidden in an archive comment rather than reading unchecked values", () => {
    const outer = new Uint8Array(writeRows([headers, ["2026-10-20", "Client A", "Review", 10]]));
    const inner = new Uint8Array(writeRows([headers, ["2026-10-20", "Client A", "Review", 999]]));
    const innerView = new DataView(inner.buffer);
    const innerEnd = findSignature(inner, 0x06054b50);
    const directory = innerView.getUint32(innerEnd + 16, true);
    const count = innerView.getUint16(innerEnd + 10, true);
    let central = directory;
    for (let index = 0; index < count; index += 1) {
      innerView.setUint32(central + 42, innerView.getUint32(central + 42, true) + outer.length, true);
      central += 46 + innerView.getUint16(central + 28, true) + innerView.getUint16(central + 30, true) + innerView.getUint16(central + 32, true);
    }
    innerView.setUint32(innerEnd + 16, directory + outer.length, true);
    // The inner EOCD is malformed by one comment byte; SheetJS still discovers
    // it, whereas an EOF-validating preflight would choose the outer EOCD.
    innerView.setUint16(innerEnd + 20, 1, true);
    new DataView(outer.buffer).setUint16(findSignature(outer, 0x06054b50) + 20, inner.length, true);
    const combined = new Uint8Array(outer.length + inner.length);
    combined.set(outer);
    combined.set(inner, outer.length);
    const unchecked = XLSX.read(combined, { type: "array" });
    assert.equal(unchecked.Sheets["Client work"].D2.v, 999);
    assert.throws(() => parseWorkbook(asBuffer(combined), "work.xlsx"), /archive comments/);
  });

  it("rejects encryption, unsupported methods, ZIP64 and multiple disks before reading", () => {
    const encrypted = smallZip();
    new DataView(encrypted.buffer).setUint16(findSignature(encrypted, 0x02014b50) + 8, 1, true);
    assert.throws(() => parseWorkbook(asBuffer(encrypted), "work.xlsx"), /Encrypted/);
    const method = smallZip();
    new DataView(method.buffer).setUint16(findSignature(method, 0x02014b50) + 10, 99, true);
    assert.throws(() => parseWorkbook(asBuffer(method), "work.xlsx"), /compression method/);
    const zip64 = smallZip();
    new DataView(zip64.buffer).setUint32(findSignature(zip64, 0x02014b50) + 24, 0xffffffff, true);
    assert.throws(() => parseWorkbook(asBuffer(zip64), "work.xlsx"), /ZIP64/);
    const multi = smallZip();
    new DataView(multi.buffer).setUint16(findSignature(multi, 0x06054b50) + 4, 1, true);
    assert.throws(() => parseWorkbook(asBuffer(multi), "work.xlsx"), /Multi-disk/);
  });

  it("rejects macros, binary parts, dangerous paths and XML entities", () => {
    assert.throws(() => parseWorkbook(asBuffer(smallZip({ "xl/vbaProject.bin": new Uint8Array([1]) })), "work.xlsx"), /Macros/);
    assert.throws(() => parseWorkbook(asBuffer(smallZip({ "xl/macrosheets/sheet1.xml": strToU8("<sheet/>") })), "work.xlsx"), /Macros/);
    assert.throws(() => parseWorkbook(asBuffer(smallZip({ "../outside.xml": strToU8("<x/>") })), "work.xlsx"), /member path/);
    assert.throws(() => parseWorkbook(asBuffer(smallZip({ "xl/test.xml": strToU8('<!DOCTYPE x [<!ENTITY x "hello">]><x/>') })), "work.xlsx"), /entity declarations/);
    const macroTypes = smallZip({ "[Content_Types].xml": strToU8('<Types><Override PartName="/xl/workbook.xml" ContentType="application/vnd.ms-excel.sheet.macroEnabled.main+xml"/></Types>') });
    assert.throws(() => parseWorkbook(asBuffer(macroTypes), "work.xlsx"), /Macro-enabled/);
  });

  it("checks checksums and central/local consistency", () => {
    const corrupt = smallZip();
    const local = findSignature(corrupt, 0x04034b50);
    const view = new DataView(corrupt.buffer);
    const payload = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    corrupt[payload] ^= 1;
    assert.throws(() => parseWorkbook(asBuffer(corrupt), "work.xlsx"), /checksum/);
    const conflict = smallZip();
    new DataView(conflict.buffer).setUint32(findSignature(conflict, 0x02014b50) + 24, 1, true);
    assert.throws(() => parseWorkbook(asBuffer(conflict), "work.xlsx"), /conflicting size/);
    assert.throws(() => parseWorkbook(asBuffer(smallZip().subarray(0, 30)), "work.xlsx"), /complete XLSX ZIP/);
  });

  it("caps declared expanded sizes and detects forged small sizes while streaming", () => {
    const tooLarge = smallZip({ "xl/large.xml": new Uint8Array(8 * 1024 * 1024 + 1).fill(65) }, 6);
    assert.throws(() => parseWorkbook(asBuffer(tooLarge), "work.xlsx"), /safe size limit/);
    const forged = tooLarge.slice();
    const view = new DataView(forged.buffer);
    let central = findSignature(forged, 0x02014b50);
    while (view.getUint32(central + 24, true) <= 8 * 1024 * 1024) central = findSignature(forged, 0x02014b50, central + 4);
    const local = view.getUint32(central + 42, true);
    view.setUint32(central + 24, 1, true);
    view.setUint32(local + 22, 1, true);
    assert.throws(() => parseWorkbook(asBuffer(forged), "work.xlsx"), /declared or safe size/);
    const combined = smallZip(Object.fromEntries(["one", "two", "three"].map((name) => [`xl/${name}.xml`, new Uint8Array(7 * 1024 * 1024).fill(65)])), 6);
    assert.throws(() => parseWorkbook(asBuffer(combined), "work.xlsx"), /safe size limit/);
  });
});

describe("Excel handler sample and export", () => {
  it("provides a real fictional workbook covering the visible review and duplicate settings", () => {
    assert.equal(SAMPLE_FILENAME, "sample-client-work.xlsx");
    const parsed = parseWorkbook(createSampleWorkbook(), SAMPLE_FILENAME);
    const sheet = parsed.sheets[0];
    const result = normalizeRows(sheet.rows, mapping, options);
    assert.equal(result.inputCount, 10);
    assert.equal(result.readyRows.length, 5);
    assert.equal(result.reviewRows.length, 4);
    assert.equal(result.blankCount, 1);
    assert.equal(result.duplicateCount, 1);
    assert.equal(result.totalCents, 86600);
    assert.equal(sheet.rows.at(-1)!.cells[4], "00049");
    assert.equal(normalizeRows(sheet.rows, mapping, { ...options, dateFormat: "us" }).readyRows.length, 6);
    assert.equal(normalizeRows(sheet.rows, mapping, { ...options, excludeDuplicates: true }).readyRows.length, 4);
  });

  it("round-trips all result sheets, preserves input rows and emits inert formula strings", () => {
    const input = XLSX.utils.aoa_to_sheet([[...headers, "Reference"], ["2026-10-20", "=CLIENT(7)", "Review", 10.25, "00007"], [null, null, null, null, null], ["2026-10-21", "Client B", "Analysis", 150, "00008"]]);
    input.D4 = { t: "n", v: 150, f: "SUM(100,50)" };
    input.B2.l = { Target: "https://example.com" };
    const sheet = parseWorkbook(writeSheets([["Input", input]]), "input.xlsx").sheets[0];
    const result = normalizeRows(sheet.rows, mapping, options);
    const bytes = exportWorkbook(sheet, result, mapping, options);
    assert.ok(bytes instanceof ArrayBuffer);
    const exported = XLSX.read(bytes, { type: "array", cellFormula: true, cellNF: true });
    assert.deepEqual(exported.SheetNames, ["Ready", "Needs review", "Original data", "Summary", "Read me"]);
    assert.equal(exported.Sheets.Ready.C2.v, "=CLIENT(7)");
    assert.equal(exported.Sheets.Ready.C2.t, "s");
    assert.equal(exported.Sheets.Ready.E2.v, 10.25);
    assert.match(String(exported.Sheets.Ready.E2.z), /0\.00/);
    assert.equal(exported.Sheets["Original data"].E4.v, "=SUM(100,50)");
    assert.equal(exported.Sheets["Original data"].E4.t, "s");
    assert.equal(exported.Sheets["Original data"].F2.v, "00007");
    assert.equal(exported.Sheets["Original data"].A3.v, 3);
    assert.equal(exported.Sheets["Summary"].C2.v, 3);
    assert.equal(exported.Sheets["Summary"].D3.v, 10.25);
    for (const worksheet of Object.values(exported.Sheets)) {
      for (const [key, cell] of Object.entries(worksheet)) {
        if (key.startsWith("!")) continue;
        assert.equal((cell as XLSX.CellObject).f, undefined);
        assert.equal((cell as XLSX.CellObject).l, undefined);
      }
    }
    const archive = unzipSync(new Uint8Array(bytes));
    assert.ok(Object.keys(archive).every((name) => !/vbaproject|externalLink|\.bin$/i.test(name)));
    const originalXml = strFromU8(archive["xl/worksheets/sheet3.xml"]);
    assert.ok(!/<f[ >]/u.test(originalXml));
  });
});

describe("Excel handler unusable worksheets and timestamps", () => {
  const blankSheet = (): XLSX.WorkSheet => ({ "!ref": "A1" });
  const notesSheet = () => XLSX.utils.aoa_to_sheet([["Note", "Value"], ["Prepared by", "A bookkeeper"]]);

  it("keeps the usable worksheets and lists the ones it left out", () => {
    const good = XLSX.utils.aoa_to_sheet([headers, validRow]);
    const parsed = parseWorkbook(writeSheets([["Client work", good], ["Sheet2", blankSheet()], ["Notes", notesSheet()]]), "work.xlsx");
    assert.deepEqual(parsed.sheets.map((sheet) => sheet.name), ["Client work"]);
    assert.deepEqual(parsed.skipped.map((sheet) => sheet.name), ["Sheet2", "Notes"]);
    assert.match(parsed.skipped[0].reason, /“Sheet2”.*empty/);
    assert.match(parsed.skipped[1].reason, /“Notes”.*four columns/);
    assert.equal(normalizeRows(parsed.sheets[0].rows, mapping, options).readyRows.length, 1);
  });

  it("ignores a trailing formatted column instead of rejecting the file", () => {
    const widened = XLSX.utils.aoa_to_sheet([headers, validRow]);
    widened["!ref"] = "A1:E2";
    const parsed = parseWorkbook(writeSheets([["Client work", widened]]), "work.xlsx");
    assert.deepEqual(parsed.sheets[0].headers, headers);
    assert.equal(parsed.sheets[0].rows[0].cells.length, 4);
    assert.deepEqual(parsed.skipped, []);
  });

  it("names an unlabelled column by position and keeps its data", () => {
    const gap = XLSX.utils.aoa_to_sheet([["Date", null, "Service", "Amount", "Reference"], ["2026-10-20", "Client A", "Review", 10, "x"]]);
    const sheet = parseWorkbook(writeSheets([["Client work", gap]]), "work.xlsx").sheets[0];
    assert.deepEqual(sheet.headers, ["Date", "Column B", "Service", "Amount", "Reference"]);
    assert.equal(sheet.rows[0].cells[1], "Client A");
  });

  it("rejects the file only when no worksheet can be used", () => {
    assert.throws(() => parseWorkbook(writeSheets([["Notes", notesSheet()]]), "work.xlsx"), /four columns/);
    assert.throws(() => parseWorkbook(writeSheets([["Sheet2", blankSheet()], ["Notes", notesSheet()]]), "work.xlsx"), /No worksheet in this file can be used/);
    const unnamed = XLSX.utils.aoa_to_sheet([[null, null, null, null], ["2026-10-20", "A", "Review", 10]]);
    assert.throws(() => parseWorkbook(writeSheets([["Unnamed", unnamed]]), "work.xlsx"), /no column names in row 1/);
  });

  it("skips only the worksheet holding an Excel error", () => {
    const good = XLSX.utils.aoa_to_sheet([headers, validRow]);
    const broken = XLSX.utils.aoa_to_sheet([headers, validRow]);
    broken.B2 = { t: "e", v: 0x07 };
    const parsed = parseWorkbook(writeSheets([["Client work", good], ["Broken", broken]]), "work.xlsx");
    assert.deepEqual(parsed.sheets.map((sheet) => sheet.name), ["Client work"]);
    assert.match(parsed.skipped[0].reason, /“Broken”.*Excel error/);
  });

  it("keeps the day when an Excel date cell carries a time", () => {
    const stamped = XLSX.utils.aoa_to_sheet([headers, validRow, validRow, validRow]);
    for (const [address, serial] of [["A2", 46315.5], ["A3", 46316.25], ["A4", 46317]] as [string, number][]) {
      stamped[address] = { t: "n", v: serial, z: "yyyy-mm-dd hh:mm" };
    }
    const sheet = parseWorkbook(writeSheets([["Timestamps", stamped]]), "work.xlsx").sheets[0];
    assert.deepEqual(sheet.rows.map((row) => row.cells[0]), ["2026-10-20", "2026-10-21", "2026-10-22"]);
    const result = normalizeRows(sheet.rows, mapping, options);
    assert.equal(result.readyRows.length, 3);
    assert.equal(result.reviewRows.length, 0);
  });

  it("still rejects a timestamp whose day is not a real date", () => {
    for (const serial of [60.5, 0.5]) {
      const sheet = XLSX.utils.aoa_to_sheet([headers, validRow]);
      sheet.A2 = { t: "n", v: serial, z: "yyyy-mm-dd hh:mm" };
      const parsed = parseWorkbook(writeSheets([["Dates", sheet]]), "work.xlsx").sheets[0];
      assert.equal(parsed.rows[0].cells[0], `Invalid Excel date (serial ${serial})`);
      assert.equal(normalizeRows(parsed.rows, mapping, options).reviewRows.length, 1);
    }
  });
});
