import { expect, test } from "@playwright/test";

const line = (page: import("@playwright/test").Page) => page.getByRole("navigation", { name: /His life, 40 moments/ });

test("one moment, every lens: the choice stays as the reader switches, moves on and comes back", async ({ page }) => {
  await page.goto("/jesus");
  await line(page).getByRole("link", { name: "Baptized in the Jordan" }).click();
  await expect(page).toHaveURL(/\/jesus#baptism$/);

  const baptism = page.getByRole("article", { name: "Baptized in the Jordan" });
  await expect(baptism.getByRole("tab", { name: /His words/ })).toHaveAttribute("aria-selected", "true");
  await expect(baptism.locator(".jl-words")).toContainText("fulfill all righteousness");

  // Another lens, the same moment.
  await baptism.getByRole("tab", { name: /The Gospels/ }).click();
  await expect(baptism.getByRole("link", { name: "Read in context" })).toHaveCount(4);
  await expect(baptism.getByRole("link", { name: "Read in context" }).first()).toHaveAttribute(
    "href",
    "/scriptures/protestant/MAT/3?t=web#v13",
  );

  // Moving on keeps the lens, and links reach the deeper rooms at the right place.
  await baptism.getByRole("button", { name: /After/ }).click();
  const temptation = page.getByRole("article", { name: "Tempted in the wilderness" });
  await expect(temptation.getByRole("tab", { name: /The Gospels/ })).toHaveAttribute("aria-selected", "true");
  await expect(temptation.getByRole("link", { name: "The Temptation in the Wilderness, word by word" })).toHaveAttribute(
    "href",
    "/jesus/harmony?passage=temptation",
  );

  // Finding by name.
  const find = page.getByRole("combobox", { name: "Find a moment" });
  await find.fill("lazarus");
  await find.press("Enter");
  await expect(page).toHaveURL(/#raising-lazarus$/);
  await expect(page.getByRole("article", { name: "Raising of Lazarus" })).toBeVisible();

  // Coming back: the moment and the lens are remembered on this device.
  await page.goto("/jesus");
  await expect(page).toHaveURL(/#raising-lazarus$/);
  await expect(page.getByRole("tab", { name: /The Gospels/ })).toHaveAttribute("aria-selected", "true");

  // A shared link opens its moment.
  await page.goto("/jesus#crucifixion");
  await expect(page.getByRole("article", { name: "The crucifixion" })).toBeVisible();
  await page.getByRole("tab", { name: /Prophecy/ }).click();
  await expect(page.locator(".jl-pair")).toHaveCount(7);
});

test("the line answers the keyboard and the map lists what happened at each place", async ({ page }) => {
  await page.goto("/jesus");
  const first = line(page).getByRole("link", { name: "The annunciation" });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(line(page).locator('[aria-current="true"]')).toHaveCount(1);
  await page.keyboard.press("End");
  await expect(page.getByRole("article").getByRole("heading", { level: 2 })).toHaveText(/ascension/i);

  // The moments at the chosen place are buttons anyone can reach.
  await page.goto("/jesus#capernaum-ministry");
  const here = page.getByRole("list", { name: "Moments at Capernaum" });
  await expect(here.getByRole("button", { name: "Ministry base at Capernaum" })).toHaveAttribute("aria-current", "true");
});
