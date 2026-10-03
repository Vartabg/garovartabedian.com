import type { LifeEvent } from "@/lib/jesus/types";

const GOSPELS = [
  { book: "MAT", short: "Matt" },
  { book: "MRK", short: "Mark" },
  { book: "LUK", short: "Luke" },
  { book: "JHN", short: "John" },
] as const;

/**
 * Which of the four Gospels carry this moment, at a glance.
 *
 * The map already listed references; what it could not show was the shape of
 * the record. Seven of these events are in all four Gospels and nineteen are
 * in only one, and that difference is the single most useful thing a reader
 * can know about a story before weighing it — "only John records this" is a
 * fact about the evidence, not a verdict on it.
 *
 * Present and absent are both marked. A blank column would read as an
 * oversight; a struck one reads as what it is.
 */
export default function AttestationRow({ event }: { event: LifeEvent }) {
  const carried = new Set(event.refs.map((entry) => entry.ref.split(" ")[0]));
  const present = GOSPELS.filter((gospel) => carried.has(gospel.book));
  if (present.length === 0) return null;

  const summary =
    present.length === 4
      ? "All four Gospels"
      : present.length === 1
        ? `Only ${present[0].short}`
        : `${present.length} of the four`;

  return (
    <div className="jsu-attest">
      <ul className="jsu-attest-row" aria-label={`Gospel attestation: ${summary}`}>
        {GOSPELS.map((gospel) => {
          const has = carried.has(gospel.book);
          return (
            <li key={gospel.book} className={has ? "is-present" : "is-absent"}>
              <span aria-hidden="true">{gospel.short}</span>
              <span className="jsu-attest-sr">
                {gospel.short}: {has ? "records this" : "does not record this"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="jsu-attest-summary">
        {summary}
        {event.composite
          ? " — a span of ministry rather than one scene told more than once."
          : ""}
      </p>

      {event.orderingNote && (
        <details className="jsu-attest-ordering">
          <summary>The Gospels place this differently</summary>
          <p>{event.orderingNote.note}</p>
          <p className="jsu-attest-ordering-refs">
            {event.orderingNote.refs.map((entry) => entry.ref).join(" · ")}
          </p>
        </details>
      )}
    </div>
  );
}
