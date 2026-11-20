"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  SHELF_NAMES_SHOWN,
  SHELF_STATUS_LABELS,
  filterShelves,
  shelfNames,
  shelfUnits,
  type ShelfData,
  type ShelfEntry,
} from "@/lib/early/library-shelves";

function Row({ entry, title = entry.title, edition = true }: { entry: ShelfEntry; title?: string; edition?: boolean }) {
  const flag = SHELF_STATUS_LABELS[entry.status];
  // A deferred entry's edition label only repeats that the text is not here.
  const label = edition && entry.status !== "deferred" ? entry.edition : "";
  return (
    <li>
      <Link className="ew-shelf-row" href={entry.href} prefetch={false}>
        <strong>{title}</strong>
        {(flag || label) && (
          <small>
            {flag && <em>{flag}</em>}
            {flag && label ? " · " : ""}
            {label}
          </small>
        )}
      </Link>
    </li>
  );
}

function Shelf({ shelf, open, note }: { shelf: ShelfData; open: boolean; note?: string }) {
  const units = useMemo(() => shelfUnits(shelf.entries), [shelf.entries]);
  const names = shelfNames(units);
  return (
    <details className="ew-shelf" id={`collection-${shelf.id}`} open={open}>
      <summary>
        <h2 className="ew-shelf-name">{shelf.label}</h2>
        <span className="ew-shelf-count">
          {shelf.entries.length}
          <span className="sr-fallback"> entries</span>
        </span>
        <span className="ew-shelf-chevron" aria-hidden="true" />
        <span className="ew-shelf-names">
          {names.slice(0, SHELF_NAMES_SHOWN).join(", ")}
          {names.length > SHELF_NAMES_SHOWN ? "…" : ""}
        </span>
      </summary>
      {note && <p className="ew-shelf-note">{note}</p>}
      <ul className="ew-shelf-rows">
        {units.map((unit) =>
          unit.kind === "entry" ? (
            <Row key={unit.entry.id} entry={unit.entry} />
          ) : (
            <li key={unit.name}>
              <details className="ew-shelf-author">
                <summary className="ew-shelf-row">
                  <strong>{unit.name}</strong>
                  <small>
                    {unit.entries.length} entries
                    {unit.edition ? ` · ${unit.edition}` : ""}
                  </small>
                  <span className="ew-shelf-chevron" aria-hidden="true" />
                </summary>
                <ul className="ew-shelf-rows ew-shelf-rows--in">
                  {unit.entries.map(({ entry, title }) => (
                    <Row key={entry.id} entry={entry} title={title} edition={!unit.edition} />
                  ))}
                </ul>
              </details>
            </li>
          ),
        )}
      </ul>
    </details>
  );
}

/**
 * The library list: one find box, then seven closed shelves. Typing swaps the shelves
 * for the matching rows; the shelves stay mounted so the ones a reader opened stay open.
 */
export default function LibraryShelves({
  shelves,
  initialQuery = "",
  initialWork = "",
  openShelf = "",
  notes = {},
}: {
  shelves: ShelfData[];
  initialQuery?: string;
  initialWork?: string;
  /** A shelf to show open on arrival (`?group=`). */
  openShelf?: string;
  notes?: Partial<Record<ShelfData["id"], string>>;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [work, setWork] = useState(initialWork);
  const filtering = Boolean(query.trim() || work);
  const matches = useMemo(() => (filtering ? filterShelves(shelves, query, work) : []), [filtering, shelves, query, work]);
  const found = matches.reduce((sum, shelf) => sum + shelf.entries.length, 0);

  // Keep the address in step with the box so a filtered list can be shared or reloaded.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const next = query.trim();
      if (next) params.set("q", next);
      else params.delete("q");
      if (!work) params.delete("work");
      const search = params.toString();
      const url = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
      if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        window.history.replaceState(null, "", url);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, work]);

  return (
    <>
      <form className="ew-library-form ew-library-find" action="/early/library" role="search" onSubmit={(event) => event.preventDefault()}>
        <label>
          Find a writing
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={160}
            placeholder="Clement, Philo, Thomas…"
            autoComplete="off"
          />
        </label>
        {work && <input type="hidden" name="work" value={work} />}
      </form>

      {filtering && (
        <div className="ew-shelf-results">
          <p className="scr-meta" role="status">
            {found === 0 ? "No entries match." : `${found} ${found === 1 ? "entry matches" : "entries match"}.`}{" "}
            <Link
              href="/early/library"
              prefetch={false}
              onClick={(event) => {
                event.preventDefault();
                setQuery("");
                setWork("");
              }}
            >
              Show all shelves
            </Link>
          </p>
          {matches.map((shelf) => (
            <section key={shelf.id}>
              <h2 className="jsu-chapter">{shelf.label}</h2>
              <ul className="ew-shelf-rows">
                {shelf.entries.map((entry) => (
                  <Row key={entry.id} entry={entry} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="ew-shelves" hidden={filtering}>
        {shelves.map((shelf) => (
          <Shelf key={shelf.id} shelf={shelf} open={shelf.id === openShelf} note={notes[shelf.id]} />
        ))}
      </div>
    </>
  );
}
