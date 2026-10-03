import type { JesusHistorySource } from "@/lib/jesus/types";

export default function HistorySources({ sources }: { sources: JesusHistorySource[] }) {
  if (!sources || sources.length === 0) return null;

  // Group sources by category
  const categories = Array.from(new Set(sources.map((s) => s.category || "General Research"))).sort();

  return (
    <section className="jsu-history-shelf" id="research-corpus">
      <h2 className="jsu-lane">Extended Research Corpus</h2>
      <p className="scr-meta">
        Tiered academic and archaeological bibliography ({sources.length} evaluated records), tracking primary texts, excavation reports, peer-reviewed scholarship, and contextual studies.
      </p>

      <div className="jsu-sources-container">
        {categories.map((category) => {
          const catSources = sources.filter((s) => (s.category || "General Research") === category);
          return (
            <div key={category} className="jsu-sources-category-block">
              <h3 className="jsu-sources-category-title">{category} ({catSources.length})</h3>
              <div className="jsu-sources-list">
                {catSources.map((source) => (
                  <article key={source.id} className="jsu-source-item">
                    <div className="jsu-source-main">
                      <div className="jsu-source-badge-row">
                        <span className={`jsu-source-tier jsu-tier-${source._tier?.toLowerCase() || "b"}`}>
                          Tier {source._tier || "B"}
                        </span>
                        <span className="jsu-source-type">{source.source_type}</span>
                        {source.year && <span className="jsu-source-year">{source.year}</span>}
                      </div>

                      <h4 className="jsu-source-title">
                        {source.url ? (
                          <a href={source.url} target="_blank" rel="noopener noreferrer">
                            {source.clean_title}
                            <span className="jsu-source-ext" aria-hidden="true"> ↗</span>
                          </a>
                        ) : (
                          source.clean_title
                        )}
                      </h4>

                      {source.author && <p className="jsu-source-author">Author/Archive: {source.author}</p>}
                      {source._tier_rationale && (
                        <p className="jsu-source-rationale">{source._tier_rationale}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
