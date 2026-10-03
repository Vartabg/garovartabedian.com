import { NextResponse, type NextRequest } from "next/server";
import { CHRISTIANITY_ESSAY_PATH, EXCERPT_FRAME_ORIGIN } from "./src/lib/site/excerpt-video";

/**
 * Per-request security headers.
 * - Generates a CSP nonce and x-request-id for every document request.
 * - Overrides Content-Security-Policy with a strict nonce-based value
 *   (removes 'unsafe-inline', adds 'nonce-{x}' + 'strict-dynamic').
 * - next.config.ts fallback CSP remains for non-matched routes.
 */
function buildNonceCsp(nonce: string, isProd: boolean, allowExcerptVideo: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval' 'strict-dynamic'${isProd ? "" : " 'unsafe-eval'"}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' https://tiles.mapterhorn.com https://tiles.openfreemap.org${isProd ? "" : " ws: wss:"}`,
    "worker-src 'self' blob:",
    "child-src blob:",
    "frame-src https://eye-code-visualizer.vercel.app https://www.atxbro.com" + (allowExcerptVideo ? ` ${EXCERPT_FRAME_ORIGIN}` : ""),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const rawNonce = crypto.randomUUID();
  // Edge runtime has no Buffer; btoa is available. Fallback to raw hex if needed.
  let nonce: string;
  try {
    nonce = btoa(rawNonce);
  } catch {
    nonce = rawNonce.replace(/-/g, "");
  }
  const requestId = crypto.randomUUID();
  const isProd = process.env.NODE_ENV === "production";
  const allowExcerptVideo = request.nextUrl.pathname === CHRISTIANITY_ESSAY_PATH;
  const csp = buildNonceCsp(nonce, isProd, allowExcerptVideo);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-request-id", requestId);
  // Preserve crossOriginIsolated even for middleware-matched requests
  // (next.config headers also set these, but middleware response is authoritative)
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Embedder-Policy", allowExcerptVideo ? "unsafe-none" : "credentialless");

  return response;
}

export const config = {
  // Match all routes except static assets and image/video files.
  // /ort/* and /models/* are handled by next.config headers (CORP + immutable cache);
  // they don't need a per-request nonce, so excluding them here reduces middleware overhead.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|wasm|mjs)$).*)",
  ],
};
