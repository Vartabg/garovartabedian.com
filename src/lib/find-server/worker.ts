import { validateFindReply } from "./evaluation";
import { isDeepStrictEqual } from "node:util";
import { resolvePublicSource } from "./sources";
import { type FindStore, requestForPassage } from "./store";

/** One leased attempt per invocation. Provider retries are scheduled durably,
 * rather than hidden inside fetch or a process-local retry loop. */
export async function workOne(
  store: FindStore,
  id: string,
  options: {
    key: string;
    fetcher?: typeof fetch;
    root?: string;
    timeoutMs?: number;
  },
) {
  const claim = await store.claim(id);
  if (!claim) return;
  let body: string;
  try {
    const source = claim.payload.passages[claim.position];
    const sources = [source, ...(claim.payload.anchor ? [claim.payload.anchor] : [])];
    if (sources.some(p => !isDeepStrictEqual(resolvePublicSource(p.source, options.root), p)))
      throw new Error("Source changed; start a new assessment.");
    body = JSON.stringify(requestForPassage(claim.payload, claim.position));
    if (Buffer.byteLength(body) > 24000)
      throw new Error(
        "Assessment exceeds the request limit; no text was truncated.",
      );
    if (!options.key) throw new Error("Assessment provider is not configured.");
  } catch (e) {
    await store.settle(claim, {
      error: (e as Error).message,
      definitelyUnsent: true,
    });
    return;
  }
  let response: Response;
  const signal = AbortSignal.timeout(options.timeoutMs ?? 30000);
  try {
    response = await (options.fetcher ?? fetch)(
      "https://api.typesafe.ai/v1/systemone",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.key}`,
        },
        body,
        signal,
        redirect: "error",
      },
    );
  } catch {
    await store.settle(claim, {
      error: "Provider request interrupted; cost remains reserved.",
      retryAfterMs: 1000 * 2 ** claim.attempt,
    });
    return;
  }
  if (!response.ok) {
    await response.body?.cancel();
    const transient = [408, 429, 500, 502, 503, 504, 529].includes(
      response.status,
    );
    const raw = response.headers.get("retry-after");
    const delay = raw
      ? /^\d+(\.\d+)?$/.test(raw)
        ? Number(raw) * 1000
        : Date.parse(raw) - Date.now()
      : 1000 * 2 ** claim.attempt;
    await store.settle(claim, {
      error: `Provider HTTP ${response.status}`,
      ...(transient && Number.isFinite(delay) && delay <= 30000
        ? { retryAfterMs: Math.max(500, delay) }
        : {}),
    });
    return;
  }
  let value: unknown;
  try {
    // Bound the response as well as the request. Never log provider bodies.
    const reader = response.body?.getReader();
    if (!reader) throw new Error();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.length;
      if (bytes > 65536) {
        await reader.cancel();
        throw new Error();
      }
      chunks.push(part.value);
    }
    value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    await store.settle(claim, {
      error: "Invalid or incomplete provider response; cost remains reserved.",
    });
    return;
  }
  const usage = (
    value as { usage?: { input_tokens: number; output_tokens: number } }
  )?.usage;
  try {
    const reply = validateFindReply(value, claim.payload, claim.position);
    const p = claim.payload.passages[claim.position];
    if ([p, ...(claim.payload.anchor ? [claim.payload.anchor] : [])].some(source => !isDeepStrictEqual(resolvePublicSource(source.source, options.root), source)))
      throw new Error();
    await store.settle(claim, { reply });
  } catch {
    await store.settle(claim, {
      usage,
      error:
        "Response validation failed or source changed; judgment not accepted.",
    });
  }
}
