import { searchLibrary } from "@/lib/early/library-server";
export const runtime = "nodejs";

/** Ordinary text retrieval only: no visitor identity, assessment or provider. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (query.length < 2 || query.length > 160) return Response.json({ error: "Use between 2 and 160 characters." }, { status: 400, headers });
  try {
    const result = await searchLibrary(query, "all", "", 1, Number(params.get("limit") ?? 6));
    return Response.json(result, { headers });
  } catch {
    return Response.json({ error: "The writings index could not load. Try again." }, { status: 503, headers });
  }
}
