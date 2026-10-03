import { send } from "@vercel/queue";
import { getFindStore, type FindStore } from "./store";
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
    await (options.enqueue ?? send)(
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
