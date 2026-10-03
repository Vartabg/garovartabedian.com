import Link from "next/link";
import type { UnseenChapter } from "@/lib/angels/types";

/**
 * "In the unseen record" — the reverse link from a chapter into the Angels &
 * Demons world. Two kinds of row, said differently on purpose: a record is a
 * page someone wrote about this chapter (an encounter, a fall fragment, a
 * named spirit); a term is a word the tagged Hebrew or Greek of this chapter
 * contains, counted by machine. Neither is a claim about what the chapter
 * means — both are places to look.
 */
export default function UnseenRecord({
  data,
  bookName,
  chapter,
}: {
  data: UnseenChapter | null;
  bookName: string;
  chapter: number;
}) {
  if (!data || (data.entries.length === 0 && data.terms.length === 0)) return null;

  return (
    <div className="scr-neighbours scr-unseen" id="unseen">
      <h3 className="scr-neighbours-h">In the unseen record</h3>
      <p className="scr-meta">
        Where {bookName} {chapter} appears in <Link href="/angels">Angels &amp; Demons</Link>
        {data.terms.length > 0 ? ", and the words for the unseen its original text contains" : ""}.
      </p>
      {data.entries.length > 0 && (
        <ul className="scr-neighbour-list">
          {data.entries.map((entry) => (
            <li key={entry.href}>
              <Link href={entry.href}>{entry.label}</Link>
              <span className="scr-neighbour-xref">{entry.room}</span>
            </li>
          ))}
        </ul>
      )}
      {data.terms.length > 0 && (
        <p className="scr-unseen-terms">
          {data.terms.map((term, index) => (
            <span key={term.id}>
              {index > 0 ? " · " : ""}
              <Link href={`/angels/vocabulary#${term.id}`}>
                <span lang={term.lang === "hebrew" ? "he" : "grc"} dir={term.lang === "hebrew" ? "rtl" : undefined}>
                  {term.headword}
                </span>{" "}
                <span className="scr-neighbour-score" aria-label={`${term.count} occurrences`}>
                  ×{term.count}
                </span>
              </Link>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
