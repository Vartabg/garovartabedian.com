import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { FindError, getFindStore } from "./store";
import { MODEL } from "../../../scripts/research/types";
import { evaluationRubric } from "./evaluation";
import { resolvePublicSource } from "./sources";

const COOKIE = "find_guest";
function config() {
  const origin = process.env.FIND_PUBLIC_ORIGIN || (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  const secret = process.env.FIND_SESSION_SECRET;
  if (
    process.env.FIND_PUBLIC_ENABLED !== "1" ||
    !origin ||
    !secret ||
    secret.length < 32 ||
    !process.env.FIND_DATABASE_URL ||
    !process.env.TYPESAFE_API_KEY
  )
    throw new FindError(
      "Relevance checks are not enabled. Search remains available.",
      503,
    );
  const url = new URL(origin);
  if (
    url.origin !== origin ||
    (url.protocol !== "https:" &&
      !(
        process.env.NODE_ENV !== "production" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      ))
  )
    throw new FindError("Assessment origin is not configured.", 503);
  return { origin, secret, secure: url.protocol === "https:" };
}
const mac = (value: string, secret: string) =>
  createHmac("sha256", secret).update(value).digest("hex");
const equal = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export function identity(request: Request, required = true) {
  const cfg = config();
  if (new URL(request.url).origin !== cfg.origin)
    throw new FindError("Unrecognized assessment origin.", 403);
  if (
    ["POST", "DELETE"].includes(request.method) &&
    request.headers.get("origin") !== cfg.origin
  )
    throw new FindError("Cross-origin assessment request refused.", 403);
  const raw =
    request.headers
      .get("cookie")
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(COOKIE + "="))
      ?.slice(COOKIE.length + 1) ?? "";
  const [id, expires, signature] = raw.split(".");
  const valid =
    /^[a-f0-9-]{36}$/.test(id ?? "") &&
    /^\d{10}$/.test(expires ?? "") &&
    Number(expires) * 1000 > Date.now() &&
    Number(expires) * 1000 <= Date.now() + 31 * 86400000 &&
    equal(signature ?? "", mac(`${id}.${expires}`, cfg.secret));
  if (!valid && required)
    throw new FindError("Start a new assessment session.", 401);
  const guest = valid ? id : randomUUID(),
    until = valid
      ? expires
      : String(Math.floor(Date.now() / 1000) + 30 * 86400);
  const token = `${guest}.${until}.${mac(`${guest}.${until}`, cfg.secret)}`;
  // Vercel owns this header. Do not trust an arbitrary X-Forwarded-For chain.
  const address =
    process.env.VERCEL === "1"
      ? request.headers.get("x-vercel-forwarded-for")?.trim()
      : "127.0.0.1";
  if (!address || !isIP(address))
    throw new FindError("Visitor network could not be verified.", 503);
  // Group IPv6 by /64 so rotating interface addresses does not reset quotas.
  const network = address.includes(":")
    ? new URL(`http://[${address}]`).hostname
        .slice(1, -1)
        .split("::")
        .reduce<string[]>(
          (parts, part, i) =>
            i === 0
              ? part.split(":").filter(Boolean)
              : [
                  ...parts,
                  ...Array(
                    8 - parts.length - part.split(":").filter(Boolean).length,
                  ).fill("0"),
                  ...part.split(":").filter(Boolean),
                ],
          [],
        )
        .slice(0, 4)
        .join(":")
    : address;
  return {
    owner: mac(`guest:${guest}`, cfg.secret),
    network: mac(`network:${network}`, cfg.secret),
    cookie: `${COOKIE}=${token}; Path=/api/find; HttpOnly; SameSite=Strict; Max-Age=${30 * 86400}${cfg.secure ? "; Secure" : ""}`,
  };
}
export function json(
  value: unknown,
  status = 200,
  extra: Record<string, string> = {},
) {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie", ...extra },
  });
}
export function failure(error: unknown) {
  return json(
    {
      error:
        error instanceof FindError
          ? error.message
          : "Assessment service unavailable. Search remains available.",
    },
    error instanceof FindError ? error.status : 503,
  );
}
export async function submit(request: Request) {
  const visitor = identity(request);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new FindError("Use a JSON assessment request.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new FindError("Missing request.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const p = await reader.read();
    if (p.done) break;
    bytes += p.value.length;
    if (bytes > 12000) {
      await reader.cancel();
      throw new FindError("Request exceeds the public limit.", 413);
    }
    chunks.push(p.value);
  }
  let data: { query?: unknown; sources?: unknown; anchor?: unknown };
  try {
    data = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw new FindError("Invalid JSON request.");
  }
  if (
    typeof data?.query !== "string" ||
    !data.query.trim() ||
    data.query.length > 500 ||
    !Array.isArray(data.sources) ||
    !data.sources.length ||
    data.sources.length + (data.anchor === undefined ? 0 : 1) > 20
  )
    throw new FindError("Supply a question and 1–20 hosted passages.");
  let passages, anchor;
  try {
    passages = data.sources.map((s) => resolvePublicSource(s));
    if (data.anchor !== undefined) anchor = resolvePublicSource(data.anchor);
  } catch {
    throw new FindError(
      "A selected source is unavailable or exceeds the context limit.",
    );
  }
  if (
    new Set([...passages, ...(anchor ? [anchor] : [])].map((p) => JSON.stringify(p.source))).size !==
    passages.length + (anchor ? 1 : 0)
  )
    throw new FindError("Duplicate passages are not allowed.");
  return getFindStore().submit(visitor.owner, visitor.network, {
    query: data.query.trim(),
    passages,
    ...(anchor ? { anchor } : {}),
    model: MODEL,
    rubric: evaluationRubric(anchor),
  });
}
