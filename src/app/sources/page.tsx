import type { Metadata } from "next";
import { ButtonLink } from "@/app/_components/Button";
import CleanChrome from "../_components/CleanChrome";
import { SOURCE_GROUPS } from "@/lib/source-guidance";

const DESCRIPTION =
  "A human-readable source map for the Scripture, Jesus, Apostles, Writings, Church, Angels, Bible-ownership, and How We Know worlds on garovartabedian.com.";

export const metadata: Metadata = {
  title: "Sources",
  description: DESCRIPTION,
  alternates: { canonical: "/sources" },
  openGraph: {
    title: "Sources — Garo Vartabedian",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "website",
  },
};

export default function SourcesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Sources",
    description: DESCRIPTION,
    url: "https://garovartabedian.com/sources",
    hasPart: SOURCE_GROUPS.map((group) => ({
      "@type": "CreativeWork",
      name: group.title,
      description: group.summary,
      url: `https://garovartabedian.com/sources#${group.id}`,
    })),
  };

  return (
    <CleanChrome showWorldSwitcher={false} activeHref="/sources">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="kicker">Sources</p>
      <h1>What this site is built from.</h1>
      <p className="lede">
        This is the audit trail for the eight research worlds. The individual
        pages keep source links beside the exact claims; this page explains the
        source standard and gives representative records for each world.
      </p>
      <p>
        Claim-level links prioritize original texts and objects, courts,
        museums, universities, public archives, and rights holders. Broad
        reference works are used for orientation, while disputed or
        single-source records are labeled rather than presented as settled.
      </p>

      <nav className="source-index" aria-label="Source sections">
        {SOURCE_GROUPS.map((group) => (
          <a key={group.id} href={`#${group.id}`}>
            {group.title}
          </a>
        ))}
      </nav>

      <div className="source-page-grid">
        {SOURCE_GROUPS.map((group) => (
          <section className="source-group" id={group.id} key={group.id}>
            <p className="source-group-kicker">Source group</p>
            <h2>{group.title}</h2>
            <p>{group.summary}</p>

            <h3>Method</h3>
            <ul className="source-method">
              {group.method.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3>Representative records</h3>
            <ul className="source-links">
              {group.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target={link.href.startsWith("/") ? undefined : "_blank"}
                    rel={link.href.startsWith("/") ? undefined : "noopener noreferrer"}
                  >
                    {link.label}
                  </a>
                  <span className="source-pill">{link.kind}</span>
                  <p>{link.note}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="card source-build-card" aria-labelledby="source-build-title">
        <h2 id="source-build-title">How this audit trail was built</h2>
        <p>
          The source layer is part of the site&rsquo;s engineering proof: shared
          source data, reusable source-basis blocks, static route generation,
          and browser-verified pages.
        </p>
        <p className="cta-row">
          <ButtonLink variant="ghost" href="/work/garovartabedian">
            Read the site case study
          </ButtonLink>
        </p>
      </section>
    </CleanChrome>
  );
}
