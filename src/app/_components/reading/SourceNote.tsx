"use client";
import { useRef, useState, type ReactNode } from "react";
import SourceNoteDialog, { type PassageRole, type ReadingReturnPlace } from "./SourceNoteDialog";
export type ReadingAnnotation = {
  role: PassageRole; title: string; href: string; sourceHref?: string;
  provenance: "edition" | "editorial" | "deterministic-match" | "ai";
  review: "unreviewed" | "reviewed" | "not-applicable";
};
export default function SourceNote({ annotation, label, children }: { annotation: ReadingAnnotation; label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const place = useRef<ReadingReturnPlace | null>(null);
  return <>
    <a className="reading-note-link" data-reading-role={annotation.role} href={annotation.href} aria-haspopup="dialog" onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault(); place.current = { control: event.currentTarget, x: scrollX, y: scrollY }; setOpen(true);
    }}>{label}</a>
    <SourceNoteDialog open={open} title={annotation.title} kind={annotation.role} returnPlace={place} onClose={() => setOpen(false)}>
      <p className="reading-role" data-reading-role={annotation.role}>{annotation.role === "source" ? "Source note" : annotation.role === "question" ? "Open question" : annotation.provenance === "edition" ? "Edition commentary" : "Editorial interpretation"}{annotation.review === "unreviewed" ? " · Unreviewed" : ""}</p>
      {annotation.provenance === "deterministic-match" && <p>Suggested text match. Similarity does not establish historical borrowing, agreement, or proof.</p>}
      {children}
      <p><a href={annotation.sourceHref ?? annotation.href} onClick={() => setOpen(false)}>Open the full source</a></p>
    </SourceNoteDialog>
  </>;
}
