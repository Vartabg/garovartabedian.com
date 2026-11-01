"use client";

import { useRef, useState, type FormEvent } from "react";
import { LANDING_INQUIRY_OPTIONS as options } from "@/lib/landing-demo-content";
import styles from "./page.module.css";

type Inquiry = { business: string; task: string; records: string; timing: string };
type CopyState = "idle" | "copying" | "copied" | "unavailable";
const emptyInquiry: Inquiry = { business: "", task: "", records: "", timing: "" };

const fields = [
  { key: "business", label: "Your business", options: options.business },
  { key: "task", label: "What needs attention?", options: options.task },
  { key: "records", label: "Where are your records?", options: options.records },
  { key: "timing", label: "When are you thinking?", options: options.timing },
] as const;

export default function InquiryPreview() {
  const [inquiry, setInquiry] = useState<Inquiry>(emptyInquiry);
  const [preview, setPreview] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const revision = useRef(0);
  const previewRef = useRef<HTMLDivElement>(null);

  function invalidate() {
    revision.current += 1;
    setPreview(null);
    setCopyState("idle");
  }

  function buildPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    revision.current += 1;
    setCopyState("idle");
    setPreview([
      "GOOD MEASURE — FICTIONAL INQUIRY PREVIEW",
      "",
      `Business: ${inquiry.business}`,
      `Help with: ${inquiry.task}`,
      `Current records: ${inquiry.records}`,
      `Timing: ${inquiry.timing}`,
      "",
      "I’d like to discuss the work, the records you would need, and a price before starting.",
      "",
      "Demo only. Nothing has been sent and no appointment has been booked.",
    ].join("\n"));
    // The preview is immediately after the form; focus announces the new result
    // without scrolling a phone visitor past the controls they just used.
    requestAnimationFrame(() => previewRef.current?.focus({ preventScroll: true }));
  }

  async function copyPreview() {
    if (!preview || copyState === "copying") return;
    const currentRevision = revision.current;
    setCopyState("copying");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(preview);
      if (currentRevision === revision.current) setCopyState("copied");
    } catch {
      if (currentRevision === revision.current) setCopyState("unavailable");
    }
  }

  return (
    <div className={styles.inquiryTool}>
      <form
        className={styles.inquiryForm}
        action="#request"
        onSubmit={buildPreview}
        onReset={() => {
          invalidate();
          setInquiry(emptyInquiry);
        }}
        aria-label="Try the bookkeeping inquiry preview"
        aria-describedby="inquiry-privacy"
      >
        <div className={styles.formFields}>
          {fields.map((field, index) => (
            <label className={styles.formField} htmlFor={`inquiry-${field.key}`} key={field.key}>
              <span className={styles.fieldNumber} aria-hidden="true">0{index + 1}</span>
              <span>{field.label}</span>
              <select
                id={`inquiry-${field.key}`}
                required
                value={inquiry[field.key]}
                onChange={(event) => {
                  invalidate();
                  setInquiry((current) => ({ ...current, [field.key]: event.target.value }));
                }}
              >
                <option value="" disabled>Choose an option</option>
                {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          ))}
        </div>
        <p id="inquiry-privacy" className={styles.formNotice}>This is a local preview for a fictional practice. No contact details or financial records needed. Nothing is sent or saved by this form.</p>
        <div className={styles.formActions}>
          <button type="submit" className={styles.primaryAction}>Preview inquiry <span aria-hidden="true">↗</span></button>
          <button type="reset" className={styles.resetAction}>Start over</button>
        </div>
        <noscript><p className={styles.formNotice}>JavaScript is needed to try the local inquiry preview. The rest of this sample page works without it.</p></noscript>
      </form>

      {preview && (
        <div className={styles.inquiryResult} ref={previewRef} tabIndex={-1} role="region" aria-label="Your inquiry preview">
          <p className={styles.eyebrow}>Your inquiry, ready to review</p>
          <h3>Here’s how it would read.</h3>
          <pre className={styles.previewText}>{preview}</pre>
          <div className={styles.formActions}>
            <button type="button" className={styles.secondaryAction} onClick={copyPreview} disabled={copyState === "copying"}>
              {copyState === "copying" ? "Copying…" : "Copy preview"}
            </button>
            <p className={styles.copyStatus} role="status" aria-live="polite">
              {copyState === "copied" && "Copied to your clipboard. Nothing was sent."}
              {copyState === "unavailable" && "Clipboard access isn’t available. Select the preview text above to copy it yourself."}
              {copyState === "idle" && "Edit a choice above to start a fresh preview."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
