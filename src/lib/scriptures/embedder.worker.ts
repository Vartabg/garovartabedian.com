/// <reference lib="webworker" />

/**
 * Query embedding, off the main thread.
 *
 * The model is ~23 MB of WASM-backed inference. Run inline, it froze the tab
 * for the length of the download and again for every query — on a phone, long
 * enough that the page looked broken. Everything here is the same work that
 * used to happen in the component; the only change is which thread it blocks.
 *
 * Requests run one at a time through a cancellable queue: a caller that goes
 * away sends {cancel:id}, its queued inference is skipped, cancellation that
 * lands while the shared model is still loading skips the abandoned inference
 * when loading finishes, and cancellation of already-running WASM work
 * suppresses the result instead of interrupting it. Model-download progress
 * goes only to requests that are still live.
 *
 * Self-hosted assets only: the model lives under /models/ and the onnxruntime
 * WASM under /ort/, so the site's strict CSP needs no third-party origin.
 *
 * The message handler is built by an exported factory with an injectable
 * extractor loader, so tests can drive the worker's cancellation windows
 * (including cancellation during model initialization) without the real model.
 */

import {
  SEMANTIC_MODEL_PATH,
  SEMANTIC_MODEL_ID,
  SEMANTIC_WASM_PATH,
} from "./semantic-model";
import { createCancelQueue } from "./cancel-queue";

export type EmbedRequest = { id: number; texts: string[] };
export type CancelRequest = { cancel: number };
export type WorkerResponse =
  | { id: number; ok: true; data: Float32Array }
  | { id: number; ok: false; error: string }
  | { id: number; progress: string };

export type Extractor = (
  texts: string[],
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: Float32Array; dispose?: () => void }>;

/** The slice of the worker global this module actually uses. */
export type EmbedWorkerScope = {
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
};

/** Loads the self-hosted pipeline once; download progress goes to live callers only. */
function createModelLoader(
  scope: EmbedWorkerScope,
  queue: { live(): number[] },
): () => Promise<Extractor> {
  return async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    env.localModelPath = SEMANTIC_MODEL_PATH;
    if (env.backends?.onnx?.wasm) {
      env.backends.onnx.wasm.wasmPaths = SEMANTIC_WASM_PATH;
    }
    return (await pipeline("feature-extraction", SEMANTIC_MODEL_ID, {
      dtype: "q8",
      progress_callback: (p: { status?: string; progress?: number }) => {
        if (p.status === "progress" && typeof p.progress === "number") {
          const status = `Downloading model — ${Math.round(p.progress)}%`;
          // Scoped to each live request — canceled callers get nothing.
          for (const id of queue.live()) {
            scope.postMessage({ id, progress: status } satisfies WorkerResponse);
          }
        }
      },
    })) as unknown as Extractor;
  };
}

/**
 * Builds the worker's message handler. `loadExtractor` is injectable for
 * tests; the real worker uses the self-hosted model loader above.
 */
export function createEmbedMessageHandler(
  scope: EmbedWorkerScope,
  loadExtractor?: () => Promise<Extractor>,
): (message: EmbedRequest | CancelRequest) => void {
  const queue = createCancelQueue();
  let extractorPromise: Promise<Extractor> | null = null;

  function getExtractor(): Promise<Extractor> {
    extractorPromise ??= (loadExtractor ?? createModelLoader(scope, queue))().catch((error) => {
      // Retry on init failure: the next request tries the pipeline again.
      extractorPromise = null;
      throw error;
    });
    return extractorPromise;
  }

  return (message: EmbedRequest | CancelRequest) => {
    if (typeof (message as CancelRequest).cancel === "number") {
      queue.cancel((message as CancelRequest).cancel);
      return;
    }
    const { id, texts } = message as EmbedRequest;
    queue.enqueue(id, async (isCanceled) => {
      try {
        const extract = await getExtractor();
        // Canceled while the shared model was still loading: the download was
        // never ours to stop, but the abandoned inference must not start.
        if (isCanceled()) return;
        const out = await extract(texts, { pooling: "mean", normalize: true });
        const data = Float32Array.from(out.data);
        out.dispose?.();
        // The caller went away mid-inference: suppress the result. The buffer
        // is simply garbage-collected instead of transferred.
        if (isCanceled()) return;
        // Transferred, not copied — the vector is not needed here afterwards.
        scope.postMessage({ id, ok: true, data } satisfies WorkerResponse, [data.buffer]);
      } catch (error) {
        if (isCanceled()) return;
        scope.postMessage({
          id,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        } satisfies WorkerResponse);
      }
    });
  };
}

// Wire up only inside a real worker; importing this module under Node (tests)
// must have no side effects.
if (typeof self !== "undefined" && typeof self.postMessage === "function") {
  const scope = self as unknown as DedicatedWorkerGlobalScope;
  const handleMessage = createEmbedMessageHandler(scope);
  scope.addEventListener("message", (event: MessageEvent<EmbedRequest | CancelRequest>) => {
    handleMessage(event.data);
  });
}
