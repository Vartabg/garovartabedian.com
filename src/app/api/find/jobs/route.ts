import { submit, json, failure } from "@/lib/find-server/http";
import { scheduleFind } from "@/lib/find-server/queue";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: Request) {
  try {
    const job = await submit(request);
    try {
      await scheduleFind(job.id);
    } catch {
      return json(
        {
          ...job,
          error:
            "Assessment saved, but dispatch failed. Retry this same search to resume.",
        },
        503,
      );
    }
    return json(job, 202);
  } catch (e) {
    return failure(e);
  }
}
