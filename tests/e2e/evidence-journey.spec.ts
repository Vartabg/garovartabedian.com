import { expect, test } from "@playwright/test";

test("How We Know leads with one claim and reveals depth on demand", async ({
  page,
}) => {
  await page.goto("/evidence");

  const claimLab = page.locator("#claim-lab");
  const method = page.locator("#method");
  const waysIn = page.getByRole("navigation", { name: "Explore how we know" }).getByRole("link");
  await expect(claimLab).toBeVisible();
  await expect(method).toBeHidden();
  await page.getByText("The method and the eight lenses").click();
  await expect(method).toBeVisible();
  await expect(waysIn).toHaveCount(4);
  await expect(waysIn.first()).toHaveAttribute("href", "#claim-lab");

  const doesNotOverflow = await page.evaluate(() => {
    const copy = document.querySelector(".world-home-hero-copy");
    const links = [...(copy?.querySelectorAll(".world-hero-actions a") ?? [])];
    if (!copy || links.length === 0) return false;
    const copyRect = copy.getBoundingClientRect();
    return links.every((link) => link.getBoundingClientRect().right <= copyRect.right + 1);
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
