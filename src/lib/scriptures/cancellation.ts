/**
 * Tiny cancellation helpers shared by the worker transport and its recovery
 * wrapper. Keeping AbortError creation and detection in one place ensures a
 * caller's cancellation is never mistaken for a real worker failure — an
 * abort must not terminate the worker, mark the primary failed, or start
 * the fallback.
 */

export function abortError(message = "The request was canceled"): Error {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/**
 * Subscribe to a signal's abort event, handling the already-aborted case.
 * Returns an unsubscribe function that is safe to call more than once.
 */
export function onAbort(signal: AbortSignal | undefined, handler: () => void): () => void {
  if (!signal) return () => {};
  if (signal.aborted) {
    handler();
    return () => {};
  }
  signal.addEventListener("abort", handler, { once: true });
  return () => signal.removeEventListener("abort", handler);
}
