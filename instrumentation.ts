export async function register() {
  // Startup hook — runs once when the Next.js server starts.
  // Useful for initializing telemetry, warm caches, or logging deployment context.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[instrumentation] register: nodejs runtime initialized");
  }
}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  const requestId = request.headers["x-request-id"] ?? request.headers["x-nonce"] ?? "unknown";
  console.error(
    JSON.stringify({
      level: "error",
      hook: "onRequestError",
      requestId,
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : String(err),
      timestamp: new Date().toISOString(),
    }),
  );
}
