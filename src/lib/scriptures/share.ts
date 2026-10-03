/**
 * Social-smart sharing for selected verses: reference ranges, formatted copy
 * text, and clipboard / Web Share helpers. Pure formatting lives here so it
 * stays unit-testable outside the reader.
 */

export type ShareVerse = { n: number; text: string };

/** [1,2,3,5,7,8] → "1–3, 5, 7–8" */
export function verseRanges(nums: number[]): string {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  if (sorted.length === 0) return "";
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i];
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = n;
    prev = n;
  }
  parts.push(start === prev ? `${start}` : `${start}–${prev}`);
  return parts.join(", ");
}

/** "John 3:16–18" / "John 3:16, 20" */
export function formatReference(
  bookName: string,
  chapter: number,
  nums: number[],
): string {
  return `${bookName} ${chapter}:${verseRanges(nums)}`;
}

/**
 * Paste-ready block for social platforms:
 *
 *   John 3:16–17 (WEB)
 *
 *   16 For God so loved the world…
 *   17 For God didn't send his Son…
 *
 *   https://…#v16
 */
export function formatShareText(opts: {
  bookName: string;
  chapter: number;
  verses: ShareVerse[];
  /** Short version label — "WEB", "KJV". */
  transLabel: string;
  url?: string;
}): string {
  const sorted = [...opts.verses]
    .filter((v) => v.text.trim())
    .sort((a, b) => a.n - b.n);
  const ref = formatReference(opts.bookName, opts.chapter, sorted.map((v) => v.n));
  const body = sorted.map((v) => `${v.n} ${v.text.trim()}`).join("\n");
  const lines = [`${ref} (${opts.transLabel})`, "", body];
  if (opts.url) lines.push("", opts.url);
  return lines.join("\n");
}

/** Clipboard with a legacy fallback. Resolves false when nothing worked. */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through */
    }
  }
  if (typeof document !== "undefined") {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Share via the native sheet when the platform offers it (most phones),
 * otherwise copy to the clipboard. A dismissed share sheet reports "failed"
 * so the UI stays quiet instead of claiming a copy happened.
 */
export async function shareText(payload: {
  title: string;
  text: string;
  url?: string;
}): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (error) {
      if ((error as Error).name === "AbortError") return "failed";
      /* sheet unavailable for this payload — fall through to copy */
    }
  }
  return (await copyText(payload.text)) ? "copied" : "failed";
}
