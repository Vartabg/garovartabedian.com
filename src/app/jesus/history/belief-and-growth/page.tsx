import ReadingSurface, { ReadingTools } from "../../../_components/reading/ReadingSurface";
import SourceNote from "../../../_components/reading/SourceNote";
import type { Metadata } from "next";
import Link from "next/link";
import { DIAMOND_ESSAY_SECTIONS } from "@/lib/jesus/diamond-excerpts";
import { CHRISTIANITY_ESSAY_PATH, excerptWatchUrl } from "@/lib/site/excerpt-video";
import ExcerptPlayer, { ExcerptPlayback } from "./ExcerptPlayer";
import "./essay.css";

const title = "Belief belongs in the explanation";
const description = "Jesus, Paul, and the growth of Christianity: a source-based essay with playable excerpts from Jared Diamond’s conversation with Joe Rogan.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: CHRISTIANITY_ESSAY_PATH },
  openGraph: { title, description, url: CHRISTIANITY_ESSAY_PATH, type: "article" },
  twitter: { card: "summary", title, description },
};

export default function BeliefAndGrowthPage() {
  return (
    <ReadingSurface className="diamond-essay" hasTrace>
      <nav className="diamond-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/jesus/history">Historical evidence</Link><span aria-hidden="true"> / </span><span>Essay</span>
      </nav>
      <header className="diamond-essay-header">
        <p className="kicker">Faith, history &amp; the early church</p>
        <h1>{title}</h1>
        <p className="diamond-deck">Jesus, Paul, and the questions raised by Jared Diamond’s conversation with Joe Rogan.</p>
        <p className="diamond-byline">Garo Vartabedian · <time dateTime="2026-09-07">September 7, 2026</time></p>
      </header>
      <ReadingTools />
      <div className="diamond-introduction">
        <p>After watching the conversation, I wanted a closer look at what it means to explain Christianity’s growth. Organization and social conditions matter. So do the convictions through which people understood their actions.</p>
        <p>Christian beliefs belong in an explanation of Christian behavior. Explaining how the movement spread does not, by itself, establish whether those beliefs are true or false.</p>
      </div>
      <aside className="diamond-reading-note" aria-label="About the excerpts">
        <p><strong>Hear the claim, then examine it.</strong> Each short quotation has a playable excerpt from the official episode. The time ranges use the YouTube version; the surrounding text is my analysis.</p>
        <a href={excerptWatchUrl()} target="_blank" rel="noopener noreferrer">Full episode · PowerfulJRE · September 3, 2026 ↗</a>
      </aside>
      <nav className="diamond-contents" aria-label="Essay sections">
        {DIAMOND_ESSAY_SECTIONS.map((section, index) => (
          <a key={section.id} href={`#${section.id}`}><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</a>
        ))}
      </nav>
      <ExcerptPlayback>
        {DIAMOND_ESSAY_SECTIONS.map((section, index) => (
          <section className="diamond-section" key={section.id} id={section.id} aria-labelledby={`heading-${section.id}`}>
            <p className="diamond-section-number">{String(index + 1).padStart(2, "0")}</p>
            <h2 id={`heading-${section.id}`}>{section.title}</h2>
            <p className="diamond-context">{section.context}</p>
            <ExcerptPlayer clip={{ id: section.id, title: section.title, quote: section.quote, start: section.start, end: section.end }} />
            {section.paragraphs.map((paragraph, paragraphIndex) => (
              <p key={paragraphIndex} id={`${section.id}-p${paragraphIndex + 1}`} data-reading-role="interpretation" data-reading-annotation="editorial">
                {paragraph.text}
                {paragraph.sources && <span className="diamond-citations">{" "}{paragraph.sources.map((source, sourceIndex) => (
                  <span key={source.href}>{sourceIndex > 0 && " · "}<SourceNote label={source.label} annotation={{ role: "source", title: source.label, href: source.href, provenance: "editorial", review: "not-applicable" }}><p>This is a cited source for the surrounding editorial analysis. Open it to inspect the original wording and context.</p></SourceNote></span>
                ))}</span>}
              </p>
            ))}
          </section>
        ))}
      </ExcerptPlayback>
      <footer className="diamond-essay-footer">
        <p>Quotation note: brief selections follow the video’s English automatic captions, cross-checked against a separate transcript. Punctuation is supplied for readability; an ellipsis marks an omitted verbal hesitation. The recording remains the source for spoken wording. Excerpts retain surrounding context and may include the host’s responses.</p>
        <p><a href="https://podscripts.co/podcasts/the-joe-rogan-experience/2549-jared-diamond">Comparison transcript</a> · <Link href="/jesus/history">Explore the historical evidence</Link></p>
      </footer>
    </ReadingSurface>
  );
}
