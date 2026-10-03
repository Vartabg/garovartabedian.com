import postgres, { type Sql } from "postgres";
import { randomUUID } from "node:crypto";
import { digest } from "./sources";
import { MODEL } from "../../../scripts/research/types";
import { evaluationRubric, requestForPassage, validateFindReply, type FindReply, type Payload } from "./evaluation";
export { requestForPassage } from "./evaluation";
export type { Payload } from "./evaluation";

export const LIMITS = {
  guest: 10,
  network: 50,
  site: 1000,
  dayNanos: 2_000_000_000,
  monthNanos: 20_000_000_000,
  concurrent: 2,
  attempts: 3,
  maxTokens: 64000,
  nanosPerToken: 42,
};
type Job = {
  id: string;
  owner: string;
  payload: Payload;
  cancelled: boolean;
  created_at: Date;
};
export type Item = {
  position: number;
  state: string;
  attempts: number;
  reply: FindReply | null;
  error: string | null;
};
export type Claim = {
  job: string;
  position: number;
  lease: string;
  cacheKey: string;
  attempt: number;
  payload: Payload;
};
export class FindError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const cacheKey = (p: Payload, i: number) =>
  digest(
    JSON.stringify({
      request: requestForPassage(p, i),
      source: p.passages[i],
      ...(p.anchor ? { anchor: p.anchor } : {}),
      rubric: p.rubric,
    }),
  );

/** Every admission and provider reservation locks the same database control row.
 * All workers therefore share quota, spending and concurrency accounting. */
export class FindStore {
  constructor(
    readonly sql: Sql,
    readonly limits = LIMITS,
  ) {}
  private async lock(tx: postgres.TransactionSql) {
    const rows =
      await tx`SELECT enabled FROM find_control WHERE id = 1 FOR UPDATE`;
    if (!rows[0]?.enabled)
      throw new FindError(
        "Relevance checks are temporarily unavailable. Search remains available.",
        503,
      );
  }
  async submit(owner: string, network: string, payload: Payload) {
    return this.sql.begin(async (tx) => {
      await this.lock(tx);
      const key = digest(JSON.stringify(payload));
      const existing = await tx<
        Job[]
      >`SELECT * FROM find_jobs WHERE owner=${owner} AND request_key=${key} AND expires_at > now()`;
      if (existing[0]) return { id: existing[0].id, reused: true };
      await tx`DELETE FROM find_jobs WHERE expires_at <= now()`;
      await tx`DELETE FROM find_cache WHERE expires_at <= now()`;
      await tx`DELETE FROM find_usage WHERE updated_at < now() - interval '35 days'`;
      await tx`DELETE FROM find_attempts WHERE created_at < now() - interval '35 days'`;
      const [{ day }] =
        await tx`SELECT to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD') AS day`;
      const buckets: [string, number][] = [
        [`guest:${day}:${owner}`, this.limits.guest],
        [`network:${day}:${network}`, this.limits.network],
        [`site:${day}`, this.limits.site],
      ];
      for (const [bucket, max] of buckets) {
        await tx`INSERT INTO find_usage(bucket) VALUES (${bucket}) ON CONFLICT DO NOTHING`;
        const [usage] =
          await tx`SELECT jobs FROM find_usage WHERE bucket=${bucket}`;
        if (usage.jobs >= max)
          throw new FindError(
            "Today's assessment allowance is used. Search remains available.",
            429,
          );
      }
      for (const [bucket] of buckets)
        await tx`UPDATE find_usage SET jobs=jobs+1, updated_at=now() WHERE bucket=${bucket}`;
      const id = randomUUID();
      await tx`INSERT INTO find_jobs(id, owner, request_key, payload) VALUES (${id},${owner},${key},${tx.json(payload as never)})`;
      for (let i = 0; i < payload.passages.length; i++) {
        const key = cacheKey(payload, i);
        const cached =
          await tx`SELECT reply FROM find_cache WHERE key=${key} AND expires_at > now()`;
        let reply: FindReply | null = null;
        try {
          if (cached[0]) reply = validateFindReply(cached[0].reply, payload, i);
        } catch {
          /* Corrupt cache must be reevaluated. */
        }
        await tx`INSERT INTO find_items(job,position,cache_key,state,reply) VALUES (${id},${i},${key},${reply ? "complete" : "queued"},${reply ? tx.json(reply as never) : null})`;
      }
      return { id, reused: false };
    });
  }
  async read(id: string, owner: string) {
    if (!/^[a-f0-9-]{36}$/.test(id))
      throw new FindError("Search assessment not found.", 404);
    const [job] = await this.sql<
      Job[]
    >`SELECT * FROM find_jobs WHERE id=${id} AND owner=${owner} AND expires_at>now()`;
    if (!job) throw new FindError("Search assessment not found.", 404);
    const items = await this.sql<
      Item[]
    >`SELECT position,state,attempts,reply,error FROM find_items WHERE job=${id} ORDER BY position`;
    const pending = items.some((i) => ["queued", "running"].includes(i.state));
    return {
      id,
      query: job.payload.query,
      passages: job.payload.passages,
      ...(job.payload.anchor ? { anchor: job.payload.anchor } : {}),
      createdAt: job.created_at,
      status: job.cancelled
        ? "cancelled"
        : pending
          ? "running"
          : items.every((i) => i.state === "complete")
            ? "complete"
            : "incomplete",
      items,
    };
  }
  async cancel(id: string, owner: string) {
    await this.read(id, owner);
    await this.sql.begin(async (tx) => {
      await tx`SELECT id FROM find_control WHERE id=1 FOR UPDATE`;
      await tx`UPDATE find_jobs SET cancelled=true WHERE id=${id} AND owner=${owner}`;
      await tx`UPDATE find_items SET state='incomplete',error='Cancelled before dispatch' WHERE job=${id} AND state='queued'`;
    });
  }
  async pending(id: string) {
    const rows = await this
      .sql`SELECT 1 FROM find_items i JOIN find_jobs j ON j.id=i.job WHERE i.job=${id} AND NOT j.cancelled AND j.expires_at>now() AND i.state IN ('queued','running') LIMIT 1`;
    return rows.length > 0;
  }
  async dispatchDue(id: string) {
    const rows = await this
      .sql`UPDATE find_jobs SET dispatch_after=now()+interval '1 minute' WHERE id=${id} AND dispatch_after<=now() AND NOT cancelled AND expires_at>now() AND EXISTS (SELECT 1 FROM find_items WHERE job=${id} AND state IN ('queued','running')) RETURNING dispatch_after::text AS ticket`;
    return rows[0]?.ticket as string | undefined;
  }
  async dispatchFailed(id: string, ticket: string) {
    // Release only this sender's cooldown. A late failure cannot erase a newer
    // dispatch reservation. Retrying still uses queue and provider idempotency.
    // Bind as text first so the driver's Date serializer keeps microseconds.
    await this.sql`UPDATE find_jobs SET dispatch_after=now() WHERE id=${id} AND dispatch_after=${ticket}::text::timestamptz`;
  }
  async expirePending(id: string) {
    await this
      .sql`UPDATE find_items SET state='incomplete',error='Assessment exceeded its 30-minute processing window',lease=null WHERE job=${id} AND state IN ('queued','running') AND EXISTS (SELECT 1 FROM find_jobs WHERE id=${id} AND created_at<now()-interval '30 minutes')`;
  }
  async claim(id: string): Promise<Claim | null> {
    return this.sql.begin(async (tx) => {
      await this.lock(tx);
      // A crashed/uncertain call keeps its full reservation. Replays have a new
      // attempt and reservation, never assume an upstream timeout was free.
      await tx`UPDATE find_items SET state=CASE WHEN attempts >= ${this.limits.attempts} THEN 'incomplete' ELSE 'queued' END, error='Previous request interrupted; billing remains reserved', lease=null WHERE state='running' AND lease_until < now()`;
      const [busy] =
        await tx`SELECT count(*)::integer AS count FROM find_items WHERE state='running' AND lease_until>now()`;
      if (busy.count >= this.limits.concurrent) return null;
      const [item] =
        await tx`SELECT i.*,j.payload FROM find_items i JOIN find_jobs j ON j.id=i.job WHERE i.job=${id} AND i.state='queued' AND i.next_at<=now() AND NOT j.cancelled AND j.expires_at>now() ORDER BY i.position LIMIT 1 FOR UPDATE OF i SKIP LOCKED`;
      if (!item) return null;
      const payload = item.payload as Payload;
      if (payload.model !== MODEL || payload.rubric !== evaluationRubric(payload.anchor)) {
        await tx`UPDATE find_items SET state='incomplete',error='Model or rubric changed; start a new assessment' WHERE job=${id} AND position=${item.position}`;
        return null;
      }
      const [{ day, month }] =
        await tx`SELECT to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD') AS day,to_char(now() AT TIME ZONE 'UTC','YYYY-MM') AS month`;
      const reserve = this.limits.maxTokens * this.limits.nanosPerToken;
      const buckets: [string, number][] = [
        [`cost-day:${day}`, this.limits.dayNanos],
        [`cost-month:${month}`, this.limits.monthNanos],
      ];
      for (const [bucket, max] of buckets) {
        await tx`INSERT INTO find_usage(bucket) VALUES (${bucket}) ON CONFLICT DO NOTHING`;
        const [used] =
          await tx`SELECT nanos FROM find_usage WHERE bucket=${bucket}`;
        if (Number(used.nanos) + reserve > max) {
          await tx`UPDATE find_items SET state='incomplete',error='Site assessment budget reached' WHERE job=${id} AND state='queued'`;
          return null;
        }
      }
      for (const [bucket] of buckets)
        await tx`UPDATE find_usage SET nanos=nanos+${reserve},updated_at=now() WHERE bucket=${bucket}`;
      const lease = randomUUID();
      await tx`INSERT INTO find_attempts(lease,job,position,day_bucket,month_bucket,reserved,charged) VALUES (${lease},${id},${item.position},${buckets[0][0]},${buckets[1][0]},${reserve},${reserve})`;
      await tx`UPDATE find_items SET state='running',attempts=attempts+1,lease=${lease},lease_until=now()+interval '2 minutes' WHERE job=${id} AND position=${item.position}`;
      return {
        job: id,
        position: item.position,
        lease,
        cacheKey: item.cache_key,
        attempt: item.attempts + 1,
        payload,
      };
    });
  }
  async settle(
    claim: Claim,
    outcome: {
      reply?: FindReply;
      usage?: { input_tokens: number; output_tokens: number };
      error?: string;
      retryAfterMs?: number;
      definitelyUnsent?: boolean;
    },
  ) {
    await this.sql.begin(async (tx) => {
      await tx`SELECT id FROM find_control WHERE id=1 FOR UPDATE`;
      const [attempt] =
        await tx`SELECT * FROM find_attempts WHERE lease=${claim.lease} FOR UPDATE`;
      if (!attempt || attempt.state !== "unknown") return;
      const usage = outcome.usage ?? outcome.reply?.usage;
      const measured =
        usage &&
        Number.isSafeInteger(usage.input_tokens) &&
        usage.input_tokens >= 0 &&
        Number.isSafeInteger(usage.output_tokens) &&
        usage.output_tokens >= 0;
      const charged = outcome.definitelyUnsent
        ? 0
        : measured
          ? usage.input_tokens * this.limits.nanosPerToken
          : Number(attempt.reserved);
      // Unexpected provider usage disables dispatch; account for it, never hide it.
      if (charged > Number(attempt.reserved))
        await tx`UPDATE find_control SET enabled=false WHERE id=1`;
      for (const bucket of [attempt.day_bucket, attempt.month_bucket])
        await tx`UPDATE find_usage SET nanos=nanos+${charged - Number(attempt.charged)},updated_at=now() WHERE bucket=${bucket}`;
      await tx`UPDATE find_attempts SET charged=${charged},state=${measured || outcome.definitelyUnsent ? "settled" : "reserved"},input_tokens=${measured ? usage.input_tokens : null},output_tokens=${measured ? usage.output_tokens : null} WHERE lease=${claim.lease}`;
      const retry =
        outcome.retryAfterMs !== undefined &&
        claim.attempt < this.limits.attempts;
      const rows =
        await tx`UPDATE find_items SET state=${outcome.reply ? "complete" : retry ? "queued" : "incomplete"},reply=${outcome.reply ? tx.json(outcome.reply as never) : null},error=${outcome.error ?? null},lease=null,lease_until=null,next_at=now()+${outcome.retryAfterMs ?? 0}*interval '1 millisecond' WHERE job=${claim.job} AND position=${claim.position} AND lease=${claim.lease} RETURNING job`;
      if (rows.length && outcome.reply)
        await tx`INSERT INTO find_cache(key,reply) VALUES (${claim.cacheKey},${tx.json(outcome.reply as never)}) ON CONFLICT(key) DO UPDATE SET reply=EXCLUDED.reply,expires_at=now()+interval '7 days'`;
    });
  }
}
let instance: FindStore | undefined;
export function getFindStore() {
  if (!process.env.FIND_DATABASE_URL)
    throw new FindError("Assessment storage is not configured.", 503);
  return (instance ??= new FindStore(
    postgres(process.env.FIND_DATABASE_URL, {
      max: 3,
      connect_timeout: 10,
      idle_timeout: 20,
      prepare: false,
    }),
  ));
}
