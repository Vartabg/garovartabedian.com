import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllBeliefSystems,
  getBeliefSystem,
  getBereanDossierLayers,
  getCrossWorldLinks,
  TRADITION_FAMILY_LABELS,
  formatAntiquityAge,
  CONNECTION_LABELS,
} from "@/lib/evidence/afterlife";

export async function generateStaticParams() {
  const beliefs = getAllBeliefSystems();
  return beliefs.map((b) => ({ slug: b.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const belief = getBeliefSystem(slug);
  if (!belief) return { title: "Tradition Not Found" };

  return {
    title: `${belief.name} — The Afterlife Atlas`,
    description: belief.description,
    alternates: { canonical: `/evidence/frameworks/${slug}` },
  };
}

export default async function TraditionDossierPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const belief = getBeliefSystem(slug);

  if (!belief) {
    notFound();
  }

  const layers = getBereanDossierLayers(belief);
  const familyLabel = TRADITION_FAMILY_LABELS[belief.taxonomy.family] || belief.taxonomy.family;
  const ageLabel = formatAntiquityAge(belief.tactics.antiquityAge);
  const crossWorldLinks = getCrossWorldLinks(belief.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    name: `${belief.name} Dossier — The Afterlife Atlas`,
    headline: belief.primaryDoctrine,
    description: belief.description,
    inLanguage: "en-US",
    about: [
      { "@type": "Thing", name: "Eschatology" },
      { "@type": "Thing", name: belief.metadata.origin },
    ],
    isPartOf: {
      "@type": "CollectionPage",
      name: "The Afterlife Atlas: 54 World Traditions",
      url: "https://garovartabedian.com/evidence/frameworks",
    },
  };

  return (
    <div className="hw-dossier-container" style={{ maxWidth: "58rem", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="hw-dossier-header" style={{ marginBottom: "2rem" }}>
        <p className="hw-kicker">
          <Link href="/evidence/frameworks">← The Afterlife Atlas</Link> · {familyLabel}
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", margin: "0.25rem 0 0.5rem", letterSpacing: "-0.02em" }}>
          {belief.name}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", margin: 0 }}>
          Origin: <strong>{belief.metadata.origin}</strong> · Attested era: <strong>{ageLabel}</strong>
        </p>
      </header>

      <section className="hw-dossier-hero">
        <div className="hw-dossier-media">
          <Image
            src={belief.visualAssets.immersiveView || belief.visualAssets.thumbnail}
            alt={belief.name}
            width={720}
            height={450}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />
        </div>

        <div className="hw-dossier-intro">
          <h2 style={{ fontSize: "1.25rem", margin: "0 0 0.75rem", color: "var(--accent)" }}>
            Primary Doctrine
          </h2>
          <p style={{ fontSize: "1rem", lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
            {belief.primaryDoctrine}
          </p>
        </div>
      </section>

      <section className="hw-dossier-layers" aria-label="Four-step epistemological inquiry">
        {/* Layer 01: Observed */}
        <article className="hw-dossier-layer hw-layer-observed">
          <div className="hw-dossier-layer-kicker">Layer 01 · Observed (The Physical & Textual Soil)</div>
          <h3 style={{ margin: "0 0 0.5rem" }}>Primary Manuscripts and Funerary Ground</h3>
          <p style={{ margin: "0 0 0.75rem", color: "var(--muted)", fontSize: "0.9rem" }}>
            {layers.observed.geography}
          </p>

          <h4 style={{ fontSize: "0.85rem", margin: "0.75rem 0 0.35rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Key Source Texts
          </h4>
          <ul style={{ paddingLeft: "1.2rem", margin: "0 0 0.75rem", fontSize: "0.88rem", color: "var(--ink)" }}>
            {layers.observed.texts.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>

          {layers.observed.features.length > 0 && (
            <>
              <h4 style={{ fontSize: "0.85rem", margin: "0.75rem 0 0.35rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Sacred Geography & Physical Relics
              </h4>
              <ul style={{ paddingLeft: "1.2rem", margin: 0, fontSize: "0.88rem", color: "var(--ink)" }}>
                {layers.observed.features.map((feat, i) => (
                  <li key={i}>{feat}</li>
                ))}
              </ul>
            </>
          )}
        </article>

        {/* Layer 02: Inferred */}
        <article className="hw-dossier-layer hw-layer-inferred">
          <div className="hw-dossier-layer-kicker">Layer 02 · Inferred (Eschatological Geography)</div>
          <h3 style={{ margin: "0 0 0.5rem" }}>The Architecture Beyond the Veil</h3>
          <p style={{ margin: "0 0 0.75rem", lineHeight: 1.6 }}>{layers.inferred.journey}</p>

          <h4 style={{ fontSize: "0.85rem", margin: "0.75rem 0 0.35rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Structural Ordering
          </h4>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "var(--muted)" }}>
            {layers.inferred.structure}
          </p>

          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {layers.inferred.patterns.map((pat, i) => (
              <span key={i} className="hw-atlas-pattern-tag" style={{ fontWeight: 600 }}>
                {pat}
              </span>
            ))}
          </div>
        </article>

        {/* Layer 03: Interpreted */}
        <article className="hw-dossier-layer hw-layer-interpreted">
          <div className="hw-dossier-layer-kicker">Layer 03 · Interpreted (Cosmic Meaning & Guides)</div>
          <h3 style={{ margin: "0 0 0.5rem" }}>Spiritual Figures and Cultural Meaning</h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", margin: "0.75rem 0" }}>
            {layers.interpreted.figures.map((fig, i) => (
              <div key={i} style={{ padding: "0.75rem", background: "color-mix(in srgb, var(--surface) 95%, var(--bg))", borderRadius: "8px", border: "1px solid var(--line)" }}>
                <strong style={{ display: "block", fontSize: "0.95rem" }}>{fig.name}</strong>
                <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{fig.role}</span>
              </div>
            ))}
          </div>

          <h4 style={{ fontSize: "0.85rem", margin: "0.75rem 0 0.35rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Visual and Ritual Motifs
          </h4>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>
            {layers.interpreted.motifs.join(" · ")}
          </p>
        </article>

        {/* Layer 04: The Stated Limit */}
        <article className="hw-dossier-layer hw-layer-limit">
          <div className="hw-dossier-layer-kicker">Layer 04 · Stated Limit (The Epistemic Boundary)</div>
          <h3 style={{ margin: "0 0 0.5rem" }}>Where Observation Stops</h3>
          <p style={{ margin: 0, lineHeight: 1.6, color: "var(--ink)", fontStyle: "italic" }}>
            {layers.limit}
          </p>
        </article>
      </section>

      {/* Cross-World Research Lanes (Deep linking across the 8 worlds) */}
      {crossWorldLinks.length > 0 && (
        <section className="hw-dossier-cross-world" style={{ margin: "3rem 0", padding: "1.5rem", border: "1px solid var(--accent)", borderRadius: "12px", background: "color-mix(in srgb, var(--accent) 4%, var(--surface))" }}>
          <p className="hw-kicker" style={{ color: "var(--accent)" }}>Inter-World Connections</p>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.3rem" }}>Research Lanes Across garovartabedian.com</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0 0 1.25rem", lineHeight: 1.5 }}>
            This tradition intersects with primary texts, historical councils, and translation disputes across the canonical worlds.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            {crossWorldLinks.map((link, idx) => (
              <article key={idx} style={{ padding: "1rem", borderRadius: "8px", background: "var(--surface)", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 800, color: "var(--accent)", letterSpacing: "0.08em" }}>
                  {link.world}
                </span>
                <h4 style={{ margin: "0.25rem 0 0.35rem", fontSize: "0.95rem" }}>
                  <Link href={link.href} style={{ color: "var(--ink)", textDecoration: "none", fontWeight: 600 }}>
                    {link.label} ↗
                  </Link>
                </h4>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.45 }}>
                  {link.rationale}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Long-form historical narrative disclosure (Progressive enhancement: works without JS) */}
      {belief.essay && (
        <details className="hw-disclosure" style={{ margin: "2.5rem 0", padding: "1.25rem", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "12px" }}>
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "1.05rem", color: "var(--ink)" }}>
            In-Depth Historical Narrative & Synthesis (Read More)
          </summary>
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--line)" }}>
            <p style={{ lineHeight: 1.7, color: "var(--ink)", whiteSpace: "pre-line", margin: 0 }}>
              {belief.essay}
            </p>
          </div>
        </details>
      )}

      {/* Connected Traditions */}
      {belief.connections && belief.connections.length > 0 && (
        <section className="hw-dossier-connections">
          <h3 style={{ margin: "0 0 0.25rem" }}>Neighboring and Connected Traditions</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0 }}>
            Historical influences, theological contrasts, and shared structural motifs.
          </p>

          <div className="hw-connections-grid">
            {belief.connections.map((conn, i) => {
              const target = getBeliefSystem(conn.targetId);
              const label = CONNECTION_LABELS[conn.type] || conn.type;
              return (
                <article key={i} className="hw-connection-card">
                  <span className="hw-connection-type">{label}</span>
                  <h4 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>
                    {target ? (
                      <Link href={`/evidence/frameworks/${target.id}`}>{target.name}</Link>
                    ) : (
                      conn.targetId
                    )}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--muted)", lineHeight: 1.45 }}>
                    {conn.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
