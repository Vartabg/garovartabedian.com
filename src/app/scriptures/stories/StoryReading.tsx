import Link from "next/link";
import { bookName, passageHref, readSpan } from "@/lib/scriptures/story-text";
import { storyStops, type ScriptureStory, type StoryStop } from "@/lib/scriptures/stories";
import ReadingSurface from "../../_components/reading/ReadingSurface";

function citeLabel(name: string, chapter: number, verse: number) {
  return `${name} ${chapter}:${verse}`;
}

function stopId(slug: string, id: string) {
  return `${slug}-${id}`;
}

export default function StoryReading({ story }: { story: ScriptureStory }) {
  const chapters = Array.from(
    { length: story.toChapter - story.fromChapter + 1 },
    (_, index) => story.fromChapter + index,
  );
  const placed = story.moves.flatMap((move) => move.stops.map((stop) => ({ move, stop })));
  const stops = storyStops(story);
  const points = stops.map((stop) => `${stop.place.x},${stop.place.y}`).join(" ");
  const name = bookName(story.book);
  const rules = stops.map((stop) => `.scr-walk:has(#${stopId(story.slug, stop.id)}:checked) .scr-stop--${stop.id}{display:block}`).join("");

  return (
    <ReadingSurface className="scr-story" aria-labelledby="scripture-story-title">
      <header className="scr-story-head">
        <p className="scr-story-kicker">
          <Link href="/scriptures/stories">Stories</Link>
        </p>
        <h1 id="scripture-story-title">{story.title}</h1>
        <p className="scr-story-deck">{story.summary}</p>
      </header>

      <fieldset className="scr-walk">
        <legend className="sr-fallback">The path</legend>
        <style>{rules}</style>
        <div className="scr-map">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={points} />
          </svg>
          <p className="scr-zone scr-zone--down">Down</p>
          <p className="scr-zone scr-zone--up">Up</p>
          {placed.map(({ stop }, index) => (
            <span key={stop.id}>
              <input
                className="scr-radio"
                type="radio"
                name={`${story.slug}-stop`}
                id={stopId(story.slug, stop.id)}
                aria-label={stop.mark}
                defaultChecked={index === 0}
              />
              <label className={`scr-node scr-node--${stop.place.side}`} htmlFor={stopId(story.slug, stop.id)} style={{ left: `${stop.place.x}%`, top: `${stop.place.y}%` }}>
                {stop.mark}
              </label>
            </span>
          ))}
        </div>

        <div className="scr-panels">
          {placed.map(({ move, stop }, index) => (
            <StopPanel key={stop.id} story={story} stop={stop} move={move.label} index={index} total={stops.length} stops={stops} />
          ))}
        </div>
      </fieldset>

      <details className="scr-story-chapters">
        <summary>Read the chapters in order</summary>
        <ol>
          {chapters.map((chapter) => (
            <li key={chapter}>
              <Link href={passageHref(story.book, chapter, 1)}>{name} {chapter}</Link>
            </li>
          ))}
        </ol>
      </details>
    </ReadingSurface>
  );
}

function StopPanel({
  story,
  stop,
  move,
  index,
  total,
  stops,
}: {
  story: ScriptureStory;
  stop: StoryStop;
  move: string;
  index: number;
  total: number;
  stops: StoryStop[];
}) {
  const words = stop.words
    ? readSpan(story.book, { chapter: stop.cites[0].chapter, start: stop.cites[0].verse, end: stop.cites[0].verse })[0]
    : null;
  const previous = stops[index - 1];
  const next = stops[index + 1];
  return (
    <article className={`scr-stop scr-stop--${stop.id}`} aria-labelledby={`${stop.id}-title`}>
      <p className="scr-where">{move} · {index + 1} of {total}</p>
      <h2 id={`${stop.id}-title`}>{stop.title}</h2>
      <p>{stop.line}</p>
      {words ? <blockquote>{words.text}</blockquote> : null}
      <p className="scr-cites">
        {stop.cites.map((cite) => (
            <Link key={`${cite.chapter}-${cite.verse}`} href={passageHref(story.book, cite.chapter, cite.verse)}>
              {citeLabel(bookName(story.book), cite.chapter, cite.verse)}
            </Link>
        ))}
      </p>
      <p className="scr-step-nav">
        {previous ? <label htmlFor={stopId(story.slug, previous.id)}>Back</label> : <span />}
        {next ? <label htmlFor={stopId(story.slug, next.id)}>Next</label> : <span />}
      </p>
    </article>
  );
}
