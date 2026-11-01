"use client";

import { useId, useMemo, useState } from "react";
import { suggestReferences, type DoorwaysData, type ReferenceSuggestion } from "@/lib/scriptures/doorways";

/**
 * One box for both jobs: a reference jumps straight to the chapter, anything
 * else searches the text. Without script the form still submits to the
 * search page, which handles references too.
 */
export default function GoTo({
  data,
  tradition,
  translation,
  onChoose,
  hrefFor,
  prefetch,
  go,
}: {
  data: DoorwaysData;
  tradition: string;
  translation: string;
  onChoose: (bookId: string) => void;
  hrefFor: (bookId: string, chapter: number, verse?: number | null) => string;
  prefetch: (href: string) => void;
  go: (href: string) => void;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const suggestions = useMemo(
    () => suggestReferences(data, tradition, translation, query),
    [data, tradition, translation, query],
  );
  const shown = open && suggestions.length > 0;

  const hrefOf = (s: ReferenceSuggestion): string | null =>
    s.kind === "search"
      ? `/scriptures/search?q=${encodeURIComponent(s.query)}`
      : s.chapter
        ? hrefFor(s.bookId, s.chapter, s.verse)
        : null;

  const take = (s: ReferenceSuggestion | undefined) => {
    if (!s) return;
    setOpen(false);
    const href = hrefOf(s);
    if (href) go(href);
    else if (s.kind === "reference") onChoose(s.bookId);
  };

  const highlight = (index: number) => {
    setActive(index);
    const s = suggestions[index];
    const href = s && s.kind === "reference" ? hrefOf(s) : null;
    if (href) prefetch(href);
  };

  return (
    <form
      className="dw-goto"
      role="search"
      aria-label="Go to a passage or search the text"
      action="/scriptures/search"
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        take(suggestions[active] ?? suggestions[0]);
      }}
    >
      <label className="dw-goto-label" htmlFor="dw-goto-input">Go to</label>
      <div className="dw-goto-field">
        <input
          id="dw-goto-input"
          name="q"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="A reference like jn 3:16, or any words"
          role="combobox"
          aria-expanded={shown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={shown ? `${listId}-${active}` : undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(event) => {
            if (!suggestions.length) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              highlight((active + 1) % suggestions.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              highlight((active - 1 + suggestions.length) % suggestions.length);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <ul id={listId} role="listbox" className="dw-sug" aria-label="Matches" hidden={!shown}>
          {suggestions.map((s, index) => (
            <li
              key={`${s.label}-${index}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => {
                event.preventDefault();
                take(s);
              }}
              onMouseEnter={() => highlight(index)}
            >
              <span>{s.label}</span>
              <small>{s.detail}</small>
            </li>
          ))}
        </ul>
      </div>
      <button type="submit" className="dw-goto-go">Go</button>
    </form>
  );
}
