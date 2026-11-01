import type { CellValue, Mapping, NormalizeOptions, NormalizeResult } from "./model";
import type { SkippedSheet } from "./workbook";

export type SheetPreview = { name: string; headers: string[]; rowCount: number; preview: { sourceRow: number; cells: CellValue[] }[] };
export type ResultPreview = Omit<NormalizeResult, "originalRows" | "readyRows" | "reviewRows"> & {
  readyCount: number; reviewCount: number;
  readyRows: NormalizeResult["readyRows"];
  reviewRows: NormalizeResult["reviewRows"];
};
export type WorkerRequest =
  | { id: number; kind: "import"; filename: string; bytes: ArrayBuffer }
  | { id: number; kind: "sample" }
  | { id: number; kind: "process"; sheetIndex: number; mapping: Mapping; options: NormalizeOptions }
  | { id: number; kind: "export" };
export type WorkerResponse =
  | { id: number; kind: "loaded"; filename: string; sheets: SheetPreview[]; skipped: SkippedSheet[]; sample: boolean }
  | { id: number; kind: "processed"; result: ResultPreview }
  | { id: number; kind: "exported"; bytes: ArrayBuffer }
  | { id: number; kind: "error"; message: string };
