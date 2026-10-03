import { expect, test } from "@playwright/test";

test("How We Know leads with one claim and reveals depth on demand", async ({
  page,
}) => {
  await page.goto("/evidence");

  const claimLab = page.locator("#claim-lab");
  const method = page.locator("#method");
  const worldEntryLead = page.locator(".world-entry-lead");
  await expect(claimLab).toBeVisible();
  await expect(method).toBeVisible();
  await expect(worldEntryLead.locator("h2")).toBeVisible();

  const doesNotOverflow = await page.evaluate(() => {
    const lead = document.querySelector(".world-entry-lead");
    const h2 = lead?.querySelector("h2");
    if (!lead || !h2) return false;
    const leadRect = lead.getBoundingClientRect();
    const h2Rect = h2.getBoundingClientRect();
    return h2Rect.right <= leadRect.right + 1;
  });
  expect(doesNotOverflow).toBe(true);

  const order = await page.evaluate(() => ({
    claimLab: document.querySelector("#claim-lab")?.getBoundingClientRect().top,
    method: document.querySelector("#method")?.getBoundingClientRect().top,
  }));
  expect(order.claimLab).toBeLessThan(order.method ?? 0);

  const cases = claimLab.locator("details.hw-case");
  await expect(cases).toHaveCount(7);
  await expect(claimLab.locator("details.hw-case[open]")).toHaveCount(1);

  const writingsCase = claimLab.locator("#early-writings");
  await writingsCase.locator("summary").click();
  await expect(writingsCase).toHaveAttribute("open", "");
  await expect(claimLab.locator("details.hw-case[open]")).toHaveCount(1);
  await expect(writingsCase.getByText("Boundary", { exact: true })).toBeVisible();
});

test("secondary research remains available without dominating the page", async ({
  page,
}) => {
  await page.goto("/evidence#faith-science");

  const section = page.locator("#faith-science");
  await expect(section.getByText("The Big Bang and creation", { exact: true })).toBeVisible();

  const docket = section.locator("details.hw-secondary-docket");
  const sources = section.locator("details.hw-research-basis");
  await expect(docket).not.toHaveAttribute("open", "");
  await expect(sources).not.toHaveAttribute("open", "");

  await docket.locator("summary").click();
  await expect(docket).toHaveAttribute("open", "");
  await expect(section.getByText("Fine-tuning", { exact: true })).toBeVisible();
});
