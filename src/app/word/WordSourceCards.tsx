import type { WordLedgerSource } from "@/lib/word/types";

const KIND_LABEL = {
  "rights-holder": "Rights holder",
  "public-domain": "Public-domain record",
  license: "License / policy",
  archive: "Historical record",
  "research-placeholder": "Research queue",
} as const;

export default function WordSourceCards({
  sources,
}: {
  sources: WordLedgerSource[];
}) {
  return (
    <section className="word-source-section" id="word-sources" aria-labelledby="word-sources-title">
      <div className="word-section-heading">
        <div>
          <p className="word-section-kicker">Source cards</p>
          <h3 id="word-sources-title">Open the record behind this entry.</h3>
        </div>
        <span>{sources.length} source{sources.length === 1 ? "" : "s"}</span>
      </div>

      <div className="word-source-grid">
        {sources.map((source) => {
          const isInternal = source.href.startsWith("/");
          return (
            <article
              className={`word-source-card is-${source.status}`}
              id={`word-source-${source.id}`}
              key={source.id}
            >
              <header>
                <span className="word-source-kind">{KIND_LABEL[source.kind]}</span>
                <span className={`word-status word-status--${source.status}`}>
                  {source.status === "placeholder" ? "Not yet verified" : "Checked"}
                </span>
              </header>
              <h4>{source.label}</h4>
              <p className="word-source-org">{source.organization}</p>
              <p>{source.note}</p>
              <a
                className="textlink word-source-link"
                href={source.href}
                target={isInternal ? undefined : "_blank"}
                rel={isInternal ? undefined : "noopener noreferrer"}
              >
                {isInternal ? "Open source method" : "Open source record"}
                <span aria-hidden="true"> ↗</span>
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
