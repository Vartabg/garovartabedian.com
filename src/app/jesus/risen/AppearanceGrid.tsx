import Link from "next/link";
import type { RisenAppearance } from "@/lib/jesus/types";
import { bookName, refLink } from "./refs";

/** Column order: the four Gospels, then Acts, then the earliest written list. */
const COLUMNS = ["MAT", "MRK", "LUK", "JHN", "ACT", "1CO"] as const;
const SHORT: Record<string, string> = {
  MAT: "Matt",
  MRK: "Mark",
  LUK: "Luke",
  JHN: "John",
  ACT: "Acts",
  "1CO": "1 Cor",
};

/** "MAT 28:9-10" → "28:9–10" — the book is already the column. */
function chapterVerse(ref: string): string {
  return (ref.split(" ")[1] ?? ref).replace("-", "–");
}

export default function AppearanceGrid({
  appearances,
}: {
  appearances: RisenAppearance[];
}) {
  return (
    <>
      <div className="jsu-risen-grid-wrap">
        <table className="jsu-risen-grid">
          <caption className="jsu-sr">
            Reported appearances of the risen Jesus, by source. Each cell links to
            the passage; an empty cell means that source does not report it.
          </caption>
          <thead>
            <tr>
              <th scope="col">Who saw him</th>
              {COLUMNS.map((book) => (
                <th scope="col" abbr={bookName(book)} key={book}>
                  {SHORT[book]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {appearances.map((appearance) => (
              <tr key={appearance.id} id={appearance.id}>
                <th scope="row">
                  <strong>{appearance.who}</strong>
                  <span>
                    {appearance.where} · {appearance.when}
                  </span>
                </th>
                {COLUMNS.map((book) => {
                  const source = appearance.sources.find((entry) => entry.book === book);
                  const link = source ? refLink(source.ref) : null;

                  return (
                    <td key={book} className={source ? "is-reported" : undefined}>
                      {source && link ? (
                        <Link href={link.href} className="textlink">
                          <span aria-hidden="true">{chapterVerse(source.ref)}</span>
                          <span className="jsu-sr">{link.label}</span>
                        </Link>
                      ) : (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="jsu-sr">Not reported here</span>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ol className="jsu-risen-appearance-notes">
        {appearances.map((appearance) => (
          <li key={appearance.id}>
            <strong>{appearance.who}</strong>
            <span>{appearance.line}</span>
            {appearance.note ? <em>{appearance.note}</em> : null}
          </li>
        ))}
      </ol>
    </>
  );
}
