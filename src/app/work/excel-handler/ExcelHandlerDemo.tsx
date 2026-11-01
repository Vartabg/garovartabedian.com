"use client";

import { useEffect, useRef, useState } from "react";
import type { Mapping, NormalizeOptions } from "@/lib/excel-handler/model";
import type { ResultPreview, SheetPreview, WorkerRequest, WorkerResponse } from "@/lib/excel-handler/protocol";
import type { SkippedSheet } from "@/lib/excel-handler/workbook";
import styles from "./page.module.css";

type Loaded = { filename: string; sample: boolean; sheets: SheetPreview[]; skipped: SkippedSheet[] };
type Operation = WorkerRequest["kind"];
const defaults: Mapping = { date: 0, customer: 1, service: 2, amount: 3 };
const fields = [["date", "Date"], ["customer", "Client"], ["service", "Service"], ["amount", "Amount (USD)"]] as const;
const dollars = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
function guessMapping(headers: string[]): Mapping {
  const found = new Set<number>();
  const mapping = { ...defaults };
  for (const [field] of fields) {
    const pattern = { date: /date/i, customer: /client|customer/i, service: /service|work|description/i, amount: /amount|total|price/i }[field];
    let index = headers.findIndex((name, column) => pattern.test(name) && !found.has(column));
    if (index < 0) index = headers.findIndex((_, column) => !found.has(column));
    mapping[field] = index;
    found.add(index);
  }
  return mapping;
}

export default function ExcelHandlerDemo() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [mapping, setMapping] = useState<Mapping>(defaults);
  const [options, setOptions] = useState<NormalizeOptions>({ dateFormat: "iso", excludeDuplicates: false });
  const [result, setResult] = useState<ResultPreview | null>(null);
  const [busy, setBusy] = useState<Operation | null>(null);
  const [status, setStatus] = useState("Start with the fictional sample or open your own file.");
  const [error, setError] = useState("");
  const [download, setDownload] = useState<{ url: string; name: string } | null>(null);
  const worker = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceName = useRef("client-work.xlsx");
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => () => {
    worker.current?.terminate();
    if (timer.current) clearTimeout(timer.current);
    requestId.current += 1;
  }, []);
  useEffect(() => () => { if (download) URL.revokeObjectURL(download.url); }, [download]);

  function invalidate() { setResult(null); setDownload(null); setError(""); }
  function endWorker() {
    worker.current?.terminate();
    worker.current = null;
    requestId.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }
  function clear() {
    endWorker();
    setLoaded(null); invalidate(); setBusy(null);
    setStatus("Cleared. Open a file or try the sample.");
    if (fileInput.current) fileInput.current.value = "";
  }
  function fail(message: string) {
    endWorker(); setBusy(null); setLoaded(null); invalidate(); setError(message);
    setStatus("Choose another file or try the sample.");
  }
  function ensureWorker(): Worker {
    if (worker.current) return worker.current;
    const instance = new Worker(new URL("./workbook.worker.ts", import.meta.url), { type: "module" });
    worker.current = instance;
    instance.onerror = () => { if (worker.current === instance) fail("The spreadsheet worker stopped. Try the sample or a smaller file."); };
    instance.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      if (worker.current !== instance || response.id !== requestId.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      setBusy(null);
      if (response.kind === "error") { setError(response.message); setStatus("Check the file or column choices and try again."); return; }
      if (response.kind === "loaded") {
        sourceName.current = response.filename;
        setLoaded(response); setSheetIndex(0); setMapping(guessMapping(response.sheets[0].headers));
        setOptions({ dateFormat: "iso", excludeDuplicates: false });
        const left = response.skipped.length;
        setStatus(`${response.sheets.length} worksheet${response.sheets.length === 1 ? "" : "s"} opened.${left ? ` ${left} other sheet${left === 1 ? "" : "s"} could not be used.` : ""} Check the columns, then create the summary.`);
      } else if (response.kind === "processed") {
        setResult(response.result);
        setStatus(`Checked ${response.result.inputCount} rows: ${response.result.readyCount} ready, ${response.result.reviewCount} need review, ${response.result.blankCount} blank.`);
      } else {
        const name = `${sourceName.current.replace(/\.[^.]+$/, "").slice(0, 70)}-checked.xlsx`;
        const url = URL.createObjectURL(new Blob([response.bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
        setDownload({ url, name });
        const link = document.createElement("a"); link.href = url; link.download = name; link.click();
        setStatus("Workbook ready. It includes Ready, Needs review, Original data, Summary and Read me sheets. Save it again below if needed.");
      }
    };
    return instance;
  }
  function begin(kind: Operation) {
    const instance = ensureWorker();
    const id = ++requestId.current;
    setBusy(kind); setError("");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (requestId.current === id) fail("Processing stopped after 15 seconds. Try a smaller workbook; nothing was uploaded.");
    }, 15_000);
    return { instance, id };
  }
  function sample() {
    clear();
    try { const { instance, id } = begin("sample"); setStatus("Opening the fictional sample…"); instance.postMessage({ id, kind: "sample" } satisfies WorkerRequest); }
    catch { fail("Your browser could not start the spreadsheet worker."); }
  }
  async function openFile(file: File | undefined) {
    if (!file) return;
    clear();
    if (!/\.(xlsx|csv)$/i.test(file.name)) { setError("Choose an .xlsx or .csv file. Older .xls files and macro-enabled workbooks are not supported."); return; }
    if (file.size > 5 * 1024 * 1024 || file.size === 0) { setError("Choose a nonempty file up to 5 MiB."); return; }
    let pending: { instance: Worker; id: number } | null = null;
    try {
      const { instance, id } = begin("import");
      pending = { instance, id };
      setStatus("Reading your file in this page…");
      const bytes = await file.arrayBuffer();
      if (worker.current !== instance || requestId.current !== id) return;
      instance.postMessage({ id, kind: "import", bytes, filename: file.name } satisfies WorkerRequest, [bytes]);
    } catch {
      if (pending && (worker.current !== pending.instance || requestId.current !== pending.id)) return;
      fail("The file could not be opened. Try the sample or select the file again.");
    }
  }
  function process() {
    invalidate();
    try { const { instance, id } = begin("process"); setStatus("Checking rows and calculating the summary…"); instance.postMessage({ id, kind: "process", sheetIndex, mapping, options } satisfies WorkerRequest); }
    catch { fail("Your browser could not start the spreadsheet worker."); }
  }
  function exportFile() {
    setDownload(null);
    try { const { instance, id } = begin("export"); setStatus("Building your Excel workbook…"); instance.postMessage({ id, kind: "export" } satisfies WorkerRequest); }
    catch { fail("Your browser could not create the workbook. Try again."); }
  }
  const sheet = loaded?.sheets[sheetIndex];
  const validMapping = new Set(Object.values(mapping)).size === 4 && Object.values(mapping).every(index => index >= 0);
  return <section className={styles.demo} aria-labelledby="spreadsheet-demo-title">
    <div className={styles.toolHeading}><div><p className={styles.eyebrow}>A working demo / Client-work summary</p><h2 id="spreadsheet-demo-title">Open. Check. Keep.</h2></div><span className={styles.localBadge}>Files stay on your device</span></div>
    <div className={styles.inputBar}>
      <div><button type="button" className={styles.primary} onClick={sample} disabled={!!busy}>Try the fictional sample</button><p>Messy dates, a duplicate and a credit included.</p></div>
      <span className={styles.or}>or</span>
      <div className={styles.fileField}><label htmlFor="workbook-file">Open your Excel or CSV file</label><input ref={fileInput} id="workbook-file" type="file" accept=".xlsx,.csv" disabled={!!busy} onChange={event => void openFile(event.target.files?.[0])} /><p>.xlsx or UTF-8 .csv · up to 5 MiB</p></div>
    </div>
    <div className={styles.statusBar}><p role="status" aria-live="polite">{status}</p>{(loaded || busy) && <button type="button" className={styles.textButton} onClick={clear}>{busy ? "Cancel and clear" : "Clear file"}</button>}</div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <details className={styles.fileNotes}><summary>Accepted files and what gets checked</summary><p>Put column names in the first row. Each data row needs a date, client, service and USD amount. Choose those four columns below. ISO dates use YYYY-MM-DD; slash dates require the US setting.</p><p>Up to 8 worksheets, 50 columns and 10,000 data rows per worksheet; 20,000 rows across the file. Expanded workbooks have a 20 MiB limit. Formulas in selected columns go to review. A worksheet that is blank, narrower than four columns or holds an Excel error cell is listed and left out; the rest of the file still opens. Columns without a name in row 1 are listed by position. Workbooks with ZIP archive comments need a fresh XLSX copy. No macros or formulas are run. Blank rows and rows needing review stay in the exported original data.</p><p>Amounts are checked and added, not reconciled against bank records. The summary uses only Ready rows. Duplicate removal is optional. This demo handles one worksheet at a time.</p></details>
    {sheet && loaded && <>
      <div className={styles.fileTitle}><div><p className={styles.eyebrow}>01 / Your source</p><h3>{loaded.filename}</h3></div><p>{sheet.rowCount.toLocaleString()} data rows{loaded.sample ? " · Fictional example data" : ""}</p></div>
      {loaded.skipped.length > 0 && <details className={styles.fileNotes}><summary>{loaded.skipped.length} worksheet{loaded.skipped.length === 1 ? "" : "s"} left out of this file</summary><ul>{loaded.skipped.map(item => <li key={item.name}>{item.reason}</li>)}</ul></details>}
      <fieldset className={styles.controls} disabled={!!busy}>
        <legend>Choose the worksheet and columns</legend>
        <label className={styles.sheetSelect}>Worksheet<select value={sheetIndex} onChange={event => { const index = Number(event.target.value); setSheetIndex(index); setMapping(guessMapping(loaded.sheets[index].headers)); invalidate(); setStatus("Worksheet changed. Check the columns and create a new summary."); }}>{loaded.sheets.map((item, index) => <option key={index} value={index}>{item.name}</option>)}</select></label>
        <div className={styles.mapping}>{fields.map(([field, label]) => <label key={field}>{label}<select value={mapping[field]} onChange={event => { setMapping({ ...mapping, [field]: Number(event.target.value) }); invalidate(); setStatus("Column changed. Create a new summary to apply it."); }}>{sheet.headers.map((header, index) => <option key={index} value={index}>{index + 1}. {header}</option>)}</select></label>)}</div>
        {!validMapping && <p className={styles.error}>Choose four different columns.</p>}
        <div className={styles.options}><label>Date format<select value={options.dateFormat} onChange={event => { setOptions({ ...options, dateFormat: event.target.value as "iso" | "us" }); invalidate(); }}><option value="iso">ISO only: YYYY-MM-DD</option><option value="us">ISO + US: MM/DD/YYYY</option></select></label><label className={styles.checkbox}><input type="checkbox" checked={options.excludeDuplicates} onChange={event => { setOptions({ ...options, excludeDuplicates: event.target.checked }); invalidate(); }} /><span>Move extra duplicates to review<small>Off by default. Matching date, client, service and amount.</small></span></label></div>
      </fieldset>
      <details className={styles.sourcePreview}><summary>Preview original data · first {sheet.preview.length} rows</summary><div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Original data preview"><table><caption>Source worksheet: {sheet.name}</caption><thead><tr><th scope="col">Row</th>{sheet.headers.map((header, index) => <th scope="col" key={index}>{header}</th>)}</tr></thead><tbody>{sheet.preview.map(row => <tr key={row.sourceRow}><th scope="row">{row.sourceRow}</th>{row.cells.map((cell, index) => <td key={index}>{cell === null ? "—" : String(cell)}</td>)}</tr>)}</tbody></table></div></details>
      <div className={styles.runBar}><p>Whitespace is cleaned. Dates become ISO.<br />Questionable rows are kept for you to review.</p><button type="button" className={styles.primary} disabled={!!busy || !validMapping} onClick={process}>Check & summarize →</button></div>
    </>}
    {result && <section className={styles.results} aria-labelledby="summary-title">
      <div className={styles.resultHeading}><div><p className={styles.eyebrow}>02 / The result</p><h3 id="summary-title">A week you can read.</h3></div><div><button type="button" className={styles.primary} disabled={!!busy} onClick={exportFile}>Download workbook .xlsx</button>{download && <a className={styles.saveAgain} href={download.url} download={download.name}>Save workbook again</a>}</div></div>
      <dl className={styles.totals}><div><dt>Ready rows · USD</dt><dd>{dollars(result.totalCents)}</dd></div><div><dt>Ready</dt><dd>{result.readyCount}</dd></div><div><dt>Need review</dt><dd>{result.reviewCount}</dd></div><div><dt>Blank</dt><dd>{result.blankCount}</dd></div></dl>
      <p className={styles.accounting}>{result.inputCount} input rows = {result.readyCount} ready + {result.reviewCount} needing review + {result.blankCount} blank. {result.duplicateCount} extra duplicate{result.duplicateCount === 1 ? "" : "s"} found; {options.excludeDuplicates ? "moved to review" : "kept in totals"}.</p>
      <div className={styles.summaryGrid}>{[{title: "By week", groups: result.byWeek, column: "Week starting Monday"}, {title: "By service", groups: result.byService, column: "Service"}].map(({title, groups, column}) => <div key={title} className={styles.summaryTable}><div className={styles.tableScroll} tabIndex={0} role="region" aria-label={`${title} summary`}><table><caption>{title}</caption><thead><tr><th scope="col">{column}</th><th scope="col">Rows</th><th scope="col">USD</th></tr></thead><tbody>{groups.slice(0, 30).map(group => <tr key={group.key}><th scope="row">{group.key}</th><td>{group.count}</td><td>{dollars(group.totalCents)}</td></tr>)}</tbody></table></div>{groups.length === 0 && <p>No Ready rows to summarize.</p>}{groups.length > 30 && <p>First 30 of {groups.length} groups. The workbook contains all groups.</p>}</div>)}</div>
      <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Ready rows preview"><table><caption>Ready · first {result.readyRows.length} of {result.readyCount} rows</caption><thead><tr>{["Source row", "Date", "Client", "Service", "USD", "Duplicate"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{result.readyRows.map(row => <tr key={row.sourceRow}><th scope="row">{row.sourceRow}</th><td>{row.date}</td><td>{row.customer}</td><td>{row.service}</td><td>{dollars(row.amountCents)}</td><td>{row.duplicate ? "Yes · check this" : "—"}</td></tr>)}</tbody></table></div>
      {result.reviewCount > 0 && <div className={styles.review}><h4>Needs your review</h4><p>These rows are excluded from the totals. Their original values and reasons are in the workbook.</p><ul>{result.reviewRows.map(row => <li key={row.sourceRow}><strong>Row {row.sourceRow}</strong><span>{row.reasons.join(" ")}</span></li>)}</ul>{result.reviewCount > result.reviewRows.length && <p>Showing the first {result.reviewRows.length} of {result.reviewCount} rows needing review.</p>}</div>}
      <p className={styles.exportNote}>Your download keeps every source row in Original data, plus the cleaned rows, review reasons, summary and settings. Text is exported as text, including any formula expressions.</p>
    </section>}
  </section>;
}
