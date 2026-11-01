"use client";

import { useId, useMemo, useState } from "react";
import { ERA_SHORT, findMoments, type LifeLensesIndex } from "@/lib/jesus/life-lenses";

/** Type a title, a place, a phrase or a reference ("John 11") to jump to a moment. */
export default function FindMoment({ data, onChoose }: { data: LifeLensesIndex; onChoose: (id: string) => void }) {
  const listId = useId();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const matches = useMemo(() => findMoments(data, query), [data, query]);
  const shown = open && matches.length > 0;

  const take = (id: string | undefined) => {
    if (!id) return;
    onChoose(id);
    setQuery("");
    setOpen(false);
  };

  return (
    <form
      className="jl-find"
      role="search"
      aria-label="Find a moment in his life"
      onSubmit={(event) => {
        event.preventDefault();
        take(matches[active]?.id);
      }}
    >
      <label htmlFor={inputId}>Find a moment</label>
      <div className="jl-find-field">
        <input
          id={inputId}
          type="search"
          role="combobox"
          autoComplete="off"
          aria-expanded={shown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={shown ? `${listId}-${active}` : undefined}
          placeholder="Jordan, Lazarus, Emmaus, John 11…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (!shown || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
            event.preventDefault();
            setActive((i) => (i + (event.key === "ArrowDown" ? 1 : matches.length - 1)) % matches.length);
          }}
        />
        <ul className="jl-find-list" id={listId} role="listbox" aria-label="Matching moments" hidden={!shown}>
          {matches.map((m, i) => (
            <li
              key={m.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(event) => {
                event.preventDefault();
                take(m.id);
              }}
            >
              <span>{m.title}</span>
              <small>{ERA_SHORT[m.era] ?? m.era}</small>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
