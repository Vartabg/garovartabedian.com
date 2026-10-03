import { expect, test, type Page } from "@playwright/test";

const tracer = (page: Page) =>
  page.getByRole("region", { name: "Trace a cross-reference path" });

async function enterPath(page: Page, from: string, to: string) {
  const region = tracer(page);
  await region
    .getByRole("textbox", { name: "Start verse", exact: true })
    .fill(from);
  await region
    .getByRole("textbox", { name: "End verse", exact: true })
    .fill(to);
  await region.getByRole("button", { name: "Trace path", exact: true }).click();
}

test("traces, shares, reverses, and opens a verified path", async ({ page }) => {
  await page.goto("/scriptures/graph");
  await expect(tracer(page)).toBeVisible();

  await enterPath(page, "Genesis 3:15", "Revelation 20:2");
  await expect(page).toHaveURL(
    /\/scriptures\/graph\?from=GEN\.3\.15&to=REV\.20\.2$/,
  );

  const map = tracer(page).getByRole("list", { name: "Interactive path map" });
  await expect(map.getByRole("button")).toHaveCount(2);
  await map.getByRole("button", { name: /Revelation 20:2/ }).click();
  await expect(page.locator("#path-inspector").getByRole("link")).toHaveAttribute("href", "/scriptures/protestant/REV/20#v2");
  await tracer(page).getByText("Read every passage in order", { exact: true }).click();
  const path = tracer(page).getByRole("list", {
    name: "Passages along the cross-reference path",
  });
  await expect(path.getByRole("listitem")).toHaveCount(2);
  await expect(path.getByRole("link").first()).toHaveAttribute(
    "href",
    "/scriptures/protestant/GEN/3#v15",
  );
  await expect(path.getByRole("link").last()).toHaveAttribute(
    "href",
    "/scriptures/protestant/REV/20#v2",
  );

  await page.reload();
  await expect(tracer(page).getByRole("listitem")).toHaveCount(2);

  await tracer(page).getByRole("button", { name: "Swap start and end verses" }).click();
  await expect(tracer(page).getByRole("listitem")).toHaveCount(0);
  await tracer(page).getByRole("button", { name: "Trace path", exact: true }).click();
  await expect(page).toHaveURL(
    /\/scriptures\/graph\?from=REV\.20\.2&to=GEN\.3\.15$/,
  );
  await expect(
    tracer(page).getByRole("link", { name: /Revelation 20:2/ }),
  ).toHaveAttribute("href", "/scriptures/protestant/REV/20#v2");
});

test("rejects invalid verses and reports uncovered routes without stale results", async ({
  page,
}) => {
  await page.goto("/scriptures/graph");
  await enterPath(page, "Genesis 1:999", "John 3:16");
  await expect(tracer(page).getByRole("alert")).toContainText(/hosted verse/i);
  await expect(tracer(page).getByRole("listitem")).toHaveCount(0);
  await expect(
    tracer(page).getByRole("button", { name: "Copy path link" }),
  ).toHaveCount(0);

  await enterPath(page, "Jubilees 18:12", "John 3:16");
  await expect(tracer(page).getByRole("alert")).toContainText(
    "No route was found within 6 cross-reference links",
  );
  await expect(tracer(page).getByRole("listitem")).toHaveCount(0);
});

test("distinguishes a load failure, retries, and stays usable at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  let failed = false;
  await page.route("**/scriptures/graph/hub-paths.json", async (route) => {
    if (!failed) {
      failed = true;
      await route.fulfill({ status: 503, body: "unavailable" });
    } else {
      await route.fallback();
    }
  });

  await page.goto("/scriptures/graph");
  await enterPath(page, "Genesis 3:15", "Revelation 20:2");
  await expect(tracer(page).getByRole("alert")).toContainText(
    "cross-reference data could not be loaded",
  );
  await expect(tracer(page).getByRole("listitem")).toHaveCount(0);

  await tracer(page).getByRole("button", { name: "Try again", exact: true }).click();
  await expect(tracer(page).getByRole("listitem")).toHaveCount(2);

  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport + 1);
});
