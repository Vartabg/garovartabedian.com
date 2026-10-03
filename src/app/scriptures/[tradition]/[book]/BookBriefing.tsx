import Link from "next/link";
import type { BookBriefing } from "@/lib/scriptures/types";

/**
 * The context a reader needs before verse 1. Written by hand against the hosted
 * text and linked sources — see public/scriptures/books/.
 *
 * Everything here is plain markup and <details>, so it renders on the server and
 * works without JavaScript.
 */
const verseHref = (baseHref: string, ref: string) => {
  const m = /^(\d+):(\d+)/.exec(ref);
  if (!m) return null;
  return `${baseHref}/${m[1]}#v${m[2]}`;
};

function EvidenceLinks({
  briefing,
  sourceIds,
}: {
  briefing: BookBriefing;
  sourceIds: string[];
}) {
  if (sourceIds.length === 0) return null;
  const sources = new Map((briefing.sources ?? []).map((source) => [source.id, source]));

  return (
    <p className="scr-brief-evidence">
      <strong>Evidence:</strong>{" "}
      {sourceIds.map((sourceId, index) => {
        const source = sources.get(sourceId);
        const href = source?.href ?? source?.url ?? `#briefing-source-${sourceId}`;
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
              [{(briefing.sources ?? []).findIndex((item) => item.id === sourceId) + 1}]
            </a>
          </span>
        );
      })}
    </p>
  );
}

/** The one-line thesis. It sits under the title, above the chapter grid. */
export function BookBriefingLead({ briefing }: { briefing: BookBriefing }) {
  return <p className="lede scr-brief-oneline">{briefing.oneLine}</p>;
}

/** The briefing proper. It follows the chapter grid, so the chapters stay in reach. */
export default function BookBriefingView({
  briefing,
  baseHref,
}: {
  briefing: BookBriefing;
  baseHref: string;
}) {
  const { facts } = briefing;
  const hasFacts =
    facts.writtenBy || facts.writtenWhen || facts.writtenFor || facts.place || facts.covers || facts.size;

  return (
    <div className="scr-brief">
      <p className="scr-brief-orient">{briefing.orient}</p>

      <aside className="scr-brief-where" aria-label="Where you are">
        <h2>Where you are when this opens</h2>
        <p>{briefing.whereYouAre}</p>
      </aside>

      {hasFacts && (
        <dl className="scr-brief-facts">
          {facts.writtenBy && (
            <div>
              <dt>Written by</dt>
              <dd>{facts.writtenBy}<EvidenceLinks briefing={briefing} sourceIds={briefing.factSourceIds?.writtenBy ?? []} /></dd>
            </div>
          )}
          {facts.writtenWhen && (
            <div>
              <dt>When</dt>
              <dd>{facts.writtenWhen}<EvidenceLinks briefing={briefing} sourceIds={briefing.factSourceIds?.writtenWhen ?? []} /></dd>
            </div>
          )}
          {facts.writtenFor && (
            <div>
              <dt>Written for</dt>
              <dd>{facts.writtenFor}<EvidenceLinks briefing={briefing} sourceIds={briefing.factSourceIds?.writtenFor ?? []} /></dd>
            </div>
          )}
          {facts.place && (
            <div>
              <dt>From where</dt>
              <dd>{facts.place}<EvidenceLinks briefing={briefing} sourceIds={briefing.factSourceIds?.place ?? []} /></dd>
            </div>
          )}
          {facts.covers && (
            <div>
              <dt>Covers</dt>
              <dd>{facts.covers}<EvidenceLinks briefing={briefing} sourceIds={briefing.factSourceIds?.covers ?? []} /></dd>
            </div>
          )}
          {facts.size && (
            <div>
              <dt>Size</dt>
              <dd>{facts.size}<EvidenceLinks briefing={briefing} sourceIds={briefing.factSourceIds?.size ?? []} /></dd>
            </div>
          )}
        </dl>
      )}

      {briefing.language && (
        <section className="scr-brief-language" aria-labelledby="scr-brief-language-title">
          <h2 id="scr-brief-language-title">The language beneath the English</h2>
          <dl className="scr-brief-language-layers">
            <div>
              <dt>Written in</dt>
              <dd>{briefing.language.writtenIn}</dd>
            </div>
            {briefing.language.register && (
              <div>
                <dt>Register and texture</dt>
                <dd>{briefing.language.register}</dd>
              </div>
            )}
            {briefing.language.spokenWorld && (
              <div>
                <dt>Languages in the story</dt>
                <dd>{briefing.language.spokenWorld}</dd>
              </div>
            )}
            {briefing.language.readerSignal && (
              <div>
                <dt>What the author signals</dt>
                <dd>{briefing.language.readerSignal}</dd>
              </div>
            )}
            <div>
              <dt>What you are reading here</dt>
              <dd>{briefing.language.englishLayer}</dd>
            </div>
          </dl>

          {briefing.language.textualHistory && briefing.language.textualHistory.length > 0 && (
            <div className="scr-brief-language-history">
              <h3>How the text reached you</h3>
              <ul>
                {briefing.language.textualHistory.map((layer) => (
                  <li key={`${layer.label}-${layer.language}`}>
                    <h4>{layer.label}</h4>
                    <p className="scr-brief-language-original">{layer.language}</p>
                    {layer.spans && layer.spans.length > 0 && (
                      <p>
                        <strong>Applies to:</strong> {layer.spans.join(", ")}
                      </p>
                    )}
                    <p>{layer.description}</p>
                    <EvidenceLinks briefing={briefing} sourceIds={layer.sourceIds} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {briefing.language.features && briefing.language.features.length > 0 && (
            <div className="scr-brief-language-features">
              <h3>How this language moves</h3>
              <ul>
                {briefing.language.features.map((feature) => (
                  <li key={feature.title}>
                    <h4>{feature.title}</h4>
                    {feature.original && (
                      <p className="scr-brief-language-original">{feature.original}</p>
                    )}
                    <p>{feature.explanation}</p>
                    {feature.translationNote && (
                      <p>
                        <strong>What English can hide:</strong> {feature.translationNote}
                      </p>
                    )}
                    {feature.caution && (
                      <p className="scr-brief-language-caution">
                        <strong>Do not flatten it:</strong> {feature.caution}
                      </p>
                    )}
                    {feature.refs && feature.refs.length > 0 && (
                      <p className="scr-brief-refs">
                        {feature.refs.map((ref) => {
                          const href = verseHref(baseHref, ref);
                          return href ? (
                            <Link key={ref} href={href} className="scr-brief-ref">
                              {ref}
                            </Link>
                          ) : (
                            <span key={ref} className="scr-brief-ref">
                              {ref}
                            </span>
                          );
                        })}
                      </p>
                    )}
                    <EvidenceLinks briefing={briefing} sourceIds={feature.sourceIds} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {briefing.language.examples && briefing.language.examples.length > 0 && (
            <div className="scr-brief-language-examples">
              <h3>{briefing.language.examplesHeading ?? `${briefing.bookName} in its own words`}</h3>
              <ul>
                {briefing.language.examples.map((example) => {
                  const href = verseHref(baseHref, example.ref);
                  return (
                    <li key={`${example.ref}-${example.form}`}>
                      <p className="scr-brief-language-word">
                        {href ? <Link href={href}>{example.ref}</Link> : example.ref}
                        <span aria-hidden="true"> · </span>
                        <i>{example.form}</i>
                        <span> — {example.meaning}</span>
                      </p>
                      <p>{example.why}</p>
                      <EvidenceLinks briefing={briefing} sourceIds={example.sourceIds} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="scr-brief-form">
        <h2>What kind of writing this is</h2>
        <p className="scr-brief-form-name">{briefing.form.name}</p>
        <p>{briefing.form.how}</p>
      </section>

      <section className="scr-brief-purpose">
        <h2>What this book is driving at</h2>
        <p>{briefing.purpose}</p>
      </section>
    </div>
  );
}

/** The collapsed sections that close the briefing. */
export function BookBriefingDeep({
  briefing,
  baseHref,
}: {
  briefing: BookBriefing;
  baseHref: string;
}) {
  return (
    <div className="scr-brief-deep">
      {briefing.cast && briefing.cast.length > 0 && (
        <details className="scr-brief-block">
          <summary>
            <span>Who you will meet</span>
            <span className="scr-brief-count">{briefing.cast.length}</span>
          </summary>
          <dl className="scr-brief-cast">
            {briefing.cast.map((c) => (
              <div key={c.name}>
                <dt>{c.name}</dt>
                <dd>{c.who}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      {briefing.snags.length > 0 && (
        <details className="scr-brief-block">
          <summary>
            <span>What trips people up</span>
            <span className="scr-brief-count">{briefing.snags.length}</span>
          </summary>
          <ul className="scr-brief-snags">
            {briefing.snags.map((s) => (
              <li key={s.snag}>
                <p className="scr-brief-snag">{s.snag}</p>
                <p className="scr-brief-help">{s.help}</p>
              </li>
            ))}
          </ul>
        </details>
      )}

      {briefing.debates && briefing.debates.length > 0 && (
        <details className="scr-brief-block scr-brief-block--debate">
          <summary>
            <span>Where readers genuinely disagree</span>
            <span className="scr-brief-count">{briefing.debates.length}</span>
          </summary>
          <p className="scr-brief-debate-note">
            These are open questions, not settled ones. Each is laid out with the case for
            each side so you can weigh it yourself.
          </p>
          {briefing.debates.map((d) => (
            <div key={d.question} className="scr-brief-debate">
              <h3>{d.question}</h3>
              {d.settled && (
                <p className="scr-brief-settled">
                  <strong>Not in dispute:</strong> {d.settled}
                </p>
              )}
              <ol className="scr-brief-positions">
                {d.positions.map((p) => (
                  <li key={p.view}>
                    <p className="scr-brief-view">{p.view}</p>
                    <p className="scr-brief-grounds">{p.grounds}</p>
                  </li>
                ))}
              </ol>
              {d.soWhat && (
                <p className="scr-brief-sowhat">
                  <strong>Does it change how you read?</strong> {d.soWhat}
                </p>
              )}
            </div>
          ))}
        </details>
      )}

      {briefing.howToRead.length > 0 && (
        <details className="scr-brief-block">
          <summary>
            <span>How to actually read it</span>
            <span className="scr-brief-count">{briefing.howToRead.length}</span>
          </summary>
          <ul className="scr-brief-how">
            {briefing.howToRead.map((h) => (
              <li key={h.tip}>
                <p>{h.tip}</p>
                {h.refs && h.refs.length > 0 && (
                  <p className="scr-brief-refs">
                    {h.refs.map((ref) => {
                      const href = verseHref(baseHref, ref);
                      return href ? (
                        <Link key={ref} href={href} className="scr-brief-ref">
                          {ref}
                        </Link>
                      ) : (
                        <span key={ref} className="scr-brief-ref">
                          {ref}
                        </span>
                      );
                    })}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      {briefing.sources && briefing.sources.length > 0 && (
        <details className="scr-brief-block">
          <summary>
            <span>Where this comes from</span>
            <span className="scr-brief-count">{briefing.sources.length}</span>
          </summary>
          <ul className="scr-brief-sources">
            {briefing.sources.map((s) => (
              <li key={s.id} id={`briefing-source-${s.id}`}>
                <p className="scr-brief-source-label">
                  {s.href ? (
                    <Link href={s.href}>{s.label}</Link>
                  ) : s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  ) : (
                    s.label
                  )}
                </p>
                <p className="scr-brief-source-says">{s.says}</p>
              </li>
            ))}
          </ul>
        </details>
      )}

      <section className="scr-brief-next">
        <h2>When you finish</h2>
        <p>{briefing.next}</p>
      </section>

      {briefing.traditionNote && (
        <p className="scr-brief-tradition">
          <strong>Across traditions:</strong> {briefing.traditionNote}
        </p>
      )}
    </div>
  );
}
