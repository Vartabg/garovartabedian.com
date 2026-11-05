import Link from "next/link";
import { passageHref, readSpan } from "@/lib/scriptures/story-text";
import { storyStops, type ScriptureStory } from "@/lib/scriptures/stories";
import ReadingSurface from "../../_components/reading/ReadingSurface";

function citeLabel(chapter: number, verse: number) {
  return `Genesis ${chapter}:${verse}`;
}

export default function StoryReading({ story }: { story: ScriptureStory }) {
  const chapters = Array.from(
    { length: story.toChapter - story.fromChapter + 1 },
    (_, index) => story.fromChapter + index,
  );
  const stops = storyStops(story);
  const stepOf = new Map(stops.map((stop, index) => [stop.id, index + 1]));

  return (
    <ReadingSurface className="scr-story" aria-labelledby="scripture-story-title">
      <header className="scr-story-head">
        <p className="scr-story-kicker">
          <Link href="/scriptures/stories">Stories</Link>
        </p>
        <h1 id="scripture-story-title">{story.title}</h1>
        <p className="scr-story-deck">{story.summary}</p>
      </header>

      <div className="scr-path">
        {story.moves.map((move) => (
          <section className={`scr-move scr-move--${move.id}`} key={move.id} aria-labelledby={`${move.id}-label`}>
            <h2 id={`${move.id}-label`}>{move.label}</h2>
            <ol>
              {move.stops.map((stop) => {
                const step = stepOf.get(stop.id);
                const words = stop.words ? readSpan(story.book, { chapter: stop.cites[0].chapter, start: stop.cites[0].verse, end: stop.cites[0].verse })[0] : null;
                return (
                  <li key={stop.id} id={stop.id}>
                    <p className="scr-step" aria-hidden="true">{step}</p>
                    <div>
                      <h3>{stop.title}</h3>
                      {words ? <blockquote>{words.text}</blockquote> : <p>{stop.line}</p>}
                      <p className="scr-cites">
                        {stop.cites.map((cite) => (
                          <Link key={`${cite.chapter}-${cite.verse}`} href={passageHref(story.book, cite.chapter, cite.verse)}>
                            {citeLabel(cite.chapter, cite.verse)}
                          </Link>
                        ))}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      <p className="scr-story-count">{stops.length} stops. Each line follows the World English Bible.</p>

      <details className="scr-story-chapters">
        <summary>Read the chapters in order</summary>
        <ol>
          {chapters.map((chapter) => (
            <li key={chapter}>
              <Link href={passageHref(story.book, chapter, 1)}>Genesis {chapter}</Link>
            </li>
          ))}
        </ol>
      </details>
    </ReadingSurface>
  );
}
