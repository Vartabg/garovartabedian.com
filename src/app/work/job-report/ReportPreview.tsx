import Image from "next/image";
import type { JobReport } from "@/lib/job-report/model";
import { REPORT_CHECKLIST } from "@/lib/job-report/model";
import styles from "./page.module.css";

export default function ReportPreview({ report }: { report: JobReport }) {
  return (
    <article className={styles.paper} aria-label="Report contents">
      <header className={styles.paperHeader}>
        <p className={styles.eyebrow}>Job report</p>
        <p className={styles.business}>{report.business || "Your business"}</p>
        <h3>{report.job || "Your job title"}</h3>
        <dl className={styles.reportFacts}>
          <div><dt>Customer / location</dt><dd>{report.customer || "Not provided"}</dd></div>
          <div><dt>Job date</dt><dd>{report.date || "Not provided"}</dd></div>
        </dl>
      </header>
      <div className={styles.photoPair}>
        {(["before", "after"] as const).map(phase => <figure key={phase}>
          <figcaption>{phase === "before" ? "Before" : "After"}</figcaption>
          {report[phase] ? <Image src={report[phase].dataUrl} width={report[phase].width} height={report[phase].height} alt={`${phase === "before" ? "Before" : "After"} job photo`} unoptimized /> : <div className={styles.photoPlaceholder}>No photo added</div>}
        </figure>)}
      </div>
      <h4>Work recorded</h4>
      <ul className={styles.reportChecks}>{REPORT_CHECKLIST.map(item => <li key={item}>
        <span aria-hidden="true">{report.completed.includes(item) ? "✓" : "—"}</span>
        <span>{item}<small>{report.completed.includes(item) ? "Marked complete" : "Not marked complete"}</small></span>
      </li>)}</ul>
      <h4>Notes &amp; follow-up</h4>
      <p className={styles.reportNotes}>{report.notes || "No notes added."}</p>
      <p className={styles.paperFooter}>Prepared with the free job report demo. Review the details before sharing.</p>
    </article>
  );
}
