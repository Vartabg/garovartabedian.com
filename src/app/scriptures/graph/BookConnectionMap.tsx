"use client";

import { type CSSProperties, useId, useMemo, useState } from "react";
import { BOOK_MAP_LAYOUT, FAMILY_NAMES, connectionCurve, type BookFamily } from "./book-map-layout";
import styles from "./connections.module.css";

export type BookFlow = { from: string; fromName: string; to: string; toName: string; citations: number };
const FAMILIES = Object.keys(FAMILY_NAMES) as BookFamily[];

type MapBook = { id: string; name: string; x: number; y: number; mobileX: number; mobileY: number; family: BookFamily; connections: number };

function ConnectionDrawing({ books, flows, selected, visible, mobile, id }: {
  books: MapBook[]; flows: BookFlow[]; selected: string | null; visible: BookFlow[]; mobile: boolean; id: string;
}) {
  const positions = new Map(books.map((book) => [book.id, book]));
  const largest = Math.max(1, ...flows.map((flow) => flow.citations));
  const markerId = `${id}-${mobile ? "portrait" : "landscape"}`;
  return <svg viewBox={mobile ? "0 0 480 1100" : "0 0 1200 620"}
    className={mobile ? styles.mobileDrawing : styles.desktopDrawing} aria-hidden="true" focusable="false">
    <defs>
      <marker id={markerId} viewBox="0 0 12 12" refX="6" refY="6" markerWidth="17" markerHeight="17" markerUnits="userSpaceOnUse" orient="auto">
        <path d="M 2 2 L 10 6 L 2 10" fill="none" stroke="context-stroke" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </marker>
    </defs>
    {flows.map((flow) => {
      const a = positions.get(flow.from)!;
      const b = positions.get(flow.to)!;
      const active = visible.includes(flow);
      const from = mobile ? { x: a.mobileX, y: a.mobileY } : a;
      const to = mobile ? { x: b.mobileX, y: b.mobileY } : b;
      const state = !active ? "muted" : !selected ? "overview" : flow.from === selected ? "outgoing" : "incoming";
      // Take the long cross-group portrait link around unrelated book labels.
      const path = mobile && flow.from === "LUK" && flow.to === "PSA"
        ? `M ${from.x} ${from.y} C 12 740 12 670 12 525 C 12 380 40 320 ${to.x} ${to.y}`
        : connectionCurve(from, to);
      return <path key={`${flow.from}-${flow.to}`} d={path}
        className={styles.connection} data-family={a.family} data-state={state}
        strokeWidth={1.8 + flow.citations / largest * 2.7}
        markerMid={active ? `url(#${markerId})` : undefined} />;
    })}
  </svg>;
}

export default function BookConnectionMap({ flows }: { flows: BookFlow[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [direction, setDirection] = useState("both");
  const diagramId = useId().replace(/:/g, "");
  const books = useMemo(() => {
    const names = new Map<string, string>();
    for (const flow of flows) { names.set(flow.from, flow.fromName); names.set(flow.to, flow.toName); }
    return [...names].map(([id, name], index): MapBook => ({
      id, name,
      ...(BOOK_MAP_LAYOUT[id] ?? { x: 125 + index % 5 * 215, y: 100 + Math.floor(index / 5) * 210, mobileX: 100 + index % 2 * 250, mobileY: 95 + Math.floor(index / 2) * 200, family: "prophets" }),
      connections: flows.filter((flow) => flow.from === id || flow.to === id).length,
    }));
  }, [flows]);
  const visible = flows.filter((flow) => !selected ||
    (direction !== "incoming" && flow.from === selected) ||
    (direction !== "outgoing" && flow.to === selected));
  const selectedName = books.find((book) => book.id === selected)?.name;
  const related = new Set(visible.flatMap((flow) => [flow.from, flow.to]));
  const largest = Math.max(1, ...flows.map((flow) => flow.citations));

  return <section className={styles.explorer} aria-labelledby="connection-map-title">
    <header className={styles.heading}>
      <p className="kicker">An atlas of references</p>
      <h2 id="connection-map-title">See where the references lead</h2>
      <p>Choose a book. Follow its connections. The {flows.length} largest book-to-book flows in the source index, drawn together.</p>
    </header>
    <div className={styles.atlas}>
      <div className={styles.controls}>
        <label>Book<select value={selected ?? ""} onChange={(event) => setSelected(event.target.value || null)}>
          <option value="">All shown books</option>{books.map((book) => <option value={book.id} key={book.id}>{book.name}</option>)}
        </select></label>
        <label>Direction<select value={direction} onChange={(event) => setDirection(event.target.value)} disabled={!selected}>
          <option value="both">Both directions</option><option value="outgoing">References from this book</option><option value="incoming">References to this book</option>
        </select></label>
        <button type="button" className={styles.resetMap} disabled={!selected} onClick={() => { setSelected(null); setDirection("both"); }}>Show whole network <span aria-hidden="true">↗</span></button>
      </div>
      <div className={styles.mapViewport}>
        <div className={styles.networkCanvas} role="group" aria-label="Select a book on the connection map">
          <ConnectionDrawing books={books} flows={flows} selected={selected} visible={visible} mobile={false} id={diagramId} />
          <ConnectionDrawing books={books} flows={flows} selected={selected} visible={visible} mobile id={diagramId} />
          {books.map((book) => <button type="button" key={book.id}
            style={{ "--node-x": `${book.x / 12}%`, "--node-y": `${book.y / 6.2}%`, "--portrait-x": `${book.mobileX / 4.8}%`, "--portrait-y": `${book.mobileY / 11}%` } as CSSProperties}
            className={styles.bookNode} data-family={book.family} data-muted={!related.has(book.id)}
            aria-pressed={selected === book.id} aria-label={`Show connections for ${book.name}`}
            onClick={() => setSelected(book.id)}>
            <span className={styles.nodePin} aria-hidden="true" />
            <span>{book.name}</span>
            <small>{book.connections} {book.connections === 1 ? "connection" : "connections"}</small>
          </button>)}
        </div>
      </div>
      <div className={styles.mapKey} aria-label="Map legend">
        <div className={styles.familyKey}>{FAMILIES.map((family) => <span key={family} data-family={family}><i aria-hidden="true" />{FAMILY_NAMES[family]}</span>)}</div>
        <div className={styles.directionKey}>{selected ? <><span data-direction="outgoing">From {selectedName}</span><span data-direction="incoming">To {selectedName}</span></> : <span>Arrows mark direction · line width marks reference count</span>}</div>
      </div>
    </div>
    <p className={styles.mapCaption}>Books are arranged by literary group for readability, not by geography, chronology, or computed community. Only the {flows.length} largest flows are shown.</p>
    <details className={styles.connectionDetails} open={selected !== null}>
      <summary><span>{selectedName ?? "All shown books"}<small>{visible.length} shown connections</small></span><span aria-hidden="true">+</span></summary>
      <p className={styles.resultCount} role="status">{visible.length} shown connections{selectedName ? ` involving ${selectedName}` : ""}</p>
      <ol className={styles.flowList} aria-label="Shown book connections">
        {visible.map((flow) => <li key={`${flow.from}-${flow.to}`}>
          <span>{flow.fromName} <span aria-label="to">→</span> {flow.toName}</span>
          <strong>{flow.citations.toLocaleString("en-US")}<small>references</small></strong>
          <span className={styles.flowBar} style={{ width: `${flow.citations / largest * 100}%` }} aria-hidden="true" />
        </li>)}
      </ol>
      <p className={styles.legend}>These are study connections in the source index, not measurements of theological importance. A missing line does not mean no connection exists.</p>
    </details>
  </section>;
}
