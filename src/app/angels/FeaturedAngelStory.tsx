import Image from "next/image";
import Link from "next/link";
import { angelStories } from "../../lib/angel-stories";
import "../styles/angels-story-feature.css";

/** A story invitation that preserves the discovery inside the experience. */
export default function FeaturedAngelStory() {
  return (
    <section className="an-featured-story" aria-labelledby="an-featured-story-title">
      <div className="an-featured-story-inner">
        <div className="an-featured-story-heading">
          <p className="an-featured-story-kicker">Visual stories</p>
          <Link className="an-featured-story-collection" href="/angels/stories">Explore the stories <span aria-hidden="true">↗</span></Link>
        </div>
        <Link className="an-featured-story-link" href="/angels/stories/open-his-eyes">
          <div className="an-featured-story-art">
            <Image
              src="/angels/stories/dothan-unseen.jpg"
              alt="An illustrated city surrounded by an army at dawn, seen by two figures on a rocky overlook."
              fill
              sizes="(max-width: 700px) 100vw, 75vw"
              quality={85}
            />
            <span className="an-featured-story-art-caption">Interpretive illustration</span>
          </div>
          <div className="an-featured-story-copy">
            <h2 id="an-featured-story-title">Open{" "}<br />his eyes<span>.</span></h2>
            <p>A surrounded city. A frightened servant. A prayer that changes what he sees.</p>
            <span className="an-featured-story-enter">Enter the story <span aria-hidden="true">↗</span></span>
            <small>Five moments · At your pace</small>
          </div>
        </Link>
        <div className="an-featured-story-more">
          {angelStories.slice(1).map(story => (
            <Link className={`an-story-invitation an-story-invitation--${story.tone}`} key={story.slug} href={`/angels/stories/${story.slug}`}>
              <Image src={story.image} alt={story.alt} fill sizes="(max-width: 700px) 100vw, 50vw" />
              <span className="an-story-invitation-copy">
                <small>{story.place} · {story.reference}</small>
                <span className="an-story-invitation-title">{story.title}<span aria-hidden="true">↗</span></span>
                <span className="an-story-invitation-line">{story.invitation}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
