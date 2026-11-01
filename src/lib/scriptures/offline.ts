/** Kept compatible with the independent reader's public/scripture-reader/store.js. */
export const OFFLINE_CHAPTER_CACHE = "scripture-reader-chapters-v1";
export const OFFLINE_READER_URL = "/scripture-reader/index.html";

export type OfflineChapter = {
  version: 1;
  bookId: string;
  bookName: string;
  chapter: number;
  translation: string;
  translationName: string;
  license: string;
  sourcePath: string;
  verses: string[];
  savedAt: string;
};

async function installReader() {
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let worker: ServiceWorker | null = null;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker?.removeEventListener("statechange", changed);
      if (error) reject(error); else resolve();
    };
    const changed = () => {
      if (worker?.state === "activated") finish();
      if (worker?.state === "redundant") finish(new Error("Reader installation failed"));
    };
    // Registration can stall before there is an installing worker to observe.
    const timer = setTimeout(() => finish(new Error("Reader installation timed out")), 20_000);
    void Promise.resolve().then(() => navigator.serviceWorker.register("/scripture-sw.js", { scope: "/scripture-reader/" })).then(registration => {
      if (settled) return;
      if (registration.active?.state === "activated") { finish(); return; }
      worker = registration.installing ?? registration.waiting ?? registration.active;
      if (!worker) { finish(new Error("Reader installation did not start")); return; }
      worker.addEventListener("statechange", changed);
      changed();
    }).catch(error => finish(error instanceof Error ? error : new Error("Reader installation failed")));
  });
}

export async function saveOfflineChapter(chapter: OfflineChapter) {
  if (!window.isSecureContext || !("serviceWorker" in navigator) || !("caches" in window)) {
    throw new Error("Offline storage is unavailable");
  }
  if (!/^[a-z0-9-]+$/i.test(chapter.translation) || !/^[a-z0-9]+$/i.test(chapter.bookId) ||
      !Number.isInteger(chapter.chapter) || chapter.chapter < 1 || !chapter.verses.some(Boolean)) {
    throw new Error("The chapter is not ready to save");
  }
  await installReader();
  const cache = await caches.open(OFFLINE_CHAPTER_CACHE);
  const path = `/scripture-reader/chapters/${chapter.translation}/${chapter.bookId}/${chapter.chapter}.json`;
  await cache.put(path, new Response(JSON.stringify(chapter), { headers: { "Content-Type": "application/json" } }));
  // Verify the durable write before telling the reader it is saved.
  const stored = await cache.match(path);
  if (!stored || (await stored.json()).savedAt !== chapter.savedAt) throw new Error("The saved chapter could not be verified");
  return path;
}
