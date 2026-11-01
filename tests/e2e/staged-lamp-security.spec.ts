import { createServer, type Server } from "node:http";
import { test, expect } from "@playwright/test";
import { routeStagedRequest } from "../../scripts/release/staged-routing.mjs";

async function listen(server: Server): Promise<number> {
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No test port");
  return address.port;
}

async function close(server: Server) {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

test("staged request interception does not forward the bypass across a redirect", async ({ page }) => {
  let otherRequests = 0;
  let sourceHeader: string | undefined;
  const other = createServer((_req, res) => { otherRequests++; res.end("unexpected"); });
  const otherPort = await listen(other);
  const source = createServer((req, res) => {
    sourceHeader = req.headers["x-vercel-protection-bypass"] as string | undefined;
    res.writeHead(302, { location: `http://127.0.0.1:${otherPort}/` });
    res.end();
  });
  const sourcePort = await listen(source);
  const origin = new URL(`http://127.0.0.1:${sourcePort}`);
  try {
    await page.route("**/*", route => routeStagedRequest(route, origin, "dummy-bypass"));
    await expect(page.goto(origin.href)).rejects.toThrow();
    await page.unrouteAll({ behavior: "wait" });
    expect(sourceHeader).toBe("dummy-bypass");
    expect(otherRequests).toBe(0);
  } finally {
    await close(source);
    await close(other);
  }
});

test("a failed staged request never prints the bypass", async () => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const script = `
    import { createServer } from "node:http";
    import { chromium } from "playwright";
    import { routeStagedRequest } from "./scripts/release/staged-routing.mjs";
    const server = createServer();
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const origin = new URL("http://127.0.0.1:" + server.address().port);
    await new Promise(resolve => server.close(resolve));
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    try {
      const page = await browser.newPage();
      await page.route("**/*", route => routeStagedRequest(route, origin, "dummy-private-bypass"));
      try { await page.goto(origin.href); throw new Error("navigation unexpectedly succeeded"); }
      catch (error) { if (error.message.includes("unexpectedly succeeded")) throw error; }
      await page.unrouteAll({ behavior: "wait" });
    } finally { await browser.close(); }
  `;
  const { stdout, stderr } = await promisify(execFile)(process.execPath, ["--input-type=module", "-e", script], { timeout: 30_000 });
  expect(stdout + stderr).not.toContain("dummy-private-bypass");
});
