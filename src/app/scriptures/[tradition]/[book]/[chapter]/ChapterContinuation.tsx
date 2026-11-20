import Link from "next/link";
import type { ChapterContinuation as Continuation } from "@/lib/scriptures/chapter-continuation";

/** One link from this chapter into a world that already cites it. */
export default function ChapterContinuation({
  link,
  bookName,
  chapter,
}: {
  link: Continuation | null;
  bookName: string;
  chapter: number;
}) {
  if (!link) return null;

  return (
    <div className="scr-neighbours" id="continues">
      <h3 className="scr-neighbours-h">This continues in</h3>
      <p className="scr-meta">
        Where {bookName} {chapter} is taken up.
      </p>
      <ul className="scr-neighbour-list">
        <li>
          <Link href={link.href}>{link.label}</Link>
          <span className="scr-neighbour-xref">{link.where}</span>
        </li>
      </ul>
    </div>
  );
}
