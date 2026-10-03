import { identity, json, failure } from "@/lib/find-server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const visitor = identity(request, false);
    return json({ ready: true }, 200, { "Set-Cookie": visitor.cookie });
  } catch (e) {
    return failure(e);
  }
}
