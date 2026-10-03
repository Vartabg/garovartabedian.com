"use client";
import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { captureReadingPosition, restoreReadingPosition } from "@/lib/reading-position";
export type PassageRole = "source" | "interpretation" | "question";
export type ReadingReturnPlace = { control: HTMLElement; x: number; y: number };

export default function SourceNoteDialog({ open, title, kind = "source", onClose, returnPlace, children }: {
  open: boolean; title: string; kind?: PassageRole; onClose: () => void;
  returnPlace: RefObject<ReadingReturnPlace | null>; children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null), heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open || !dialog.current) return;
    const position = captureReadingPosition();
    const place = returnPlace.current;
    const element = dialog.current, overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    heading.current?.focus({ preventScroll: true });
    return () => {
      element.close(); document.body.style.overflow = overflow;
      if (place?.control.isConnected) {
        place.control.focus({ preventScroll: true });
        if (!position || !restoreReadingPosition(position)) window.scrollTo({ left: place.x, top: place.y, behavior: "instant" });
      }
    };
  }, [open, returnPlace]);
  // Notes can originate inside paragraphs and superscripts. A dialog there would
  // make the HTML parser close the paragraph early and break hydration.
  if (!open) return null;
  return createPortal(<dialog ref={dialog} className="reading-note" data-reading-role={kind} aria-labelledby={id} onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="reading-note-head"><h2 ref={heading} id={id} tabIndex={-1}>{title}</h2><button type="button" onClick={onClose}>Return to reading <span aria-hidden="true">×</span></button></div>
    <div className="reading-note-body">{children}</div>
  </dialog>, document.body);
}
