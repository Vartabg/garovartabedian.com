import { expect, test } from "@playwright/test";
import sharp from "sharp";
import mapWorker from "../../src/lib/jesus/maplibre-worker.json";

function varint(value: number): number[] {
  const bytes: number[] = [];
  do {
    const byte = value & 0x7f;
    value >>>= 7;
    bytes.push(byte | (value ? 0x80 : 0));
  } while (value);
  return bytes;
}

function field(tag: number, bytes: number[]): number[] {
  return [...varint((tag << 3) | 2), ...varint(bytes.length), ...bytes];
}

// A valid MVT water polygon covers the tile. This synthetic fixture proves
// worker decoding and actual fill rendering without depending on tile hosts.
const geometry = [9, 0, 0, 26, 8192, 0, 0, 8192, 8191, 0, 15].flatMap(varint);
const feature = [8, 1, 24, 3, ...field(4, geometry)];
const layer = [...field(1, [...Buffer.from("water")]), ...field(2, feature), 40, ...varint(4096), 120, 2];
const WATER_TILE = Buffer.from(field(3, layer));

test("self-hosted terrain worker decodes vector tiles and paints the canvas", async ({ page, context }, testInfo) => {
  const moduleResponses = new Map<string, { status: number; mime: string }>();
  const workerUrls: string[] = [];
  const workerErrors: string[] = [];
  let vectorRequests = 0;
  let demRequests = 0;
  context.on("response", (response) => {
    const pathname = new URL(response.url()).pathname;
    if (pathname.startsWith(`/vendor/maplibre-gl/${mapWorker.version}/`) && pathname.endsWith(".mjs")) {
      moduleResponses.set(pathname, { status: response.status(), mime: response.headers()["content-type"] ?? "" });
    }
  });
  page.on("worker", (worker) => workerUrls.push(worker.url()));
  page.on("console", (message) => {
    if (message.type() === "error" && /worker/i.test(message.text())) workerErrors.push(message.text());
  });
  page.on("pageerror", (error) => { if (/worker/i.test(error.message)) workerErrors.push(error.message); });

  const flatDem = await sharp({ create: { width: 512, height: 512, channels: 3, background: { r: 128, g: 0, b: 0 } } }).png().toBuffer();
  const headers = { "access-control-allow-origin": "*", "cross-origin-resource-policy": "cross-origin" };
  await context.route("https://tiles.openfreemap.org/planet", (route) => route.fulfill({
    headers,
    json: {
      tilejson: "2.2.0", tiles: ["https://tiles.openfreemap.org/fixture/{z}/{x}/{y}.pbf"], minzoom: 0, maxzoom: 14,
      vector_layers: ["water", "landcover", "landuse", "waterway", "transportation"].map((id) => ({ id, fields: {} })),
    },
  }));
  await context.route("https://tiles.openfreemap.org/fixture/**", (route) => {
    vectorRequests++;
    return route.fulfill({ headers, contentType: "application/x-protobuf", body: WATER_TILE });
  });
  await context.route("https://tiles.openfreemap.org/fonts/**", (route) => route.fulfill({ headers, contentType: "application/x-protobuf", body: Buffer.alloc(0) }));
  await context.route("https://tiles.mapterhorn.com/**", (route) => {
    demRequests++;
    return route.fulfill({ headers, contentType: "image/png", body: flatDem });
  });

  await page.goto("/jesus/life", { waitUntil: "load" });
  await expect(page.getByRole("button", { name: "Open reading and accessibility settings" })).toBeEnabled();
  await page.getByRole("combobox", { name: "Current stop" }).selectOption("shepherds");
  await expect(page.locator(".jsu-map-event-card")).toContainText("Shepherds hear the news");
  await page.getByRole("button", { name: "Terrain", exact: true }).click();

  const canvas = page.locator(".maplibregl-canvas");
  await expect(canvas).toBeVisible();
  await expect.poll(() => [...moduleResponses.keys()].sort()).toEqual([
    mapWorker.workerUrl.replace("-worker.mjs", "-shared.mjs"), mapWorker.workerUrl,
  ].sort());
  for (const response of moduleResponses.values()) {
    expect(response.status).toBe(200);
    expect(response.mime).toMatch(/(?:java|ecma)script/);
  }
  expect(workerUrls).toContain(new URL(mapWorker.workerUrl, page.url()).href);
  await expect(page.locator(".jsu-terrain-status")).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Terrain", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(vectorRequests).toBeGreaterThan(0);
  expect(demRequests).toBeGreaterThan(0);

  let rendered: Buffer = Buffer.alloc(0);
  await expect.poll(async () => {
    rendered = await canvas.screenshot();
    const { data, info } = await sharp(rendered).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let waterPixels = 0;
    for (let index = 0; index < data.length; index += info.channels) {
      if (Math.abs(data[index] - 151) <= 3 && Math.abs(data[index + 1] - 193) <= 3 && Math.abs(data[index + 2] - 197) <= 3) waterPixels++;
    }
    return waterPixels / (info.width * info.height);
  }, { message: "The worker-decoded water polygon must paint at least 20% of the canvas", timeout: 10_000 }).toBeGreaterThan(0.2);
  await testInfo.attach("rendered-vector-fixture", { body: rendered, contentType: "image/png" });
  expect(workerErrors).toEqual([]);
  await expect(page.locator(".jsu-terrain-marker")).toHaveCount(18);

  await canvas.evaluate((node) => node.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(page.getByRole("button", { name: "Atlas", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".jsu-map-event-card")).toContainText("Shepherds hear the news");
});
