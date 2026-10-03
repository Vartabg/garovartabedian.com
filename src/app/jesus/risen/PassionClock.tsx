import type { RisenMoment, RisenMovement } from "@/lib/jesus/types";
import RefList from "./RefList";

/**
 * One movement of the room — its moments in order, then whatever deeper
 * material belongs to that stretch. Attestation sits on the moment itself so
 * the shape of the record is visible without opening anything.
 */
export default function PassionClock({
  movement,
  moments,
  lead,
  children,
}: {
  movement: RisenMovement;
  moments: RisenMoment[];
  lead?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const own = moments.filter((moment) => moment.movement === movement.id);

  return (
    <section
      className="jsu-risen-movement"
      id={movement.id}
      aria-labelledby={`movement-${movement.id}`}
    >
      <header className="jsu-risen-movement-head">
        <p className="jsu-history-answer-kicker">{movement.window}</p>
        <h2 id={`movement-${movement.id}`}>{movement.name}</h2>
        <p className="jsu-risen-movement-question">{movement.question}</p>
        <p className="scr-meta">{movement.line}</p>
      </header>

      {lead}

      <ol className="jsu-risen-clock">
        {own.map((moment) => (
          <li className="jsu-risen-moment" id={moment.id} key={moment.id}>
            <p className="jsu-risen-moment-clock">{moment.clock}</p>
            <h3>{moment.title}</h3>
            <p className="jsu-risen-moment-line">{moment.line}</p>
            <p className="jsu-risen-attest">
              <span className="jsu-sr">Reported by: </span>
              {moment.attestation}
            </p>
            {moment.tension ? (
              <p className="jsu-risen-tension">
                <strong>Where the accounts differ</strong>
                <span>{moment.tension}</span>
              </p>
            ) : null}
            <RefList refs={moment.refs} label={`Passages for ${moment.title}`} />
          </li>
        ))}
      </ol>

      {children}
    </section>
  );
}
