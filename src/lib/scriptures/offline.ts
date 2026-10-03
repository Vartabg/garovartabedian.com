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
  const registration = await navigator.serviceWorker.register("/scripture-sw.js", { scope: "/scripture-reader/" });
  if (registration.active?.state === "activated") return;
  const worker = registration.installing ?? registration.waiting ?? registration.active;
  if (!worker) throw new Error("Reader installation did not start");
  await new Promise<void>((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer);
      worker.removeEventListener("statechange", changed);
      if (error) reject(error); else resolve();
    };
    const changed = () => {
      if (worker.state === "activated") finish();
      if (worker.state === "redundant") finish(new Error("Reader installation failed"));
    };
    const timer = setTimeout(() => finish(new Error("Reader installation timed out")), 20_000);
    worker.addEventListener("statechange", changed);
    changed();
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
