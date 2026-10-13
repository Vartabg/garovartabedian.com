import { queue } from "@/lib/find-server/queue";
import { getFindStore } from "@/lib/find-server/store";
import { workOne } from "@/lib/find-server/worker";
export const runtime = "nodejs";
export const maxDuration = 60;
// vercel.json registers this as a private queue consumer, not a public API.
const callback = queue.handleCallback<{ id: string }>(
  async ({ id }) => {
    if (!/^[a-f0-9-]{36}$/.test(id)) return;
    if (
      process.env.FIND_PUBLIC_ENABLED !== "1" ||
      !process.env.TYPESAFE_API_KEY
    )
      throw new Error("Assessments disabled");
    const store = getFindStore();
    await store.expirePending(id);
    await Promise.all([
      workOne(store, id, { key: process.env.TYPESAFE_API_KEY }),
      workOne(store, id, { key: process.env.TYPESAFE_API_KEY }),
    ]);
    if (await store.pending(id)) throw new Error("Assessment work remains");
  },
  { visibilityTimeoutSeconds: 90, retry: () => ({ afterSeconds: 10 }) },
);
export async function POST(request: Request) {
  return callback(request);
}
