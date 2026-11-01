/// <reference lib="webworker" />
import { normalizeRows, type Mapping, type NormalizeOptions, type NormalizeResult } from "@/lib/excel-handler/model";
import { parseWorkbook, exportWorkbook, type ParsedWorkbook, type WorkbookSheet } from "@/lib/excel-handler/workbook";
import { createSampleWorkbook, SAMPLE_FILENAME } from "@/lib/excel-handler/sample";
import type { WorkerRequest, WorkerResponse } from "@/lib/excel-handler/protocol";

let book: ParsedWorkbook | undefined;
let processed: { sheet: WorkbookSheet; result: NormalizeResult; mapping: Mapping; options: NormalizeOptions } | undefined;
const scope = self as unknown as DedicatedWorkerGlobalScope;
function send(response: WorkerResponse, transfer: Transferable[] = []) { scope.postMessage(response, transfer); }
scope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    if (request.kind === "import" || request.kind === "sample") {
      book = undefined;
      processed = undefined;
      const filename = request.kind === "sample" ? SAMPLE_FILENAME : request.filename;
      const bytes = request.kind === "sample" ? createSampleWorkbook() : request.bytes;
      book = parseWorkbook(bytes, filename);
      send({ id: request.id, kind: "loaded", filename, sample: request.kind === "sample", skipped: book.skipped, sheets: book.sheets.map(sheet => ({
        name: sheet.name, headers: sheet.headers, rowCount: sheet.rows.length, preview: sheet.rows.slice(0, 6),
      })) });
    } else if (request.kind === "process") {
      processed = undefined;
      const sheet = book?.sheets[request.sheetIndex];
      if (!sheet) throw new Error("Open a file and choose a worksheet first.");
      const result = normalizeRows(sheet.rows, request.mapping, request.options);
      processed = { sheet, result, mapping: request.mapping, options: request.options };
      send({ id: request.id, kind: "processed", result: {
        inputCount: result.inputCount, blankCount: result.blankCount, duplicateCount: result.duplicateCount,
        totalCents: result.totalCents, byWeek: result.byWeek, byService: result.byService,
        readyCount: result.readyRows.length, reviewCount: result.reviewRows.length,
        readyRows: result.readyRows.slice(0, 10), reviewRows: result.reviewRows.slice(0, 10),
      } });
    } else {
      if (!processed) throw new Error("Prepare a summary before exporting.");
      const bytes = exportWorkbook(processed.sheet, processed.result, processed.mapping, processed.options);
      send({ id: request.id, kind: "exported", bytes }, [bytes]);
    }
  } catch (error) {
    send({ id: request.id, kind: "error", message: error instanceof Error ? error.message : "The file could not be processed. Try the sample or a smaller file." });
  }
};
