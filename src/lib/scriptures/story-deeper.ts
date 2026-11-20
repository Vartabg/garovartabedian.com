import { bookName, passageHref } from "./story-text";
import { storyStops, type ScriptureStory, type StoryCite } from "./stories";
import { hasUnverifiedStudyNumbering } from "./study-passage";
import { verseStudyLinks } from "./verse-study-links";

/** One line under a told story that opens the site on the story's own passage. */
export type StoryPassageLink = {
  id: "read" | "compare" | "words";
  href: string;
  label: string;
};

/** The one verse a story quotes in full: the first cite of its stop marked `words`. */
export function storyQuotedVerse(story: ScriptureStory): StoryCite {
  const quoted = storyStops(story).filter((stop) => stop.words);
  if (quoted.length !== 1) {
    throw new Error(`${story.slug} must quote exactly one verse; it quotes ${quoted.length}`);
  }
  return quoted[0].cites[0];
}

/**
 * The passage lines for a story, in order: read the passage, compare
 * translations of the quoted verse, see the original words behind it. Books whose editions
 * the site has not verified line up (Esther, Daniel) get the first line only,
 * because the comparison shows a single edition for them.
 */
export function storyPassageLinks(story: ScriptureStory): StoryPassageLink[] {
  const name = bookName(story.book);
  // Built from the chapters the story covers, so the line names what it opens.
  // A story's `reference` may name the whole book while starting at chapter 2.
  const chapters = story.toChapter > story.fromChapter ? `${story.fromChapter}–${story.toChapter}` : `${story.fromChapter}`;
  const read: StoryPassageLink = {
    id: "read",
    href: passageHref(story.book, story.fromChapter, 1),
    label: `Read ${name} ${chapters}`,
  };
  if (hasUnverifiedStudyNumbering(story.book)) return [read];

  const { chapter, verse } = storyQuotedVerse(story);
  return [read, ...verseStudyLinks({ book: story.book, chapter, verse })];
}
