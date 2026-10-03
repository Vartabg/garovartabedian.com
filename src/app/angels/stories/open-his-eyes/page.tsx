import { ReadingTools } from "../../../_components/reading/ReadingSurface";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import kings from "../../../../../public/scriptures/text/web/2KI.json";
import { ChapterNavigation, Revelation } from "./StoryControls";
import "../../../styles/angels-story.css";

const SOURCE = "/scriptures/protestant/2KI/6?t=web#v14";
const verses = kings.chapters[5].slice(13, 17);

export const metadata: Metadata = {
  title: { absolute: "Open his eyes — A story at Dothan" },
  description:
    "A surrounded city. A frightened servant. A prayer that changes what he sees. Enter an illustrated story from 2 Kings 6:14–17.",
  alternates: { canonical: "/angels/stories/open-his-eyes" },
  openGraph: {
    title: "Open his eyes — A story at Dothan",
    description: "One mountain. Two ways of seeing. An illustrated story from 2 Kings 6:14–17.",
    url: "/angels/stories/open-his-eyes",
    type: "article",
    images: [{ url: "/angels/stories/dothan-unseen.jpg", width: 1672, height: 941, alt: "An interpretive illustration of Dothan surrounded by an army before dawn" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Open his eyes — A story at Dothan",
    description: "An illustrated story from 2 Kings 6:14–17.",
    images: ["/angels/stories/dothan-unseen.jpg"],
  },
};

function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg className={down ? "dothan-arrow dothan-arrow--down" : "dothan-arrow"} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function ChapterHeading({ number, children }: { number: string; children: React.ReactNode }) {
  return <h2 className="dothan-chapter-heading"><span aria-hidden="true">{number}</span>{children}</h2>;
}

export default function OpenHisEyesPage() {
  return (
    <article data-reading-surface data-reading-mode="read" className="dothan-story" aria-labelledby="dothan-title">
      <header className="dothan-cover" id="story-top">
        <div className="dothan-cover-topline">
          <Link href="/angels">Angels &amp; Demons <span aria-hidden="true">/</span> Visual stories</Link>
          <span>Story 001</span>
        </div>
        <div className="dothan-cover-stage">
          <Image className="dothan-cover-art" src="/angels/stories/dothan-night-arrival.jpg" alt="Interpretive illustration of an army approaching the city of Dothan by night." width={1536} height={1024} sizes="100vw" priority />
          <div className="dothan-cover-shade" aria-hidden="true" />
          <div className="dothan-cover-copy">
            <p className="dothan-eyebrow">Dothan · 2 Kings 6:14–17</p>
            <h1 id="dothan-title">Open{" "}<br /><em>his eyes.</em></h1>
            <p className="dothan-cover-intro">A surrounded city. A frightened servant.<br />A prayer that changes what he sees.</p>
            <a className="dothan-begin" href="#surrounded">Begin the story <Arrow down /></a>
          </div>
        </div>
        <div className="dothan-cover-bottom">
          <span>Five moments · Your pace</span>
          <span>Interpretive illustration</span>
        </div>
      </header>

      <ReadingTools />
      <ChapterNavigation />

      <section className="dothan-chapter dothan-surrounded" id="surrounded" aria-labelledby="surrounded-title" data-story-chapter>
        <div className="dothan-chapter-intro dothan-inset">
          <div>
            <ChapterHeading number="01">Surrounded</ChapterHeading>
            <p className="dothan-display" id="surrounded-title">They came<br /><em>by night.</em></p>
          </div>
          <div className="dothan-prose">
            <p>The king of Syria sends an army to Dothan, where Elisha is staying. Horses. Chariots. A city encircled before morning.</p>
            <blockquote><p>“They came by night and surrounded the city.”</p><cite>2 Kings 6:14 · WEB</cite></blockquote>
          </div>
        </div>
        <figure className="dothan-landscape dothan-inset">
          <div className="dothan-landscape-image">
            <Image src="/angels/stories/dothan-encircled.jpg" alt="Interpretive illustration of Dothan encircled by an army with horses and chariots, beneath the surrounding mountains." width={1536} height={1024} sizes="(max-width: 700px) 100vw, 92vw" />
            <span className="dothan-frame-corner dothan-frame-corner--tl" aria-hidden="true" />
            <span className="dothan-frame-corner dothan-frame-corner--br" aria-hidden="true" />
          </div>
          <figcaption><span>The city encircled</span><span>2 Kings 6:14–15 · Interpretive illustration</span></figcaption>
        </figure>
      </section>

      <section className="dothan-chapter dothan-afraid dothan-inset" id="afraid" aria-labelledby="afraid-title" data-story-chapter>
        <figure className="dothan-afraid-detail">
          <Image src="/angels/stories/dothan-servant-afraid.jpg" alt="Interpretive portrait of Elisha’s young servant looking toward the surrounding army in fear." width={1024} height={1536} sizes="(max-width: 700px) 100vw, 42vw" />
          <figcaption>The servant · Interpretive illustration</figcaption>
        </figure>
        <div className="dothan-afraid-copy">
          <ChapterHeading number="02">Afraid</ChapterHeading>
          <p className="dothan-prose">Elisha’s servant rises early and goes outside. He sees the army. He has a question.</p>
          <blockquote className="dothan-question"><p id="afraid-title">“Alas, my master!<br /><em>What shall we do?”</em></p><cite>2 Kings 6:15 · WEB</cite></blockquote>
          <div className="dothan-answer">
            <p className="dothan-eyebrow">Elisha answers</p>
            <blockquote><p>“Don’t be afraid, for those who are with us are more than those who are with them.”</p><cite>2 Kings 6:16 · WEB</cite></blockquote>
          </div>
        </div>
      </section>

      <section className="dothan-chapter dothan-prayer dothan-inset" id="the-prayer" aria-labelledby="prayer-title" data-story-chapter>
        <ChapterHeading number="03">The prayer</ChapterHeading>
        <figure className="dothan-prayer-art">
          <Image src="/angels/stories/dothan-prayer.jpg" alt="Interpretive illustration of Elisha praying beside his servant before the young man’s eyes are opened." width={1536} height={1024} sizes="(max-width: 700px) 100vw, 54vw" />
          <figcaption>The prayer for sight · Interpretive illustration</figcaption>
        </figure>
        <div className="dothan-prayer-copy">
          <p className="dothan-prayer-preface">Then Elisha prays.</p>
          <blockquote className="dothan-prayer-words"><p id="prayer-title">“Yahweh, please<br /><em>open his eyes,</em><br />that he may see.”</p><cite>2 Kings 6:17 · WEB</cite></blockquote>
          <p className="dothan-prayer-note">The prayer is for sight.</p>
          <a href="#eyes-opened" className="dothan-quiet-link">Look again <Arrow down /></a>
        </div>
      </section>

      <section className="dothan-chapter dothan-opened" id="eyes-opened" aria-labelledby="opened-title" data-story-chapter>
        <div className="dothan-inset dothan-opened-heading">
          <ChapterHeading number="04">Eyes opened</ChapterHeading>
          <p className="dothan-display" id="opened-title">The same mountain.<br /><em>Another sight.</em></p>
          <p className="dothan-prose">Stay with this landscape. See what the servant sees next.</p>
        </div>
        <Revelation />
        <div className="dothan-opened-reading dothan-inset">
          <span className="dothan-eyebrow">The text says</span>
          <blockquote><p>“Yahweh opened the young man’s eyes, and he saw; and behold, the mountain was full of horses and chariots of fire around Elisha.”</p><cite>2 Kings 6:17 · WEB</cite></blockquote>
        </div>
      </section>

      <section className="dothan-chapter dothan-reflection dothan-inset" id="reflection" aria-labelledby="reflection-title" data-story-chapter>
        <div className="dothan-reflection-heading">
          <div><ChapterHeading number="05">Reflection</ChapterHeading><p className="dothan-display" id="reflection-title">What changed<br /><em>was his seeing.</em></p></div>
          <p className="dothan-prose">The army is still there. The mountain is the same. The servant’s first view was real, but it was not all there was to see.</p>
        </div>
        <figure className="dothan-assurance-art">
          <Image src="/angels/stories/dothan-assurance.jpg" alt="Interpretive illustration of Elisha and his servant standing calmly together in the first light after the revelation." width={1536} height={1024} sizes="(max-width: 700px) 100vw, 92vw" />
          <figcaption>After his eyes were opened · Interpretive illustration</figcaption>
        </figure>
        <p className="dothan-reflection-question">What did the first view leave out?</p>
        <div className="dothan-source-note">
          <p className="dothan-eyebrow">The story &amp; the illustration</p>
          <p>This is an interpretive illustration of 2 Kings 6:14–17. The text describes horses and chariots of fire; it does not assign them an angelic rank. The landscape, clothing, and appearance of the fiery host are artistic choices.</p>
          <Link href={SOURCE} className="dothan-text-link">Read 2 Kings 6 in context <Arrow /></Link>
        </div>
        <details className="dothan-passage">
          <summary><span>Read the passage</span><span className="dothan-passage-ref">2 Kings 6:14–17 · WEB</span><span className="dothan-disclosure-mark" aria-hidden="true" /></summary>
          <div className="dothan-passage-text">
            <p className="dothan-passage-translation">World English Bible (WEB)</p>
            {verses.map((verse, index) => <p key={index}><span className="dothan-verse-number" aria-label={`Verse ${index + 14}`}>{index + 14}</span>{verse}</p>)}
            <Link href={SOURCE} className="dothan-text-link">Open the full chapter <Arrow /></Link>
          </div>
        </details>
      </section>

      <footer className="dothan-ending dothan-inset">
        <p className="dothan-eyebrow">Beyond Dothan</p>
        <p className="dothan-ending-title">There is more<br /><em>to encounter.</em></p>
        <nav aria-label="Continue exploring">
          <Link href="/angels/stories"><span>Explore the visual stories</span><Arrow /></Link>
          <Link href="/angels"><span>Explore Angels &amp; Demons</span><Arrow /></Link>
        </nav>
        <a className="dothan-back-top" href="#story-top">Return to the beginning <span aria-hidden="true">↑</span></a>
      </footer>
    </article>
  );
}
