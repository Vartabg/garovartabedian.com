import Link from "next/link";
import type { EvidenceData, EvidenceLayerId } from "@/lib/evidence/types";
import type { Claim } from "@/lib/evidence/claims";
import ClaimIndex from "./ClaimIndex";
import SourceBasis from "../_components/SourceBasis";
import WorldEntry from "../_components/WorldEntry";
import WorldHomeHero from "../_components/WorldHomeHero";

const LAYER_MARK: Record<EvidenceLayerId, string> = {
  observed: "01",
  inferred: "02",
  interpreted: "03",
};

const STATUS_LABEL = {
  next: "Build next",
  queued: "Research queue",
  later: "Later inquiry",
} as const;

export default function EvidenceHome({
  data,
  claims,
}: {
  data: EvidenceData;
  claims: Claim[];
}) {
  const [primaryInvestigation, ...laterInvestigations] =
    data.faithScience.docket;

  return (
    <>
      <WorldHomeHero
        world="evidence"
        eyebrow={data.title}
        title="Follow the claim."
        facets={["Source", "Evidence", "Inference", "Interpretation", "Limit"]}
      >
        Before asking whether a claim is convincing, ask what kind of claim it
        is. This world keeps text, stone, witness, experiment, argument, and
        tradition distinct—then shows exactly where they meet.
      </WorldHomeHero>

      <WorldEntry
        eyebrow="A world about method"
        href="#claim-lab"
        title="How does a claim become knowledge?"
        note="Start with a real claim. Open its record, inspect the reasoning, and stop exactly where the evidence stops."
        action="Test the first claim"
        paths={[
          {
            href: "#method",
            label: "Learn the four-step loop",
            note: "Observation, inference, interpretation, and limit.",
            meta: "Method",
          },
          {
            href: "#rooms",
            label: "Choose an evidence lens",
            note: "Eight questions for text, stone, witnesses, experiments, and more.",
            meta: "Lenses",
          },
          {
            href: "#source-map",
            label: "Trace the sources",
            note: "See which records can answer which kinds of questions.",
            meta: "Provenance",
          },
        ]}
      />

      <section
        className="hw-claim-lab"
        id="claim-lab"
        aria-labelledby="hw-claim-title"
      >
        <header className="hw-claim-header">
          <div>
            <p className="hw-kicker">Start here · The Claim Lab</p>
            <h2 id="hw-claim-title">Take one claim apart.</h2>
            <p>
              Each case moves through the same three checkpoints. Open only the
              case you want to investigate.
            </p>
          </div>
          <span>{data.claimLab.length} cases</span>
        </header>

        <div className="hw-case-list">
          {data.claimLab.map((item, index) => (
            <details
              className="hw-case"
              id={item.id}
              key={item.id}
              name="claim-lab"
              open={index === 0}
            >
              <summary>
                <span className="hw-case-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="hw-case-summary">
                  <span>
                    {item.world} · {item.mode}
                  </span>
                  <strong>{item.title}</strong>
                  <small>{item.question}</small>
                </span>
                <span className="hw-case-toggle" aria-hidden="true">
                  +
                </span>
              </summary>

              <div className="hw-case-panel">
                <ol className="hw-claim-path">
                  <li>
                    <span>Record</span>
                    <p>{item.record}</p>
                  </li>
                  <li>
                    <span>Bridge</span>
                    <p>{item.inference}</p>
                  </li>
                  <li>
                    <span>Boundary</span>
                    <p>{item.limit}</p>
                  </li>
                </ol>
                <Link href={item.href}>
                  {item.action} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </details>
          ))}
        </div>
      </section>

      <ClaimIndex claims={claims} />

      <section className="hw-method" id="method" aria-labelledby="hw-method-title">
        <div className="hw-section-heading">
          <p className="hw-kicker">The method</p>
          <h2 id="hw-method-title">One loop. Four disciplines.</h2>
          <p>
            A credible conclusion shows what is present, how the reasoning
            moves, where meaning enters, and where certainty ends.
          </p>
        </div>

        <div className="hw-method-frame">
          <ol className="hw-loop" aria-label="Four stages of a claim">
            {data.layers.map((layer) => (
              <li className={`is-${layer.id}`} key={layer.id}>
                <span className="hw-loop-number">{LAYER_MARK[layer.id]}</span>
                <span className="hw-loop-kind">{layer.label}</span>
                <h3>{layer.question}</h3>
                <p>{layer.text}</p>
              </li>
            ))}
            <li className="is-limit">
              <span className="hw-loop-number">04</span>
              <span className="hw-loop-kind">Limit</span>
              <h3>What can this not establish?</h3>
              <p>
                The nearest unsupported conclusion is named instead of being
                smuggled across the boundary.
              </p>
            </li>
          </ol>

          <aside className="hw-charter" aria-labelledby="hw-charter-title">
            <p className="hw-kicker" id="hw-charter-title">
              Rules in force
            </p>
            <ul>
              {data.charter.map((rule, index) => (
                <li key={rule.title}>
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{rule.title}</strong>
                    <p>{rule.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="hw-rooms" id="rooms" aria-labelledby="hw-rooms-title">
        <div className="hw-section-heading">
          <p className="hw-kicker">Eight evidence lenses</p>
          <h2 id="hw-rooms-title">Choose the question you need.</h2>
          <p>
            Each lens changes what counts as useful evidence. Open one to see
            where that discipline is already working elsewhere on the site.
          </p>
        </div>

        <div className="hw-room-grid">
          {data.rooms.map((room, index) => (
            <Link
              className={`hw-room-card is-${room.id}`}
              href={room.href}
              key={room.id}
            >
              <header>
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{room.label}</span>
                <span aria-hidden="true">↗</span>
              </header>
              <h3>{room.question}</h3>
              <p>{room.text}</p>
              <strong>{room.action}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="hw-source-map"
        id="source-map"
        aria-labelledby="hw-source-map-title"
      >
        <div className="hw-section-heading">
          <p className="hw-kicker">The source map</p>
          <h2 id="hw-source-map-title">Use each source for its own job.</h2>
          <p>
            A manuscript, artifact, court opinion, experiment, and creed answer
            different questions. Follow a lane to inspect its provenance.
          </p>
        </div>

        <div className="hw-source-lanes">
          {data.sourceLanes.map((lane, index) => (
            <Link href={lane.href} key={lane.href}>
              <span aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <strong>{lane.label}</strong>
              <small>{lane.note}</small>
              <em aria-hidden="true">↗</em>
            </Link>
          ))}
        </div>

        <SourceBasis id="evidence-method" />
      </section>

      <section
        className="hw-faith-science"
        id="faith-science"
        aria-labelledby="hw-faith-science-title"
      >
        <div className="hw-faith-science-intro">
          <div className="hw-section-heading">
            <p className="hw-kicker">A secondary investigation lane</p>
            <h2 id="hw-faith-science-title">{data.faithScience.title}</h2>
            <p>{data.faithScience.lede}</p>
          </div>
          <blockquote>{data.faithScience.principle}</blockquote>
        </div>

        {primaryInvestigation && (
          <article className="hw-next-investigation">
            <div>
              <span>{STATUS_LABEL[primaryInvestigation.status]}</span>
              <h3>{primaryInvestigation.title}</h3>
            </div>
            <div>
              <p>{primaryInvestigation.question}</p>
              <strong>{primaryInvestigation.boundary}</strong>
            </div>
          </article>
        )}

        <details className="hw-disclosure hw-secondary-docket">
          <summary>
            <span>
              <strong>Research docket</strong>
              <small>{laterInvestigations.length} more questions</small>
            </span>
            <span aria-hidden="true">+</span>
          </summary>
          <div className="hw-docket-grid">
            {laterInvestigations.map((item, index) => (
              <article className={`hw-docket-card is-${item.status}`} key={item.id}>
                <header>
                  <span>{String(index + 2).padStart(2, "0")}</span>
                  <em>{STATUS_LABEL[item.status]}</em>
                </header>
                <h3>{item.title}</h3>
                <p>{item.question}</p>
                <footer>{item.boundary}</footer>
              </article>
            ))}
          </div>
        </details>

        <details className="hw-disclosure hw-research-basis">
          <summary>
            <span>
              <strong>Source foundations</strong>
              <small>{data.sources.length} scientific, philosophical, and confessional records</small>
            </span>
            <span aria-hidden="true">+</span>
          </summary>
          <div>
            <ul>
              {data.sources.map((source) => (
                <li key={source.id}>
                  <a href={source.href} target="_blank" rel="noopener noreferrer">
                    <span>{source.kind}</span>
                    <strong>{source.label}</strong>
                    <small>{source.organization}</small>
                  </a>
                </li>
              ))}
            </ul>
            <Link href="/sources#how-we-know">Read the full source method →</Link>
          </div>
        </details>
      </section>

      <section className="hw-comparative-suite" id="comparative-inquiries" aria-labelledby="hw-comparative-title">
        <div className="hw-section-heading">
          <p className="hw-kicker">Comparative & Non-Christian Inquiry</p>
          <h2 id="hw-comparative-title">Research the world beyond our borders.</h2>
          <p>
            Honest inquiry does not hide competing models. We analyze comparative religions, ancient near-eastern rivals, consciousness anomalies, and philosophical frameworks through the exact same four-layer Berean lens.
          </p>
        </div>

        <div className="hw-comparative-grid">
          <article className="hw-comparative-card">
            <span className="hw-comparative-badge">Live Research Portal</span>
            <h3>
              <Link href="/evidence/frameworks">The Afterlife Atlas</Link>
            </h3>
            <p>
              A source-led comparative register of 54 afterlife frameworks across world religions, ancient myths, and modern philosophies—tested against observation, inference, and limit.
            </p>
            <Link href="/evidence/frameworks" className="hw-comparative-cta">
              Explore 54 Traditions ↗
            </Link>
          </article>

          <article className="hw-comparative-card">
            <span className="hw-comparative-badge">Research Docket</span>
            <h3>Consciousness & Empirical Anomalies</h3>
            <p>
              Cross-cultural near-death experience (NDE) variations, terminal lucidity, physicalist brain models, and grief tech / digital resurrection inquiries.
            </p>
            <span className="scr-meta">Inquiry Docket · Berean Lens</span>
          </article>

          <article className="hw-comparative-card">
            <span className="hw-comparative-badge">Research Docket</span>
            <h3>The Neighboring Ancient World</h3>
            <p>
              Mesopotamian, Egyptian, Greek Orphic, and Second Temple apocalyptic texts that formed the cultural horizon around biblical writers.
            </p>
            <span className="scr-meta">Inquiry Docket · Ancient Texts</span>
          </article>

          <article className="hw-comparative-card">
            <span className="hw-comparative-badge">Research Docket</span>
            <h3>Rival Epistemologies</h3>
            <p>
              How physicalism, classical theism, and Eastern non-dualism define proof, observation, and truth—kept side by side without caricature.
            </p>
            <span className="scr-meta">Inquiry Docket · Method & Logic</span>
          </article>
        </div>
      </section>

      <blockquote className="hw-close">
        The point is not to make every claim certain. It is to make every step
        visible.
      </blockquote>
    </>
  );
}
