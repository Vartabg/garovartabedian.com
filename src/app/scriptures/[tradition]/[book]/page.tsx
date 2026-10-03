import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { scriptureCanonicalPath, ssgBookParams } from "@/lib/scriptures/canonical";
import { getBookBriefing } from "@/lib/scriptures/server/book-briefings";
import { canons } from "@/lib/scriptures/server/canons";
import BookBriefingView, { BookBriefingDeep, BookBriefingLead } from "./BookBriefing";

type PageProps = {
  params: Promise<{ tradition: string; book: string }>;
};

export function generateStaticParams() {
  return ssgBookParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tradition: traditionId, book: bookId } = await params;
  const tradition = canons.traditions.find((t) => t.id === traditionId);
  const meta = canons.books[bookId];
  if (!tradition || !meta || !tradition.books.includes(bookId)) {
    return { title: "Book" };
  }
  const briefing = await getBookBriefing(bookId);
  const description =
    briefing?.oneLine ??
    `Choose a chapter of ${meta.name} in the ${tradition.name} collection (${meta.chapters} chapters).`;
  const url = `/scriptures/${tradition.id}/${bookId}`;
  return {
    title: meta.name,
    description,
    alternates: { canonical: scriptureCanonicalPath(tradition.id, bookId) },
    openGraph: {
      title: `${meta.name} — Scriptures`,
      description,
      type: "book",
      url,
    },
  };
}

/** Parse a shape range like "1–8:26", "8:27–10:52", "11–16" into whole chapters. */
function chapterSpan(range: string, max: number): number[] {
  const cleaned = range.replace(/\s/g, "");
  const [rawStart, rawEnd] = cleaned.split(/[–—-]/);
  const start = Number.parseInt(rawStart ?? "", 10);
  const end = rawEnd ? Number.parseInt(rawEnd, 10) : start;
  if (!Number.isFinite(start)) return [];
  const from = Math.max(1, start);
  const to = Math.min(max, Number.isFinite(end) ? end : start);
  const out: number[] = [];
  for (let n = from; n <= to; n += 1) out.push(n);
  return out;
}

/**
 * Chapter grid. When the book has a briefing, the grid is grouped by the book's
 * actual structure so the numbers themselves carry the shape; otherwise it falls
 * back to a flat grid.
 */
export default async function BookChaptersPage({ params }: PageProps) {
  const { tradition: traditionId, book: bookId } = await params;
  const tradition = canons.traditions.find((t) => t.id === traditionId);
  if (!tradition || !tradition.books.includes(bookId)) notFound();
  const meta = canons.books[bookId];
  if (!meta) notFound();

  const chapters = meta.chapters;
  const bookIndex = tradition.books.indexOf(bookId);
  const baseHref = `/scriptures/${tradition.id}/${bookId}`;
  const briefing = await getBookBriefing(bookId);

  // Group only when the shape covers every chapter exactly once; a partial or
  // overlapping shape would silently hide or duplicate chapters.
  const parts = briefing?.shape
    .map((part) => ({ ...part, nums: chapterSpan(part.chapters, chapters) }))
    .filter((part) => part.nums.length > 0);
  const covered = parts?.flatMap((part) => part.nums) ?? [];
  const grouped =
    parts && covered.length === chapters && new Set(covered).size === chapters
      ? parts
      : null;

  const cell = (n: number) => (
    <Link key={n} href={`${baseHref}/${n}`} className="scr-chapter-cell">
      {n}
    </Link>
  );

  return (
    <>
      <p className="kicker">
        <Link href="/scriptures">Scriptures</Link>
        {" · "}
        <Link href={`/scriptures/${tradition.id}`}>{tradition.name}</Link>
      </p>
      <h1>{meta.name}</h1>

      {/* The chapters come before the briefing: a book page is how a reader
          gets to a chapter, and the briefing had grown to eleven screens
          above the grid (twenty on a phone). */}
      {briefing ? (
        <BookBriefingLead briefing={briefing} />
      ) : (
        <p className="lede">
          {chapters} chapter{chapters === 1 ? "" : "s"}. Tap a number to open that chapter.
        </p>
      )}

      {grouped ? (
        <div className="scr-shape">
          <h2 className="scr-shape-head">The shape of the book</h2>
          {grouped.map((part) => (
            <section key={part.heading} className="scr-shape-part">
              <div className="scr-shape-label">
                <h3>{part.heading}</h3>
                <span className="scr-shape-range">{part.precise ?? part.chapters}</span>
              </div>
              {part.note && <p className="scr-shape-note">{part.note}</p>}
              <nav className="scr-chapter-grid" aria-label={part.heading}>
                {part.nums.map(cell)}
              </nav>
            </section>
          ))}
        </div>
      ) : (
        <nav className="scr-chapter-grid" aria-label={`${meta.name} chapters`}>
          {Array.from({ length: chapters }, (_, i) => cell(i + 1))}
        </nav>
      )}

      {briefing && <BookBriefingView briefing={briefing} baseHref={baseHref} />}
      {briefing && <BookBriefingDeep briefing={briefing} baseHref={baseHref} />}

      <nav className="scr-book-neighbors" aria-label="Neighboring books">
        {bookIndex > 0 && (
          <Link href={`/scriptures/${tradition.id}/${tradition.books[bookIndex - 1]}`}>
            ← {canons.books[tradition.books[bookIndex - 1]]?.name ?? "Previous"}
          </Link>
        )}
        <Link href={`/scriptures/${tradition.id}`}>All books</Link>
        {bookIndex >= 0 && bookIndex < tradition.books.length - 1 && (
          <Link href={`/scriptures/${tradition.id}/${tradition.books[bookIndex + 1]}`}>
            {canons.books[tradition.books[bookIndex + 1]]?.name ?? "Next"} →
          </Link>
        )}
      </nav>
    </>
  );
}
