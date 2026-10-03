import type { CSSProperties } from "react";

type RedLetterMapProps = {
  books: string[];
  counts: Record<string, number>;
  names: Record<string, string>;
  activeBook: string;
  onSelect: (book: string) => void;
};

export function RedLetterMap({
  books,
  counts,
  names,
  activeBook,
  onSelect,
}: RedLetterMapProps) {
  const max = Math.max(...books.map((book) => counts[book] ?? 0), 1);
  const total = books.reduce((sum, book) => sum + (counts[book] ?? 0), 0);

  return (
    <section className="jsu-visual-panel" aria-label="Red-letter distribution by book">
      <div className="jsu-visual-head">
        <strong>Where the red letters cluster</strong>
        <span>{total.toLocaleString()} speaking verses</span>
      </div>
      <div className="jsu-word-bars">
        {books.map((book) => {
          const count = counts[book] ?? 0;
          return (
            <button
              key={book}
              type="button"
              className={`jsu-word-bar${activeBook === book ? " is-active" : ""}`}
              title={`${names[book] ?? book}: ${count} verses`}
              aria-label={`${names[book] ?? book}: ${count} speaking verses`}
              aria-pressed={activeBook === book}
              onClick={() => onSelect(book)}
            >
              <span
                className="jsu-word-fill"
                style={
                  {
                    "--bar": `${Math.max(8, (count / max) * 100)}%`,
                  } as CSSProperties
                }
              />
              <span className="jsu-word-book">{names[book] ?? book}</span>
              <span className="jsu-word-count">{count}</span>
            </button>
          );
        })}
      </div>
      <p className="scr-meta">
        The Gospels carry almost all of the red-letter material; Acts,
        Corinthians, Timothy, and Revelation preserve later words from heaven.
      </p>
    </section>
  );
}
