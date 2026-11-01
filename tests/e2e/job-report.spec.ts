import { expect, test, type Download, type Page } from "@playwright/test";
import axe from "axe-core";
import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";

async function photoFile(page: Page, color: string) {
  const data = await page.evaluate((fill) => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const context = canvas.getContext("2d")!;
    context.fillStyle = fill;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png").split(",")[1];
  }, color);
  return { name: `${color}.png`, mimeType: "image/png", buffer: Buffer.from(data, "base64") };
}

async function downloadBytes(download: Download): Promise<Buffer> {
  // BrowserServer downloads do not expose a local path to the test runner.
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function readPdf(download: Download) {
  const bytes = await downloadBytes(download);
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  return PDFDocument.load(bytes);
}

async function photoColorsInPdf(page: Page, pdf: PDFDocument) {
  const images = pdf.context.enumerateIndirectObjects().flatMap(([, object]) => {
    if (!(object instanceof PDFRawStream) || object.dict.get(PDFName.of("Subtype"))?.toString() !== "/Image") return [];
    if (object.dict.get(PDFName.of("Filter"))?.toString() !== "/DCTDecode") return [];
    return [Buffer.from(object.contents).toString("base64")];
  });
  expect(images.length, "the PDF contains rendered page images").toBeGreaterThan(0);
  return page.evaluate(async (encoded) => {
    let red = 0;
    let blue = 0;
    for (const jpeg of encoded) {
      const image = new Image();
      image.src = `data:image/jpeg;base64,${jpeg}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index] > 180 && pixels[index + 1] < 80 && pixels[index + 2] < 80) red += 1;
        if (pixels[index] < 80 && pixels[index + 1] < 80 && pixels[index + 2] > 180) blue += 1;
      }
    }
    return { red, blue };
  }, images);
}

async function fillOwnReport(page: Page) {
  await page.getByLabel(/^Business name/).fill("River Works private fixture");
  await page.getByLabel(/^Job title/).fill("Garden tidy");
  await page.getByLabel(/^Customer or location/).fill("Private garden fixture");
  await page.getByLabel(/^Job date/).fill("2026-10-20");
}

test("the free job report demo and $100 three-item package are discoverable and fit a phone", async ({ page }) => {
  await page.goto("/work");
  const menu = page.getByRole("region", { name: "All three. $100 total." });
  await expect(menu.getByRole("article")).toHaveCount(3);
  const inquiry = menu.getByRole("link", { name: "Ask for the $100 package", exact: true });
  await expect(inquiry).toHaveCount(1);
  const email = new URL((await inquiry.getAttribute("href"))!);
  expect(email.protocol).toBe("mailto:");
  expect(email.pathname).toBe("garo.vartabed@gmail.com");
  expect(email.searchParams.get("subject")).toBe("$100 three-item business package");
  expect(email.searchParams.get("body")).toContain("all three together at $100 USD total before starting");
  for (const [name, device] of [
    ["Simple landing page", "Phone + desktop visitors"],
    ["Excel document handler", "Excel on a computer"],
    ["Job report tool", "Made for your phone"],
  ]) {
    const card = menu.getByRole("article", { name, exact: true });
    await expect(card.getByText(device, { exact: false })).toBeVisible();
    await card.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(card.getByRole("list")).toBeVisible();
    await expect(card.getByText("One revision and a short handoff guide", { exact: true })).toBeVisible();
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
  await page.getByRole("link", { name: "Try the job report demo", exact: true }).first().click();
  await expect(page).toHaveURL(/\/work\/job-report$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByLabel(/^Business name/)).toHaveValue("");
  await expect(page.getByLabel(/^Customer or location/)).toHaveValue("");
  const example = page.getByRole("button", { name: "Try an example", exact: true });
  await example.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel(/^Business name/)).not.toHaveValue("");
  const create = page.getByRole("button", { name: "Create report", exact: true });
  await create.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("link", { name: "Save PDF", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ask for the $100 package", exact: true })).toHaveAttribute("href", email.href);
  await expect(page.getByText("USD total for all three services", { exact: true })).toBeVisible();
  const exampleDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "Save PDF", exact: true }).click();
  expect((await readPdf(await exampleDownload)).getPageCount()).toBe(1);
  const gallery = page.getByLabel("Before photo", { exact: true });
  expect(await gallery.getAttribute("capture")).toBeNull();
  await expect(gallery).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  const camera = page.getByLabel("Camera capture for before", { exact: true });
  await expect(camera).toBeHidden();
  await expect(camera).toHaveAttribute("capture", "environment");
  const chooserEvent = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Use camera for before photo", exact: true }).click();
  const chooser = await chooserEvent;
  expect(await chooser.element().getAttribute("aria-label")).toBe("Camera capture for before");
  await chooser.setFiles([]); // Chooser wiring only; this does not test camera hardware.

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    for (const control of [create, page.getByRole("link", { name: "Save PDF", exact: true }), page.getByLabel(/^Business name/)]) {
      const size = await control.boundingBox();
      expect(size?.height).toBeGreaterThanOrEqual(44);
    }
  }

  await page.addScriptTag({ content: axe.source });
  const reportForm = page.locator("form").filter({ has: page.getByLabel(/^Business name/) });
  const violations = await reportForm.evaluate(async (element) => {
    const results = await (window as typeof window & { axe: typeof axe }).axe.run(element);
    return results.violations.filter((item) => item.impact === "critical" || item.impact === "serious").map((item) => item.id);
  });
  expect(violations).toEqual([]);
});

test("a visitor's photos and long Unicode notes reach a real local PDF", async ({ page }) => {
  const outgoing: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method())) outgoing.push(request.postData() ?? "");
  });
  await page.goto("/work/job-report");
  await fillOwnReport(page);
  await expect(page.getByRole("article", { name: "Report contents" }).getByText("Not marked complete", { exact: true })).toHaveCount(4);
  const notes = "René — ավարտված ✅ 植栽を確認しました。\n".repeat(30).slice(0, 1150);
  await page.getByLabel(/^Notes/).fill(notes);
  await page.getByLabel("Before photo", { exact: true }).setInputFiles(await photoFile(page, "red"));
  await expect(page.getByAltText("Before photo selected for the report")).toBeVisible();
  await page.getByLabel("After photo", { exact: true }).setInputFiles(await photoFile(page, "blue"));
  await expect(page.getByAltText("After photo selected for the report")).toBeVisible();
  await page.getByRole("button", { name: "Create report", exact: true }).click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Save PDF", exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/garden-tidy.*\.pdf$/i);
  const pdf = await readPdf(download);
  expect(pdf.getPageCount()).toBeGreaterThan(0);
  expect(pdf.getPageCount()).toBeLessThanOrEqual(6);
  const colors = await photoColorsInPdf(page, pdf);
  expect(colors.red, "the before photo appears in the exported PDF").toBeGreaterThan(1000);
  expect(colors.blue, "the after photo appears in the exported PDF").toBeGreaterThan(1000);
  const textEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Save text copy", exact: true }).click();
  const textDownload = await textEvent;
  expect(textDownload.suggestedFilename()).toMatch(/garden-tidy.*\.txt$/i);
  const text = (await downloadBytes(textDownload)).toString("utf8");
  expect(text).toContain("River Works private fixture");
  expect(text).toContain(notes);
  expect(text).toContain("Before: Included in the PDF");
  expect(text).toContain("After: Included in the PDF");
  expect(text).not.toContain("data:image/");
  expect(outgoing.some((body) => body.includes("River Works private fixture") || body.includes("Private garden fixture") || body.includes("data:image/"))).toBe(false);
});

test("invalid replacement photos preserve the existing photo and edits invalidate the old export", async ({ page }) => {
  await page.goto("/work/job-report");
  await fillOwnReport(page);
  const before = page.getByLabel("Before photo", { exact: true });
  await before.setInputFiles(await photoFile(page, "red"));
  const preview = page.getByAltText("Before photo selected for the report");
  await expect(preview).toBeVisible();
  const selectedPhoto = await preview.getAttribute("src");
  // A plausible PNG header passes format/dimension checks but has no image
  // chunks, exercising the actual browser decoder's failure path.
  const corrupt = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(corrupt);
  corrupt.write("IHDR", 12);
  corrupt.writeUInt32BE(4, 16);
  corrupt.writeUInt32BE(4, 20);
  await before.setInputFiles({ name: "corrupt.png", mimeType: "image/png", buffer: corrupt });
  await expect(page.locator("#job-report-demo").getByRole("alert")).toContainText(/photo|image/i);
  await expect(preview).toHaveAttribute("src", selectedPhoto!);
  await before.setInputFiles({ name: "drawing.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg></svg>") });
  await expect(page.locator("#job-report-demo").getByRole("alert")).toContainText(/JPEG|PNG|WebP/i);
  await expect(preview).toHaveAttribute("src", selectedPhoto!);
  await page.getByRole("button", { name: "Create report", exact: true }).click();
  const save = page.getByRole("link", { name: "Save PDF", exact: true });
  await expect(save).toBeVisible();
  await page.getByLabel(/^Job title/).fill("Revised garden tidy");
  await page.getByLabel(/^Notes/).fill("Updated after the photo replacement — ավարտված.");
  await expect(save).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Save text copy", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Create report", exact: true }).click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Save PDF", exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/revised-garden-tidy.*\.pdf$/i);
  expect((await photoColorsInPdf(page, await readPdf(download))).red).toBeGreaterThan(1000);
  const textEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Save text copy", exact: true }).click();
  const textDownload = await textEvent;
  expect(textDownload.suggestedFilename()).toMatch(/revised-garden-tidy.*\.txt$/i);
  const text = (await downloadBytes(textDownload)).toString("utf8");
  expect(text.split("\n")).toContain("Revised garden tidy");
  expect(text.split("\n")).not.toContain("Garden tidy");
  expect(text).toContain("Updated after the photo replacement — ավարտված.");
});

test("cancelling a reset keeps the visitor's work and confirming clears sample facts", async ({ page }) => {
  await page.goto("/work/job-report");
  await page.getByRole("button", { name: "Try an example", exact: true }).click();
  await page.getByLabel(/^Business name/).fill("Keep my work");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Start over", exact: true }).click();
  await expect(page.getByLabel(/^Business name/)).toHaveValue("Keep my work");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Start over", exact: true }).click();
  for (const label of ["Business name", "Job title", "Customer or location", "Job date", "Notes"]) {
    await expect(page.getByLabel(new RegExp(`^${label}`))).toHaveValue("");
  }
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Save PDF", exact: true })).toHaveCount(0);
});

test("cancelling the native share sheet never claims that a report was sent", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        const file = data.files?.[0];
        Object.assign(window, { jobReportShareFixture: { name: file?.name, type: file?.type, size: file?.size } });
        throw new DOMException("Visitor cancelled sharing", "AbortError");
      },
    });
  });
  await page.goto("/work/job-report");
  await fillOwnReport(page);
  await page.getByRole("button", { name: "Create report", exact: true }).click();
  await page.getByRole("button", { name: "Share report", exact: true }).click();
  const file = await page.evaluate(() => (window as typeof window & {
    jobReportShareFixture?: { name?: string; type?: string; size?: number };
  }).jobReportShareFixture);
  expect(file?.name).toMatch(/garden-tidy.*\.pdf$/i);
  expect(file?.type).toBe("application/pdf");
  expect(file?.size).toBeGreaterThan(500);
  const cancellation = page.getByRole("status").filter({ hasText: /Sharing cancelled/i });
  await expect(cancellation).toBeVisible();
  await expect(cancellation).not.toContainText(/report (?:was )?sent|shared successfully/i);
  await expect(page.getByRole("link", { name: "Save PDF", exact: true })).toBeEnabled();
});
