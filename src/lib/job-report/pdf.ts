import { type JobReport, REPORT_CHECKLIST, validateReport } from "./model";
import { ReportPages } from "./layout";

function pageJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The report could not be saved. Try again.")), "image/jpeg", 0.92);
  });
}

export async function createReportPdf(report: JobReport): Promise<Blob> {
  const error = validateReport(report);
  if (error) throw new Error(error);
  // Browser-rendered pages preserve the platform's Unicode font shaping and
  // photo pixels without fetching fonts or sending customer data to a server.
  // This is a visual PDF; the separate HTML preview remains accessible text.
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${report.job.trim()} — Job report`);
  pdf.setAuthor(report.business.trim());
  pdf.setCreator("Job report demo");
  const layout = new ReportPages(async (canvas) => {
    const jpeg = await pageJpeg(canvas);
    const image = await pdf.embedJpg(await jpeg.arrayBuffer());
    const page = pdf.addPage([595.28, 841.89]);
    page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  try {
    await layout.text(report.business.trim(), { size: 30, bold: true });
    await layout.text(report.job.trim(), { size: 43, bold: true, gap: 22 });
    if (report.customer.trim()) await layout.text(`Customer / location: ${report.customer.trim()}`, { size: 26 });
    if (report.date) await layout.text(`Job date: ${report.date}`, { size: 26 });
    await layout.heading("Recorded work");
    for (const item of REPORT_CHECKLIST) {
      const status = report.completed.includes(item) ? "Marked complete" : "Not marked complete";
      await layout.text(`${item} — ${status}`, { size: 25, gap: 6 });
    }
    await layout.heading("Notes");
    await layout.text(report.notes.trim() || "No notes added.", { size: 27 });
    if (report.before || report.after) await layout.photos(report.before, report.after);
    if (!report.before && !report.after) await layout.text("No photos added.", { size: 25 });
    await layout.finish();
    const bytes = await pdf.save();
    return new Blob([new Uint8Array(bytes).buffer], { type: "application/pdf" });
  } finally {
    layout.dispose();
  }
}
