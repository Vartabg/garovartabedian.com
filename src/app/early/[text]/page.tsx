import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { EARLY_TEXTS } from "@/lib/early/client";
import { getAllusions, getEarlyText } from "@/lib/early/server";
import { chapterAnchors } from "@/lib/early/citations";
import type { EarlyText } from "@/lib/early/types";
import WorldImagePlate from "../../_components/WorldImagePlate";
import SourceBasis from "../../_components/SourceBasis";
import { plateForText } from "@/lib/early/plates";
import { GlossSegments } from "../../_components/Gloss";
import { segmentText } from "@/lib/glossary/segment";
import { loadSectionPlates, sectionSlug } from "@/lib/early/sections";
import { canons, getBookText, traditionFor } from "@/lib/scriptures/server";
import TwoWays from "../TwoWays";
import SevenHeavens from "../SevenHeavens";
import BookSpine from "./BookSpine";
import EarlyTextBody, { type EarlySectionView } from "../EarlyTextBody";
import ReadingSurface, { ReadingTools } from "../../_components/reading/ReadingSurface";
import LibraryLinks from "../library/LibraryLinks";
import { ReadingLayoutNote } from "../../_components/reading/FormattedText";

type PageProps = {
  params: Promise<{ text: string }>;
};

/** A book-boundary heading like "The Book of the Watchers (chapters 1–36)". */
const isBookHeading = (h?: string) => !!h && /\(chapters\s+\d+[–-]\d+\)/.test(h);
const anchorId = sectionSlug;
const isChapterHeading = (h?: string) => !!h && /^Chapter\s+\d+/.test(h);

function TextMap({ text }: { text: EarlyText }) {
  const headed = text.sections.filter((section) => section.heading);
  const totalParagraphs = text.sections.reduce(
    (sum, section) => sum + section.paragraphs.length,
    0,
  );
  const maxParagraphs = Math.max(
    1,
    ...headed.map((section) => section.paragraphs.length),
  );
  const witnessCount = text.survival?.witnesses.length ?? 0;

  if (headed.length === 0) return null;

  return (
    <nav className="ew-text-map" aria-label={`${text.title} section map`}>
      <div className="world-tool-head">
        <strong>The shape of this text</strong>
        <span>
          {headed.length} sections · {totalParagraphs} paragraphs
          {witnessCount ? ` · ${witnessCount} witnesses` : ""}
        </span>
      </div>
      <div className="ew-text-bars">
        {headed.map((section, index) => (
          <a
            key={`${section.heading}-${index}`}
            href={`#${anchorId(section.heading)}`}
            className={isBookHeading(section.heading) ? "is-book" : ""}
            style={
              {
                "--h": `${Math.max(18, (section.paragraphs.length / maxParagraphs) * 100)}%`,
              } as CSSProperties
            }
            aria-label={section.heading}
            title={section.heading}
          >
            <span />
          </a>
        ))}
      </div>
      <p className="scr-meta">
        Taller marks carry more paragraphs; heavier marks are book boundaries.
      </p>
    </nav>
  );
}

export function generateStaticParams() {
  return EARLY_TEXTS.map((text) => ({ text: text.id }));
}

export default async function EarlyTextPage({ params }: PageProps) {
  const { text: textId } = await params;
  const [text, allusionFile] = await Promise.all([
    getEarlyText(textId),
    getAllusions(textId),
  ]);
  if (!text) notFound();
  const quotedBooks = new Map(await Promise.all([...new Set((allusionFile?.allusions ?? []).map(a => a.book))].map(async book => [book, await getBookText("web", book)] as const)));
  const citationAnchors = chapterAnchors(text.sections);
  const plate = plateForText(text.id);
  const sectionPlates = await loadSectionPlates(text.id);
  const introSeen = new Map<string, string>();

  return (
    <ReadingSurface className="world-reading-page ew-reading-page" hasTrace={!!allusionFile?.allusions.length}>
      <p className="kicker">
        <Link href="/early">The Writings</Link>
      </p>
      <h1>{text.title}</h1>
      <ReadingTools />
      <ReadingLayoutNote />
      <details className="reading-background"><summary>About this writing, artwork and sources</summary>
      <p className="lede">
        <GlossSegments segments={segmentText(text.intro, introSeen)} />
      </p>
      <p className="world-cite">
        {text.date} · translation: {text.translator} ·{" "}
        <a href={text.sourceUrl} target="_blank" rel="noopener noreferrer" className="textlink">
          source
        </a>
      </p>
      <p className="gloss-hint">
        Dotted terms open a short explanation right here — tap to read, tap
        again to close.
      </p>

      <SourceBasis id="early-text" />
      <LibraryLinks textId={text.id} />

      {plate && (
        <WorldImagePlate src={plate.src} alt={plate.alt} caption={plate.caption} />
      )}

      <TextMap text={text} />

      {text.id === "didache" && <TwoWays />}
      {text.id === "ascension-isaiah" && <SevenHeavens />}

      {text.id === "enoch" && (
        <aside className="world-survival" aria-label="Comparative matrices featuring 1 Enoch">
          <h2 className="jsu-chapter">Comparative Slot-Diff Matrices</h2>
          <p>
            1 Enoch is a critical Second Temple textual bridge connecting Hebrew primeval history, apocalyptic eschatology, and New Testament Christology. Inspect its exact textual intersections:
          </p>
          <div className="world-survival-grid">
            <div className="world-witness">
              <strong>The Watchers (Genesis 6:1–4 ↔ 1 Enoch 6–16)</strong>
              <p>The angelic descent, forbidden arts, and cosmic judgment compared side-by-side.</p>
              <Link href="/scriptures/parallels/the-watchers" className="textlink" style={{ fontWeight: 600 }}>
                Open Watchers Matrix →
              </Link>
            </div>
            <div className="world-witness">
              <strong>The Prophecy Jude Quoted (Jude 14–15 ↔ 1 Enoch 1:9)</strong>
              <p>The verbatim quotation of Enoch&rsquo;s prophecy of the Lord coming with ten thousands of his holy ones.</p>
              <Link href="/scriptures/parallels/jude-enoch-quotation" className="textlink" style={{ fontWeight: 600 }}>
                Open Jude Quotation Matrix →
              </Link>
            </div>
            <div className="world-witness">
              <strong>The Son of Man (Daniel 7 ↔ 1 Enoch 46 / 71 ↔ Matthew 26)</strong>
              <p>The pre-existent Son of Man on the throne of glory and Jesus&rsquo; trial confession.</p>
              <Link href="/scriptures/parallels/son-of-man" className="textlink" style={{ fontWeight: 600 }}>
                Open Son of Man Matrix →
              </Link>
            </div>
          </div>
        </aside>
      )}

      {text.survival && (
        <aside className="world-survival" aria-label="How this text survived">
          <h2 className="jsu-chapter">How this text survived</h2>
          <p>
            <GlossSegments segments={segmentText(text.survival.intro, introSeen)} />
          </p>
          <div className="world-survival-grid">
            {text.survival.witnesses.map((w) => (
              <div key={w.name} className="world-witness">
                <strong>{w.name}</strong>
                <p>
                  <GlossSegments segments={segmentText(w.detail, introSeen)} />
                </p>
              </div>
            ))}
          </div>
          <p className="scr-meta">{text.survival.editions}</p>
          {text.survival.canonNote && (
            <p>
              {text.survival.canonNote}{" "}
              <Link href="/scriptures/ethiopian" className="textlink">
                The Ethiopian canon →
              </Link>
            </p>
          )}
        </aside>
      )}

      </details>
      <p className="world-cite">{text.translator} · <a href={text.sourceUrl}>Source edition</a></p>
      {text.sections.some((section) => isBookHeading(section.heading)) ? (
        <BookSpine sections={text.sections} qumran={text.id === "enoch"} />
      ) : (
        text.sections.length > 20 && (
          <nav className="ew-jump" aria-label="Jump to a chapter">
            {text.sections
              .filter((section) => isChapterHeading(section.heading))
              .map((section) => (
                <a key={section.heading} href={`#${anchorId(section.heading)}`}>
                  {section.heading!.replace(/^Chapter\s+(\d+).*/, "$1")}
                </a>
              ))}
          </nav>
        )
      )}

      <EarlyTextBody
        sections={text.sections.map((section, sectionIndex): EarlySectionView => {
          const sid = anchorId(section.heading);
          const rawPlate = sid ? sectionPlates[sid] : undefined;
          // One `seen` per section: a term is dotted once per chapter, so long
          // texts stay tappable for readers who jump in mid-way without the
          // underlines turning into noise.
          const seen = new Map<string, string>();
          const allusions = (allusionFile?.allusions ?? [])
            .filter((allusion) => allusion.section === sectionIndex)
            .map((allusion) => {
              const name = canons.books[allusion.book]?.name ?? allusion.book;
              const verses = quotedBooks.get(allusion.book)?.chapters ?? [];
              const excerpt = verses.slice(allusion.chapter - 1, allusion.endChapter ?? allusion.chapter).flatMap((verses, index, chapters) => verses.slice(index === 0 ? allusion.verse - 1 : 0, index === chapters.length - 1 ? allusion.endVerse ?? allusion.verse : undefined)).join(" ");
              const range = allusion.endVerse
                ? `${allusion.verse}\u2013${allusion.endChapter && allusion.endChapter !== allusion.chapter ? `${allusion.endChapter}:` : ""}${allusion.endVerse}`
                : `${allusion.verse}`;
              return {
                paragraph: allusion.paragraph,
                text: excerpt,
                href: `/scriptures/${traditionFor(allusion.book)}/${allusion.book}/${allusion.chapter}?t=web#v${allusion.verse}`,
                label: `${name} ${allusion.chapter}:${range}`,
              };
            });

          return {
            id: sid,
            citationId: citationAnchors[sectionIndex],
            heading: section.heading,
            allusions: allusions.length > 0 ? allusions : undefined,
            isBookBoundary: isBookHeading(section.heading),
            // Only the fields the plate UI needs — drop summary/heading bloat
            // from the client payload on 100+ chapter books.
            plate: rawPlate
              ? { src: rawPlate.src, alt: rawPlate.alt, caption: rawPlate.caption }
              : null,
            paragraphs: section.paragraphs.map((paragraph) =>
              segmentText(paragraph, seen),
            ),
          };
        })}
      />
    </ReadingSurface>
  );
}
