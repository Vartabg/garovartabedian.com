import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Every professional route should carry its own, reachable Open Graph
 * image — not a silently-broken link and not the homepage's generic photo.
 * Guards the per-page opengraph-image.tsx routes added alongside this test.
 */

/**
 * Cards are rendered on demand and cached. The first hit for a chapter is an
 * expensive satori render, and a single local `next start` serving several
 * parallel workers will occasionally reset that connection before it finishes.
 * One retry tests the real contract — the card is reachable — without
 * pretending a cold render is instant.
 */
async function fetchCard(request: APIRequestContext, url: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await request.get(url, { timeout: 60_000 });
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }
  throw new Error("unreachable");
}

const ROUTES_WITH_OWN_OG_IMAGE = [
  "/hire",
  "/work",
  "/about",
  "/resume",
  "/services",
  "/contact",
  "/sources",
  "/work/jobpilot",
  "/work/eye",
  "/work/garovartabedian",
];

for (const route of ROUTES_WITH_OWN_OG_IMAGE) {
  test(`${route} has a reachable, page-specific og:image`, async ({
    page,
    request,
  }) => {
    await page.goto(route);
    const ogImage = page.locator('meta[property="og:image"]');
    const content = await ogImage.getAttribute("content");
    expect(content, `${route} is missing an og:image meta tag`).toBeTruthy();

    // The meta tag contains the absolute production URL (metadataBase), but
    // the local dev server hasn't been deployed yet — resolve the image
    // locally by stripping the domain and hitting the path on the test server.
    const imagePath = new URL(content!).pathname + new URL(content!).search;
    const response = await fetchCard(request, imagePath);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/");
  });
}

test("the homepage keeps its own curated og:image", async ({ page, request }) => {
  await page.goto("/");
  const content = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(content).toContain("/og.jpg");
  const response = await request.get("/og.jpg");
  expect(response.status()).toBe(200);
});

const WORLD_SUBPAGE_METADATA = [
  { route: "/apostles/sent", image: "/worlds/apostles.jpg", type: "article" },
  { route: "/apostles/twelve", image: "/worlds/apostles.jpg", type: "article" },
  { route: "/early/ignatius", image: "/worlds/early.jpg", type: "article" },
  { route: "/scriptures/search", image: "/worlds/scriptures.jpg", type: "website" },
  { route: "/scriptures/topics", image: "/worlds/scriptures.jpg", type: "website" },
  { route: "/word/cases", image: "/worlds/word.jpg", type: "article" },
  { route: "/word/free", image: "/worlds/word.jpg", type: "article" },
  { route: "/church/tree", image: "/worlds/church.jpg", type: "article" },
] as const;

test("world subpages expose complete canonical and sharing metadata", async ({
  page,
  request,
}) => {
  for (const entry of WORLD_SUBPAGE_METADATA) {
    await page.goto(entry.route);
    const canonical = `https://garovartabedian.com${entry.route}`;
    const image = `https://garovartabedian.com${entry.image}`;

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      entry.type,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      image,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );

    const response = await request.get(entry.image);
    expect(response.status(), `${entry.image} should resolve`).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/");
  }
});

/**
 * Corpus routes share far more often than the portfolio ones do, and until now
 * every one of them unfurled as the site's generic card. These three shapes
 * cover the whole corpus: a chapter of Scripture, a hosted early writing, and
 * a topic page.
 */
const CORPUS_ROUTES_WITH_OWN_OG_IMAGE = [
  "/scriptures/protestant/JHN/3",
  "/scriptures/protestant/LEV/11",
  "/early/didache",
  "/scriptures/topics/FAITH",
];

for (const route of CORPUS_ROUTES_WITH_OWN_OG_IMAGE) {
  test(`${route} unfurls as itself, not as the generic card`, async ({ page, request }) => {
    await page.goto(route);
    const content = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(content, `${route} is missing an og:image meta tag`).toBeTruthy();
    expect(content, `${route} is falling back to the homepage photo`).not.toContain("/og.jpg");

    const url = new URL(content!);
    const response = await fetchCard(request, url.pathname + url.search);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/");
  });
}

test("llms.txt is served and names the corpora and their review tiers", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain("# garovartabedian.com");
  expect(body).toContain("agent-reviewed");
  expect(body).toContain("human-reviewed");
  expect(body).toContain("/meta/profile-facts.json");
});

test("an early text's markdown mirror is served with its attribution", async ({ request }) => {
  const response = await request.get("/early/md/didache.md");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain("# The Teaching of the Twelve Apostles");
  expect(body).toContain("**Translation:**");
  expect(body).toContain("**Source:** https://");
});

test("the profile facts are served and every claim carries evidence", async ({ request }) => {
  const response = await request.get("/meta/profile-facts.json");
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(Array.isArray(data.facts)).toBe(true);
  expect(data.facts.length).toBeGreaterThan(0);
  for (const fact of data.facts) {
    expect(fact.evidence.length, `${fact.id} has no evidence`).toBeGreaterThan(0);
    expect(fact.basis.length, `${fact.id} has no basis`).toBeGreaterThan(20);
  }
});
