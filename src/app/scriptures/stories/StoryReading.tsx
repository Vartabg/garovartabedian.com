import Link from "next/link";
import { passageHref, readSpan, spanLabel } from "@/lib/scriptures/story-text";
import type { ScriptureStory } from "@/lib/scriptures/stories";
import ReadingSurface from "../../_components/reading/ReadingSurface";

export default function StoryReading({ story }: { story: ScriptureStory }) {
  const chapters = Array.from(
    { length: story.toChapter - story.fromChapter + 1 },
    (_, index) => story.fromChapter + index,
  );
  return (
    <ReadingSurface className="scr-story" aria-labelledby="scripture-story-title">
      <header>
        <p className="scr-story-kicker">
          <Link href="/scriptures/stories">Stories</Link>
          <span aria-hidden="true"> · </span>
          {story.reference}
        </p>
        <h1 id="scripture-story-title">{story.title}</h1>
        <p className="scr-story-deck">
          {story.summary} The words are the World English Bible. A verse number opens that verse in the chapter.
        </p>
        <details className="scr-story-parts">
          <summary>Parts of this story</summary>
          <ol>
            {story.parts.map((part) => (
              <li key={part.id}>
                <a href={`#${part.id}`}>{part.title}</a>
              </li>
            ))}
          </ol>
        </details>
      </header>

      {story.parts.map((part) => {
        if (part.kind === "bridge") {
          return (
            <section className="scr-story-part scr-story-bridge" id={part.id} key={part.id} aria-labelledby={`${part.id}-title`}>
              <h2 id={`${part.id}-title`}>{part.title}</h2>
              <p>
                {part.text} <Link href={part.href}>{part.label}</Link>
              </p>
            </section>
          );
        }
        return (
          <section className="scr-story-part" id={part.id} key={part.id} aria-labelledby={`${part.id}-title`}>
            <h2 id={`${part.id}-title`}>{part.title}</h2>
            <p className="scr-story-ref">
              {part.spans.map((span, index) => (
                <span key={`${span.chapter}-${span.start}`}>
                  {index > 0 ? " · " : null}
                  <Link href={passageHref(story.book, span.chapter, span.start)}>{spanLabel(span, story.book)}</Link>
                </span>
              ))}
            </p>
            {part.spans.map((span, index) => (
              <div key={`${span.chapter}-${span.start}`}>
                {index > 0 && part.between ? (
                  <p className="scr-story-between">
                    {part.between.text}{" "}
                    <Link href={passageHref(story.book, part.between.chapter, part.between.verse)}>
                      Read Genesis {part.between.chapter}:{part.between.verse}
                    </Link>
                  </p>
                ) : null}
                <div className="scr-read-text reading-prose">
                  {readSpan(story.book, span).map((verse) => (
                    <div className="scr-v" id={`g${verse.chapter}-${verse.verse}`} key={verse.verse}>
                      <p className="scr-verse">
                        <a
                          className="scr-vnum"
                          href={passageHref(story.book, verse.chapter, verse.verse)}
                          aria-label={`Genesis ${verse.chapter}:${verse.verse}`}
                        >
                          {verse.verse}
                        </a>
                        {verse.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}

      <nav className="scr-story-chapters" aria-label="Read these chapters in order">
        <h2>Read the chapters in order</h2>
        <ol>
          {chapters.map((chapter) => (
            <li key={chapter}>
              <Link href={passageHref(story.book, chapter, 1)}>Genesis {chapter}</Link>
            </li>
          ))}
        </ol>
      </nav>
    </ReadingSurface>
  );
}
