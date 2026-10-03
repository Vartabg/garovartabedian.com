export const CHAPTER_CACHE = "scripture-reader-chapters-v1";
const PREFIX = "/scripture-reader/chapters/";
const PREFS = "scripture-reader-preferences-v1";

function validChapter(value) {
  return value?.version === 1 && typeof value.bookName === "string" &&
    typeof value.translationName === "string" && typeof value.license === "string" &&
    typeof value.sourcePath === "string" && /^\/scriptures\/[a-z-]+\/[A-Z0-9]+\/\d+\?t=[a-z]+$/.test(value.sourcePath) &&
    Number.isInteger(value.chapter) && value.chapter > 0 &&
    Array.isArray(value.verses) && value.verses.length > 0 && value.verses.every((verse) => typeof verse === "string");
}

export async function readChapters() {
  const cache = await caches.open(CHAPTER_CACHE);
  const entries = [];
  let unreadable = 0;
  for (const request of await cache.keys()) {
    const key = new URL(request.url).pathname;
    if (!key.startsWith(PREFIX)) continue;
    try {
      const response = await cache.match(request);
      const value = await response.json();
      if (!validChapter(value)) throw new Error("Invalid saved chapter");
      entries.push({ key, ...value });
    } catch { unreadable++; }
  }
  entries.sort((a, b) => a.bookName.localeCompare(b.bookName) || a.chapter - b.chapter || a.translationName.localeCompare(b.translationName));
  return { entries, unreadable };
}

export async function removeChapter(key) {
  const cache = await caches.open(CHAPTER_CACHE);
  if (!key.startsWith(PREFIX) || !await cache.delete(key)) throw new Error("The saved chapter could not be removed");
}

export function readPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(PREFS) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch { return {}; }
}

export function savePreferences(value) {
  try { localStorage.setItem(PREFS, JSON.stringify(value)); } catch { /* Reading remains available when preference storage is blocked. */ }
}
