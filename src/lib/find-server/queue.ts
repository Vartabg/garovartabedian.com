import { QueueClient, type VercelRegion } from "@vercel/queue";
import { getFindStore, type FindStore } from "./store";
// Vercel sets VERCEL_REGION in functions. Builds and local servers use the
// library's own default region instead of warning that none was detected.
export const queue = new QueueClient({
  region: (process.env.VERCEL_REGION || "iad1") as VercelRegion,
});
export async function scheduleFind(
  id: string,
  options: {
    store?: FindStore;
    enqueue?: (topic: string, payload: { id: string }, options: {
      retentionSeconds: number;
      idempotencyKey: string;
    }) => Promise<unknown>;
  } = {},
) {
  const store = options.store ?? getFindStore();
  const ticket = await store.dispatchDue(id);
  if (!ticket) return;
  try {
    await (options.enqueue ?? queue.send)(
      "find-assessments",
      { id },
      {
        retentionSeconds: 3600,
        idempotencyKey: `${id}:${Math.floor(Date.now() / 60000)}`,
      },
    );
  } catch (error) {
    await store.dispatchFailed(id, ticket);
    throw error;
  }
}
