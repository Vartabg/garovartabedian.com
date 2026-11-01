import { ReadingTools } from "../../_components/reading/ReadingSurface";
import Link from "next/link";
import { angelStories, type AngelStorySlug } from "../../../lib/angel-stories";
import FromHere from "../../_components/FromHere";
import "./story-frame.css";

export function StoryShell({ children, className, titleId }: { children: React.ReactNode; className: string; titleId: string }) {
  return <article data-reading-surface data-reading-mode="read" className={`visual-story ${className}`} aria-labelledby={titleId}><ReadingTools />{children}</article>;
}

export function StorySource({ reference, chapterHref, verses, startVerse, note }: { reference: string; chapterHref: string; verses: readonly string[]; startVerse: number; note: string }) {
  return (
    <section className="visual-story-source" aria-label="The passage behind the story">
      <p className="visual-story-source-label">The passage behind the story</p>
      <p>{note}</p>
      <details>
        <summary><span>Read the passage</span><span>{reference} <span aria-hidden="true">＋</span></span></summary>
        <div className="visual-story-passage">
          <p className="visual-story-translation">World English Bible (WEB)</p>
          {verses.map((verse, index) => <p key={startVerse + index}><span className="visual-story-verse" aria-label={`Verse ${startVerse + index}`}>{startVerse + index}</span>{verse}</p>)}
          <Link href={chapterHref.replace(/(#|$)/, "?t=web$1")}>Read the full chapter <span aria-hidden="true">↗</span></Link>
        </div>
      </details>
    </section>
  );
}

/** The menu's "From here" for a visual story: its passage, the other stories, and the encounters record. */
export function StoryFromHere({ current }: { current: AngelStorySlug }) {
  const story = angelStories.find(item => item.slug === current)!;
  return <FromHere label={story.title} links={[
    { href: story.passage, label: story.reference, kind: "The passage" },
    ...angelStories.filter(item => item.slug !== current).map(item => ({ href: `/angels/stories/${item.slug}`, label: item.title, kind: "Another story" })),
    { href: "/angels/encounters", label: "The encounters", kind: "In Angels & Demons" },
  ]} />;
}

export function StoryFooter({ current }: { current: AngelStorySlug }) {
  return (
    <footer className="visual-story-footer">
      <StoryFromHere current={current} />
      <Link className="visual-story-collection-link" href="/angels/stories">All visual stories <span aria-hidden="true">↗</span></Link>
      <nav aria-label="More visual stories">
        {angelStories.filter(story => story.slug !== current).map(story => <Link key={story.slug} href={`/angels/stories/${story.slug}`}><small>{story.reference}</small><span>{story.title}<span aria-hidden="true">↗</span></span></Link>)}
      </nav>
      <Link className="visual-story-world-link" href="/angels">Return to Angels &amp; Demons</Link>
    </footer>
  );
}
