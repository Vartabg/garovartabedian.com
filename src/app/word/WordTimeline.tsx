import type { WordLedgerSource, WordTimelineEvent } from "@/lib/word/types";

const STATUS_LABEL = {
  researched: "Source checked",
  placeholder: "Not yet verified",
} as const;

export default function WordTimeline({
  events,
  sources,
}: {
  events: WordTimelineEvent[];
  sources: WordLedgerSource[];
}) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  return (
    <ol className="word-timeline">
      {events.map((event) => (
        <li className={`word-timeline-item is-${event.status}`} key={event.id}>
          <div className="word-timeline-marker" aria-hidden="true" />
          <div className="word-timeline-copy">
            <div className="word-timeline-meta">
              <time>{event.year}</time>
              <span className={`word-status word-status--${event.status}`}>
                {STATUS_LABEL[event.status]}
              </span>
            </div>
            <h4>{event.title}</h4>
            <p>{event.note}</p>
            <div className="word-timeline-sources" aria-label="Event sources">
              {event.sourceIds.map((sourceId) => {
                const source = sourceById.get(sourceId);
                if (!source) return null;
                return (
                  <a key={sourceId} href={`#word-source-${sourceId}`}>
                    {source.label}
                  </a>
                );
              })}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
