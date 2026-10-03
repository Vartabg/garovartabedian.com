export class StaticJsonError extends Error {
  constructor(public status: number, url: string) { super(`${url}: ${status}`); }
}

const cache = new Map<string, Promise<unknown>>();

function staticPath(basePath: string, path: string): string {
  return `${basePath.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function loadStaticJson<T>(basePath: string, path: string): Promise<T> {
  const url = staticPath(basePath, path);
  let hit = cache.get(url);
  if (!hit) {
    hit = fetch(url)
      .then((res) => {
        if (!res.ok) throw new StaticJsonError(res.status, url);
        return res.json() as Promise<T>;
      })
      .catch((error) => {
        cache.delete(url);
        throw error;
      });
    cache.set(url, hit);
  }
  return hit as Promise<T>;
}
