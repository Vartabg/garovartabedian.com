/** Pure, bounded normalization for the spreadsheet demo. No formulas are evaluated. */
export type CellValue = string | number | boolean | null;

export type InputRow = {
  sourceRow: number;
  cells: CellValue[];
  formulaColumns?: number[];
};

export type Mapping = {
  date: number;
  customer: number;
  service: number;
  amount: number;
};

export type DateFormat = "iso" | "us";
export type NormalizeOptions = {
  dateFormat: DateFormat;
  excludeDuplicates: boolean;
};

export type ReadyRow = {
  sourceRow: number;
  date: string;
  customer: string;
  service: string;
  amountCents: number;
  duplicate: boolean;
};

export type ReviewRow = {
  sourceRow: number;
  cells: CellValue[];
  reasons: string[];
};

export type SummaryGroup = {
  key: string;
  count: number;
  totalCents: number;
};

export type NormalizeResult = {
  inputCount: number;
  /** A separate copy of every original row, including blank and excluded rows. */
  originalRows: InputRow[];
  readyRows: ReadyRow[];
  reviewRows: ReviewRow[];
  blankCount: number;
  /** Extra occurrences beyond the first; all members have duplicate=true. */
  duplicateCount: number;
  totalCents: number;
  /** Keys are Gregorian dates of the Monday starting each ISO week. */
  byWeek: SummaryGroup[];
  byService: SummaryGroup[];
};

const MAX_ROWS = 10_000;
const MAX_COLUMNS = 50;
const MAX_CELL_LENGTH = 2_000;
const MAX_AMOUNT_CENTS = 100_000_000_000;
const FIELDS = ["date", "customer", "service", "amount"] as const;
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Whitespace only: identifiers and formula-like text keep their characters. */
function normalizeWhitespace(value: string): string {
  return value.replace(/[\p{White_Space}\uFEFF]+/gu, " ").trim();
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function monthLength(year: number, month: number): number {
  return MONTH_LENGTHS[month - 1] + (month === 2 && isLeapYear(year) ? 1 : 0);
}

/** ISO is always accepted; slash dates require an explicit US setting. */
export function parseJobDate(
  value: CellValue,
  dateFormat: DateFormat = "iso",
): string | null {
  if (typeof value !== "string") return null;
  const text = normalizeWhitespace(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const us = dateFormat === "us" ? /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text) : null;
  if (!iso && !us) return null;
  const year = Number(iso ? iso[1] : us![3]);
  const month = Number(iso ? iso[2] : us![1]);
  const day = Number(iso ? iso[3] : us![2]);
  if (
    year < 1 || year > 9999 || month < 1 || month > 12 ||
    day < 1 || day > monthLength(year, month)
  ) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Parse decimal dollars as integer cents without binary floating-point rounding. */
export function parseAmountCents(value: CellValue): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (typeof value === "number" && !Number.isFinite(value)) return null;
  let text = typeof value === "string" ? normalizeWhitespace(value) : String(value);
  let negative = false;
  if (text.startsWith("(") && text.endsWith(")")) {
    negative = true;
    text = text.slice(1, -1);
  } else if (text.startsWith("-")) {
    negative = true;
    text = text.slice(1);
  }
  if (text.startsWith("$")) text = text.slice(1);
  if (!/^(?:\d+|[1-9]\d{0,2}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.replaceAll(",", "").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MAX_AMOUNT_CENTS) return null;
  // Canonical zero avoids an observable negative zero in summaries and exports.
  return cents === 0 ? 0 : negative ? -cents : cents;
}

function textCell(value: CellValue | undefined): string | null {
  if (typeof value === "string") return normalizeWhitespace(value) || null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function blankCell(value: CellValue): boolean {
  return value === null || (typeof value === "string" && normalizeWhitespace(value) === "");
}

function copyRow(row: InputRow): InputRow {
  return {
    sourceRow: row.sourceRow,
    cells: [...row.cells],
    ...(row.formulaColumns ? { formulaColumns: [...row.formulaColumns] } : {}),
  };
}

function validateInput(rows: InputRow[], mapping: Mapping, options: NormalizeOptions): void {
  if (!Array.isArray(rows)) throw new Error("Rows must be an array.");
  if (rows.length > MAX_ROWS) throw new Error("Use a worksheet with 10,000 data rows or fewer.");
  if (!options || !["iso", "us"].includes(options.dateFormat) || typeof options.excludeDuplicates !== "boolean") {
    throw new Error("Choose an ISO or US date format and a duplicate setting.");
  }
  if (!mapping || typeof mapping !== "object") throw new Error("Choose four different columns.");
  const indexes = FIELDS.map((field) => mapping[field]);
  if (indexes.some((index) => !Number.isInteger(index) || index < 0 || index >= MAX_COLUMNS) || new Set(indexes).size !== FIELDS.length) {
    throw new Error("Choose four different columns between 1 and 50.");
  }
  let width = 0;
  for (const row of rows) {
    if (!row || !Number.isSafeInteger(row.sourceRow) || row.sourceRow < 1 || !Array.isArray(row.cells)) {
      throw new Error("Each row needs its original worksheet row number and cell values.");
    }
    if (row.cells.length > MAX_COLUMNS) throw new Error("Use a worksheet with 50 columns or fewer.");
    width = Math.max(width, row.cells.length);
    for (const cell of row.cells) {
      if (cell !== null && !["string", "number", "boolean"].includes(typeof cell)) {
        throw new Error(`Row ${row.sourceRow} contains an unsupported cell value.`);
      }
      if (typeof cell === "string" && cell.length > MAX_CELL_LENGTH) {
        throw new Error(`Row ${row.sourceRow} has a cell longer than 2,000 characters.`);
      }
    }
    if (row.formulaColumns !== undefined && (!Array.isArray(row.formulaColumns) || row.formulaColumns.some((index) => !Number.isInteger(index) || index < 0 || index >= MAX_COLUMNS))) {
      throw new Error(`Row ${row.sourceRow} has an invalid formula column.`);
    }
  }
  if (width > 0 && indexes.some((index) => index >= width)) {
    throw new Error("A selected column is outside the worksheet data.");
  }
}

function daysBeforeYear(year: number): number {
  const prior = year - 1;
  return prior * 365 + Math.floor(prior / 4) - Math.floor(prior / 100) + Math.floor(prior / 400);
}

function ordinal(year: number, month: number, day: number): number {
  let days = daysBeforeYear(year) + day;
  for (let current = 1; current < month; current += 1) days += monthLength(year, current);
  return days;
}

function dateFromOrdinal(day: number): string {
  let low = 1;
  let high = 9999;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (daysBeforeYear(middle) < day) low = middle;
    else high = middle - 1;
  }
  let remaining = day - daysBeforeYear(low);
  let month = 1;
  while (remaining > monthLength(low, month)) {
    remaining -= monthLength(low, month);
    month += 1;
  }
  return `${String(low).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(remaining).padStart(2, "0")}`;
}

function weekStart(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const dayNumber = ordinal(year, month, day);
  // In the proleptic Gregorian calendar, 0001-01-01 is a Monday.
  return dateFromOrdinal(dayNumber - ((dayNumber - 1) % 7));
}

function addCents(left: number, right: number): number {
  const sum = left + right;
  if (!Number.isSafeInteger(sum)) throw new Error("The combined amount exceeds the safe integer limit.");
  return sum;
}

function summarize(rows: ReadyRow[], keyFor: (row: ReadyRow) => string): SummaryGroup[] {
  const groups = new Map<string, SummaryGroup>();
  for (const row of rows) {
    const key = keyFor(row);
    const group = groups.get(key) ?? { key, count: 0, totalCents: 0 };
    group.count += 1;
    group.totalCents = addCents(group.totalCents, row.amountCents);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
}

export function normalizeRows(
  rows: InputRow[],
  mapping: Mapping,
  options: NormalizeOptions,
): NormalizeResult {
  validateInput(rows, mapping, options);
  const originalRows = rows.map(copyRow);
  const reviewEntries: { row: ReviewRow; inputIndex: number }[] = [];
  const candidates: { ready: ReadyRow; original: InputRow; key: string; inputIndex: number }[] = [];
  const duplicateGroups = new Map<string, number>();
  let blankCount = 0;

  for (const [inputIndex, row] of originalRows.entries()) {
    const mappedFormula = row.formulaColumns?.some((column) => FIELDS.some((field) => mapping[field] === column)) ?? false;
    // A formula without a cached value remains an input row requiring review.
    if (row.cells.every(blankCell) && !row.formulaColumns?.length) {
      blankCount += 1;
      continue;
    }
    const reasons: string[] = [];
    if (mappedFormula) reasons.push("A selected column contains a formula. Replace it with a confirmed value.");
    const date = parseJobDate(row.cells[mapping.date] ?? null, options.dateFormat);
    const customer = textCell(row.cells[mapping.customer]);
    const service = textCell(row.cells[mapping.service]);
    const amountCents = parseAmountCents(row.cells[mapping.amount] ?? null);
    if (date === null) reasons.push(options.dateFormat === "us" ? "Date must be YYYY-MM-DD or MM/DD/YYYY and a real calendar date." : "Date must be YYYY-MM-DD and a real calendar date.");
    if (customer === null) reasons.push("Customer is missing or is not text or a number.");
    if (service === null) reasons.push("Service is missing or is not text or a number.");
    if (amountCents === null) reasons.push("Amount must be a USD number with at most two decimal places, up to $1,000,000,000.");
    if (reasons.length > 0 || date === null || customer === null || service === null || amountCents === null) {
      reviewEntries.push({ row: { sourceRow: row.sourceRow, cells: [...row.cells], reasons }, inputIndex });
      continue;
    }
    const key = JSON.stringify([date, customer, service, amountCents]);
    duplicateGroups.set(key, (duplicateGroups.get(key) ?? 0) + 1);
    candidates.push({ ready: { sourceRow: row.sourceRow, date, customer, service, amountCents, duplicate: false }, original: row, key, inputIndex });
  }

  const readyRows: ReadyRow[] = [];
  const firstRows = new Map<string, number>();
  let duplicateCount = 0;
  let totalCents = 0;
  for (const { ready, original, key, inputIndex } of candidates) {
    ready.duplicate = duplicateGroups.get(key)! > 1;
    if (firstRows.has(key)) {
      duplicateCount += 1;
      if (options.excludeDuplicates) {
        reviewEntries.push({ row: { sourceRow: original.sourceRow, cells: [...original.cells], reasons: [`Duplicate of source row ${firstRows.get(key)}. Excluded from totals.`] }, inputIndex });
        continue;
      }
    } else firstRows.set(key, ready.sourceRow);
    readyRows.push(ready);
    totalCents = addCents(totalCents, ready.amountCents);
  }
  // Both lists follow source input order, even when duplicates moved to Review.
  const reviewRows = reviewEntries.sort((a, b) => a.inputIndex - b.inputIndex).map((entry) => entry.row);
  return {
    inputCount: rows.length,
    originalRows,
    readyRows,
    reviewRows,
    blankCount,
    duplicateCount,
    totalCents,
    byWeek: summarize(readyRows, (row) => weekStart(row.date)),
    byService: summarize(readyRows, (row) => row.service),
  };
}
