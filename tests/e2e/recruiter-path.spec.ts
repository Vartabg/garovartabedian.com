import { test, expect } from "@playwright/test";

/**
 * The two professional paths: independent work begins at /services, while
 * /hire preserves the full-time employment profile. Both need real proof and
 * working contact links without making employment the site's primary ask.
 */

test.describe("independent work path", () => {
  test("presents a bounded offer with a real project inquiry", async ({ page }) => {
    const response = await page.goto("/services");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Practical help for messy workflows and company knowledge.",
      }),
    ).toBeVisible();
    await expect(page.getByText("$500 fixed", { exact: false })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Discuss a project" }).first(),
    ).toHaveAttribute(
      "href",
      /^mailto:garo\.vartabed@gmail\.com\?subject=Workflow%20%26%20Knowledge%20Pipeline%20inquiry$/,
    );
  });

  test("publishes truthful service data and keeps employment secondary", async ({
    page,
  }) => {
    await page.goto("/services");
    const service = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts) =>
        scripts
          .map((script) => JSON.parse(script.textContent ?? "{}"))
          .find((entry) => entry["@type"] === "Service"),
      );

    const offers = service?.hasOfferCatalog?.itemListElement;
    const workflowAudit = offers?.find(
      (offer: { name?: string }) => offer.name === "Workflow & Automation Audit",
    );
    const knowledgePipeline = offers?.find(
      (offer: { name?: string }) => offer.name === "Knowledge Pipeline Sprint",
    );

    expect(workflowAudit?.price).toBe("500");
    expect(workflowAudit?.priceCurrency).toBe("USD");
    expect(knowledgePipeline?.url).toBe(
      "https://garovartabedian.com/services",
    );
    await expect(
      page.getByRole("link", { name: "View the employment profile" }),
    ).toHaveAttribute("href", "/hire");
  });

  test("work and contact route project conversations to services", async ({
    page,
  }) => {
    await page.goto("/work");
    await expect(page.getByRole("link", { name: "Work with Garo" }).first()).toHaveAttribute(
      "href",
      "/services",
    );

    await page.goto("/contact");
    await expect(page.getByRole("link", { name: "View services" })).toHaveAttribute(
      "href",
      "/services",
    );
  });
});

test.describe("hire page", () => {
  test("loads with the full-time pitch and quick facts", async ({ page }) => {
    const response = await page.goto("/hire");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Solutions Engineer"
    );
    await expect(page.getByText("Location")).toBeVisible();
  });

  test("résumé PDF link resolves to a real PDF", async ({ page, request }) => {
    await page.goto("/hire");
    const pdfLink = page.getByRole("link", { name: /Download résumé/i }).first();
    const href = await pdfLink.getAttribute("href");
    expect(href).toBe("/Garo-Vartabedian-Resume.pdf");

    const response = await request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("pdf");
  });

  test("email CTA uses a mailto link with the right address", async ({ page }) => {
    await page.goto("/hire");
    const emailLink = page.getByRole("link", { name: "Email Garo" });
    const href = await emailLink.getAttribute("href");
    expect(href).toMatch(/^mailto:garo\.vartabed@gmail\.com/);
  });

  test("proof grid links to every case study and they all resolve", async ({
    page,
    request,
  }) => {
    await page.goto("/hire");
    const proof = page.locator("#proof");
    await expect(proof.getByRole("heading", { name: "Proof" })).toBeVisible();

    const cards = proof.locator("article.card");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Internal case-study links (JobPilot, this site, EYE) must 200.
    const internalLinks = page.locator(
      '.hire-proof-links a[href^="/work/"]'
    );
    const internalCount = await internalLinks.count();
    expect(internalCount).toBeGreaterThan(0);
    for (let i = 0; i < internalCount; i += 1) {
      const href = await internalLinks.nth(i).getAttribute("href");
      const response = await request.get(href!);
      expect(response.status(), `expected ${href} to resolve`).toBe(200);
    }
  });
});

test.describe("machinery page", () => {
  test("publishes generated corpus health and its raw snapshot", async ({
    page,
    request,
  }) => {
    const response = await page.goto("/labs");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", {
        name: "Corpus health, generated from the repository",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open the machine-readable snapshot" }),
    ).toHaveAttribute("href", "/meta/corpus-health.json");

    const snapshotResponse = await request.get("/meta/corpus-health.json");
    expect(snapshotResponse.status()).toBe(200);
    const snapshot = await snapshotResponse.json();
    expect(snapshot.schemaVersion).toBe(1);
    // Guide coverage may be incomplete only by whole unguided books (e.g. the
    // newly hosted 1 Enoch, pending its guide batch) — the status must always
    // match the underlying numbers, never drift from them.
    const coverage = snapshot.validation.guides.coverage;
    expect(["complete", "incomplete"]).toContain(coverage.status);
    expect(coverage.status).toBe(
      coverage.guides === coverage.chapterSlots ? "complete" : "incomplete",
    );
    const review = snapshot.validation.guides.editorialReview;
    expect(["untracked", "in-progress", "agent-reviewed", "complete"]).toContain(
      review.status,
    );
    expect(
      review.agentReviewed + review.humanReviewed + review.untracked,
    ).toBe(snapshot.corpus.guides.files);
  });
});

test.describe("contact page", () => {
  test("every contact method is a real, correctly formatted link", async ({
    page,
  }) => {
    await page.goto("/contact");
    const main = page.getByRole("main");
    await expect(
      main.getByRole("link", { name: "garo.vartabed@gmail.com" })
    ).toHaveAttribute("href", "mailto:garo.vartabed@gmail.com");
    await expect(
      main.getByRole("link", { name: "718-872-8578" })
    ).toHaveAttribute("href", "tel:+17188728578");
    await expect(
      main.getByRole("link", { name: "linkedin.com/in/garovartabedian" })
    ).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/garovartabedian"
    );
  });
});

test.describe("resume page", () => {
  test("loads and offers the PDF and employment profile", async ({
    page,
  }) => {
    const response = await page.goto("/resume");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("link", { name: /Download résumé/i }).first()
    ).toHaveAttribute("href", "/Garo-Vartabedian-Resume.pdf");
  });
});
