"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { SECTIONS, chapterVerses, isBeyondProtestant, sectioned, type SectionId } from "@/lib/scriptures/doorways";
import ChapterBars from "./ChapterBars";
import type { PickerProps } from "./Doorways";
import { useWidth } from "./useWidth";

type Bar = { id: string; chapter: number; verses: number; section: SectionId; tone: string; book: number };
type RGB = [number, number, number];

function toRgb(color: string): RGB | null {
  const hex = color.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = Number.parseInt(hex[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  const fn = color.match(/rgba?\(([^)]+)\)/);
  if (!fn) return null;
  const [r, g, b] = fn[1].split(/[\s,/]+/).map(Number);
  return [r, g, b];
}
const blend = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;

/**
 * Every chapter as one bar, in order, its height set by its verses: the
 * layout of Chris Harrison and Christoph Römhild's Bible chart. Drag across
 * the whole Bible, then choose a chapter in the close-up.
 */
export default function StripView({ data, tradition, translation, book, here, hrefFor, prefetch, go, onFollow }: PickerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLDivElement>(null);
  const width = useWidth(wrapRef);

  const bars = useMemo<Bar[]>(() => {
    const out: Bar[] = [];
    let bookIndex = -1;
    for (const g of sectioned(data, tradition)) {
      for (const id of g.books) {
        bookIndex += 1;
        const tone = isBeyondProtestant(data, id) ? "extra" : g.section;
        chapterVerses(data, id, translation).forEach((verses, i) =>
          out.push({ id, chapter: i + 1, verses, section: g.section, tone, book: bookIndex }),
        );
      }
    }
    return out;
  }, [data, tradition, translation]);

  // Mounted with a key per chosen book, so a book picked elsewhere starts
  // here; from the reader, the strip starts on the chapter being read.
  const [index, setIndex] = useState(() => {
    if (!book) return 0;
    const reading = here?.bookId === book ? bars.findIndex((b) => b.id === book && b.chapter === here.chapter) : -1;
    return Math.max(0, reading >= 0 ? reading : bars.findIndex((b) => b.id === book));
  });
  const at = Math.min(index, bars.length - 1);
  const current = bars[at];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width) return;
    const height = width < 600 ? 110 : 140;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const styles = getComputedStyle(canvas);
    const ground = toRgb(getComputedStyle(document.body).backgroundColor) ?? [255, 255, 255];
    const dark = 0.2126 * ground[0] + 0.7152 * ground[1] + 0.0722 * ground[2] < 128;
    const lift: RGB = dark ? [238, 223, 194] : [255, 255, 255];
    const fills = new Map<string, string>();
    const fillFor = (bar: Bar) => {
      const key = `${bar.tone}-${bar.book % 2}`;
      let fill = fills.get(key);
      if (!fill) {
        const base = toRgb(styles.getPropertyValue(`--dw-${bar.tone}`)) ?? [107, 63, 29];
        // Neighbouring books alternate in shade, as in the Harrison–Römhild chart.
        const [r, g, b] = blend(base, lift, (dark ? 0.3 : 0) + (bar.book % 2 ? 0.2 : 0));
        fill = `rgb(${r},${g},${b})`;
        fills.set(key, fill);
      }
      return fill;
    };
    const step = width / bars.length;
    const tallest = Math.max(...bars.map((b) => b.verses));
    bars.forEach((bar, i) => {
      const h = Math.max(1, (bar.verses / tallest) * (height - 12));
      ctx.fillStyle = fillFor(bar);
      ctx.fillRect(i * step, height - h, Math.max(step, 0.75), h);
    });
    ctx.fillStyle = styles.getPropertyValue("--accent").trim() || "#765416";
    ctx.fillRect((at + 0.5) * step - 1, 0, 2, height);
  }, [width, bars, at]);

  useEffect(() => {
    closeRef.current?.querySelector(".is-current")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [at]);

  const fromPointer = (event: PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const i = Math.floor(((event.clientX - box.left) / box.width) * bars.length);
    setIndex(Math.max(0, Math.min(bars.length - 1, i)));
  };

  const onKey = (event: KeyboardEvent<HTMLCanvasElement>) => {
    let next = at;
    if (event.key === "ArrowRight") next = at + 1;
    else if (event.key === "ArrowLeft") next = at - 1;
    else if (event.key === "PageDown") {
      while (next < bars.length - 1 && bars[next].book === current.book) next += 1;
    } else if (event.key === "PageUp") {
      while (next > 0 && bars[next - 1].book === current.book) next -= 1;
      if (next === at && next > 0) {
        const previous = bars[next - 1].book;
        next -= 1;
        while (next > 0 && bars[next - 1].book === previous) next -= 1;
      }
    } else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = bars.length - 1;
    else if (event.key === "Enter") {
      event.preventDefault();
      go(hrefFor(current.id, current.chapter));
      return;
    } else return;
    event.preventDefault();
    setIndex(Math.max(0, Math.min(bars.length - 1, next)));
  };

  const from = Math.max(0, at - 14);
  const nearby = bars.slice(from, Math.min(bars.length, at + 15));
  const name = data.books[current.id].name;

  return (
    <div className="dw-strip" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="dw-strip-canvas"
        tabIndex={0}
        role="slider"
        aria-label="Every chapter in this Bible"
        aria-valuemin={1}
        aria-valuemax={bars.length}
        aria-valuenow={at + 1}
        aria-valuetext={`${name} ${current.chapter}`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          fromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons || event.pointerType === "mouse") fromPointer(event);
        }}
        onKeyDown={onKey}
      />
      <p className="dw-strip-label" aria-live="polite">
        {name} {current.chapter}{" "}
        <small>
          · {current.verses} {current.verses === 1 ? "verse" : "verses"} · {SECTIONS[current.section].name}
        </small>
      </p>
      <div className="dw-strip-close" ref={closeRef}>
        <ChapterBars
          label="Chapters near your place"
          bookMarks
          prefetch={prefetch}
          current={{ bookId: current.id, chapter: current.chapter }}
          here={here}
          onFollow={onFollow}
          chapters={nearby.map((b) => ({
            bookId: b.id,
            name: data.books[b.id].name,
            chapter: b.chapter,
            verses: b.verses,
            href: hrefFor(b.id, b.chapter),
          }))}
        />
      </div>
      <p className="dw-hint">Drag across the strip, or focus it and use the arrow keys. Page Up and Page Down move by book.</p>
    </div>
  );
}
