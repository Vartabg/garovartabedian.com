import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import genesis from "../../../../../public/scriptures/text/web/GEN.json";
import { StoryFooter, StoryShell, StorySource } from "../StoryFrame";
import BethelExperience from "./BethelExperience";
import "./bethel.css";

const ARTWORK = "/angels/stories/bethel-dream.jpg";
const SOURCE = "/scriptures/protestant/GEN/28#v10";

export const metadata: Metadata = {
  title: { absolute: "I am with you — A story at Bethel" },
  description:
    "A stone for a pillow. A stairway in a dream. Enter Jacob’s night at Bethel through an illustrated story from Genesis 28:10–19.",
  alternates: { canonical: "/angels/stories/i-am-with-you" },
  openGraph: {
    title: "I am with you — A story at Bethel",
    description: "From the stone beneath his head to a stairway reaching heaven. Genesis 28:10–19.",
    url: "/angels/stories/i-am-with-you",
    type: "article",
    images: [{ url: ARTWORK, width: 1024, height: 1536, alt: "A sleeping traveler beneath an immense sky and a luminous stairway. Interpretive illustration of Jacob’s dream." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "I am with you — A story at Bethel",
    description: "An illustrated story from Genesis 28:10–19.",
    images: [ARTWORK],
  },
};

function Beat({ number, children }: { number: string; children: React.ReactNode }) {
  return <h2 className="bethel-beat"><span aria-hidden="true">{number}</span>{children}</h2>;
}

export default function BethelPage() {
  return (
    <StoryShell className="bethel-story" titleId="bethel-title">
      <header className="bethel-opening" id="bethel-beginning">
        <div className="bethel-opening-topline">
          <Link href="/angels/stories"><span aria-hidden="true">←</span> Visual stories</Link>
          <span>02 / Bethel</span>
        </div>

        <div className="bethel-opening-layout">
          <div className="bethel-opening-copy">
            <p className="bethel-eyebrow">Genesis 28:10–19</p>
            <h1 id="bethel-title">I am<br /><em>with you.</em></h1>
            <p className="bethel-opening-intro">A stone for a pillow.<br />A stairway in a dream.</p>
            <a className="bethel-enter" href="#bethel-nightfall">Enter the night <span aria-hidden="true">↓</span></a>
          </div>

          <figure className="bethel-opening-plate">
            <Image
              src="/angels/stories/bethel-arrival.jpg"
              alt="Jacob arrives alone at a rocky stopping place beneath a fading dusk sky. Interpretive illustration."
              width={1024}
              height={1536}
              priority
              quality={85}
              sizes="(max-width: 700px) 92vw, 496px"
            />
            <figcaption>The road to Haran.</figcaption>
          </figure>
        </div>
        <div className="bethel-opening-footnote"><span>Four moments · Your pace</span><span>Interpretive illustration</span></div>
      </header>

      <section className="bethel-nightfall bethel-inset" id="bethel-nightfall" aria-labelledby="bethel-nightfall-heading">
        <div className="bethel-margin"><Beat number="01">Nightfall</Beat><span className="bethel-location">Beersheba → Haran</span></div>
        <div className="bethel-nightfall-copy">
          <p className="bethel-narration">On the way to Haran, Jacob stops for the night.</p>
          <blockquote className="bethel-nightfall-quote"><p id="bethel-nightfall-heading">“because<br /><em>the sun had set.”</em></p><cite>Genesis 28:11 · WEB</cite></blockquote>
          <p className="bethel-nightfall-stone">A stone beneath his head.<br />Then sleep.</p>
        </div>
        <figure className="bethel-nightfall-plate">
          <Image
            src="/angels/stories/bethel-nightfall.jpg"
            alt="Jacob settles his head on a stone in a rocky landscape at night. Interpretive illustration."
            width={1536}
            height={1024}
            quality={85}
            sizes="(max-width: 700px) 92vw, 90vw"
          />
          <figcaption><span>Nightfall · Genesis 28:11</span><span>Interpretive illustration</span></figcaption>
        </figure>
        <div className="bethel-night-line" aria-hidden="true"><span /></div>
      </section>

      <section className="bethel-dream-section bethel-inset" id="bethel-dream" aria-labelledby="bethel-dream-heading">
        <div className="bethel-dream-intro">
          <Beat number="02">The dream</Beat>
          <p className="bethel-dream-heading" id="bethel-dream-heading">Set upon<br /><em>the earth.</em><br />Reaching<br /><em>to heaven.</em></p>
          <p className="bethel-dream-reading">“He dreamed and saw a stairway set upon the earth, and its top reached to heaven.”</p>
          <cite>Genesis 28:12 · WEB</cite>
        </div>
        <BethelExperience />
        <p className="bethel-angels-reading">“Behold, the angels of God were<br className="bethel-wide-break" /> ascending and descending on it.”<cite>Genesis 28:12 · WEB</cite></p>
      </section>

      <section className="bethel-promise" id="bethel-promise" aria-labelledby="bethel-promise-heading">
        <div className="bethel-promise-thread" aria-hidden="true"><span /></div>
        <Beat number="03">The promise</Beat>
        <p className="bethel-promise-preface">Yahweh speaks.</p>
        <blockquote className="bethel-promise-words">
          <p id="bethel-promise-heading">“Behold,<br /><em>I am with you,</em></p>
          <p>and will keep you,<br />wherever you go,”</p>
          <cite>Genesis 28:15 · WEB</cite>
        </blockquote>
        <p className="bethel-promise-afterword">The traveler is not alone.</p>
      </section>

      <section className="bethel-waking bethel-inset" id="bethel-waking" aria-labelledby="bethel-waking-heading">
        <figure className="bethel-waking-plate">
          <Image
            src="/angels/stories/bethel-morning.jpg"
            alt="At sunrise, Jacob pours oil from a small vessel onto an upright stone pillar. Interpretive illustration."
            width={1024}
            height={1536}
            quality={85}
            sizes="(max-width: 700px) 90vw, 40vw"
          />
          <figcaption>The stone, now a pillar.</figcaption>
        </figure>
        <div className="bethel-waking-copy">
          <Beat number="04">Waking</Beat>
          <p className="bethel-waking-preface">He wakes, afraid.</p>
          <blockquote className="bethel-waking-words"><p id="bethel-waking-heading">“Surely Yahweh<br />is in this place,<br /><em>and I didn’t know it.”</em></p><cite>Genesis 28:16 · WEB</cite></blockquote>
          <p className="bethel-narration">At morning, Jacob sets up the stone as a pillar and pours oil on it. He calls the place Bethel.</p>
          <span className="bethel-waking-reference">Genesis 28:18–19</span>
        </div>
      </section>

      <div className="bethel-last-word"><span aria-hidden="true">✧</span><p>A place he had passed through.<br /><em>A place he would remember.</em></p></div>

      <StorySource
        reference="Genesis 28:10–19"
        chapterHref={SOURCE}
        verses={genesis.chapters[27].slice(9, 19)}
        startVerse={10}
        note="These are interpretive illustrations of Jacob’s night at Bethel. Genesis describes a stairway reaching from earth to heaven, with angels ascending and descending. Their appearance, the landscape, and the light are artistic choices. No visible figure is presented as God."
      />
      <StoryFooter current="i-am-with-you" />
    </StoryShell>
  );
}
