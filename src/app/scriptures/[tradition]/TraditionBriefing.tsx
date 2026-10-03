import Link from "next/link";
import React from "react";
import type {
  Canons,
  Tradition,
  TraditionBriefing,
  TraditionClaim,
} from "@/lib/scriptures/types";

function EvidenceLinks({
  briefing,
  sourceIds,
}: {
  briefing: TraditionBriefing;
  sourceIds: string[];
}) {
  if (sourceIds.length === 0) return null;
  const sources = new Map(briefing.sources.map((source) => [source.id, source]));

  return (
    <p className="scr-trad-evidence">
      <strong>Evidence:</strong>{" "}
      {sourceIds.map((sourceId, index) => {
        const source = sources.get(sourceId);
        const sourceIndex = briefing.sources.findIndex((item) => item.id === sourceId);
        const href = source?.href ?? source?.url ?? `#tradition-source-${sourceId}`;
        const external = Boolean(source?.url);
        return (
          <span key={sourceId}>
            {index > 0 && ", "}
            <a
              href={href}
              title={source?.label ?? sourceId}
              aria-label={source?.label ?? sourceId}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              [{sourceIndex + 1}]
            </a>
          </span>
        );
      })}
    </p>
  );
}

function ClaimList({
  briefing,
  claims,
  tradition,
  canons,
  className,
}: {
  briefing: TraditionBriefing;
  claims: TraditionClaim[];
  tradition: Tradition;
  canons: Canons;
  className: string;
}) {
  return (
    <ul className={className}>
      {claims.map((claim) => (
        <li key={claim.title}>
          <h3>{claim.title}</h3>
          <p>{claim.text}</p>
          {claim.bookIds && claim.bookIds.length > 0 && (
            <p className="scr-trad-books" aria-label={`Books related to ${claim.title}`}>
              {claim.bookIds.map((bookId) => {
                const label = canons.books[bookId]?.name ?? bookId;
                return tradition.books.includes(bookId) ? (
                  <Link key={bookId} href={`/scriptures/${tradition.id}/${bookId}`}>
                    {label}
                  </Link>
                ) : (
                  <span key={bookId}>{label} · not hosted on this shelf</span>
                );
              })}
            </p>
          )}
          <EvidenceLinks briefing={briefing} sourceIds={claim.sourceIds} />
        </li>
      ))}
    </ul>
  );
}

/** The one-line thesis. It sits under the title, above the book list. */
export function TraditionBriefingLead({ briefing }: { briefing: TraditionBriefing }) {
  return <p className="lede scr-trad-oneline">{briefing.oneLine}</p>;
}

/**
 * The high-level context a reader needs before treating a canon as a count.
 * It follows the book list, so the books stay in reach.
 */
export default function TraditionBriefingView({
  briefing,
  tradition,
  canons,
}: {
  briefing: TraditionBriefing;
  tradition: Tradition;
  canons: Canons;
}) {
  return (
    <div className="scr-trad-brief">
      <p className="scr-trad-orient">{briefing.orient}</p>

      <aside className="scr-trad-caution" aria-label="Before comparing book counts">
        <h2>Before you count books</h2>
        <p>{briefing.keepInMind}</p>
      </aside>

      <dl className="scr-trad-facts">
        {briefing.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
            <EvidenceLinks briefing={briefing} sourceIds={fact.sourceIds} />
          </div>
        ))}
      </dl>

      <section className="scr-trad-formation" aria-labelledby="scr-trad-formation-title">
        <h2 id="scr-trad-formation-title">How this shelf took shape</h2>
        <ol>
          {briefing.formation.map((moment) => (
            <li key={`${moment.date}-${moment.title}`}>
              <p className="scr-trad-date">{moment.date}</p>
              <h3>{moment.title}</h3>
              <p>{moment.text}</p>
              <EvidenceLinks briefing={briefing} sourceIds={moment.sourceIds} />
            </li>
          ))}
        </ol>
      </section>

      <section className="scr-trad-section" aria-labelledby="scr-trad-differences-title">
        <div className="scr-trad-section-head">
          <p>Canon map</p>
          <h2 id="scr-trad-differences-title">What changes on this shelf</h2>
        </div>
        <ClaimList
          briefing={briefing}
          claims={briefing.distinctives}
          tradition={tradition}
          canons={canons}
          className="scr-trad-card-grid"
        />
      </section>

      <section className="scr-trad-section" aria-labelledby="scr-trad-reception-title">
        <div className="scr-trad-section-head">
          <p>More than a table of contents</p>
          <h2 id="scr-trad-reception-title">How this tradition receives Scripture</h2>
        </div>
        <ClaimList
          briefing={briefing}
          claims={briefing.reception}
          tradition={tradition}
          canons={canons}
          className="scr-trad-reception-grid"
        />
      </section>
    </div>
  );
}

/** The evidence, internal variation, and limitations below the hosted shelf. */
export function TraditionBriefingDeep({
  briefing,
  tradition,
  canons,
}: {
  briefing: TraditionBriefing;
  tradition: Tradition;
  canons: Canons;
}) {
  return (
    <div className="scr-trad-deep">
      <details className="scr-brief-block">
        <summary>
          <span>Variation inside this tradition</span>
          <span className="scr-brief-count">{briefing.variations.length}</span>
        </summary>
        <ClaimList
          briefing={briefing}
          claims={briefing.variations}
          tradition={tradition}
          canons={canons}
          className="scr-trad-detail-list"
        />
      </details>

      {briefing.debates.length > 0 && (
        <details className="scr-brief-block scr-brief-block--debate">
          <summary>
            <span>Where Christians genuinely disagree</span>
            <span className="scr-brief-count">{briefing.debates.length}</span>
          </summary>
          <p className="scr-brief-debate-note">
            These are differences in received authority and practice. The page names the
            reasoning each community gives without pretending that a book count resolves it.
          </p>
          {briefing.debates.map((debate) => (
            <div key={debate.question} className="scr-brief-debate">
              <h3>{debate.question}</h3>
              {debate.settled && (
                <p className="scr-brief-settled">
                  <strong>Not in dispute:</strong> {debate.settled}
                </p>
              )}
              <ol className="scr-brief-positions">
                {debate.positions.map((position) => (
                  <li key={position.view}>
                    <p className="scr-brief-view">{position.view}</p>
                    <p className="scr-brief-grounds">{position.grounds}</p>
                    <EvidenceLinks briefing={briefing} sourceIds={position.sourceIds} />
                  </li>
                ))}
              </ol>
              {debate.soWhat && (
                <p className="scr-brief-sowhat">
                  <strong>Why it matters here:</strong> {debate.soWhat}
                </p>
              )}
            </div>
          ))}
        </details>
      )}

      <section className="scr-trad-hosting" aria-labelledby="scr-trad-hosting-title">
        <p className="scr-trad-hosting-kicker">Hosted-text boundary</p>
        <h2 id="scr-trad-hosting-title">{briefing.hosting.heading}</h2>
        <p>{briefing.hosting.summary}</p>
        <dl>
          <div>
            <dt>Readable here</dt>
            <dd>{briefing.hosting.available}</dd>
          </div>
          {briefing.hosting.unavailable && (
            <div>
              <dt>Not represented here</dt>
              <dd>{briefing.hosting.unavailable}</dd>
            </div>
          )}
        </dl>
        {tradition.linkOut && (
          <p>
            <a
              href={tradition.linkOut.url}
              target="_blank"
              rel="noopener noreferrer"
              className="textlink"
            >
              {tradition.linkOut.label}
            </a>
          </p>
        )}
        <EvidenceLinks briefing={briefing} sourceIds={briefing.hosting.sourceIds} />
      </section>

      <details className="scr-brief-block">
        <summary>
          <span>Where this comes from</span>
          <span className="scr-brief-count">{briefing.sources.length}</span>
        </summary>
        <ul className="scr-brief-sources">
          {briefing.sources.map((source) => (
            <li key={source.id} id={`tradition-source-${source.id}`}>
              <p className="scr-brief-source-label">
                {source.href ? (
                  <Link href={source.href}>{source.label}</Link>
                ) : source.url ? (
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.label}
                  </a>
                ) : (
                  source.label
                )}
              </p>
              <p className="scr-brief-source-says">{source.says}</p>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
