import type { Metadata } from "next";
import Link from "next/link";
import { SCRIPTURE_STORIES, scriptureStoryPath } from "@/lib/scriptures/stories";

const TITLE = "Stories";
const DESCRIPTION =
  "Read a story that runs through many chapters, in the words of the hosted text.";

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

export default function ScriptureStoriesPage() {
  return (
    <article className="scr-story">
      <header>
        <p className="scr-story-kicker">Scriptures</p>
        <h1>{TITLE}</h1>
        <p className="scr-story-deck">{DESCRIPTION}</p>
      </header>
      <ul className="scr-story-list">
        {SCRIPTURE_STORIES.map((story) => (
          <li key={story.slug}>
            <Link href={scriptureStoryPath(story.slug)}>
              <h2>{story.title}</h2>
              <p className="scr-story-ref">{story.reference}</p>
              <p>{story.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
