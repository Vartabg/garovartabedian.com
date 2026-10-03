/** Worker transport and one-way recovery to inline inference after worker failure. */
import { abortError, isAbortError, onAbort } from "./cancellation";
import { throwIfAborted, waitForShared } from "./semantic-task";

export type QueryEmbedderOptions = {
  /** Cancels just this call. Never terminates the shared worker. */
  signal?: AbortSignal;
  /** Per-call progress; overrides the transport-level callback for this call. */
  onProgress?: (status: string) => void;
};

export type QueryEmbedder = (
  texts: string[],
  options?: QueryEmbedderOptions,
) => Promise<Float32Array>;

export function recoveringEmbedder(
  primaryFactory: () => Promise<QueryEmbedder>,
  fallbackFactory: () => Promise<QueryEmbedder>,
): QueryEmbedder {
  let primary: Promise<QueryEmbedder> | null = null;
  let fallback: Promise<QueryEmbedder> | null = null;
  let failed = false;
  // Late progress from a long inference must not reach a caller that already
  // canceled: wrap the per-call handler so it goes silent once aborted.
  const guardProgress = (options?: QueryEmbedderOptions): QueryEmbedderOptions | undefined => {
    const signal = options?.signal;
    const onProgress = options?.onProgress;
    if (!options || !signal || !onProgress) return options;
    return { ...options, onProgress: (status) => { if (!signal.aborted) onProgress(status); } };
  };
  return async (texts, options) => {
    const signal = options?.signal;
    const guarded = guardProgress(options);
    if (!failed) {
      try {
        // Gate before factory creation: an already-canceled consumer must not
        // start (or wait on) shared initialization at all.
        throwIfAborted(signal);
        primary ??= primaryFactory();
        // Race the shared factory per consumer: this caller settles promptly
        // on abort while the factory keeps running for everyone else.
        const embedder = await waitForShared(primary, signal);
        // Recheck: the caller may have canceled while initialization finished.
        throwIfAborted(signal);
        return await waitForShared(embedder(texts, guarded), signal);
      } catch (error) {
        // A cancellation is the caller's decision, not a worker failure: keep
        // the shared primary so one aborted call cannot poison initialization
        // or push everyone onto the fallback.
        if (isAbortError(error)) throw error;
        failed = true;
      }
    }
    try {
      // Same gate for the fallback: an aborted consumer must not initialize it.
      throwIfAborted(signal);
      fallback ??= fallbackFactory();
      const embedder = await waitForShared(fallback, signal);
      throwIfAborted(signal);
      return await waitForShared(embedder(texts, guarded), signal);
    } catch (error) {
      // Same rule for the fallback: an abort must not discard shared state.
      if (isAbortError(error)) throw error;
      fallback = null;
      throw error;
    }
  };
}

export function workerTransport(
  worker: Pick<Worker, "addEventListener" | "postMessage" | "terminate">,
  onProgress?: (status: string) => void,
  timeoutMs = 90_000,
): QueryEmbedder {
  type Pending = {
    resolve: (data: Float32Array) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
    onProgress?: (status: string) => void;
    /** Clears this call's timer and abort listener — nothing else. */
    dispose: () => void;
  };
  const pending = new Map<number, Pending>();
  let nextId = 1;
  let failure: Error | null = null;
  const fail = (error: Error) => {
    failure = error;
    try { worker.terminate(); } catch { /* Always settle callers, even if teardown fails. */ }
    for (const entry of pending.values()) { entry.dispose(); entry.reject(error); }
    pending.clear();
  };
  worker.addEventListener("message", (event: MessageEvent) => {
    const message = event.data;
    if (typeof message?.progress === "string") {
      if (typeof message.id === "number" && message.id !== 0) {
        // Scoped progress: only for that caller, and only while it is live.
        // Canceled calls are no longer pending, so they receive nothing.
        const entry = pending.get(message.id);
        if (entry) (entry.onProgress ?? onProgress)?.(message.progress);
        return;
      }
      // Legacy broadcast: progress belongs to the live callers. Each gets its
      // own handler if it supplied one, otherwise the transport-level callback;
      // dedupe so a shared handler fires once. No live calls — nobody is called.
      const handlers = new Set<(status: string) => void>();
      for (const entry of pending.values()) {
        const handler = entry.onProgress ?? onProgress;
        if (handler) handlers.add(handler);
      }
      for (const handler of handlers) handler(message.progress);
      return;
    }
    const entry = pending.get(message?.id);
    if (!entry) return;
    if (!message.ok || !(message.data instanceof Float32Array) || !message.data.every(Number.isFinite)) {
      fail(new Error(typeof message.error === "string" ? message.error : "Invalid worker response"));
      return;
    }
    entry.dispose();
    pending.delete(message.id);
    entry.resolve(message.data);
  });
  worker.addEventListener("error", () => fail(new Error("Embedder worker failed")));
  worker.addEventListener("messageerror", () => fail(new Error("Embedder worker message failed")));
  return (texts, options) => new Promise<Float32Array>((resolve, reject) => {
    if (failure) { reject(failure); return; }
    const signal = options?.signal;
    // Aborted before start: post nothing, settle immediately as AbortError.
    if (signal?.aborted) { reject(abortError()); return; }
    const id = nextId++;
    const entry: Pending = {
      resolve,
      reject,
      onProgress: options?.onProgress,
      timer: setTimeout(() => fail(new Error("Embedder worker timed out")), timeoutMs),
      dispose: () => {},
    };
    const detachAbort = onAbort(signal, () => {
      // Caller cancellation settles only this call: drop its timer and
      // listener, tell the worker to skip the queued work, and never
      // terminate — other callers keep going.
      if (!pending.has(id)) return;
      pending.delete(id);
      entry.dispose();
      try { worker.postMessage({ cancel: id }); } catch { /* Best effort; the call is already settled. */ }
      reject(abortError());
    });
    entry.dispose = () => { clearTimeout(entry.timer); detachAbort(); };
    pending.set(id, entry);
    try { worker.postMessage({ id, texts }); }
    catch (error) { fail(error instanceof Error ? error : new Error(String(error))); }
  });
}
