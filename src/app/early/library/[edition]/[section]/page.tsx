import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Fragment } from "react";
import { getLibrary, getLibraryPage, getLibraryRecord } from "@/lib/early/library-server";
import { KIND_LABELS, recordHref, sectionHref, type LibraryPage } from "@/lib/early/library";
import ReadingSurface, { ReadingTools } from "../../../../_components/reading/ReadingSurface";
import SourceNote from "../../../../_components/reading/SourceNote";
import FormattedText, { ReadingLayoutNote } from "../../../../_components/reading/FormattedText";
import CitationCopy from "../../CitationCopy";

type Props = { params: Promise<{ edition: string; section: string }> };
export const dynamic = "force-static";
// First section is prebuilt; the remaining bounded pages are generated and cached on demand.
export async function generateStaticParams() { return (await getLibrary()).filter(r => r.sections.length).map(r => ({ edition: r.id, section: r.sections[0].id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { edition, section } = await params;
  const r = await getLibraryRecord(edition), s = r?.sections.find(s => s.id === section);
  return r && s ? { title: `${r.title} · ${s.label}`, description: `${r.editionLabel}. ${KIND_LABELS[s.kind]}. ${r.coverage}`, alternates: { canonical: sectionHref(r, s) }, openGraph: { title: `${r.title} · ${s.label}`, url: sectionHref(r, s), type: "article" } } : {};
}

function NoteText({ text, notes }: { text: string; notes: LibraryPage["notes"] }) {
  return text.split(/(\[\^[^\]]+\])/g).map((part, index) => {
    const match = /^\[\^([^\]]+)\]$/.exec(part);
    const note = match && notes[match[1]];
    return note ? <sup key={index}><SourceNote label={`Edition note ${Object.keys(notes).indexOf(match[1]) + 1}`} annotation={{ role: "interpretation", title: "Edition note", href: note.text ? `#annotation-${match[1]}` : note.href, sourceHref: note.href, provenance: "edition", review: "not-applicable" }}><p>This note belongs to the translator or historical editor, not to the ancient author.</p>{note.text && <blockquote>{note.text}</blockquote>}</SourceNote></sup> : <Fragment key={index}>{part}</Fragment>;
  });
}
export default async function Reading({ params }: Props) {
  const { edition, section } = await params;
  const r = await getLibraryRecord(edition), page = await getLibraryPage(edition, section);
  if (!r || !page) notFound();
  const index = r.sections.findIndex(s => s.id === section), previous = r.sections[index - 1], next = r.sections[index + 1];
  const citation = `${r.title}, ${page.label}. ${r.editionLabel}. ${KIND_LABELS[page.kind]}. https://garovartabedian.com${sectionHref(r, page)}`;
  const pager = <nav className="ew-era-pager ew-library-pager" aria-label="Reading sections">{previous ? <Link href={sectionHref(r, previous)} prefetch={false} rel="prev">← Previous<span>{previous.label}</span></Link> : <span />}<Link href={`${recordHref(r)}#contents`}>Contents<span>{index + 1} of {r.sections.length}</span></Link>{next ? <Link href={sectionHref(r, next)} prefetch={false} rel="next">Next →<span>{next.label}</span></Link> : <span />}</nav>;
  return <ReadingSurface className="world-reading-page ew-reading-page" hasTrace={Object.keys(page.notes).length > 0}>
    <p className="kicker"><Link href="/early/library">The library</Link> · <Link href={recordHref(r)}>Edition and sources</Link></p>
    <h1>{r.title}</h1><p className="world-cite">{r.editionLabel} · {KIND_LABELS[page.kind]}</p>
    <ReadingTools />
    <ReadingLayoutNote />
    {pager}
    <section className="ew-section" aria-labelledby="reading-heading"><h2 id="reading-heading" className="jsu-chapter">{page.label} <NoteText text={page.headingNoteRefs} notes={page.notes} /></h2>
      <p className="scr-meta">Read in this edition: source locators and uncertainty marks are retained. Square brackets can mark gaps or editorial interventions; headings and supplied subtitles belong to the edition. <Link href={recordHref(r)}>Coverage and cautions</Link></p>
      {page.blocks.map((block, i) => <div className={block.kind === "commentary" ? "ew-edition-note" : "ew-para"} data-reading-role={block.kind === "commentary" ? "interpretation" : undefined} data-reading-annotation={block.kind === "commentary" ? "edition" : undefined} key={i} id={block.noteId ? `note-${block.noteId}` : `p${i + 1}`}>
        {block.kind === "commentary" && <strong className="ew-library-status">Edition commentary</strong>}
        <FormattedText text={block.noteId ? block.text.replace(/^\[\^[^\]]+\]:\s*/, "") : block.text} sourceOffset={block.noteId ? (/^\[\^[^\]]+\]:\s*/.exec(block.text)?.[0].length ?? 0) : 0} anchor={block.noteId ? `note-${block.noteId}` : `p${i + 1}`} language={r.language} commentary={block.kind === "commentary"} renderText={text => <NoteText text={text} notes={page.notes} />} />
      </div>)}
    </section>
    {Object.keys(page.notes).length > 0 && <aside className="world-survival" aria-label="Translator and historical edition notes"><h2 className="jsu-chapter">Edition notes</h2><p>These belong to the translator or historical editor, not to the ancient author.</p>{Object.entries(page.notes).map(([id, note], i) => <details id={`annotation-${id}`} key={id}><summary>Edition note {i + 1}</summary>{note.text && <FormattedText text={note.text} anchor={`annotation-${id}`} commentary />}<Link href={note.href} prefetch={false}>Open note in the edition commentary</Link></details>)}</aside>}
    {pager}
    <aside className="world-survival" aria-label="Cite this section"><h2 className="jsu-chapter">Cite this section</h2><CitationCopy citation={citation} /><p className="ew-source-hash">{citation}</p><p><Link href={recordHref(r)}>Translator, rights and source details</Link> · <Link href={`/early/search?record=${r.id}`}>Search this edition</Link></p></aside>
  </ReadingSurface>;
}
