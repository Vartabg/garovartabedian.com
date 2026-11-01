import { Inflate } from "fflate";
import * as XLSX from "xlsx";
import {
  type CellValue,
  type InputRow,
  type Mapping,
  type NormalizeOptions,
  type NormalizeResult,
  parseJobDate,
} from "./model";

export type WorkbookSheet = { name: string; headers: string[]; rows: InputRow[] };
export type SkippedSheet = { name: string; reason: string };
export type ParsedWorkbook = { sheets: WorkbookSheet[]; skipped: SkippedSheet[] };

const MIB = 1024 * 1024;
const MAX_FILE_BYTES = 5 * MIB;
const MAX_EXPANDED_BYTES = 20 * MIB;
const MAX_MEMBER_BYTES = 8 * MIB;
const MAX_ZIP_MEMBERS = 512;
const MAX_SHEETS = 8;
const MAX_DATA_ROWS = 10_000;
const MAX_TOTAL_ROWS = 20_000;
const MAX_COLUMNS = 50;
const MAX_TEXT = 2_000;
const utf8 = new TextDecoder("utf-8", { fatal: true });

function fail(message: string): never {
  throw new Error(message);
}

/** A worksheet this demo cannot map. It is skipped, not grounds to reject the file. */
class SheetError extends Error {}

function failSheet(message: string): never {
  throw new SheetError(message);
}

function normalizedHeader(value: string): string {
  return value.replace(/[\p{White_Space}\uFEFF]+/gu, " ").trim();
}

function usedCell(value: CellValue | undefined): boolean {
  if (value === null || value === undefined) return false;
  return typeof value === "string" ? normalizedHeader(value) !== "" : true;
}

/** The last column carrying a name or a value. Trailing formatted blanks are not columns. */
function usedWidth(headerValues: CellValue[], rows: CellValue[][]): number {
  let width = 0;
  for (const cells of [headerValues, ...rows]) {
    for (let column = cells.length - 1; column >= width; column -= 1) {
      if (usedCell(cells[column])) {
        width = column + 1;
        break;
      }
    }
  }
  return width;
}

function validateHeaders(cells: CellValue[], sheetName: string): string[] {
  if (cells.length < 4) failSheet(`“${sheetName}” needs at least four columns, with a header in row 1.`);
  if (cells.length > MAX_COLUMNS) failSheet("Use worksheets with 50 columns or fewer.");
  if (cells.every((cell) => !usedCell(cell))) failSheet(`“${sheetName}” has no column names in row 1. Put a name above each column.`);
  // One unnamed column is named by its position; a wholly unnamed row is rejected above.
  return cells.map((cell, column) => {
    const header = cell === null ? "" : normalizedHeader(String(cell));
    if (header.length > MAX_TEXT) failSheet("A header is longer than 2,000 characters.");
    return header || `Column ${XLSX.utils.encode_col(column)}`;
  });
}

function validateText(value: CellValue, row: number): CellValue {
  if (typeof value === "string" && value.length > MAX_TEXT) failSheet(`Row ${row} has a cell longer than 2,000 characters.`);
  return value;
}

/** RFC-style quoted CSV. Values stay strings; no HTML or date/formula inference. */
function parseCsv(bytes: Uint8Array, filename: string): ParsedWorkbook {
  let text: string;
  try {
    text = utf8.decode(bytes).replace(/^\uFEFF/, "");
  } catch {
    return fail("This CSV is not valid UTF-8. Save it as CSV UTF-8 and try again.");
  }
  if (text.includes("\0") || /^\s*</u.test(text)) fail("Use a plain UTF-8 CSV file, not HTML or binary data.");
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;
  let started = false;
  const addCharacter = (character: string) => {
    field += character;
    if (field.length > MAX_TEXT) fail(`Row ${records.length + 1} has a cell longer than 2,000 characters.`);
  };
  const endField = () => {
    record.push(field);
    if (record.length > MAX_COLUMNS) fail("Use worksheets with 50 columns or fewer.");
    field = "";
    closedQuote = false;
  };
  const endRecord = () => {
    endField();
    records.push(record);
    if (records.length > MAX_DATA_ROWS + 1) fail("Use worksheets with 10,000 data rows or fewer.");
    record = [];
    started = false;
  };
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          addCharacter('"');
          index += 1;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else addCharacter(character);
      continue;
    }
    if (character === ",") {
      endField();
      started = true;
    } else if (character === "\r" || character === "\n") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      endRecord();
    } else if (closedQuote) {
      fail(`Row ${records.length + 1} has text after a closing quote. Use commas between fields.`);
    } else if (character === '"') {
      if (field.length) fail(`Row ${records.length + 1} has a quote inside an unquoted field.`);
      quoted = true;
      started = true;
    } else {
      addCharacter(character);
      started = true;
    }
  }
  if (quoted) fail("This CSV has an unclosed quoted field.");
  if (started || field.length || record.length || closedQuote) endRecord();
  if (!records.length) fail("This CSV is empty. Put column names in row 1.");
  const full = records.reduce((maximum, current) => Math.max(maximum, current.length), 0);
  const name = filename.replace(/\.csv$/i, "").slice(0, 80) || "CSV data";
  const headerCells = Array.from({ length: full }, (_, index) => records[0][index] ?? null);
  const bodyCells = records.slice(1).map((cells) => Array.from({ length: full }, (_, column) => cells[column] ?? null));
  // One row with a stray separator widens the record, not the list of real columns.
  const width = usedWidth(headerCells, bodyCells);
  const headers = validateHeaders(headerCells.slice(0, width), name);
  const rows = bodyCells.map((cells, index) => ({ sourceRow: index + 2, cells: cells.slice(0, width) }));
  return { sheets: [{ name, headers, rows }], skipped: [] };
}

type ZipMember = {
  name: string;
  flags: number;
  method: number;
  crc: number;
  compressedSize: number;
  originalSize: number;
  localOffset: number;
  dataOffset: number;
};

function signature(view: DataView, offset: number, expected: number): boolean {
  return offset >= 0 && offset + 4 <= view.byteLength && view.getUint32(offset, true) === expected;
}

function readName(bytes: Uint8Array): string {
  let name: string;
  try {
    name = utf8.decode(bytes);
  } catch {
    return fail("The XLSX archive has an unsupported filename encoding.");
  }
  if (!name || name.length > 512 || /[\0\\]/u.test(name) || name.startsWith("/") || name.split("/").includes("..")) {
    fail("The XLSX archive has an invalid member path.");
  }
  return name;
}

function validateExtras(view: DataView, offset: number, length: number): void {
  const end = offset + length;
  while (offset < end) {
    if (offset + 4 > end) fail("The XLSX archive has a malformed extra field.");
    const kind = view.getUint16(offset, true);
    const size = view.getUint16(offset + 2, true);
    if (kind === 0x0001) fail("ZIP64 workbooks are not supported. Save a smaller XLSX file.");
    if (kind === 0x9901) fail("Encrypted workbooks are not supported. Save an unencrypted XLSX copy.");
    offset += 4 + size;
    if (offset > end) fail("The XLSX archive has a malformed extra field.");
  }
}

/** Validate the complete directory before allocating any decompression output. */
function zipDirectory(bytes: Uint8Array): ZipMember[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65_557); offset -= 1) {
    if (signature(view, offset, 0x06054b50) && offset + 22 + view.getUint16(offset + 20, true) === bytes.length) {
      end = offset;
      break;
    }
  }
  if (end < 0) fail("This is not a complete XLSX ZIP archive.");
  // SheetJS locates the final EOCD signature without checking comment length.
  // Reject comments so its ZIP view cannot differ from the directory verified here.
  if (view.getUint16(end + 20, true) !== 0) fail("XLSX archive comments are not supported. Save a fresh ordinary XLSX copy.");
  const count = view.getUint16(end + 10, true);
  const directorySize = view.getUint32(end + 12, true);
  const directoryOffset = view.getUint32(end + 16, true);
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || view.getUint16(end + 8, true) !== count) fail("Multi-disk ZIP workbooks are not supported.");
  if (count === 0xffff || directorySize === 0xffffffff || directoryOffset === 0xffffffff || signature(view, end - 20, 0x07064b50)) fail("ZIP64 workbooks are not supported.");
  if (!count || count > MAX_ZIP_MEMBERS) fail("This XLSX has too many archive members. Save a simpler workbook.");
  if (directoryOffset + directorySize !== end || directoryOffset < 0 || directoryOffset > end) fail("The XLSX archive directory is malformed.");
  const members: ZipMember[] = [];
  const names = new Set<string>();
  let position = directoryOffset;
  let expandedTotal = 0;
  for (let index = 0; index < count; index += 1) {
    if (position + 46 > end || !signature(view, position, 0x02014b50)) fail("The XLSX archive directory is malformed.");
    const flags = view.getUint16(position + 8, true);
    const method = view.getUint16(position + 10, true);
    const compressedSize = view.getUint32(position + 20, true);
    const originalSize = view.getUint32(position + 24, true);
    const nameSize = view.getUint16(position + 28, true);
    const extraSize = view.getUint16(position + 30, true);
    const commentSize = view.getUint16(position + 32, true);
    const localOffset = view.getUint32(position + 42, true);
    const next = position + 46 + nameSize + extraSize + commentSize;
    if (next > end) fail("The XLSX archive directory is truncated.");
    if (flags & 0x2041) fail("Encrypted workbooks are not supported. Save an unencrypted XLSX copy.");
    if (flags & ~0x080e) fail("This XLSX uses unsupported ZIP flags.");
    if (method !== 0 && method !== 8) fail("This XLSX uses an unsupported ZIP compression method.");
    if ([compressedSize, originalSize, localOffset].includes(0xffffffff)) fail("ZIP64 workbooks are not supported.");
    if (view.getUint16(position + 34, true)) fail("Multi-disk ZIP workbooks are not supported.");
    const name = readName(bytes.subarray(position + 46, position + 46 + nameSize));
    const lowerName = name.toLowerCase();
    if (names.has(lowerName)) fail("The XLSX archive has duplicate member paths.");
    names.add(lowerName);
    if (/vbaproject|macrosheets|activex|customui|\.bin$/i.test(name)) fail("Macros and binary workbook parts are not supported. Save an ordinary XLSX copy.");
    validateExtras(view, position + 46 + nameSize, extraSize);
    expandedTotal += originalSize;
    if (originalSize > MAX_MEMBER_BYTES || expandedTotal > MAX_EXPANDED_BYTES) fail("This XLSX expands beyond the demo's safe size limit (8 MiB per part, 20 MiB total).");
    if (localOffset + 30 > directoryOffset || !signature(view, localOffset, 0x04034b50)) fail("The XLSX archive has a malformed local file record.");
    const localNameSize = view.getUint16(localOffset + 26, true);
    const localExtraSize = view.getUint16(localOffset + 28, true);
    const dataOffset = localOffset + 30 + localNameSize + localExtraSize;
    if (dataOffset > directoryOffset || dataOffset + compressedSize > directoryOffset) fail("An XLSX archive member extends outside its data area.");
    if (view.getUint16(localOffset + 6, true) !== flags || view.getUint16(localOffset + 8, true) !== method) fail("The XLSX archive has conflicting ZIP records.");
    if (view.getUint32(localOffset + 18, true) === 0xffffffff || view.getUint32(localOffset + 22, true) === 0xffffffff) fail("ZIP64 workbooks are not supported.");
    if (readName(bytes.subarray(localOffset + 30, localOffset + 30 + localNameSize)) !== name) fail("The XLSX archive has conflicting member names.");
    validateExtras(view, localOffset + 30 + localNameSize, localExtraSize);
    const crc = view.getUint32(position + 16, true);
    if (!(flags & 8) && (view.getUint32(localOffset + 14, true) !== crc || view.getUint32(localOffset + 18, true) !== compressedSize || view.getUint32(localOffset + 22, true) !== originalSize)) fail("The XLSX archive has conflicting size or checksum records.");
    members.push({ name, flags, method, crc, compressedSize, originalSize, localOffset, dataOffset });
    position = next;
  }
  if (position !== end) fail("The XLSX archive directory contains unexpected data.");
  const ordered = [...members].sort((a, b) => a.localOffset - b.localOffset);
  if (ordered[0].localOffset !== 0) fail("This file is not an ordinary XLSX archive.");
  for (let index = 0; index < ordered.length; index += 1) {
    const member = ordered[index];
    let memberEnd = member.dataOffset + member.compressedSize;
    if (member.flags & 8) {
      const descriptor = signature(view, memberEnd, 0x08074b50) ? memberEnd + 4 : memberEnd;
      if (descriptor + 12 > directoryOffset || view.getUint32(descriptor, true) !== member.crc || view.getUint32(descriptor + 4, true) !== member.compressedSize || view.getUint32(descriptor + 8, true) !== member.originalSize) fail("The XLSX archive has a malformed data descriptor.");
      memberEnd = descriptor + 12;
    }
    const nextStart = ordered[index + 1]?.localOffset ?? directoryOffset;
    if (memberEnd > nextStart) fail("The XLSX archive has overlapping member records.");
  }
  if (!names.has("[content_types].xml") || !names.has("xl/workbook.xml")) fail("This ZIP is not an XLSX workbook.");
  return members;
}

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function updateCrc(crc: number, bytes: Uint8Array): number {
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 255] ^ (crc >>> 8);
  return crc;
}

function worksheetExtent(xml: string): number | null {
  if (!/<(?:[\w.-]+:)?worksheet\b/u.test(xml)) return null;
  let highestRow = 0;
  let previousRow = 0;
  const checkAddress = (address: string) => {
    const match = /^([A-Z]+)([1-9]\d*)$/u.exec(address);
    if (!match || match[1].length > 2) fail("A worksheet has an invalid or oversized cell address.");
    let column = 0;
    for (const character of match[1]) column = column * 26 + character.charCodeAt(0) - 64;
    if (column > MAX_COLUMNS) fail("Use worksheets with 50 columns or fewer.");
    const row = Number(match[2]);
    if (!Number.isSafeInteger(row) || row > MAX_DATA_ROWS + 1) fail("Use worksheets with 10,000 data rows or fewer.");
    highestRow = Math.max(highestRow, row);
  };
  const dimension = /<(?:[\w.-]+:)?dimension\b[^>]*\bref=["']([^"']+)["']/u.exec(xml);
  if (dimension) {
    const range = dimension[1].split(":");
    if (range.length > 2) fail("A worksheet has an invalid range.");
    for (const address of range) checkAddress(address);
  }
  let rowCount = 0;
  for (const match of xml.matchAll(/<(?:[\w.-]+:)?row\b[^>]*>/gu)) {
    rowCount += 1;
    const explicitRow = /\br=["']([^"']+)["']/u.exec(match[0]);
    const row = explicitRow ? Number(explicitRow[1]) : previousRow + 1;
    if (!Number.isSafeInteger(row) || row < 1 || row > MAX_DATA_ROWS + 1 || rowCount > MAX_DATA_ROWS + 1) fail("Use worksheets with 10,000 data rows or fewer.");
    highestRow = Math.max(highestRow, row);
    previousRow = row;
  }
  let cellCount = 0;
  for (const match of xml.matchAll(/<(?:[\w.-]+:)?c\b[^>]*>/gu)) {
    cellCount += 1;
    if (cellCount > (MAX_DATA_ROWS + 1) * MAX_COLUMNS) fail("This worksheet has too many cells for the demo.");
    const address = /\br=["']([^"']+)["']/u.exec(match[0]);
    if (address) checkAddress(address[1]);
  }
  return Math.max(0, highestRow - 1);
}

/** Small compressed chunks bound inflation bursts even when ZIP sizes are forged. */
function verifyZip(bytes: Uint8Array): void {
  const members = zipDirectory(bytes);
  let actualTotal = 0;
  let worksheetCount = 0;
  let worksheetRows = 0;
  for (const member of members) {
    let actualSize = 0;
    let crc = -1;
    const xmlChunks: Uint8Array[] = [];
    const isXml = /\.xml$|\.rels$/i.test(member.name);
    const consume = (chunk: Uint8Array) => {
      actualSize += chunk.length;
      actualTotal += chunk.length;
      if (actualSize > MAX_MEMBER_BYTES || actualTotal > MAX_EXPANDED_BYTES || actualSize > member.originalSize) fail("The XLSX archive expands beyond its declared or safe size limit.");
      crc = updateCrc(crc, chunk);
      if (isXml) xmlChunks.push(chunk.slice());
    };
    const compressed = bytes.subarray(member.dataOffset, member.dataOffset + member.compressedSize);
    try {
      if (member.method === 0) consume(compressed);
      else {
        const inflate = new Inflate((chunk) => consume(chunk));
        if (!compressed.length) fail("The XLSX archive contains an empty compressed stream.");
        for (let offset = 0; offset < compressed.length; offset += 256) {
          inflate.push(compressed.subarray(offset, offset + 256), offset + 256 >= compressed.length);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("The XLSX archive")) throw error;
      fail("An XLSX archive member could not be decompressed.");
    }
    if (actualSize !== member.originalSize || ((crc ^ -1) >>> 0) !== member.crc) fail("The XLSX archive has an incorrect member size or checksum.");
    if (isXml) {
      const output = new Uint8Array(actualSize);
      let offset = 0;
      for (const chunk of xmlChunks) { output.set(chunk, offset); offset += chunk.length; }
      let xml: string;
      try { xml = utf8.decode(output); } catch { return fail("An XLSX XML part is not valid UTF-8."); }
      if (/<!DOCTYPE|<!ENTITY/i.test(xml)) fail("XML document types and entity declarations are not supported.");
      // SheetJS includes an unused .bin Default in ordinary XLSX output. Actual
      // binary parts were rejected above; macro-enabled Overrides are rejected here.
      if (member.name.toLowerCase() === "[content_types].xml" && /<(?:\w+:)?Override\b[^>]*(?:macroenabled|vbaproject|macrosheet|activex)/i.test(xml)) fail("Macro-enabled workbook content is not supported.");
      if (member.name.toLowerCase() === "xl/workbook.xml" && [...xml.matchAll(/<(?:\w+:)?sheet\b/g)].length > MAX_SHEETS) fail("Use a workbook with eight worksheets or fewer.");
      const extent = worksheetExtent(xml);
      if (extent !== null) {
        worksheetCount += 1;
        worksheetRows += extent;
        if (worksheetCount > MAX_SHEETS) fail("Use a workbook with eight worksheets or fewer.");
        if (worksheetRows > MAX_TOTAL_ROWS) fail("Use a workbook with 20,000 data rows or fewer across all worksheets.");
      }
    }
  }
}

function numericDate(value: number, date1904: boolean): string {
  // Excel stores a timestamp as the day plus a fraction of it. This demo summarizes
  // by date, so a date that carries a time keeps its day and loses the time.
  const serial = Number.isFinite(value) ? Math.floor(value) : Number.NaN;
  if (!Number.isInteger(serial) || serial < (date1904 ? 0 : 1) || (!date1904 && serial === 60)) {
    return `Invalid Excel date (serial ${value})`;
  }
  const parsed = XLSX.SSF.parse_date_code(serial, { date1904 }) as { y: number; m: number; d: number } | null;
  if (!parsed) return `Invalid Excel date (serial ${value})`;
  const iso = `${String(parsed.y).padStart(4, "0")}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  return parseJobDate(iso) ?? `Invalid Excel date (serial ${value})`;
}

function cellValue(cell: XLSX.CellObject | undefined, date1904: boolean, location: string): CellValue {
  if (!cell) return null;
  if (cell.t === "e") failSheet(`${location} contains an Excel error. Confirm its value in Excel before importing.`);
  if (cell.f !== undefined) return cell.f.startsWith("=") ? cell.f : `=${cell.f}`;
  if (cell.F !== undefined) return `[Formula range ${cell.F}; cached value ${String(cell.v ?? "")}]`;
  if (cell.v === undefined || cell.t === "z") return null;
  if (typeof cell.v === "number") {
    if (cell.z && XLSX.SSF.is_date(cell.z)) return numericDate(cell.v, date1904);
    // A numeric ID with a zero-padding format must not lose its leading zeroes.
    if (Number.isInteger(cell.v) && cell.w && /^-?0[\d -]/u.test(cell.w)) return cell.w;
    return cell.v;
  }
  if (typeof cell.v === "string" || typeof cell.v === "boolean") return cell.v;
  return String(cell.v);
}

function readWorksheet(
  workbook: XLSX.WorkBook,
  name: string,
  date1904: boolean,
): { sheet: WorkbookSheet; dataRows: number } {
  const worksheet = workbook.Sheets[name];
  const reference = worksheet["!fullref"] ?? worksheet["!ref"];
  if (!reference) failSheet(`“${name}” is empty. Put column names in row 1.`);
  let range: XLSX.Range;
  try { range = XLSX.utils.decode_range(reference); } catch { return failSheet(`“${name}” has an invalid worksheet range.`); }
  if (!Number.isSafeInteger(range.e.r) || range.e.r > MAX_DATA_ROWS) failSheet("Use worksheets with 10,000 data rows or fewer.");
  if (!Number.isSafeInteger(range.e.c) || range.e.c >= MAX_COLUMNS) failSheet("Use worksheets with 50 columns or fewer.");
  const declared = range.e.c + 1;
  const headerValues = Array.from({ length: declared }, (_, column) => {
    const address = XLSX.utils.encode_cell({ r: 0, c: column });
    return cellValue(worksheet[address], date1904, `“${name}” ${address}`);
  });
  const body: { sourceRow: number; cells: CellValue[]; formulaColumns: number[] }[] = [];
  for (let row = 1; row <= range.e.r; row += 1) {
    const formulaColumns: number[] = [];
    const cells = Array.from({ length: declared }, (_, column) => {
      const address = XLSX.utils.encode_cell({ r: row, c: column });
      const cell = worksheet[address] as XLSX.CellObject | undefined;
      if (cell?.f !== undefined || cell?.F !== undefined) formulaColumns.push(column);
      return validateText(cellValue(cell, date1904, `“${name}” ${address}`), row + 1);
    });
    body.push({ sourceRow: row + 1, cells, formulaColumns });
  }
  // A column Excel still formats but nobody filled in is not a missing column name.
  const width = usedWidth(headerValues, body.map((row) => row.cells));
  if (width === 0) failSheet(`“${name}” is empty. Put column names in row 1.`);
  const headers = validateHeaders(headerValues.slice(0, width), name);
  const rows: InputRow[] = body.map((row) => {
    const formulaColumns = row.formulaColumns.filter((column) => column < width);
    return {
      sourceRow: row.sourceRow,
      cells: row.cells.slice(0, width),
      ...(formulaColumns.length ? { formulaColumns } : {}),
    };
  });
  return { sheet: { name, headers, rows }, dataRows: range.e.r };
}

function parseXlsx(bytes: Uint8Array): ParsedWorkbook {
  verifyZip(bytes);
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(bytes, { type: "array", raw: true, cellFormula: true, cellNF: true, cellText: true, cellDates: false, sheetStubs: true, sheetRows: MAX_DATA_ROWS + 2, bookVBA: false });
  } catch {
    return fail("This XLSX could not be read. Save a fresh ordinary XLSX copy and try again.");
  }
  if (!workbook.SheetNames.length || workbook.SheetNames.length > MAX_SHEETS) fail("Use a workbook with one to eight worksheets.");
  const date1904 = Boolean(workbook.Workbook?.WBProps?.date1904);
  const sheets: WorkbookSheet[] = [];
  const skipped: SkippedSheet[] = [];
  let totalRows = 0;
  for (const name of workbook.SheetNames) {
    try {
      const { sheet, dataRows } = readWorksheet(workbook, name, date1904);
      totalRows += dataRows;
      if (totalRows > MAX_TOTAL_ROWS) fail("Use a workbook with 20,000 data rows or fewer across all worksheets.");
      sheets.push(sheet);
    } catch (error) {
      // Workbook-wide limits still reject the file; one unusable tab does not.
      if (!(error instanceof SheetError)) throw error;
      // Every reason has to say which worksheet it is about, even a bound that does not.
      const reason = error.message.includes(`“${name}”`) ? error.message : `“${name}”: ${error.message}`;
      skipped.push({ name, reason });
    }
  }
  if (!sheets.length) {
    fail(skipped.length === 1
      ? skipped[0].reason
      : `No worksheet in this file can be used. ${skipped.map((sheet) => sheet.reason).join(" ")}`);
  }
  return { sheets, skipped };
}

export function parseWorkbook(bytes: ArrayBuffer, filename: string): ParsedWorkbook {
  if (!(bytes instanceof ArrayBuffer) || !bytes.byteLength) fail("Choose a nonempty CSV or XLSX file.");
  if (bytes.byteLength > MAX_FILE_BYTES) fail("Choose a file no larger than 5 MiB.");
  if (typeof filename !== "string") fail("Choose a CSV or XLSX file.");
  const data = new Uint8Array(bytes);
  if (/\.csv$/i.test(filename)) return parseCsv(data, filename);
  if (/\.xlsx$/i.test(filename)) return parseXlsx(data);
  return fail("Use a .csv or .xlsx file. Legacy XLS and macro-enabled XLSM files are not supported.");
}

/** Explicit cell types keep formula-like strings inert when the result is opened. */
function outputSheet(rows: CellValue[][], moneyColumns: number[] = []): XLSX.WorkSheet {
  const sheet: XLSX.WorkSheet = {};
  const width = rows.reduce((maximum, row) => Math.max(maximum, row.length), 0);
  rows.forEach((row, rowIndex) => row.forEach((value, column) => {
    if (value === null) return;
    const cell: XLSX.CellObject = typeof value === "number" ? { t: "n", v: value } : typeof value === "boolean" ? { t: "b", v: value } : { t: "s", v: value };
    if (rowIndex > 0 && typeof value === "number" && moneyColumns.includes(column)) cell.z = '$#,##0.00;[Red]($#,##0.00)';
    sheet[XLSX.utils.encode_cell({ r: rowIndex, c: column })] = cell;
  }));
  sheet["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, rows.length - 1), c: Math.max(0, width - 1) } });
  sheet["!cols"] = Array.from({ length: width }, (_, column) => ({ wch: column === 1 ? 32 : 22 }));
  sheet["!autofilter"] = { ref: sheet["!ref"] };
  return sheet;
}

export function exportWorkbook(
  sheet: WorkbookSheet,
  result: NormalizeResult,
  mapping: Mapping,
  options: NormalizeOptions,
): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const ready: CellValue[][] = [["Source row", "Date", "Client", "Service", "Amount (USD)", "Possible duplicate"]];
  for (const row of result.readyRows) ready.push([row.sourceRow, row.date, row.customer, row.service, row.amountCents / 100, row.duplicate ? "Yes" : "No"]);
  const review: CellValue[][] = [["Source row", "Review reasons", ...sheet.headers]];
  for (const row of result.reviewRows) review.push([row.sourceRow, row.reasons.join(" "), ...row.cells]);
  const original: CellValue[][] = [["Source row", ...sheet.headers]];
  for (const row of result.originalRows) original.push([row.sourceRow, ...row.cells]);
  const summary: CellValue[][] = [
    ["Section", "Key", "Rows", "Amount (USD)"],
    ["Reconciliation", "Input data rows", result.inputCount, null],
    ["Reconciliation", "Ready", result.readyRows.length, result.totalCents / 100],
    ["Reconciliation", "Needs review", result.reviewRows.length, null],
    ["Reconciliation", "Blank", result.blankCount, null],
    ["Reconciliation", "Extra duplicate occurrences", result.duplicateCount, null],
    ...result.byWeek.map((group) => ["Week starting Monday", group.key, group.count, group.totalCents / 100] as CellValue[]),
    ...result.byService.map((group) => ["Service", group.key, group.count, group.totalCents / 100] as CellValue[]),
  ];
  const readme: CellValue[][] = [
    ["Item", "Details"],
    ["Source worksheet", sheet.name],
    ["Date setting", options.dateFormat === "us" ? "YYYY-MM-DD and MM/DD/YYYY" : "YYYY-MM-DD only"],
    ["Duplicate setting", options.excludeDuplicates ? "Extra occurrences moved to Needs review; first occurrence retained." : "All occurrences retained in Ready and marked as possible duplicates."],
    ["Date column", `${XLSX.utils.encode_col(mapping.date)}: ${sheet.headers[mapping.date]}`],
    ["Client column", `${XLSX.utils.encode_col(mapping.customer)}: ${sheet.headers[mapping.customer]}`],
    ["Service column", `${XLSX.utils.encode_col(mapping.service)}: ${sheet.headers[mapping.service]}`],
    ["Amount column", `${XLSX.utils.encode_col(mapping.amount)}: ${sheet.headers[mapping.amount]}`],
    ["Reconciliation", "Input rows = Ready + Needs review + Blank. Totals include Ready rows only. Negative amounts are credits."],
    ["Original data", "Includes every input data row, including blanks. Excel dates are represented as ISO dates, and a date cell carrying a time keeps the date; formatted leading-zero IDs keep their displayed text."],
    ["Formulas", "No formulas were evaluated. Formula expressions are literal text. Rows with a formula in a selected column require review, even if Excel supplied a cached value."],
    ["Output", "A new XLSX file containing cell values only. No source macros, hyperlinks, connections, charts, formatting, or other worksheets are copied."],
    ["Privacy", "The demo processes the file on this device. Save this workbook before closing or refreshing the page."],
  ];
  for (const [name, rows, money] of [["Ready", ready, [4]], ["Needs review", review, []], ["Original data", original, []], ["Summary", summary, [3]], ["Read me", readme, []]] as [string, CellValue[][], number[]][]) {
    XLSX.utils.book_append_sheet(workbook, outputSheet(rows, money), name);
  }
  return XLSX.write(workbook, { type: "array", bookType: "xlsx", compression: true }) as ArrayBuffer;
}
