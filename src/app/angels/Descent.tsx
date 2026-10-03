import Link from "next/link";
import Image from "next/image";
import { ANGEL_REALMS } from "@/lib/angels/realms";
import type { AngelsPlateMeta } from "@/lib/angels/media-plates";
import { segmentText, type GlossSeen } from "@/lib/glossary/segment";
import { traditionFor } from "@/lib/scriptures/server";
import { parseRef } from "@/lib/scriptures/refs";
import type { OrderBand } from "@/lib/angels/types";
import type { Canons } from "@/lib/scriptures/types";
import { GlossSegments } from "../_components/Gloss";
import EvidenceNote from "./EvidenceNote";

function ServerGlossText({ text, seen }: { text: string; seen: GlossSeen }) {
  return <GlossSegments segments={segmentText(text, seen)} />;
}

/** The source record stays server-rendered and every historical anchor remains visible. */
export default function Descent({
  bands,
  canons,
  seen,
  plates,
}: {
  bands: OrderBand[];
  canons: Canons;
  seen: GlossSeen;
  plates: Record<string, AngelsPlateMeta>;
}) {
  const refLink = (ref: string) => {
    const p = parseRef(ref);
    const meta = p && canons.books[p.book];
    if (!p || !meta) return null;
    return {
      label: `${meta.name} ${p.chapter}:${p.verse}${p.endVerse ? `–${p.endVerse}` : ""}`,
      href: `/scriptures/${traditionFor(p.book)}/${p.book}/${p.chapter}#v${p.verse}`,
    };
  };

  return (
    <div className="an-realm-chapters">
      {ANGEL_REALMS.map((realm) => {
        const plate = plates[realm.plateId];
        return (
          <section className={`an-realm-chapter ${realm.id}`} key={realm.id} aria-labelledby={`realm-${realm.id}`}>
            <div className="an-realm-scene">
              <header>
                <span className="an-realm-number" aria-hidden="true">{realm.number}</span>
                <h3 id={`realm-${realm.id}`}>{realm.label}</h3>
                <p>{realm.note}</p>
              </header>
              {plate && (
                <figure>
                  <Image src={plate.src} alt={plate.alt} width={1280} height={720} sizes="(min-width: 761px) 536px, 100vw" quality={70} />
                  <figcaption>{plate.caption}</figcaption>
                </figure>
              )}
              <Link className="an-realm-encounter" href={realm.encounter.href}>
                {realm.encounter.label} <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="an-realm-records">
              {bands.filter((band) => band.realm === realm.id).map((band) => (
                <article className="an-realm-record" id={`band-${band.id}`} key={band.id}>
                  <h4>{band.name}</h4>
                  <p><ServerGlossText text={band.line} seen={seen} /></p>
                  <EvidenceNote evidence={band.evidence} compact />
                  <span className="an-refs">
                    {band.refs.map((ref) => {
                      const link = refLink(ref);
                      return link ? <Link key={ref} href={link.href}>{link.label}</Link> : <span key={ref}>{ref}</span>;
                    })}
                  </span>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
