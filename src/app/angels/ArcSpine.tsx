import Link from "next/link";
import { ANGEL_ARC, resolveArcStop, type AngelsArcData } from "@/lib/angels/arc";
import { segmentText, type GlossSeen } from "@/lib/glossary/segment";
import { traditionFor } from "@/lib/scriptures/server";
import { parseRef } from "@/lib/scriptures/refs";
import type { Canons } from "@/lib/scriptures/types";
import { GlossSegments } from "../_components/Gloss";
import EvidenceNote from "./EvidenceNote";

function ServerGlossText({ text, seen }: { text: string; seen: GlossSeen }) {
  return <GlossSegments segments={segmentText(text, seen)} />;
}

/** The whole story, era by era — every stop resolves to a record this world already publishes. */
export default function ArcSpine({
  data,
  canons,
  seen,
}: {
  data: AngelsArcData;
  canons: Canons;
  seen: GlossSeen;
}) {
  const refLink = (ref?: string) => {
    if (!ref) return null;
    const p = parseRef(ref);
    const meta = p && canons.books[p.book];
    if (!p || !meta) return null;
    return {
      label: `${meta.name} ${p.chapter}:${p.verse}${p.endVerse ? `–${p.endVerse}` : ""}`,
      href: `/scriptures/${traditionFor(p.book)}/${p.book}/${p.chapter}#v${p.verse}`,
    };
  };

  return (
    <section className="an-arc" aria-labelledby="an-arc-heading">
      <div className="an-arc-head">
        <p className="an-section-kicker">The whole story</p>
        <h2 id="an-arc-heading">What has happened, is happening, and will happen.</h2>
        <p>
          The rooms below sort the record by kind. Read it here by time. Every
          stop is a passage this world already keeps, with the weight it can
          bear still attached — a disputed fragment stays disputed on the way
          through.
        </p>
      </div>
      <ol className="an-arc-eras">
        {ANGEL_ARC.map((era, index) => (
          <li className="an-arc-era" key={era.id} id={`arc-${era.id}`}>
            <div className="an-arc-era-head">
              <span className="an-arc-era-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="an-arc-era-when">{era.when}</p>
              <h3>{era.title}</h3>
              <p className="an-arc-era-claim">
                <ServerGlossText text={era.claim} seen={seen} />
              </p>
              <EvidenceNote evidence={era.claimEvidence} compact />
            </div>
            <div className="an-arc-stops">
              {era.stops.map((stop) => {
                const resolved = resolveArcStop(stop, data);
                if (!resolved) return null;
                const reader = refLink(resolved.readerRef);
                return (
                  <article className="an-arc-stop" key={`${stop.kind}:${stop.key}`}>
                    <h4>{resolved.title}</h4>
                    {resolved.quote && (
                      <blockquote>
                        &ldquo;
                        <ServerGlossText text={resolved.quote} seen={seen} />
                        &rdquo;
                        {resolved.cite && <cite> {resolved.cite}</cite>}
                      </blockquote>
                    )}
                    {resolved.line && (
                      <p>
                        <ServerGlossText text={resolved.line} seen={seen} />
                      </p>
                    )}
                    <p className="an-arc-stop-note">{resolved.note}</p>
                    {resolved.evidence && <EvidenceNote evidence={resolved.evidence} compact />}
                    <span className="an-arc-stop-links">
                      <Link href={resolved.roomHref}>{resolved.roomLabel} →</Link>
                      {reader && <Link href={reader.href}>{reader.label}</Link>}
                    </span>
                  </article>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
