import type { WordsBook } from "@/lib/jesus/types";

export type Chapter = readonly [number, [number, string][]];

export function groupWordChapters(verses: WordsBook, filter = ""): Chapter[] {
  const byChapter = new Map<number, [number, string][]>();
  const query = filter.trim().toLowerCase();
  for (const [key, text] of Object.entries(verses)) {
    if (query && !text.toLowerCase().includes(query)) continue;
    const [chapter, verse] = key.split(":").map(Number) as [number, number];
    if (!byChapter.has(chapter)) byChapter.set(chapter, []);
    byChapter.get(chapter)!.push([verse, text]);
  }
  return [...byChapter.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([chapter, chapterVerses]) => [
      chapter,
      chapterVerses.sort((a, b) => a[0] - b[0]),
    ] as const);
}
