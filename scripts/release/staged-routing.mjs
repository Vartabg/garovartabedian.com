/** Forward a deployment bypass only to the verified staged origin. */
export function stagedRequestHeaders(requestUrl, origin, headers, bypass) {
  let url;
  try { url = new URL(requestUrl); } catch { return null; }
  if (url.origin !== origin.origin) return null;
  return bypass ? { ...headers, "x-vercel-protection-bypass": bypass } : headers;
}

/** Never forward a bypass through a redirect, including a same-origin redirect. */
export async function routeStagedRequest(route, origin, bypass) {
  const headers = stagedRequestHeaders(route.request().url(), origin, route.request().headers(), bypass);
  if (!headers) return route.abort();
  try {
    const response = await route.fetch({ headers, maxRedirects: 0, timeout: 30_000 });
    if (response.status() >= 300 && response.status() < 400) return await route.abort();
    return await route.fulfill({ response });
  } catch {
    // Playwright errors may contain request headers; never expose the bypass in logs.
    await route.abort().catch(() => {});
  }
}
