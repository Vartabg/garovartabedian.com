import ReadingSearchReturn from "@/app/_components/reading/ReadingSearchReturn";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLibrary, getLibraryRecord } from "@/lib/early/library-server";
import { KIND_LABELS, recordHref, sectionHref } from "@/lib/early/library";
import { libraryFromHere } from "@/lib/early/from-here";
import FromHere from "@/app/_components/FromHere";
import CanonStatus from "../CanonStatus";

type Props = { params: Promise<{ edition: string }> };
export async function generateStaticParams() { return (await getLibrary()).map(r => ({ edition: r.id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getLibraryRecord((await params).edition);
  return r ? { title: `${r.title} · ${r.editionLabel}`, description: r.coverage, alternates: { canonical: recordHref(r) }, openGraph: { title: r.title, description: r.coverage, url: recordHref(r), type: "article" } } : {};
}
export default async function Edition({ params }: Props) {
  const r = await getLibraryRecord((await params).edition);
  if (!r) notFound();
  const related = (await getLibrary()).filter(other => other.workId === r.workId && other.id !== r.id);
  const groups = [...new Set(r.sections.map(s => s.context))];
  const isThomas = r.id === "gospel-thomas";
  const isJames = r.id === "secret-book-james";
  const firstText = r.sections.find(section => section.kind === "primary-text");
  const contents = r.sections.length > 0 && <section id="contents"><h2 className="jsu-chapter">Contents</h2><p className="scr-meta">Headings and locators follow this edition. Large sections continue across labelled reading parts. Commentary is identified separately.</p>{groups.map((context, index) => <details className="ew-library-contents" key={context} open={groups.length === 1 || index === 0}><summary>{context || "Opening and sections"}</summary><ol>{r.sections.filter(s => s.context === context).map(s => <li key={s.id}><Link href={sectionHref(r, s)} prefetch={false}>{s.label}</Link><small> · {KIND_LABELS[s.kind]}</small></li>)}</ol></details>)}</section>;
  return <article className="world-reading-page ew-reading-page">
    <ReadingSearchReturn />
    <p className="kicker"><Link href="/early/library">The library</Link></p>
    <FromHere label={r.title} links={libraryFromHere(r.existingTextId)} />
    <h1>{r.title}</h1><p className="lede">{r.editionLabel}</p>
    <CanonStatus record={r} />
    <p className="ew-library-status">{r.publicationStatus === "published" ? "Readable historical edition" : r.publicationStatus === "deferred" ? "Full text not acquired" : "Reference only — no text hosted"}</p>
    <p>{r.coverage}</p>
    {isThomas && firstText && <section aria-labelledby="read-thomas">
      <h2 id="read-thomas" className="jsu-chapter">Read the Gospel of Thomas</h2>
      <p>The prologue and all 114 sayings are available here. Each opens on its own reading page; use Next to continue.</p>
      <p><Link className="textlink" href={sectionHref(r, firstText)}>Start reading →</Link></p>
      <p><Link href={`${recordHref(r)}/saying-1`}>Go to Saying 1</Link> · <a href="#contents">Choose a saying</a> · <a href="#edition-source">Edition and sources</a></p>
    </section>}
    {isJames && firstText && <section aria-labelledby="read-james">
      <h2 id="read-james" className="jsu-chapter">Read the Secret Book of James</h2>
      <p>Read from the salutation, or choose a section below. Use Next to continue.</p>
      <p><Link className="textlink" href={sectionHref(r, firstText)}>Start reading →</Link> · <a href="#contents">Choose a section</a> · <a href="#edition-source">Edition and sources</a></p>
    </section>}
    {(isThomas || isJames) && contents}
    {r.caution && <aside className="world-survival" aria-label="Edition limitations"><p>{r.caution}</p></aside>}
    {r.provenance.map(note => <p key={note}>{note}</p>)}
    {!isThomas && !isJames && (r.reuseExistingText ? <p><Link className="textlink" href={`/early/${r.existingTextId}`}>Read the existing translation →</Link></p> : r.sections[0] && <p><Link className="textlink" href={sectionHref(r, r.sections[0])}>Start reading →</Link></p>)}
    <p><Link href={`/early/search?record=${r.id}`}>Search this edition or source record</Link></p>
    {r.existingTextId && <p><Link href={`/early/${r.existingTextId}`}>Open the existing site edition</Link> — its original translation, imagery and saved passage links remain available.</p>}
    {related.length > 0 && <aside className="world-survival"><h2 className="jsu-chapter">Other parts or witnesses of this work</h2><ul>{related.map(other => <li key={other.id}><Link href={recordHref(other)}>{other.title} · {other.editionLabel}</Link></li>)}</ul><p>These entries share a work identity. Different versions and fragments remain distinct.</p></aside>}
    <section aria-labelledby="edition-source"><h2 id="edition-source" className="jsu-chapter">Edition and sources</h2>
      <dl className="ew-library-metadata"><dt>Edition / translator</dt><dd>{r.edition}</dd><dt>Edition date</dt><dd>{r.editionDate ?? "See the edition statement; no additional date asserted."}</dd><dt>Ancient composition</dt><dd>{r.compositionDate ?? r.compositionNote}</dd><dt>Language of acquired text</dt><dd>{r.language}</dd><dt>Public access</dt><dd>{r.publicationReason}</dd></dl>
      {r.witnesses.length > 0 && <><h3>Versions and manuscript witnesses</h3><ul>{r.witnesses.map(w => <li key={w}>{w}</li>)}</ul></>}
      <ul>{r.sourceUrls.map((url, i) => <li key={url}><a href={url} rel="noreferrer">{r.rightsProfile === "unproofread-scan" && i === 0 ? "Open the source scan" : `Source ${i + 1}`} · {new URL(url).hostname}</a></li>)}</ul>
      <details><summary>Rights and provenance record</summary><p>{r.rightsReview.decision}</p><p>Acquired source rights statement: {r.sourceRights}</p><ul>{r.rightsReview.evidence.map(url => <li key={url}><a href={url}>{url}</a></li>)}</ul>{r.sourceSha256 && <p className="ew-source-hash">Source SHA-256: <code>{r.sourceSha256}</code></p>}{r.sourcePdfSha256 && <p className="ew-source-hash">Reference PDF SHA-256: <code>{r.sourcePdfSha256}</code></p>}<p>Work: <code>{r.workId}</code> · edition: <code>{r.editionId ?? "unacquired"}</code>. {isJames ? "Reviewed 27 October 2026." : "Reviewed 14 September 2026."}</p></details>
    </section>
    {!isThomas && !isJames && contents}
  </article>;
}
