import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseEnv } from "node:util";
import type { Unit, Label } from "./types";
import { requestFor, validateReply, unitFingerprint, type Reply } from "./rubric";
export { criteria, rubricHash, requestFor, unitFingerprint, validateReply } from "./rubric";
import { readJson, writeJson } from "./storage";
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }

export const CONFIG = path.join(os.homedir(), ".config/garovartabedian/jev.env");
export function loadKey(file = CONFIG): string | undefined {
  if (process.env.TYPESAFE_API_KEY?.trim()) return process.env.TYPESAFE_API_KEY.trim();
  if (!fs.existsSync(file)) return;
  if (!fs.lstatSync(file).isFile() || (fs.statSync(file).mode & 0o077) !== 0) throw new Error("Jev key file must be a regular private file (chmod 600)");
  return parseEnv(fs.readFileSync(file, "utf8")).TYPESAFE_API_KEY?.trim();
}
export type Budget = { attempts: number; limit: number };
export class JevClient {
  constructor(private options: { cache: string; key?: string; budget: Budget; fetcher?: typeof fetch; timeout?: number; sleep?: (ms: number) => Promise<void>; onAttempt?: () => void; onUsage?: (input: number, output: number) => void; offline?: boolean; signal?: AbortSignal }) {}
  async evaluate(unit: Unit): Promise<{ reply: Reply; cached: boolean }> {
    return this.evaluateRequest(requestFor(unit), unitFingerprint(unit), value => validateReply(value, unit));
  }
  async evaluateRequest<T>(request: unknown, key: string, validate: (value: unknown) => T): Promise<{ reply: T; cached: boolean }> {
    const file = path.join(this.options.cache, `${key}.json`);
    if (fs.existsSync(file)) {
      try {
        const cached = readJson<{ key: string; reply: unknown }>(file);
        if (cached.key === key) return { reply: validate(cached.reply), cached: true };
      } catch { /* A corrupt cache is never evidence; live runs may repair it. */ }
    }
    if (this.options.offline) throw new Error("No valid cached result (offline mode)");
    if (!this.options.key) throw new Error("TYPESAFE_API_KEY is missing; run research:jev setup once");
    const body = JSON.stringify(request);
    if (Buffer.byteLength(body) > 24000) throw new Error("Evaluation context exceeds local 24 KB budget; select shorter passages");
    for (let retry = 0; retry <= 2; retry++) {
      if (this.options.signal?.aborted) throw new Error("Research run interrupted");
      if (this.options.budget.attempts >= this.options.budget.limit) throw new Error("Run attempt limit reached; increase --max-attempts to resume");
      this.options.budget.attempts++;
      this.options.onAttempt?.();
      let response: Response;
      const timeout = AbortSignal.timeout(this.options.timeout ?? 30000);
      const signal = this.options.signal ? AbortSignal.any([timeout, this.options.signal]) : timeout;
      try {
        response = await (this.options.fetcher ?? fetch)("https://api.typesafe.ai/v1/systemone", {
          method: "POST", redirect: "error", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.options.key}` }, body,
          signal,
        });
      } catch {
        if (this.options.signal?.aborted) throw new Error("Research run interrupted");
        if (retry === 2) throw new Error("Jev network request failed or timed out");
        await (this.options.sleep ?? delay)(500 * 2 ** retry); continue;
      }
      if (response.ok) {
        let value: unknown;
        try { value = await response.json(); } catch {
          if (this.options.signal?.aborted) throw new Error("Research run interrupted");
          if (signal.aborted && retry < 2) { await (this.options.sleep ?? delay)(500 * 2 ** retry); continue; }
          throw new Error("Jev response body was incomplete or invalid JSON");
        }
        if (object(value) && object(value.usage) && [value.usage.input_tokens, value.usage.output_tokens].every(n => Number.isSafeInteger(n) && (n as number) >= 0)) this.options.onUsage?.(value.usage.input_tokens as number, value.usage.output_tokens as number);
        const reply = validate(value);
        writeJson(file, { key, reply });
        return { reply, cached: false };
      }
      await response.body?.cancel();
      if (retry === 2 || ![408, 429, 500, 502, 503, 504, 529].includes(response.status)) throw new Error(`Jev HTTP ${response.status}`);
      const raw = response.headers.get("retry-after");
      const ms = raw ? (/^\d+(\.\d+)?$/.test(raw) ? Number(raw) * 1000 : Math.max(0, Date.parse(raw) - Date.now())) : 500 * 2 ** retry;
      if (!Number.isFinite(ms) || ms > 30000) throw new Error("Jev requested a long retry delay; resume this run later");
      await (this.options.sleep ?? delay)(ms);
    }
    throw new Error("Jev retries exhausted");
  }
}
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
export function isPositive(label: Label) { return ["close-wording", "substantial-paraphrase", "directly-supported"].includes(label); }
