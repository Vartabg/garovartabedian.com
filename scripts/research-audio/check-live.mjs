#!/usr/bin/env node
/** Verify the committed scripts and exact media bytes at a public deployment. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url);
const episodes = JSON.parse(await readFile(new URL("src/lib/research-audio/episodes.json", root), "utf8"));
const manifest = JSON.parse(await readFile(new URL("public/research-audio/manifest.json", root), "utf8"));
const origin = new URL(process.env.RESEARCH_AUDIO_ORIGIN ?? "https://garovartabedian.com");
assert.ok(origin.protocol === "https:" && origin.pathname === "/" && !origin.search && !origin.hash && !origin.username && !origin.password,
  "Use an HTTPS origin without credentials, a path, or parameters");
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const request = (pathname, headers) => fetch(new URL(pathname, origin), { headers, signal: AbortSignal.timeout(180_000) });
const receipt = { origin: origin.origin, checkedAt: new Date().toISOString(), episodes: [] };

for (const episode of episodes) {
  const media = manifest[episode.id];
  const page = await request(episode.route);
  assert.equal(page.status, 200, `${episode.id}: page status`);
  const html = await page.text();
  assert.ok(html.includes(`id="audio-${episode.id}"`), `${episode.id}: overview missing`);
  assert.ok(html.includes("Read the transcript &amp; sources"), `${episode.id}: transcript missing`);
  assert.ok(html.includes("AI narration"), `${episode.id}: disclosure missing`);
  assert.match(html, /<audio[^>]*preload="none"/, `${episode.id}: unexpected preload`);
  for (const source of episode.sources) {
    assert.ok(html.includes(`href="${escape(source.href)}"`), `${episode.id}: source link missing: ${source.id}`);
  }
  const response = await request(media.src);
  assert.equal(response.status, 200, `${episode.id}: media status`);
  assert.match(response.headers.get("content-type") ?? "", /^audio\//, `${episode.id}: media type`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  assert.equal(sha256, media.sha256, `${episode.id}: deployed media differs from verified recording`);
  // Check both initial loading and a chapter-style seek into the recording.
  for (const start of [0, Math.floor(bytes.length / 3)]) {
    const end = Math.min(start + 1023, bytes.length - 1);
    const range = await request(media.src, { Range: `bytes=${start}-${end}` });
    assert.equal(range.status, 206, `${episode.id}: range status`);
    assert.equal(range.headers.get("content-range"), `bytes ${start}-${end}/${bytes.length}`, `${episode.id}: range bounds`);
    assert.deepEqual(Buffer.from(await range.arrayBuffer()), bytes.subarray(start, end + 1), `${episode.id}: range data`);
  }
  receipt.episodes.push({ id: episode.id, route: episode.route, src: media.src, durationSeconds: media.durationSeconds, bytes: bytes.length, sha256 });
  console.error(`${episode.id}: page, sources, disclosure, media hash, and seek ranges PASS`);
}
console.log(JSON.stringify(receipt, null, 2));
