import parablesJson from "../../../public/jesus/parables.json";
import { READING_PATH } from "@/lib/evidence/reading-journey";
import { earlyAllusionForChapter } from "@/lib/early/allusions-lookup";
import { APOSTLE_STORIES } from "@/lib/apostles/stories";
import { PARABLE_WALKS } from "@/lib/jesus/parable-walks";
import type { Parable } from "@/lib/jesus/types";
import { parseRef } from "@/lib/scriptures/refs";
import { SCRIPTURE_STORIES } from "@/lib/scriptures/stories";

const parables = parablesJson as Parable[];

/** One place this chapter is already taken up, outside the reader. */
export type ChapterContinuation = {
  href: string;
  label: string;
  where: string;
};

/**
 * A single continuation. A told story wins, then an apostle story, then a
 * parable, then the Isaiah 53 reading path, then the first early writing that
 * quotes the chapter. Angels already has its own record on the reader.
 */
export function chapterContinuation(book: string, chapter: number): ChapterContinuation | null {
  const story = SCRIPTURE_STORIES.find(
    (item) => item.book === book && chapter >= item.fromChapter && chapter <= item.toChapter,
  );
  if (story) {
    return { href: `/scriptures/stories/${story.slug}`, label: story.title, where: "A told story" };
  }

  const apostle = APOSTLE_STORIES.find((item) => item.book === book && item.chapter === chapter);
  if (apostle) {
    return { href: `/apostles/stories/${apostle.slug}`, label: apostle.title, where: "The apostles" };
  }

  const walk = PARABLE_WALKS.find((item) => item.stops.some((stop) => stop.book === book && stop.chapter === chapter));
  if (walk) {
    return {
      href: `/jesus/parables#parable-${walk.id}`,
      label: parables.find((item) => item.id === walk.id)?.title ?? walk.id,
      where: "A parable",
    };
  }

  for (const parable of parables) {
    for (const account of parable.accounts) {
      const parsed = parseRef(account.ref);
      if (parsed?.book === book && parsed.chapter === chapter) {
        return { href: `/jesus/parables#parable-${parable.id}`, label: parable.title, where: "A parable" };
      }
    }
  }

  if (book === "ISA" && chapter === 53) {
    return { href: READING_PATH, label: "Isaiah 53 in 1 Clement 16", where: "An early writing" };
  }

  const allusion = earlyAllusionForChapter(book, chapter);
  if (allusion) {
    return { href: allusion.href, label: allusion.textTitle, where: "An early writing" };
  }

  return null;
}
