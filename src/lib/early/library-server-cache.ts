const registryKey = Symbol.for("garovartabedian.library-server-promises");

type CacheResource = "catalog" | "search";
type PromiseStore = Map<string, Promise<unknown>>;

export type LibraryServerCacheOptions = {
  production: boolean;
  directory: string;
  schema: string;
  /** Isolated hosts make the same cross-module behavior testable without globals. */
  host?: object;
};

/**
 * Turbopack gives route handlers and RSC separate module instances. Share their
 * production promises in this Node process; retain module-local state in dev.
 */
export function createLibraryServerCache({
  production,
  directory,
  schema,
  host = globalThis,
}: LibraryServerCacheOptions) {
  let store: PromiseStore;
  if (production) {
    const target = host as { [registryKey]?: PromiseStore };
    if (!target[registryKey]) {
      Object.defineProperty(target, registryKey, { value: new Map<string, Promise<unknown>>() });
    }
    store = target[registryKey]!;
  } else {
    store = new Map();
  }

  return {
    get<T>(resource: CacheResource, loader: () => Promise<T>): Promise<T> {
      const key = JSON.stringify([directory, schema, resource]);
      const existing = store.get(key);
      if (existing) return existing as Promise<T>;
      // Schedule after registration, so synchronous throws and concurrent
      // consumers follow the same single-flight and retry behavior.
      const pending = Promise.resolve().then(loader);
      store.set(key, pending);
      void pending.catch(() => {
        if (store.get(key) === pending) store.delete(key);
      });
      return pending;
    },
  };
}
