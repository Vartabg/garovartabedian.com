import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import ledger from "../public/meta/embeds.json" with { type: "json" };
import {
  FAILING_VERDICT,
  MAX_AGE_DAYS,
  framingVerdict,
  readEmbedSource,
  VERDICTS,
} from "../scripts/site/check-embeds.mjs";
import { LAB_EMBEDS, SITE_ORIGIN } from "../src/lib/site/embeds";

const ROOT = path.join(import.meta.dirname, "..");
const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");
const entries = ledger.embeds as Record<
  string,
  { verdict: string; checkedAt: string; why: string }
>;

test("the page frames exactly the demos the list names", () => {
  // The URLs used to be literals in the page, again in the CSP, and nowhere
  // else — three copies with nothing keeping them equal. The page now renders
  // from the list; this holds the rest of the wiring to it.
  const page = read("src/app/labs/page.tsx");
  assert.match(page, /LAB_EMBEDS\.map/, "the page stopped rendering from the list");
  for (const embed of LAB_EMBEDS) {
    assert.ok(
      !new RegExp(`src="${embed.url}"`).test(page),
      `${embed.url} is hardcoded in the page again`,
    );
  }
});

test("the CSP frames those origins and no others", () => {
  const config = read("next.config.ts");
  const directive = /"(frame-src[^"]*)"/.exec(config);
  assert.ok(directive, "frame-src is gone from the CSP");
  const allowed = directive[1].split(/\s+/).slice(1).sort();
  const wanted = [...new Set(LAB_EMBEDS.map((embed) => new URL(embed.url).origin))].sort();
  assert.deepEqual(
    allowed,
    wanted,
    "the CSP frame-src list and the embed list have drifted apart",
  );
});

test("the ledger covers every embed and nothing else", () => {
  const urls = LAB_EMBEDS.map((embed) => embed.url).sort();
  assert.deepEqual(Object.keys(entries).sort(), urls, "run npm run check:embeds");
  assert.equal(ledger.origin, SITE_ORIGIN);
});

test("no demo is on record refusing to be framed by this site", () => {
  // Only positive evidence fails. A demo that was down when the ledger was
  // written is inconclusive, not broken — same calibration as the source-URL
  // gate, so the check stays worth leaving switched on.
  for (const [url, entry] of Object.entries(entries)) {
    assert.ok(VERDICTS.has(entry.verdict), `${url}: unknown verdict ${entry.verdict}`);
    assert.notEqual(entry.verdict, FAILING_VERDICT, `${url} refuses this site: ${entry.why}`);
  }
});

test("the evidence is recent enough to mean anything", () => {
  const oldest = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  for (const [url, entry] of Object.entries(entries)) {
    assert.ok(
      Date.parse(entry.checkedAt) >= oldest,
      `${url} was last checked ${entry.checkedAt} — rerun npm run check:embeds`,
    );
  }
});

test("the framing rules are read the way a browser reads them", () => {
  const headers = (init: Record<string, string>) => new Headers(init);
  const origin = SITE_ORIGIN;

  assert.equal(framingVerdict(headers({}), origin).verdict, "framable");
  assert.equal(framingVerdict(headers({ "x-frame-options": "DENY" }), origin).verdict, "blocked");
  // SAMEORIGIN means the demo's own origin, never this one.
  assert.equal(
    framingVerdict(headers({ "x-frame-options": "SameOrigin" }), origin).verdict,
    "blocked",
  );
  // This is the live shape atxbro.com serves, and the case that motivated it.
  assert.equal(
    framingVerdict(
      headers({
        "content-security-policy": `default-src 'self'; frame-ancestors 'self' ${origin}`,
      }),
      origin,
    ).verdict,
    "framable",
  );
  assert.equal(
    framingVerdict(headers({ "content-security-policy": "frame-ancestors 'self'" }), origin)
      .verdict,
    "blocked",
  );
  assert.equal(
    framingVerdict(headers({ "content-security-policy": "frame-ancestors *" }), origin).verdict,
    "framable",
  );
  // A CSP that says nothing about framing is not a refusal.
  assert.equal(
    framingVerdict(headers({ "content-security-policy": "default-src 'self'" }), origin).verdict,
    "framable",
  );
});

test("the script and the module agree on what is being checked", () => {
  const parsed = readEmbedSource(read("src/lib/site/embeds.ts"));
  assert.equal(parsed.origin, SITE_ORIGIN);
  assert.deepEqual(parsed.urls, LAB_EMBEDS.map((embed) => embed.url));
});
