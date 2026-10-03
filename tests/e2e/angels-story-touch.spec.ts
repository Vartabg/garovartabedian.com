import { expect, test, type CDPSession, type Locator, type Page } from "@playwright/test";
import path from "node:path";

type Point = { x: number; y: number };

const stories = [
  {
    slug: "open-his-eyes",
    region: "Compare the two views",
    role: "slider",
    surface: "Reveal on the artwork",
    range: "Reveal the unseen",
  },
  {
    slug: "i-am-with-you",
    region: "Explore Jacob’s dream",
    role: "figure",
    surface: "Jacob’s dream: from earth to heaven",
    range: "Lift your gaze",
  },
  {
    slug: "the-gate-opened",
    region: "Light in the cell",
    role: "group",
    surface: "Explore the cell illustration",
    range: "Move light across the cell",
  },
] as const;

async function touchPoint(client: CDPSession, page: Page, type: "touchStart" | "touchMove", point: Point) {
  await client.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: [{ ...point, id: 1, radiusX: 5, radiusY: 5, force: 1 }],
  });
  // Keep input on separate frames so Chromium handles the gesture and its native scrolling.
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
}

async function stroke(client: CDPSession, page: Page, from: Point, to: Point, cancel = false) {
  await touchPoint(client, page, "touchStart", from);
  for (let step = 1; step <= 8; step++) {
    await touchPoint(client, page, "touchMove", {
      x: from.x + (to.x - from.x) * step / 8,
      y: from.y + (to.y - from.y) * step / 8,
    });
  }
  await client.send("Input.dispatchTouchEvent", { type: cancel ? "touchCancel" : "touchEnd", touchPoints: [] });
}

async function surfacePoints(surface: Locator) {
  await surface.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  const box = await surface.boundingBox();
  expect(box).not.toBeNull();
  return {
    left: { x: box!.x + box!.width * 0.2, y: box!.y + box!.height * 0.5 },
    right: { x: box!.x + box!.width * 0.8, y: box!.y + box!.height * 0.5 },
  };
}

test.describe("direct touch on story artwork", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  for (const story of stories) {
    test(`${story.slug} follows a real finger, preserves vertical reading, and recovers from cancellation`, async ({ page, context }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`/angels/stories/${story.slug}`);
      const scene = page.getByRole("region", { name: story.region, exact: true });
      const surface = scene.getByRole(story.role, { name: story.surface, exact: true });
      const frame = story.slug === "open-his-eyes" ? scene.locator("#dothan-revelation-image") : surface;
      const range = scene.getByRole("slider", { name: story.range, exact: true });
      const vertical = story.slug === "the-gate-opened"
        ? scene.getByRole("slider", { name: "Move light up or down", exact: true })
        : null;
      await expect(range).toBeVisible();
      const client = await context.newCDPSession(page);
      try {
        const initial = Number(await range.inputValue());
        let points = await surfacePoints(frame);
        await stroke(client, page, points.left, {
          ...points.right,
          y: points.right.y + (vertical ? 30 : 0),
        });
        await expect.poll(async () => Number(await range.inputValue())).toBeGreaterThan(initial);
        const forward = Number(await range.inputValue());
        expect(forward).toBeLessThan(100);
        if (vertical) {
          expect(Number(await vertical.inputValue())).toBeGreaterThan(45);
          await expect(scene.getByRole("status")).toHaveText("Exploring the light");
        }

        points = await surfacePoints(frame);
        await stroke(client, page, points.right, points.left);
        await expect.poll(async () => Number(await range.inputValue())).toBeLessThan(forward);

        points = await surfacePoints(frame);
        const valueBeforeScroll = await range.inputValue();
        const verticalBeforeScroll = await vertical?.inputValue();
        const scrollBefore = await page.evaluate(() => window.scrollY);
        const from = { x: (points.left.x + points.right.x) / 2, y: points.left.y };
        await stroke(client, page, from, { x: from.x, y: from.y - 120 });
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore + 40);
        await expect(range).toHaveValue(valueBeforeScroll);
        if (vertical) await expect(vertical).toHaveValue(verticalBeforeScroll!);

        points = await surfacePoints(frame);
        await stroke(client, page, points.left, points.right, true);
        await range.focus();
        await range.press("Home");
        await expect(range).toHaveValue("0");
        points = await surfacePoints(frame);
        await stroke(client, page, points.left, points.right);
        await expect.poll(async () => Number(await range.inputValue())).toBeGreaterThan(30);

        if (process.env.STORY_CAPTURE_DIR) {
          await expect(frame.locator("img")).toHaveCount(story.slug === "i-am-with-you" ? 1 : 2);
          await expect.poll(() => frame.locator("img").evaluateAll((images) => images.every((element) => {
            const image = element as HTMLImageElement;
            return image.complete && image.naturalWidth > 0;
          }))).toBe(true);
          await frame.screenshot({
            path: path.join(process.env.STORY_CAPTURE_DIR, `${story.slug}-mobile-touch.png`),
            animations: "disabled",
          });
        }

        await range.focus();
        await range.press("Home");
        await surface.focus();
        await surface.press("ArrowRight");
        await expect.poll(async () => Number(await range.inputValue())).toBeGreaterThan(0);
        expect(errors).toEqual([]);
      } finally {
        await client.detach();
      }
    });
  }
});
