import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postgres from "postgres";
import {
  FindStore,
  LIMITS,
  getFindStore,
  type Payload,
} from "../src/lib/find-server/store";
import { workOne } from "../src/lib/find-server/worker";
import { scheduleFind } from "../src/lib/find-server/queue";
import { resolvePublicSource } from "../src/lib/find-server/sources";
import { identity, submit } from "../src/lib/find-server/http";
import { MODEL } from "../scripts/research/types";
import { FIND_RUBRIC } from "../scripts/research/find-rubric";
import { evaluationRubric } from "../src/lib/find-server/evaluation";
const sql = postgres(process.env.FIND_TEST_DATABASE_URL!, { max: 8 });
const store = new FindStore(sql);
const passage = resolvePublicSource({
  kind: "scripture",
  translation: "web",
  book: "JHN",
  chapter: 11,
  verse: 35,
});
const payload = (query = "grief"): Payload => ({
  query,
  passages: [passage],
  model: MODEL,
  rubric: FIND_RUBRIC,
});
const reply = {
  model: MODEL,
  answers: {
    useful: { type: "noul", noul: 0.8 },
    relation: {
      type: "choice",
      choice: "directly-relevant",
      confidence: 0.8,
      probabilities: {
        "directly-relevant": 0.8,
        "indirectly-relevant": 0.1,
        unrelated: 0.05,
        "insufficient-context": 0.05,
      },
    },
  },
  usage: { input_tokens: 500, output_tokens: 10 },
};
before(async () => {
  await sql.unsafe(fs.readFileSync("src/lib/find-server/schema.sql", "utf8"));
  process.env.FIND_DATABASE_URL = process.env.FIND_TEST_DATABASE_URL;
  process.env.FIND_PUBLIC_ENABLED = "1";
  process.env.FIND_PUBLIC_ORIGIN = "http://127.0.0.1:3340";
  process.env.FIND_SESSION_SECRET =
    "local-test-session-secret-that-is-not-a-credential";
  process.env.TYPESAFE_API_KEY = "fixture-only";
  delete process.env.VERCEL;
});
beforeEach(async () => {
  await sql`TRUNCATE find_jobs,find_items,find_usage,find_attempts,find_cache`;
  await sql`UPDATE find_control SET enabled=true`;
});
after(async () => {
  await sql.end();
  await getFindStore().sql.end();
});
test("concurrent admission enforces a shared guest quota and idempotency", async () => {
  const results = await Promise.allSettled(
    Array.from({ length: 25 }, (_, i) =>
      store.submit("one", "net", payload(`grief ${i}`)),
    ),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 10);
  const repeated = await Promise.all(
    Array.from({ length: 20 }, () => store.submit("other", "net", payload())),
  );
  assert.equal(new Set(repeated.map((r) => r.id)).size, 1);
  assert.equal(
    (
      await sql`SELECT jobs FROM find_usage WHERE bucket LIKE 'guest:%:other'`
    )[0].jobs,
    1,
  );
});
test("network and site limits apply across guest sessions", async () => {
  const bounded = new FindStore(sql, { ...LIMITS, network: 2, site: 3 });
  await bounded.submit("a", "shared", payload());
  await bounded.submit("b", "shared", payload());
  await assert.rejects(bounded.submit("c", "shared", payload()), /allowance/);
  await bounded.submit("c", "other", payload());
  await assert.rejects(bounded.submit("d", "third", payload()), /allowance/);
});
test("jobs are private to their owning session", async () => {
  const { id } = await store.submit("a", "net", payload());
  await assert.rejects(store.read(id, "b"), /not found/);
  await assert.rejects(store.cancel(id, "b"), /not found/);
  assert.equal((await store.read(id, "a")).query, "grief");
});
test("failed queue delivery can retry immediately without consuming another job", async () => {
  const { id } = await store.submit("a", "net", payload());
  let deliveries = 0;
  const enqueue = async () => {
    if (++deliveries === 1) throw new Error("Queue temporarily unavailable");
  };
  await assert.rejects(scheduleFind(id, { store, enqueue }), /unavailable/);
  const repeated = await store.submit("a", "net", payload());
  assert.equal(repeated.id, id);
  assert.equal(repeated.reused, true);
  await scheduleFind(id, { store, enqueue });
  await scheduleFind(id, { store, enqueue });
  assert.equal(deliveries, 2);
  assert.equal((await sql`SELECT jobs FROM find_usage WHERE bucket LIKE 'guest:%:a'`)[0].jobs, 1);

  await sql`UPDATE find_jobs SET dispatch_after=now()-interval '1 minute' WHERE id=${id}`;
  const oldTicket = (await store.dispatchDue(id))!;
  await sql`UPDATE find_jobs SET dispatch_after=now()-interval '1 minute' WHERE id=${id}`;
  const newTicket = (await store.dispatchDue(id))!;
  assert.notEqual(oldTicket, newTicket);
  await store.dispatchFailed(id, oldTicket);
  assert.equal(await store.dispatchDue(id), undefined);
});
test("multiple workers share two leases and reserve cost before dispatch", async () => {
  const jobs = await Promise.all(
    [1, 2, 3].map((i) => store.submit(String(i), "net", payload())),
  );
  const claims = await Promise.all(jobs.map((j) => store.claim(j.id)));
  assert.equal(claims.filter(Boolean).length, 2);
  assert.equal(
    Number(
      (
        await sql`SELECT nanos FROM find_usage WHERE bucket LIKE 'cost-day:%'`
      )[0].nanos,
    ),
    2 * LIMITS.maxTokens * LIMITS.nanosPerToken,
  );
});
test("daily/monthly budget exhaustion prevents dispatch, including concurrent calls", async () => {
  const capped = new FindStore(sql, {
    ...LIMITS,
    monthNanos: LIMITS.maxTokens * LIMITS.nanosPerToken,
  });
  const a = await capped.submit("a", "net", payload()),
    b = await capped.submit("b", "net", payload());
  const claims = await Promise.all([capped.claim(a.id), capped.claim(b.id)]);
  assert.equal(claims.filter(Boolean).length, 1);
  assert.ok(
    [await capped.read(a.id, "a"), await capped.read(b.id, "b")].some(
      (r) => r.status === "incomplete",
    ),
  );
});
test("interrupted calls retain reservations, retries are bounded and stale workers cannot replace results", async () => {
  const { id } = await store.submit("a", "net", payload());
  const first = (await store.claim(id))!;
  await sql`UPDATE find_items SET lease_until=now()-interval '1 second'`;
  const second = (await store.claim(id))!;
  assert.equal(second.attempt, 2);
  await store.settle(first, { error: "late response" });
  assert.equal((await store.read(id, "a")).items[0].state, "running");
  await store.settle(second, { error: "timeout", retryAfterMs: 0 });
  const third = (await store.claim(id))!;
  assert.equal(third.attempt, 3);
  await store.settle(third, { error: "timeout", retryAfterMs: 0 });
  assert.equal((await store.read(id, "a")).status, "incomplete");
  assert.equal(
    Number(
      (
        await sql`SELECT nanos FROM find_usage WHERE bucket LIKE 'cost-day:%'`
      )[0].nanos,
    ),
    3 * LIMITS.maxTokens * LIMITS.nanosPerToken,
  );
});
test("worker validates, settles measured usage once, and caches successful assessments", async () => {
  const { id } = await store.submit("a", "net", payload());
  let calls = 0;
  await workOne(store, id, {
    key: "fixture-only",
    fetcher: async () => {
      calls++;
      return Response.json(reply);
    },
  });
  assert.equal((await store.read(id, "a")).status, "complete");
  assert.equal(calls, 1);
  assert.equal(
    Number(
      (
        await sql`SELECT nanos FROM find_usage WHERE bucket LIKE 'cost-day:%'`
      )[0].nanos,
    ),
    500 * LIMITS.nanosPerToken,
  );
  const cached = await store.submit("b", "net", payload());
  assert.equal((await store.read(cached.id, "b")).status, "complete");
  await workOne(store, cached.id, {
    key: "fixture-only",
    fetcher: async () => {
      throw new Error("must not call");
    },
  });
});
test("stale source and cancellation prevent new provider calls", async () => {
  const stale = payload();
  stale.passages = [{ ...passage, sourceHash: "stale" }];
  const { id } = await store.submit("a", "net", stale);
  let calls = 0;
  await workOne(store, id, {
    key: "fixture-only",
    fetcher: async () => {
      calls++;
      throw new Error();
    },
  });
  assert.equal(calls, 0);
  assert.equal(
    Number(
      (
        await sql`SELECT nanos FROM find_usage WHERE bucket LIKE 'cost-day:%'`
      )[0].nanos,
    ),
    0,
  );
  const other = await store.submit("b", "net", payload());
  await store.cancel(other.id, "b");
  assert.equal(await store.claim(other.id), null);
});
test("invalid replies remain incomplete and unmetered errors keep their reservation", async () => {
  const { id } = await store.submit("a", "net", payload());
  await workOne(store, id, {
    key: "fixture-only",
    fetcher: async () => Response.json({ madeUp: true }),
  });
  assert.equal((await store.read(id, "a")).status, "incomplete");
  assert.equal(
    Number(
      (
        await sql`SELECT nanos FROM find_usage WHERE bucket LIKE 'cost-day:%'`
      )[0].nanos,
    ),
    LIMITS.maxTokens * LIMITS.nanosPerToken,
  );
});
test("HTTP rejects forged sessions, cross-origin requests, files and oversized inputs", async () => {
  const origin = process.env.FIND_PUBLIC_ORIGIN!;
  const session = identity(
    new Request(origin + "/api/find/session", {
      method: "POST",
      headers: { origin },
    }),
    false,
  );
  const headers = {
    origin,
    cookie: session.cookie,
    "content-type": "application/json",
  };
  assert.throws(
    () =>
      identity(
        new Request(origin + "/api/find/jobs", {
          method: "POST",
          headers: { ...headers, origin: "https://attacker.invalid" },
        }),
      ),
    /Cross-origin/,
  );
  assert.throws(
    () =>
      identity(
        new Request(origin + "/api/find/jobs", {
          headers: { cookie: "find_guest=forged" },
        }),
      ),
    /session/,
  );
  const request = (body: unknown) =>
    new Request(origin + "/api/find/jobs", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  await assert.rejects(
    submit(
      request({
        query: "grief",
        sources: [{ kind: "file", path: "/etc/passwd" }],
      }),
    ),
    /source/,
  );
  await assert.rejects(
    submit(request({ query: "x".repeat(13000), sources: [passage.source] })),
    /limit/,
  );
  const job = await submit(
    request({ query: "grief", sources: [passage.source] }),
  );
  assert.ok(job.id);
});
test("disabled service fails closed and job expiry becomes explicit", async () => {
  const { id } = await store.submit("a", "net", payload());
  await sql`UPDATE find_jobs SET created_at=now()-interval '31 minutes' WHERE id=${id}`;
  await store.expirePending(id);
  assert.equal((await store.read(id, "a")).status, "incomplete");
  await sql`UPDATE find_control SET enabled=false`;
  await assert.rejects(store.submit("b", "net", payload()), /unavailable/);
  await assert.rejects(store.claim(id), /unavailable/);
});

const comparison = (): Payload => {
  const anchor = resolvePublicSource({ kind: "scripture", translation: "web", book: "ISA", chapter: 53, verse: 5 });
  return { query: "Compare the passages", anchor, passages: [resolvePublicSource({ kind: "early", id: "1clement", section: 15, paragraph: 0 })], model: MODEL, rubric: evaluationRubric(anchor) };
};
const relationshipReply = { model: MODEL, answers: { judgment: { type: "choice", choice: "close-wording", confidence: 0.8, probabilities: { "close-wording": 0.8, "substantial-paraphrase": 0.1, "thematic-overlap": 0.05, unrelated: 0.02, "insufficient-context": 0.03 } } }, usage: { input_tokens: 750, output_tokens: 20 } };

test("pair checks share the guest allowance with search and retain owner isolation", async () => {
  const bounded = new FindStore(sql, { ...LIMITS, guest: 1 });
  const { id } = await bounded.submit("a", "net", comparison());
  await assert.rejects(bounded.submit("a", "net", payload()), /allowance/);
  assert.equal((await bounded.submit("a", "net", comparison())).id, id);
  await assert.rejects(bounded.read(id, "b"), /not found/);
});
test("pair checks validate and cache independently, with the anchor in the cache identity", async () => {
  const p = comparison();
  const { id } = await store.submit("a", "net", p);
  let calls = 0;
  await workOne(store, id, { key: "fixture-only", fetcher: async (_url, init) => {
    calls++;
    const body = JSON.parse(init!.body as string);
    assert.equal(body.state.left.passage, p.anchor!.text);
    assert.equal(body.state.right.passage, p.passages[0].text);
    return Response.json(relationshipReply);
  } });
  assert.equal(calls, 1);
  assert.equal((await store.read(id, "a")).status, "complete");
  assert.deepEqual((await store.read(id, "a")).items[0].reply, relationshipReply);
  const cached = await store.submit("b", "net", p);
  assert.equal((await store.read(cached.id, "b")).status, "complete");
  const changed = { ...p, anchor: resolvePublicSource({ kind: "scripture", translation: "web", book: "ISA", chapter: 53, verse: 6 }) };
  const fresh = await store.submit("b", "net", changed);
  assert.equal((await store.read(fresh.id, "b")).status, "running");
  const relevance = await store.submit("c", "net", { ...payload(), passages: p.passages });
  assert.equal((await store.read(relevance.id, "c")).status, "running");
});
test("stale comparison anchors stop dispatch and relevance replies cannot pass as relationship judgments", async () => {
  const stale = comparison();
  stale.anchor = { ...stale.anchor!, sourceHash: "changed" };
  const { id } = await store.submit("a", "net", stale);
  await workOne(store, id, { key: "fixture-only", fetcher: async () => { throw Error("must not call"); } });
  assert.equal((await store.read(id, "a")).status, "incomplete");
  assert.equal(Number((await sql`SELECT nanos FROM find_usage WHERE bucket LIKE 'cost-day:%'`)[0].nanos), 0);
  const other = await store.submit("a", "net", comparison());
  await workOne(store, other.id, { key: "fixture-only", fetcher: async () => Response.json(reply) });
  assert.equal((await store.read(other.id, "a")).status, "incomplete");
});
test("HTTP pair admission resolves both sources and counts the anchor within the 20-passage limit", async () => {
  const origin = process.env.FIND_PUBLIC_ORIGIN!;
  const visitor = identity(new Request(origin + "/api/find/session", { method: "POST", headers: { origin } }), false);
  const request = (anchor: unknown, sources: unknown[]) => new Request(origin + "/api/find/jobs", { method: "POST", headers: { origin, cookie: visitor.cookie, "content-type": "application/json" }, body: JSON.stringify({ query: "Compare passages", anchor, sources }) });
  const p = comparison();
  await assert.rejects(submit(request({ kind: "file", path: "/etc/passwd" }, [passage.source])), /source/);
  await assert.rejects(submit(request(p.anchor!.source, Array(20).fill(passage.source))), /1–20/);
  await assert.rejects(submit(request(p.anchor!.source, [p.anchor!.source])), /Duplicate/);
  const job = await submit(request(p.anchor!.source, [p.passages[0].source]));
  const stored = await store.read(job.id, visitor.owner);
  assert.equal(stored.anchor?.text, p.anchor!.text);
  assert.equal(stored.passages[0].text, p.passages[0].text);
});
