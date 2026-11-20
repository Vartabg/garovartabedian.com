import Link from "next/link";
import { getParables } from "@/lib/jesus/server";
import { parableWalkFromQuery, type ParableWalkStop } from "@/lib/jesus/parable-walks";
import { readSpan } from "@/lib/scriptures/story-text";
import { verseStudyLinks } from "@/lib/scriptures/verse-study-links";
import PassageStudyLinks from "@/app/_components/PassageStudyLinks";

function stopDomId(walkId: string, stopId: string) {
  return `${walkId}-${stopId}`;
}

function citeLabel(chapter: number, start: number, end: number) {
  return start === end ? `Luke ${chapter}:${start}` : `Luke ${chapter}:${start}–${end}`;
}

function StopPanel({
  walkId,
  stop,
  index,
  total,
  stops,
}: {
  walkId: string;
  stop: ParableWalkStop;
  index: number;
  total: number;
  stops: ParableWalkStop[];
}) {
  const verses = readSpan(stop.book, { chapter: stop.chapter, start: stop.start, end: stop.end });
  const previous = stops[index - 1];
  const next = stops[index + 1];
  const label = citeLabel(stop.chapter, stop.start, stop.end);
  return (
    <article className={`parable-stop parable-stop--${stop.id}`} aria-labelledby={`${stop.id}-title`}>
      <p className="parable-stop-where">{index + 1} of {total}</p>
      <h2 id={`${stop.id}-title`}>{label}</h2>
      {/* A native image keeps the moment independent of the image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="jsu-word-door-picture"
        src={stop.picture.src}
        alt={`${stop.picture.alt} Interpretive illustration.`}
        width={960}
        height={720}
        loading="lazy"
        decoding="async"
      />
      {verses.map((verse) => (
        <p className="jsu-word-door-verse" key={verse.verse}>
          <span className="world-vnum">{verse.verse}</span>
          {verse.text}
        </p>
      ))}
      <p>
        <Link href={`/scriptures/protestant/${stop.book}/${stop.chapter}#v${stop.start}`}>{label}</Link>
      </p>
      {/* The walk ends on its last verse; the last step links its translations and original words. */}
      {!next && <PassageStudyLinks links={verseStudyLinks({ book: stop.book, chapter: stop.chapter, verse: stop.end })} />}
      <p className="parable-stop-nav">
        {previous ? <label htmlFor={stopDomId(walkId, previous.id)}>Back</label> : <span />}
        {next ? <label htmlFor={stopDomId(walkId, next.id)}>Next</label> : <span />}
      </p>
    </article>
  );
}

/** The good Samaritan, one hosted moment at a time. The list below stays where it is. */
export default function ParableWalk({ story }: { story?: string | string[] }) {
  const walk = parableWalkFromQuery(story) ?? parableWalkFromQuery("good-samaritan");
  if (!walk) return null;
  const parable = getParables().find((item) => item.id === walk.id);
  if (!parable) throw new Error(`No parable for walk ${walk.id}`);
  const rules = walk.stops
    .map((stop) => `.parable-walk:has(#${stopDomId(walk.id, stop.id)}:checked) .parable-stop--${stop.id}{display:block}`)
    .join("");
  return (
    <details className="parable-walk-details" open={parableWalkFromQuery(story) ? true : undefined}>
      <summary>{parable.title}</summary>
      <fieldset className="parable-walk">
        <legend className="sr-fallback">The path</legend>
        <style>{rules}</style>
        {walk.stops.map((stop, index) => (
          <input
            key={stop.id}
            className="parable-walk-radio"
            type="radio"
            name={`${walk.id}-stop`}
            id={stopDomId(walk.id, stop.id)}
            defaultChecked={index === 0}
            aria-label={citeLabel(stop.chapter, stop.start, stop.end)}
          />
        ))}
        {walk.stops.map((stop, index) => (
          <StopPanel key={stop.id} walkId={walk.id} stop={stop} index={index} total={walk.stops.length} stops={walk.stops} />
        ))}
      </fieldset>
    </details>
  );
}
