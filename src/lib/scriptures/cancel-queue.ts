/**
 * A serialized task queue with cancellable ids, extracted from the embedder
 * worker so its ordering and cancellation rules are directly testable.
 *
 * Rules: tasks run one at a time in enqueue order; canceling a queued task
 * skips it entirely; canceling a running task cannot interrupt it (the WASM
 * call keeps going) but the task can observe the cancellation and suppress
 * its result. Canceled and finished ids are released, never stored forever.
 */

export type CancelOutcome = "queued" | "running" | "unknown";

export type QueueTask = (isCanceled: () => boolean) => Promise<void>;

export function createCancelQueue() {
  const states = new Map<number, "queued" | "running">();
  const suppressed = new Set<number>();
  let tail: Promise<void> = Promise.resolve();

  return {
    enqueue(id: number, task: QueueTask): void {
      states.set(id, "queued");
      const step = tail.then(async () => {
        if (states.get(id) !== "queued") {
          states.delete(id); // Canceled while queued: skip the work entirely.
          return;
        }
        states.set(id, "running");
        try {
          await task(() => suppressed.has(id));
        } finally {
          states.delete(id);
          suppressed.delete(id);
        }
      });
      // A throwing task must not stall the queue for everyone behind it.
      tail = step.catch(() => {});
    },
    cancel(id: number): CancelOutcome {
      const state = states.get(id);
      if (!state) return "unknown"; // Never enqueued, or already finished.
      if (state === "queued") {
        states.delete(id);
        return "queued";
      }
      suppressed.add(id);
      return "running";
    },
    /** Ids whose callers are still waiting — queued or running, not canceled. */
    live(): number[] {
      return [...states.keys()].filter((id) => !suppressed.has(id));
    },
    /** Tracked ids; returns to zero once everything settles (no leaks). */
    size(): number {
      return states.size;
    },
  };
}
