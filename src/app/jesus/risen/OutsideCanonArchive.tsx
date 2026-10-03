import type {
  RisenOutsideCanonGroup,
  RisenOutsideCanonRecord,
} from "@/lib/jesus/types";

const GROUPS: {
  id: RisenOutsideCanonGroup;
  title: string;
  description: string;
}[] = [
  {
    id: "event-retellings",
    title: "Retelling the event",
    description:
      "Narratives that make visible what the New Testament leaves offstage.",
  },
  {
    id: "risen-dialogues",
    title: "Additional appearances and teaching",
    description:
      "Works that use an encounter with the risen Jesus to authorize further instruction.",
  },
  {
    id: "expanded-worlds",
    title: "Later expansions",
    description:
      "Texts that stretch the setting into Hades, cosmic revelation, or years of secret teaching.",
  },
];

function OutsideCanonCard({ record }: { record: RisenOutsideCanonRecord }) {
  return (
    <details className="jsu-risen-apocrypha-card" id={record.id}>
      <summary>
        <span>{record.kind}</span>
        <strong>{record.name}</strong>
        <em>{record.date}</em>
      </summary>
      <div className="jsu-risen-apocrypha-card-body">
        <dl>
          <div>
            <dt>What survives</dt>
            <dd>{record.survives}</dd>
          </div>
          <div>
            <dt>What it adds</dt>
            <dd>{record.claim}</dd>
          </div>
        </dl>
        <div className="jsu-risen-boundary">
          <div>
            <strong>What this establishes</strong>
            <span>{record.establishes}</span>
          </div>
          <div>
            <strong>Where it stops</strong>
            <span>{record.limits}</span>
          </div>
        </div>
        <a
          className="jsu-risen-apocrypha-source"
          href={record.sourceUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          {record.sourceLabel} <span aria-hidden="true">↗</span>
        </a>
      </div>
    </details>
  );
}

export default function OutsideCanonArchive({
  records,
}: {
  records: RisenOutsideCanonRecord[];
}) {
  if (records.length === 0) return null;

  const textLabel = records.length === 1 ? "text" : "texts";

  return (
    <section
      className="jsu-risen-apocrypha"
      id="outside-canon"
      aria-labelledby="outside-canon-title"
    >
      <p className="jsu-history-answer-kicker">Reception history</p>
      <h2 id="outside-canon-title">
        Outside the canon: how later Christians continued the story
      </h2>
      <p className="scr-meta">
        These works are evidence for how the resurrection was retold and
        interpreted after the New Testament sources. They are not additional
        rows in the event timeline.
      </p>
      <details className="jsu-risen-apocrypha-archive">
        <summary>
          <span>Noncanonical archive</span>
          <strong>
            Explore {records.length} {textLabel}, with dates and historical limits
          </strong>
        </summary>
        <div className="jsu-risen-apocrypha-groups">
          {GROUPS.map((group) => {
            const own = records.filter((record) => record.group === group.id);
            if (own.length === 0) return null;

            return (
              <section className="jsu-risen-apocrypha-group" key={group.id}>
                <h3>{group.title}</h3>
                <p>{group.description}</p>
                <div className="jsu-risen-apocrypha-list">
                  {own.map((record) => (
                    <OutsideCanonCard record={record} key={record.id} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </details>
    </section>
  );
}
