import type { QueryEmbedder } from "./semantic-worker";
import { SEMANTIC_MODEL_PATH, SEMANTIC_MODEL_ID, SEMANTIC_WASM_PATH } from "./semantic-model";
import { throwIfAborted, waitForShared } from "./semantic-task";

export type InlineExtractor = (texts: string[], options: {pooling: "mean"; normalize: true}) =>
  Promise<{data: Float32Array; dispose?: () => void}>;

async function loadModel(notify: (status: string) => void): Promise<InlineExtractor> {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = SEMANTIC_MODEL_PATH;
  if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.wasmPaths = SEMANTIC_WASM_PATH;
  return await pipeline("feature-extraction", SEMANTIC_MODEL_ID, {
    dtype: "q8",
    progress_callback: (p: {status?: string; progress?: number}) => {
      if (p.status === "progress" && typeof p.progress === "number") {
        notify(`Downloading model — ${Math.round(p.progress)}%`);
      }
    },
  }) as unknown as InlineExtractor;
}

/** Lazy, serialized fallback with progress scoped to live callers. */
export function inlineEmbedder(load: typeof loadModel = loadModel): QueryEmbedder {
  const listeners = new Set<(status: string) => void>();
  let extractor: Promise<InlineExtractor> | null = null;
  let tail: Promise<unknown> = Promise.resolve();
  const initialize = () => extractor ??= load(status => {
    for (const notify of listeners) notify(status);
  }).catch(error => { extractor = null; throw error; });

  return async (texts, {signal, onProgress} = {}) => {
    throwIfAborted(signal);
    const notify = (status: string) => { if (!signal?.aborted) onProgress?.(status); };
    listeners.add(notify);
    const work = tail.then(async () => {
      throwIfAborted(signal);
      const extract = await waitForShared(initialize(), signal);
      throwIfAborted(signal);
      const output = await extract(texts, {pooling: "mean", normalize: true});
      try {
        throwIfAborted(signal);
        return Float32Array.from(output.data);
      } finally { output.dispose?.(); }
    });
    // Keep the queue occupied until actual inference settles, even when the
    // consumer stops waiting. Running WASM cannot be synchronously preempted.
    tail = work.catch(() => {});
    try { return await waitForShared(work, signal); }
    finally { listeners.delete(notify); }
  };
}
