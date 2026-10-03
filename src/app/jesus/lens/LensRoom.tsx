import Link from "next/link";
import ArtPlate from "@/app/_components/ArtPlate";
import { GlossSegments } from "@/app/_components/Gloss";
import { segmentText } from "@/lib/glossary/segment";
import type {
  ArtWork,
  JesusPerspective,
  LensEntry,
  PerspectiveSource,
} from "@/lib/jesus/types";

function groupId(group: string) {
  return group.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function SourceLink({ source }: { source: PerspectiveSource }) {
  const internal = source.url.startsWith("/") || source.url.startsWith("#");
  if (internal) {
    return <Link href={source.url}>{source.label}</Link>;
  }
  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer">
      {source.label}
    </a>
  );
}

function PerspectiveMap({
  perspectives,
  entries,
  art,
}: {
  perspectives: JesusPerspective[];
  entries: LensEntry[];
  art: ArtWork[];
}) {
  const groups = [...new Set(perspectives.map((item) => item.group))];
  return (
    <nav className="jsu-lens-map" aria-label="Jesus perspectives in this room">
      <div className="jsu-lens-head">
        <strong>Choose a way people have understood him</strong>
        <span>Includes {perspectives.length} sourced perspectives</span>
      </div>
      <div className="jsu-lens-tiles">
        {groups.map((group) => (
          <a key={group} href={`#${groupId(group)}`} className="jsu-lens-tile">
            <strong>{group}</strong>
            <span>{perspectives.filter((item) => item.group === group).length} views</span>
          </a>
        ))}
      </div>
      <div className="jsu-lens-secondary-links">
        <a href="#texts">Texts and traditions · {entries.length} records</a>
        <a href="#art">World art archive · {art.length} works</a>
      </div>
    </nav>
  );
}

function PerspectiveCard({ item }: { item: JesusPerspective }) {
  return (
    <article className="jsu-perspective-card" id={item.id}>
      <p className="jsu-perspective-name">{item.name}</p>
      <h3>{item.answer}</h3>
      <p>{item.summary}</p>
      <div className="jsu-perspective-boundary">
        <strong>What this can—and cannot—tell us</strong>
        <p>{item.boundary}</p>
      </div>
      <ul className="jsu-perspective-sources" aria-label={`Sources for ${item.name}`}>
        {item.sources.map((source) => (
          <li key={source.url}>
            <SourceLink source={source} />
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function LensRoom({
  perspectives,
  entries,
  art,
}: {
  perspectives: JesusPerspective[];
  entries: LensEntry[];
  art: ArtWork[];
}) {
  const groups = [...new Set(perspectives.map((item) => item.group))];
  const cultures = [...new Set(art.map((item) => item.culture))];
  const glossSeen = new Map<string, string>();

  return (
    <>
      <p className="kicker">
        <Link href="/jesus">Jesus Christ</Link>
      </p>
      <h1>Who is Jesus to the world?</h1>
      <p className="lede">
        Christians worship him. Muslims honor him. Judaism does not receive him as
        Messiah. Gandhi read him as a teacher of nonviolence, historians examine a
        first-century Jew, and legends carry him as far as Kashmir and Japan.
        Follow each view to its sources, and see where evidence ends and
        tradition begins.
      </p>

      <PerspectiveMap perspectives={perspectives} entries={entries} art={art} />

      {groups.map((group) => (
        <section className="jsu-perspective-section" id={groupId(group)} key={group}>
          <p className="jsu-lane">{group}</p>
          <div className="jsu-perspective-grid">
            {perspectives
              .filter((item) => item.group === group)
              .map((item) => <PerspectiveCard item={item} key={item.id} />)}
          </div>
        </section>
      ))}

      <section className="jsu-text-shelf" id="texts">
        <h2 className="jsu-chapter">Texts and traditions</h2>
        <p className="scr-meta">
          Open the source traditions themselves: later sayings, infancy stories,
          Islamic scripture, and Christian memories outside the familiar Western shelf.
        </p>
        <div className="jsu-text-list">
          {entries.map((entry) => (
            <details className="jsu-source" key={entry.id} id={entry.id}>
              <summary>
                <strong>{entry.tradition}</strong>
                <span>{entry.intro}</span>
              </summary>
              <div className="jsu-source-body">
                {entry.excerpts.map((excerpt) => (
                  <div key={excerpt.cite}>
                    <blockquote className="jsu-quote">
                      <GlossSegments
                        segments={segmentText(excerpt.text, glossSeen)}
                      />
                    </blockquote>
                    <p className="jsu-cite">
                      {excerpt.cite} · translation: {excerpt.translator} ·{" "}
                      <a href={excerpt.sourceUrl} target="_blank" rel="noopener noreferrer" className="textlink">
                        source
                      </a>
                    </p>
                  </div>
                ))}
                <p>
                  <GlossSegments segments={segmentText(entry.note, glossSeen)} />
                </p>
                {entry.linkOut ? (
                  <p className="jsu-cite">
                    <a href={entry.linkOut.url} target="_blank" rel="noopener noreferrer" className="textlink">
                      {entry.linkOut.label}
                    </a>
                  </p>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </section>

      <details className="jsu-art-archive" id="art">
        <summary>
          <strong>World art archive</strong>
          <span>{art.length} works across {cultures.length} cultures—supporting material, not the room&rsquo;s main story.</span>
        </summary>
        <div className="jsu-gallery">
          {art.map((work) => (
            <ArtPlate
              key={work.id}
              src={work.imageUrl}
              alt={`${work.title} — ${work.culture}, ${work.date}`}
              title={work.title}
              sub={`${work.culture} · ${work.date}`}
              museum={work.museum}
              objectUrl={work.objectUrl}
            />
          ))}
        </div>
      </details>
    </>
  );
}
