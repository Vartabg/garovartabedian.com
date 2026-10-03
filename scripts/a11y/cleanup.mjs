/**
 * Settle browser teardown with bounded retries.
 *
 * Chrome teardown can race a browser exiting on its own — a kill can reject
 * for a process that is already gone by the time the error surfaces. Each
 * `attempt` resolves with the list of component failure reasons (empty means
 * clean); `onFailures` reports every failure so logs name the real culprit
 * rather than an opaque aggregate. A settled teardown passes the retry; a
 * genuinely wedged browser fails every attempt and stays a run failure, so
 * the "no leaked Chrome" invariant is preserved.
 *
 * @param {() => Promise<unknown[]>} attempt resolves with failure reasons.
 * @param {{ retries?: number, onFailures?: (failures: unknown[], willRetry: boolean) => void }} [options]
 * @returns {Promise<unknown[]>} the final failure list; empty means clean.
 */
export async function settleBrowserCleanup(attempt, { retries = 1, onFailures } = {}) {
  if (typeof attempt !== "function") throw new Error("Cleanup attempt must be a function");
  if (!Number.isInteger(retries) || retries < 0) {
    throw new Error("Cleanup retries must be a non-negative integer");
  }
  for (let attemptNumber = 0; ; attemptNumber += 1) {
    const failures = await attempt();
    if (!Array.isArray(failures)) throw new Error("Cleanup attempt must resolve to a failure list");
    if (!failures.length) return [];
    const willRetry = attemptNumber < retries;
    onFailures?.(failures, willRetry);
    if (!willRetry) return failures;
  }
}