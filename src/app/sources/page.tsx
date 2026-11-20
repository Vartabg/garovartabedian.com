import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/app/_components/Button";
import CleanChrome from "../_components/CleanChrome";
import HashDisclosureOpener from "../_components/HashDisclosureOpener";
import { SOURCE_GROUPS } from "@/lib/source-guidance";
import { WORLD_GUIDES } from "@/lib/world-guidance";

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

      <HashDisclosureOpener />
      <div className="source-page-grid">
        {SOURCE_GROUPS.map((group) => {
          const world = Object.values(WORLD_GUIDES).find(
            (guide) => guide.source.href === `/sources#${group.id}`,
          );
          return (
            <details className="source-group" id={group.id} key={group.id}>
              <summary>
                <h2>{group.title}</h2>
                <span className="source-group-count">
                  {group.links.length}
                  <span className="sr-fallback"> records</span>
                </span>
                <span className="source-group-chevron" aria-hidden="true" />
                <span className="source-group-names">
                  {group.links.slice(0, 3).map((link) => link.label).join(", ")}
                  {group.links.length > 3 ? "…" : ""}
                </span>
              </summary>
              <p>{group.summary}</p>
              {world && (
                <p className="source-world-link">
                  <Link href={world.base} className="textlink">
                    Explore {world.label} <span aria-hidden="true">→</span>
                  </Link>
                </p>
              )}

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
            </details>
          );
        })}
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
