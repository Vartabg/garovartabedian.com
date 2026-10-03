import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { angelStories } from "../../../lib/angel-stories";
import { StoryShell } from "./StoryFrame";
import "./collection.css";

export const metadata: Metadata = {
  title: "Visual stories",
  description: "Enter the fear at Dothan, the promise at Bethel, and the night Peter walked free. Three illustrated stories, unfolding at your pace.",
  alternates: { canonical: "/angels/stories" },
  openGraph: {
    title: "Visual stories — Angels & Demons",
    description: "Three moments in scripture. Three ways to step inside the story.",
    url: "/angels/stories",
    images: [{ url: "/angels/stories/dothan-unseen.jpg", width: 1672, height: 941, alt: "Dothan and the mountain, seen from a rocky overlook" }],
  },
  twitter: { card: "summary_large_image", title: "Visual stories — Angels & Demons", images: ["/angels/stories/dothan-unseen.jpg"] },
};

export default function VisualStoriesPage() {
  return (
    <StoryShell className="story-collection" titleId="story-collection-title">
      <header className="story-collection-header">
        <Link href="/angels">Angels &amp; Demons <span aria-hidden="true">/</span></Link>
        <p className="story-collection-kicker">A place inside the passage</p>
        <h1 id="story-collection-title">Visual <em>stories.</em></h1>
        <p className="story-collection-intro">Enter a moment in the story. Let the scene unfold at your pace.</p>
      </header>
      <div className="story-collection-list">
        {angelStories.map((story, index) => (
          <Link className={`story-collection-story story-collection-story--${story.tone}`} href={`/angels/stories/${story.slug}`} key={story.slug}>
            <div className="story-collection-art">
              <Image src={story.image} alt={story.alt} fill sizes="(max-width: 700px) 100vw, 65vw" priority={index === 0} />
              <span className="story-collection-number" aria-hidden="true">{story.number}</span>
              <span className="story-collection-art-note">Interpretive illustration</span>
            </div>
            <div className="story-collection-copy">
              <p className="story-collection-reference">{story.place} <span aria-hidden="true">·</span> {story.reference}</p>
              <h2>{story.title}<span>.</span></h2>
              <p className="story-collection-invitation">{story.invitation}</p>
              <p className="story-collection-movement">{story.movement}</p>
              <span className="story-collection-enter">Enter the story <span aria-hidden="true">↗</span></span>
            </div>
          </Link>
        ))}
      </div>
      <footer className="story-collection-footer">
        <p>Each story begins with a passage. The paintings and movement are an interpretation; the words remain close at hand.</p>
        <Link href="/angels">Explore Angels &amp; Demons <span aria-hidden="true">↗</span></Link>
      </footer>
    </StoryShell>
  );
}
