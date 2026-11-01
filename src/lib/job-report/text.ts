import { REPORT_CHECKLIST, type JobReport } from "./model";

/** Selectable, screen-reader-friendly companion to the visual photo PDF. */
export function reportText(report: JobReport): string {
  return [
    "JOB REPORT", report.business, report.job, "",
    `Customer / location: ${report.customer || "Not provided"}`,
    `Job date: ${report.date || "Not provided"}`, "", "WORK RECORDED",
    ...REPORT_CHECKLIST.map(item => `${item}: ${report.completed.includes(item) ? "Marked complete" : "Not marked complete"}`),
    "", "NOTES & FOLLOW-UP", report.notes || "No notes added.", "", "PHOTOS",
    `Before: ${report.before ? "Included in the PDF" : "No photo added"}`,
    `After: ${report.after ? "Included in the PDF" : "No photo added"}`,
    "", "Prepared from the details entered in the job report demo.", "",
  ].join("\n");
}
