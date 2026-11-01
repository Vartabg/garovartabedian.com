export type ReportPhoto = { dataUrl: string; width: number; height: number };

export type JobReport = {
  business: string;
  job: string;
  customer: string;
  date: string;
  notes: string;
  completed: string[];
  before: ReportPhoto | null;
  after: ReportPhoto | null;
};

export const REPORT_CHECKLIST = [
  "Requested work completed",
  "Work area checked",
  "Work area left tidy",
  "Photos recorded",
] as const;

export const REPORT_LIMITS = {
  business: 80,
  job: 100,
  customer: 100,
  notes: 1200,
  photoBytes: 10 * 1024 * 1024,
  photoEdge: 1600,
} as const;

export function emptyReport(): JobReport {
  return {
    business: "", job: "", customer: "", date: "", notes: "",
    completed: [], before: null, after: null,
  };
}

function validDate(value: string): boolean {
  if (!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validPhoto(photo: ReportPhoto | null): boolean {
  if (photo === null) return true;
  return typeof photo === "object" && typeof photo.dataUrl === "string" &&
    photo.dataUrl.length <= 15 * 1024 * 1024 &&
    /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.dataUrl) &&
    Number.isInteger(photo.width) && Number.isInteger(photo.height) &&
    photo.width > 0 && photo.height > 0 &&
    photo.width <= REPORT_LIMITS.photoEdge && photo.height <= REPORT_LIMITS.photoEdge;
}

export function validateReport(report: JobReport): string | null {
  if (!report || typeof report !== "object") return "Add your report details first.";
  const fields = [
    ["business", "Business name"], ["job", "Job title"],
    ["customer", "Customer or location"], ["notes", "Notes"],
  ] as const;
  for (const [key, label] of fields) {
    if (typeof report[key] !== "string") return `${label} must be text.`;
    if (report[key].length > REPORT_LIMITS[key]) {
      return `${label} must be ${REPORT_LIMITS[key]} characters or fewer.`;
    }
  }
  if (!report.business.trim()) return "Add a business name.";
  if (!report.job.trim()) return "Add a job title.";
  if (typeof report.date !== "string" || (report.date && !validDate(report.date))) {
    return "Choose a valid job date.";
  }
  if (!Array.isArray(report.completed) || report.completed.length > REPORT_CHECKLIST.length ||
      new Set(report.completed).size !== report.completed.length ||
      report.completed.some((item) => !REPORT_CHECKLIST.includes(item as typeof REPORT_CHECKLIST[number]))) {
    return "Choose recorded work from the checklist.";
  }
  if (!validPhoto(report.before) || !validPhoto(report.after)) {
    return "Choose the before and after photos again.";
  }
  return null;
}

export function reportFilename(report: JobReport): string {
  const job = report.job.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)
    .replace(/-+$/g, "");
  return `${job || "job-report"}${report.date && validDate(report.date) ? `-${report.date}` : ""}.pdf`;
}
