import type { Metadata } from "next";
import Link from "next/link";
import { loadIsaiahClementInvestigation } from "@/lib/evidence/investigation-server";
import type { VerifiedExcerpt } from "@/lib/evidence/investigation-types";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Isaiah 53 in 1 Clement 16 — Source Investigation",
  description: "Compare named English editions, inspect exact source passages, and trace the evidence behind a reading of Christ's humility in 1 Clement 16.",
  alternates: { canonical: "/scriptures/investigations/isaiah-53-clement-16" },
};

function EvidenceCard({ excerpt }: { excerpt: VerifiedExcerpt }) {
  return (
    <article className={styles.card} id={excerpt.id}>
      <h3>{excerpt.label}</h3>
      <blockquote>{excerpt.exact}</blockquote>
      <Link href={excerpt.href} className="textlink">Read the source passage →</Link>
      <details>
        <summary>Read the full containing passage</summary>
        <p>{excerpt.context}</p>
      </details>
      <details>
        <summary>Inspect this quotation’s source check</summary>
        <dl>
          <dt>Passage identifier</dt><dd><code>{excerpt.passageId}</code></dd>
          <dt>Exact span in the passage</dt>
          <dd>{excerpt.selector.start}–{excerpt.selector.end} (end excluded; UTF-16 code units)</dd>
          <dt>Quotation SHA-256</dt><dd><code>{excerpt.selector.exactSha256}</code></dd>
        </dl>
      </details>
    </article>
  );
}

export default async function IsaiahClementInvestigationPage() {
  const packet = await loadIsaiahClementInvestigation();
  return (
    <article className={`prose-wrap ${styles.investigation}`}>
      <nav className="breadcrumbs" aria-label="Breadcrumbs">
        <Link href="/scriptures" className="crumb">Scriptures</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/scriptures/catena" className="crumb">Catena Aurea</Link>
      </nav>
      <header>
        <p className="kicker">A SOURCE INVESTIGATION</p>
        <h1>{packet.title}</h1>
        <p className={styles.question}>{packet.question}</p>
        <p>{packet.scope}</p>
        <p className={styles.status}>
          {packet.excerpts.length} excerpts match the hosted sources · Editorial draft
        </p>
        <p>Source checks confirm the quoted text and its location. The findings below are an editorial reading and have not received human approval.</p>
        <div className={styles.actions}>
          <Link className="textlink" href="/scriptures/read/isaiah-53-clement-16">Read this connection · Reading preview →</Link>
          <a className="textlink" href={`/investigations/${packet.id}.md`} download>Download research dossier (.md)</a>
          <a className="textlink" href={`/investigations/${packet.id}.json`} download>Download evidence packet (.json)</a>
        </div>
      </header>

      <section aria-labelledby="comparison-heading">
        <h2 id="comparison-heading">Read the passages together</h2>
        <p>The first pair compares the suffering language. The next pair preserves the introduction and application around Clement’s quotations.</p>
        <div className={styles.grid}>
          {packet.excerpts.map((excerpt) => <EvidenceCard key={excerpt.id} excerpt={excerpt} />)}
        </div>
      </section>

      <section aria-labelledby="findings-heading">
        <h2 id="findings-heading">What the evidence supports</h2>
        {packet.claims.map((claim) => (
          <article key={claim.id} className={styles.finding}>
            <p className="kicker">{claim.basis === "textual-observation" ? "TEXTUAL OBSERVATION" : "RECEPTION INTERPRETATION"}</p>
            <h3>{claim.statement}</h3>
            <p>{claim.limits}</p>
            <p>Evidence: {claim.evidenceIds.map((id, index) => (
              <span key={id}>{index > 0 && " · "}<a href={`#${id}`}>{packet.excerpts.find((excerpt) => excerpt.id === id)!.label}</a></span>
            ))}</p>
          </article>
        ))}
        <h3>The quotation’s source: editorial identification</h3>
        <p>{packet.relationship.citingWork} receives {packet.relationship.receivedPassage}.</p>
        <p>{packet.relationship.limits}</p>
      </section>

      <section aria-labelledby="sources-heading">
        <h2 id="sources-heading">Editions and provenance</h2>
        <p>These checks are tied to the hosted copies. The external source pages may change independently.</p>
        {packet.sources.map((source) => (
          <div key={source.id} className={styles.finding}>
            <h3>{source.edition}</h3>
            <p>{source.attribution} {source.rights}</p>
            <a className="textlink" href={source.upstreamUrl}>Consult the upstream source →</a>
            <details>
              <summary>Inspect the hosted snapshot</summary>
              <dl>
                <dt>Source identifier</dt><dd><code>{source.id}</code></dd>
                <dt>Hosted file</dt><dd><a href={source.artifact.replace(/^public/, "")}>{source.artifact}</a></dd>
                <dt>File SHA-256</dt><dd><code>{source.sha256}</code></dd>
              </dl>
            </details>
          </div>
        ))}
      </section>

      <section aria-labelledby="questions-heading">
        <h2 id="questions-heading">Questions for the next investigation</h2>
        <ul>{packet.openQuestions.map((question) => <li key={question}>{question}</li>)}</ul>
        <details>
          <summary>Reproduce the source checks</summary>
          <p>The downloadable JSON includes the source hashes, complete containing passages, quotation spans, and claim references. In the project, <code>npm run check:investigations</code> checks source bytes and ensures the exports match this investigation.</p>
          <p>{packet.verification.scope}</p>
          <p>Packet content SHA-256: <code>{packet.verification.contentHash}</code></p>
        </details>
      </section>
    </article>
  );
}
