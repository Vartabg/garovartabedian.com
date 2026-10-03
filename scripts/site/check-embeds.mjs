#!/usr/bin/env node
/**
 * Check that the two demos the Machinery page frames still allow being framed.
 *
 * /labs mounts EYE and atxbro.com whole and says so in as many words — "no
 * screenshots, no mockups". That claim depends on something outside this repo:
 * each demo's own deploy has to keep permitting this site as a frame ancestor.
 * atxbro.com currently allows exactly `frame-ancestors 'self'
 * https://garovartabedian.com`. One header change on that side, and the page's
 * proudest section becomes two empty rectangles — served to a visitor, with
 * nothing in this build complaining.
 *
 * Split the way the source-URL gate is split, and for the same reasons: the
 * test suite must not need the network, so this script does the live checking
 * and writes what it found, the committed ledger is the evidence, and a plain
 * unit test holds the page and the CSP to it.
 *
 * Verdicts:
 *   framable     2xx and nothing refuses this origin as a frame ancestor.
 *   blocked      X-Frame-Options DENY/SAMEORIGIN, or a frame-ancestors list
 *                this site is not in. Positive evidence; a hard failure.
 *   unreachable  a non-2xx answer. Inconclusive — a demo can be down for an
 *                hour without the embed being wrong.
 *   error        DNS failure or timeout. Inconclusive, same reasoning.
 *
 * Only `blocked` fails, on the same calibration the source-URL gate uses: fail
 * on evidence of absence, never on absence of evidence.
 *
 * Usage:
 *   node scripts/site/check-embeds.mjs
 *   node scripts/site/check-embeds.mjs --report
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeStableJson } from "./stable-stamp.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const LEDGER_PATH = path.join(ROOT, "public/meta/embeds.json");

/** A verdict older than this is not trusted; the test says so too. */
export const MAX_AGE_DAYS = 90;
const TIMEOUT_MS = 20_000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

export const VERDICTS = new Set(["framable", "blocked", "unreachable", "error"]);
export const FAILING_VERDICT = "blocked";

/**
 * Read the embed list out of the TypeScript source.
 *
 * A .mjs script cannot import the .ts module, and duplicating the URLs here
 * would recreate the drift this whole change exists to close. Parsing the one
 * declaration keeps a single source of truth.
 */
export function readEmbedSource(source) {
  const origin = /SITE_ORIGIN\s*=\s*"([^"]+)"/.exec(source);
  if (!origin) throw new Error("SITE_ORIGIN is missing from src/lib/site/embeds.ts");
  const urls = [...source.matchAll(/^\s*url:\s*"([^"]+)",$/gm)].map((match) => match[1]);
  if (urls.length === 0) throw new Error("no embed urls found in src/lib/site/embeds.ts");
  return { origin: origin[1], urls };
}

/**
 * Would a page at `origin` be allowed to frame a document served with these
 * headers?
 *
 * X-Frame-Options is the blunt instrument and wins where present: DENY refuses
 * everyone, SAMEORIGIN refuses everyone but the demo itself. Otherwise the CSP
 * decides — an explicit frame-ancestors list must name this origin (or `*`),
 * and no frame-ancestors directive at all means no objection.
 */
export function framingVerdict(headers, origin) {
  const xfo = (headers.get("x-frame-options") ?? "").trim().toLowerCase();
  if (xfo === "deny") return { verdict: "blocked", why: "X-Frame-Options: DENY" };
  if (xfo === "sameorigin") return { verdict: "blocked", why: "X-Frame-Options: SAMEORIGIN" };

  const csp = headers.get("content-security-policy") ?? "";
  const directive = csp
    .split(";")
    .map((part) => part.trim())
    .find((part) => /^frame-ancestors\b/i.test(part));
  if (!directive) return { verdict: "framable", why: "no framing restriction", frameAncestors: null };

  const sources = directive.split(/\s+/).slice(1);
  const allowed =
    sources.includes("*") ||
    sources.some((value) => value.replace(/\/$/, "").toLowerCase() === origin.toLowerCase());
  return allowed
    ? { verdict: "framable", why: "named in frame-ancestors", frameAncestors: directive }
    : {
        verdict: "blocked",
        why: `frame-ancestors does not include ${origin}`,
        frameAncestors: directive,
      };
}

async function visit(url, origin) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT },
    });
    if (!response.ok) {
      return { status: response.status, verdict: "unreachable", why: `HTTP ${response.status}` };
    }
    return { status: response.status, ...framingVerdict(response.headers, origin) };
  } catch (error) {
    return { status: 0, verdict: "error", why: error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const source = fs.readFileSync(path.join(ROOT, "src/lib/site/embeds.ts"), "utf8");
  const { origin, urls } = readEmbedSource(source);
  const checkedAt = new Date().toISOString().slice(0, 10);
  const embeds = {};

  // The apex is the canonical host and the one the CSP allow-lists name, but
  // www.garovartabedian.com currently answers 200 rather than redirecting. A
  // visitor who lands there gets any demo whose frame-ancestors names only the
  // apex refused. That is a DNS/hosting fix, not a repo one, so it is reported
  // and recorded — never failed on.
  const wwwOrigin = origin.replace("https://", "https://www.");

  for (const url of urls) {
    const result = await visit(url, origin);
    const alsoFromWww = await visit(url, wwwOrigin);
    embeds[url] = { ...result, checkedAt, framableFromWww: alsoFromWww.verdict === "framable" };
    console.log(`${result.verdict.padEnd(11)} ${url}  — ${result.why}`);
    if (result.verdict === "framable" && alsoFromWww.verdict !== "framable") {
      console.warn(`  note: blocked from ${wwwOrigin} — ${alsoFromWww.why}`);
    }
  }

  writeStableJson(
    LEDGER_PATH,
    {
      note:
        "Whether each demo framed by /labs still permits this site as a frame ancestor. "
        + "framableFromWww records the same question for the www host, which is reported but "
        + "never failed on — it is a hosting fix. Written by scripts/site/check-embeds.mjs; "
        + "tests/labs-embeds.test.ts holds the page to it.",
      origin,
      embeds,
    },
    { key: "checkedAt" },
  );

  const blocked = Object.entries(embeds).filter(([, entry]) => entry.verdict === FAILING_VERDICT);
  if (blocked.length > 0) {
    console.error(`\n${blocked.length} embed(s) refuse to be framed by ${origin}:`);
    for (const [url, entry] of blocked) console.error(`  ${url} — ${entry.why}`);
    process.exitCode = 1;
  } else {
    console.log(`\n${urls.length} embeds still framable from ${origin}.`);
  }
}

// No top-level await: the test suite imports this module through tsx, which
// transforms to CJS and cannot carry one.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
