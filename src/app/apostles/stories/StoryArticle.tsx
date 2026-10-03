import { ReadingTools } from "../../_components/reading/ReadingSurface";
import Image from "next/image";
import Link from "next/link";
import john from "../../../../public/scriptures/text/web/JHN.json";
import acts from "../../../../public/scriptures/text/web/ACT.json";
import { APOSTLE_STORIES, type ApostleStory } from "@/lib/apostles/stories";
import StoryReflections from "./StoryReflections";
import "./story.css";

export default function StoryArticle({ story }: { story: ApostleStory }) {
  const chapter = (story.book === "JHN" ? john : acts).chapters[story.chapter - 1];
  const verses = chapter.slice(story.start - 1, story.end);
  const chapterHref = `/scriptures/protestant/${story.book}/${story.chapter}?t=web#v${story.start}`;
  return (
    <article data-reading-surface data-reading-mode="read" className={`as-story as-story--${story.kind}`} aria-labelledby="apostle-story-title">
      <header className="as-cover" id="story-beginning">
        <div className="as-topline"><Link href="/apostles#visual-stories">The Apostles / Visual stories</Link><span>{story.reference}</span></div>
        <div className="as-cover-copy">
          <p className="as-eyebrow">{story.eyebrow}</p>
          <h1 id="apostle-story-title">{story.title}</h1>
          <p className="as-deck">{story.description}</p>
          <a className="as-enter" href="#the-story">Enter the story <span aria-hidden="true">↓</span></a>
        </div>
        <figure className="as-cover-art">
          <Image src={story.image} alt={story.alt} width={1536} height={1024} priority sizes="(max-width: 760px) 100vw, 90vw" />
          <figcaption>{story.opening.reference}<span>Interpretive illustration</span></figcaption>
        </figure>
        <nav className="as-chapter-nav" aria-label="Within this story">
          <a href="#the-story">01 · The moment</a><a href="#the-encounter">02 · The encounter</a>
          <a href="#the-response">03 · The response</a><a href="#the-passage">Read the passage</a>
        </nav>
      </header>

      <ReadingTools />
      <section className="as-beat as-opening" id="the-story" aria-labelledby="as-opening-title">
        <p className="as-number" aria-hidden="true">01</p>
        <div><p className="as-eyebrow">{story.opening.reference}</p><h2 id="as-opening-title">{story.opening.title}</h2><p>{story.opening.text}</p></div>
      </section>

      <section className="as-encounter" id="the-encounter" aria-labelledby="as-encounter-title">
        <div className="as-beat">
          <p className="as-number" aria-hidden="true">02</p>
          <div><p className="as-eyebrow">{story.encounter.reference}</p><h2 id="as-encounter-title">{story.encounter.title}</h2><p>{story.encounter.text}</p></div>
        </div>
        <figure className="as-encounter-art">
          <Image src={story.encounterImage} alt={story.encounterAlt} width={1536} height={1024} sizes="(max-width: 760px) 100vw, 90vw" />
          <figcaption>{story.encounter.reference}<span>Interpretive illustration</span></figcaption>
        </figure>
      </section>

      <div className="as-response" id="the-response"><StoryReflections kind={story.kind} /></div>

      <section className="as-aftermath" aria-labelledby="as-after-title">
        <p className="as-eyebrow">Beyond this moment</p><h2 id="as-after-title">{story.after.title}</h2>
        <p>{story.after.text}</p><Link href={story.after.href}>{story.after.label} <span aria-hidden="true">↗</span></Link>
      </section>

      <section className="as-source" id="the-passage" aria-label="The passage behind the story">
        <h2>The words remain close.</h2>
        <p>The paintings and narrative framing are interpretation. Appearance, setting, and gestures are imagined; the passage below is the source.</p>
        <details><summary>Read the passage · {story.reference}</summary>
          <div className="as-source-verses"><p className="as-eyebrow">World English Bible (WEB)</p>
            {verses.map((verse, i) => <p key={i + story.start}><span aria-label={`Verse ${i + story.start}`} className="as-verse">{i + story.start}</span>{verse}</p>)}
            <Link href={chapterHref}>Read the full chapter <span aria-hidden="true">↗</span></Link>
          </div>
        </details>
      </section>

      <footer className="as-footer">
        <Link className="as-record-link" href={story.recordHref}>{story.kind === "pentecost" ? "Follow the evidence behind the sending" : `Meet ${story.person} beyond this story`} <span aria-hidden="true">↗</span></Link>
        <nav aria-label="More Apostles stories">{APOSTLE_STORIES.filter((s) => s.slug !== story.slug).map((s) => <Link key={s.slug} href={`/apostles/stories/${s.slug}`}><small>{s.eyebrow}</small><strong>{s.title}</strong><span>{s.reference} ↗</span></Link>)}</nav>
        <Link href="/apostles#meet-the-apostles">Meet all the apostles</Link><a href="#story-beginning">Return to the beginning ↑</a>
      </footer>
    </article>
  );
}
