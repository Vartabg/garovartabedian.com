import { abortError } from "./cancellation";

/** Cancel this consumer, without canceling a shared download or model load. */
export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortError();
}

export function waitForShared<T>(work: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return work;
  return new Promise<T>((resolve, reject) => {
    const cancel = () => reject(abortError());
    if (signal.aborted) cancel();
    else signal.addEventListener("abort", cancel, { once: true });
    // Observe both outcomes even after abort, so a shared failure never becomes
    // an unhandled rejection. The underlying work remains available to others.
    work.then(
      (value) => { signal.removeEventListener("abort", cancel); resolve(value); },
      (error: unknown) => { signal.removeEventListener("abort", cancel); reject(error); },
    );
  });
}

/** Let input and painting run; older browsers retain a task-based fallback. */
export function yieldToBrowser(): Promise<void> {
  const scheduler = (globalThis as typeof globalThis & {
    scheduler?: { yield?: () => Promise<void> };
  }).scheduler;
  return typeof scheduler?.yield === "function"
    ? scheduler.yield()
    : new Promise((resolve) => setTimeout(resolve, 0));
}
