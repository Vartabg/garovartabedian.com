"use client";

import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { GlossRef, GlossSegment } from "@/lib/glossary/types";

/**
 * Inline glossary term — a dotted word the reader can tap to get a short
 * explanation in place, without leaving the page.
 *
 * The card is portaled to <body> and positioned in document coordinates.
 * Host pages keep their text in `content-visibility: auto` containers
 * (verses, search hits, early-text sections, topic lists) for layout
 * performance, and containment clips or buries any popover painted inside
 * them — the card would show only a sliver inside the term's own box. A
 * portal escapes every container's containment, stacking context, and
 * overflow at once. Document coordinates (not fixed) keep the card glued
 * to the word while the page scrolls.
 */

export const KIND_LABELS: Record<GlossRef["kind"], string> = {
  person: "person",
  place: "place",
  group: "group",
  text: "text",
  office: "role",
  concept: "idea",
  event: "event",
  translation: "old wording",
  object: "object",
};

/** Opening one popover closes every other one on the page. */
const OPEN_EVENT = "gloss:open";

/** Card offset from the term, matching the old 0.55rem gap. */
function glossGap(): number {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return 0.55 * (Number.isFinite(rem) ? rem : 16);
}

export function GlossTerm({
  entry,
  children,
}: {
  entry: GlossRef;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLSpanElement>(null);
  const popId = useId();

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: popId }));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onOpen = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== popId) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      // The card lives on <body>, not inside this span — count taps on it
      // as taps on the term, or the card could never be scrolled or selected.
      if (rootRef.current?.contains(target)) return;
      if (popRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener(OPEN_EVENT, onOpen);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener(OPEN_EVENT, onOpen);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, popId]);

  // Position the portaled card: centered on the term, shifted horizontally
  // into the viewport (--gx), flipped above the term when there's no room
  // below. Runs in a layout effect so the card never paints mid-move.
  useLayoutEffect(() => {
    if (!open) return;
    const pop = popRef.current;
    const root = rootRef.current;
    if (!pop || !root) return;

    const position = () => {
      const gap = glossGap();
      const anchor = root.getBoundingClientRect();
      // Below the term first, in document coordinates (viewport rect +
      // scroll), so the card scrolls with the page like any inline element.
      pop.style.left = `${anchor.left + anchor.width / 2 + window.scrollX}px`;
      pop.style.top = `${anchor.bottom + window.scrollY + gap}px`;
      pop.style.setProperty("--gx", "0px");
      const rect = pop.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      let gx = 0;
      if (rect.left < 8) gx = 8 - rect.left;
      else if (rect.right > vw - 8) gx = -(rect.right - (vw - 8));
      if (gx) pop.style.setProperty("--gx", `${gx}px`);
      const spaceBelow = window.innerHeight - anchor.bottom;
      const flip = rect.height + 16 > spaceBelow && anchor.top > rect.height + 16;
      if (flip) {
        pop.style.top = `${anchor.top + window.scrollY - rect.height - gap}px`;
      }
      setAbove(flip);
    };

    position();
    window.addEventListener("resize", position);
    return () => window.removeEventListener("resize", position);
  }, [open]);

  return (
    <span className="gloss" ref={rootRef}>
      <button
        type="button"
        className="gloss-term"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        onClick={toggle}
      >
        {children}
      </button>
      {open &&
        createPortal(
          <span
            className={`gloss-pop${above ? " is-above" : ""}`}
            role="note"
            id={popId}
            ref={popRef}
          >
            <span className="gloss-pop-caret" aria-hidden="true" />
            <span className="gloss-pop-head">
              <strong className="gloss-pop-term">{entry.term}</strong>
              <span className="gloss-pop-kind">{KIND_LABELS[entry.kind]}</span>
            </span>
            {entry.say && <span className="gloss-pop-say">{entry.say}</span>}
            <span className="gloss-pop-def">{entry.def}</span>
          </span>,
          document.body,
        )}
    </span>
  );
}

/** Render pre-segmented prose (see segmentText) with terms made tappable. */
export function GlossSegments({ segments }: { segments: GlossSegment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        typeof seg === "string" ? (
          <Fragment key={i}>{seg}</Fragment>
        ) : (
          <GlossTerm key={i} entry={seg.entry}>
            {seg.text}
          </GlossTerm>
        ),
      )}
    </>
  );
}
