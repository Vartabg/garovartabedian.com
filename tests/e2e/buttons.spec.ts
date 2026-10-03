import { expect, test, type Locator, type Page } from "@playwright/test";

const REPRESENTATIVE_LINKS = [
  {
    route: "/",
    selector: ".st-intro-primary.ui-button",
    name: "Read his words",
    href: "/jesus/words",
  },
  {
    route: "/hire",
    selector: ".hire-hero .ui-button--primary",
    name: "Download résumé (PDF)",
    href: "/Garo-Vartabedian-Resume.pdf",
  },
  {
    // The 2026-09-03 journey redesign replaced WorldEntry with the guided
    // path; the threshold CTA is the world home's representative action.
    route: "/jesus",
    selector: ".jsu-threshold-primary.ui-button",
    name: "Read his words",
    href: "/jesus/words",
  },
] as const;

async function expectNoDocumentOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function giveKeyboardVisibleFocus(page: Page, control: Locator) {
  // Establish keyboard modality first; scripted focus then retains the
  // browser's native :focus-visible heuristic without walking every nav link.
  await page.keyboard.press("Tab");
  await control.focus();
  await expect(control).toBeFocused();
  await expect
    .poll(() => control.evaluate((element) => element.matches(":focus-visible")))
    .toBe(true);
}

test("representative home, hire, and world actions keep native link semantics", async ({
  page,
}) => {
  for (const item of REPRESENTATIVE_LINKS) {
    const response = await page.goto(item.route);
    expect(response?.status(), `${item.route} should load`).toBe(200);

    const control = page.locator(item.selector).first();
    await expect(control).toBeVisible();
    await expect(control).toHaveAccessibleName(item.name);
    await expect(control).toHaveAttribute("href", item.href);
    await expect(control).toHaveClass(/\bui-button--primary\b/);
    expect(
      await control.evaluate((element) => ({
        tagName: element.tagName,
        role: element.getAttribute("role"),
      })),
    ).toEqual({ tagName: "A", role: null });
  }
});

test("link variants retain their intended foreground and surface", async ({ page }) => {
  await page.goto("/about");
  const primary = page.getByRole("link", { name: "Start with Jesus" });
  const ghost = page.getByRole("link", { name: "Open the Scriptures" });

  const [primaryStyle, ghostStyle] = await Promise.all(
    [primary, ghost].map((control) =>
      control.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          background: style.backgroundColor,
          color: style.color,
          border: style.borderColor,
        };
      }),
    ),
  );

  // Daylight tokens: --lapis #1e3e72 on the surface, --folio #f3e8cf for the ink.
  expect(primaryStyle.background).toBe("rgb(30, 62, 114)");
  expect(primaryStyle.color).toBe("rgb(243, 232, 207)");
  expect(ghostStyle.background).toBe("rgba(0, 0, 0, 0)");
  expect(ghostStyle.color).not.toBe(primaryStyle.color);
  expect(ghostStyle.border).not.toBe("rgba(0, 0, 0, 0)");
});

test("keyboard focus has a visible two-band indicator", async ({ page }) => {
  await page.goto("/");
  const control = page.locator(".st-intro-primary.ui-button");
  await giveKeyboardVisibleFocus(page, control);

  const focusStyle = await control.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      boxShadow: style.boxShadow,
    };
  });
  expect(focusStyle.outlineStyle).toBe("solid");
  expect(focusStyle.outlineWidth).toBeGreaterThanOrEqual(2);
  expect(focusStyle.boxShadow).not.toBe("none");
});

test("pressed state survives hover and focus without shifting layout", async ({
  page,
}) => {
  await page.goto("/about");
  const control = page.getByRole("link", { name: "Start with Jesus" });
  const restWidth = await control.evaluate(
    (element) => element.getBoundingClientRect().width,
  );

  await control.evaluate((element) => element.setAttribute("aria-pressed", "true"));
  const pressed = await control.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    shadow: getComputedStyle(element).boxShadow,
  }));
  expect(pressed.width).toBe(restWidth);
  expect(pressed.shadow).toContain("inset");

  await control.hover();
  expect(await control.evaluate((element) => getComputedStyle(element).boxShadow)).toContain(
    "inset",
  );

  await giveKeyboardVisibleFocus(page, control);
  const focusedShadow = await control.evaluate(
    (element) => getComputedStyle(element).boxShadow,
  );
  expect(focusedShadow).toContain("inset");
  expect(focusedShadow).toContain("rgb(0, 0, 0)");
});

test("legacy native buttons inherit the same black-and-white focus perimeter", async ({
  page,
}) => {
  await page.goto("/early");
  const control = page.getByRole("button", { name: "All", exact: true });
  await giveKeyboardVisibleFocus(page, control);

  const focusStyle = await control.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineColor: style.outlineColor,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      boxShadow: style.boxShadow,
    };
  });
  expect(focusStyle.outlineColor).toBe("rgb(255, 255, 255)");
  expect(focusStyle.outlineWidth).toBeGreaterThanOrEqual(2);
  expect(focusStyle.boxShadow).toContain("rgb(0, 0, 0)");
});

test("button links reflow at 320px without clipping or page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });

  for (const item of REPRESENTATIVE_LINKS) {
    await page.goto(item.route);
    await expectNoDocumentOverflow(page);

    const controls = page.locator(".ui-button:visible");
    expect(await controls.count(), `${item.route} should expose a button`).toBeGreaterThan(0);
    const measurements = await controls.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        const node = element as HTMLElement;
        return {
          label: element.getAttribute("aria-label") ?? element.textContent?.trim(),
          left: rect.left,
          right: rect.right,
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
          clientHeight: node.clientHeight,
          scrollHeight: node.scrollHeight,
        };
      }),
    );

    for (const measurement of measurements) {
      const context = `${item.route} ${measurement.label ?? "button"}`;
      expect(measurement.left, context).toBeGreaterThanOrEqual(-1);
      expect(measurement.right, context).toBeLessThanOrEqual(321);
      expect(measurement.scrollWidth, context).toBeLessThanOrEqual(
        measurement.clientWidth + 1,
      );
      expect(measurement.scrollHeight, context).toBeLessThanOrEqual(
        measurement.clientHeight + 1,
      );
    }
  }
});

test("an unbroken localized label wraps instead of clipping", async ({ page }) => {
  await page.goto("/about");
  const control = page.getByRole("link", { name: "Open the Scriptures" });
  const measurement = await control.evaluate((element) => {
    const node = element as HTMLElement;
    node.style.inlineSize = "120px";
    const label = node.querySelector<HTMLElement>(".ui-button__label");
    if (label) {
      label.textContent = "Donaudampfschifffahrtsgesellschaftskapitän";
    }
    return {
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
      clientHeight: node.clientHeight,
      scrollHeight: node.scrollHeight,
      overflowWrap: label ? getComputedStyle(label).overflowWrap : "",
    };
  });

  expect(measurement.overflowWrap).toBe("anywhere");
  expect(measurement.scrollWidth).toBeLessThanOrEqual(measurement.clientWidth + 1);
  expect(measurement.scrollHeight).toBeLessThanOrEqual(
    measurement.clientHeight + 1,
  );
});

test("dense maps and timelines expose native equivalent controls", async ({ page }) => {
  const surfaces = [
    {
      route: "/early",
      selector: ".ew-visual-picker select",
      forbidden: ".ew-timeline [role=button]",
    },
    {
      route: "/early/ignatius",
      selector: ".ew-visual-picker select",
      forbidden: ".ew-map [role=button]",
    },
    {
      route: "/church/tree",
      selector: ".ch-tree-picker select",
      forbidden: ".ch-tree [role=button]",
    },
    {
      route: "/jesus/life",
      selector: ".jsu-map-place-picker select",
      forbidden: ".jsu-map [role=button], .jsu-terrain-marker[role=button]",
    },
  ] as const;

  for (const surface of surfaces) {
    await page.goto(surface.route);
    await expect(page.locator(surface.selector)).toBeVisible();
    await expect(page.locator(surface.forbidden)).toHaveCount(0);
  }
});

test("forced colors retain borders and an explicit focus outline", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/hire");
  const control = page.locator(".hire-hero .ui-button--primary").first();
  await giveKeyboardVisibleFocus(page, control);

  const forcedColorStyle = await control.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      borderStyle: style.borderStyle,
      borderWidth: Number.parseFloat(style.borderWidth),
      forcedColorAdjust: style.forcedColorAdjust,
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      outlineOffset: Number.parseFloat(style.outlineOffset),
      boxShadow: style.boxShadow,
    };
  });
  expect(forcedColorStyle.borderStyle).toBe("solid");
  expect(forcedColorStyle.borderWidth).toBeGreaterThanOrEqual(2);
  expect(forcedColorStyle.forcedColorAdjust).toBe("auto");
  expect(forcedColorStyle.outlineStyle).toBe("solid");
  expect(forcedColorStyle.outlineWidth).toBeGreaterThanOrEqual(3);
  expect(forcedColorStyle.outlineOffset).toBeGreaterThanOrEqual(2);
  expect(forcedColorStyle.boxShadow).toBe("none");
});

test("reduced motion removes button transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const control = page.locator(".st-intro-primary.ui-button");
  await expect(control).toBeVisible();

  const transitionDurations = await control.evaluate((element) =>
    getComputedStyle(element)
      .transitionDuration.split(",")
      .map((duration) => Number.parseFloat(duration)),
  );
  expect(transitionDurations.every((duration) => duration === 0)).toBe(true);
});
