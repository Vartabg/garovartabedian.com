import type { Metadata } from "next";
import Link from "next/link";
import { SHELF_SITUATIONS, SHELF_STORIES, shelfCiteLabel } from "@/lib/story-shelf";
import StoryShelf, { type ShelfChoice } from "./StoryShelf";

const TITLE = "Stories";
const DESCRIPTION = "Find a Bible story by what the people in it faced.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/scriptures/stories" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/scriptures/stories",
  },
};

/** Plain props for the client list: every line and verse label is resolved here, on the server. */
const CHOICES: ShelfChoice[] = SHELF_SITUATIONS.map((situation) => ({
  id: situation.id,
  label: situation.label,
  tags: Object.fromEntries(
    Object.entries(situation.tags).map(([storyId, tag]) => [
      storyId,
      { line: tag.line, ref: shelfCiteLabel(tag.cite), quoted: tag.source.kind === "quote" },
    ]),
  ),
}));

export default function ScriptureStoriesPage() {
  return (
    <article className="storyshelf">
      <header className="storyshelf-heading">
        <h1>{TITLE}</h1>
        <Link className="textlink" href="/scriptures/stories/play">Playable stories</Link>
      </header>
      <StoryShelf stories={SHELF_STORIES} choices={CHOICES} />
      <p className="storyshelf-note">The pictures are interpretive illustrations.</p>
    </article>
  );
}
