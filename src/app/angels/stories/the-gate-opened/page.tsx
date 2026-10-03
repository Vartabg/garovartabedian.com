import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import acts from "../../../../../public/scriptures/text/web/ACT.json";
import { StoryFooter, StoryShell, StorySource } from "../StoryFrame";
import LightExperience from "./LightExperience";
import "./gate.css";

const CHAPTER = "/scriptures/protestant/ACT/12#v5";

export const metadata: Metadata = {
  title: { absolute: "The gate opened — A story in Jerusalem" },
  description: "Two chains. A sleeping prisoner. A way into the night. Follow an illustrated story from Acts 12:5–11.",
  alternates: { canonical: "/angels/stories/the-gate-opened" },
  openGraph: {
    title: "The gate opened — A story in Jerusalem",
    description: "Confinement gives way to open space in an illustrated reading of Acts 12:5–11.",
    type: "article",
    url: "/angels/stories/the-gate-opened",
    images: [{ url: "/angels/stories/peter-night.jpg", width: 1672, height: 941, alt: "An interpretive illustration of Peter alone in a Jerusalem street at night." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The gate opened — A story in Jerusalem",
    description: "Two chains. A sleeping prisoner. A way into the night. Acts 12:5–11.",
    images: ["/angels/stories/peter-night.jpg"],
  },
};

function ChapterHeading({ number, id, children }: { number: string; id: string; children: React.ReactNode }) {
  return <h2 className="gate-chapter-heading" id={id}><span aria-hidden="true">{number}</span>{children}</h2>;
}

export default function TheGateOpenedPage() {
  return (
    <StoryShell className="gate-story" titleId="gate-title">
      <header className="gate-cover" id="gate-beginning">
        <div className="gate-cover-topline">
          <Link href="/angels/stories">Visual stories <span aria-hidden="true">/</span> Jerusalem</Link>
          <span>03</span>
        </div>
        <div className="gate-cover-grid">
          <div className="gate-cover-copy">
            <p className="gate-eyebrow">Acts 12:5–11</p>
            <h1 id="gate-title">The gate{" "}<br /><em>opened.</em></h1>
            <p className="gate-cover-intro">Two chains.<br />A way into the night.</p>
            <a className="gate-begin-link" href="#kept-in-prison">Enter the story <span aria-hidden="true">↓</span></a>
          </div>
          <div className="gate-cover-window">
            <Image src="/angels/stories/peter-prison-exterior.jpg" alt="Interpretive illustration of a guarded prison gateway and its enclosed stone courtyard at night." fill sizes="(max-width: 700px) 100vw, 58vw" priority />
            <div className="gate-cover-window-shade" aria-hidden="true" />
            <span className="gate-cover-window-rule" aria-hidden="true" />
          </div>
        </div>
        <div className="gate-cover-bottom"><span>Four moments · At your pace</span><span>Interpretive illustration</span></div>
      </header>

      <section className="gate-kept gate-section" id="kept-in-prison" aria-labelledby="gate-kept-title">
        <div className="gate-inset gate-kept-heading">
          <div>
            <ChapterHeading number="01" id="gate-kept-title">Kept in the prison</ChapterHeading>
            <p className="gate-display">Two soldiers.<br /><em>Two chains.</em></p>
          </div>
          <p className="gate-prose">Peter is sleeping.<br />Beyond the prison, the assembly is praying.</p>
        </div>
        <figure className="gate-praying gate-inset">
          <div className="gate-praying-frame">
            <Image src="/angels/stories/peter-praying.jpg" alt="Members of the assembly gathered in prayer by lamplight while Peter is held in prison. Interpretive illustration." width={1536} height={1024} sizes="(max-width: 700px) 100vw, 90vw" />
          </div>
          <figcaption><span>The assembly prays · Acts 12:5</span><span>Interpretive illustration</span></figcaption>
        </figure>
      </section>

      <section className="gate-follow gate-section" id="follow-me" aria-labelledby="gate-follow-title">
        <div className="gate-inset gate-follow-inner">
          <ChapterHeading number="02" id="gate-follow-title">Follow me</ChapterHeading>
          <p className="gate-light-heading">A light shone<br /><em>in the cell.</em></p>
          <LightExperience />
          <div className="gate-follow-copy">
            <p className="gate-follow-preface">The angel wakes him.<br />The chains fall.</p>
            <blockquote>
              <p>“Put on your cloak<br /><em>and follow me.”</em></p>
              <cite>Acts 12:8 · WEB</cite>
            </blockquote>
            <p className="gate-follow-after">Peter follows.<br /><span>He thinks he is seeing a vision.</span></p>
            <a className="gate-quiet-link" href="#the-threshold">Past the guards <span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </section>

      <section className="gate-threshold gate-section" id="the-threshold" aria-labelledby="gate-threshold-title">
        <div className="gate-inset gate-threshold-heading">
          <ChapterHeading number="03" id="gate-threshold-title">The gate opened</ChapterHeading>
          <p className="gate-display">It opened to them<br /><em>by itself.</em></p>
          <p className="gate-threshold-reference">The iron gate into the city · Acts 12:10</p>
        </div>
        <figure className="gate-open-street gate-inset">
          <Image src="/angels/stories/peter-night.jpg" alt="Peter alone in an open Jerusalem street at night, after the angel has departed. Interpretive illustration." width={1672} height={941} sizes="(max-width: 700px) 100vw, 90vw" />
          <figcaption><span>One street. Then the angel departed.</span><span>Interpretive illustration · Acts 12:10–11</span></figcaption>
        </figure>
      </section>

      <section className="gate-recognition gate-section gate-inset" id="now-i-know" aria-labelledby="gate-recognition-title">
        <ChapterHeading number="04" id="gate-recognition-title">Now I truly know</ChapterHeading>
        <figure className="gate-recognition-art">
          <Image src="/angels/stories/peter-recognition.jpg" alt="Interpretive portrait of Peter alone in a lamplit street at night, his hands free, realizing he has been delivered." width={1024} height={1536} sizes="(max-width: 700px) 100vw, 36vw" />
          <figcaption>After the angel departed · Interpretive illustration</figcaption>
        </figure>
        <div className="gate-recognition-copy">
          <p className="gate-recognition-preface">One street.<br />Then the angel is gone.</p>
          <blockquote>
            <p>“Now I truly know that the Lord has sent out his angel <em>and delivered me</em>”</p>
            <cite>Peter · Acts 12:11, excerpt · WEB</cite>
          </blockquote>
          <p className="gate-recognition-after">Peter comes to himself.</p>
          <Link className="gate-quiet-link" href={CHAPTER}>Stay with the passage <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <StorySource
        reference="Acts 12:5–11"
        chapterHref={CHAPTER}
        verses={acts.chapters[11].slice(4, 11)}
        startVerse={5}
        note="These are interpretive illustrations. Acts describes the assembly praying, a light shining in the cell, an angel waking Peter, and the chains falling from his hands. The movable circle reveals a second painting of the same cell; its shape and movement are artistic choices. The gate opened by itself, and the open street pictures Peter after the angel departed. The passage does not describe the angel’s appearance or assign a rank."
      />
      <StoryFooter current="the-gate-opened" />
    </StoryShell>
  );
}
