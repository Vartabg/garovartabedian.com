import { test, expect } from "@playwright/test";

test("handoff illustration keeps failed work open and is reachable from the portfolio", async ({ page }) => {
  await page.goto("/work");
  await page.getByRole("link", { name: "Explore the handoff demo" }).click();
  await expect(page).toHaveURL(/\/work\/merge-monitor$/);
  const demo = page.getByRole("region", { name: "Follow one request through the board" });
  const resolution = demo.getByRole("button", { name: "Record resolution" });
  await expect(resolution).toBeDisabled();
  await demo.getByRole("button", { name: "Acknowledge receipt" }).focus();
  await page.keyboard.press("Enter");
  await expect(demo.getByRole("status")).toHaveText("Open · acknowledged");
  await demo.getByRole("button", { name: "Show a failing check" }).click();
  await expect(demo.getByRole("status")).toHaveText("Open · check failed");
  await expect(resolution).toBeDisabled();
  await expect(demo).toContainText("This failure is hypothetical");
  await demo.getByRole("button", { name: "Show a passing check" }).click();
  await resolution.click();
  await expect(demo.getByRole("status")).toHaveText("Resolved · evidence remains available");
  await demo.getByRole("button", { name: "Start again" }).click();
  await expect(demo.getByRole("status")).toHaveText("Open · awaiting acknowledgment");
  await expect(resolution).toBeDisabled();
  const download = await page.request.get("/merge-monitor/handoff-template.txt");
  expect(download.ok()).toBeTruthy();
  expect(await download.text()).toContain("Revision checked:");
});

test("handoff illustration fits a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/work/merge-monitor");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
