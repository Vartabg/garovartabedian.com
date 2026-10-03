import Image from "next/image";
import Link from "next/link";
import { APOSTLE_PLATES } from "@/lib/apostles/plates";
import { APOSTLE_STORIES } from "@/lib/apostles/stories";
import type { SentData, TwelveData } from "@/lib/apostles/types";
import ApostlesSources from "./ApostlesSources";

export default function ApostlesHome({
  data,
  sent,
}: {
  data: TwelveData;
  sent: SentData;
}) {
  const hero = APOSTLE_STORIES[0];
  const placed = sent.rays.length;

  return (
    <div className="ap-home">
      <header className="ap-home-hero">
        <div className="ap-home-hero-copy">
          <p className="ap-home-eyebrow">The Apostles · Witnesses of Jesus</p>
          <h1 className="ap-home-title">Called. Changed. Sent.</h1>
          <p className="ap-home-lede">
            They walked with Jesus. Their questions and failures remain on the
            page. Their witness carries the story onward.
          </p>
          <nav className="ap-home-cta" aria-label="Begin">
            <Link
              className="ap-home-btn ap-home-btn-primary"
              href={`/apostles/stories/${hero.slug}`}
            >
              Begin with &ldquo;{hero.title}&rdquo;
            </Link>
            <Link className="ap-home-btn" href="#meet-the-apostles">
              Meet the apostles
            </Link>
          </nav>
          <p className="ap-home-meta">
            {data.apostles.length} records · {placed} roads placed
          </p>
        </div>
        <figure className="ap-home-hero-art">
          <Image
            src={hero.encounterImage}
            alt={hero.encounterAlt}
            width={1536}
            height={1024}
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
            className="ap-home-img"
          />
          <figcaption>
            Interpretive illustration for &ldquo;{hero.title}&rdquo;.
          </figcaption>
        </figure>
      </header>

      <section id="visual-stories" className="ap-home-stories" aria-labelledby="ap-home-stories-h">
        <h2 id="ap-home-stories-h">Three encounters</h2>
        <ol className="ap-home-story-list">
          {APOSTLE_STORIES.map((story, i) => (
            <li key={story.slug} className="ap-home-story">
              <figure className="ap-home-story-art">
                <Image
                  src={story.image}
                  alt={story.alt}
                  width={1536}
                  height={1024}
                  sizes="(max-width: 900px) 100vw, 40vw"
                  className="ap-home-img"
                />
              </figure>
              <div className="ap-home-story-copy">
                <p className="ap-home-story-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="ap-home-eyebrow">{story.eyebrow}</p>
                <h3 className="ap-home-story-title">{story.title}</h3>
                <p className="ap-home-ref">{story.reference}</p>
                <p>{story.description}</p>
                <p className="ap-home-person">{story.person}</p>
                <p className="ap-home-story-links">
                  <Link
                    className="ap-home-textlink"
                    href={`/apostles/stories/${story.slug}`}
                  >
                    Read the story
                  </Link>{" "}
                  <Link className="ap-home-textlink" href={story.recordHref}>
                    The record
                  </Link>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="ap-home-index" aria-labelledby="meet-the-apostles">
        <h2 id="meet-the-apostles">Meet the apostles</h2>
        <p className="ap-home-index-note">
          Thirteen records: the Twelve and Matthias, who fills Judas&rsquo;s
          seat.
        </p>
        <ul className="ap-home-index-list">
          {data.apostles.map((a) => {
            const plate = APOSTLE_PLATES[a.id];
            return (
              <li key={a.id} className="ap-home-index-item">
                <Link
                  className="ap-home-index-link"
                  href={`/apostles/twelve#${a.id}`}
                >
                  {plate ? (
                    <Image
                      src={plate.src}
                      alt=""
                      width={1200}
                      height={800}
                      sizes="(max-width: 700px) 100vw, 25vw"
                      className="ap-home-img"
                    />
                  ) : null}
                  <strong>{a.name}</strong>
                  {a.aka ? <span>{a.aka}</span> : null}
                  <em>Seat {a.seat}</em>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="ap-home-paul">
          Paul is kept separately.{" "}
          <Link className="ap-home-textlink" href="/apostles/twelve#paul">
            Meet Paul in the records
          </Link>
          .
        </p>
      </section>

      <section className="ap-home-doorway" aria-labelledby="ap-home-send-h">
        <h2 id="ap-home-send-h">Follow the sending</h2>
        <p>
          {placed} roads drawn only as far as the evidence reaches — then the
          source records, kept whole.
        </p>
        <nav className="ap-home-cta" aria-label="Research">
          <Link className="ap-home-btn" href="/apostles/sent">
            Follow the sending
          </Link>
          <Link className="ap-home-btn" href="/apostles/twelve">
            Open the twelve records
          </Link>
        </nav>
      </section>

      <ApostlesSources data={data} />
    </div>
  );
}
