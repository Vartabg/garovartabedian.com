"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import {
  SECTIONS,
  bookVerses,
  chapterVerses,
  isBeyondProtestant,
  sectioned,
  stripLayout,
  type SectionId,
} from "@/lib/scriptures/doorways";
import type { PickerProps } from "./Doorways";
import { useWidth } from "./useWidth";
import MapGuide from "@/app/_components/MapGuide";

/** Section header height: the 24px minimum target (WCAG 2.5.8). */
const HEADER = 24;

/**
 * The whole Bible as one map, each area sized by its verses. Overview first,
 * then zoom: section, book, chapter (Shneiderman's mantra).
 */
export default function MapView({ data, tradition, translation, book, here, onChoose, hrefFor, prefetch, onFollow }: PickerProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const width = useWidth(boxRef);
  const [section, setSection] = useState<SectionId | null>(null);
  const groups = sectioned(data, tradition);
  const groupOf = (id: string) => groups.find((g) => g.books.includes(id));
  const atBook = book && groupOf(book) ? book : null;
  const atSection = !atBook && section && groups.some((g) => g.section === section) ? section : null;
  const chapters = atBook ? chapterVerses(data, atBook, translation).length : 0;
  const height = width ? Math.round(width < 600 ? width * 1.35 : width * 0.6) : 0;
  const tone = (id: string, s: SectionId) => `dw-sec-${isBeyondProtestant(data, id) ? "extra" : s}`;
  const tiles: ReactNode[] = [];

  const bookTile = (t: { id: string; x: number; y: number; w: number; h: number }, s: SectionId, small: boolean) => {
    const name = data.books[t.id].name;
    const chapters = chapterVerses(data, t.id, translation).length;
    return (
      <button
        key={t.id}
        type="button"
        className={`dw-tile ${tone(t.id, s)}`}
        style={{ left: t.x, top: t.y, width: t.w, height: t.h }}
        aria-label={`${name}, ${chapters} ${chapters === 1 ? "chapter" : "chapters"}`}
        title={name}
        // A pointer on a tiny tile zooms into its section first; a keyboard
        // (detail 0) has already landed exactly on the book.
        onClick={(event) => (small && event.detail > 0 ? setSection(s) : onChoose(t.id))}
      >
        {t.w > 52 && t.h > 20 ? <span aria-hidden="true">{name}</span> : null}
      </button>
    );
  };

  if (width && atBook) {
    const group = groupOf(atBook);
    const name = data.books[atBook].name;
    const verses = chapterVerses(data, atBook, translation);
    for (const t of stripLayout(verses.map((value, i) => ({ value, chapter: i + 1 })), 0, 0, width, height)) {
      const href = hrefFor(atBook, t.chapter);
      const isHere = here?.bookId === atBook && here.chapter === t.chapter;
      tiles.push(
        <Link
          key={t.chapter}
          href={href}
          prefetch={false}
          className={`dw-tile is-chapter ${tone(atBook, group?.section ?? "history")}${isHere ? " is-here" : ""}`}
          aria-current={isHere ? "page" : undefined}
          style={{ left: t.x, top: t.y, width: t.w, height: t.h }}
          aria-label={`${name} ${t.chapter}, ${t.value} ${t.value === 1 ? "verse" : "verses"}`}
          onMouseEnter={() => prefetch(href)}
          onFocus={() => prefetch(href)}
          onTouchStart={() => prefetch(href)}
          onClick={onFollow}
        >
          {t.w > 16 && t.h > 14 ? <span aria-hidden="true">{t.chapter}</span> : null}
        </Link>,
      );
    }
  } else if (width && atSection) {
    const group = groups.find((g) => g.section === atSection);
    const books = (group?.books ?? []).map((id) => ({ id, value: bookVerses(data, id, translation) }));
    for (const t of stripLayout(books, 0, 0, width, height)) tiles.push(bookTile(t, atSection, false));
  } else if (width) {
    const sections = stripLayout(
      groups.map((g) => ({ g, value: g.books.reduce((n, id) => n + bookVerses(data, id, translation), 0) })),
      0, 0, width, height,
    );
    for (const s of sections) {
      tiles.push(
        <div key={`bg-${s.g.section}`} className="dw-map-sec" style={{ left: s.x, top: s.y, width: s.w, height: s.h }} />,
        <button
          key={`h-${s.g.section}`}
          type="button"
          className="dw-map-sec-h"
          style={{ left: s.x, top: s.y, width: s.w }}
          onClick={() => setSection(s.g.section)}
        >
          {SECTIONS[s.g.section].name} <span aria-hidden="true">›</span>
        </button>,
      );
      const inner = stripLayout(
        s.g.books.map((id) => ({ id, value: bookVerses(data, id, translation) })),
        s.x + 2, s.y + HEADER, Math.max(1, s.w - 4), Math.max(1, s.h - HEADER - 2),
      );
      for (const t of inner) tiles.push(bookTile(t, s.g.section, t.w < 40 || t.h < 28));
    }
  }

  const crumbs: ReactNode[] = [];
  if (atBook || atSection) {
    crumbs.push(
      <button key="all" type="button" onClick={() => { onChoose(null); setSection(null); }}>Whole Bible</button>,
    );
  } else {
    crumbs.push(<span key="all" aria-current="location">Whole Bible</span>);
  }
  if (atSection) crumbs.push(<span key="section" aria-current="location">{SECTIONS[atSection].name}</span>);
  if (atBook) {
    const group = groupOf(atBook);
    if (group) {
      crumbs.push(
        <button key="section" type="button" onClick={() => { onChoose(null); setSection(group.section); }}>
          {SECTIONS[group.section].name}
        </button>,
      );
    }
    crumbs.push(<span key="book" aria-current="location">{data.books[atBook].name}</span>);
  }

  return (
    <div className="dw-map">
      <MapGuide title="Explore the books" description="Areas show verse counts. Choose a book to reveal its chapters, then choose a chapter to read.">
        <label className="map-picker">
          <span>Book</span>
          <select value={atBook ?? (atSection ? `section:${atSection}` : "")} onChange={(event) => { setSection(null); onChoose(event.currentTarget.value || null); }}>
            <option value="">Whole Bible</option>
            {atSection ? <option value={`section:${atSection}`} disabled>{SECTIONS[atSection].name} · section overview</option> : null}
            {groups.map((group) => (
              <optgroup key={group.section} label={SECTIONS[group.section].name}>
                {group.books.map((id) => <option key={id} value={id}>{data.books[id].name}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
      </MapGuide>
      <nav className="dw-crumbs" aria-label="Map level">
        {crumbs.flatMap((crumb, i) => (i ? [<span key={`sep-${i}`} aria-hidden="true">›</span>, crumb] : [crumb]))}
      </nav>
      <div className="dw-map-box" ref={boxRef} style={height ? { height } : undefined}>
        {tiles}
      </div>
      <p className="dw-hint map-status" role="status">
        {atBook
          ? `${data.books[atBook].name} · ${chapters} ${chapters === 1 ? "chapter" : "chapters"}. Choose a chapter to read it.`
          : atSection
            ? `${SECTIONS[atSection].name} · choose a book to see its chapters.`
            : `${groups.reduce((count, group) => count + group.books.length, 0)} books · choose a section or a book to zoom in.`}
      </p>
    </div>
  );
}
