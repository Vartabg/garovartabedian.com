export type JsonCache = Map<string, Promise<unknown | undefined>>;

/**
 * Cache immutable published JSON, but evict failures so a corrected file can
 * be retried by a long-lived development server.
 */
export async function cachedJson<T>(
  cache: JsonCache,
  key: string,
  load: () => Promise<T | undefined>,
): Promise<T | undefined> {
  let hit = cache.get(key);
  if (!hit) {
    hit = load();
    cache.set(key, hit);
  }

  try {
    return (await hit) as T | undefined;
  } catch (error) {
    cache.delete(key);
    throw error;
  }
}
