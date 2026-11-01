import { expect, test, type Download, type Locator, type Page } from "@playwright/test";
import axe from "axe-core";
import * as XLSX from "xlsx";

const headers = ["Date", "Client", "Service", "Amount", "Reference"];
const privateClient = "Private CSV client e2e-809";
const formulaText = '=HYPERLINK("https://invalid.example/e2e-private", "Private formula text")';
const csvRows = [
  ["2026-10-12", privateClient, "Record organization", "100.25", "0001"],
  ["2026-10-12", ` ${privateClient} `, "Record  organization", "$100.25", "0002"],
  ["10/13/2026", "Private ambiguous-date client", "Catch-up", "75.00", "0003"],
  ["", "", "", "", ""],
  ["2026-10-14", "Private credit client", "Record organization", "(20.00)", "0004"],
  ["2026-10-15", formulaText, "Monthly", "50.00", "0005"],
];

function csvFile(name = "private-client-work.csv") {
  const buffer = Buffer.from([headers, ...csvRows].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n"));
  return { name, mimeType: "text/csv", buffer };
}

async function downloadBytes(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function watchPrivateRequests(page: Page) {
  const leaked: string[] = [];
  page.on("request", (request) => {
    const payload = `${request.url()}\n${request.postData() ?? ""}`;
    if ([privateClient, "Private workbook client", "e2e-private", "private-client-work.csv"].some((marker) => payload.includes(marker))) {
      leaked.push(`${request.method()} ${request.url()}`);
    }
  });
  return leaked;
}

function resultRegion(page: Page) {
  return page.getByRole("region", { name: "A week you can read.", exact: true });
}

async function expectTotals(result: Locator, expected: { total: string; ready: number; review: number; blank: number }) {
  for (const [label, value] of [
    ["Ready rows · USD", expected.total], ["Ready", String(expected.ready)],
    ["Need review", String(expected.review)], ["Blank", String(expected.blank)],
  ]) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const metric = result.locator("dt").filter({ hasText: new RegExp(`^${escaped}$`) }).locator("xpath=following-sibling::dd");
    await expect(metric).toHaveText(value);
  }
}

async function processRows(page: Page) {
  const run = page.getByRole("button", { name: "Check & summarize", exact: false });
  await expect(run).toBeEnabled();
  await run.click();
  await expect(resultRegion(page)).toBeVisible();
  return resultRegion(page);
}

async function openCsv(page: Page) {
  await page.getByLabel("Open your Excel or CSV file", { exact: true }).setInputFiles(csvFile());
  await expect(page.getByRole("combobox", { name: "Worksheet", exact: true })).toHaveValue("0");
  await expect(page.getByRole("status")).toContainText("1 worksheet opened");
}

async function fillLandingInquiry(page: Page) {
  await page.getByRole("combobox", { name: "Your business", exact: true }).selectOption({ label: "Freelancer / independent professional" });
  await page.getByRole("combobox", { name: "What needs attention?", exact: true }).selectOption({ label: "Catch-up & cleanup" });
  await page.getByRole("combobox", { name: "Where are your records?", exact: true }).selectOption({ label: "A spreadsheet" });
  await page.getByRole("combobox", { name: "When are you thinking?", exact: true }).selectOption({ label: "Within the next month" });
}

test("the $100 total package links to all three working examples", async ({ page }) => {
  await page.goto("/work");
  const menu = page.getByRole("region", { name: "All three. $100 total.", exact: true });
  await expect(menu.getByRole("article")).toHaveCount(3);
  for (const [label, href] of [
    ["Try the landing page demo", "/work/landing-page"],
    ["Try the Excel handler demo", "/work/excel-handler"],
    ["Try the job report demo", "/work/job-report"],
  ]) {
    await expect(menu.getByRole("link", { name: label, exact: true })).toHaveAttribute("href", href);
  }
  await expect(menu).toContainText("USD total · all three deliverables · one business");
  const email = new URL((await menu.getByRole("link", { name: "Ask for the $100 package", exact: true }).getAttribute("href"))!);
  expect(email.protocol).toBe("mailto:");
  expect(email.searchParams.get("body")).toContain("all three together at $100 USD total");
  await menu.getByRole("link", { name: "Try the landing page demo", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/work\/landing-page$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your books,");
  await page.getByRole("link", { name: "Back to the $100 package", exact: false }).click();
  await expect(page).toHaveURL(/\/work#starter-menu$/);
  await page.getByRole("region", { name: "All three. $100 total.", exact: true }).getByRole("link", { name: "Try the Excel handler demo", exact: true }).click();
  await expect(page).toHaveURL(/\/work\/excel-handler$/);
  await expect(page.getByRole("button", { name: "Try the fictional sample", exact: true })).toBeVisible();
});

test("the fictional landing page validates, previews, and copies with a truthful fallback", async ({ page }) => {
  const leaked = watchPrivateRequests(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new DOMException("Denied by the browser fixture", "NotAllowedError"); } },
    });
  });
  await page.goto("/work/landing-page");
  const submit = page.getByRole("button", { name: "Preview inquiry", exact: false });
  await submit.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Your inquiry preview", exact: true })).toHaveCount(0);
  expect(await page.getByRole("combobox", { name: "Your business", exact: true }).evaluate((element) => (element as HTMLSelectElement).validity.valueMissing)).toBe(true);
  await fillLandingInquiry(page);
  await submit.focus();
  await page.keyboard.press("Enter");
  const preview = page.getByRole("region", { name: "Your inquiry preview", exact: true });
  await expect(preview).toContainText("Help with: Catch-up & cleanup");
  await expect(preview).toContainText("Current records: A spreadsheet");
  await expect(preview).toContainText("Nothing has been sent and no appointment has been booked");
  await expect(preview).toBeFocused();
  await preview.getByRole("button", { name: "Copy preview", exact: true }).click();
  await expect(preview.getByRole("status")).toContainText("Select the preview text above to copy it yourself");
  await expect(preview.locator("pre")).toHaveCSS("user-select", "text");
  await page.getByRole("combobox", { name: "Where are your records?", exact: true }).selectOption({ label: "Bookkeeping software" });
  await expect(preview).toHaveCount(0);
  await submit.click();
  await expect(preview).toContainText("Current records: Bookkeeping software");
  await expect(preview.getByRole("status")).not.toContainText("Clipboard access");
  await page.getByRole("button", { name: "Start over", exact: true }).click();
  await expect(preview).toHaveCount(0);
  for (const label of ["Your business", "What needs attention?", "Where are your records?", "When are you thinking?"]) {
    await expect(page.getByRole("combobox", { name: label, exact: true })).toHaveValue("");
  }
  expect(new URL(page.url()).search).toBe("");
  expect(leaked).toEqual([]);
});

test("a real private CSV yields correct totals and a five-sheet workbook with every original row", async ({ page }) => {
  const leaked = watchPrivateRequests(page);
  await page.goto("/work/excel-handler");
  await openCsv(page);
  const result = await processRows(page);
  await expectTotals(result, { total: "$230.50", ready: 4, review: 1, blank: 1 });
  await expect(result).toContainText("6 input rows = 4 ready + 1 needing review + 1 blank");
  await expect(result).toContainText("1 extra duplicate found; kept in totals");
  await expect(page.getByRole("region", { name: "Ready rows preview", exact: true })).toContainText(formulaText);
  await expect(result).toContainText("Date must be YYYY-MM-DD");
  const downloadEvent = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download workbook .xlsx", exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("private-client-work-checked.xlsx");
  const workbook = XLSX.read(await downloadBytes(download), { type: "buffer", raw: true, cellFormula: true });
  expect(workbook.SheetNames).toEqual(["Ready", "Needs review", "Original data", "Summary", "Read me"]);
  const original = XLSX.utils.sheet_to_json(workbook.Sheets["Original data"], { header: 1, raw: true, defval: null });
  expect(original).toEqual([["Source row", ...headers], ...csvRows.map((row, index) => [index + 2, ...row])]);
  const ready = XLSX.utils.sheet_to_json<(string | number)[]>(workbook.Sheets.Ready, { header: 1, raw: true });
  expect(ready).toHaveLength(5);
  expect(ready.slice(1).map((row) => row[4])).toEqual([100.25, 100.25, -20, 50]);
  expect(workbook.Sheets["Original data"].F2).toMatchObject({ t: "s", v: "0001" });
  const formulaCells = Object.values(workbook.Sheets).flatMap((sheet) => Object.entries(sheet)
    .filter(([key]) => !key.startsWith("!"))
    .map(([, cell]) => cell as XLSX.CellObject));
  expect(formulaCells.every((cell) => cell.f === undefined)).toBe(true);
  const inertText = formulaCells.filter((cell) => cell.v === formulaText);
  expect(inertText.length).toBeGreaterThanOrEqual(2);
  expect(inertText.every((cell) => cell.t === "s")).toBe(true);
  expect(leaked).toEqual([]);
});

test("date, duplicate, and column choices invalidate stale results and change the next summary", async ({ page }) => {
  await page.goto("/work/excel-handler");
  await openCsv(page);
  await processRows(page);
  const duplicates = page.getByRole("checkbox", { name: "Move extra duplicates to review", exact: false });
  await duplicates.check();
  await expect(resultRegion(page)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Save workbook again", exact: true })).toHaveCount(0);
  let result = await processRows(page);
  await expectTotals(result, { total: "$130.25", ready: 3, review: 2, blank: 1 });
  await expect(result).toContainText("Duplicate of source row 2");
  await page.getByRole("combobox", { name: "Date format", exact: true }).selectOption("us");
  await expect(resultRegion(page)).toHaveCount(0);
  result = await processRows(page);
  await expectTotals(result, { total: "$205.25", ready: 4, review: 1, blank: 1 });
  await page.getByRole("combobox", { name: "Client", exact: true }).selectOption("0");
  await expect(resultRegion(page)).toHaveCount(0);
  await expect(page.getByText("Choose four different columns.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Check & summarize", exact: false })).toBeDisabled();
  await page.getByRole("combobox", { name: "Client", exact: true }).selectOption("1");
  await expect(page.getByRole("button", { name: "Check & summarize", exact: false })).toBeEnabled();
});

test("the sample opens by keyboard and real XLSX worksheet changes discard the old summary", async ({ page }) => {
  const leaked = watchPrivateRequests(page);
  await page.goto("/work/excel-handler");
  const sample = page.getByRole("button", { name: "Try the fictional sample", exact: true });
  await sample.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("combobox", { name: "Worksheet", exact: true })).toHaveValue("0");
  await expect(page.getByRole("heading", { name: "sample-client-work.xlsx", exact: true })).toBeVisible();
  const run = page.getByRole("button", { name: "Check & summarize", exact: false });
  await expect(run).toBeEnabled();
  await run.focus();
  await page.keyboard.press("Enter");
  await expectTotals(resultRegion(page), { total: "$866.00", ready: 5, review: 4, blank: 1 });

  const workbook = XLSX.utils.book_new();
  const first = XLSX.utils.aoa_to_sheet([headers, ["2026-10-12", "Private workbook client", "Review", 40, "00001"], ["2026-10-13", "Formula row", "Review", 45, "00002"]]);
  first.D3 = { t: "n", v: 45, f: "SUM(20,25)" };
  XLSX.utils.book_append_sheet(workbook, first, "Week one");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ["Client", "USD total", "Reference", "Service", "Date"],
    ["Private workbook client", 123.45, "00003", "Cleanup", "2026-10-19"],
  ]), "Week two");
  await page.getByLabel("Open your Excel or CSV file", { exact: true }).setInputFiles({
    name: "two-weeks.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: XLSX.write(workbook, { type: "buffer", bookType: "xlsx", compression: true }),
  });
  await expect(page.getByRole("status")).toContainText("2 worksheets opened");
  await expect(resultRegion(page)).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Worksheet", exact: true }).locator("option")).toHaveText(["Week one", "Week two"]);
  let result = await processRows(page);
  await expectTotals(result, { total: "$40.00", ready: 1, review: 1, blank: 0 });
  await expect(result).toContainText("A selected column contains a formula");
  await page.getByRole("combobox", { name: "Worksheet", exact: true }).selectOption({ label: "Week two" });
  await expect(resultRegion(page)).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Date", exact: true })).toHaveValue("4");
  await expect(page.getByRole("combobox", { name: "Client", exact: true })).toHaveValue("0");
  await expect(page.getByRole("combobox", { name: "Amount (USD)", exact: true })).toHaveValue("1");
  result = await processRows(page);
  await expectTotals(result, { total: "$123.45", ready: 1, review: 0, blank: 0 });
  expect(leaked).toEqual([]);
});

test("rejecting an old cancelled file read cannot erase a newer sample", async ({ page }) => {
  await page.addInitScript(() => {
    const original = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = function (this: File) {
      if (this.name !== "delayed.csv") return original.call(this);
      return new Promise<ArrayBuffer>((_resolve, reject) => {
        (window as typeof window & { rejectDelayedFileRead?: () => void }).rejectDelayedFileRead = () => reject(new Error("Late fixture read failure"));
      });
    };
  });
  await page.goto("/work/excel-handler");
  await page.getByLabel("Open your Excel or CSV file", { exact: true }).setInputFiles(csvFile("delayed.csv"));
  await page.getByRole("button", { name: "Cancel and clear", exact: true }).click();
  await page.getByRole("button", { name: "Try the fictional sample", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Worksheet", exact: true })).toBeVisible();
  await page.evaluate(async () => {
    (window as typeof window & { rejectDelayedFileRead?: () => void }).rejectDelayedFileRead?.();
    await Promise.resolve();
    await Promise.resolve();
  });
  await expect(page.getByRole("heading", { name: "sample-client-work.xlsx", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Open. Check. Keep.", exact: true }).getByRole("alert")).toHaveCount(0);
  await expectTotals(await processRows(page), { total: "$866.00", ready: 5, review: 4, blank: 1 });
});

for (const route of ["landing-page", "excel-handler"] as const) {
  test(`${route} fits 320/390px and its main controls remain touch sized at enlarged type`, async ({ page }) => {
    await page.goto(`/work/${route}`);
    if (route === "excel-handler") {
      await openCsv(page);
      await processRows(page);
    } else {
      await fillLandingInquiry(page);
      await page.getByRole("button", { name: "Preview inquiry", exact: false }).click();
    }
    const controls = route === "landing-page"
      ? [page.getByRole("combobox", { name: "Your business", exact: true }), page.getByRole("button", { name: "Preview inquiry", exact: false }), page.getByRole("button", { name: "Copy preview", exact: true })]
      : [page.getByLabel("Open your Excel or CSV file", { exact: true }), page.getByRole("combobox", { name: "Date", exact: true }), page.getByRole("button", { name: "Check & summarize", exact: false }), page.getByRole("button", { name: "Download workbook .xlsx", exact: true })];
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => {
        document.documentElement.dataset.a11ySize = "largest";
        document.documentElement.dataset.a11ySpacing = "spacious";
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      for (const control of controls) {
        await expect(control).toBeVisible();
        const box = await control.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test(`${route} has accessible forms and results in light and dark themes`, async ({ page }) => {
    await page.goto(`/work/${route}`);
    if (route === "excel-handler") {
      await openCsv(page);
      await processRows(page);
    } else {
      await fillLandingInquiry(page);
      await page.getByRole("button", { name: "Preview inquiry", exact: false }).click();
    }
    await page.addScriptTag({ content: axe.source });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => { document.documentElement.dataset.a11yTheme = value; }, theme);
      const violations = await page.evaluate(async () => {
        const results = await (window as typeof window & { axe: typeof axe }).axe.run("body", {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        });
        return results.violations.map((violation) => ({
          id: violation.id,
          nodes: violation.nodes.map((node) => ({ target: node.target, reason: node.failureSummary })),
        }));
      });
      expect(violations, `${route} ${theme}`).toEqual([]);
    }
  });
}
