import { pickTranslation, traditionFor } from "@/lib/scriptures/client";
import Link from "next/link";
import type { Canons, ChapterNeighbours as ChapterNeighboursData, TranslationId } from "@/lib/scriptures/types";

/** A neighbour chapter's link: this canon when it holds the book, and the reader's version when the book has it. */
export function neighbourHref(canons: Canons, traditionId: string, book: string, chapter: number, translation?: TranslationId) {
  const tradition = canons.traditions.find(t => t.id === traditionId);
  const targetTradition = tradition?.books.includes(book) ? traditionId : traditionFor(canons, book);
  const edition = translation && canons.books[book]?.trans.includes(translation) ? translation : pickTranslation(canons, canons.traditions.find(t => t.id === targetTradition)?.transPreference ?? [], book);
  return `/scriptures/${targetTradition}/${book}/${chapter}${edition ? `?t=${edition}` : ""}`;
}

/**
 * "Chapters that carry this idea" — the computed counterpart to the curated
 * cross-references above it. Every row is a chapter whose wording sits nearest
 * this one in the embedding space the meaning search already uses, with its
 * similarity shown rather than hidden, and with a note when the
 * cross-references reach the same chapter independently.
 *
 * It is deliberately labelled as machine-computed. The measure is how the
 * chapters are worded, which is not the same as what they mean, and the copy
 * has to say so — a reader should treat a row here as a place to look, never
 * as a claim that two passages teach the same thing.
 */
export default function ChapterNeighbours({
  data,
  canons,
  traditionId,
  translation,
  bookName,
  chapter,
}: {
  data: ChapterNeighboursData | null;
  canons: Canons;
  traditionId: string;
  translation?: TranslationId;
  bookName: string;
  chapter: number;
}) {
  if (!data || data.neighbours.length === 0) return null;

  const agreed = data.neighbours.filter((n) => n.xrefLinks > 0).length;

  return (
    <div className="scr-neighbours" id="neighbours">
      <h3 className="scr-neighbours-h">Chapters that carry this idea</h3>
      <p className="scr-meta">
        Computed, not curated: the chapters whose wording sits nearest{" "}
        {bookName} {chapter} in the same model the meaning search uses. Nearness
        of wording is not agreement of meaning — treat each one as a place to
        look.
      </p>
      <ol className="scr-neighbour-list">
        {data.neighbours.map((neighbour) => {
          const name = canons.books[neighbour.book]?.name ?? neighbour.book;
          return (
            <li key={`${neighbour.book}-${neighbour.chapter}`}>
              <Link href={neighbourHref(canons, traditionId, neighbour.book, neighbour.chapter, translation)}>
                {name} {neighbour.chapter}
              </Link>
              <span className="scr-neighbour-score" aria-label={`similarity ${neighbour.score}`}>
                {neighbour.score.toFixed(2)}
              </span>
              {neighbour.xrefLinks > 0 && (
                <span className="scr-neighbour-xref">
                  cross-referenced {neighbour.xrefLinks}×
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="scr-guide-source">
        {agreed > 0
          ? `${agreed} of these ${data.neighbours.length} are also joined by the cross-references above.`
          : "None of these are joined by the cross-references above."}{" "}
        <Link href="/sources">Sources</Link>
      </p>
    </div>
  );
}
