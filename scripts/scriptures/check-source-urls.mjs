#!/usr/bin/env node
/**
 * Check that every source a book briefing cites actually exists.
 *
 * A briefing's authority rests on `sources[]`: a reader who doubts a claim is
 * meant to be able to open the work it came from. Nothing checked that those
 * links went anywhere. They did not always: five of fourteen URLs in one batch
 * of three briefings were 404s, invented in a plausible publisher URL shape —
 * `eerdmans.com/Products/0498/....aspx`, `wjkbooks.com/Products/0664224523/
 * ....aspx`. The prose around them was careful and the citations were fiction.
 *
 * Network access is not something the test suite should depend on: it fails
 * offline, it is slow, and several real publishers (Bloomsbury, Oxford) answer
 * a scripted request with 403 while serving the page fine to a person. So the
 * work is split the way the rest of this repo splits it — this script does the
 * live checking and writes what it found; the committed ledger is the evidence;
 * and a plain unit test holds the briefings to the ledger.
 *
 * Verdicts:
 *   ok       2xx — the page is there.
 *   blocked  401/403/405/429 — the host refuses scripted requests. Not a
 *            failure. Recorded so a person can confirm it once by eye.
 *   dead     404/410 — the page is not there. A hard failure.
 *   error    DNS failure, timeout, 5xx — inconclusive; retried next run.
 *
 * Usage:
 *   node scripts/scriptures/check-source-urls.mjs            # only unchecked/stale
 *   node scripts/scriptures/check-source-urls.mjs --all      # recheck everything
 *   node scripts/scriptures/check-source-urls.mjs --books OBA,PHM
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeStableJson } from "../site/stable-stamp.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BOOKS_DIR = path.join(ROOT, "public/scriptures/books");
// Deliberately not in BOOKS_DIR: everything that walks that folder treats
// each file there as a briefing.
export const LEDGER_PATH = path.join(ROOT, "public/meta/source-urls.json");

/** A verdict older than this is rechecked; the test also refuses to trust it. */
export const MAX_AGE_DAYS = 180;
const TIMEOUT_MS = 20_000;
/** A browser-shaped request: several publishers refuse anything that isn't. */
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

export const VERDICTS = new Set(["ok", "blocked", "dead", "error"]);
/**
 * The only verdict that fails the build.
 *
 * Calibrated deliberately: fail on positive evidence of absence, never on
 * absence of evidence. A 404 is the site telling us the page is gone. A 403 is
 * a publisher refusing robots, and a connection failure is our network or
 * theirs — eight Cambridge URLs in the existing briefings answer that way, and
 * they are real citations. Failing on those would make the gate a nuisance
 * that gets switched off, which is worse than not having it.
 */
export const FAILING_VERDICT = "dead";

export function verdictForStatus(status) {
  if (status >= 200 && status < 300) return "ok";
  if (status === 404 || status === 410) return "dead";
  if ([401, 403, 405, 429].includes(status)) return "blocked";
  return "error";
}

/** Every distinct URL cited by any book briefing, with who cites it. */
export function citedUrls() {
  const cited = new Map();
  for (const file of fs.readdirSync(BOOKS_DIR).sort()) {
    if (!file.endsWith(".json")) continue;
    const briefing = JSON.parse(fs.readFileSync(path.join(BOOKS_DIR, file), "utf8"));
    for (const source of briefing.sources ?? []) {
      if (!source.url) continue;
      if (!cited.has(source.url)) cited.set(source.url, []);
      cited.get(source.url).push(`${briefing.book}:${source.id}`);
    }
  }
  return cited;
}

export function readLedger() {
  if (!fs.existsSync(LEDGER_PATH)) return { schemaVersion: 1, urls: {} };
  try {
    return JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8"));
  } catch {
    return { schemaVersion: 1, urls: {} };
  }
}

export function isStale(entry, now, maxAgeDays = MAX_AGE_DAYS) {
  if (!entry?.checkedAt) return true;
  const checked = Date.parse(entry.checkedAt);
  if (Number.isNaN(checked)) return true;
  return now - checked > maxAgeDays * 24 * 60 * 60 * 1000;
}

/**
 * Last time each host was contacted. Publishers rate-limit, and a burst of
 * requests comes back 403 from a host that would have answered one request
 * fine — which would fill the ledger with "blocked" verdicts that say more
 * about our impatience than about the page.
 */
const lastRequestByHost = new Map();
const HOST_DELAY_MS = 1_500;

async function politeWait(url) {
  const host = new URL(url).host;
  const last = lastRequestByHost.get(host);
  if (last !== undefined) {
    const wait = HOST_DELAY_MS - (Date.now() - last);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestByHost.set(host, Date.now());
}

async function probe(url) {
  await politeWait(url);
  // HEAD first — cheap, and enough for most hosts. Some answer HEAD with 405
  // while serving GET fine, so a refusal is retried as a GET before it counts.
  for (const method of ["HEAD", "GET"]) {
    try {
      const response = await fetch(url, {
        method,
        redirect: "follow",
        headers: { "User-Agent": USER_AGENT, Accept: "*/*" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const verdict = verdictForStatus(response.status);
      if (method === "HEAD" && (verdict === "blocked" || verdict === "error")) continue;
      return { verdict, status: response.status };
    } catch (error) {
      if (method === "GET") {
        return { verdict: "error", status: 0, note: String(error).slice(0, 120) };
      }
    }
  }
  return { verdict: "error", status: 0 };
}

// Wrapped rather than top-level await: this module is imported by the test
// suite, and a top-level await makes it untransformable there.
async function main() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const booksOpt = args.find((a) => a.startsWith("--books="));
  const only = booksOpt ? new Set(booksOpt.slice(8).split(",")) : null;

  const cited = citedUrls();
  const ledger = readLedger();
  const now = Date.now();

  const queue = [...cited].filter(([url, citedBy]) => {
    if (only && !citedBy.some((entry) => only.has(entry.split(":")[0]))) return false;
    return all || isStale(ledger.urls[url], now);
  });

  console.log(`${cited.size} cited URLs; ${queue.length} to check`);

  for (const [url, citedBy] of queue) {
    const result = await probe(url);
    ledger.urls[url] = {
      verdict: result.verdict,
      status: result.status,
      checkedAt: new Date(now).toISOString(),
      citedBy: citedBy.sort(),
      ...(result.note ? { note: result.note } : {}),
    };
    console.log(`  ${result.verdict.padEnd(7)} ${String(result.status).padEnd(4)} ${url}`);
  }

  // Drop entries nothing cites any more, so the ledger stays a record of the
  // briefings as they are rather than an archive of everything ever checked.
  for (const url of Object.keys(ledger.urls)) {
    if (!cited.has(url)) delete ledger.urls[url];
    else ledger.urls[url].citedBy = cited.get(url).sort();
  }

  writeStableJson(LEDGER_PATH, {
    schemaVersion: 1,
    generatedBy: "scripts/scriptures/check-source-urls.mjs",
    generatedAt: new Date(now).toISOString().replace(/\.\d{3}Z$/, ".000Z"),
    maxAgeDays: MAX_AGE_DAYS,
    note: "'blocked' means the publisher refuses scripted requests, not that the page is missing. 'dead' is a hard failure and fails the test suite.",
    urls: Object.fromEntries(Object.entries(ledger.urls).sort(([a], [b]) => a.localeCompare(b))),
  });

  const tally = {};
  for (const entry of Object.values(ledger.urls)) {
    tally[entry.verdict] = (tally[entry.verdict] ?? 0) + 1;
  }
  console.log(
    Object.entries(tally)
      .map(([verdict, count]) => `${count} ${verdict}`)
      .join(" · "),
  );

  const dead = Object.entries(ledger.urls).filter(([, e]) => e.verdict === "dead");
  if (dead.length > 0) {
    console.error(`\n${dead.length} cited source URL(s) do not exist:`);
    for (const [url, entry] of dead) {
      console.error(`  ${url}\n    cited by ${entry.citedBy.join(", ")}`);
    }
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
