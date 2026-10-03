import Link from "next/link";
import type { BriefingSource, ChapterGuide, ChapterReadingContext } from "@/lib/scriptures/types";
import GuideEvidence from "./GuideEvidence";

export default function ChapterContext({
  guide,
  bookName,
  baseHref,
  sources = [],
  editionName,
}: {
  guide: ChapterGuide | null;
  bookName: string;
  baseHref: string;
  sources?: BriefingSource[];
  editionName?: string;
}) {
  if (!guide?.readingContext) return null;
  const { before, here, after } = guide.readingContext;
  const edition = guide.readingContextSource?.translation;
  const paragraph = (block: ChapterReadingContext) => (
    <>
      <p>{block.text}</p>
      {block.verseRefs.length > 0 && (
        <p className="scr-context-refs">
          {block.verseRefs.map((ref) => {
            const match = /^(\d+):(\d+)(?:[-–—]\d+)?$/.exec(ref);
            return match ? (
              <a key={ref} href={`${baseHref}/${match[1]}${edition ? `?t=${edition}` : ""}#v${match[2]}`}>
                {bookName} {ref}
              </a>
            ) : <span key={ref}>{ref}</span>;
          })}
        </p>
      )}
      <GuideEvidence sourceIds={block.evidenceSourceIds} sources={sources} />
    </>
  );

  return (
    <aside className="scr-reading-context" aria-labelledby="chapter-context-heading">
      <h2 id="chapter-context-heading">Before you read</h2>
      {paragraph(here)}
      <details>
        <summary>Where this chapter fits</summary>
        <h3>Leading into this chapter</h3>
        {paragraph(before)}
        <h3>Where the book goes from here</h3>
        {paragraph(after)}
      </details>
      <p className="scr-context-footer">
        <Link href={baseHref}>About {bookName}</Link>
        <span aria-hidden="true"> · </span>
        <a href="#study">Chapter study guide</a>
        <span aria-hidden="true"> · </span>
        <span>Editorial context</span>
        {edition && <span> · References use {editionName ?? edition.toUpperCase()}.</span>}
      </p>
    </aside>
  );
}
