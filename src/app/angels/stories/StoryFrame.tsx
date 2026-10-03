import { ReadingTools } from "../../_components/reading/ReadingSurface";
import Link from "next/link";
import { angelStories, type AngelStorySlug } from "../../../lib/angel-stories";
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

export function StoryFooter({ current }: { current: AngelStorySlug }) {
  return (
    <footer className="visual-story-footer">
      <Link className="visual-story-collection-link" href="/angels/stories">All visual stories <span aria-hidden="true">↗</span></Link>
      <nav aria-label="More visual stories">
        {angelStories.filter(story => story.slug !== current).map(story => <Link key={story.slug} href={`/angels/stories/${story.slug}`}><small>{story.reference}</small><span>{story.title}<span aria-hidden="true">↗</span></span></Link>)}
      </nav>
      <Link className="visual-story-world-link" href="/angels">Return to Angels &amp; Demons</Link>
    </footer>
  );
}
