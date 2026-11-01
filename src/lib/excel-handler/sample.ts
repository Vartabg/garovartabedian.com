import * as XLSX from "xlsx";

export const SAMPLE_FILENAME = "sample-client-work.xlsx";

/** Entirely fictional rows with deliberate problems to make the review step useful. */
export function createSampleWorkbook(): ArrayBuffer {
  const data = [
    ["Date", "Client", "Service", "Amount", "Reference"],
    ["2026-10-12", "Client A", "Document review", "$240.00", "00041"],
    ["2026-10-13", " Client B ", "Analysis session", 175.5, "00042"],
    ["2026-10-13", "Client B", "Analysis  session", "$175.50", "00043"],
    ["2026-10-14", "Client C", "Document review", "(25.00)", "00044"],
    ["2026-02-30", "Client D", "Analysis session", "90.00", "00045"],
    ["2026-10-15", "Client E", "Document review", "$1,2.00", "00046"],
    [null, null, null, null, null],
    ["10/16/2026", "Client F", "Analysis session", "$120.00", "00047"],
    ["2026-10-16", "Client G", "Document review", 150, "00048"],
    ["2026-10-19", "Client H", "Analysis session", "300.00", 49],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet.D10 = { t: "n", v: 150, f: "SUM(100,50)" };
  sheet.E11 = { t: "n", v: 49, z: "00000" };
  sheet["!cols"] = [{ wch: 15 }, { wch: 18 }, { wch: 24 }, { wch: 16 }, { wch: 16 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Fictional client work");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx", compression: true }) as ArrayBuffer;
}
