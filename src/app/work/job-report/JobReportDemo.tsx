"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, buttonClassName } from "@/app/_components/Button";
import { emptyReport, REPORT_CHECKLIST, REPORT_LIMITS, reportFilename, validateReport, type JobReport } from "@/lib/job-report/model";
import { readReportPhoto } from "@/lib/job-report/photos";
import { exampleReport } from "@/lib/job-report/sample";
import { reportText } from "@/lib/job-report/text";
import PhotoField from "./PhotoField";
import ReportPreview from "./ReportPreview";
import styles from "./page.module.css";

type PreparedReport = { file: File; url: string; textUrl: string; canShare: boolean };
type TextField = "business" | "job" | "customer" | "date" | "notes";

export default function JobReportDemo() {
  const [report, setReport] = useState<JobReport>(emptyReport);
  const [prepared, setPrepared] = useState<PreparedReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [example, setExample] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const revision = useRef(0);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);

  useEffect(() => () => { revision.current += 1; }, []);
  useEffect(() => () => { if (prepared) { URL.revokeObjectURL(prepared.url); URL.revokeObjectURL(prepared.textUrl); } }, [prepared]);

  function change(update: (previous: JobReport) => JobReport) {
    revision.current += 1;
    setReport(update); setPrepared(null); setError("");
    setStatus("Draft updated. Create the report when you’re ready to save it.");
  }
  function field(name: TextField, value: string) { change(previous => ({ ...previous, [name]: value })); }
  const hasContent = Object.values(report).some(value => Array.isArray(value) ? value.length > 0 : Boolean(value));

  async function loadExample() {
    if (hasContent && !window.confirm("Replace this draft with the fictional example? Save your report first if you want to keep it.")) return;
    setBusy(true); setError("");
    const current = ++revision.current;
    try {
      const sample = await exampleReport();
      if (current !== revision.current) return;
      setReport(sample); setPrepared(null); setExample(true);
      setStatus("Fictional example loaded. Its illustrations are not customer photos. You can edit every field.");
    } catch { setError("The example could not be loaded. You can still enter your own details and photos."); }
    finally { setBusy(false); }
  }
  function startOver() {
    if (hasContent && !window.confirm("Clear this draft and its photos? Save your PDF first if you want to keep it.")) return;
    revision.current += 1; setReport(emptyReport()); setPrepared(null); setExample(false); setError("");
    setStatus("Draft cleared. Your new report starts empty.");
  }
  async function addPhoto(phase: "before" | "after", file: File) {
    setBusy(true); setError(""); setStatus(`Preparing your ${phase} photo on this device…`);
    const current = revision.current;
    try {
      const photo = await readReportPhoto(file);
      if (current !== revision.current) return;
      change(previous => ({ ...previous, [phase]: photo }));
      setStatus(`${phase === "before" ? "Before" : "After"} photo added. It stays in this page until you save the report.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "That photo could not be opened. Try a JPEG, PNG or WebP image."); }
    finally { setBusy(false); }
  }
  async function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validateReport(report);
    if (problem) {
      setError(problem); requestAnimationFrame(() => errorMessage.current?.focus()); return;
    }
    setBusy(true); setError(""); setStatus("Creating your PDF on this device…");
    const current = revision.current;
    try {
      const { createReportPdf } = await import("@/lib/job-report/pdf");
      const blob = await createReportPdf(report);
      if (current !== revision.current) return;
      const file = new File([blob], reportFilename(report), { type: "application/pdf" });
      let canShare = false;
      try { canShare = typeof navigator.share === "function" && Boolean(navigator.canShare?.({ files: [file] })); } catch { /* Download remains available. */ }
      const text = new Blob([reportText(report)], { type: "text/plain;charset=utf-8" });
      setPrepared({ file, url: URL.createObjectURL(file), textUrl: URL.createObjectURL(text), canShare });
      setStatus("Your PDF is ready. Review the report, then save it or choose a share destination.");
      requestAnimationFrame(() => resultHeading.current?.focus());
    } catch { setError("The PDF could not be created. Your draft and photos are still here. Try again with smaller photos."); }
    finally { setBusy(false); }
  }
  async function share() {
    if (!prepared) return;
    setSharing(true); setError("");
    try {
      await navigator.share({ files: [prepared.file], title: "Job report" });
      setStatus("Share dialog finished. Check your chosen app to confirm the report was delivered.");
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") setStatus("Sharing cancelled. Your PDF is still ready to save.");
      else setError("Sharing didn’t finish. Save the PDF and attach it to your message instead.");
    } finally { setSharing(false); }
  }

  return (
    <div className={styles.demo} id="job-report-demo">
      <div className={styles.toolbar}>
        <div><p className={styles.eyebrow}>The working demo</p><p>Use an example, or start with your own job.</p></div>
        <div className={styles.toolbarButtons}>
          <Button variant="primary" onClick={loadExample} disabled={busy || sharing}>Try an example</Button>
          <Button variant="ghost" onClick={startOver} disabled={busy || sharing || !hasContent}>Start over</Button>
        </div>
      </div>
      {example && <p className={styles.exampleNote}>You started from a fictional example. Its original business, job and illustrations are sample content. Review or replace every detail before using a report for real work.</p>}
      <p className={styles.message} role="alert" tabIndex={-1} ref={errorMessage} hidden={!error}>{error}</p>
      <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">{status}</p>
      <div className={styles.workspace}>
        <form onSubmit={prepare} noValidate aria-label="Create a job report">
          <fieldset className={styles.editor} disabled={busy || sharing}>
            <legend className={styles.srOnly}>Your job report details</legend>
            <section className={styles.step} aria-labelledby="job-details-title">
              <h2 id="job-details-title"><span aria-hidden="true">01</span> The job</h2>
              <label htmlFor="report-business">Business name <span>(required)</span></label>
              <input id="report-business" value={report.business} maxLength={REPORT_LIMITS.business} onChange={e => field("business", e.target.value)} autoComplete="organization" required />
              <label htmlFor="report-job">Job title <span>(required)</span></label>
              <input id="report-job" value={report.job} maxLength={REPORT_LIMITS.job} onChange={e => field("job", e.target.value)} placeholder="e.g. Patio cleanup" required />
              <label htmlFor="report-customer">Customer or location <span>(optional)</span></label>
              <input id="report-customer" value={report.customer} maxLength={REPORT_LIMITS.customer} onChange={e => field("customer", e.target.value)} />
              <label htmlFor="report-date">Job date <span>(optional)</span></label>
              <input id="report-date" type="date" value={report.date} onChange={e => field("date", e.target.value)} />
            </section>
            <section className={styles.step} aria-labelledby="job-photos-title">
              <h2 id="job-photos-title"><span aria-hidden="true">02</span> Before &amp; after</h2>
              <p id="photo-help" className={styles.small}>Use your camera or choose a photo. JPEG, PNG or WebP, up to 10 MB each. Photos are optional and are not uploaded.</p>
              <div className={styles.photoInputs}>{(["before", "after"] as const).map(phase => <PhotoField key={phase} phase={phase} photo={report[phase]} disabled={busy || sharing} onChange={file => addPhoto(phase, file)} onRemove={() => change(previous => ({ ...previous, [phase]: null }))} />)}</div>
            </section>
            <section className={styles.step} aria-labelledby="job-work-title">
              <h2 id="job-work-title"><span aria-hidden="true">03</span> Record the work</h2>
              <p className={styles.small}>Only mark what you completed. Unmarked items stay clearly identified in the report.</p>
              <div className={styles.checklist}>{REPORT_CHECKLIST.map(item => <label key={item}><input type="checkbox" checked={report.completed.includes(item)} onChange={event => { const checked = event.target.checked; change(previous => ({ ...previous, completed: checked ? [...previous.completed, item] : previous.completed.filter(value => value !== item) })); }} /><span>{item}</span></label>)}</div>
              <label htmlFor="report-notes">Notes <span>(optional)</span></label>
              <textarea id="report-notes" rows={5} maxLength={REPORT_LIMITS.notes} value={report.notes} onChange={e => field("notes", e.target.value)} placeholder="What changed? Anything the customer should know?" />
              <p className={styles.small}>{report.notes.length} / {REPORT_LIMITS.notes} characters</p>
            </section>
            <div className={styles.createAction}><Button type="submit" variant="primary" fullWidth disabled={busy}>Create report</Button><a href="#job-report-preview">Review the draft first</a></div>
          </fieldset>
        </form>
        <section className={styles.preview} id="job-report-preview" aria-labelledby="job-preview-title">
          <div className={styles.previewHeading}><p className={styles.eyebrow}>{prepared ? "Ready to save" : "Live draft"}</p><h2 id="job-preview-title" ref={resultHeading} tabIndex={-1}>Job report preview</h2></div>
          {prepared && <div className={styles.exportActions}>
            <a className={styles.saveButton} href={prepared.url} download={prepared.file.name} onClick={() => setStatus("PDF opened for saving. Choose where to keep it on your device.")}>Save PDF</a>
            <a className={buttonClassName({ variant: "ghost" })} href={prepared.textUrl} download={prepared.file.name.replace(/\.pdf$/, ".txt")}>Save text copy</a>
            {prepared.canShare && <Button variant="ghost" onClick={share} disabled={sharing} loading={sharing} loadingLabel="Sharing report">Share report</Button>}
            <p className={styles.small}>{prepared.canShare ? "You choose the destination. The demo does not send anything automatically." : "Save the PDF, then attach it in your email or messaging app."}</p>
            <p className={styles.small}>The PDF preserves the visual report. The text copy contains selectable words; photos are in the PDF.</p>
          </div>}
          <ReportPreview report={report} />
          <p className={styles.small}>This demo keeps no job archive. Save your PDF before refreshing or closing this page.</p>
        </section>
      </div>
      <noscript><p>This demo needs JavaScript to prepare photos and create your report on your device. The customization offer below is available without it.</p></noscript>
    </div>
  );
}
