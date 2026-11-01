import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptyReport,
  reportFilename,
  REPORT_CHECKLIST,
  REPORT_LIMITS,
  validateReport,
  type JobReport,
} from "../src/lib/job-report/model";
import { readReportPhoto } from "../src/lib/job-report/photos";
import { reportText } from "../src/lib/job-report/text";

function ownReport(): JobReport {
  return { ...emptyReport(), business: "River Works", job: "Garden tidy" };
}

describe("job report data", () => {
  it("starts with the visitor's empty report, with no sample customer or work", () => {
    assert.deepEqual(emptyReport(), {
      business: "", job: "", customer: "", date: "", notes: "",
      completed: [], before: null, after: null,
    });
    const first: JobReport = emptyReport();
    first.completed.push(REPORT_CHECKLIST[0]);
    assert.deepEqual(emptyReport().completed, [], "reports must not share a checklist array");
  });

  it("requires a business and job while allowing a report without photos or customer details", () => {
    assert.equal(typeof validateReport(emptyReport()), "string");
    assert.equal(typeof validateReport({ ...ownReport(), business: " \n " }), "string");
    assert.equal(typeof validateReport({ ...ownReport(), job: "\t" }), "string");
    assert.equal(validateReport(ownReport()), null);
    assert.equal(validateReport({ ...ownReport(), completed: [...REPORT_CHECKLIST] }), null);
    assert.equal(typeof validateReport({ ...ownReport(), completed: ["Invented work"] }), "string");
    assert.equal(typeof validateReport({ ...ownReport(), completed: [REPORT_CHECKLIST[0], REPORT_CHECKLIST[0]] }), "string");
  });

  it("rejects oversized fields instead of quietly truncating customer work", () => {
    for (const field of ["business", "job", "customer", "notes"] as const) {
      const boundary = { ...ownReport(), [field]: "x".repeat(REPORT_LIMITS[field]) };
      assert.equal(validateReport(boundary), null, `${field} accepts its documented limit`);
      assert.equal(typeof validateReport({ ...boundary, [field]: `${boundary[field]}x` }), "string", field);
    }
  });

  it("accepts real calendar dates and rejects rollover or ambiguous dates", () => {
    for (const date of ["", "2024-02-29", "2026-10-20", "0001-01-01"]) {
      assert.equal(validateReport({ ...ownReport(), date }), null, date);
    }
    for (const date of ["2025-02-29", "2026-02-30", "2026-13-01", "2026-04-31", "10/20/2026", "0000-01-01"]) {
      assert.equal(typeof validateReport({ ...ownReport(), date }), "string", date);
    }
  });

  it("keeps Unicode notes and generates a safe, bounded PDF filename", () => {
    const report = { ...ownReport(), notes: "René — ավարտված ✅\n植栽を確認しました。", job: "../../Garden\r\n<tidy>: / customer" };
    assert.equal(validateReport(report), null);
    for (const name of [reportFilename(report), reportFilename(emptyReport()), reportFilename({ ...report, job: "x".repeat(100) })]) {
      assert.match(name, /\.pdf$/i);
      assert.doesNotMatch(name, /[\\/\r\n<>:]/);
      assert.ok(name.length < 180, "download names fit common filesystem limits");
      assert.ok(!name.startsWith("."));
    }
  });

  it("provides selectable Unicode details and honest work states without embedding photo data", () => {
    const report: JobReport = {
      ...ownReport(), business: "René's Garden", customer: "Մարիամ — garden", date: "2026-10-20",
      notes: "植栽を確認しました。\nԱշխատանքն ավարտված է ✅", completed: [REPORT_CHECKLIST[0]],
      before: { dataUrl: "data:image/jpeg;base64,cHJpdmF0ZS1waG90by1maXh0dXJl", width: 4, height: 4 },
    };
    const text = reportText(report);
    for (const value of [report.business, report.job, report.customer, report.date, report.notes]) assert.ok(text.includes(value));
    assert.ok(text.includes(`${REPORT_CHECKLIST[0]}: Marked complete`));
    for (const item of REPORT_CHECKLIST.slice(1)) assert.ok(text.includes(`${item}: Not marked complete`));
    assert.match(text, /Before: Included in the PDF/);
    assert.match(text, /After: No photo added/);
    assert.ok(!text.includes(report.before!.dataUrl));
    assert.doesNotMatch(text, /base64|cHJpdmF0ZS1waG90by1maXh0dXJl/);
  });
});

describe("job report photo boundaries", () => {
  it("rejects unsupported image formats before attempting browser decoding", async () => {
    await assert.rejects(readReportPhoto(new File(["<svg></svg>"], "drawing.svg", { type: "image/svg+xml" })));
    await assert.rejects(readReportPhoto(new File(["not a photo"], "notes.txt", { type: "text/plain" })));
  });

  it("rejects an oversized photo before allocating an image decoder", async () => {
    const bytes = new Uint8Array(REPORT_LIMITS.photoBytes + 1);
    await assert.rejects(readReportPhoto(new File([bytes], "large.jpg", { type: "image/jpeg" })));
  });

  it("rejects tiny compressed files that request an excessive decoded image allocation", async () => {
    const bytes = Buffer.alloc(24);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
    bytes.write("IHDR", 12);
    bytes.writeUInt32BE(32768, 16);
    bytes.writeUInt32BE(32768, 20);
    await assert.rejects(readReportPhoto(new File([bytes], "huge-pixels.png", { type: "image/png" })), /too large/i);
  });
});
