import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  FAILING_VERDICT,
  LEDGER_PATH,
  MAX_AGE_DAYS,
  VERDICTS,
  citedUrls,
  isStale,
  verdictForStatus,
} from "../scripts/scriptures/check-source-urls.mjs";

type LedgerEntry = {
  verdict: string;
  status: number;
  checkedAt: string;
  citedBy: string[];
};

const ledger = JSON.parse(readFileSync(LEDGER_PATH, "utf8")) as {
  maxAgeDays: number;
  urls: Record<string, LedgerEntry>;
};
const cited = citedUrls();

test("every URL a briefing cites has been checked", () => {
  // The gate that would have caught the fabrications. Three briefings once
  // shipped with five invented publisher URLs in a plausible shape —
  // eerdmans.com/Products/0498/....aspx and the like — every one a 404. The
  // prose around them was careful; the citations were fiction. A briefing's
  // authority is that a reader can open the source, so an unchecked URL is not
  // publishable.
  const unchecked = [...cited.keys()].filter((url) => !ledger.urls[url]);
  assert.deepEqual(
    unchecked,
    [],
    `run \`npm run check:source-urls\` — ${unchecked.length} cited URL(s) have never been checked`,
  );
});

test("no briefing cites a source that does not exist", () => {
  const dead = Object.entries(ledger.urls)
    .filter(([, entry]) => entry.verdict === FAILING_VERDICT)
    .map(([url, entry]) => `${url} (cited by ${entry.citedBy.join(", ")})`);
  assert.deepEqual(dead, [], `dead source URL(s):\n  ${dead.join("\n  ")}`);
});

test("the ledger records only verdicts the checker can produce", () => {
  for (const [url, entry] of Object.entries(ledger.urls)) {
    assert.ok(VERDICTS.has(entry.verdict), `${url} has unknown verdict "${entry.verdict}"`);
    assert.ok(Array.isArray(entry.citedBy) && entry.citedBy.length > 0, `${url} is cited by nothing`);
    assert.ok(!Number.isNaN(Date.parse(entry.checkedAt)), `${url} has no real checkedAt`);
  }
});

test("the ledger holds nothing the briefings no longer cite", () => {
  // Otherwise it silently becomes an archive, and a stale "ok" could vouch for
  // a URL that was edited into something else entirely.
  const orphaned = Object.keys(ledger.urls).filter((url) => !cited.has(url));
  assert.deepEqual(orphaned, [], `ledger holds ${orphaned.length} uncited URL(s)`);
});

test("no verdict is older than the window the ledger advertises", () => {
  assert.equal(ledger.maxAgeDays, MAX_AGE_DAYS);
  const now = Date.now();
  const stale = Object.entries(ledger.urls)
    .filter(([, entry]) => isStale(entry, now, MAX_AGE_DAYS))
    .map(([url, entry]) => `${url} (checked ${entry.checkedAt})`);
  assert.deepEqual(
    stale,
    [],
    `run \`npm run check:source-urls\` — ${stale.length} verdict(s) older than ${MAX_AGE_DAYS} days`,
  );
});

test("the verdict scale fails on absence, not on refusal", () => {
  // The calibration matters more than the plumbing. A publisher refusing
  // robots, or a connection that drops, is not evidence a citation is fake —
  // and a gate that fails on those gets switched off.
  assert.equal(verdictForStatus(200), "ok");
  assert.equal(verdictForStatus(404), "dead");
  assert.equal(verdictForStatus(410), "dead");
  assert.equal(verdictForStatus(403), "blocked");
  assert.equal(verdictForStatus(429), "blocked");
  assert.equal(verdictForStatus(500), "error");
  assert.equal(FAILING_VERDICT, "dead");
});

test("a fresh check is not stale and a missing one always is", () => {
  const now = Date.parse("2026-08-29T00:00:00.000Z");
  assert.equal(isStale({ checkedAt: "2026-08-28T00:00:00.000Z" }, now), false);
  assert.equal(isStale({ checkedAt: "2025-08-28T00:00:00.000Z" }, now), true);
  assert.equal(isStale(undefined, now), true);
  assert.equal(isStale({ checkedAt: "not a date" }, now), true);
});
