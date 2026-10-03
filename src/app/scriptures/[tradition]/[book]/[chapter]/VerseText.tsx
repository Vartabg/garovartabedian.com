"use client";

import { segmentText, type GlossSeen } from "@/lib/glossary/segment";
import { GlossTerm } from "@/app/_components/Gloss";

/**
 * Verse text as text.
 *
 * The only interactive words are the curated glossary terms — a real
 * definition someone wrote, dotted-underlined once per chapter so the page
 * stays a page. Everything else renders as plain characters, which is what
 * makes ordinary reading work: you can select a phrase to copy it, drag to
 * scroll without opening a panel, and a 176-verse psalm stays a few hundred
 * DOM nodes instead of a few thousand.
 *
 * (The previous version wrapped every word in the chapter in its own
 * `<span data-w>` so a tap anywhere could open an occurrence-count card.
 * That cost ~2,300 spans in Psalm 119, broke text selection on phones, and
 * answered "what does this word mean?" with "it appears 77 times.")
 */
export default function VerseText({
  text,
  seen,
}: {
  text: string;
  /** One map per chapter keeps glossary underlines sparse. */
  seen?: GlossSeen;
}) {
  const segments = segmentText(text, seen);
  return (
    <>
      {segments.map((seg, i) =>
        typeof seg === "string" ? (
          seg
        ) : (
          <GlossTerm key={i} entry={seg.entry}>
            {seg.text}
          </GlossTerm>
        ),
      )}
    </>
  );
}
